import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/server/admin-db';
import { readJson, requireAdmin, requireOwner } from '@/lib/server/admin-guard';
import { errorResponse, HttpError } from '@/lib/server/session';
import { assertPinAvailable, storeStaffPin, validatePinInput } from '@/lib/server/staff-pin';

export const dynamic = 'force-dynamic';

const ROLE_RE = /^(admin|general_manager|pharmacist|cashier)$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: Request) {
  try {
    await requireOwner(req);
    const db = adminDb();
    const [staffRes, membershipRes, pinRes] = await Promise.all([
      db.from('staff').select('id, first_name, last_name, role, is_active').order('first_name'),
      db.from('staff_locations').select('staff_id, location_id'),
      db.from('staff_pins').select('staff_id').not('pin_hash', 'is', null),
    ]);
    const error = staffRes.error ?? membershipRes.error ?? pinRes.error;
    if (error) throw new HttpError(500, error.message);

    const locationsByStaff = new Map<string, string[]>();
    for (const m of membershipRes.data ?? []) {
      const list = locationsByStaff.get(m.staff_id as string) ?? [];
      list.push(m.location_id as string);
      locationsByStaff.set(m.staff_id as string, list);
    }
    const withPin = new Set((pinRes.data ?? []).map((p) => p.staff_id as string));

    return Response.json(
      (staffRes.data ?? []).map((s) => ({
        ...s,
        location_ids: locationsByStaff.get(s.id as string) ?? [],
        has_pin: withPin.has(s.id as string),
      }))
    );
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = await readJson(req);
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const role = String(body.role || '').trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const email = body.email ? String(body.email).trim() : null;
    const pin = validatePinInput(body.pin);
    const locationIds = Array.isArray(body.locationIds)
      ? body.locationIds.filter((x: any) => typeof x === 'string' && UUID_RE.test(x))
      : [];

    if (!firstName || !lastName) throw new HttpError(400, 'First and last name required');
    if (!ROLE_RE.test(role)) throw new HttpError(400, 'Invalid role');

    const db = adminDb();
    await assertPinAvailable(db, pin);

    const { data: staff, error: sErr } = await db
      .from('staff')
      .insert({
        first_name: firstName,
        last_name: lastName,
        role,
        phone,
        email,
        hire_date: new Date().toISOString().slice(0, 10),
        is_active: true,
      })
      .select('id')
      .single();
    if (sErr) throw new HttpError(500, sErr.message);
    if (!staff) throw new HttpError(500, 'Failed to create staff');

    if (locationIds.length > 0) {
      const rows = locationIds.map((lid: string) => ({ staff_id: staff.id, location_id: lid }));
      const { error: slErr } = await db.from('staff_locations').insert(rows);
      if (slErr) throw new HttpError(500, slErr.message);
    }

    await storeStaffPin(db, staff.id, pin);
    return NextResponse.json({ ok: true, staffId: staff.id });
  } catch (e: any) {
    return errorResponse(e);
  }
}