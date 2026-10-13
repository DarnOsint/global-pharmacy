// One-time: store staff PINs as salted PBKDF2 hashes and clear the plaintext.
//
// Run after supabase/multi-location.sql, from the project root:
//
//   STAFF_PINS='{"a0000000-0000-0000-0000-000000000001":"4821", "...": "...."}' \
//     node --env-file=.env.local scripts/seed-staff-pins.mjs
//
// Each key is a staff id, each value a 4-digit PIN. Keep the PINs out of git.
// .env.local must contain NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
// Mirrors src/lib/pin-hash.ts; keep the iteration count in sync.

import { createClient } from '@supabase/supabase-js';

const ITERATIONS = 100_000;
const enc = new TextEncoder();
const toHex = (buf) => Buffer.from(buf).toString('hex');

async function hash(pin, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: Buffer.from(saltHex, 'hex'), iterations: ITERATIONS },
    key,
    256
  );
  return toHex(bits);
}

const raw = process.env.STAFF_PINS;
if (!raw) throw new Error('Set STAFF_PINS to a JSON object of staff id -> 4-digit PIN');
const pins = JSON.parse(raw);

const entries = Object.entries(pins);
const seen = new Set();
for (const [staffId, pin] of entries) {
  if (!/^\d{4}$/.test(pin)) throw new Error(`PIN for ${staffId} must be exactly 4 digits`);
  if (seen.has(pin)) throw new Error(`PIN ${pin} is used twice; every staff member needs a unique PIN`);
  seen.add(pin);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

for (const [staffId, pin] of entries) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const pin_hash = await hash(pin, salt);
  const { error: staffError } = await db.from('staff').select('id').eq('id', staffId).single();
  if (staffError) throw new Error(`No staff row for ${staffId}: ${staffError.message}`);

  const { error } = await db
    .from('staff_pins')
    .upsert({ staff_id: staffId, pin: null, pin_salt: salt, pin_hash, is_active: true }, { onConflict: 'staff_id' });
  if (error) throw new Error(`Failed for ${staffId}: ${error.message}`);
  console.log(`ok  ${staffId}`);
}

console.log(`Stored ${entries.length} PIN(s). Plaintext PINs were cleared.`);
