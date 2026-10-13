import { errorResponse, HttpError, requireSession } from '@/lib/server/session';
import { pullTable } from '@/lib/server/sync';
import { isSyncTable } from '@/lib/sync-tables';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const table = new URL(req.url).searchParams.get('table') ?? '';
    if (!isSyncTable(table)) throw new HttpError(400, 'Unknown table');
    const session = await requireSession(req);
    const rows = await pullTable(session, table);
    return Response.json(rows);
  } catch (err) {
    return errorResponse(err);
  }
}
