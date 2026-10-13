export const AUTH_STORAGE_KEY = 'global-pharmacy-auth';

// Read synchronously at module load so each location's local databases are
// opened before any page reads them. The value is written by the sign-in flow
// before the page reloads.
export function currentLocationId(): string {
  if (typeof window === 'undefined') return 'none';
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const id = raw ? (JSON.parse(raw)?.state?.user?.locationId as string | undefined) : undefined;
    return id || 'none';
  } catch {
    return 'none';
  }
}

export const GUDELE_LOCATION_ID = 'c1000000-0000-4000-8000-000000000001';

// Gudele already has unsynced data in the original database names. Keep them so
// pending offline sales are not stranded when the app is updated.
export function localDbSuffix(locationId: string, legacyName: string): string {
  return locationId === GUDELE_LOCATION_ID ? legacyName : `${legacyName}:${locationId}`;
}
