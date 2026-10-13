import { errorResponse, requireSession } from '@/lib/server/session';
import { pushMutation } from '@/lib/server/sync';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await requireSession(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    await pushMutation(session, body);
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
