import { supabase } from '@/lib/supabase';
import { db } from '@/lib/db';
import { getPendingMutations, markSynced, clearSynced, bumpAttempt, type PendingMutation } from '@/lib/sync';
import { reconcileProducts } from '@/lib/reconcile';
import { syncSettings } from '@/lib/settings-sync';

export interface SyncResult {
  pushed: number;
  pulled: number;
  error: string | null;
  online: boolean;
}

type TableName =
  | 'products' | 'suppliers' | 'customers' | 'sales' | 'sale_items'
  | 'purchases' | 'purchase_items' | 'expenses' | 'staff' | 'payroll' | 'budgets';

interface PullConfig {
  table: TableName;
  remoteName: string;
  tsColumn: 'updated_at' | 'created_at' | null;
  numeric: string[];
  defaults?: Record<string, unknown>;
}

const PULL_CONFIG: Record<TableName, PullConfig> = {
  products: {
    table: 'products', remoteName: 'products', tsColumn: 'updated_at',
    numeric: ['unit_price', 'cost_price', 'quantity_in_stock', 'reorder_level', 'alert_days'],
    defaults: { currency: 'SSP', alert_days: 30 },
  },
  suppliers: {
    table: 'suppliers', remoteName: 'suppliers', tsColumn: 'created_at', numeric: [],
  },
  customers: {
    table: 'customers', remoteName: 'customers', tsColumn: 'created_at', numeric: [],
  },
  sales: {
    table: 'sales', remoteName: 'sales', tsColumn: 'created_at',
    numeric: ['subtotal', 'discount', 'tax', 'total'],
    defaults: { currency: 'SSP' },
  },
  purchases: {
    table: 'purchases', remoteName: 'purchases', tsColumn: 'created_at',
    numeric: ['subtotal', 'tax', 'total'],
    defaults: { currency: 'SSP' },
  },
  expenses: {
    table: 'expenses', remoteName: 'expenses', tsColumn: 'created_at',
    numeric: ['amount'],
    defaults: { currency: 'SSP' },
  },
  staff: {
    table: 'staff', remoteName: 'staff', tsColumn: 'created_at', numeric: ['salary'],
  },
  payroll: {
    table: 'payroll', remoteName: 'payroll', tsColumn: 'created_at',
    numeric: ['base_salary', 'allowances', 'deductions', 'net_pay'],
  },
  budgets: {
    table: 'budgets', remoteName: 'budgets', tsColumn: 'created_at',
    numeric: ['amount', 'spent'],
    defaults: { currency: 'SSP' },
  },
  sale_items: {
    table: 'sale_items', remoteName: 'sale_items', tsColumn: null,
    numeric: ['quantity', 'unit_price', 'discount', 'total'],
  },
  purchase_items: {
    table: 'purchase_items', remoteName: 'purchase_items', tsColumn: null,
    numeric: ['quantity', 'unit_cost', 'total'],
  },
};

function normalizeRow(config: PullConfig, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...config.defaults };
  for (const [key, value] of Object.entries(row)) {
    if (value === null) {
      out[key] = null;
    } else if (config.numeric.includes(key)) {
      out[key] = typeof value === 'string' ? Number(value) : value;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function getRowTs(row: Record<string, unknown>, config: PullConfig): string {
  const col = config.tsColumn;
  if (!col) return '';
  const value = row[col];
  return typeof value === 'string' ? value : '';
}

function errorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error);
}

export async function checkConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false;
  try {
    const { error } = await supabase.from('products').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

async function readLocalRow(table: string, id: string): Promise<Record<string, unknown> | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store = (db as any)[table];
  if (!store) return null;
  const row = await store.get(id);
  return row || null;
}

async function pushLegacyComposite(mutation: PendingMutation): Promise<{ ok: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = mutation.data as any;
  if (mutation.table === 'sales' && data?.sale) {
    const sale = data.sale as Record<string, unknown>;
    const upsertSale = { ...sale } as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data.items || []) as any[];
    const upsertItems = items.map((item) => ({ ...item, sale_id: sale.id }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r1 = await (supabase.from('sales') as any).upsert(upsertSale, { onConflict: 'id' });
      if (r1.error) return { ok: false, error: errorMessage(r1.error) };
      if (upsertItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r2 = await (supabase.from('sale_items') as any).upsert(upsertItems, { onConflict: 'id' });
        if (r2.error) return { ok: false, error: errorMessage(r2.error) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  }
  if (mutation.table === 'purchases' && data?.purchase) {
    const purchase = data.purchase as Record<string, unknown>;
    const upsertPurchase = { ...purchase } as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data.items || []) as any[];
    const upsertItems = items.map((item) => ({ ...item, purchase_id: purchase.id }));
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r1 = await (supabase.from('purchases') as any).upsert(upsertPurchase, { onConflict: 'id' });
      if (r1.error) return { ok: false, error: errorMessage(r1.error) };
      if (upsertItems.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r2 = await (supabase.from('purchase_items') as any).upsert(upsertItems, { onConflict: 'id' });
        if (r2.error) return { ok: false, error: errorMessage(r2.error) };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e) };
    }
  }
  return { ok: false, error: 'Unknown mutation payload' };
}

async function pushMutation(mutation: PendingMutation): Promise<{ ok: boolean; error?: string }> {
  try {
    if ((mutation.table === 'sales' || mutation.table === 'purchases')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = mutation.data as any;
      if (d?.sale || d?.purchase) {
        return pushLegacyComposite(mutation);
      }
    }

    const { table, operation } = mutation;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fromTable = supabase.from(table as any);

    switch (operation) {
      case 'create': {
        const data = mutation.data as Record<string, unknown>;
        const localRow = await readLocalRow(table, mutation.recordId);
        const row = localRow || data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (fromTable as any).upsert(row, { onConflict: 'id' });
        return error ? { ok: false, error: errorMessage(error) } : { ok: true };
      }
      case 'update': {
        const localRow = await readLocalRow(table, mutation.recordId);
        const d = mutation.data as Record<string, unknown>;
        const id = (localRow?.id as string) || (d.id as string);
        // Upsert the full local row so we also create the record remotely if it
        // does not exist yet (e.g. a stock edit on a product that never synced).
        const row = localRow;
        if (row) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (fromTable as any).upsert(row, { onConflict: 'id' });
          return error ? { ok: false, error: errorMessage(error) } : { ok: true };
        }
        const updates = { ...d };
        delete updates.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (fromTable as any).update(updates).eq('id', id);
        return error ? { ok: false, error: errorMessage(error) } : { ok: true };
      }
      case 'delete': {
        const d = mutation.data as Record<string, unknown>;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (fromTable as any).delete().eq('id', d.id);
        return error ? { ok: false, error: errorMessage(error) } : { ok: true };
      }
      default:
        return { ok: false, error: 'Unknown operation' };
    }
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

export async function pushPendingMutations(): Promise<number> {
  const mutations = await getPendingMutations();
  if (mutations.length === 0) return 0;

  const pushedIds: number[] = [];
  for (const mutation of mutations) {
    const result = await pushMutation(mutation);
    if (result.ok) {
      pushedIds.push(mutation.id!);
    } else if (mutation.id) {
      await bumpAttempt(mutation.id, result.error);
    }
  }

  if (pushedIds.length > 0) {
    await markSynced(pushedIds);
    await clearSynced();
  }
  return pushedIds.length;
}

export async function pullFromSupabase(): Promise<number> {
  const pending = await getPendingMutations();
  const pendingRecordIds = new Set(pending.map((m) => m.recordId));
  let pulled = 0;

  for (const config of Object.values(PULL_CONFIG)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(config.remoteName) as any).select('*');
      if (error) continue;
      if (!data) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (db as any)[config.table];
      if (!store) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const localRows = (await store.toArray()) as any[];
      const localMap = new Map<string, Record<string, unknown>>(localRows.map((r) => [r.id, r]));

      const toUpsert: Record<string, unknown>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const raw of data as any[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = raw.id as any;
        if (!id || pendingRecordIds.has(id)) continue;

        const row = normalizeRow(config, raw);
        const existing = localMap.get(id);
        if (!existing) {
          toUpsert.push(row);
          continue;
        }

        if (config.tsColumn === null) {
          continue;
        }

        const remoteTs = getRowTs(raw, config);
        const localTsValue = existing[config.tsColumn];
        const localTs = typeof localTsValue === 'string' ? localTsValue : '';
        if (remoteTs && remoteTs > localTs) {
          toUpsert.push(row);
        }
      }

      if (toUpsert.length > 0) {
        await store.bulkPut(toUpsert);
        pulled += toUpsert.length;
      }
    } catch {
      continue;
    }
  }
  return pulled;
}

export async function runSync(): Promise<SyncResult> {
  const online = await checkConnection();
  if (!online) {
    return { pushed: 0, pulled: 0, error: null, online: false };
  }

  let pushed = 0;
  let pulled = 0;
  let error: string | null = null;

  try {
    pushed = await pushPendingMutations();
  } catch (e) {
    error = `Push failed: ${errorMessage(e)}`;
  }

  try {
    pulled = await pullFromSupabase();
  } catch (e) {
    const pullError = `Pull failed: ${errorMessage(e)}`;
    error = error ? `${error}; ${pullError}` : pullError;
  }

  try {
    const reconcileError = await reconcileProducts();
    if (reconcileError && !error) error = `Reconcile failed: ${reconcileError}`;
  } catch (e) {
    const recError = `Reconcile failed: ${errorMessage(e)}`;
    error = error ? `${error}; ${recError}` : recError;
  }

  try {
    const settingsError = await syncSettings();
    if (settingsError && !error) error = `Settings sync failed: ${settingsError}`;
  } catch (e) {
    const setError = `Settings sync failed: ${errorMessage(e)}`;
    error = error ? `${error}; ${setError}` : setError;
  }

  return { pushed, pulled, error, online: true };
}