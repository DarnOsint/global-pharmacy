'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, getPendingMutations, markSynced, clearSynced } from '@/lib/sync';
import { useAppStore } from '@/lib/store';

export function useSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { setIsOnline, setPendingSync } = useAppStore();

  const refreshCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
    setPendingSync(count);
  }, [setPendingSync]);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try {
      const mutations = await getPendingMutations();
      if (mutations.length === 0) { setSyncing(false); return; }

      // Group by table for batch processing
      const grouped = mutations.reduce((acc, m) => {
        if (!acc[m.table]) acc[m.table] = [];
        acc[m.table].push(m);
        return acc;
      }, {} as Record<string, typeof mutations>);

      // Attempt sync for each mutation
      const syncedIds: number[] = [];
      for (const mutation of mutations) {
        try {
          // In a real app, this would call the Supabase API
          // For now we mark as synced since Supabase is the source of truth
          // and we're using mock data
          syncedIds.push(mutation.id!);
        } catch {
          // If sync fails, skip this mutation
        }
      }

      if (syncedIds.length > 0) {
        await markSynced(syncedIds);
        await clearSynced();
      }
      await refreshCount();
    } finally {
      setSyncing(false);
    }
  }, [syncing, refreshCount]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); syncNow(); };
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    refreshCount();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending mutations every 30s
    const interval = setInterval(refreshCount, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [setIsOnline, refreshCount, syncNow]);

  return { pendingCount, syncing, syncNow, refreshCount };
}
