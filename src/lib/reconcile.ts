'use client';

import { db } from '@/lib/db';
import { syncDb } from '@/lib/sync';
import { supabase } from '@/lib/supabase';
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

export async function reconcileProducts(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabase as any;

    const localRows = (await db.products.toArray()) as Product[];
    const groups = groupBySku(localRows);
    if (groups.size === 0) return null;

    const keepBySku = new Map<string, string>();
    const localRemaps = new Map<string, string>();
    for (const [sku, rows] of groups) {
      if (rows.length <= 1) {
        keepBySku.set(sku, rows[0].id);
        continue;
      }
      const keep = pickKeep(rows);
      keepBySku.set(sku, keep);
      for (const row of rows) {
        if (row.id !== keep) localRemaps.set(row.id, keep);
      }
    }

    if (localRemaps.size > 0) {
      await remapLocalReferences(localRemaps);
      await db.products.bulkDelete([...localRemaps.keys()]);
    }

    // Align local ids with the authoritative remote rows (same sku) so every
    // device shares the same product ids.
    const { data: remoteRows } = await client
      .from('products')
      .select('id, sku, updated_at');
    if (remoteRows) {
      const remoteBySku = new Map<string, { id: string; updated_at: string | null }>();
      for (const row of remoteRows) {
        const key = String(row.sku || '').trim().toLowerCase();
        if (!key || !remoteBySku.has(key)) remoteBySku.set(key, { id: row.id, updated_at: row.updated_at });
      }

      const alignRemaps = new Map<string, string>();
      const localAfter = (await db.products.toArray()) as Product[];
      for (const row of localAfter) {
        const key = String(row.sku || '').trim().toLowerCase();
        const remote = key ? remoteBySku.get(key) : undefined;
        if (remote && remote.id !== row.id) {
          alignRemaps.set(row.id, remote.id);
        }
      }

      if (alignRemaps.size > 0) {
        const idMap = new Map(alignRemaps);
        const renamed = (await db.products.toArray()) as Product[];
        const writes: Product[] = [];
        const deletes: string[] = [];
        for (const row of renamed) {
          const target = idMap.get(row.id);
          if (target) {
            const clone = { ...row, id: target };
            writes.push(clone);
            deletes.push(row.id);
          }
        }
        await remapLocalReferences(idMap);
        if (writes.length > 0) await db.products.bulkPut(writes);
        if (deletes.length > 0) await db.products.bulkDelete(deletes);
      }

      // Deduplicate the remote copy: keep the newest row per sku, move
      // sale/item references to it, then delete the losers.
      const remoteGroups = groupBySku(remoteRows);
      for (const [sku, arr] of remoteGroups) {
        if (arr.length <= 1) continue;
        const keep = keepBySku.get(sku) || pickKeep(arr);
        const losers = arr.filter((r) => r.id !== keep);
        if (losers.length === 0) continue;
        const loserIds = losers.map((r) => r.id);
        await client.from('sale_items').update({ product_id: keep }).in('product_id', loserIds);
        await client.from('purchase_items').update({ product_id: keep }).in('product_id', loserIds);
        await client.from('products').delete().in('id', loserIds);
      }
    }

    // Push the canonical rows so a fresh remote gains the full set.
    const canonical = (await db.products.toArray()) as Product[];
    await client
      .from('products')
      .upsert(
        canonical.map((p) => ({
          id: p.id,
          name: p.name,
          generic_name: p.generic_name,
          category: p.category,
          supplier_id: p.supplier_id,
          sku: p.sku,
          product_code: p.product_code,
          barcode: p.barcode,
          unit_price: p.unit_price,
          cost_price: p.cost_price,
          currency: p.currency,
          quantity_in_stock: p.quantity_in_stock,
          reorder_level: p.reorder_level,
          alert_days: p.alert_days,
          expiry_date: p.expiry_date,
          batch_number: p.batch_number,
          manufacturer: p.manufacturer,
          description: p.description,
          image_url: p.image_url,
          is_active: p.is_active,
          updated_at: p.updated_at || new Date().toISOString(),
        })),
        { onConflict: 'id' }
      );

    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}