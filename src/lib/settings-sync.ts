'use client';

import { apiFetch } from '@/lib/api';
import { useSettingsStore, type StoreSettings } from '@/lib/settings-store';
import { useAuthStore } from '@/lib/auth';

const LAST_SYNC_LS = 'gp-settings-last-synced-at';

type SyncableSettings = Omit<StoreSettings, 'updatedAt'>;

const SYNC_FIELDS: (keyof SyncableSettings)[] = [
  'storeName',
  'address',
  'phone',
  'secondaryPhone',
  'email',
  'licenseNumber',
  'tagline',
  'currency',
  'expiryCriticalDays',
  'expiryWarningDays',
  'exchangeRate',
  'categories',
  'roles',
  'logoBase64',
];

function getLastSyncedAt(): number {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(LAST_SYNC_LS);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

function setLastSyncedAt(ts: number) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_SYNC_LS, String(ts));
}

function toValue(s: StoreSettings): Record<string, unknown> {
  const value: Record<string, unknown> = {};
  for (const field of SYNC_FIELDS) value[field] = s[field];
  return value;
}

export async function syncSettings(): Promise<string | null> {
  try {
    const isAdmin = useAuthStore.getState().user?.role === 'admin';
    const settings = useSettingsStore.getState();
    const localUpdatedAt = settings.updatedAt || 0;
    let lastSynced = getLastSyncedAt();

    if (isAdmin && localUpdatedAt > lastSynced) {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          value: toValue(settings),
          updated_at: new Date(localUpdatedAt).toISOString(),
        }),
      });
      setLastSyncedAt(localUpdatedAt);
      lastSynced = localUpdatedAt;
    }

    const data = await apiFetch<{ value: unknown; updated_at: string } | null>('/api/settings');

    if (data) {
      const remoteTs = new Date(data.updated_at).getTime();
      // Compare against the local settings version (not the lastSynced marker)
      // so devices with a stuck marker or clock skew still receive updates.
      const latestLocal = useSettingsStore.getState().updatedAt || 0;
      if (remoteTs > latestLocal) {
        const remote = (data.value || {}) as Record<string, unknown>;
        const patch: Partial<StoreSettings> = {};
        for (const field of SYNC_FIELDS) {
          const val = remote[field];
          if (val !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (patch as any)[field] = val as any;
          }
        }
        useSettingsStore.setState({ ...patch, updatedAt: remoteTs });
        setLastSyncedAt(remoteTs);
      }
    }

    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}