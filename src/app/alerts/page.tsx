'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, Package } from 'lucide-react';
import { getAllProducts } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import { useSettingsStore } from '@/lib/settings-store';
import { formatDate, daysUntilExpiry, formatCurrencyPair } from '@/lib/utils';
import type { Product } from '@/types/database';

export default function AlertsPage() {
  const settings = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDays, setFilterDays] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    await seedOfflineData();
    const data = await getAllProducts();
    setProducts(data.filter(p => p.is_active));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getAlertDays = (p: Product) => p.alert_days || settings.expiryCriticalDays;

  const expired = products.filter(p => daysUntilExpiry(p.expiry_date) <= 0);
  const critical = products.filter(p => {
    const d = daysUntilExpiry(p.expiry_date);
    return d > 0 && d <= getAlertDays(p);
  });
  const warning = products.filter(p => {
    const d = daysUntilExpiry(p.expiry_date);
    return d > getAlertDays(p) && d <= getAlertDays(p) * 3;
  });

  const filtered = filterDays !== null
    ? products.filter(p => daysUntilExpiry(p.expiry_date) <= filterDays && daysUntilExpiry(p.expiry_date) > 0)
    : [];

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Expiry Alerts</h1>
          <p className="text-sm text-muted-foreground">Track and manage product expiry dates</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{expired.length}</p>
              <p className="text-xs text-red-500">Expired</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-600">{critical.length}</p>
              <p className="text-xs text-orange-500">Critical</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-yellow-600">{warning.length}</p>
              <p className="text-xs text-yellow-500">Warning</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{products.length}</p>
              <p className="text-xs text-green-500">Total Tracked</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[7, 14, 30, 60, 90, 180, 365].map(d => (
            <button key={d} onClick={() => setFilterDays(filterDays === d ? null : d)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterDays === d ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {d <= 30 ? `${d} days` : d <= 365 ? `${d / 30} months` : `${d / 365} year`}
            </button>
          ))}
          {filterDays !== null && <button onClick={() => setFilterDays(null)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200">Clear</button>}
        </div>

        {filterDays !== null && filtered.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Expiring within {filterDays} days</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Expiry</th>
                    <th className="text-right p-3 font-medium">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.sort((a, b) => daysUntilExpiry(a.expiry_date) - daysUntilExpiry(b.expiry_date)).map(p => {
                    const days = daysUntilExpiry(p.expiry_date);
                    return (
                      <tr key={p.id} className="border-b border-border">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-muted-foreground text-xs">{p.batch_number}</td>
                        <td className="p-3 text-right">{p.quantity_in_stock}</td>
                        <td className="p-3">{formatDate(p.expiry_date)}</td>
                        <td className="p-3 text-right"><Badge variant={days <= 7 ? 'danger' : days <= 30 ? 'warning' : 'info'}>{days}d</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {expired.length > 0 && (
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Expired ({expired.length})</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-red-50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Expired On</th>
                    <th className="text-right p-3 font-medium">Days Overdue</th>
                  </tr>
                </thead>
                <tbody>
                  {expired.map(p => (
                    <tr key={p.id} className="border-b border-border bg-red-50/50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{p.batch_number}</td>
                      <td className="p-3 text-right">{p.quantity_in_stock}</td>
                      <td className="p-3 text-red-600">{formatDate(p.expiry_date)}</td>
                      <td className="p-3 text-right font-bold text-red-600">{Math.abs(daysUntilExpiry(p.expiry_date))}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {critical.length > 0 && (
          <Card className="border-orange-200">
            <CardHeader><CardTitle className="text-orange-600 flex items-center gap-2"><Clock className="w-5 h-5" /> Critical — Past Alert Threshold ({critical.length})</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-orange-50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Expiry</th>
                    <th className="text-right p-3 font-medium">Days Left</th>
                    <th className="text-right p-3 font-medium">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {critical.sort((a, b) => daysUntilExpiry(a.expiry_date) - daysUntilExpiry(b.expiry_date)).map(p => {
                    const days = daysUntilExpiry(p.expiry_date);
                    return (
                      <tr key={p.id} className="border-b border-border bg-orange-50/50">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-muted-foreground text-xs">{p.batch_number}</td>
                        <td className="p-3 text-right">{p.quantity_in_stock}</td>
                        <td className="p-3">{formatDate(p.expiry_date)}</td>
                        <td className="p-3 text-right"><Badge variant="warning">{days}d</Badge></td>
                        <td className="p-3 text-right text-xs text-muted-foreground">{getAlertDays(p)}d threshold</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {warning.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader><CardTitle className="text-yellow-600 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Warning — Approaching Threshold ({warning.length})</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-yellow-50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Expiry</th>
                    <th className="text-right p-3 font-medium">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {warning.sort((a, b) => daysUntilExpiry(a.expiry_date) - daysUntilExpiry(b.expiry_date)).map(p => {
                    const days = daysUntilExpiry(p.expiry_date);
                    return (
                      <tr key={p.id} className="border-b border-border bg-yellow-50/50">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 text-muted-foreground text-xs">{p.batch_number}</td>
                        <td className="p-3 text-right">{p.quantity_in_stock}</td>
                        <td className="p-3">{formatDate(p.expiry_date)}</td>
                        <td className="p-3 text-right"><Badge variant="info">{days}d</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {expired.length === 0 && critical.length === 0 && warning.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-green-600">All Clear!</p>
              <p className="text-sm text-muted-foreground">No expiry alerts at this time</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
    </AuthGuard>
  );
}
