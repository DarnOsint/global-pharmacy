import Dexie, { type Table } from 'dexie';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export interface StaffPin {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  role: string;
  pin: string;
  username?: string;
  password?: string;
}

export class AuthDB extends Dexie {
  staffPins!: Table<StaffPin>;

  constructor() {
    super('GlobalPharmacyAuth');
    this.version(1).stores({
      staffPins: 'id, staff_id, pin, role',
    });
    this.version(2).stores({
      staffPins: 'id, staff_id, pin, role, username',
    });
  }
}

export const authDb = new AuthDB();

const WEAK_PINS = new Set([
  '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
  '1234', '2345', '3456', '4567', '5678', '6789', '7890', '8901',
  '1122', '2233', '3344', '4455', '5566', '6677', '7788', '8899',
  '1221', '2332', '3443', '4554', '5665', '6776', '7887', '8998',
]);

export function generatePin(): string {
  for (let attempt = 0; attempt < 100; attempt++) {
    const pin = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('');
    if (WEAK_PINS.has(pin)) continue;
    const digits = pin.split('').map(Number);
    if (digits[0] === digits[1] && digits[1] === digits[2] && digits[2] === digits[3]) continue;
    return pin;
  }
  return String(1000 + Math.floor(Math.random() * 9000));
}

const STAFF_PIN_MAP: Record<string, string> = {
  'a0000000-0000-0000-0000-000000000001': '0887',
  'a0000000-0000-0000-0000-000000000002': '5184',
  'a0000000-0000-0000-0000-000000000003': '9067',
  'a0000000-0000-0000-0000-000000000004': '2741',
  'a0000000-0000-0000-0000-000000000005': '6358',
  'a0000000-0000-0000-0000-000000000006': '4819',
};

function getDefaultPin(staffId: string): string {
  return STAFF_PIN_MAP[staffId] || generatePin();
}

export async function seedAuthDb() {
  await syncStaffPinsFromServer();

  const staffList = await db.staff.toArray();

  for (const s of staffList) {
    if (!s.is_active) continue;
    const existing = await authDb.staffPins.where('staff_id').equals(s.id).first();
    if (existing) {
      const patch: Partial<StaffPin> = {};
      if (existing.first_name !== s.first_name) patch.first_name = s.first_name;
      if (existing.last_name !== s.last_name) patch.last_name = s.last_name;
      if (existing.role !== s.role) patch.role = s.role;
      if (Object.keys(patch).length > 0) await authDb.staffPins.update(existing.id, patch);
      if (!existing.username && s.role === 'admin') {
        await authDb.staffPins.update(existing.id, { username: 'clara', password: 'admin123' });
      }
      if (!existing.pin) {
        const pin = getDefaultPin(s.id);
        await authDb.staffPins.update(existing.id, { pin });
        await pushStaffPin(s.id, pin);
      }
    } else {
      const pin = getDefaultPin(s.id);
      const staffPin: StaffPin = {
        id: `auth-${s.id}`,
        staff_id: s.id,
        first_name: s.first_name,
        last_name: s.last_name,
        role: s.role,
        pin,
        ...(s.role === 'admin' ? { username: 'clara', password: 'admin123' } : {}),
      };
      await authDb.staffPins.add(staffPin);
      await pushStaffPin(s.id, pin);
    }
  }

  const admin = await authDb.staffPins.where('role').equals('admin').first();
  if (admin && !admin.username) {
    await authDb.staffPins.update(admin.id, { username: 'clara', password: 'admin123' });
  }
}

async function pushStaffPin(staffId: string, pin: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from('staff_pins') as any)
      .select('id')
      .eq('staff_id', staffId)
      .maybeSingle();
    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('staff_pins') as any).update({ pin, is_active: true }).eq('id', (existing as Record<string, unknown>).id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('staff_pins') as any).insert({ staff_id: staffId, pin, is_active: true });
    }
  } catch { /* offline or no table */ }
}

async function syncStaffPinsFromServer() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (supabase.from('staff_pins') as any).select('*');
    if (!rows || rows.length === 0) return;
    const staffList = await db.staff.toArray();
    const staffMap = new Map(staffList.map((s) => [s.id, s]));
    for (const row of rows as Record<string, unknown>[]) {
      const staffId = row.staff_id as string;
      const pin = row.pin as string;
      const staff = staffMap.get(staffId);
      if (!staff) continue;
      const existing = await authDb.staffPins.where('staff_id').equals(staffId).first();
      if (existing) {
        const patch: Partial<StaffPin> = {};
        if (existing.first_name !== staff.first_name) patch.first_name = staff.first_name;
        if (existing.last_name !== staff.last_name) patch.last_name = staff.last_name;
        if (existing.role !== staff.role) patch.role = staff.role;
        if (existing.pin !== pin) patch.pin = pin;
        if (Object.keys(patch).length > 0) await authDb.staffPins.update(existing.id, patch);
      } else {
        await authDb.staffPins.add({
          id: `auth-${staffId}`,
          staff_id: staffId,
          first_name: staff.first_name,
          last_name: staff.last_name,
          role: staff.role,
          pin,
        });
      }
    }
  } catch { /* offline or no table */ }
}

export async function verifyPinOffline(pin: string): Promise<StaffPin | null> {
  const staff = await authDb.staffPins.where('pin').equals(pin).first();
  return staff || null;
}

export async function verifyCredentials(username: string, password: string): Promise<StaffPin | null> {
  const clean = username.trim().toLowerCase();
  if (!clean || !password) return null;
  const staff = await authDb.staffPins.where('username').equals(clean).first();
  if (staff && staff.password && staff.password === password) return staff;
  return null;
}

export async function getAdminCredentials(): Promise<{ username: string } | null> {
  const admin = await authDb.staffPins.where('role').equals('admin').first();
  if (!admin || !admin.username) return null;
  return { username: admin.username };
}

export async function setAdminCredentials(username: string, password: string): Promise<boolean> {
  const clean = username.trim().toLowerCase();
  if (!clean) return false;
  const admin = await authDb.staffPins.where('role').equals('admin').first();
  if (!admin) return false;
  await authDb.staffPins.update(admin.id, { username: clean, ...(password ? { password } : {}) });
  return true;
}
