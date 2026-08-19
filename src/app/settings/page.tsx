'use client';

import { useState, useRef } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSettingsStore } from '@/lib/settings-store';
import { useAuthStore } from '@/lib/auth';
import { Settings, Store, Database, Bell, Shield, Upload, X, Image, User, Save, AlertTriangle, DollarSign, Tag, Plus, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const settings = useSettingsStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [newCategory, setNewCategory] = useState('');
  const [licenseNumber, setLicenseNumber] = useState(settings.licenseNumber);
  const [tagline, setTagline] = useState(settings.tagline);
  const [criticalDays, setCriticalDays] = useState(settings.expiryCriticalDays);
  const [warningDays, setWarningDays] = useState(settings.expiryWarningDays);
  const [exchangeRate, setExchangeRate] = useState(settings.exchangeRate);
  const [saved, setSaved] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      settings.setLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    settings.updateSettings({
      storeName, address, phone, email, licenseNumber, tagline,
      expiryCriticalDays: criticalDays, expiryWarningDays: warningDays,
      exchangeRate,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? `Logged in as ${user?.first_name} ${user?.last_name} (Admin)` : 'System settings'}
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <Save className="w-4 h-4" /> Saved!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Logo Upload */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary" />
                Store Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30 cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {settings.logoBase64 ? (
                    <img src={settings.logoBase64} alt="Store Logo" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mt-2">Click to upload</p>
                      <p className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> Upload
                  </Button>
                  {settings.logoBase64 && (
                    <Button variant="ghost" size="sm" onClick={() => settings.clearLogo()}>
                      <X className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  This logo appears on the login screen and sidebar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Store Name" id="store_name" value={storeName} onChange={e => setStoreName(e.target.value)} />
                  <Input label="Tagline" id="tagline" value={tagline} onChange={e => setTagline(e.target.value)} />
                  <Input label="Address" id="address" value={address} onChange={e => setAddress(e.target.value)} />
                  <Input label="Phone" id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                  <Input label="Email" id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="License Number" id="license" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exchange Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Exchange Rate — USD / SSP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set the current exchange rate. All prices display in both currencies using this rate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">1 USD = ? SSP</label>
                <input type="number" min={1} step={10} value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="flex h-12 w-full rounded-lg border border-border bg-white px-4 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Preview</p>
                <p className="text-lg font-bold text-primary">$1.00 = SSP {exchangeRate.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">$100.00 = SSP {(100 * exchangeRate).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">SSP {exchangeRate.toLocaleString()} = $1.00</p>
              </div>
              <div className="space-y-2">
                <Button onClick={handleSave}>Save Rate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Admin Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.first_name} {user?.last_name}</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry Alert Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Expiry Alert Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set how many days before expiry to trigger alerts. You can also enter a specific date for individual products.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Critical Alert (days before expiry)</label>
                <input type="number" min={1} max={3650} value={criticalDays} onChange={e => setCriticalDays(Number(e.target.value))} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-muted-foreground">Products expiring within this period show as <span className="text-danger font-medium">Critical</span></p>
                <div className="flex gap-2 flex-wrap">
                  {[7, 14, 30, 60, 90, 180, 365].map(d => (
                    <button key={d} onClick={() => setCriticalDays(d)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${criticalDays === d ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-muted-foreground border-border hover:border-red-300'}`}>
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">Warning Alert (days before expiry)</label>
                <input type="number" min={1} max={3650} value={warningDays} onChange={e => setWarningDays(Number(e.target.value))} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <p className="text-xs text-muted-foreground">Products expiring within this period show as <span className="text-yellow-600 font-medium">Warning</span></p>
                <div className="flex gap-2 flex-wrap">
                  {[30, 60, 90, 180, 365, 730, 1095].map(d => (
                    <button key={d} onClick={() => setWarningDays(d)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${warningDays === d ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-muted-foreground border-border hover:border-yellow-300'}`}>
                      {d >= 365 ? `${d/365} yr` : `${d} days`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-xs text-muted-foreground mt-1">
                Critical = expires within <span className="font-medium text-danger">{criticalDays} days</span> | 
                Warning = expires within <span className="font-medium text-yellow-600">{warningDays} days</span>
              </p>
            </div>
            <Button onClick={handleSave} className="mt-4">Save Alert Settings</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notifications */}
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

          {/* Product Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Product Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Manage the categories available when adding or filtering products in inventory.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newCategory.trim()) {
                      settings.addCategory(newCategory.trim());
                      setNewCategory('');
                    }
                  }}
                  className="flex-1 h-10 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  onClick={() => {
                    if (newCategory.trim()) {
                      settings.addCategory(newCategory.trim());
                      setNewCategory('');
                    }
                  }}
                  disabled={!newCategory.trim()}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {settings.categories.map(cat => (
                  <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    <button
                      onClick={() => settings.removeCategory(cat)}
                      className="p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {settings.categories.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No categories. Add one above.</p>
              )}
            </CardContent>
          </Card>

          {/* Data & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Data & Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium text-primary">Offline Storage</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All data is stored locally using IndexedDB. When online, changes sync automatically to Supabase.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm">Export Data</Button>
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
        </div>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
