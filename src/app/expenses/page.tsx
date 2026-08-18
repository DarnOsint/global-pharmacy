'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { CreditCard, Plus, Search, Edit2, Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, type Currency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';

const expenseCategories = [
  { value: 'rent', label: 'Rent' }, { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' }, { value: 'supplies', label: 'Supplies' },
  { value: 'maintenance', label: 'Maintenance' }, { value: 'transport', label: 'Transport' },
  { value: 'marketing', label: 'Marketing' }, { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' }, { value: 'other', label: 'Other' },
];

const initialExpenses = [
  { id: '1', category: 'rent', description: 'Monthly shop rent - August', amount: 2500000, currency: 'SSP' as Currency, date: '2026-08-01' },
  { id: '2', category: 'utilities', description: 'Electricity bill (JEDCO)', amount: 350000, currency: 'SSP' as Currency, date: '2026-08-05' },
  { id: '3', category: 'utilities', description: 'Zain internet subscription', amount: 150000, currency: 'SSP' as Currency, date: '2026-08-05' },
  { id: '4', category: 'supplies', description: 'Receipt printer paper rolls', amount: 45000, currency: 'SSP' as Currency, date: '2026-08-10' },
  { id: '5', category: 'transport', description: 'Delivery to Malakal customer', amount: 15.00, currency: 'USD' as Currency, date: '2026-08-12' },
  { id: '6', category: 'maintenance', description: 'Generator fuel', amount: 200000, currency: 'SSP' as Currency, date: '2026-08-14' },
];

type Expense = typeof initialExpenses[number];

const emptyExpense: Expense = {
  id: '', category: 'other', description: '', amount: 0, currency: 'SSP', date: new Date().toISOString().slice(0, 10),
};

const categoryColors: Record<string, string> = {
  rent: 'bg-red-100 text-red-800', utilities: 'bg-yellow-100 text-yellow-800',
  salaries: 'bg-blue-100 text-blue-800', supplies: 'bg-green-100 text-green-800',
  maintenance: 'bg-purple-100 text-purple-800', transport: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Expense>(initialExpenses[0]);
  const [editExpense, setEditExpense] = useState<Expense>(emptyExpense);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const filtered = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (expense: Expense) => { setEditExpense({ ...expense }); setShowEdit(true); };
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setExpenses(prev => prev.map(ex => ex.id === editExpense.id ? editExpense : ex));
    setShowEdit(false);
  };

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
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground">{formatDate(expense.date)}</td>
                    <td className="p-3"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[expense.category] || categoryColors.other}`}>{expense.category}</span></td>
                    <td className="p-3 font-medium">{expense.description}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(expense.amount, expense.currency)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(expense); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => openEdit(expense)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>}
                        {isAdmin && <button className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5}><EmptyState icon={<CreditCard className="w-8 h-8 text-muted-foreground" />} title="No expenses found" description="Add your first expense" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Expense" size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Category</label><select className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="SSP">SSP</option><option value="USD">USD</option></select></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Description</label><input type="text" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Amount</label><input type="number" step="0.01" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save Expense</Button></div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Expense" size="md">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Category</label><select value={editExpense.category} onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{expenseCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select value={editExpense.currency} onChange={e => setEditExpense({ ...editExpense, currency: e.target.value as Currency })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="SSP">SSP</option><option value="USD">USD</option></select></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Description</label><input type="text" value={editExpense.description} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Amount</label><input type="number" step="0.01" value={editExpense.amount} onChange={e => setEditExpense({ ...editExpense, amount: Number(e.target.value) })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" value={editExpense.date} onChange={e => setEditExpense({ ...editExpense, date: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Expense Details" size="md">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-muted-foreground">Category</p><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColors[selected.category] || categoryColors.other}`}>{selected.category}</span></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.date)}</p></div>
              <div className="col-span-2"><p className="text-muted-foreground">Description</p><p className="font-medium">{selected.description}</p></div>
              <div><p className="text-muted-foreground">Amount</p><p className="font-bold text-primary">{formatCurrency(selected.amount, selected.currency)}</p></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
              {isAdmin && <Button onClick={() => { setShowDetail(false); openEdit(selected); }}>Edit Expense</Button>}
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
