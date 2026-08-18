'use client';

import { StatCard } from '@/components/ui/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package, ShoppingCart, CreditCard, AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { formatCurrency, formatDate, getExpiryStatus } from '@/lib/utils';

const recentSales = [
  { id: '1', customer: 'Amina Deng', total: 35000, currency: 'SSP', items: 5, date: new Date().toISOString() },
  { id: '2', customer: 'Peter Garang', total: 11.00, currency: 'USD', items: 3, date: new Date().toISOString() },
  { id: '3', customer: 'Sarah Nyabol', total: 22500, currency: 'SSP', items: 8, date: new Date().toISOString() },
  { id: '4', customer: 'James Bol', total: 16000, currency: 'SSP', items: 2, date: new Date().toISOString() },
];

const lowStockItems = [
  { name: 'Amoxicillin 500mg', stock: 45, reorder: 20 },
  { name: 'Ibuprofen 400mg', stock: 8, reorder: 25 },
  { name: 'Artemether-Lumefantrine', stock: 35, reorder: 20 },
];

const expiringItems = [
  { name: 'Ibuprofen 400mg', expiry: '2026-08-25', batch: 'BCH-006' },
  { name: 'Artemether-Lumefantrine', expiry: '2027-05-18', batch: 'BCH-007' },
];

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Products" value="8" icon={<Package className="w-5 h-5" />} change="2 low stock" changeType="down" />
        <StatCard title="Today's Sales" value="4 transactions" icon={<ShoppingCart className="w-5 h-5" />} change="Mixed SSP/USD" changeType="up" />
        <StatCard title="Today's Expenses" value={formatCurrency(550000)} icon={<CreditCard className="w-5 h-5" />} change="SSP + USD" changeType="neutral" />
        <StatCard title="Expiring Soon" value="2" icon={<AlertTriangle className="w-5 h-5" />} change="Within 90 days" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent Sales</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{sale.customer}</p>
                    <p className="text-xs text-muted-foreground">{sale.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-primary">{formatCurrency(sale.total, sale.currency as 'SSP' | 'USD')}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(sale.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.name} className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={item.stock <= item.reorder ? 'danger' : 'success'}>{item.stock} left</Badge>
                    <span className="text-xs text-muted-foreground">Reorder: {item.reorder}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringItems.map((item) => {
                const status = getExpiryStatus(item.expiry);
                return (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Batch: {item.batch}</p>
                    </div>
                    <Badge variant={status === 'critical' ? 'danger' : 'warning'}>{formatDate(item.expiry)}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Staff</span>
                <span className="font-semibold text-primary">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Currencies Used</span>
                <div className="flex gap-2"><Badge variant="success">SSP</Badge><Badge variant="info">USD</Badge></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">System Status</span>
                <Badge variant="success">Online</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
