'use client';

import { useAuthStore } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const roleHome: Record<string, string> = {
  cashier: '/pos',
  pharmacist: '/inventory',
  store_manager: '/inventory',
  admin: '/dashboard',
};

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(roleHome[user.role] || '/dashboard');
    }
  }, [hasHydrated, isAuthenticated, user, router, allowedRoles]);

  if (!hasHydrated) return null;
  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}