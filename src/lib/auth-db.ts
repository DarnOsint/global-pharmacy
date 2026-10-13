import Dexie, { type Table } from 'dexie';
import { apiFetch } from '@/lib/api';
import { derivePinHash } from '@/lib/pin-hash';
import type { LocationRef } from '@/lib/auth';

// Device-wide sign-in cache, shared by every location on this device.
//
// `verifier` is HMAC(deviceKey, pinHash), not the PIN or its hash. The device
// key is a non-extractable CryptoKey: page scripts can use it, but it cannot be
// read out or copied with the rest of the database. A copy of this database
// alone is therefore not enough to test PIN guesses offline.
export interface RosterEntry {
  id: string;
  location_id: string;
  staff_id: string;
  first_name: string;
  last_name: string;
  role: string;
  pin_salt: string;
  verifier: string;
  location: LocationRef;
}

interface DeviceKeyRow {
  id: 'device';
  key: CryptoKey;
}

export class AuthDB extends Dexie {
  roster!: Table<RosterEntry>;
  deviceKeys!: Table<DeviceKeyRow>;

  constructor() {
    super('GlobalPharmacyAuth');
    this.version(1).stores({
      staffPins: 'id, staff_id, pin, role',
    });
    this.version(2).stores({
      staffPins: 'id, staff_id, pin, role, username',
    });
    this.version(3).stores({
      staffPins: null,
      roster: 'id, location_id, staff_id',
      sessions: 'staff_id',
    });
    this.version(4).stores({
      sessions: null,
      deviceKeys: 'id',
    }).upgrade(async (tx) => {
      await tx.table('roster').clear();
    });
  }
}

export const authDb = new AuthDB();

const enc = new TextEncoder();
const LOCK_KEY = 'gp-offline-lock';
const MAX_OFFLINE_ATTEMPTS = 5;
const OFFLINE_LOCK_MS = 15 * 60 * 1000;

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function deviceKey(): Promise<CryptoKey> {
  const row = await authDb.deviceKeys.get('device');
  if (row) return row.key;
  const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
  await authDb.deviceKeys.put({ id: 'device', key });
  return key;
}

async function verifierFor(pinHash: string): Promise<string> {
  const key = await deviceKey();
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(pinHash)));
}

export async function cacheRoster(): Promise<void> {
  const res = await apiFetch<{
    location: LocationRef;
    staff: { staff_id: string; first_name: string; last_name: string; role: string; pin_salt: string; pin_hash: string }[];
  }>('/api/auth/roster');
  const entries: RosterEntry[] = [];
  for (const s of res.staff) {
    entries.push({
      id: `${res.location.id}:${s.staff_id}`,
      location_id: res.location.id,
      staff_id: s.staff_id,
      first_name: s.first_name,
      last_name: s.last_name,
      role: s.role,
      pin_salt: s.pin_salt,
      verifier: await verifierFor(s.pin_hash),
      location: res.location,
    });
  }
  await authDb.transaction('rw', authDb.roster, async () => {
    await authDb.roster.where('location_id').equals(res.location.id).delete();
    await authDb.roster.bulkPut(entries);
  });
}

function readLock(): { count: number; until: number } {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY) ?? '') as { count: number; until: number };
  } catch {
    return { count: 0, until: 0 };
  }
}

function writeLock(lock: { count: number; until: number }): void {
  localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
}

export type OfflineSignIn =
  | { status: 'ok'; staff: { id: string; first_name: string; last_name: string; role: string }; locations: LocationRef[] }
  | { status: 'locked'; until: number }
  | { status: 'none' };

// Checks the PIN against this device's roster. Repeated wrong PINs lock offline
// sign-in on this device for a while. The lock is a deterrent only: it lives in
// localStorage, so it does not stop anyone who has script access to the page.
export async function offlineSignIn(pin: string): Promise<OfflineSignIn> {
  const lock = readLock();
  if (lock.until > Date.now()) return { status: 'locked', until: lock.until };

  const entries = (await authDb.roster.toArray()).filter((e) => e.verifier);
  const derivedBySalt = new Map<string, string>();
  for (const entry of entries) {
    let derived = derivedBySalt.get(entry.pin_salt);
    if (!derived) {
      derived = await derivePinHash(pin, entry.pin_salt);
      derivedBySalt.set(entry.pin_salt, derived);
    }
    if ((await verifierFor(derived)) !== entry.verifier) continue;
    writeLock({ count: 0, until: 0 });
    return {
      status: 'ok',
      staff: { id: entry.staff_id, first_name: entry.first_name, last_name: entry.last_name, role: entry.role },
      locations: [entry.location],
    };
  }

  const count = lock.count + 1;
  if (count >= MAX_OFFLINE_ATTEMPTS) {
    const until = Date.now() + OFFLINE_LOCK_MS;
    writeLock({ count: 0, until });
    return { status: 'locked', until };
  }
  writeLock({ count, until: 0 });
  return { status: 'none' };
}
