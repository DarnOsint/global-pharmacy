import { v5 as uuidv5 } from 'uuid';
import { db } from '@/lib/db';
import { syncDb } from '@/lib/sync';
import type { Currency } from '@/lib/utils';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ADMIN_STAFF_ID = 'a0000000-0000-0000-0000-000000000001';

const LEGACY_NS = 'a0000000-0000-4000-8000-0000000000aa';

// Stable name-based UUID so every device maps the same legacy short id
// (e.g. "p1") to the SAME uuid. Random uuids per device caused duplicate
// rows to accumulate on different machines.
export function deterministicLegacyUuid(legacyId: string): string {
  return uuidv5(`global-pharmacy:${legacyId}`, LEGACY_NS);
}

const P1 = '00000000-0000-4000-8000-000000000001';
const P2 = '00000000-0000-4000-8000-000000000002';
const P3 = '00000000-0000-4000-8000-000000000003';
const P4 = '00000000-0000-4000-8000-000000000004';
const P5 = '00000000-0000-4000-8000-000000000005';
const P6 = '00000000-0000-4000-8000-000000000006';
const P7 = '00000000-0000-4000-8000-000000000007';
const P8 = '00000000-0000-4000-8000-000000000008';

// Canonical deterministic product ids used by the seed set. Used by the
// reconciliation pass to prefer the canonical copy when deduplicating.
export const SEED_PRODUCT_IDS = [P1, P2, P3, P4, P5, P6, P7, P8];

const SUP1 = '10000000-0000-4000-8000-000000000001';
const SUP2 = '10000000-0000-4000-8000-000000000002';
const SUP3 = '10000000-0000-4000-8000-000000000003';
const SUP4 = '10000000-0000-4000-8000-000000000004';
const SUP5 = '10000000-0000-4000-8000-000000000005';

const C1 = '20000000-0000-4000-8000-000000000001';
const C2 = '20000000-0000-4000-8000-000000000002';
const C3 = '20000000-0000-4000-8000-000000000003';
const C4 = '20000000-0000-4000-8000-000000000004';
const C5 = '20000000-0000-4000-8000-000000000005';
const C6 = '20000000-0000-4000-8000-000000000006';

const S1 = '30000000-0000-4000-8000-000000000001';
const S2 = '30000000-0000-4000-8000-000000000002';
const S3 = '30000000-0000-4000-8000-000000000003';
const S4 = '30000000-0000-4000-8000-000000000004';
const S5 = '30000000-0000-4000-8000-000000000005';
const S6 = '30000000-0000-4000-8000-000000000006';

const PU1 = '40000000-0000-4000-8000-000000000001';
const PU2 = '40000000-0000-4000-8000-000000000002';
const PU3 = '40000000-0000-4000-8000-000000000003';
const PU4 = '40000000-0000-4000-8000-000000000004';
const PU5 = '40000000-0000-4000-8000-000000000005';

const E1 = '50000000-0000-4000-8000-000000000001';
const E2 = '50000000-0000-4000-8000-000000000002';
const E3 = '50000000-0000-4000-8000-000000000003';
const E4 = '50000000-0000-4000-8000-000000000004';
const E5 = '50000000-0000-4000-8000-000000000005';
const E6 = '50000000-0000-4000-8000-000000000006';

// ─── Legacy short-ID migration ────────────────────────────
// Older installs seeded demo rows with ids like 'p1', 'sup1', 's1'.
// Supabase primary keys are UUIDs, so those rows can never sync. This
// remaps every non-UUID id to a fresh UUID and rewrites references and
// queued mutations once per browser, so existing data starts syncing too.
export async function migrateLegacyIds() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('gp-legacy-migrated') === '1') return;

  const maps: Record<string, Record<string, string>> = {};
  const idTables = ['products', 'suppliers', 'customers', 'sales', 'purchases', 'expenses', 'payroll', 'staff'];

  for (const table of idTables) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (db as any)[table];
    if (!store) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await store.toArray()) as any[];
    const map: Record<string, string> = {};
    let changed = false;
    for (const row of rows) {
      if (typeof row.id === 'string' && !UUID_RE.test(row.id) && !map[row.id]) {
        map[row.id] = deterministicLegacyUuid(`${table}:${row.id}`);
        row.id = map[row.id];
        changed = true;
      }
    }
    if (changed) {
      maps[table] = map;
      await store.bulkPut(rows);
    }
  }

  if (Object.keys(maps).length > 0) {
    const remapField = async (rowTable: string, field: string, sourceTable: string) => {
      const map = maps[sourceTable];
      if (!map) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (db as any)[rowTable];
      if (!store) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (await store.toArray()) as any[];
      let changed = false;
      for (const row of rows) {
        const value = row[field];
        if (typeof value === 'string' && map[value]) {
          row[field] = map[value];
          changed = true;
        }
      }
      if (changed) await store.bulkPut(rows);
    };

    await remapField('products', 'supplier_id', 'suppliers');
    await remapField('sales', 'customer_id', 'customers');
    await remapField('purchases', 'supplier_id', 'suppliers');
    await remapField('payroll', 'staff_id', 'staff');
    await remapField('sale_items', 'sale_id', 'sales');
    await remapField('sale_items', 'product_id', 'products');
    await remapField('purchase_items', 'purchase_id', 'purchases');
    await remapField('purchase_items', 'product_id', 'products');

    for (const table of ['sales', 'purchases', 'expenses']) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const store = (db as any)[table];
      if (!store) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (await store.toArray()) as any[];
      let changed = false;
      for (const row of rows) {
        if (row.user_id === 'u1' || (typeof row.user_id === 'string' && !UUID_RE.test(row.user_id))) {
          row.user_id = ADMIN_STAFF_ID;
          changed = true;
        }
      }
      if (changed) await store.bulkPut(rows);
    }

    const pending = await syncDb.pendingMutations.toArray();
    for (const mutation of pending) {
      let mutated = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = mutation.data as any;

      if (d && typeof d.id === 'string') {
        const map = maps[mutation.table];
        if (map && map[d.id]) {
          d.id = map[d.id];
          mutated = true;
        }
        if (d.user_id === 'u1' && (mutation.table === 'sales' || mutation.table === 'purchases' || mutation.table === 'expenses')) {
          d.user_id = ADMIN_STAFF_ID;
          mutated = true;
        }
        if (mutation.table === 'products' && typeof d.supplier_id === 'string') {
          const sm = maps['suppliers'];
          if (sm && sm[d.supplier_id]) { d.supplier_id = sm[d.supplier_id]; mutated = true; }
        }
        if (mutation.table === 'sales' && typeof d.customer_id === 'string') {
          const cm = maps['customers'];
          if (cm && cm[d.customer_id]) { d.customer_id = cm[d.customer_id]; mutated = true; }
        }
        if (mutation.table === 'purchases' && typeof d.supplier_id === 'string') {
          const sm2 = maps['suppliers'];
          if (sm2 && sm2[d.supplier_id]) { d.supplier_id = sm2[d.supplier_id]; mutated = true; }
        }
      }

      if (d && (d.sale || d.purchase)) {
        const parent = d.sale || d.purchase;
        const parentMap = maps[mutation.table];
        if (parent && typeof parent.id === 'string' && parentMap && parentMap[parent.id]) {
          parent.id = parentMap[parent.id];
          mutated = true;
        }
        if (parent && parent.user_id === 'u1') {
          parent.user_id = ADMIN_STAFF_ID;
          mutated = true;
        }
        const items = d.items || [];
        const productMap = maps['products'];
        for (const item of items) {
          if (productMap && typeof item.product_id === 'string' && productMap[item.product_id]) {
            item.product_id = productMap[item.product_id];
            mutated = true;
          }
          if (parentMap) {
            if (typeof item.sale_id === 'string' && parentMap[item.sale_id]) { item.sale_id = parentMap[item.sale_id]; mutated = true; }
            if (typeof item.purchase_id === 'string' && parentMap[item.purchase_id]) { item.purchase_id = parentMap[item.purchase_id]; mutated = true; }
          }
        }
      }

      if (typeof mutation.recordId === 'string') {
        const map = maps[mutation.table];
        if (map && map[mutation.recordId]) {
          mutation.recordId = map[mutation.recordId];
          mutated = true;
        }
      }

      if (mutated) await syncDb.pendingMutations.put(mutation);
    }
  }

  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem('gp-legacy-migrated', '1'); } catch { /* ignore */ }
  }
}

async function migrateStaffRoles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await db.staff.toArray()) as any[];
  const changed = rows
    .filter((r) => r.role === 'store_manager')
    .map((r) => ({ ...r, role: 'general_manager' }));
  if (changed.length > 0) await db.staff.bulkPut(changed);
}

export async function seedOfflineData() {
  await migrateLegacyIds();
  await migrateStaffRoles();

  const productCount = await db.products.count();
  if (productCount > 0) return;

  await db.products.bulkAdd([
    { id: P1, name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', category: 'antibiotics', sku: 'AMX-500', unit_price: 8500, cost_price: 6000, currency: 'SSP' as Currency, quantity_in_stock: 45, reorder_level: 20, expiry_date: '2027-06-15', alert_days: 90, batch_number: 'BCH-001', manufacturer: 'Juba Pharma', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P2, name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', category: 'analgesics', sku: 'PCM-500', unit_price: 2000, cost_price: 1200, currency: 'SSP' as Currency, quantity_in_stock: 200, reorder_level: 50, expiry_date: '2027-12-20', alert_days: 30, batch_number: 'BCH-002', manufacturer: 'Juba Pharma', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P3, name: 'Metformin 850mg', generic_name: 'Metformin HCl', category: 'diabetes', sku: 'MET-850', unit_price: 5.50, cost_price: 3.80, currency: 'USD' as Currency, quantity_in_stock: 30, reorder_level: 15, expiry_date: '2027-03-10', alert_days: 60, batch_number: 'BCH-003', manufacturer: 'Medipharm', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P4, name: 'Lisinopril 10mg', generic_name: 'Lisinopril', category: 'cardiovascular', sku: 'LIS-10', unit_price: 4.00, cost_price: 2.50, currency: 'USD' as Currency, quantity_in_stock: 60, reorder_level: 30, expiry_date: '2027-09-25', alert_days: 90, batch_number: 'BCH-004', manufacturer: 'Cipla', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P5, name: 'Vitamin C 1000mg', generic_name: 'Ascorbic Acid', category: 'vitamins', sku: 'VTC-1000', unit_price: 3000, cost_price: 1800, currency: 'SSP' as Currency, quantity_in_stock: 120, reorder_level: 30, expiry_date: '2027-08-30', alert_days: 30, batch_number: 'BCH-005', manufacturer: 'VitaHealth', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P6, name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', category: 'analgesics', sku: 'IBU-400', unit_price: 3.00, cost_price: 1.80, currency: 'USD' as Currency, quantity_in_stock: 8, reorder_level: 25, expiry_date: '2026-08-25', alert_days: 14, batch_number: 'BCH-006', manufacturer: 'Swiss Pharma', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P7, name: 'Artemether-Lumefantrine', generic_name: 'ACT', category: 'antibiotics', sku: 'ACT-20', unit_price: 15000, cost_price: 10000, currency: 'SSP' as Currency, quantity_in_stock: 35, reorder_level: 20, expiry_date: '2027-05-18', alert_days: 60, batch_number: 'BCH-007', manufacturer: 'Bliss GVS', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: P8, name: 'ORS Sachets', generic_name: 'Oral Rehydration Salts', category: 'other', sku: 'ORS-01', unit_price: 1500, cost_price: 800, currency: 'SSP' as Currency, quantity_in_stock: 300, reorder_level: 100, expiry_date: '2028-01-01', alert_days: 90, batch_number: 'BCH-008', manufacturer: 'UNICEF Supply', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);

  await db.sales.bulkAdd([
    { id: S1, invoice_number: 'GS-260801-0001', customer_id: null, user_id: ADMIN_STAFF_ID, subtotal: 35000, discount: 2000, tax: 0, total: 33000, currency: 'SSP' as Currency, payment_method: 'cash', status: 'completed', notes: 'Amina Deng', created_at: '2026-08-18T10:00:00Z' },
    { id: S2, invoice_number: 'GS-260801-0002', customer_id: null, user_id: ADMIN_STAFF_ID, subtotal: 11.00, discount: 0, tax: 0, total: 11.00, currency: 'USD' as Currency, payment_method: 'cash', status: 'completed', notes: 'Peter Garang', created_at: '2026-08-18T11:30:00Z' },
    { id: S3, invoice_number: 'GS-260801-0003', customer_id: null, user_id: ADMIN_STAFF_ID, subtotal: 22500, discount: 1000, tax: 0, total: 21500, currency: 'SSP' as Currency, payment_method: 'transfer', status: 'completed', notes: 'Sarah Nyabol', created_at: '2026-08-17T09:00:00Z' },
    { id: S4, invoice_number: 'GS-260801-0004', customer_id: null, user_id: ADMIN_STAFF_ID, subtotal: 16000, discount: 0, tax: 0, total: 16000, currency: 'SSP' as Currency, payment_method: 'card', status: 'completed', notes: 'James Bol', created_at: '2026-08-17T14:00:00Z' },
    { id: S5, invoice_number: 'GS-260801-0005', customer_id: null, user_id: ADMIN_STAFF_ID, subtotal: 28.50, discount: 3.50, tax: 0, total: 25.00, currency: 'USD' as Currency, payment_method: 'cash', status: 'returned', notes: 'Grace Akello', created_at: '2026-08-16T16:00:00Z' },
    { id: S6, invoice_number: 'GS-260801-0006', customer_id: null, user_id: ADMIN_STAFF_ID, subtotal: 8500, discount: 0, tax: 0, total: 8500, currency: 'SSP' as Currency, payment_method: 'credit', status: 'completed', notes: 'David Malual', created_at: '2026-08-16T08:00:00Z' },
  ]);

  await db.purchases.bulkAdd([
    { id: PU1, invoice_number: 'GP-260801-0001', supplier_id: SUP1, user_id: ADMIN_STAFF_ID, subtotal: 450000, tax: 0, total: 450000, currency: 'SSP' as Currency, status: 'received', notes: null, created_at: '2026-08-01T10:00:00Z' },
    { id: PU2, invoice_number: 'GP-260801-0002', supplier_id: SUP2, user_id: ADMIN_STAFF_ID, subtotal: 125.00, tax: 0, total: 125.00, currency: 'USD' as Currency, status: 'received', notes: null, created_at: '2026-08-05T10:00:00Z' },
    { id: PU3, invoice_number: 'GP-260801-0003', supplier_id: SUP3, user_id: ADMIN_STAFF_ID, subtotal: 280000, tax: 0, total: 280000, currency: 'SSP' as Currency, status: 'ordered', notes: null, created_at: '2026-08-10T10:00:00Z' },
    { id: PU4, invoice_number: 'GP-260801-0004', supplier_id: SUP1, user_id: ADMIN_STAFF_ID, subtotal: 850000, tax: 0, total: 850000, currency: 'SSP' as Currency, status: 'received', notes: null, created_at: '2026-08-12T10:00:00Z' },
    { id: PU5, invoice_number: 'GP-260801-0005', supplier_id: SUP4, user_id: ADMIN_STAFF_ID, subtotal: 55.00, tax: 0, total: 55.00, currency: 'USD' as Currency, status: 'cancelled', notes: null, created_at: '2026-08-14T10:00:00Z' },
  ]);

  await db.suppliers.bulkAdd([
    { id: SUP1, name: 'Juba Pharma Ltd', contact_person: 'John Bul', phone: '+211912345678', email: 'info@jubapharma.ss', address: 'Custom Market', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: SUP2, name: 'Medipharm Distributors', contact_person: 'Peter Gatluak', phone: '+211923456789', email: 'sales@medipharm.ss', address: 'Kator', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: SUP3, name: 'Bliss GVS Juba', contact_person: 'Mary Nyaluak', phone: '+211934567890', email: 'orders@blissgvs.ss', address: 'New Site', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: SUP4, name: 'Swiss Pharma Juba', contact_person: 'David Mawien', phone: '+211945678901', email: 'info@swisspharma.ss', address: 'Nimra Talata', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: SUP5, name: 'VitaHealth South Sudan', contact_person: 'Grace Akello', phone: '+211956789012', email: 'orders@vitahealth.ss', address: 'Juba Teaching Hospital Road', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
  ]);

  await db.expenses.bulkAdd([
    { id: E1, category: 'rent', description: 'Monthly shop rent - August', amount: 2500000, currency: 'SSP' as Currency, date: '2026-08-01', user_id: ADMIN_STAFF_ID, receipt_url: null, created_at: new Date().toISOString() },
    { id: E2, category: 'utilities', description: 'Electricity bill (JEDCO)', amount: 350000, currency: 'SSP' as Currency, date: '2026-08-05', user_id: ADMIN_STAFF_ID, receipt_url: null, created_at: new Date().toISOString() },
    { id: E3, category: 'utilities', description: 'Zain internet subscription', amount: 150000, currency: 'SSP' as Currency, date: '2026-08-05', user_id: ADMIN_STAFF_ID, receipt_url: null, created_at: new Date().toISOString() },
    { id: E4, category: 'supplies', description: 'Receipt printer paper rolls', amount: 45000, currency: 'SSP' as Currency, date: '2026-08-10', user_id: ADMIN_STAFF_ID, receipt_url: null, created_at: new Date().toISOString() },
    { id: E5, category: 'transport', description: 'Delivery to Malakal customer', amount: 15.00, currency: 'USD' as Currency, date: '2026-08-12', user_id: ADMIN_STAFF_ID, receipt_url: null, created_at: new Date().toISOString() },
    { id: E6, category: 'maintenance', description: 'Generator fuel', amount: 200000, currency: 'SSP' as Currency, date: '2026-08-14', user_id: ADMIN_STAFF_ID, receipt_url: null, created_at: new Date().toISOString() },
  ]);

  await db.staff.bulkAdd([
    { id: 'a0000000-0000-0000-0000-000000000001', first_name: 'Clara', last_name: 'Evelino Modi', role: 'admin', phone: '+211928000601', email: 'clara@globalpharmacy.ss', hire_date: '2024-01-15', salary: 300000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000002', first_name: 'Dr. Denis', last_name: 'Sebit', role: 'pharmacist', phone: '+211915747474', email: 'denis@globalpharmacy.ss', hire_date: '2024-03-20', salary: 300000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000003', first_name: 'Dr. Jasinta', last_name: 'Robert', role: 'pharmacist', phone: '+211925687772', email: 'jasinta@globalpharmacy.ss', hire_date: '2024-06-10', salary: 300000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000004', first_name: 'Mr. Emmanuel', last_name: 'Morbe', role: 'cashier', phone: '+211929420661', email: 'emmanuel@globalpharmacy.ss', hire_date: '2025-01-05', salary: 200000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000005', first_name: 'Dr. Mary', last_name: 'Evelino', role: 'general_manager', phone: '+256778551051', email: 'mary@globalpharmacy.ss', hire_date: '2025-06-15', salary: 280000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000006', first_name: 'Dr. Bortel', last_name: 'Ohesa', role: 'pharmacist', phone: '+211920123456', email: 'bortel@globalpharmacy.ss', hire_date: '2026-01-01', salary: 250000, is_active: true, created_at: new Date().toISOString() },
  ]);

  await db.payroll.bulkAdd([
    { id: '60000000-0000-4000-8000-000000000001', staff_id: 'a0000000-0000-0000-0000-000000000001', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 225000, allowances: 50000, deductions: 25000, net_pay: 250000, status: 'paid', paid_at: '2026-08-16', created_at: new Date().toISOString() },
    { id: '60000000-0000-4000-8000-000000000002', staff_id: 'a0000000-0000-0000-0000-000000000002', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 175000, allowances: 30000, deductions: 15000, net_pay: 190000, status: 'paid', paid_at: '2026-08-16', created_at: new Date().toISOString() },
    { id: '60000000-0000-4000-8000-000000000003', staff_id: 'a0000000-0000-0000-0000-000000000004', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 100000, allowances: 15000, deductions: 10000, net_pay: 105000, status: 'pending', paid_at: null, created_at: new Date().toISOString() },
  ]);

  await db.customers.bulkAdd([
    { id: C1, name: 'Amina Deng', phone: '+211920111111', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: C2, name: 'Peter Garang', phone: '+211920222222', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: C3, name: 'Sarah Nyabol', phone: '+211920333333', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: C4, name: 'James Bol', phone: '+211920444444', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: C5, name: 'Grace Akello', phone: '+211920555555', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: C6, name: 'David Malual', phone: '+211920666666', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
  ]);
}