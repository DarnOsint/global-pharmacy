'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Download, TrendingUp, Package, ShoppingCart, CreditCard } from 'lucide-react';
import { formatCurrency, formatCurrencyPair, formatDate, daysUntilExpiry } from '@/lib/utils';
import { useSettingsStore } from '@/lib/settings-store';
import {
  getAllProducts, getAllSales, getAllExpenses, getAllPurchases,
  getTopSellingProducts, getSlowMovingProducts, getDailySummary, getTotalStockValue,
} from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Product, Sale, Expense, Purchase } from '@/types/database';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const settings = useSettingsStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const [topProducts, setTopProducts] = useState<{name:string;sold:number;revenue:number}[]>([]);
  const [slowProducts, setSlowProducts] = useState<{name:string;stock:number;lastSold:string|null}[]>([]);

  const loadData = useCallback(async () => {
    await seedOfflineData();
    const [p, s, e, pu] = await Promise.all([getAllProducts(), getAllSales(), getAllExpenses(), getAllPurchases()]);
    setProducts(p);
    setSales(s);
    setExpenses(e);
    setPurchases(pu);
    setTopProducts(await getTopSellingProducts());
    setSlowProducts(await getSlowMovingProducts());
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const today = new Date().toISOString().slice(0, 10);
  const todaySummary = useMemo(() => {
    const ts = sales.filter(s => s.created_at.startsWith(today) && s.status === 'completed');
    const te = expenses.filter(e => e.date === today);
    return {
      income: ts.reduce((sum, s) => sum + s.total, 0),
      expenses: te.reduce((sum, e) => sum + e.amount, 0),
      transactions: ts.length,
    };
  }, [sales, expenses, today]);

  const totalRevenue = useMemo(() => sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.total, 0), [sales]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const lowStock = useMemo(() => products.filter(p => p.is_active && p.quantity_in_stock <= p.reorder_level), [products]);
  const expiringSoon = useMemo(() => products.filter(p => p.is_active && daysUntilExpiry(p.expiry_date) <= 90 && daysUntilExpiry(p.expiry_date) > 0), [products]);

  const exportSales = () => {
    const data = sales.map(s => ({
      Invoice: s.invoice_number,
      Date: s.created_at.slice(0, 10),
      Total: s.total,
      Currency: s.currency,
      Payment: s.payment_method,
      Status: s.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `global-pharmacy-sales-${today}.xlsx`);
  };

  const exportExpenses = () => {
    const data = expenses.map(e => ({
      Date: e.date,
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      Currency: e.currency,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, `global-pharmacy-expenses-${today}.xlsx`);
  };

  const exportInventory = () => {
    const data = products.map(p => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category,
      Stock: p.quantity_in_stock,
      'Unit Price': p.unit_price,
      'Cost Price': p.cost_price,
      Currency: p.currency,
      Expiry: p.expiry_date,
      Manufacturer: p.manufacturer,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `global-pharmacy-inventory-${today}.xlsx`);
  };

  const exportAll = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sales.map(s => ({ Invoice: s.invoice_number, Date: s.created_at.slice(0,10), Total: s.total, Currency: s.currency, Payment: s.payment_method, Status: s.status }))), 'Sales');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses.map(e => ({ Date: e.date, Category: e.category, Description: e.description, Amount: e.amount, Currency: e.currency }))), 'Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map(p => ({ Name: p.name, SKU: p.sku, Stock: p.quantity_in_stock, Price: p.unit_price, Currency: p.currency, Expiry: p.expiry_date }))), 'Inventory');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchases.map(p => ({ Invoice: p.invoice_number, Date: p.created_at.slice(0,10), Total: p.total, Currency: p.currency, Status: p.status }))), 'Purchases');
    XLSX.writeFile(wb, `global-pharmacy-full-report-${today}.xlsx`);
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">Business insights and data export</p>
          </div>
          <Button onClick={exportAll}><Download className="w-4 h-4 mr-2" /> Export All (Excel)</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="w-4 h-4" /> Today&apos;s Revenue</div>
              <p className="text-lg font-bold">{formatCurrencyPair(todaySummary.income, 'SSP', settings.exchangeRate)}</p>
              <p className="text-xs text-muted-foreground">{todaySummary.transactions} transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CreditCard className="w-4 h-4" /> Today&apos;s Expenses</div>
              <p className="text-lg font-bold">{formatCurrencyPair(todaySummary.expenses, 'SSP', settings.exchangeRate)}</p>
              <p className="text-xs text-muted-foreground">Net: {formatCurrency(todaySummary.income - todaySummary.expenses, 'SSP')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Package className="w-4 h-4" /> Total Products</div>
              <p className="text-lg font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">{lowStock.length} low stock, {expiringSoon.length} expiring</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><ShoppingCart className="w-4 h-4" /> Total Sales</div>
              <p className="text-lg font-bold">{sales.length}</p>
              <p className="text-xs text-muted-foreground">{sales.filter(s => s.status === 'completed').length} completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Selling Products</CardTitle>
              <Button variant="outline" size="sm" onClick={exportSales}><Download className="w-4 h-4 mr-1" /> Sales</Button>
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
                  {topProducts.length > 0 ? topProducts.slice(0, 5).map((p, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-3"><Badge variant="info">{i + 1}</Badge></td>
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right">{p.sold}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(p.revenue, 'SSP')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No sales data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Slow-Moving Products</CardTitle>
              <Button variant="outline" size="sm" onClick={exportInventory}><Download className="w-4 h-4 mr-1" /> Inventory</Button>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-left p-3 font-medium">Last Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {slowProducts.filter(p => p.stock > 0).slice(0, 5).map((p, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right">{p.stock}</td>
                      <td className="p-3 text-muted-foreground text-xs">{p.lastSold ? formatDate(p.lastSold) : 'Never'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Items</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Stock</th>
                    <th className="text-right p-3 font-medium">Reorder Level</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.length > 0 ? lowStock.map(p => (
                    <tr key={p.id} className="border-b border-border bg-red-50/50">
                      <td className="p-3 font-medium">{p.name}</td>
                      <td className="p-3 text-right font-bold text-red-600">{p.quantity_in_stock}</td>
                      <td className="p-3 text-right">{p.reorder_level}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">All stock levels healthy</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expense Breakdown</CardTitle>
              <Button variant="outline" size="sm" onClick={exportExpenses}><Download className="w-4 h-4 mr-1" /> Expenses</Button>
            </CardHeader>
            <CardContent>
              {(() => {
                const byCat: Record<string, number> = {};
                for (const e of expenses) { byCat[e.category] = (byCat[e.category] || 0) + e.amount; }
                const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
                if (sorted.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">No expenses recorded</p>;
                return sorted.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-medium capitalize">{cat}</span>
                    <span className="text-sm font-medium">{formatCurrency(amount, 'SSP')}</span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
