'use client';

import { useAuthStore } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const roleHome: Record<string, string> = {
  pharmacist: '/pos',
  cashier: '/dashboard',
  general_manager: '/dashboard',
  admin: '/dashboard',
};

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(roleHome[user.role] || '/dashboard');
      return;
    }
    if (user && user.role === 'pharmacist' && pathname !== '/pos') {
      router.replace('/pos');
    }
  }, [hasHydrated, isAuthenticated, user, router, allowedRoles, pathname]);

  if (!hasHydrated) return null;
  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;
  if (user && user.role === 'pharmacist' && pathname !== '/pos') return null;

  return <>{children}</>;
}