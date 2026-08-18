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
}

interface SettingsStore extends StoreSettings {
  updateSettings: (settings: Partial<StoreSettings>) => void;
  setLogo: (base64: string) => void;
  clearLogo: () => void;
}

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
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      updateSettings: (settings) =>
        set((state) => ({ ...state, ...settings })),
      setLogo: (base64) => set({ logoBase64: base64 }),
      clearLogo: () => set({ logoBase64: null }),
    }),
    {
      name: 'global-pharmacy-settings',
    }
  )
);
