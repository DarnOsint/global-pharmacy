import { errorResponse, requireStaff } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const staff = await requireStaff(req);
    return Response.json({ staffId: staff.staffId });
  } catch (err) {
    return errorResponse(err);
  }
}
