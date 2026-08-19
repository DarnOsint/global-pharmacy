'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ShoppingCart, Plus, Search, Edit2, Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatCurrencyPair, type Currency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { useSettingsStore } from '@/lib/settings-store';
import { useSync } from '@/lib/use-sync';
import { getAllSales, addSale, updateSale, deleteSale } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Sale } from '@/types/database';

const paymentMethods = [
  { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
  { value: 'transfer', label: 'Transfer' }, { value: 'credit', label: 'Credit' },
];

const currencies = [
  { value: 'SSP', label: 'SSP' }, { value: 'USD', label: 'USD' },
];

const statuses = [
  { value: 'completed', label: 'Completed' }, { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function SalesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const settings = useSettingsStore();
  const { refreshCount } = useSync();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [editSale, setEditSale] = useState<Partial<Sale>>({});
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = useCallback(async () => {
    await seedOfflineData();
    const data = await getAllSales();
    setSales(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadSales(); }, [loadSales]);

  const filtered = sales.filter(s =>
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    s.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (sale: Sale) => { setEditSale({ ...sale }); setShowEdit(true); };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSale.id) return;
    await updateSale(editSale.id, editSale);
    await refreshCount();
    setShowEdit(false);
    await loadSales();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      invoice_number: `GS-${Date.now().toString().slice(-8)}`,
      customer_id: null,
      user_id: user?.id || '',
      subtotal: Number((form.querySelector('#subtotal') as HTMLInputElement).value),
      discount: Number((form.querySelector('#discount') as HTMLInputElement)?.value || 0),
      tax: 0,
      total: 0,
      payment_method: (form.querySelector('#payment') as HTMLSelectElement).value as Sale['payment_method'],
      status: 'completed' as const,
      currency: (form.querySelector('#currency') as HTMLSelectElement).value as Currency,
      notes: (form.querySelector('#customer') as HTMLInputElement).value,
    };
    data.total = data.subtotal - data.discount;
    await addSale(data, []);
    await refreshCount();
    setShowAdd(false);
    await loadSales();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sale?')) return;
    await deleteSale(id);
    await refreshCount();
    await loadSales();
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-sm text-muted-foreground">Manage all sales transactions</p>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> New Sale</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sales Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search invoice or customer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-lg border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Invoice</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Payment</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => (
                  <tr key={sale.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs font-medium">{sale.invoice_number}</td>
                    <td className="p-3 font-medium">{sale.notes || 'Walk-in'}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrencyPair(sale.total, (sale as any).currency || 'SSP', settings.exchangeRate)}</td>
                    <td className="p-3"><Badge variant="default">{sale.payment_method}</Badge></td>
                    <td className="p-3"><Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'returned' ? 'danger' : 'warning'}>{sale.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{formatDate(sale.created_at)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(sale); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => openEdit(sale)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>}
                        {isAdmin && <button onClick={() => handleDelete(sale.id)} className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7}><EmptyState icon={<ShoppingCart className="w-8 h-8 text-muted-foreground" />} title="No sales found" description="Record your first sale" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Sale" size="md">
          <form className="space-y-4" onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Customer Name</label><input type="text" id="customer" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select id="currency" className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" id="subtotal" step="0.01" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Discount</label><input type="number" id="discount" step="0.01" defaultValue={0} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Payment Method</label><select id="payment" className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save Sale</Button></div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Sale — ${editSale.invoice_number}`} size="md">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Customer</label><input type="text" value={(editSale as any).notes || ''} onChange={e => setEditSale({ ...editSale, notes: e.target.value })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Payment</label><select value={editSale.payment_method || 'cash'} onChange={e => setEditSale({ ...editSale, payment_method: e.target.value as Sale['payment_method'] })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" step="0.01" value={editSale.subtotal || 0} onChange={e => setEditSale({ ...editSale, subtotal: Number(e.target.value), total: Number(e.target.value) - (editSale.discount || 0) })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Discount</label><input type="number" step="0.01" value={editSale.discount || 0} onChange={e => setEditSale({ ...editSale, discount: Number(e.target.value), total: (editSale.subtotal || 0) - Number(e.target.value) })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Status</label><select value={editSale.status || 'completed'} onChange={e => setEditSale({ ...editSale, status: e.target.value as Sale['status'] })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Sale — ${selected?.invoice_number}`} size="md">
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{(selected as any).notes || 'Walk-in'}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-bold text-primary">{formatCurrency(selected.total, (selected as any).currency || 'SSP')}</p></div>
                <div><p className="text-muted-foreground">Payment</p><Badge variant="default">{selected.payment_method}</Badge></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant={selected.status === 'completed' ? 'success' : 'danger'}>{selected.status}</Badge></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
                {isAdmin && <Button onClick={() => { setShowDetail(false); openEdit(selected); }}>Edit Sale</Button>}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
