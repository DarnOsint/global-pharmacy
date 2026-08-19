import Dexie, { type Table } from 'dexie';

export interface PendingMutation {
  id?: number;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  recordId: string;
  timestamp: number;
  synced: boolean;
}

export class SyncDB extends Dexie {
  pendingMutations!: Table<PendingMutation>;

  constructor() {
    super('GlobalPharmacySync');
    this.version(1).stores({
      pendingMutations: '++id, table, synced, timestamp',
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
    synced: false,
  });
}

export async function getPendingCount(): Promise<number> {
  return syncDb.pendingMutations.where('synced').equals(0).count();
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  return syncDb.pendingMutations.where('synced').equals(0).sortBy('timestamp');
}

export async function markSynced(ids: number[]) {
  await syncDb.pendingMutations.where('id').anyOf(ids).modify({ synced: true });
}

export async function clearSynced() {
  await syncDb.pendingMutations.where('synced').equals(1).delete();
}
