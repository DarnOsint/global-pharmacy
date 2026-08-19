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
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/');
      return;
    }
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(roleHome[user.role] || '/dashboard');
    }
  }, [isAuthenticated, user, router, allowedRoles]);

  if (!isAuthenticated) return null;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
