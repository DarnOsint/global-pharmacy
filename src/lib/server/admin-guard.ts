import { requireStaff, requireRole, HttpError, type Staff } from '@/lib/server/session';
import { OWNER_ROLES } from '@/lib/sync-tables';

// Cross-site views: admin and general manager.
export async function requireOwner(req: Request): Promise<Staff> {
  const staff = await requireStaff(req);
  requireRole(staff.role, OWNER_ROLES);
  return staff;
}

// Changes to locations, assignments and PINs: admin only.
export async function requireAdmin(req: Request): Promise<Staff> {
  const staff = await requireStaff(req);
  requireRole(staff.role, ['admin']);
  return staff;
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Invalid request body');
  return body as Record<string, unknown>;
}
