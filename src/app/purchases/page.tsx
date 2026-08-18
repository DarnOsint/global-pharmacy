'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Receipt, Plus, Search, Edit2, Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, type Currency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';

const initialPurchases = [
  { id: '1', invoice: 'GP-260801-0001', supplier: 'Juba Pharma Ltd', items: 12, subtotal: 450000, tax: 0, total: 450000, status: 'received', currency: 'SSP' as Currency, date: '2026-08-01' },
  { id: '2', invoice: 'GP-260801-0002', supplier: 'Medipharm Distributors', items: 8, subtotal: 125.00, tax: 0, total: 125.00, status: 'received', currency: 'USD' as Currency, date: '2026-08-05' },
  { id: '3', invoice: 'GP-260801-0003', supplier: 'Bliss GVS Juba', items: 6, subtotal: 280000, tax: 0, total: 280000, status: 'ordered', currency: 'SSP' as Currency, date: '2026-08-10' },
  { id: '4', invoice: 'GP-260801-0004', supplier: 'VitaHealth South Sudan', items: 15, subtotal: 850000, tax: 0, total: 850000, status: 'received', currency: 'SSP' as Currency, date: '2026-08-12' },
  { id: '5', invoice: 'GP-260801-0005', supplier: 'Swiss Pharma Juba', items: 4, subtotal: 55.00, tax: 0, total: 55.00, status: 'cancelled', currency: 'USD' as Currency, date: '2026-08-14' },
];

type Purchase = typeof initialPurchases[number];

const emptyPurchase: Purchase = {
  id: '', invoice: '', supplier: '', items: 0, subtotal: 0, tax: 0, total: 0,
  status: 'ordered', currency: 'SSP', date: new Date().toISOString().slice(0, 10),
};

export default function PurchasesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Purchase>(initialPurchases[0]);
  const [editPurchase, setEditPurchase] = useState<Purchase>(emptyPurchase);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);

  const filtered = purchases.filter(p =>
    p.invoice.toLowerCase().includes(search.toLowerCase()) ||
    p.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (purchase: Purchase) => { setEditPurchase({ ...purchase }); setShowEdit(true); };
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setPurchases(prev => prev.map(p => p.id === editPurchase.id ? editPurchase : p));
    setShowEdit(false);
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-sm text-muted-foreground">Manage supplier purchase orders</p>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> New Purchase</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Purchase Orders</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search invoice or supplier..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-lg border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Invoice</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-right p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs font-medium">{purchase.invoice}</td>
                    <td className="p-3 font-medium">{purchase.supplier}</td>
                    <td className="p-3 text-right">{purchase.items}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(purchase.total, purchase.currency)}</td>
                    <td className="p-3"><Badge variant={purchase.status === 'received' ? 'success' : purchase.status === 'ordered' ? 'warning' : 'danger'}>{purchase.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{formatDate(purchase.date)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(purchase); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => openEdit(purchase)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>}
                        {isAdmin && <button className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7}><EmptyState icon={<Receipt className="w-8 h-8 text-muted-foreground" />} title="No purchases found" description="No purchases match your search" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Purchase Order" size="md">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAdd(false); }}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Supplier</label><input type="text" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="SSP">SSP</option><option value="USD">USD</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" step="0.01" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save Purchase</Button></div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit Purchase — ${editPurchase.invoice}`} size="md">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Supplier</label><input type="text" value={editPurchase.supplier} onChange={e => setEditPurchase({ ...editPurchase, supplier: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select value={editPurchase.currency} onChange={e => setEditPurchase({ ...editPurchase, currency: e.target.value as Currency })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="SSP">SSP</option><option value="USD">USD</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" step="0.01" value={editPurchase.subtotal} onChange={e => setEditPurchase({ ...editPurchase, subtotal: Number(e.target.value), total: Number(e.target.value) })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Total</label><input type="number" step="0.01" value={editPurchase.total} readOnly className="flex h-10 w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Status</label><select value={editPurchase.status} onChange={e => setEditPurchase({ ...editPurchase, status: e.target.value as Purchase['status'] })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"><option value="ordered">Ordered</option><option value="received">Received</option><option value="cancelled">Cancelled</option></select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Date</label><input type="date" value={editPurchase.date} onChange={e => setEditPurchase({ ...editPurchase, date: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Purchase — ${selected.invoice}`} size="md">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-muted-foreground">Supplier</p><p className="font-medium">{selected.supplier}</p></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.date)}</p></div>
              <div><p className="text-muted-foreground">Total</p><p className="font-bold text-primary">{formatCurrency(selected.total, selected.currency)}</p></div>
              <div><p className="text-muted-foreground">Status</p><Badge variant={selected.status === 'received' ? 'success' : 'warning'}>{selected.status}</Badge></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
              {isAdmin && <Button onClick={() => { setShowDetail(false); openEdit(selected); }}>Edit Purchase</Button>}
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
