'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Receipt, Plus, Eye } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const mockPurchases = [
  { id: 'PO-2608-0001', supplier: 'Emzor Pharmaceutical', items: [{ name: 'Paracetamol 500mg', qty: 200, cost: 300 }, { name: 'Amoxicillin 500mg', qty: 50, cost: 1800 }], subtotal: 150000, tax: 0, total: 150000, status: 'received', created_at: '2026-08-10T10:00:00Z' },
  { id: 'PO-2608-0002', supplier: 'Swiss Pharma Nigeria', items: [{ name: 'Lisinopril 10mg', qty: 100, cost: 800 }], subtotal: 80000, tax: 0, total: 80000, status: 'ordered', created_at: '2026-08-15T14:30:00Z' },
  { id: 'PO-2608-0003', supplier: 'Nigerian Cosmos', items: [{ name: 'Metformin 850mg', qty: 80, cost: 1200 }], subtotal: 96000, tax: 0, total: 96000, status: 'received', created_at: '2026-08-12T09:00:00Z' },
];

const statusColors: Record<string, 'success' | 'info' | 'danger'> = {
  received: 'success',
  ordered: 'info',
  cancelled: 'danger',
};

export default function PurchasesPage() {
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(mockPurchases[0]);
  const totalSpent = mockPurchases.filter(p => p.status === 'received').reduce((s, p) => s + p.total, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Purchases</h1>
            <p className="text-sm text-muted-foreground">Manage supplier orders and stock purchases</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Purchase Order
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Total Purchases (Month)</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
              <p className="text-2xl font-bold text-accent">{mockPurchases.filter(p => p.status === 'ordered').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Suppliers</p>
              <p className="text-2xl font-bold">{new Set(mockPurchases.map(p => p.supplier)).size}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">PO Number</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-right p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockPurchases.map((po) => (
                  <tr key={po.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{po.id}</td>
                    <td className="p-3 font-medium">{po.supplier}</td>
                    <td className="p-3 text-right">{po.items.length}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(po.total)}</td>
                    <td className="p-3"><Badge variant={statusColors[po.status]}>{po.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{formatDate(po.created_at)}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setSelected(po); setShowDetail(true); }} className="p-1.5 rounded hover:bg-muted">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Purchase Order ${selected.id}`} size="md">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <div><p className="text-muted-foreground">Supplier</p><p className="font-medium">{selected.supplier}</p></div>
              <div className="text-right"><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(selected.created_at)}</p></div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Item</th>
                  <th className="text-right p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Unit Cost</th>
                  <th className="text-right p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right">{item.qty}</td>
                    <td className="p-2 text-right">{formatCurrency(item.cost)}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(item.qty * item.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between font-bold text-lg border-t border-border pt-1">
              <span>Total</span><span className="text-primary">{formatCurrency(selected.total)}</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
              <Button variant="accent">Mark as Received</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
