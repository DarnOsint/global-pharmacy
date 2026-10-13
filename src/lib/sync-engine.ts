import { db } from '@/lib/db';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { getPendingMutations, markSynced, clearSynced, bumpAttempt, type PendingMutation } from '@/lib/sync';
import { reconcileProducts } from '@/lib/reconcile';
import { syncSettings } from '@/lib/settings-sync';
import type { SyncTableName } from '@/lib/sync-tables';

export interface SyncResult {
  pushed: number;
  pulled: number;
  error: string | null;
  online: boolean;
}

interface PullConfig {
  table: SyncTableName;
  store: string;
  tsColumn: 'updated_at' | 'created_at' | null;
  numeric: string[];
  defaults?: Record<string, unknown>;
  insertOnly?: boolean;
}

const PULL_CONFIG: PullConfig[] = [
  {
    table: 'products', store: 'products', tsColumn: 'updated_at',
    numeric: ['unit_price', 'cost_price', 'quantity_in_stock', 'reorder_level', 'alert_days'],
    defaults: { currency: 'SSP', alert_days: 30 },
  },
  { table: 'suppliers', store: 'suppliers', tsColumn: 'created_at', numeric: [] },
  { table: 'customers', store: 'customers', tsColumn: 'created_at', numeric: [] },
  {
    table: 'sales', store: 'sales', tsColumn: 'created_at',
    numeric: ['subtotal', 'discount', 'tax', 'total'],
    defaults: { currency: 'SSP' },
    insertOnly: true,
  },
  {
    table: 'sale_items', store: 'saleItems', tsColumn: null,
    numeric: ['quantity', 'unit_price', 'discount', 'total'],
    insertOnly: true,
  },
  {
    table: 'purchases', store: 'purchases', tsColumn: 'created_at',
    numeric: ['subtotal', 'tax', 'total'],
    defaults: { currency: 'SSP' },
    insertOnly: true,
  },
  {
    table: 'purchase_items', store: 'purchaseItems', tsColumn: null,
    numeric: ['quantity', 'unit_cost', 'total'],
    insertOnly: true,
  },
  {
    table: 'expenses', store: 'expenses', tsColumn: 'created_at',
    numeric: ['amount'],
    defaults: { currency: 'SSP' },
  },
  { table: 'staff', store: 'staff', tsColumn: 'updated_at', numeric: ['salary'] },
  {
    table: 'payroll', store: 'payroll', tsColumn: 'created_at',
    numeric: ['base_salary', 'allowances', 'deductions', 'net_pay'],
  },
  {
    table: 'budgets', store: 'budgets', tsColumn: 'created_at',
    numeric: ['amount', 'spent'],
    defaults: { currency: 'SSP' },
  },
  { table: 'auditLogs', store: 'auditLogs', tsColumn: 'created_at', numeric: [], insertOnly: true },
];

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

function sessionAware(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return 'your session has expired. Connect and sign in again to sync.';
  }
  return errorMessage(error);
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
    const res = await fetch('/api/health', { cache: 'no-store' });
    return res.ok;
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

// Only the server rejecting a record (validation, permissions, conflicts) counts
// as a failed attempt. Network problems and an expired session leave the change
// queued, so it is sent on the next sync and never marked failed.
function isRecordRejection(e: unknown): boolean {
  return e instanceof ApiError && [400, 403, 404, 409].includes(e.status);
}

async function pushMutation(mutation: PendingMutation): Promise<{ ok: true } | { ok: false; error: string; rejected: boolean }> {
  try {
    const row = mutation.operation === 'delete'
      ? undefined
      : (await readLocalRow(mutation.table, mutation.recordId)) ?? undefined;
    await apiFetch('/api/sync/push', {
      method: 'POST',
      body: JSON.stringify({
        table: mutation.table,
        operation: mutation.operation,
        recordId: mutation.recordId,
        row,
        data: mutation.data,
      }),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e), rejected: isRecordRejection(e) };
  }
}

export async function pushPendingMutations(): Promise<number> {
  const mutations = await getPendingMutations();
  if (mutations.length === 0) return 0;

  const pushedIds: number[] = [];
  let stopped: unknown = null;
  for (const mutation of mutations) {
    const result = await pushMutation(mutation);
    if (result.ok) {
      pushedIds.push(mutation.id!);
    } else if (result.rejected) {
      if (mutation.id) await bumpAttempt(mutation.id, result.error);
    } else {
      stopped = result.error;
      break;
    }
  }

  if (pushedIds.length > 0) {
    await markSynced(pushedIds);
    await clearSynced();
  }
  if (stopped) throw new Error(String(stopped));
  return pushedIds.length;
}

async function signedInStaffMatches(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (!user) return false;
  try {
    const me = await apiFetch<{ staffId: string }>('/api/auth/me');
    return me.staffId === user.id;
  } catch {
    return false;
  }
}

export async function pullFromSupabase(): Promise<number> {
  const pending = await getPendingMutations();
  const pendingRecordIds = new Set(pending.map((m) => m.recordId));
  let pulled = 0;

  for (const config of PULL_CONFIG) {
    let data: Record<string, unknown>[];
    try {
      data = await apiFetch<Record<string, unknown>[]>(`/api/sync/pull?table=${config.table}`);
    } catch (e) {
      // Session problems must stop the sync; a role without access to a table is skipped.
      if (e instanceof ApiError && e.status === 401) throw e;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (db as any)[config.store];
    if (!store) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const localRows = (await store.toArray()) as any[];
    const localMap = new Map<string, Record<string, unknown>>(localRows.map((r) => [r.id, r]));

    const toUpsert: Record<string, unknown>[] = [];
    for (const raw of data) {
      const id = raw.id as string;
      if (!id || pendingRecordIds.has(id)) continue;

      const row = normalizeRow(config, raw);
      const existing = localMap.get(id);

      // Sales, line items and audit entries are insert-only on this device:
      // a record created here is never overwritten by a copy from the server.
      if (config.insertOnly) {
        if (!existing) toUpsert.push(row);
      } else {
        toUpsert.push(row);
      }
    }

    if (toUpsert.length > 0) {
      await store.bulkPut(toUpsert);
      pulled += toUpsert.length;
    }
  }
  return pulled;
}

export async function runSync(): Promise<SyncResult> {
  const online = await checkConnection();
  if (!online || !useAuthStore.getState().user) {
    return { pushed: 0, pulled: 0, error: null, online: false };
  }
  if (!(await signedInStaffMatches())) {
    return {
      pushed: 0,
      pulled: 0,
      error: 'Sign in online with this account to sync this device.',
      online: true,
    };
  }

  let pushed = 0;
  let pulled = 0;
  let error: string | null = null;

  try {
    pushed = await pushPendingMutations();
  } catch (e) {
    error = `Push failed: ${sessionAware(e)}`;
  }

  try {
    pulled = await pullFromSupabase();
  } catch (e) {
    const pullError = `Pull failed: ${sessionAware(e)}`;
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
