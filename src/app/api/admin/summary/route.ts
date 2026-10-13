import { adminDb } from '@/lib/server/admin-db';
import { requireOwner } from '@/lib/server/admin-guard';
import { errorResponse, HttpError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

function parseDate(value: string | null, fallback: Date): string {
  if (!value) return fallback.toISOString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new HttpError(400, 'Invalid date');
  return d.toISOString();
}

// Cross-site totals for the owners' dashboard. Amounts are grouped by currency;
// they are not converted, so SSP and USD are never added together.
export async function GET(req: Request) {
  try {
    await requireOwner(req);
    const url = new URL(req.url);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const from = parseDate(url.searchParams.get('from'), startOfMonth);
    const to = parseDate(url.searchParams.get('to'), new Date(now.getTime() + 24 * 60 * 60 * 1000));
    if (from >= to) throw new HttpError(400, 'The start date must be before the end date');

    const { data, error } = await adminDb().rpc('location_summary', { p_from: from, p_to: to });
    if (error) throw new HttpError(500, error.message);
    return Response.json({ from, to, locations: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}
