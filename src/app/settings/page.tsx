'use client';

import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Store, Database, Bell, Shield, Download } from 'lucide-react';

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-sm text-muted-foreground">Configure Global Pharmacy system settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <Input label="Store Name" id="store_name" defaultValue="Global Pharmacy" />
                <Input label="Address" id="address" defaultValue="123 Pharmacy Road, Lagos" />
                <Input label="Phone" id="phone" defaultValue="08012345678" />
                <Input label="Email" id="email" type="email" defaultValue="info@globalpharmacy.com" />
                <Input label="License Number" id="license" defaultValue="PCN/GP/2024/001" />
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Data & Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary-50 border border-primary-200">
                  <p className="text-sm font-medium text-primary">Offline Storage</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All data is stored locally using IndexedDB. When online, changes sync automatically to Supabase.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" /> Export Data
                    </Button>
                    <Button variant="outline" size="sm">Import Data</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">Auto-sync</p>
                    <p className="text-xs text-muted-foreground">Sync data when online</p>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium">Backup reminders</p>
                    <p className="text-xs text-muted-foreground">Remind to backup data weekly</p>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                    <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Low stock alerts', desc: 'Notify when products fall below reorder level', on: true },
                  { label: 'Expiry warnings', desc: 'Alert for products expiring within 30 days', on: true },
                  { label: 'Daily sales summary', desc: 'End-of-day sales recap', on: false },
                  { label: 'Purchase order updates', desc: 'Status changes on POs', on: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative cursor-pointer ${item.on ? 'bg-primary' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow ${item.on ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input label="Current Password" id="current_pwd" type="password" />
                <Input label="New Password" id="new_pwd" type="password" />
                <Input label="Confirm Password" id="confirm_pwd" type="password" />
                <Button>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
