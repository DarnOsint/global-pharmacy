'use client';

import { useState, useEffect, useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import {
  getAllProducts,
  getAllSales,
  getAllExpenses,
  getAllStaff,
  getAllCustomers,
  getDailySummary,
  getTotalStockValue,
  getTopSellingProducts,
} from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import { useSync } from '@/lib/use-sync';
import { useSettingsStore } from '@/lib/settings-store';
import {
  formatCurrencyPair,
  formatCurrency,
  formatDate,
  daysUntilExpiry,
  getExpiryStatus,
} from '@/lib/utils';
import type { Product, Sale, Expense, Staff } from '@/types/database';

export default function DashboardPage() {
  const { refreshCount } = useSync();
  const { exchangeRate } = useSettingsStore();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [dailySummary, setDailySummary] = useState<{
    income: number;
    expenses: number;
    transactions: number;
  }>({ income: 0, expenses: 0, transactions: 0 });
  const [stockValue, setStockValue] = useState<{ ssp: number; usd: number }>({
    ssp: 0,
    usd: 0,
  });
  const [topSelling, setTopSelling] = useState<
    { name: string; sold: number; revenue: number }[]
  >([]);

  useEffect(() => {
    async function load() {
      await seedOfflineData();
      const today = new Date().toISOString().split('T')[0];

      const [
        allProducts,
        allSales,
        allExpenses,
        allStaff,
        customers,
        summary,
        stock,
        top,
      ] = await Promise.all([
        getAllProducts(),
        getAllSales(),
        getAllExpenses(),
        getAllStaff(),
        getAllCustomers(),
        getDailySummary(today),
        getTotalStockValue(),
        getTopSellingProducts(),
      ]);

      setProducts(allProducts);
      setSales(allSales);
      setExpenses(allExpenses);
      setStaff(allStaff);
      setCustomerCount(customers.length);
      setDailySummary(summary);
      setStockValue(stock);
      setTopSelling(top);
      setLoading(false);
      refreshCount();
    }
    load();
  }, [refreshCount]);

  const todayStr = new Date().toISOString().split('T')[0];

  const totalProductCount = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.is_active && p.quantity_in_stock <= p.reorder_level),
    [products]
  );

  const expiringSoon = useMemo(
    () =>
      products
        .filter((p) => {
          const days = daysUntilExpiry(p.expiry_date);
          return days >= 0 && days <= 90;
        })
        .sort((a, b) => daysUntilExpiry(a.expiry_date) - daysUntilExpiry(b.expiry_date)),
    [products]
  );

  const activeStaff = useMemo(() => staff.filter((s) => s.is_active), [staff]);

  const roleBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of activeStaff) {
      map[s.role] = (map[s.role] || 0) + 1;
    }
    return map;
  }, [activeStaff]);

  const todaySales = useMemo(
    () => sales.filter((s) => s.created_at.startsWith(todayStr) && s.status === 'completed'),
    [sales, todayStr]
  );

  const todayExpenses = useMemo(
    () => expenses.filter((e) => e.date === todayStr),
    [expenses, todayStr]
  );

  const todayExpensesTotal = useMemo(
    () =>
      todayExpenses.reduce((sum, e) => {
        if (e.currency === 'USD') return sum + e.amount * exchangeRate;
        return sum + e.amount;
      }, 0),
    [todayExpenses, exchangeRate]
  );

  const recentSales = useMemo(() => sales.slice(0, 5), [sales]);

  const recentSalesTotal = useMemo(
    () =>
      recentSales.reduce((sum, s) => {
        if (s.currency === 'USD') return sum + s.total * exchangeRate;
        return sum + s.total;
      }, 0),
    [recentSales, exchangeRate]
  );

  const recentExpensesTotal = useMemo(
    () =>
      expenses.slice(0, 10).reduce((sum, e) => {
        if (e.currency === 'USD') return sum + e.amount * exchangeRate;
        return sum + e.amount;
      }, 0),
    [expenses, exchangeRate]
  );

  const netProfit = useMemo(
    () => dailySummary.income - dailySummary.expenses,
    [dailySummary]
  );

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    pharmacist: 'Pharmacist',
    cashier: 'Cashier',
    store_manager: 'Manager',
  };

  const expiryBadge = (days: number) => {
    if (days <= 0) return <Badge variant="danger">Expired</Badge>;
    if (days <= 30) return <Badge variant="danger">{days}d</Badge>;
    if (days <= 60) return <Badge variant="warning">{days}d</Badge>;
    return <Badge variant="info">{days}d</Badge>;
  };

  if (loading) {
    return (
      <AuthGuard>
        <AppShell>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-muted-foreground">
                Loading dashboard...
              </p>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-NG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* ── Stat Cards ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Products"
              value={totalProductCount}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              change={
                lowStockProducts.length > 0
                  ? `${lowStockProducts.length} low stock`
                  : 'Stock OK'
              }
              changeType={lowStockProducts.length > 0 ? 'down' : 'up'}
              className="border-l-4 border-l-primary"
            />

            <StatCard
              title="Today's Sales"
              value={dailySummary.transactions}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              }
              change={formatCurrency(dailySummary.income, 'SSP')}
              changeType="up"
              className="border-l-4 border-l-success"
            />

            <StatCard
              title="Today's Expenses"
              value={todayExpenses.length}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              change={formatCurrency(dailySummary.expenses, 'SSP')}
              changeType="down"
              className="border-l-4 border-l-danger"
            />

            <StatCard
              title="Active Staff"
              value={activeStaff.length}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              change={Object.entries(roleBreakdown)
                .map(([role, count]) => `${count} ${roleLabels[role] || role}`)
                .join(', ')}
              changeType="neutral"
              className="border-l-4 border-l-accent"
            />
          </div>

          {/* ── Daily Summary ───────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Daily Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-success" />
                      Income
                    </p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrencyPair(dailySummary.income, 'SSP', exchangeRate)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-danger" />
                      Expenses
                    </p>
                    <p className="text-xl font-bold text-danger">
                      {formatCurrencyPair(dailySummary.expenses, 'SSP', exchangeRate)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      Net Profit
                    </p>
                    <p
                      className={`text-xl font-bold ${
                        netProfit >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {netProfit >= 0 ? '+' : ''}
                      {formatCurrencyPair(netProfit, 'SSP', exchangeRate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Revenue Bar Placeholder ──────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today</span>
                      <span className="font-medium">
                        {formatCurrency(dailySummary.income, 'SSP')}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (dailySummary.income /
                              Math.max(recentSalesTotal, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recent 5</span>
                      <span className="font-medium">
                        {formatCurrency(recentSalesTotal, 'SSP')}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-all duration-500"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recent 10 Expenses</span>
                      <span className="font-medium">
                        {formatCurrency(recentExpensesTotal, 'SSP')}
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-danger to-red-400 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            (recentExpensesTotal /
                              Math.max(recentSalesTotal, 1)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── Top Selling + Recent Sales ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topSelling.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No sales recorded yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 font-medium text-muted-foreground">
                            Product
                          </th>
                          <th className="text-right py-2 font-medium text-muted-foreground">
                            Sold
                          </th>
                          <th className="text-right py-2 font-medium text-muted-foreground">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topSelling.slice(0, 5).map((item, i) => (
                          <tr
                            key={i}
                            className="border-b border-border last:border-0"
                          >
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-50 text-primary text-xs font-bold">
                                  {i + 1}
                                </span>
                                <span className="font-medium truncate max-w-[180px]">
                                  {item.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <Badge variant="info">{item.sold}</Badge>
                            </td>
                            <td className="py-2.5 text-right font-medium">
                              {formatCurrency(item.revenue, 'SSP')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No recent sales
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-muted-foreground">
                              {sale.invoice_number}
                            </span>
                            {sale.status === 'returned' && (
                              <Badge variant="warning" className="text-[10px]">
                                Returned
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">
                            {sale.notes || 'Walk-in Customer'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(sale.created_at)}
                          </p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="text-sm font-bold">
                            {formatCurrency(sale.total, sale.currency)}
                          </p>
                          <Badge
                            variant={
                              sale.payment_method === 'cash'
                                ? 'success'
                                : sale.payment_method === 'credit'
                                ? 'warning'
                                : 'info'
                            }
                            className="text-[10px] capitalize"
                          >
                            {sale.payment_method}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Low Stock + Expiring + Quick Info ───────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Low Stock Alerts</CardTitle>
                  {lowStockProducts.length > 0 && (
                    <Badge variant="danger">
                      {lowStockProducts.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    All products well stocked
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {lowStockProducts.map((product) => {
                      const ratio =
                        product.reorder_level > 0
                          ? product.quantity_in_stock / product.reorder_level
                          : 0;
                      return (
                        <div
                          key={product.id}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate max-w-[140px]">
                              {product.name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              SKU: {product.sku}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  ratio <= 0.25
                                    ? 'bg-danger'
                                    : ratio <= 0.5
                                    ? 'bg-accent'
                                    : 'bg-warning'
                                }`}
                                style={{
                                  width: `${Math.min(ratio * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold whitespace-nowrap">
                              {product.quantity_in_stock}/{product.reorder_level}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Expiring Soon</CardTitle>
                  {expiringSoon.length > 0 && (
                    <Badge variant="warning">
                      {expiringSoon.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {expiringSoon.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No products expiring within 90 days
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {expiringSoon.map((product) => {
                      const days = daysUntilExpiry(product.expiry_date);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Exp: {formatDate(product.expiry_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-medium">
                              Qty: {product.quantity_in_stock}
                            </span>
                            {expiryBadge(days)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-primary-50 p-3 space-y-1">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider">
                      Total Stock Value
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrencyPair(stockValue.ssp, 'SSP', exchangeRate)}
                    </p>
                    {stockValue.usd > 0 && (
                      <p className="text-sm font-bold text-primary">
                        {formatCurrencyPair(stockValue.usd, 'USD', exchangeRate)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold">{customerCount}</p>
                      <p className="text-xs text-muted-foreground">Customers</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <p className="text-2xl font-bold">{products.length}</p>
                      <p className="text-xs text-muted-foreground">Total Items</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <Badge variant="info">1 USD = SSP {exchangeRate.toLocaleString()}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Categories</span>
                      <span className="font-medium">
                        {new Set(products.map((p) => p.category)).size}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Sales</span>
                      <span className="font-medium">{sales.length}</span>
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
