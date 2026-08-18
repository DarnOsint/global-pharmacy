'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { CreditCard, Plus, Search } from 'lucide-react';
import { formatCurrency, formatDate, type Currency } from '@/lib/utils';

const expenseCategories = [
  { value: 'rent', label: 'Rent' }, { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' }, { value: 'supplies', label: 'Supplies' },
  { value: 'maintenance', label: 'Maintenance' }, { value: 'transport', label: 'Transport' },
  { value: 'marketing', label: 'Marketing' }, { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' }, { value: 'other', label: 'Other' },
];

const mockExpenses = [
  { id: '1', category: 'rent', description: 'Monthly shop rent - August', amount: 2500000, currency: 'SSP' as Currency, date: '2026-08-01' },
  { id: '2', category: 'utilities', description: 'Electricity bill (JEDCO)', amount: 350000, currency: 'SSP' as Currency, date: '2026-08-05' },
  { id: '3', category: 'utilities', description: 'Zain internet subscription', amount: 150000, currency: 'SSP' as Currency, date: '2026-08-05' },
  { id: '4', category: 'supplies', description: 'Receipt printer paper rolls', amount: 45000, currency: 'SSP' as Currency, date: '2026-08-10' },
  { id: '5', category: 'transport', description: 'Delivery to Malakal customer', amount: 15.00, currency: 'USD' as Currency, date: '2026-08-12' },
  { id: '6', category: 'maintenance', description: 'Generator fuel', amount: 200000, currency: 'SSP' as Currency, date: '2026-08-14' },
];

const categoryColors: Record<string, string> = {
  rent: 'bg-red-100 text-red-800', utilities: 'bg-yellow-100 text-yellow-800',
  salaries: 'bg-blue-100 text-blue-800', supplies: 'bg-green-100 text-green-800',
  maintenance: 'bg-purple-100 text-purple-800', transport: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addCurrency, setAddCurrency] = useState('SSP');

  const filtered = mockExpenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Expenses</h1>
            <p className="text-sm text-muted-foreground">Track and manage all business expenses</p>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Expense Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-lg border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-right p-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground">{formatDate(expense.date)}</td>
                    <td className="p-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[expense.category] || categoryColors.other}`}>{expense.category}</span></td>
                    <td className="p-3 font-medium">{expense.description}</td>
                    <td className="p-3 text-right font-semibold text-danger">{formatCurrency(expense.amount, expense.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense" size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <select className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Currency</label>
                <select value={addCurrency} onChange={e => setAddCurrency(e.target.value)} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="SSP">SSP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div className="w-full"><label className="block text-sm font-medium text-foreground mb-1">Description</label><input type="text" placeholder="What was this expense for?" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            <div className="w-full"><label className="block text-sm font-medium text-foreground mb-1">Amount ({addCurrency})</label><input type="number" step="0.01" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            <div className="w-full"><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit">Save Expense</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
