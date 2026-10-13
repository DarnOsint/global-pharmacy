'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logLogin, logLogout } from '@/lib/audit';
import { AUTH_STORAGE_KEY } from '@/lib/location';

export interface LocationRef {
  id: string;
  code: string;
  name: string;
}

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  locationId: string;
  locations: LocationRef[];
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLocation: (locationId: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (user) => {
        logLogin(user.first_name, user.last_name, user.role);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        const current = useAuthStore.getState().user;
        if (current) logLogout(current.first_name, current.last_name, current.role);
        set({ user: null, isAuthenticated: false });
        void fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }).catch(() => {});
      },
      setLocation: (locationId) => {
        const current = useAuthStore.getState().user;
        if (!current || !current.locations.some((loc) => loc.id === locationId)) return;
        set({ user: { ...current, locationId } });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      // Only the session fields are persisted, never the hydration flag.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
