'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { Package, Plus, Search, Filter, Edit2, Trash2, Eye } from 'lucide-react';
import { formatCurrency, formatDate, daysUntilExpiry, getExpiryStatus } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'antibiotics', label: 'Antibiotics' },
  { value: 'analgesics', label: 'Analgesics' },
  { value: 'vitamins', label: 'Vitamins & Supplements' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'cardiovascular', label: 'Cardiovascular' },
  { value: 'gastrointestinal', label: 'Gastrointestinal' },
  { value: 'respiratory', label: 'Respiratory' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'other', label: 'Other' },
];

const mockProducts = [
  { id: '1', name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', category: 'antibiotics', sku: 'AMX-500', unit_price: 2500, cost_price: 1800, quantity_in_stock: 5, reorder_level: 20, expiry_date: '2026-12-15', batch_number: 'BCH-001', manufacturer: 'Emzor', is_active: true },
  { id: '2', name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', category: 'analgesics', sku: 'PCM-500', unit_price: 500, cost_price: 300, quantity_in_stock: 150, reorder_level: 50, expiry_date: '2027-06-20', batch_number: 'BCH-002', manufacturer: 'Emzor', is_active: true },
  { id: '3', name: 'Metformin 850mg', generic_name: 'Metformin HCl', category: 'diabetes', sku: 'MET-850', unit_price: 1800, cost_price: 1200, quantity_in_stock: 3, reorder_level: 15, expiry_date: '2026-09-10', batch_number: 'BCH-003', manufacturer: 'Nigerian Cosmos', is_active: true },
  { id: '4', name: 'Lisinopril 10mg', generic_name: 'Lisinopril', category: 'cardiovascular', sku: 'LIS-10', unit_price: 1200, cost_price: 800, quantity_in_stock: 12, reorder_level: 30, expiry_date: '2027-03-25', batch_number: 'BCH-004', manufacturer: 'Swiss Pharma', is_active: true },
  { id: '5', name: 'Vitamin C 1000mg', generic_name: 'Ascorbic Acid', category: 'vitamins', sku: 'VTC-1000', unit_price: 800, cost_price: 450, quantity_in_stock: 85, reorder_level: 30, expiry_date: '2027-08-30', batch_number: 'BCH-005', manufacturer: 'Emzor', is_active: true },
  { id: '6', name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', category: 'analgesics', sku: 'IBU-400', unit_price: 700, cost_price: 400, quantity_in_stock: 45, reorder_level: 25, expiry_date: '2026-08-25', batch_number: 'BCH-006', manufacturer: 'May & Baker', is_active: true },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(mockProducts[0]);

  const filtered = mockProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.generic_name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-sm text-muted-foreground">{mockProducts.length} products in stock</p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, SKU, or generic name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Select
            options={categories}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-48"
          />
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
                      <td className="p-3">
                        <Badge variant="info">{product.category}</Badge>
                      </td>
                      <td className="p-3 text-right font-medium">{formatCurrency(product.unit_price)}</td>
                      <td className="p-3 text-right">
                        <Badge variant={isLow ? 'danger' : 'success'}>
                          {product.quantity_in_stock}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          expiryStatus === 'expired' ? 'danger' :
                          expiryStatus === 'critical' ? 'danger' :
                          expiryStatus === 'warning' ? 'warning' : 'success'
                        }>
                          {formatDate(product.expiry_date)}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedProduct(product); setShowDetailModal(true); }}
                            className="p-1.5 rounded hover:bg-muted"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-muted">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-red-50 text-danger">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={<Package className="w-8 h-8 text-muted-foreground" />}
                        title="No products found"
                        description="Add your first product to get started"
                        action={<Button onClick={() => setShowAddModal(true)}>Add Product</Button>}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Product" size="lg">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Product Name" id="name" placeholder="e.g. Amoxicillin 500mg" required />
              <Input label="Generic Name" id="generic" placeholder="e.g. Amoxicillin" required />
              <Input label="SKU" id="sku" placeholder="e.g. AMX-500" required />
              <Input label="Barcode" id="barcode" placeholder="Optional barcode" />
              <Select label="Category" id="category" options={categories.filter(c => c.value !== 'all')} />
              <Input label="Manufacturer" id="manufacturer" placeholder="e.g. Emzor" required />
              <Input label="Unit Price (₦)" id="price" type="number" required />
              <Input label="Cost Price (₦)" id="cost" type="number" required />
              <Input label="Quantity" id="quantity" type="number" required />
              <Input label="Reorder Level" id="reorder" type="number" required />
              <Input label="Expiry Date" id="expiry" type="date" required />
              <Input label="Batch Number" id="batch" placeholder="e.g. BCH-001" required />
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-foreground mb-1">Description</label>
              <textarea
                placeholder="Optional product description"
                className="w-full rounded-lg border border-border p-3 text-sm h-20 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </Modal>

        <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title="Product Details" size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Generic</p>
                <p className="font-medium">{selectedProduct.generic_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">SKU</p>
                <p className="font-medium font-mono">{selectedProduct.sku}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Category</p>
                <Badge variant="info">{selectedProduct.category}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Unit Price</p>
                <p className="font-medium">{formatCurrency(selectedProduct.unit_price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost Price</p>
                <p className="font-medium">{formatCurrency(selectedProduct.cost_price)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Stock</p>
                <Badge variant={selectedProduct.quantity_in_stock <= selectedProduct.reorder_level ? 'danger' : 'success'}>
                  {selectedProduct.quantity_in_stock} units
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Reorder Level</p>
                <p className="font-medium">{selectedProduct.reorder_level}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expiry Date</p>
                <Badge variant={
                  getExpiryStatus(selectedProduct.expiry_date) === 'expired' ? 'danger' :
                  getExpiryStatus(selectedProduct.expiry_date) === 'critical' ? 'danger' : 'warning'
                }>
                  {formatDate(selectedProduct.expiry_date)} ({daysUntilExpiry(selectedProduct.expiry_date)} days)
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Batch</p>
                <p className="font-medium font-mono">{selectedProduct.batch_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Manufacturer</p>
                <p className="font-medium">{selectedProduct.manufacturer}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setShowDetailModal(false)}>Close</Button>
              <Button>Edit Product</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
