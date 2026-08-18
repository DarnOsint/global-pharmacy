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

// Default staff with PINs for offline use
export const defaultStaffPins: StaffPin[] = [
  { id: '1', staff_id: '1', first_name: 'Chidinma', last_name: 'Eze', role: 'admin', pin: '1234' },
  { id: '2', staff_id: '2', first_name: 'Blessing', last_name: 'Okoro', role: 'pharmacist', pin: '5678' },
  { id: '3', staff_id: '3', first_name: 'Ibrahim', last_name: 'Mohammed', role: 'pharmacist', pin: '3456' },
  { id: '4', staff_id: '4', first_name: 'Ngozi', last_name: 'Adeyemi', role: 'cashier', pin: '7890' },
  { id: '5', staff_id: '5', first_name: 'Tunde', last_name: 'Olawale', role: 'store_manager', pin: '2345' },
];

// Seed default staff if DB is empty
export async function seedAuthDb() {
  const count = await authDb.staffPins.count();
  if (count === 0) {
    await authDb.staffPins.bulkAdd(defaultStaffPins);
  }
}

// Verify PIN offline
export async function verifyPinOffline(pin: string): Promise<StaffPin | null> {
  const staff = await authDb.staffPins.where('pin').equals(pin).first();
  return staff || null;
}
