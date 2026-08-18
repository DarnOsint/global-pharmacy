'use client';

import { useEffect } from 'react';
import { Pill, ShoppingCart, Package, CreditCard, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';

export default function Home() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
          <Pill className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Global Pharmacy</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Complete pharmacy management system with inventory tracking, sales,
          expense management, payroll, and expiry alerts.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
          {[
            { icon: Package, label: 'Inventory', href: '/inventory' },
            { icon: ShoppingCart, label: 'Sales', href: '/sales' },
            { icon: CreditCard, label: 'Expenses', href: '/expenses' },
            { icon: AlertTriangle, label: 'Alerts', href: '/alerts' },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:bg-primary-50 hover:border-primary transition-colors"
            >
              <item.icon className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
