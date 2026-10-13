import { adminDb } from '@/lib/server/admin-db';
import { requireOwner } from '@/lib/server/admin-guard';
import { errorResponse, HttpError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

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
