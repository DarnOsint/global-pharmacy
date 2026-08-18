'use client';

import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const periods = [
  { value: 'today', label: 'Today' }, { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' }, { value: 'quarter', label: 'This Quarter' },
];

const topProducts = [
  { name: 'Paracetamol 500mg', sold: 120, revenue_ssp: 240000 },
  { name: 'Amoxicillin 500mg', sold: 45, revenue_ssp: 382500 },
  { name: 'Artemether-Lumefantrine', sold: 28, revenue_ssp: 420000 },
  { name: 'ORS Sachets', sold: 85, revenue_ssp: 127500 },
  { name: 'Ibuprofen 400mg', sold: 15, revenue_usd: 45.00 },
];

export default function ReportsPage() {
  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" /> Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Business performance overview</p>
          </div>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export Report</Button>
        </div>

        <div className="flex gap-3">
          <Select options={periods} className="w-48" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-primary"><CardContent>
            <p className="text-sm text-muted-foreground">Revenue (SSP)</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(1170000, 'SSP')}</p>
            <p className="text-xs text-success flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +15.2% vs last period</p>
          </CardContent></Card>
          <Card className="border-l-4 border-l-accent"><CardContent>
            <p className="text-sm text-muted-foreground">Revenue (USD)</p>
            <p className="text-2xl font-bold text-accent">{formatCurrency(45.00, 'USD')}</p>
            <p className="text-xs text-success flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3" /> +8.4% vs last period</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">#</th><th className="text-left p-3 font-medium">Product</th><th className="text-right p-3 font-medium">Units Sold</th><th className="text-right p-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name} className="border-b border-border">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-right">{p.sold}</td>
                    <td className="p-3 text-right font-medium text-primary">
                      {p.revenue_usd ? formatCurrency(p.revenue_usd, 'USD') : formatCurrency(p.revenue_ssp || 0, 'SSP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Reports</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Daily Sales Summary', 'Weekly Revenue Report', 'Monthly P&L Statement', 'Inventory Valuation', 'Expiry Report', 'Supplier Outstanding', 'Staff Attendance', 'Tax Report'].map((report) => (
                <div key={report} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <span className="text-sm font-medium">{report}</span>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
