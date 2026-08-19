'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Package, Plus, Search, Edit2, Trash2, Eye, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, daysUntilExpiry, getExpiryStatus, formatCurrencyPair, type Currency } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { useSettingsStore } from '@/lib/settings-store';
import { useSync } from '@/lib/use-sync';
import { getAllProducts, addProduct, updateProduct, deleteProduct } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Product } from '@/types/database';

const defaultCategoryLabels: Record<string, string> = {
  antibiotics: 'Antibiotics', analgesics: 'Analgesics', vitamins: 'Vitamins & Supplements',
  diabetes: 'Diabetes', cardiovascular: 'Cardiovascular', gastrointestinal: 'Gastrointestinal',
  respiratory: 'Respiratory', dermatology: 'Dermatology', other: 'Other',
};

const currencyOptions = [
  { value: 'SSP', label: 'SSP (South Sudanese Pound)' },
  { value: 'USD', label: 'USD (US Dollar)' },
];

const alertDaysOptions = [
  { value: '7', label: '7 days' }, { value: '14', label: '14 days' },
  { value: '30', label: '30 days' }, { value: '60', label: '60 days' },
  { value: '90', label: '90 days' }, { value: '180', label: '6 months' },
  { value: '365', label: '1 year' }, { value: '730', label: '2 years' },
];

const emptyProduct: Partial<Product> = {
  name: '', generic_name: '', category: 'antibiotics', sku: '', unit_price: 0, cost_price: 0,
  currency: 'SSP', quantity_in_stock: 0, reorder_level: 0, expiry_date: '', alert_days: 30,
  batch_number: '', manufacturer: '', is_active: true,
};

export default function InventoryPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const settings = useSettingsStore();
  const { refreshCount } = useSync();

  const categories = [
    { value: 'all', label: 'All Categories' },
    ...settings.categories.map(c => ({ value: c, label: defaultCategoryLabels[c] || c.charAt(0).toUpperCase() + c.slice(1) })),
  ];
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Partial<Product>>(emptyProduct);
  const [addCurrency, setAddCurrency] = useState('SSP');
  const [editCurrency, setEditCurrency] = useState('SSP');
  const [newCatInput, setNewCatInput] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(async () => {
    await seedOfflineData();
    const data = await getAllProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.generic_name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || p.category === category;
    return matchSearch && matchCategory;
  });

  const openEdit = (product: Product) => {
    setEditProduct({ ...product });
    setEditCurrency(product.currency);
    setShowEditModal(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct.id) return;
    await updateProduct(editProduct.id, editProduct);
    await refreshCount();
    setShowEditModal(false);
    await loadProducts();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
      name: (form.querySelector('#name') as HTMLInputElement).value,
      generic_name: (form.querySelector('#generic') as HTMLInputElement).value,
      category: (form.querySelector('#category') as HTMLSelectElement).value,
      sku: (form.querySelector('#sku') as HTMLInputElement).value,
      barcode: (form.querySelector('#barcode') as HTMLInputElement)?.value || null,
      unit_price: Number((form.querySelector('#price') as HTMLInputElement).value),
      cost_price: Number((form.querySelector('#cost') as HTMLInputElement).value),
      currency: addCurrency as Currency,
      quantity_in_stock: Number((form.querySelector('#quantity') as HTMLInputElement).value),
      reorder_level: Number((form.querySelector('#reorder') as HTMLInputElement).value),
      expiry_date: (form.querySelector('#expiry') as HTMLInputElement).value,
      alert_days: Number((form.querySelector('#alert_days') as HTMLSelectElement)?.value || 30),
      batch_number: (form.querySelector('#batch') as HTMLInputElement).value,
      manufacturer: (form.querySelector('#manufacturer') as HTMLInputElement).value,
      description: (form.querySelector('#desc') as HTMLTextAreaElement)?.value || null,
      image_url: null,
      is_active: true,
      supplier_id: null,
    };
    await addProduct(data);
    await refreshCount();
    setShowAddModal(false);
    await loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
    await refreshCount();
    await loadProducts();
  };

  const downloadTemplate = () => {
    const headers = ['name', 'generic_name', 'category', 'sku', 'manufacturer', 'currency', 'unit_price', 'cost_price', 'quantity_in_stock', 'reorder_level', 'expiry_date', 'alert_days', 'batch_number'];
    const exampleRow = ['Amoxicillin 500mg', 'Amoxicillin', 'antibiotics', 'AMX-500', 'Juba Pharma', 'SSP', 8500, 6000, 45, 20, '2027-06-15', 90, 'BCH-001'];
    const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'global-pharmacy-import-template.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.name || !row.sku) {
            errors.push(`Row ${i + 2}: Missing required fields (name, sku)`);
            continue;
          }
          const cat = String(row.category || 'other').toLowerCase();
          const validCategories = categories.filter(c => c.value !== 'all').map(c => c.value);
          const currency = String(row.currency || 'SSP').toUpperCase();
          const cur: Currency = currency === 'USD' ? 'USD' : 'SSP';

          const productData: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
            name: String(row.name),
            generic_name: String(row.generic_name || row.name),
            category: validCategories.includes(cat) ? cat : 'other',
            sku: String(row.sku),
            barcode: row.barcode ? String(row.barcode) : null,
            unit_price: Number(row.unit_price) || 0,
            cost_price: Number(row.cost_price) || 0,
            currency: cur,
            quantity_in_stock: Number(row.quantity_in_stock) || 0,
            reorder_level: Number(row.reorder_level) || 0,
            expiry_date: String(row.expiry_date || '2028-01-01'),
            alert_days: Number(row.alert_days) || 30,
            batch_number: String(row.batch_number || `IMP-${Date.now()}`),
            manufacturer: String(row.manufacturer || 'Unknown'),
            description: row.description ? String(row.description) : null,
            image_url: null,
            is_active: true,
            supplier_id: null,
          };
          await addProduct(productData);
          success++;
        } catch {
          errors.push(`Row ${i + 2}: Failed to import`);
        }
      }

      setImportResult({ success, errors });
      await refreshCount();
      await loadProducts();
    } catch {
      setImportResult({ success: 0, errors: ['Failed to read file. Make sure it is a valid Excel or CSV file.'] });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm text-muted-foreground">{products.length} products in stock</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" /> Template</Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload className="w-4 h-4 mr-2" /> {importing ? 'Importing...' : 'Import Excel'}</Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        {importResult && (
          <div className={`p-4 rounded-lg border ${importResult.errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <p className="font-medium text-sm">
              {importResult.success > 0 && `Successfully imported ${importResult.success} product(s).`}
              {importResult.errors.length > 0 && ` ${importResult.errors.length} row(s) had errors.`}
            </p>
            {importResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-red-600 space-y-1">
                {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            )}
            <button onClick={() => setImportResult(null)} className="mt-2 text-xs text-muted-foreground hover:underline">Dismiss</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search by name, SKU, or generic name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <Select options={categories} value={category} onChange={(e) => setCategory(e.target.value)} className="w-full sm:w-48" />
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-left p-3 font-medium">SKU</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-right p-3 font-medium">Price</th>
                  <th className="text-right p-3 font-medium">Stock</th>
                  <th className="text-left p-3 font-medium">Expiry</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => {
                  const expiryStatus = getExpiryStatus(product.expiry_date);
                  const isLow = product.quantity_in_stock <= product.reorder_level;
                  return (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.manufacturer}</p>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{product.sku}</td>
                      <td className="p-3"><Badge variant="info">{product.category}</Badge></td>
                      <td className="p-3 text-right">
                        <span className="font-medium">{formatCurrencyPair(product.unit_price, product.currency, settings.exchangeRate)}</span>
                      </td>
                      <td className="p-3 text-right">
                        <Badge variant={isLow ? 'danger' : 'success'}>{product.quantity_in_stock}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={expiryStatus === 'expired' ? 'danger' : expiryStatus === 'critical' ? 'danger' : expiryStatus === 'warning' ? 'warning' : 'success'}>
                          {formatDate(product.expiry_date)}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }} className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(product)} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                          {isAdmin && <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded hover:bg-red-50 text-danger"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7}>
                    <EmptyState icon={<Package className="w-8 h-8 text-muted-foreground" />} title="No products found" description="Add your first product to get started" action={<Button onClick={() => setShowAddModal(true)}>Add Product</Button>} />
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Modal */}
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product" size="lg">
          <form className="space-y-4" onSubmit={handleAdd}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Product Name" id="name" placeholder="e.g. Amoxicillin 500mg" required />
              <Input label="Generic Name" id="generic" placeholder="e.g. Amoxicillin" required />
              <Input label="SKU" id="sku" placeholder="e.g. AMX-500" required />
              <Input label="Barcode" id="barcode" placeholder="Optional barcode" />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <div className="flex gap-2">
                  <select id="category" className="flex-1 h-10 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {categories.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewCat(!showNewCat)} className="px-3 h-10 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 whitespace-nowrap">+ New</button>
                </div>
                {showNewCat && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="Category name..." className="flex-1 h-9 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCatInput.trim()) { settings.addCategory(newCatInput.trim()); setNewCatInput(''); setShowNewCat(false); } } }} />
                    <button type="button" onClick={() => { if (newCatInput.trim()) { settings.addCategory(newCatInput.trim()); setNewCatInput(''); setShowNewCat(false); } }} className="px-3 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">Add</button>
                  </div>
                )}
              </div>
              <Input label="Manufacturer" id="manufacturer" placeholder="e.g. Juba Pharma" required />
              <Select label="Currency" id="currency" options={currencyOptions} value={addCurrency} onChange={(e) => setAddCurrency(e.target.value)} />
              <div />
              <Input label={`Unit Price (${addCurrency})`} id="price" type="number" step="0.01" required />
              <Input label={`Cost Price (${addCurrency})`} id="cost" type="number" step="0.01" required />
              <Input label="Quantity" id="quantity" type="number" required />
              <Input label="Reorder Level" id="reorder" type="number" required />
              <Input label="Expiry Date" id="expiry" type="date" required />
              <Input label="Batch Number" id="batch" placeholder="e.g. BCH-001" required />
              <Select label="Alert Before Expiry" id="alert_days" options={alertDaysOptions} value="30" />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea id="desc" placeholder="Optional product description" className="w-full rounded-lg border border-border p-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title={`Edit — ${editProduct.name}`} size="lg">
          <form className="space-y-4" onSubmit={saveEdit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Product Name" id="ename" value={editProduct.name || ''} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} required />
              <Input label="Generic Name" id="egeneric" value={editProduct.generic_name || ''} onChange={e => setEditProduct({ ...editProduct, generic_name: e.target.value })} required />
              <Input label="SKU" id="esk" value={editProduct.sku || ''} onChange={e => setEditProduct({ ...editProduct, sku: e.target.value })} required />
              <Input label="Manufacturer" id="emanufacturer" value={editProduct.manufacturer || ''} onChange={e => setEditProduct({ ...editProduct, manufacturer: e.target.value })} required />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                <div className="flex gap-2">
                  <select value={editProduct.category || ''} onChange={e => setEditProduct({ ...editProduct, category: e.target.value })} className="flex-1 h-10 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    {categories.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <button type="button" onClick={() => setShowNewCat(!showNewCat)} className="px-3 h-10 rounded-lg border border-border bg-white text-sm font-medium hover:bg-gray-50 whitespace-nowrap">+ New</button>
                </div>
                {showNewCat && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="Category name..." className="flex-1 h-9 rounded-lg border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); if (newCatInput.trim()) { settings.addCategory(newCatInput.trim()); setNewCatInput(''); setShowNewCat(false); } } }} />
                    <button type="button" onClick={() => { if (newCatInput.trim()) { settings.addCategory(newCatInput.trim()); setNewCatInput(''); setShowNewCat(false); } }} className="px-3 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">Add</button>
                  </div>
                )}
              </div>
              <Select label="Currency" id="ecurrency" options={currencyOptions} value={editCurrency} onChange={e => { setEditCurrency(e.target.value as Currency); setEditProduct({ ...editProduct, currency: e.target.value as Currency }); }} />
              <Input label={`Unit Price (${editCurrency})`} id="eprice" type="number" step="0.01" value={editProduct.unit_price || 0} onChange={e => setEditProduct({ ...editProduct, unit_price: Number(e.target.value) })} required />
              <Input label={`Cost Price (${editCurrency})`} id="ecost" type="number" step="0.01" value={editProduct.cost_price || 0} onChange={e => setEditProduct({ ...editProduct, cost_price: Number(e.target.value) })} required />
              <Input label="Quantity" id="equantity" type="number" value={editProduct.quantity_in_stock || 0} onChange={e => setEditProduct({ ...editProduct, quantity_in_stock: Number(e.target.value) })} required />
              <Input label="Reorder Level" id="ereorder" type="number" value={editProduct.reorder_level || 0} onChange={e => setEditProduct({ ...editProduct, reorder_level: Number(e.target.value) })} required />
              <Input label="Expiry Date" id="eexpiry" type="date" value={editProduct.expiry_date || ''} onChange={e => setEditProduct({ ...editProduct, expiry_date: e.target.value })} required />
              <Input label="Batch Number" id="ebatch" value={editProduct.batch_number || ''} onChange={e => setEditProduct({ ...editProduct, batch_number: e.target.value })} required />
              <Select label="Alert Before Expiry" id="ealert_days" options={alertDaysOptions} value={String(editProduct.alert_days || 30)} onChange={e => setEditProduct({ ...editProduct, alert_days: Number(e.target.value) })} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>

        {/* Detail Modal */}
        <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title="Product Details" size="md">
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedProduct.name}</p></div>
                <div><p className="text-muted-foreground">Generic</p><p className="font-medium">{selectedProduct.generic_name}</p></div>
                <div><p className="text-muted-foreground">SKU</p><p className="font-medium font-mono">{selectedProduct.sku}</p></div>
                <div><p className="text-muted-foreground">Category</p><Badge variant="info">{selectedProduct.category}</Badge></div>
                <div><p className="text-muted-foreground">Unit Price</p><p className="font-medium">{formatCurrencyPair(selectedProduct.unit_price, selectedProduct.currency, settings.exchangeRate)}</p></div>
                <div><p className="text-muted-foreground">Cost Price</p><p className="font-medium">{formatCurrencyPair(selectedProduct.cost_price, selectedProduct.currency, settings.exchangeRate)}</p></div>
                <div><p className="text-muted-foreground">Stock</p><Badge variant={selectedProduct.quantity_in_stock <= selectedProduct.reorder_level ? 'danger' : 'success'}>{selectedProduct.quantity_in_stock} units</Badge></div>
                <div><p className="text-muted-foreground">Reorder Level</p><p className="font-medium">{selectedProduct.reorder_level}</p></div>
                <div><p className="text-muted-foreground">Expiry Date</p><Badge variant={getExpiryStatus(selectedProduct.expiry_date) === 'expired' ? 'danger' : getExpiryStatus(selectedProduct.expiry_date) === 'critical' ? 'danger' : 'warning'}>{formatDate(selectedProduct.expiry_date)} ({daysUntilExpiry(selectedProduct.expiry_date)} days)</Badge></div>
                <div><p className="text-muted-foreground">Alert Before Expiry</p><p className="font-medium">{selectedProduct.alert_days} days</p></div>
                <div><p className="text-muted-foreground">Batch</p><p className="font-medium font-mono">{selectedProduct.batch_number}</p></div>
                <div><p className="text-muted-foreground">Manufacturer</p><p className="font-medium">{selectedProduct.manufacturer}</p></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setShowDetailModal(false)}>Close</Button>
                <Button onClick={() => { setShowDetailModal(false); openEdit(selectedProduct); }}>Edit Product</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
