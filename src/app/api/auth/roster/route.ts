import { adminDb } from '@/lib/server/admin-db';
import { errorResponse, HttpError, requireSession } from '@/lib/server/session';
import { OWNER_ROLES, type Role } from '@/lib/sync-tables';

export const dynamic = 'force-dynamic';

// PIN verifiers for the staff who can sign in at the active location. The
// device keeps these so PIN sign-in still works offline. Only a signed-in staff
// member for this location can read them.
export async function GET(req: Request) {
  try {
    const session = await requireSession(req);
    const db = adminDb();
    const locationId = session.activeLocation.id;

    const { data: members, error: memberError } = await db
      .from('staff_locations')
      .select('staff_id')
      .eq('location_id', locationId);
    if (memberError) throw new HttpError(500, memberError.message);
    const memberIds = new Set((members ?? []).map((m) => m.staff_id as string));

    const { data, error } = await db
      .from('staff_pins')
      .select('pin_salt, pin_hash, staff:staff_id(id, first_name, last_name, role, is_active)')
      .eq('is_active', true);
    if (error) throw new HttpError(500, error.message);

    const roster = (data ?? [])
      .map((row) => row as unknown as {
        pin_salt: string | null;
        pin_hash: string | null;
        staff: { id: string; first_name: string; last_name: string; role: Role; is_active: boolean } | null;
      })
      .filter((row) => row.staff?.is_active && row.pin_salt && row.pin_hash)
      .filter((row) => OWNER_ROLES.includes(row.staff!.role) || memberIds.has(row.staff!.id))
      .map((row) => ({
        staff_id: row.staff!.id,
        first_name: row.staff!.first_name,
        last_name: row.staff!.last_name,
        role: row.staff!.role,
        pin_salt: row.pin_salt,
        pin_hash: row.pin_hash,
      }));

    return Response.json({ location: session.activeLocation, staff: roster });
  } catch (err) {
    return errorResponse(err);
  }
}
