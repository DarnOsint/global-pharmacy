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
  { id: '1', customer: 'Adaeze Okonkwo', total: 12500, items: 5, date: new Date().toISOString() },
  { id: '2', customer: 'Chukwuemeka Nnamdi', total: 8300, items: 3, date: new Date().toISOString() },
  { id: '3', customer: 'Fatima Abubakar', total: 23100, items: 8, date: new Date().toISOString() },
  { id: '4', customer: 'Oluwaseun Adebayo', total: 5600, items: 2, date: new Date().toISOString() },
];

const lowStockItems = [
  { name: 'Amoxicillin 500mg', stock: 5, reorder: 20 },
  { name: 'Paracetamol 500mg', stock: 8, reorder: 50 },
  { name: 'Metformin 850mg', stock: 3, reorder: 15 },
  { name: 'Lisinopril 10mg', stock: 12, reorder: 30 },
];

const expiringItems = [
  { name: 'Ibuprofen 400mg', expiry: '2026-08-25', batch: 'BCH-2024-089' },
  { name: 'Cetirizine 10mg', expiry: '2026-09-10', batch: 'BCH-2024-102' },
  { name: 'Omeprazole 20mg', expiry: '2026-09-15', batch: 'BCH-2024-078' },
];

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value="1,247"
          icon={<Package className="w-5 h-5" />}
          change="23 low stock"
          changeType="down"
        />
        <StatCard
          title="Today's Sales"
          value={formatCurrency(156800)}
          icon={<ShoppingCart className="w-5 h-5" />}
          change="+12% from yesterday"
          changeType="up"
        />
        <StatCard
          title="Today's Expenses"
          value={formatCurrency(23400)}
          icon={<CreditCard className="w-5 h-5" />}
          change="-5% from yesterday"
          changeType="up"
        />
        <StatCard
          title="Expiring Soon"
          value="18"
          icon={<AlertTriangle className="w-5 h-5" />}
          change="Within 90 days"
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{sale.customer}</p>
                    <p className="text-xs text-muted-foreground">{sale.items} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-primary">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(sale.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.name} className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="danger">{item.stock} left</Badge>
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
                    <Badge variant={status === 'critical' ? 'danger' : 'warning'}>
                      {formatDate(item.expiry)}
                    </Badge>
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
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Sales This Week</span>
                <span className="font-semibold text-primary">{formatCurrency(892400)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Purchases</span>
                <span className="font-semibold">{formatCurrency(445200)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Expenses</span>
                <span className="font-semibold text-danger">{formatCurrency(87300)}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Net Profit</span>
                <span className="font-bold text-success">{formatCurrency(359900)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
