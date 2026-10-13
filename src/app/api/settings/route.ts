import { adminDb } from '@/lib/server/admin-db';
import { errorResponse, HttpError, requireRole, requireSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

const SETTINGS_KEY = 'app-settings';

export async function GET(req: Request) {
  try {
    const session = await requireSession(req);
    const { data, error } = await adminDb()
      .from('settings')
      .select('value, updated_at')
      .eq('location_id', session.activeLocation.id)
      .eq('key', SETTINGS_KEY)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return Response.json(data ?? null);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireSession(req);
    requireRole(session.role, ['admin']);
    const body = (await req.json().catch(() => ({}))) as { value?: unknown; updated_at?: unknown };
    if (!body.value || typeof body.value !== 'object' || typeof body.updated_at !== 'string') {
      throw new HttpError(400, 'Invalid settings payload');
    }
    const { error } = await adminDb()
      .from('settings')
      .upsert(
        {
          location_id: session.activeLocation.id,
          key: SETTINGS_KEY,
          value: body.value,
          updated_at: body.updated_at,
        },
        { onConflict: 'location_id,key' }
      );
    if (error) throw new HttpError(400, error.message);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
