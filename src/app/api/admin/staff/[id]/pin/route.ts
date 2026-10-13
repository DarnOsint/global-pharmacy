import { adminDb } from '@/lib/server/admin-db';
import { readJson, requireAdmin } from '@/lib/server/admin-guard';
import { errorResponse, HttpError } from '@/lib/server/session';
import { derivePinHash, isValidPin, isWeakPin, newPinSalt, verifyPin } from '@/lib/pin-hash';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sets a staff member's PIN. The PIN must be unique across all staff, because
// sign-in identifies the person from the PIN alone.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await ctx.params;
    if (!UUID_RE.test(id)) throw new HttpError(400, 'Invalid staff id');
    const body = await readJson(req);
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!isValidPin(pin)) throw new HttpError(400, 'PIN must be exactly 4 digits');
    if (isWeakPin(pin)) throw new HttpError(400, 'PIN is too easy to guess (repeated or consecutive digits)');

    const db = adminDb();
    const { data: staff, error: staffError } = await db.from('staff').select('id').eq('id', id).maybeSingle();
    if (staffError) throw new HttpError(500, staffError.message);
    if (!staff) throw new HttpError(404, 'Staff member not found');

    const { data: others, error: othersError } = await db
      .from('staff_pins')
      .select('staff_id, pin_salt, pin_hash')
      .neq('staff_id', id)
      .not('pin_hash', 'is', null);
    if (othersError) throw new HttpError(500, othersError.message);
    for (const row of others ?? []) {
      if (row.pin_salt && row.pin_hash && (await verifyPin(pin, row.pin_salt as string, row.pin_hash as string))) {
        throw new HttpError(409, 'Another staff member already uses this PIN');
      }
    }

    const salt = newPinSalt();
    const hash = await derivePinHash(pin, salt);
    const { error } = await db.from('staff_pins').upsert(
      { staff_id: id, pin: null, pin_salt: salt, pin_hash: hash, is_active: true },
      { onConflict: 'staff_id' }
    );
    if (error) throw new HttpError(500, error.message);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
