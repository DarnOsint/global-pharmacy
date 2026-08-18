'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, CheckCircle, XCircle, Filter } from 'lucide-react';
import { formatDate, daysUntilExpiry } from '@/lib/utils';

const products = [
  { id: '1', name: 'Amoxicillin 500mg', batch: 'BCH-001', quantity: 45, expiry_date: '2027-06-15', alert_days: 90 },
  { id: '2', name: 'Paracetamol 500mg', batch: 'BCH-002', quantity: 200, expiry_date: '2027-12-20', alert_days: 30 },
  { id: '3', name: 'Metformin 850mg', batch: 'BCH-003', quantity: 30, expiry_date: '2027-03-10', alert_days: 60 },
  { id: '4', name: 'Lisinopril 10mg', batch: 'BCH-004', quantity: 60, expiry_date: '2027-09-25', alert_days: 90 },
  { id: '5', name: 'Vitamin C 1000mg', batch: 'BCH-005', quantity: 120, expiry_date: '2027-08-30', alert_days: 30 },
  { id: '6', name: 'Ibuprofen 400mg', batch: 'BCH-006', quantity: 8, expiry_date: '2026-08-25', alert_days: 14 },
  { id: '7', name: 'Artemether-Lumefantrine', batch: 'BCH-007', quantity: 35, expiry_date: '2027-05-18', alert_days: 60 },
  { id: '8', name: 'ORS Sachets', batch: 'BCH-008', quantity: 300, expiry_date: '2028-01-01', alert_days: 90 },
];

const quickFilters = [
  { label: 'All', value: 0 },
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '6 months', value: 180 },
  { label: '1 year', value: 365 },
  { label: '2 years', value: 730 },
];

export default function AlertsPage() {
  const [filterDays, setFilterDays] = useState(0);

  const expired = products.filter(p => daysUntilExpiry(p.expiry_date) <= 0);
  const critical = products.filter(p => {
    const days = daysUntilExpiry(p.expiry_date);
    return days > 0 && days <= p.alert_days;
  });
  const warning = products.filter(p => {
    const days = daysUntilExpiry(p.expiry_date);
    return days > p.alert_days && days <= p.alert_days * 2;
  });

  const filtered = filterDays > 0
    ? products.filter(p => daysUntilExpiry(p.expiry_date) <= filterDays && daysUntilExpiry(p.expiry_date) > 0)
    : products.filter(p => daysUntilExpiry(p.expiry_date) > 0);

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6 text-accent" /> Expiry Alerts</h1>
          <p className="text-sm text-muted-foreground">Each product has its own alert threshold — set when adding or editing</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="border-red-300 bg-red-50/50"><CardContent>
            <div className="flex items-center gap-3"><XCircle className="w-8 h-8 text-danger" /><div><p className="text-sm text-danger font-medium">Expired</p><p className="text-2xl font-bold text-danger">{expired.length}</p></div></div>
          </CardContent></Card>
          <Card className="border-red-200 bg-red-50/50"><CardContent>
            <div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-danger" /><div><p className="text-sm text-danger font-medium">Critical</p><p className="text-2xl font-bold text-danger">{critical.length}</p></div></div>
          </CardContent></Card>
          <Card className="border-yellow-200 bg-yellow-50/50"><CardContent>
            <div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-yellow-600" /><div><p className="text-sm text-yellow-700 font-medium">Warning</p><p className="text-2xl font-bold text-yellow-700">{warning.length}</p></div></div>
          </CardContent></Card>
          <Card className="border-green-200 bg-green-50/50"><CardContent>
            <div className="flex items-center gap-3"><CheckCircle className="w-8 h-8 text-success" /><div><p className="text-sm text-success font-medium">Total Tracked</p><p className="text-2xl font-bold text-success">{products.length}</p></div></div>
          </CardContent></Card>
        </div>

        {/* Quick Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Quick Filter — Show products expiring within
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {quickFilters.map(f => (
                <button key={f.value} onClick={() => setFilterDays(f.value)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${filterDays === f.value ? 'bg-primary text-white border-primary' : 'bg-white text-muted-foreground border-border hover:border-primary'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            {filterDays > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''} expiring within {filterDays} days
              </p>
            )}
          </CardContent>
        </Card>

        {/* Filtered Results */}
        {filterDays > 0 && filtered.length > 0 && (
          <Card className="border-primary/30">
            <CardHeader><CardTitle className="text-primary">Products Expiring Within {filterDays} Days</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th><th className="text-left p-3 font-medium">Batch</th><th className="text-right p-3 font-medium">Stock</th><th className="text-left p-3 font-medium">Expiry</th><th className="text-right p-3 font-medium">Days Left</th><th className="text-left p-3 font-medium">Alert Setting</th>
                </tr></thead>
                <tbody>
                  {filtered.map(p => {
                    const days = daysUntilExpiry(p.expiry_date);
                    return (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-medium">{p.name}</td>
                        <td className="p-3 font-mono text-xs">{p.batch}</td>
                        <td className="p-3 text-right">{p.quantity}</td>
                        <td className="p-3">{formatDate(p.expiry_date)}</td>
                        <td className="p-3 text-right"><Badge variant={days <= 30 ? 'danger' : 'warning'}>{days} days</Badge></td>
                        <td className="p-3 text-xs text-muted-foreground">Alert at {p.alert_days} days</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Expired */}
        {expired.length > 0 && (
          <Card className="border-red-300">
            <CardHeader className="bg-red-50"><CardTitle className="text-danger flex items-center gap-2"><XCircle className="w-5 h-5" /> Expired — Remove Immediately</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th><th className="text-left p-3 font-medium">Batch</th><th className="text-right p-3 font-medium">Stock</th><th className="text-left p-3 font-medium">Expiry</th><th className="text-right p-3 font-medium">Action</th>
                </tr></thead>
                <tbody>
                  {expired.map(p => (
                    <tr key={p.id} className="border-b border-border bg-red-50/50">
                      <td className="p-3 font-medium">{p.name}</td><td className="p-3 font-mono text-xs">{p.batch}</td><td className="p-3 text-right">{p.quantity}</td><td className="p-3">{formatDate(p.expiry_date)}</td><td className="p-3 text-right"><Button variant="danger" size="sm">Remove</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Critical */}
        {critical.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="bg-red-50"><CardTitle className="text-danger flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Critical — Past Individual Alert Threshold</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th><th className="text-left p-3 font-medium">Batch</th><th className="text-right p-3 font-medium">Stock</th><th className="text-left p-3 font-medium">Expiry</th><th className="text-right p-3 font-medium">Days Left</th><th className="text-left p-3 font-medium">Alert Setting</th><th className="text-right p-3 font-medium">Action</th>
                </tr></thead>
                <tbody>
                  {critical.map(p => {
                    const days = daysUntilExpiry(p.expiry_date);
                    return (
                      <tr key={p.id} className="border-b border-border bg-red-50/30">
                        <td className="p-3 font-medium">{p.name}</td><td className="p-3 font-mono text-xs">{p.batch}</td><td className="p-3 text-right">{p.quantity}</td><td className="p-3">{formatDate(p.expiry_date)}</td><td className="p-3 text-right"><Badge variant="danger">{days} days</Badge></td><td className="p-3 text-xs text-muted-foreground">Alert at {p.alert_days} days</td><td className="p-3 text-right"><Button variant="danger" size="sm">Mark for Return</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Warning */}
        {warning.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50"><CardTitle className="text-yellow-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Warning — Approaching Alert Threshold</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th><th className="text-left p-3 font-medium">Batch</th><th className="text-right p-3 font-medium">Stock</th><th className="text-left p-3 font-medium">Expiry</th><th className="text-right p-3 font-medium">Days Left</th><th className="text-left p-3 font-medium">Alert Setting</th><th className="text-right p-3 font-medium">Action</th>
                </tr></thead>
                <tbody>
                  {warning.map(p => {
                    const days = daysUntilExpiry(p.expiry_date);
                    return (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-medium">{p.name}</td><td className="p-3 font-mono text-xs">{p.batch}</td><td className="p-3 text-right">{p.quantity}</td><td className="p-3">{formatDate(p.expiry_date)}</td><td className="p-3 text-right"><Badge variant="warning">{days} days</Badge></td><td className="p-3 text-xs text-muted-foreground">Alert at {p.alert_days} days</td><td className="p-3 text-right"><Button variant="accent" size="sm">Clearance Sale</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
    </AuthGuard>
  );
}
