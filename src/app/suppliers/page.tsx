'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Truck, Phone, Mail, MapPin, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { getAllSuppliers, addSupplier, updateSupplier, deleteSupplier } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Supplier } from '@/types/database';

const emptySupplier: Omit<Supplier, 'id' | 'created_at'> = {
  name: '',
  contact_person: '',
  phone: '',
  email: null,
  address: '',
  city: '',
  notes: null,
  is_active: true,
};

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Partial<Supplier>>({});
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    await seedOfflineData();
    const data = await getAllSuppliers();
    setSuppliers(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact_person.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (supplier: Supplier) => { setEditSupplier({ ...supplier }); setShowEdit(true); };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplier.id) return;
    await updateSupplier(editSupplier.id, editSupplier);
    setShowEdit(false);
    await loadData();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emailVal = (form.querySelector('#email') as HTMLInputElement).value;
    const notesVal = (form.querySelector('#notes') as HTMLTextAreaElement).value;
    await addSupplier({
      name: (form.querySelector('#name') as HTMLInputElement).value,
      contact_person: (form.querySelector('#contact') as HTMLInputElement).value,
      phone: (form.querySelector('#phone') as HTMLInputElement).value,
      email: emailVal || null,
      address: (form.querySelector('#address') as HTMLInputElement).value,
      city: (form.querySelector('#city') as HTMLInputElement).value,
      notes: notesVal || null,
      is_active: true,
    });
    setShowAdd(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    await deleteSupplier(id);
    await loadData();
  };

  const toggleActive = async (supplier: Supplier) => {
    await updateSupplier(supplier.id, { is_active: !supplier.is_active });
    await loadData();
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Suppliers</h1>
            <p className="text-sm text-muted-foreground">{suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} registered</p>
          </div>
          <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-2" /> Add Supplier</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Supplier Directory</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-4 py-2 rounded-lg border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Contact</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((supplier) => (
                  <tr key={supplier.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <Truck className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">{supplier.contact_person}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{supplier.phone}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {supplier.email ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[160px]">{supplier.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{supplier.city}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => toggleActive(supplier)} className="cursor-pointer">
                        <Badge variant={supplier.is_active ? 'success' : 'danger'}>
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(supplier)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(supplier.id)} className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7}>
                    <EmptyState icon={<Truck className="w-8 h-8 text-muted-foreground" />} title="No suppliers found" description="Add your first supplier to get started" action={<Button onClick={() => setShowAdd(true)}>Add Supplier</Button>} />
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Supplier" size="md">
          <form className="space-y-4" onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Company Name</label><input type="text" id="name" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. MedSupply Ltd" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Contact Person</label><input type="text" id="contact" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. John Doe" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Phone</label><input type="tel" id="phone" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. +211 912 345 678" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Email</label><input type="email" id="email" className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Optional" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">City</label><input type="text" id="city" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Juba" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Address</label><input type="text" id="address" required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Kator Block 5, Shop 12" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Notes</label><textarea id="notes" placeholder="Optional notes about this supplier" className="w-full rounded-lg border border-border p-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Button><Button type="submit">Save Supplier</Button></div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title={`Edit — ${editSupplier.name}`} size="md">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Company Name</label><input type="text" value={editSupplier.name || ''} onChange={e => setEditSupplier({ ...editSupplier, name: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Contact Person</label><input type="text" value={editSupplier.contact_person || ''} onChange={e => setEditSupplier({ ...editSupplier, contact_person: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Phone</label><input type="tel" value={editSupplier.phone || ''} onChange={e => setEditSupplier({ ...editSupplier, phone: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">Email</label><input type="email" value={editSupplier.email || ''} onChange={e => setEditSupplier({ ...editSupplier, email: e.target.value || null })} className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-1">City</label><input type="text" value={editSupplier.city || ''} onChange={e => setEditSupplier({ ...editSupplier, city: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Address</label><input type="text" value={editSupplier.address || ''} onChange={e => setEditSupplier({ ...editSupplier, address: e.target.value })} required className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div className="sm:col-span-2"><label className="block text-sm font-medium text-foreground mb-1">Notes</label><textarea value={editSupplier.notes || ''} onChange={e => setEditSupplier({ ...editSupplier, notes: e.target.value || null })} className="w-full rounded-lg border border-border p-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
            <div className="flex justify-end gap-3"><Button variant="ghost" type="button" onClick={() => setShowEdit(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
          </form>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
