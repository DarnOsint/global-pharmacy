'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const periods = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

const salesData = [
  { month: 'Jan', sales: 1200000, purchases: 800000 },
  { month: 'Feb', sales: 1350000, purchases: 900000 },
  { month: 'Mar', sales: 980000, purchases: 750000 },
  { month: 'Apr', sales: 1500000, purchases: 1000000 },
  { month: 'May', sales: 1100000, purchases: 850000 },
  { month: 'Jun', sales: 1600000, purchases: 1100000 },
  { month: 'Jul', sales: 1450000, purchases: 950000 },
  { month: 'Aug', sales: 892400, purchases: 445200 },
];

const topProducts = [
  { name: 'Paracetamol 500mg', sold: 850, revenue: 425000 },
  { name: 'Amoxicillin 500mg', sold: 320, revenue: 800000 },
  { name: 'Metformin 850mg', sold: 210, revenue: 378000 },
  { name: 'Vitamin C 1000mg', sold: 195, revenue: 156000 },
  { name: 'Ibuprofen 400mg', sold: 180, revenue: 126000 },
];

const maxSales = Math.max(...salesData.map(d => d.sales));

export default function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const totalSales = salesData.reduce((s, d) => s + d.sales, 0);
  const totalPurchases = salesData.reduce((s, d) => s + d.purchases, 0);
  const profit = totalSales - totalPurchases;

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Reports & Analytics
            </h1>
            <p className="text-sm text-muted-foreground">Business performance overview</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>

        <div className="flex gap-3">
          <Select
            options={periods}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalSales)}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +15.2% vs last period
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-accent">
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Purchases</p>
              <p className="text-2xl font-bold text-accent">{formatCurrency(totalPurchases)}</p>
              <p className="text-xs text-danger flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" /> -8.4% vs last period
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent>
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(profit)}</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> Margin: {((profit / totalSales) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales vs Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesData.map((d) => (
                <div key={d.month} className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground w-8">{d.month}</span>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-5 bg-primary rounded"
                        style={{ width: `${(d.sales / maxSales) * 100}%` }}
                      />
                      <span className="text-xs font-medium">{formatCurrency(d.sales)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 bg-accent/60 rounded"
                        style={{ width: `${(d.purchases / maxSales) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary rounded" /> Sales</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-accent/60 rounded" /> Purchases</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">#</th>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Units Sold</th>
                    <th className="text-right p-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={p.name} className="border-b border-border">
                      <td className="p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right">{p.sold}</td>
                      <td className="p-3 text-right font-medium text-primary">{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  'Daily Sales Summary',
                  'Weekly Revenue Report',
                  'Monthly P&L Statement',
                  'Inventory Valuation',
                  'Expiry Report',
                  'Supplier Outstanding',
                  'Staff Attendance',
                  'Tax Report',
                ].map((report) => (
                  <div key={report} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                    <span className="text-sm font-medium">{report}</span>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
