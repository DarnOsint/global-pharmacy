import Dexie, { type Table } from 'dexie';

export interface PendingMutation {
  id?: number;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  recordId: string;
  timestamp: number;
  synced: 0 | 1;
  attempts?: number;
  error?: string;
  failed?: boolean;
}

export class SyncDB extends Dexie {
  pendingMutations!: Table<PendingMutation>;

  constructor() {
    super('GlobalPharmacySync');
    this.version(1).stores({
      pendingMutations: '++id, table, recordId, synced, failed, timestamp',
    });
  }
}

export const syncDb = new SyncDB();

export async function queueMutation(table: string, operation: 'create' | 'update' | 'delete', data: unknown, recordId: string) {
  await syncDb.pendingMutations.add({
    table,
    operation,
    data,
    recordId,
    timestamp: Date.now(),
    synced: 0,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mutation-queued'));
  }
}

export async function getPendingCount(): Promise<number> {
  return syncDb.pendingMutations.where('synced').equals(0).filter((m) => !m.failed).count();
}

export async function getFailedCount(): Promise<number> {
  return syncDb.pendingMutations.where('synced').equals(0).filter((m) => m.failed === true).count();
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return syncDb.pendingMutations.where('synced').equals(0).filter((m) => !m.failed).sortBy('timestamp');
}

export async function markSynced(ids: number[]) {
  await syncDb.pendingMutations.where('id').anyOf(ids).modify({ synced: 1 });
}

export async function clearSynced() {
  await syncDb.pendingMutations.where('synced').equals(1).delete();
}

export async function bumpAttempt(id: number, error?: string) {
  const mutation = await syncDb.pendingMutations.get(id);
  if (!mutation) return;
  const attempts = (mutation.attempts || 0) + 1;
  await syncDb.pendingMutations.update(id, {
    attempts,
    error: error || mutation.error,
    failed: attempts >= 8,
  });
}

export async function clearFailed() {
  await syncDb.pendingMutations.where('synced').equals(0).filter((m) => m.failed === true).delete();
}