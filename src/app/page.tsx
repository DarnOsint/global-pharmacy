'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Delete, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import { useSettingsStore } from '@/lib/settings-store';
import { CybervilleCredit } from '@/components/cyberville-brand';
import { HOME_BY_ROLE, completeSignIn, signInWithPin, type PinSession } from '@/lib/pin-login';

export default function PinLoginPage() {
  const router = useRouter();
  const settings = useSettingsStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [errorNonce, setErrorNonce] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PinSession | null>(null);
  const { isAuthenticated, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return;
    router.replace(HOME_BY_ROLE[user.role] || '/dashboard');
  }, [hasHydrated, isAuthenticated, user, router]);

  const fail = useCallback((message: string) => {
    setError(message);
    setErrorNonce((n) => n + 1);
    setPin('');
  }, []);

  const submit = useCallback(async (value: string) => {
    setLoading(true);
    setError('');
    const result = await signInWithPin(value);
    if ('error' in result) {
      fail(result.error);
      setLoading(false);
      return;
    }
    const { session } = result;
    if (session.locations.length === 0) {
      fail('No location is assigned to this account. Contact your administrator.');
      setLoading(false);
      return;
    }
    if (session.locations.length === 1) {
      try {
        await completeSignIn(session, session.locations[0].id);
      } catch (e) {
        fail(e instanceof Error ? e.message : 'Sign-in failed.');
        setLoading(false);
      }
      return;
    }
    setPending(session);
    setLoading(false);
  }, [fail]);

  const chooseLocation = useCallback(async (locationId: string) => {
    if (!pending) return;
    setLoading(true);
    try {
      await completeSignIn(pending, locationId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.');
      setLoading(false);
    }
  }, [pending]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4 || loading) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');
    if (newPin.length === 4) {
      setTimeout(() => submit(newPin), 150);
    }
  }, [pin, loading, submit]);

  const handleDelete = useCallback(() => {
    setPin((p) => p.slice(0, -1));
    setError('');
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  useEffect(() => {
    if (pending) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, pending]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

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
            Cyberville.tech — Software Development · Juba, South Sudan
          </p>
        </div>

        {/* Store / PIN card */}
        <div className="bg-gradient-to-b from-[#123a72] via-[#0e2a57] to-[#0a1120] border border-white/10 rounded-3xl p-8 shadow-[0_20px_60px_rgba(10,17,32,0.45)] cv-fade-up" style={{ animationDelay: '0.08s' }}>
          {/* Store logo — square gradient frame around the white logo */}
          <div className="relative mx-auto w-28 h-28 mb-6">
            <div
              className="absolute inset-0 rounded-2xl cv-spin-slow"
              style={{ background: 'conic-gradient(from 0deg, #f97316, #2f6fd6, #22b7ef, #2f6fd6, #f97316)' }}
            />
            <div className="absolute inset-1.5 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
              {settings.logoBase64 ? (
                <img src={settings.logoBase64} alt="Store logo" className="w-20 h-20 object-contain" />
              ) : (
                <Pill className="w-10 h-10 text-[#fb923c]" />
              )}
            </div>
          </div>

          {pending ? (
            <>
              <div className="text-center mb-5">
                <p className="text-white/60 text-sm">Choose the location to open</p>
              </div>
              <div className="space-y-3">
                {pending.locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => chooseLocation(loc.id)}
                    disabled={loading}
                    className="w-full h-14 px-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold flex items-center gap-3 transition-all hover:bg-white/15 active:scale-95 disabled:opacity-40"
                  >
                    <MapPin className="w-5 h-5 text-[#fb923c]" />
                    {loc.name}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setPending(null); setPin(''); setError(''); }}
                disabled={loading}
                className="w-full mt-5 text-sm text-white/50 hover:text-white"
              >
                Back
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-5">
                <p className="text-white/60 text-sm">
                  {loading ? 'Verifying...' : 'Enter your 4-digit PIN to sign in'}
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

              {error && (
                <div className="flex items-center justify-center gap-2 mt-5 text-sm text-red-400 cv-pop">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </>
          )}

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
