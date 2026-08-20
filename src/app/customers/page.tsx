'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Users, Phone, Mail, MapPin, Plus, Edit, Trash2, Search, Calendar } from 'lucide-react';
import { getAllCustomers, addCustomer, updateCustomer, deleteCustomer } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import { formatDate } from '@/lib/utils';
import type { Customer } from '@/types/database';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const emptyForm = { name: '', phone: '', email: '', address: '', date_of_birth: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    await seedOfflineData();
    setCustomers(await getAllCustomers());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const openAdd = () => { setForm(emptyForm); setShowAdd(true); };
  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email || '', address: c.address || '', date_of_birth: c.date_of_birth || '' });
    setEditing(c);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editing) {
      await updateCustomer(editing.id, {
        name: form.name.trim(), phone: form.phone.trim(),
        email: form.email.trim() || null, address: form.address.trim() || null,
        date_of_birth: form.date_of_birth || null,
      });
    } else {
      await addCustomer({
        name: form.name.trim(), phone: form.phone.trim(),
        email: form.email.trim() || null, address: form.address.trim() || null,
        date_of_birth: form.date_of_birth || null,
      });
    }
    setShowAdd(false); setEditing(null);
    setCustomers(await getAllCustomers());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    await deleteCustomer(id);
    setCustomers(await getAllCustomers());
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Customers</h1>
            <p className="text-sm text-muted-foreground">{customers.length} customers registered</p>
          </div>
          <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Customer</Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search by name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Phone</th>
                  <th className="text-left p-3 font-medium">Email</th>
                  <th className="text-left p-3 font-medium">Address</th>
                  <th className="text-left p-3 font-medium">Since</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /> {c.phone}</td>
                    <td className="p-3 text-muted-foreground">{c.email || '-'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{c.address || '-'}</td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(c.created_at)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-2 opacity-30" />{search ? 'No customers match search' : 'No customers yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={showAdd || !!editing} onClose={() => { setShowAdd(false); setEditing(null); }} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name *</label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone *</label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+211920123456" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Juba, South Sudan" />
          </div>
          <div>
            <label className="text-sm font-medium">Date of Birth</label>
            <Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null); }}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? 'Update' : 'Add'} Customer</Button>
          </div>
        </div>
      </Modal>
      </AppShell>
    </AuthGuard>
  );
}
