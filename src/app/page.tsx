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
  const [errorNonce, setErrorNonce] = useState(0);
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
            setErrorNonce((n) => n + 1);
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#2f6fd6] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white text-[#0c1322] overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Cyberville theme backdrop on white: soft blue glows + subtle grid */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute top-[-160px] right-[-10%] w-[700px] h-[420px] rounded-full bg-[radial-gradient(circle,rgba(34,183,239,0.09),transparent_60%)]" />
        <div className="absolute top-[25%] left-[-15%] w-[600px] h-[440px] rounded-full bg-[radial-gradient(circle,rgba(47,111,214,0.10),transparent_60%)]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 30%, black 40%, transparent 100%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Cyberville branding */}
        <div className="text-center mb-8 cv-fade-up">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
              <img
                src="/cyberville/logo-mark.png"
                alt="Cyberville logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#35c8f5,#2f6fd6)] text-[1.35rem] font-extrabold tracking-tight">
              Cyberville
            </span>
          </div>
          <p className="text-[#64748b] text-xs tracking-wide">
            Software Development · Juba, South Sudan
          </p>
        </div>

        {/* Store / PIN card */}
        <div className="bg-gradient-to-b from-[#123a72] via-[#0e2a57] to-[#0a1120] border border-white/10 rounded-3xl p-8 shadow-[0_20px_60px_rgba(10,17,32,0.45)] cv-fade-up" style={{ animationDelay: '0.08s' }}>
          {/* Store logo — transparent logo inside a hollow rotating ring */}
          <div className="relative mx-auto w-28 h-28 mb-6">
            <svg
              className="absolute inset-0 w-full h-full cv-spin-slow"
              viewBox="0 0 120 120"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="login-ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="35%" stopColor="#2f6fd6" />
                  <stop offset="70%" stopColor="#22b7ef" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="url(#login-ring-grad)"
                strokeWidth="8"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {settings.logoBase64 ? (
                <div className="w-20 h-20 rounded-lg bg-white flex items-center justify-center overflow-hidden shadow-sm">
                  <img src={settings.logoBase64} alt="Store logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <Pill className="w-10 h-10 text-[#fb923c]" />
              )}
            </div>
          </div>

          <div className="text-center mb-7">
            <p className="text-white/60 text-sm">
              {loading ? 'Verifying your PIN...' : 'Enter your 4-digit PIN to sign in'}
            </p>
          </div>

          {/* PIN dots */}
          <div
            key={errorNonce}
            className={`flex justify-center gap-4 mb-6 ${errorNonce > 0 ? 'cv-shake' : ''}`}
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 w-4 rounded-full transition-all duration-300 ${
                  i < pin.length
                    ? 'cv-pop bg-[linear-gradient(135deg,#f97316,#fb923c)] shadow-[0_0_14px_rgba(249,115,22,0.55)]'
                    : 'border-2 border-white/20 bg-white/5'
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center justify-center gap-2 mb-5 text-sm text-red-400 cv-pop">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center gap-2 mb-5 text-sm text-[#fb923c]">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying…
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
                    disabled={loading}
                    className="h-16 rounded-2xl bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 hover:brightness-110"
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
                  className="h-16 rounded-2xl bg-[linear-gradient(135deg,#f97316,#ea580c)] text-white text-2xl font-semibold flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 hover:brightness-110 shadow-[0_6px_18px_rgba(249,115,22,0.35)]"
                >
                  {d}
                </button>
              );
            })}
          </div>

          <p className="text-center text-white/40 text-xs mt-5">
            Forgot your PIN? Contact your administrator.
          </p>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6 cv-fade-up" style={{ animationDelay: '0.16s' }}>
          Offline capable — works without internet
        </p>

        <CybervilleCredit className="text-slate-400 mt-3 cv-fade-up" style={{ animationDelay: '0.22s' }} />
      </div>
    </div>
  );
}
