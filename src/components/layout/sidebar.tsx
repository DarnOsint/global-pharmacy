'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth';
import { cn, daysUntilExpiry } from '@/lib/utils';
import { db } from '@/lib/db';
import {
  LayoutDashboard, Package, ShoppingCart, Receipt,
  CreditCard, Users, BarChart3, AlertTriangle,
  Settings, X, Pill, LogOut, ScanLine, Truck, UserCheck, FileText
} from 'lucide-react';

import { useSettingsStore } from '@/lib/settings-store';

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
  hasAlert?: boolean;
}

const navItems: NavItem[] = [
  { href: '/pos', label: 'POS', icon: ScanLine, roles: ['cashier'] },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { href: '/inventory', label: 'Inventory', icon: Package, roles: ['pharmacist', 'store_manager', 'admin'] },
  { href: '/sales', label: 'Sales', icon: ShoppingCart, roles: ['admin'] },
  { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['admin'] },
  { href: '/purchases', label: 'Purchases', icon: Receipt, roles: ['pharmacist', 'store_manager', 'admin'] },
  { href: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['pharmacist', 'store_manager', 'admin'] },
  { href: '/customers', label: 'Customers', icon: UserCheck, roles: ['admin'] },
  { href: '/expenses', label: 'Expenses', icon: CreditCard, roles: ['admin'] },
  { href: '/hr', label: 'HR & Payroll', icon: Users, roles: ['admin'] },
  { href: '/alerts', label: 'Expiry Alerts', icon: AlertTriangle, roles: ['pharmacist', 'store_manager', 'admin'], hasAlert: true },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
];

const roleBadge: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  pharmacist: 'bg-green-100 text-green-700',
  cashier: 'bg-yellow-100 text-yellow-700',
  store_manager: 'bg-blue-100 text-blue-700',
};

function countExpiryAlerts(products: { is_active: boolean; expiry_date: string; alert_days?: number }[]): number {
  return products.filter(p => p.is_active && daysUntilExpiry(p.expiry_date) <= (p.alert_days || 30)).length;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { user, logout } = useAuthStore();
  const settings = useSettingsStore();
  const [alertCount, setAlertCount] = useState(0);

  const visibleItems = user ? navItems.filter(item => item.roles.includes(user.role)) : [];

  useEffect(() => {
    const loadCount = async () => {
      try {
        const products = await db.products.toArray();
        setAlertCount(countExpiryAlerts(products));
      } catch { setAlertCount(0); }
    };
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center overflow-hidden">
            {settings.logoBase64 ? (
              <img src={settings.logoBase64} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Pill className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-sm leading-tight">{settings.storeName || 'Global Pharmacy'}</h1>
            <p className="text-[10px] text-white/60">Management System</p>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
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
                <span className="flex-1">{item.label}</span>
                {item.hasAlert && alertCount > 0 && (
                  <span className="flex items-center justify-center min-w-[22px] h-[22px] rounded-full bg-danger text-white text-[10px] font-bold px-1.5">
                    {alertCount}
                  </span>
                )}
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
