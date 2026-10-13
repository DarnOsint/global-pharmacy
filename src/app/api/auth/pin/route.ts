import { adminDb } from '@/lib/server/admin-db';
import { allowedLocations, errorResponse, HttpError, sessionCookieFor } from '@/lib/server/session';
import { assertPinAllowed, clientIp, recordPinAttempt } from '@/lib/server/pin-auth';
import { isValidPin, verifyPin } from '@/lib/pin-hash';
import type { Role } from '@/lib/sync-tables';

export const dynamic = 'force-dynamic';

interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { pin?: unknown; deviceId?: unknown };
    const pin = typeof body.pin === 'string' ? body.pin : '';
    const deviceId = typeof body.deviceId === 'string' ? body.deviceId.slice(0, 64) : '';
    if (!isValidPin(pin) || !deviceId) throw new HttpError(400, 'Invalid request');

    const db = adminDb();
    const ip = clientIp(req);
    await assertPinAllowed(db, ip, deviceId);

    const { data: rows, error } = await db
      .from('staff_pins')
      .select('pin_salt, pin_hash, staff:staff_id(id, first_name, last_name, role, is_active)')
      .eq('is_active', true);
    if (error) throw new HttpError(500, error.message);

    let match: StaffRow | null = null;
    for (const row of (rows ?? []) as unknown as { pin_salt: string | null; pin_hash: string | null; staff: StaffRow | null }[]) {
      if (!row.staff?.is_active || !row.pin_salt || !row.pin_hash) continue;
      if (await verifyPin(pin, row.pin_salt, row.pin_hash)) {
        match = row.staff;
        break;
      }
    }

    await recordPinAttempt(db, ip, deviceId, match !== null);
    if (!match) throw new HttpError(401, 'Invalid PIN');

    const cookie = await sessionCookieFor(match.id);
    const locations = await allowedLocations(match.id, match.role);
    const res = Response.json({
      staff: { id: match.id, first_name: match.first_name, last_name: match.last_name, role: match.role },
      locations,
    });
    res.headers.append('set-cookie', cookie);
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
