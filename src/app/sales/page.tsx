'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { ShoppingCart, Plus, Search, Edit2, Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, type Currency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';

const paymentMethods = [
  { value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' },
  { value: 'transfer', label: 'Transfer' }, { value: 'credit', label: 'Credit' },
];

const initialSales = [
  { id: '1', invoice: 'GS-260801-0001', customer: 'Amina Deng', items: 5, subtotal: 35000, discount: 2000, tax: 0, total: 33000, payment_method: 'cash', status: 'completed', currency: 'SSP' as Currency, date: '2026-08-18' },
  { id: '2', invoice: 'GS-260801-0002', customer: 'Peter Garang', items: 3, subtotal: 11.00, discount: 0, tax: 0, total: 11.00, payment_method: 'cash', status: 'completed', currency: 'USD' as Currency, date: '2026-08-18' },
  { id: '3', invoice: 'GS-260801-0003', customer: 'Sarah Nyabol', items: 8, subtotal: 22500, discount: 1000, tax: 0, total: 21500, payment_method: 'transfer', status: 'completed', currency: 'SSP' as Currency, date: '2026-08-17' },
  { id: '4', invoice: 'GS-260801-0004', customer: 'James Bol', items: 2, subtotal: 16000, discount: 0, tax: 0, total: 16000, payment_method: 'card', status: 'completed', currency: 'SSP' as Currency, date: '2026-08-17' },
  { id: '5', invoice: 'GS-260801-0005', customer: 'Grace Akello', items: 4, subtotal: 28.50, discount: 3.50, tax: 0, total: 25.00, payment_method: 'cash', status: 'returned', currency: 'USD' as Currency, date: '2026-08-16' },
  { id: '6', invoice: 'GS-260801-0006', customer: 'David Malual', items: 1, subtotal: 8500, discount: 0, tax: 0, total: 8500, payment_method: 'credit', status: 'completed', currency: 'SSP' as Currency, date: '2026-08-16' },
];

type Sale = typeof initialSales[number];

const emptySale: Sale = {
  id: '', invoice: '', customer: '', items: 0, subtotal: 0, discount: 0, tax: 0, total: 0,
  payment_method: 'cash', status: 'completed', currency: 'SSP', date: new Date().toISOString().slice(0, 10),
};

export default function SalesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Sale>(initialSales[0]);
  const [editSale, setEditSale] = useState<Sale>(emptySale);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  const filtered = sales.filter(s =>
    s.invoice.toLowerCase().includes(search.toLowerCase()) ||
    s.customer.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (sale: Sale) => { setEditSale({ ...sale }); setShowEdit(true); };
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setSales(prev => prev.map(s => s.id === editSale.id ? editSale : s));
    setShowEdit(false);
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
                  <th className="text-right p-3 font-medium">Items</th>
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
                    <td className="p-3 font-mono text-xs font-medium">{sale.invoice}</td>
                    <td className="p-3 font-medium">{sale.customer}</td>
                    <td className="p-3 text-right">{sale.items}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(sale.total, sale.currency)}</td>
                    <td className="p-3"><Badge variant="default">{sale.payment_method}</Badge></td>
                    <td className="p-3"><Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'returned' ? 'danger' : 'warning'}>{sale.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{formatDate(sale.date)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(sale); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => openEdit(sale)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>}
                        {isAdmin && <button className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8}><EmptyState icon={<ShoppingCart className="w-8 h-8 text-muted-foreground" />} title="No sales found" description="No sales match your search" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Sale" size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Customer Name</label><input type="text" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="SSP">SSP</option><option value="USD">USD</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" step="0.01" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Discount</label><input type="number" step="0.01" defaultValue={0} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Payment Method</label><select className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save Sale</Button></div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Sale - ${editSale.invoice}`} size="md">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Customer Name</label><input type="text" value={editSale.customer} onChange={e => setEditSale({ ...editSale, customer: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select value={editSale.currency} onChange={e => setEditSale({ ...editSale, currency: e.target.value as Currency })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="SSP">SSP</option><option value="USD">USD</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" step="0.01" value={editSale.subtotal} onChange={e => setEditSale({ ...editSale, subtotal: Number(e.target.value), total: Number(e.target.value) - editSale.discount })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Discount</label><input type="number" step="0.01" value={editSale.discount} onChange={e => setEditSale({ ...editSale, discount: Number(e.target.value), total: editSale.subtotal - Number(e.target.value) })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Total</label><input type="number" step="0.01" value={editSale.total} readOnly className="flex h-10 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Payment Method</label><select value={editSale.payment_method} onChange={e => setEditSale({ ...editSale, payment_method: e.target.value as Sale['payment_method'] })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Status</label><select value={editSale.status} onChange={e => setEditSale({ ...editSale, status: e.target.value as Sale['status'] })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="completed">Completed</option><option value="returned">Returned</option><option value="cancelled">Cancelled</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" value={editSale.date} onChange={e => setEditSale({ ...editSale, date: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Sale — ${selected.invoice}`} size="md">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{selected.customer}</p></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.date)}</p></div>
              <div><p className="text-muted-foreground">Subtotal</p><p className="font-medium">{formatCurrency(selected.subtotal, selected.currency)}</p></div>
              <div><p className="text-muted-foreground">Discount</p><p className="font-medium text-danger">-{formatCurrency(selected.discount, selected.currency)}</p></div>
              <div><p className="text-muted-foreground">Total</p><p className="font-bold text-primary">{formatCurrency(selected.total, selected.currency)}</p></div>
              <div><p className="text-muted-foreground">Payment</p><Badge variant="default">{selected.payment_method}</Badge></div>
              <div><p className="text-muted-foreground">Status</p><Badge variant={selected.status === 'completed' ? 'success' : 'danger'}>{selected.status}</Badge></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
              {isAdmin && <Button onClick={() => { setShowDetail(false); openEdit(selected); }}>Edit Sale</Button>}
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
