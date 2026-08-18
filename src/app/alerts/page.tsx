'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, daysUntilExpiry } from '@/lib/utils';

const expiringItems = [
  { id: '1', name: 'Ibuprofen 400mg', batch: 'BCH-006', quantity: 45, expiry_date: '2026-08-25', days: 7 },
  { id: '2', name: 'Cetirizine 10mg', batch: 'BCH-010', quantity: 30, expiry_date: '2026-09-10', days: 23 },
  { id: '3', name: 'Omeprazole 20mg', batch: 'BCH-012', quantity: 60, expiry_date: '2026-09-15', days: 28 },
  { id: '4', name: 'Metformin 850mg', batch: 'BCH-003', quantity: 3, expiry_date: '2026-09-10', days: 23 },
  { id: '5', name: 'Loratadine 10mg', batch: 'BCH-015', quantity: 25, expiry_date: '2026-10-01', days: 44 },
  { id: '6', name: 'Naproxen 500mg', batch: 'BCH-018', quantity: 18, expiry_date: '2026-11-15', days: 89 },
];

const dismissed = [
  { id: '7', name: 'Paracetamol 500mg', batch: 'BCH-002', expiry_date: '2027-06-20', dismissed_by: 'Chidinma Eze', dismissed_at: '2026-08-10T10:00:00Z' },
];

export default function AlertsPage() {
  const critical = expiringItems.filter(i => i.days <= 30);
  const warning = expiringItems.filter(i => i.days > 30 && i.days <= 90);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-accent" />
              Expiry Alerts
            </h1>
            <p className="text-sm text-muted-foreground">Track and manage products nearing expiry</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-red-200 bg-red-50/50">
            <CardContent>
              <div className="flex items-center gap-3">
                <XCircle className="w-8 h-8 text-danger" />
                <div>
                  <p className="text-sm text-danger font-medium">Critical (≤30 days)</p>
                  <p className="text-2xl font-bold text-danger">{critical.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Warning (31-90 days)</p>
                  <p className="text-2xl font-bold text-yellow-700">{warning.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-success font-medium">Total Tracked</p>
                  <p className="text-2xl font-bold text-success">{expiringItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {critical.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="text-danger flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Critical — Expiring Within 30 Days
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Expiry Date</th>
                    <th className="text-right p-3 font-medium">Days Left</th>
                    <th className="text-right p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {critical.map((item) => (
                    <tr key={item.id} className="border-b border-border bg-red-50/30">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 font-mono text-xs">{item.batch}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3">{formatDate(item.expiry_date)}</td>
                      <td className="p-3 text-right">
                        <Badge variant="danger">{item.days} days</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="danger" size="sm">Mark for Return</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {warning.length > 0 && (
          <Card className="border-yellow-200">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="text-yellow-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Warning — Expiring Within 90 Days
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-left p-3 font-medium">Batch</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Expiry Date</th>
                    <th className="text-right p-3 font-medium">Days Left</th>
                    <th className="text-right p-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {warning.map((item) => (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3 font-mono text-xs">{item.batch}</td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3">{formatDate(item.expiry_date)}</td>
                      <td className="p-3 text-right">
                        <Badge variant="warning">{item.days} days</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="accent" size="sm">Clearance Sale</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Dismissed Alerts</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">Batch</th>
                  <th className="text-left p-3 font-medium">Expiry</th>
                  <th className="text-left p-3 font-medium">Dismissed By</th>
                  <th className="text-right p-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {dismissed.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/30 opacity-60">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3 font-mono text-xs">{item.batch}</td>
                    <td className="p-3">{formatDate(item.expiry_date)}</td>
                    <td className="p-3">{item.dismissed_by}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm">Reinstate</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
