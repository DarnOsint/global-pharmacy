'use client';

import { db } from '@/lib/db';
import { syncDb } from '@/lib/sync';
import { SEED_PRODUCT_IDS } from '@/lib/seed-data';
import type { Product } from '@/types/database';

// Group rows by lowercase sku. Rows without a sku never collide, so they are
// left untouched.
function groupBySku(rows: { id: string; sku: string; updated_at?: string | null; created_at?: string | null }[]) {
  const groups = new Map<string, { id: string; sku: string; updated_at?: string | null; created_at?: string | null }[]>();
  for (const row of rows) {
    const key = (row.sku || '').trim().toLowerCase();
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }
  return groups;
}

function pickKeep(candidates: { id: string; updated_at?: string | null; created_at?: string | null }[]): string {
  const sorted = [...candidates].sort((a, b) => {
    const ta = a.updated_at || a.created_at || '';
    const tb = b.updated_at || b.created_at || '';
    if (ta !== tb) return tb.localeCompare(ta);
    const aSeed = SEED_PRODUCT_IDS.includes(a.id) ? 1 : 0;
    const bSeed = SEED_PRODUCT_IDS.includes(b.id) ? 1 : 0;
    if (aSeed !== bSeed) return bSeed - aSeed;
    return a.id.localeCompare(b.id);
  });
  return sorted[0].id;
}

async function remapLocalReferences(remaps: Map<string, string>): Promise<void> {
  if (remaps.size === 0) return;

  const remapField = async (table: string, field: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (db as any)[table];
    if (!store) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await store.toArray()) as any[];
    let changed = false;
    for (const row of rows) {
      const from = row[field];
      if (typeof from === 'string' && remaps.has(from)) {
        row[field] = remaps.get(from)!;
        changed = true;
      }
    }
    if (changed) await store.bulkPut(rows);
  };

  await remapField('sale_items', 'product_id');
  await remapField('purchase_items', 'product_id');

  const pending = await syncDb.pendingMutations.toArray();
  for (const mutation of pending) {
    let changed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = mutation.data as any;

    if (mutation.table === 'products' && typeof d?.id === 'string' && remaps.has(d.id)) {
      d.id = remaps.get(d.id)!;
      changed = true;
    }
    if (typeof mutation.recordId === 'string' && mutation.table === 'products' && remaps.has(mutation.recordId)) {
      mutation.recordId = remaps.get(mutation.recordId)!;
      changed = true;
    }

    const parent = d?.sale || d?.purchase;
    const items = d?.items || [];
    for (const item of items) {
      if (typeof item?.product_id === 'string' && remaps.has(item.product_id)) {
        item.product_id = remaps.get(item.product_id)!;
        changed = true;
      }
    }
    if (parent && typeof parent?.id === 'string' && remaps.has(parent.id)) {
      parent.id = remaps.get(parent.id)!;
      changed = true;
    }

    if (changed) await syncDb.pendingMutations.put(mutation);
  }
}

// Local-only: removes duplicate products (same SKU) on this device and moves their
// references to the kept row. The server enforces SKU uniqueness per location,
// so the cross-device remote cleanup this used to do is no longer needed.
export async function reconcileProducts(): Promise<string | null> {
  try {
    const localRows = (await db.products.toArray()) as Product[];
    const groups = groupBySku(localRows);
    const localRemaps = new Map<string, string>();
    for (const rows of groups.values()) {
      if (rows.length <= 1) continue;
      const keep = pickKeep(rows);
      for (const row of rows) {
        if (row.id !== keep) localRemaps.set(row.id, keep);
      }
    }

    if (localRemaps.size > 0) {
      await remapLocalReferences(localRemaps);
      await db.products.bulkDelete([...localRemaps.keys()]);
    }
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}
