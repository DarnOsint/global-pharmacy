import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createIdbStorage } from '@/lib/idb-storage';
import { logSettingsChange } from '@/lib/audit';

export interface RoleConfig {
  id: string;
  name: string;
  color: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  secondaryPhone: string;
  email: string;
  licenseNumber: string;
  logoBase64: string | null;
  tagline: string;
  currency: 'SSP' | 'USD' | 'both';
  expiryCriticalDays: number;
  expiryWarningDays: number;
  exchangeRate: number;
  categories: string[];
  roles: RoleConfig[];
  updatedAt: number;
}

interface SettingsStore extends StoreSettings {
  updateSettings: (settings: Partial<StoreSettings>) => void;
  setLogo: (base64: string) => void;
  clearLogo: () => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  addRole: (role: RoleConfig) => void;
  updateRole: (id: string, patch: Partial<RoleConfig>) => void;
  removeRole: (id: string) => void;
}

const defaultCategories = [
  'antibiotics',
  'analgesics',
  'vitamins',
  'diabetes',
  'cardiovascular',
  'gastrointestinal',
  'respiratory',
  'dermatology',
  'other',
];

const defaultRoles: RoleConfig[] = [
  { id: 'admin', name: 'Admin', color: 'info' },
  { id: 'pharmacist', name: 'Pharmacist', color: 'success' },
  { id: 'cashier', name: 'Cashier', color: 'warning' },
  { id: 'general_manager', name: 'General Manager', color: 'default' },
];

const defaultSettings: StoreSettings = {
  storeName: 'Global Pharmacy',
  address: 'Juba, South Sudan',
  phone: '+211929420661',
  secondaryPhone: '+211922770757',
  email: 'info@globalpharmacy.ss',
  licenseNumber: 'SSPHA/GP/2024/001',
  logoBase64: null,
  tagline: 'Your Trusted Pharmacy Partner',
  currency: 'both',
  expiryCriticalDays: 30,
  expiryWarningDays: 90,
  exchangeRate: 1550,
  categories: defaultCategories,
  roles: defaultRoles,
  updatedAt: 0,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) =>
        set((state) => {
          const changed = Object.fromEntries(
            Object.entries(settings).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify((state as unknown as Record<string, unknown>)[k]))
          );
          const next = { ...state, ...settings, updatedAt: Date.now() };
          if (Object.keys(changed).length > 0) {
            const oldSnapshot = Object.fromEntries(Object.keys(changed).map((k) => [k, (state as unknown as Record<string, unknown>)[k]]));
            logSettingsChange(oldSnapshot, changed);
          }
          return next;
        }),
      setLogo: (base64) => set((state) => {
        logSettingsChange({ logoBase64: state.logoBase64 }, { logoBase64: base64 });
        return { logoBase64: base64, updatedAt: Date.now() };
      }),
      clearLogo: () => set((state) => {
        logSettingsChange({ logoBase64: state.logoBase64 }, { logoBase64: null });
        return { logoBase64: null, updatedAt: Date.now() };
      }),
      addCategory: (name) =>
        set((state) => {
          const slug = name.toLowerCase().trim();
          if (!slug || state.categories.includes(slug)) return state;
          return { ...state, categories: [...state.categories, slug] };
        }),
      removeCategory: (name) =>
        set((state) => ({
          ...state,
          categories: state.categories.filter((c) => c !== name),
        })),
      addRole: (role) =>
        set((state) => {
          if (state.roles.some((r) => r.id === role.id)) return state;
          logSettingsChange({ roles: state.roles }, { roles: [...state.roles, role] });
          return { ...state, roles: [...state.roles, role], updatedAt: Date.now() };
        }),
      updateRole: (id, patch) =>
        set((state) => {
          logSettingsChange(
            { roles: state.roles },
            { roles: state.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)) }
          );
          return {
            ...state,
            roles: state.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
            updatedAt: Date.now(),
          };
        }),
      removeRole: (id) =>
        set((state) => {
          logSettingsChange({ roles: state.roles }, { roles: state.roles.filter((r) => r.id !== id) });
          return {
            ...state,
            roles: state.roles.filter((r) => r.id !== id),
            updatedAt: Date.now(),
          };
        }),
    }),
    {
      name: 'global-pharmacy-settings',
      storage: createJSONStorage(() => createIdbStorage()),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<StoreSettings>) };
        merged.roles = (merged.roles || []).map((r) =>
          r.id === 'store_manager'
            ? { ...r, id: 'general_manager', name: r.name === 'Store Manager' ? 'General Manager' : r.name }
            : r
        );
        return merged;
      },
    }
  )
);
