'use client';

import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import DashboardContent from '@/components/dashboard-content';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back to Global Pharmacy</p>
          </div>
          <DashboardContent />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
