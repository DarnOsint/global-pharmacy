'use client';

import { useAuthStore, type AuthUser, type LocationRef } from '@/lib/auth';
import { cacheRoster, offlineSignIn } from '@/lib/auth-db';
import { switchLocationDb } from '@/lib/db';
import { isValidPin } from '@/lib/pin-hash';

const DEVICE_KEY = 'gp-device-id';

export interface PinSession {
  staff: { id: string; first_name: string; last_name: string; role: string };
  locations: LocationRef[];
}

export const HOME_BY_ROLE: Record<string, string> = {
  pharmacist: '/pos',
  cashier: '/dashboard',
  general_manager: '/dashboard',
  admin: '/dashboard',
};

function deviceId(): string {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export async function signInWithPin(pin: string): Promise<{ session: PinSession } | { error: string }> {
  if (!isValidPin(pin)) return { error: 'Enter your 4-digit PIN.' };

  if (navigator.onLine) {
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pin, deviceId: deviceId() }),
        cache: 'no-store',
      });
      if (res.ok) return { session: (await res.json()) as PinSession };
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 401) return { error: 'Invalid PIN. Please try again.' };
      if (res.status === 429 || res.status === 403) return { error: body.error ?? 'Sign-in is not allowed.' };
      // Other server errors fall through to the offline cache.
    } catch {
      // Network failed mid-request: fall back to the offline cache below.
    }
  }

  const offline = await offlineSignIn(pin);
  if (offline.status === 'ok') return { session: { staff: offline.staff, locations: offline.locations } };
  if (offline.status === 'locked') {
    const minutes = Math.ceil((offline.until - Date.now()) / 60000);
    return { error: `Too many wrong PINs on this device. Try again in ${minutes} min, or connect to the internet.` };
  }
  return {
    error: navigator.onLine
      ? 'Sign-in failed. Please try again.'
      : 'Offline: connect to the internet to sign in on this device.',
  };
}

// Stores the session for the chosen location, switches to that location's local
// databases, caches the roster for offline use, and reloads into the app.
export async function completeSignIn(session: PinSession, locationId: string): Promise<void> {
  const location = session.locations.find((loc) => loc.id === locationId);
  if (!location) throw new Error('Location not available for this account');

  switchLocationDb(location.id);

  const user: AuthUser = {
    id: session.staff.id,
    first_name: session.staff.first_name,
    last_name: session.staff.last_name,
    role: session.staff.role,
    locationId: location.id,
    locations: session.locations,
  };
  useAuthStore.getState().login(user);

  try {
    await cacheRoster();
  } catch {
    // Offline or transient: the roster is refreshed on the next online sign-in.
  }

  window.location.assign(HOME_BY_ROLE[user.role] ?? '/dashboard');
}
