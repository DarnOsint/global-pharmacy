import type { SupabaseClient } from '@supabase/supabase-js';
import { HttpError } from '@/lib/server/session';

const WINDOW_MS = 15 * 60 * 1000;
const DEVICE_FAILURE_LIMIT = 8;
const IP_FAILURE_LIMIT = 50;

export function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

async function failuresSince(db: SupabaseClient, column: 'ip' | 'device_id', value: string): Promise<number> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await db
    .from('pin_attempts')
    .select('id', { count: 'exact', head: true })
    .eq(column, value)
    .eq('success', false)
    .gte('created_at', since);
  if (error) throw new HttpError(500, error.message);
  return count ?? 0;
}

// A device that keeps failing is blocked for the window, and so is an IP that
// is hammering with rotating device ids. The per-device limit is kept below
// the per-IP limit so one mistyped PIN in a shared clinic network does not lock
// out the whole site.
export async function assertPinAllowed(db: SupabaseClient, ip: string, deviceId: string): Promise<void> {
  const [byDevice, byIp] = await Promise.all([
    failuresSince(db, 'device_id', deviceId),
    failuresSince(db, 'ip', ip),
  ]);
  if (byDevice >= DEVICE_FAILURE_LIMIT || byIp >= IP_FAILURE_LIMIT) {
    throw new HttpError(429, 'Too many failed attempts. Wait 15 minutes and try again.');
  }
}

export async function recordPinAttempt(db: SupabaseClient, ip: string, deviceId: string, success: boolean): Promise<void> {
  await db.from('pin_attempts').insert({ ip, device_id: deviceId, success });
}
