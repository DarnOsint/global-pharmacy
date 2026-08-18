'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  CreditCard, Users, BarChart3, AlertTriangle,
  Settings, X, Pill, LogOut
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/purchases', label: 'Purchases', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/hr', label: 'HR & Payroll', icon: Users },
  { href: '/alerts', label: 'Expiry Alerts', icon: AlertTriangle },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const roleBadge: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  pharmacist: 'bg-green-100 text-green-700',
  cashier: 'bg-yellow-100 text-yellow-700',
  store_manager: 'bg-blue-100 text-blue-700',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-sm leading-tight">Global Pharmacy</h1>
            <p className="text-[10px] text-white/60">Management System</p>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-white/10">
          {user && (
            <div className="flex items-center gap-3 px-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <div className="flex-1 text-xs min-w-0">
                <p className="font-medium truncate">{user.first_name} {user.last_name}</p>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5', roleBadge[user.role])}>
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
