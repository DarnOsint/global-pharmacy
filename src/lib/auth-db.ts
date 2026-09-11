import Dexie, { type Table } from 'dexie';

export interface StaffPin {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'pharmacist' | 'cashier' | 'store_manager';
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

export const defaultStaffPins: StaffPin[] = [
  { id: '1', staff_id: 'a0000000-0000-0000-0000-000000000001', first_name: 'Clara', last_name: 'Evelino Modi', role: 'admin', pin: '0887', username: 'clara', password: 'admin123' },
  { id: '2', staff_id: 'a0000000-0000-0000-0000-000000000002', first_name: 'Nyamal', last_name: 'Kuol', role: 'pharmacist', pin: '5678' },
  { id: '3', staff_id: 'a0000000-0000-0000-0000-000000000003', first_name: 'Bol', last_name: 'Mawut', role: 'pharmacist', pin: '3456' },
  { id: '4', staff_id: 'a0000000-0000-0000-0000-000000000004', first_name: 'Akello', last_name: 'James', role: 'cashier', pin: '7890' },
  { id: '5', staff_id: 'a0000000-0000-0000-0000-000000000005', first_name: 'Kur', last_name: 'Lual', role: 'store_manager', pin: '2345' },
];

export async function seedAuthDb() {
  const count = await authDb.staffPins.count();
  if (count === 0) {
    await authDb.staffPins.bulkAdd(defaultStaffPins);
  } else {
    // Always update admin name in case it changed
    const admin = await authDb.staffPins.where('role').equals('admin').first();
    if (admin) {
      const updates: Partial<StaffPin> = {};
      if (admin.first_name !== 'Clara' || admin.last_name !== 'Evelino Modi') {
        updates.first_name = 'Clara';
        updates.last_name = 'Evelino Modi';
      }
      // Backfill default username/password once, without overriding a saved value
      if (!admin.username || !admin.password) {
        const def = defaultStaffPins.find((s) => s.role === 'admin');
        updates.username = admin.username || def?.username || 'clara';
        updates.password = admin.password || def?.password || 'admin123';
      }
      // Keep the admin PIN in sync with the configured default
      const def = defaultStaffPins.find((s) => s.role === 'admin');
      if (admin.pin !== (def?.pin || '0887')) {
        updates.pin = def?.pin || '0887';
      }
      if (Object.keys(updates).length > 0) {
        await authDb.staffPins.update(admin.id, updates);
      }
    }
  }
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
