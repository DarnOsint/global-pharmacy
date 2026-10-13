import { clearSessionCookie, errorResponse, revokeSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await revokeSession(req);
    const res = Response.json({ ok: true });
    res.headers.append('set-cookie', clearSessionCookie());
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
