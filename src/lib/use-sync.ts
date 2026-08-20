'use client';

import { useState, useEffect, useCallback } from 'react';
import { getPendingCount, getPendingMutations, markSynced, clearSynced, type PendingMutation } from '@/lib/sync';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

async function syncMutationToSupabase(mutation: PendingMutation): Promise<boolean> {
  try {
    const { table, operation, data } = mutation;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromTable = supabase.from(table as any);

    switch (operation) {
      case 'create': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (fromTable as any).upsert(data, { onConflict: 'id' });
        return !error;
      }
      case 'update': {
        const d = data as Record<string, unknown>;
        const id = d.id;
        const { id: _, ...updates } = d;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (fromTable as any).update(updates).eq('id', id);
        return !error;
      }
      case 'delete': {
        const d = data as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (fromTable as any).delete().eq('id', d.id);
        return !error;
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

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

      const syncedIds: number[] = [];
      for (const mutation of mutations) {
        const success = await syncMutationToSupabase(mutation);
        if (success) syncedIds.push(mutation.id!);
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

    const interval = setInterval(refreshCount, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [setIsOnline, refreshCount, syncNow]);

  return { pendingCount, syncing, syncNow, refreshCount };
}
