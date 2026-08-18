'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ShoppingCart, Plus, Eye, Printer, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const mockSales = [
  { id: 'INV-2608-0001', customer: 'Adaeze Okonkwo', items: [{ name: 'Amoxicillin 500mg', qty: 2, price: 2500 }, { name: 'Paracetamol 500mg', qty: 10, price: 500 }], subtotal: 10000, discount: 500, tax: 0, total: 9500, payment_method: 'cash', status: 'completed', created_at: new Date().toISOString() },
  { id: 'INV-2608-0002', customer: 'Chukwuemeka Nnamdi', items: [{ name: 'Metformin 850mg', qty: 3, price: 1800 }], subtotal: 5400, discount: 0, tax: 0, total: 5400, payment_method: 'card', status: 'completed', created_at: new Date().toISOString() },
  { id: 'INV-2608-0003', customer: 'Fatima Abubakar', items: [{ name: 'Vitamin C 1000mg', qty: 5, price: 800 }, { name: 'Lisinopril 10mg', qty: 2, price: 1200 }], subtotal: 6400, discount: 0, tax: 0, total: 6400, payment_method: 'transfer', status: 'completed', created_at: new Date().toISOString() },
  { id: 'INV-2608-0004', customer: 'Walk-in', items: [{ name: 'Ibuprofen 400mg', qty: 1, price: 700 }], subtotal: 700, discount: 0, tax: 0, total: 700, payment_method: 'cash', status: 'completed', created_at: new Date().toISOString() },
];

const paymentColors: Record<string, 'success' | 'info' | 'default' | 'warning'> = {
  cash: 'success',
  card: 'info',
  transfer: 'default',
  credit: 'warning',
};

export default function SalesPage() {
  const [showDetail, setShowDetail] = useState(false);
  const [selected, setSelected] = useState(mockSales[0]);
  const [showNewSale, setShowNewSale] = useState(false);

  const todayTotal = mockSales.reduce((s, sale) => s + sale.total, 0);

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sales</h1>
            <p className="text-sm text-muted-foreground">Manage point of sale and invoices</p>
          </div>
          <Button onClick={() => setShowNewSale(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Sale
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Today&apos;s Sales</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(todayTotal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Transactions Today</p>
              <p className="text-2xl font-bold">{mockSales.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-muted-foreground">Avg. Transaction</p>
              <p className="text-2xl font-bold">{formatCurrency(todayTotal / mockSales.length)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
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
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{sale.id}</td>
                    <td className="p-3 font-medium">{sale.customer}</td>
                    <td className="p-3 text-right">{sale.items.length}</td>
                    <td className="p-3 text-right font-semibold text-primary">{formatCurrency(sale.total)}</td>
                    <td className="p-3">
                      <Badge variant={paymentColors[sale.payment_method]}>{sale.payment_method}</Badge>
                    </td>
                    <td className="p-3">
                      <Badge variant={sale.status === 'completed' ? 'success' : 'danger'}>{sale.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => { setSelected(sale); setShowDetail(true); }}
                        className="p-1.5 rounded hover:bg-muted"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={showDetail} onClose={() => setShowDetail(false)} title={`Invoice ${selected.id}`} size="md">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{selected.customer}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(selected.created_at)}</p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 font-medium">Item</th>
                  <th className="text-right p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2 text-right">{item.qty}</td>
                    <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(item.qty * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(selected.subtotal)}</span></div>
              {selected.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="text-danger">-{formatCurrency(selected.discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t border-border pt-1"><span>Total</span><span className="text-primary">{formatCurrency(selected.total)}</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDetail(false)}>Close</Button>
              <Button><Printer className="w-4 h-4 mr-2" /> Print Invoice</Button>
            </div>
          </div>
        </Modal>

        <Modal open={showNewSale} onClose={() => setShowNewSale(false)} title="New Sale" size="lg">
          <div className="space-y-4">
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">POS Terminal</p>
              <p className="text-sm mt-1">Scan or search for products to add to this sale</p>
              <div className="mt-4 max-w-md mx-auto">
                <input
                  type="text"
                  placeholder="Search products by name or barcode..."
                  className="w-full px-4 py-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowNewSale(false)}>Cancel</Button>
              <Button variant="accent">Complete Sale</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
