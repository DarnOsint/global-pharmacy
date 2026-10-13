import { adminDb } from '@/lib/server/admin-db';
import { readJson, requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse, HttpError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Replaces the staff member's location assignments. Owners (admin, general
// manager) see every location by role, so the list mainly drives pharmacists
// and cashiers.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    if (!UUID_RE.test(id)) throw new HttpError(400, 'Invalid staff id');
    const body = await readJson(req);
    const ids = Array.isArray(body.location_ids) ? body.location_ids : null;
    if (!ids || !ids.every((x) => typeof x === 'string' && UUID_RE.test(x))) {
      throw new HttpError(400, 'location_ids must be a list of location ids');
    }
    const unique = [...new Set(ids as string[])];

    const db = adminDb();
    const { data: staff, error: staffError } = await db.from('staff').select('id').eq('id', id).maybeSingle();
    if (staffError) throw new HttpError(500, staffError.message);
    if (!staff) throw new HttpError(404, 'Staff member not found');

    if (unique.length > 0) {
      const { data: found, error: locError } = await db.from('locations').select('id').in('id', unique);
      if (locError) throw new HttpError(500, locError.message);
      if ((found ?? []).length !== unique.length) throw new HttpError(400, 'One or more locations do not exist');
    }

    const { error: delError } = await db.from('staff_locations').delete().eq('staff_id', id);
    if (delError) throw new HttpError(500, delError.message);
    if (unique.length > 0) {
      const { error: insError } = await db
        .from('staff_locations')
        .insert(unique.map((location_id) => ({ staff_id: id, location_id })));
      if (insError) throw new HttpError(400, insError.message);
    }
    return Response.json({ ok: true, location_ids: unique });
  } catch (err) {
    return errorResponse(err);
  }
}
