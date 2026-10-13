import { useAuthStore } from '@/lib/auth';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// The session is an httpOnly cookie, so requests carry no token. The active
// location is sent as a header; the server checks it against the caller's
// assignments on every request.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = useAuthStore.getState().user;
  const headers = new Headers(init.headers);
  if (user?.locationId) headers.set('x-location-id', user.locationId);
  if (init.body !== undefined && !headers.has('content-type')) headers.set('content-type', 'application/json');

  const res = await fetch(path, { ...init, headers, cache: 'no-store', credentials: 'same-origin' });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}
