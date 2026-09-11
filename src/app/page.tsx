'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Delete, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore, type AuthUser } from '@/lib/auth';
import { seedAuthDb, verifyPinOffline } from '@/lib/auth-db';
import { useSettingsStore } from '@/lib/settings-store';
import { CybervilleCredit } from '@/components/cyberville-brand';

export default function PinLoginPage() {
  const router = useRouter();
  const settings = useSettingsStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { login, isAuthenticated, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    seedAuthDb().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;
    const roleHome: Record<string, string> = { pharmacist: '/pos', cashier: '/inventory', store_manager: '/inventory', admin: '/dashboard' };
    router.replace(roleHome[user.role] || '/dashboard');
  }, [hasHydrated, isAuthenticated, user, router]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      if (newPin.length === 4) {
        setLoading(true);
        setTimeout(async () => {
          const staff = await verifyPinOffline(newPin);
          if (staff) {
            const user: AuthUser = {
              id: staff.id,
              first_name: staff.first_name,
              last_name: staff.last_name,
              role: staff.role,
              pin: staff.pin,
            };
            login(user);
            const roleHome: Record<string, string> = { pharmacist: '/pos', cashier: '/inventory', store_manager: '/inventory', admin: '/dashboard' };
            router.push(roleHome[user.role] || '/dashboard');
          } else {
            setError('Invalid PIN. Please try again.');
            setPin('');
          }
          setLoading(false);
        }, 300);
      }
    }
  }, [pin, login]);

  const handleDelete = useCallback(() => {
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#05070f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#22b7ef] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070f] text-[#e6edf7] overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Cyberville theme backdrop: radial glows + subtle grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[-160px] right-[-10%] w-[700px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(34,183,239,0.13),transparent_60%)]" />
        <div className="absolute top-[25%] left-[-15%] w-[600px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(47,111,214,0.16),transparent_60%)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Cyberville branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/cyberville/logo-mark.png"
              alt="Cyberville logo"
              className="w-10 h-10 object-contain"
            />
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#35c8f5,#2f6fd6)] text-[1.35rem] font-extrabold tracking-tight">
              Cyberville
            </span>
          </div>
          <p className="text-[#94a3b8] text-xs tracking-wide">
            Software Development · Juba, South Sudan
          </p>
        </div>

        {/* Store / PIN card */}
        <div className="bg-[#0c1322]/90 border border-[rgba(148,163,184,0.14)] rounded-2xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-[#101a30] border border-[rgba(148,163,184,0.14)] mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {settings.logoBase64 ? (
                <img src={settings.logoBase64} alt="Store logo" className="w-full h-full object-contain" />
              ) : (
                <Pill className="w-7 h-7 text-[#22b7ef]" />
              )}
            </div>
            <h1 className="text-xl font-bold text-[#e6edf7]">{settings.storeName || 'Global Pharmacy'}</h1>
            <p className="text-[#94a3b8] text-sm mt-1">Enter your PIN to sign in</p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-[linear-gradient(90deg,#35c8f5,#2f6fd6)] scale-110'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center justify-center gap-2 mb-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center mb-4">
              <Loader2 className="w-6 h-6 text-[#22b7ef] animate-spin" />
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />;
              if (d === 'del') {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    className="h-16 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-[#e6edf7] flex items-center justify-center transition-colors"
                  >
                    <Delete className="w-6 h-6" />
                  </button>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  disabled={loading || pin.length >= 4}
                  className="h-16 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:scale-95 text-[#e6edf7] text-2xl font-semibold flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-[#94a3b8]/70 text-xs mt-6">
          Offline capable — works without internet
        </p>

        <CybervilleCredit className="text-[#94a3b8]/50 mt-3" />
      </div>
    </div>
  );
}
