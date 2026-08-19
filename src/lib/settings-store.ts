import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  logoBase64: string | null;
  tagline: string;
  currency: 'SSP' | 'USD' | 'both';
  expiryCriticalDays: number;
  expiryWarningDays: number;
  exchangeRate: number;
  categories: string[];
}

interface SettingsStore extends StoreSettings {
  updateSettings: (settings: Partial<StoreSettings>) => void;
  setLogo: (base64: string) => void;
  clearLogo: () => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
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

const defaultSettings: StoreSettings = {
  storeName: 'Global Pharmacy',
  address: 'Juba, South Sudan',
  phone: '+211920123456',
  email: 'info@globalpharmacy.ss',
  licenseNumber: 'SSPHA/GP/2024/001',
  logoBase64: null,
  tagline: 'Your Trusted Pharmacy Partner',
  currency: 'both',
  expiryCriticalDays: 30,
  expiryWarningDays: 90,
  exchangeRate: 1550,
  categories: defaultCategories,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) =>
        set((state) => ({ ...state, ...settings })),
      setLogo: (base64) => set({ logoBase64: base64 }),
      clearLogo: () => set({ logoBase64: null }),
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
    }),
    {
      name: 'global-pharmacy-settings',
    }
  )
);
