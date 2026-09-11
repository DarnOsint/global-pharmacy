'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getPendingCount, getFailedCount } from '@/lib/sync';
import { runSync, checkConnection, type SyncResult } from '@/lib/sync-engine';
import { useAppStore } from '@/lib/store';

let inFlight: Promise<SyncResult | null> | null = null;
let instances = 0;
let driverActive = false;

export function useSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const { setIsOnline, setPendingSync } = useAppStore();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshCount = useCallback(async () => {
    const [pending, failed] = await Promise.all([getPendingCount(), getFailedCount()]);
    setPendingCount(pending);
    setFailedCount(failed);
    setPendingSync(pending);
  }, [setPendingSync]);

  const syncNow = useCallback(async (): Promise<SyncResult | null> => {
    if (inFlight) return inFlight;
    setSyncing(true);
    inFlight = (async () => {
      try {
        const online = await checkConnection();
        setIsOnline(online);
        if (online) {
          const result = await runSync();
          setLastSyncError(result.error);
          return result;
        }
        return { pushed: 0, pulled: 0, error: null, online: false } as SyncResult;
      } finally {
        inFlight = null;
        setSyncing(false);
        await refreshCount();
      }
    })();
    return inFlight;
  }, [setIsOnline, refreshCount]);

  useEffect(() => {
    instances += 1;
    const isDriver = !driverActive && instances === 1;
    if (isDriver) driverActive = true;

    let cancelled = false;

    if (isDriver) {
      const initial = async () => {
        if (!cancelled) await refreshCount();
        if (!cancelled) await syncNow();
      };
      initial();

      const onPending = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          void syncNow();
        }, 1500);
      };
      const onOnline = () => {
        void syncNow();
      };
      const onOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener('mutation-queued', onPending);
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      const interval = setInterval(() => {
        refreshCount();
        void syncNow();
      }, 30000);

      return () => {
        cancelled = true;
        window.removeEventListener('mutation-queued', onPending);
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        clearInterval(interval);
        instances = Math.max(0, instances - 1);
        if (isDriver) driverActive = false;
      };
    }

    return () => {
      cancelled = true;
      instances = Math.max(0, instances - 1);
      if (isDriver) driverActive = false;
    };
  }, [syncNow, refreshCount, setIsOnline]);

  return { pendingCount, failedCount, syncing, syncNow, refreshCount, lastSyncError };
}