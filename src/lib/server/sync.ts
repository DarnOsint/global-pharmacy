import type { SupabaseClient } from '@supabase/supabase-js';
import { adminDb } from '@/lib/server/admin-db';
import { HttpError, requireRole, type Session } from '@/lib/server/session';
import { isSyncTable, OWNER_ROLES, SYNC_TABLES, type SyncTableName } from '@/lib/sync-tables';

const PAGE_SIZE = 1000;

// Foreign keys that must point at a row in the same location. Without this a
// sale line could reference another site's product, or a supplier could be linked
// across sites.
const SAME_LOCATION_REFS: Partial<Record<SyncTableName, { field: string; table: SyncTableName }[]>> = {
  sale_items: [{ field: 'sale_id', table: 'sales' }, { field: 'product_id', table: 'products' }],
  purchase_items: [{ field: 'purchase_id', table: 'purchases' }, { field: 'product_id', table: 'products' }],
  purchases: [{ field: 'supplier_id', table: 'suppliers' }],
  products: [{ field: 'supplier_id', table: 'suppliers' }],
};

// Tables that record which staff member performed the change.
const ACTOR_FIELD: Partial<Record<SyncTableName, string>> = {
  sales: 'user_id',
  purchases: 'user_id',
  expenses: 'user_id',
  auditLogs: 'staff_id',
};

async function assertSameLocation(
  db: SupabaseClient,
  table: SyncTableName,
  id: string,
  locationId: string
): Promise<void> {
  const policy = SYNC_TABLES[table];
  if (!policy.scoped) return;
  const { data, error } = await db.from(policy.remote).select('location_id').eq('id', id).maybeSingle();
  if (error) throw new HttpError(400, error.message);
  if (data && data.location_id !== locationId) {
    throw new HttpError(403, `${policy.remote} record belongs to another location`);
  }
}

async function assertReferences(
  db: SupabaseClient,
  table: SyncTableName,
  row: Record<string, unknown>,
  locationId: string
): Promise<void> {
  for (const ref of SAME_LOCATION_REFS[table] ?? []) {
    const value = row[ref.field];
    if (typeof value === 'string' && value) {
      const policy = SYNC_TABLES[ref.table];
      const { data, error } = await db
        .from(policy.remote)
        .select('location_id')
        .eq('id', value)
        .maybeSingle();
      if (error) throw new HttpError(400, error.message);
      if (data && policy.scoped && data.location_id !== locationId) {
        throw new HttpError(403, `${ref.field} points at another location`);
      }
    }
  }
}

async function upsertRow(
  db: SupabaseClient,
  table: SyncTableName,
  input: Record<string, unknown>,
  session: Session
): Promise<void> {
  const policy = SYNC_TABLES[table];
  const locationId = session.activeLocation.id;
  const row = { ...input };
  const id = row.id;
  if (typeof id !== 'string' || !id) throw new HttpError(400, 'Missing record id');

  await assertSameLocation(db, table, id, locationId);
  await assertReferences(db, table, row, locationId);

  if (policy.scoped) row.location_id = locationId;

  const actorField = ACTOR_FIELD[table];
  if (actorField) {
    const { data } = await db.from(policy.remote).select(actorField).eq('id', id).maybeSingle();
    const recorded = (data as Record<string, unknown> | null)?.[actorField];
    row[actorField] = recorded ?? session.staffId;
  }

  const { error } = await db.from(policy.remote).upsert(row, { onConflict: 'id' });
  if (error) throw new HttpError(400, error.message);
}

async function pushComposite(
  db: SupabaseClient,
  table: 'sales' | 'purchases',
  data: Record<string, unknown>,
  session: Session
): Promise<void> {
  const parent = (table === 'sales' ? data.sale : data.purchase) as Record<string, unknown>;
  const items = (data.items ?? []) as Record<string, unknown>[];
  const childTable = table === 'sales' ? 'sale_items' : 'purchase_items';
  const foreignKey = table === 'sales' ? 'sale_id' : 'purchase_id';

  await upsertRow(db, table, parent, session);
  for (const item of items) {
    await upsertRow(db, childTable, { ...item, [foreignKey]: parent.id }, session);
  }
}

export async function pushMutation(session: Session, body: {
  table?: unknown;
  operation?: unknown;
  recordId?: unknown;
  row?: unknown;
  data?: unknown;
}): Promise<void> {
  const table = typeof body.table === 'string' ? body.table : '';
  if (!isSyncTable(table)) throw new HttpError(400, 'Unknown table');
  const name: SyncTableName = table;
  const policy = SYNC_TABLES[name];
  requireRole(session.role, policy.write);

  const db = adminDb();
  const locationId = session.activeLocation.id;
  const data = (body.data ?? {}) as Record<string, unknown>;

  if ((name === 'sales' || name === 'purchases') && (data.sale || data.purchase)) {
    await pushComposite(db, name, data, session);
    return;
  }

  const recordId = typeof body.recordId === 'string' ? body.recordId : '';

  if (body.operation === 'delete') {
    const id = (data.id as string) || recordId;
    if (!id) throw new HttpError(400, 'Missing record id');
    let query = db.from(policy.remote).delete().eq('id', id);
    if (policy.scoped) query = query.eq('location_id', locationId);
    const { error } = await query;
    if (error) throw new HttpError(400, error.message);
    return;
  }

  if (body.row && typeof body.row === 'object') {
    await upsertRow(db, name, { ...(body.row as Record<string, unknown>), id: recordId || (body.row as { id?: string }).id }, session);
    return;
  }

  // Update without a local copy: patch only the fields that were sent.
  const updates = { ...data };
  delete updates.id;
  delete updates.location_id;
  if (!recordId) throw new HttpError(400, 'Missing record id');
  await assertSameLocation(db, name, recordId, locationId);
  let query = db.from(policy.remote).update(updates).eq('id', recordId);
  if (policy.scoped) query = query.eq('location_id', locationId);
  const { error } = await query;
  if (error) throw new HttpError(400, error.message);
}

export async function pullTable(session: Session, name: SyncTableName): Promise<Record<string, unknown>[]> {
  const policy = SYNC_TABLES[name];
  requireRole(session.role, policy.read);
  const db = adminDb();
  const locationId = session.activeLocation.id;

  let allowedStaffIds: string[] | null = null;
  if (name === 'staff' && !OWNER_ROLES.includes(session.role)) {
    const { data: members, error } = await db
      .from('staff_locations')
      .select('staff_id')
      .eq('location_id', locationId);
    if (error) throw new HttpError(500, error.message);
    const { data: owners, error: ownerError } = await db
      .from('staff')
      .select('id')
      .in('role', [...OWNER_ROLES]);
    if (ownerError) throw new HttpError(500, ownerError.message);
    allowedStaffIds = [
      ...(members ?? []).map((m) => m.staff_id as string),
      ...(owners ?? []).map((o) => o.id as string),
    ];
  }

  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = db.from(policy.remote).select('*').order('id').range(from, from + PAGE_SIZE - 1);
    if (policy.scoped) query = query.eq('location_id', locationId);
    if (allowedStaffIds) {
      if (allowedStaffIds.length === 0) return [];
      query = query.in('id', allowedStaffIds);
    }
    const { data, error } = await query;
    if (error) throw new HttpError(500, error.message);
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}
