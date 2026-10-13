import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { adminDb } from '@/lib/server/admin-db';
import { OWNER_ROLES, type Role } from '@/lib/sync-tables';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = 'gp_session';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface LocationRef {
  id: string;
  code: string;
  name: string;
}

export interface Staff {
  staffId: string;
  firstName: string;
  lastName: string;
  role: Role;
  locations: LocationRef[];
}

export interface Session extends Staff {
  activeLocation: LocationRef;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error('SESSION_SECRET must be set to at least 32 characters');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function readToken(token: string): { sid: string; jti: string } | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sid?: string; jti?: string; exp?: number };
    if (!data.sid || !data.jti || !data.exp || data.exp < Date.now()) return null;
    return { sid: data.sid, jti: data.jti };
  } catch {
    return null;
  }
}

// The cookie is signed and httpOnly, and its id points at a row in auth_sessions
// so logout can revoke it server-side. SameSite=Strict keeps it off cross-site requests.
export async function sessionCookieFor(staffId: string): Promise<string> {
  const jti = randomUUID();
  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const { error } = await adminDb()
    .from('auth_sessions')
    .insert({ id: jti, staff_id: staffId, expires_at: new Date(expiresAt).toISOString() });
  if (error) throw new HttpError(500, error.message);

  const payload = Buffer.from(JSON.stringify({ sid: staffId, jti, exp: expiresAt })).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const maxAge = Math.floor(TOKEN_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

export function sessionTokenFrom(req: Request): { sid: string; jti: string } | null {
  const token = readCookie(req, SESSION_COOKIE);
  return token ? readToken(token) : null;
}

export async function revokeSession(req: Request): Promise<void> {
  const claims = sessionTokenFrom(req);
  if (!claims) return;
  await adminDb()
    .from('auth_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', claims.jti)
    .is('revoked_at', null);
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export async function allowedLocations(staffId: string, role: Role): Promise<LocationRef[]> {
  const db = adminDb();
  if (OWNER_ROLES.includes(role)) {
    const { data, error } = await db.from('locations').select('id, code, name').eq('is_active', true).order('code');
    if (error) throw new HttpError(500, error.message);
    return (data ?? []) as LocationRef[];
  }
  const { data, error } = await db
    .from('staff_locations')
    .select('locations!inner(id, code, name, is_active)')
    .eq('staff_id', staffId);
  if (error) throw new HttpError(500, error.message);
  return ((data ?? []) as unknown as { locations: LocationRef & { is_active: boolean } }[])
    .map((row) => row.locations)
    .filter((loc) => loc.is_active)
    .map(({ id, code, name }) => ({ id, code, name }));
}

// Identifies the caller from the session cookie. Every request is re-checked
// against the database, so deactivating a staff member or removing a location
// assignment takes effect immediately.
export async function requireStaff(req: Request): Promise<Staff> {
  const claims = sessionTokenFrom(req);
  if (!claims) throw new HttpError(401, 'Not signed in');

  const db = adminDb();
  const { data: session, error: sessionError } = await db
    .from('auth_sessions')
    .select('revoked_at, expires_at')
    .eq('id', claims.jti)
    .maybeSingle();
  if (sessionError) throw new HttpError(500, sessionError.message);
  if (!session || session.revoked_at || new Date(session.expires_at as string).getTime() < Date.now()) {
    throw new HttpError(401, 'Not signed in');
  }

  const { data: staff, error } = await db
    .from('staff')
    .select('id, first_name, last_name, role, is_active')
    .eq('id', claims.sid)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!staff || !staff.is_active) throw new HttpError(401, 'Account is inactive');

  const role = staff.role as Role;
  return {
    staffId: staff.id,
    firstName: staff.first_name,
    lastName: staff.last_name,
    role,
    locations: await allowedLocations(staff.id, role),
  };
}

// Same as requireStaff, plus the location the request is for. The requested
// location must be one the caller is assigned to.
export async function requireSession(req: Request): Promise<Session> {
  const staff = await requireStaff(req);
  const requested = req.headers.get('x-location-id');
  if (!requested) throw new HttpError(400, 'No location selected');
  const activeLocation = staff.locations.find((loc) => loc.id === requested);
  if (!activeLocation) throw new HttpError(403, 'You are not assigned to this location');
  return { ...staff, activeLocation };
}

export function requireRole(role: Role, roles: readonly Role[]): void {
  if (!roles.includes(role)) throw new HttpError(403, 'Your role cannot do this');
}

export function errorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: 'Server error' }, { status: 500 });
}
