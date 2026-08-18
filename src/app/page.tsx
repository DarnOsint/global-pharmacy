'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Delete, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore, type AuthUser } from '@/lib/auth';
import { seedAuthDb, verifyPinOffline } from '@/lib/auth-db';

export default function PinLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { login } = useAuthStore();

  useEffect(() => {
    seedAuthDb().then(() => setReady(true));
  }, []);

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
            router.push('/dashboard');
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
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-accent mx-auto mb-5 flex items-center justify-center shadow-lg">
            <Pill className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Global Pharmacy</h1>
          <p className="text-white/60 text-sm mt-1">Enter your PIN to start</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {/* PIN dots */}
          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-accent scale-110'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center justify-center gap-2 mb-4 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center mb-4">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
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
                    className="h-16 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
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
                  className="h-16 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-2xl font-semibold flex items-center justify-center transition-all disabled:opacity-50"
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Offline capable — works without internet
        </p>
      </div>
    </div>
  );
}
