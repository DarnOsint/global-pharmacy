import Dexie, { type Table } from 'dexie';

export interface StaffPin {
  id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'pharmacist' | 'cashier' | 'store_manager';
  pin: string;
}

export class AuthDB extends Dexie {
  staffPins!: Table<StaffPin>;

  constructor() {
    super('GlobalPharmacyAuth');
    this.version(1).stores({
      staffPins: 'id, staff_id, pin, role',
    });
  }
}

export const authDb = new AuthDB();

export const defaultStaffPins: StaffPin[] = [
  { id: '1', staff_id: 'a0000000-0000-0000-0000-000000000001', first_name: 'Clara', last_name: 'Evelino Modi', role: 'admin', pin: '1234' },
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
    if (admin && (admin.first_name !== 'Clara' || admin.last_name !== 'Evelino Modi')) {
      await authDb.staffPins.update(admin.id, { first_name: 'Clara', last_name: 'Evelino Modi' });
    }
  }
}

export async function verifyPinOffline(pin: string): Promise<StaffPin | null> {
  const staff = await authDb.staffPins.where('pin').equals(pin).first();
  return staff || null;
}
