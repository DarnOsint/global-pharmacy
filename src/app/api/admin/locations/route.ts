import { adminDb } from '@/lib/server/admin-db';
import { readJson, requireAdmin, requireOwner } from '@/lib/server/admin-guard';
import { errorResponse, HttpError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{1,29}$/;

export async function GET(req: Request) {
  try {
    await requireOwner(req);
    const { data, error } = await adminDb()
      .from('locations')
      .select('id, code, name, is_active, created_at')
      .order('code');
    if (error) throw new HttpError(500, error.message);
    return Response.json(data ?? []);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const body = await readJson(req);
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!CODE_RE.test(code)) throw new HttpError(400, 'Code: 2–30 letters, digits or hyphens');
    if (!name || name.length > 120) throw new HttpError(400, 'Name is required');

    const { data, error } = await adminDb()
      .from('locations')
      .insert({ code, name })
      .select('id, code, name, is_active, created_at')
      .single();
    if (error) throw new HttpError(400, error.code === '23505' ? 'That location code already exists' : error.message);
    return Response.json(data, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin(req);
    const body = await readJson(req);
    if (typeof body.id !== 'string') throw new HttpError(400, 'Missing location id');
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') {
      const name = body.name.trim();
      if (!name || name.length > 120) throw new HttpError(400, 'Name is required');
      updates.name = name;
    }
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    if (Object.keys(updates).length === 0) throw new HttpError(400, 'Nothing to update');

    const { data, error } = await adminDb()
      .from('locations')
      .update(updates)
      .eq('id', body.id)
      .select('id, code, name, is_active, created_at')
      .maybeSingle();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Location not found');
    return Response.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
