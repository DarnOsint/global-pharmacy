'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Receipt, Plus, Search, Edit2, Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, formatCurrencyPair, type Currency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { useSettingsStore } from '@/lib/settings-store';
import { useSync } from '@/lib/use-sync';
import { getAllPurchases, addPurchase, updatePurchase, deletePurchase, getAllSuppliers } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Purchase, Supplier } from '@/types/database';

const currencies = [{ value: 'SSP', label: 'SSP' }, { value: 'USD', label: 'USD' }];
const statuses = [{ value: 'ordered', label: 'Ordered' }, { value: 'received', label: 'Received' }, { value: 'cancelled', label: 'Cancelled' }];

export default function PurchasesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const settings = useSettingsStore();
  const { refreshCount } = useSync();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState<Purchase | null>(null);
  const [editPurchase, setEditPurchase] = useState<Partial<Purchase>>({});
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    await seedOfflineData();
    const [p, s] = await Promise.all([getAllPurchases(), getAllSuppliers()]);
    setPurchases(p);
    setSuppliers(s);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = purchases.filter(p =>
    p.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (purchase: Purchase) => { setEditPurchase({ ...purchase }); setShowEdit(true); };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPurchase.id) return;
    await updatePurchase(editPurchase.id, editPurchase);
    await refreshCount();
    setShowEdit(false);
    await loadData();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const supplierId = (form.querySelector('#supplier') as HTMLSelectElement).value;
    const subtotal = Number((form.querySelector('#subtotal') as HTMLInputElement).value);
    const data = {
      invoice_number: `GP-${Date.now().toString().slice(-8)}`,
      supplier_id: supplierId,
      user_id: user?.id || '',
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'ordered' as const,
      currency: (form.querySelector('#currency') as HTMLSelectElement).value as Currency,
      notes: null,
    };
    await addPurchase(data, []);
    await refreshCount();
    setShowAdd(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this purchase?')) return;
    await deletePurchase(id);
    await refreshCount();
    await loadData();
  };

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id;

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
              <input type="text" placeholder="Search invoice..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-lg border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Invoice</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs font-medium">{purchase.invoice_number}</td>
                    <td className="p-3 font-medium">{getSupplierName(purchase.supplier_id)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrencyPair(purchase.total, (purchase as any).currency || 'SSP', settings.exchangeRate)}</td>
                    <td className="p-3"><Badge variant={purchase.status === 'received' ? 'success' : purchase.status === 'ordered' ? 'warning' : 'danger'}>{purchase.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{formatDate(purchase.created_at)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(purchase); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        {isAdmin && <button onClick={() => openEdit(purchase)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>}
                        {isAdmin && <button onClick={() => handleDelete(purchase.id)} className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6}><EmptyState icon={<Receipt className="w-8 h-8 text-muted-foreground" />} title="No purchases found" description="Create your first purchase order" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New Purchase Order" size="md">
          <form className="space-y-4" onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Supplier</label><select id="supplier" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Currency</label><select id="currency" className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" id="subtotal" step="0.01" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save Purchase</Button></div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit — ${editPurchase.invoice_number}`} size="md">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-foreground mb-1">Subtotal</label><input type="number" step="0.01" value={editPurchase.subtotal || 0} onChange={e => setEditPurchase({ ...editPurchase, subtotal: Number(e.target.value), total: Number(e.target.value) })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Status</label><select value={editPurchase.status || 'ordered'} onChange={e => setEditPurchase({ ...editPurchase, status: e.target.value as Purchase['status'] })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">{statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Purchase — ${selected?.invoice_number}`} size="md">
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Supplier</p><p className="font-medium">{getSupplierName(selected.supplier_id)}</p></div>
                <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-bold text-primary">{formatCurrency(selected.total, (selected as any).currency || 'SSP')}</p></div>
                <div><p className="text-muted-foreground">Status</p><Badge variant={selected.status === 'received' ? 'success' : 'warning'}>{selected.status}</Badge></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
                {isAdmin && <Button onClick={() => { setShowDetail(false); openEdit(selected); }}>Edit Purchase</Button>}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
