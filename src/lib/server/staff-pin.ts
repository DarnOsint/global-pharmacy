import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '@/lib/server/session';
import { derivePinHash, isValidPin, isWeakPin, newPinSalt, verifyPin } from '@/lib/pin-hash';

export function validatePinInput(pin: unknown): string {
  const value = typeof pin === 'string' ? pin : '';
  if (!isValidPin(value)) throw new HttpError(400, 'PIN must be exactly 4 digits');
  if (isWeakPin(value)) throw new HttpError(400, 'PIN is too easy to guess (repeated or consecutive digits)');
  return value;
}

// Sign-in identifies a person from the PIN alone, so every PIN must be unique.
export async function assertPinAvailable(db: SupabaseClient, pin: string, exceptStaffId?: string): Promise<void> {
  let query = db.from('staff_pins').select('staff_id, pin_salt, pin_hash').not('pin_hash', 'is', null);
  if (exceptStaffId) query = query.neq('staff_id', exceptStaffId);
  const { data, error } = await query;
  if (error) throw new HttpError(500, error.message);
  for (const row of data ?? []) {
    if (row.pin_salt && row.pin_hash && (await verifyPin(pin, row.pin_salt as string, row.pin_hash as string))) {
      throw new HttpError(409, 'Another staff member already uses this PIN');
    }
  }
}

export async function storeStaffPin(db: SupabaseClient, staffId: string, pin: string): Promise<void> {
  const salt = newPinSalt();
  const hash = await derivePinHash(pin, salt);
  const { error } = await db.from('staff_pins').upsert(
    { staff_id: staffId, pin: null, pin_salt: salt, pin_hash: hash, is_active: true },
    { onConflict: 'staff_id' }
  );
  if (error) throw new HttpError(500, error.message);
}
