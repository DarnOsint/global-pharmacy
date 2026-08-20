'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { FileText, Printer, Download, Search, Eye, ShoppingCart } from 'lucide-react';
import { getAllSales, getSaleItemsBySale, getAllProducts } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import { useSettingsStore } from '@/lib/settings-store';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Sale, SaleItem, Product } from '@/types/database';
import * as XLSX from 'xlsx';

export default function InvoicesPage() {
  const settings = useSettingsStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [viewItems, setViewItems] = useState<(SaleItem & { productName: string })[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    await seedOfflineData();
    const [s, p] = await Promise.all([getAllSales(), getAllProducts()]);
    setSales(s);
    setProducts(p);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const productName = (id: string) => products.find(p => p.id === id)?.name || 'Unknown';

  const filtered = sales.filter(s =>
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase())
  );

  const viewInvoice = async (sale: Sale) => {
    const items = await getSaleItemsBySale(sale.id);
    setViewItems(items.map(i => ({ ...i, productName: productName(i.product_id) })));
    setViewing(sale);
  };

  const printReceipt = () => {
    if (!receiptRef.current) return;
    const w = window.open('', '_blank', 'width=320,height=600');
    if (!w) return;
    w.document.write(`<html><head><title>Invoice ${viewing?.invoice_number}</title><style>
      body{font-family:'Courier New',monospace;font-size:12px;margin:0;padding:8px;width:280px;}
      .center{text-align:center;} .bold{font-weight:bold;} .line{border-top:1px dashed #000;margin:4px 0;}
      table{width:100%;font-size:11px;} td{padding:1px 0;} .r{text-align:right;}
    </style></head><body>`);
    w.document.write(receiptRef.current.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.print();
  };

  const exportInvoice = () => {
    if (!viewing) return;
    const data = viewItems.map(i => ({
      Product: i.productName,
      Qty: i.quantity,
      'Unit Price': i.unit_price,
      Discount: i.discount,
      Total: i.total,
    }));
    data.push({ Product: 'SUBTOTAL', Qty: 0, 'Unit Price': 0, Discount: 0, Total: viewing.subtotal });
    data.push({ Product: 'TAX', Qty: 0, 'Unit Price': 0, Discount: 0, Total: viewing.tax });
    data.push({ Product: 'TOTAL', Qty: 0, 'Unit Price': 0, Discount: 0, Total: viewing.total });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `invoice-${viewing.invoice_number}.xlsx`);
  };

  const statusColor = (s: string) => s === 'completed' ? 'success' : s === 'returned' ? 'warning' : 'danger';
  const payColor = (p: string) => p === 'cash' ? 'success' : p === 'card' ? 'info' : p === 'credit' ? 'warning' : 'default';

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Invoices</h1>
            <p className="text-sm text-muted-foreground">{sales.length} invoices generated from sales</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search by invoice number..."
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
                  <th className="text-left p-3 font-medium">Invoice #</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Payment</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs font-medium">{s.invoice_number}</td>
                    <td className="p-3 text-muted-foreground text-xs">{formatDate(s.created_at)}</td>
                    <td className="p-3 text-right font-medium">{formatCurrency(s.total, s.currency)}</td>
                    <td className="p-3"><Badge variant={payColor(s.payment_method)}>{s.payment_method}</Badge></td>
                    <td className="p-3"><Badge variant={statusColor(s.status)}>{s.status}</Badge></td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => viewInvoice(s)}><Eye className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />{search ? 'No invoices match' : 'No invoices yet'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Invoice ${viewing?.invoice_number || ''}`}>
        {viewing && (
          <div className="space-y-4">
            <div className="hidden" ref={receiptRef}>
              <div className="center bold" style={{fontSize:16}}>GLOBAL PHARMACY</div>
              <div className="center" style={{fontSize:10}}>{settings.storeName || 'Global Pharmacy'}</div>
              <div className="center" style={{fontSize:10}}>{settings.address || 'Juba, South Sudan'}</div>
              <div className="center" style={{fontSize:10}}>Tel: {settings.phone || '+211920123456'}</div>
              <div className="line" />
              <div className="center bold" style={{fontSize:13}}>INVOICE</div>
              <div style={{fontSize:10}}>Invoice: {viewing.invoice_number}</div>
              <div style={{fontSize:10}}>Date: {formatDate(viewing.created_at)}</div>
              <div style={{fontSize:10}}>Payment: {viewing.payment_method.toUpperCase()}</div>
              <div className="line" />
              <table>
                <thead><tr><th style={{textAlign:'left'}}>Item</th><th style={{textAlign:'right'}}>Qty</th><th style={{textAlign:'right'}}>Price</th><th style={{textAlign:'right'}}>Total</th></tr></thead>
                <tbody>
                  {viewItems.map((item, i) => (
                    <tr key={i}>
                      <td style={{fontSize:10,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.productName}</td>
                      <td className="r">{item.quantity}</td>
                      <td className="r">{item.unit_price.toLocaleString()}</td>
                      <td className="r bold">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="line" />
              <div style={{fontSize:10}}><span>Subtotal:</span><span className="r" style={{float:'right'}}>{viewing.subtotal.toLocaleString()} {viewing.currency}</span></div>
              <div style={{fontSize:10}}><span>Tax:</span><span className="r" style={{float:'right'}}>{viewing.tax.toLocaleString()} {viewing.currency}</span></div>
              <div className="line" />
              <div className="bold" style={{fontSize:13}}><span>TOTAL:</span><span className="r" style={{float:'right'}}>{viewing.total.toLocaleString()} {viewing.currency}</span></div>
              <div className="line" />
              <div className="center" style={{fontSize:10}}>Thank you for your purchase!</div>
              <div className="center" style={{fontSize:9}}>Generated by Global Pharmacy POS</div>
            </div>

            <div className="bg-white border border-border rounded-lg p-4" ref={receiptRef}>
              <div className="text-center mb-2">
                <p className="font-bold text-sm">GLOBAL PHARMACY</p>
                <p className="text-xs text-muted-foreground">{settings.address || 'Juba, South Sudan'}</p>
                <p className="text-xs text-muted-foreground">Tel: {settings.phone || '+211920123456'}</p>
              </div>
              <div className="border-t border-dashed border-border my-2" />
              <p className="text-center font-bold text-sm mb-2">INVOICE</p>
              <div className="grid grid-cols-2 gap-1 text-xs mb-2">
                <span className="text-muted-foreground">Invoice:</span><span className="text-right font-mono">{viewing.invoice_number}</span>
                <span className="text-muted-foreground">Date:</span><span className="text-right">{formatDate(viewing.created_at)}</span>
                <span className="text-muted-foreground">Payment:</span><span className="text-right uppercase">{viewing.payment_method}</span>
                <span className="text-muted-foreground">Status:</span><span className="text-right capitalize">{viewing.status}</span>
              </div>
              <div className="border-t border-dashed border-border my-2" />
              <table className="w-full text-xs mb-2">
                <thead><tr className="border-b border-border"><th className="text-left py-1">Item</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Price</th><th className="text-right py-1">Total</th></tr></thead>
                <tbody>
                  {viewItems.map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1 max-w-[120px] truncate">{item.productName}</td>
                      <td className="text-right py-1">{item.quantity}</td>
                      <td className="text-right py-1">{formatCurrency(item.unit_price, viewing.currency)}</td>
                      <td className="text-right py-1 font-medium">{formatCurrency(item.total, viewing.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-dashed border-border my-2" />
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(viewing.subtotal, viewing.currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(viewing.tax, viewing.currency)}</span></div>
                <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>TOTAL</span><span>{formatCurrency(viewing.total, viewing.currency)}</span></div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">Thank you for your purchase!</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={exportInvoice}><Download className="w-4 h-4 mr-2" /> Export Excel</Button>
              <Button onClick={printReceipt}><Printer className="w-4 h-4 mr-2" /> Print</Button>
            </div>
          </div>
        )}
      </Modal>
      </AppShell>
    </AuthGuard>
  );
}
