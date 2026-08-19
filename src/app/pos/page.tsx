'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { useAuthStore } from '@/lib/auth';
import { useSettingsStore } from '@/lib/settings-store';
import { useSync } from '@/lib/use-sync';
import {
  getAllProducts,
  addSale,
  updateProduct,
} from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import { formatCurrency, formatCurrencyPair, daysUntilExpiry, convertCurrency } from '@/lib/utils';
import { generateId } from '@/lib/utils';
import type { Product, Customer } from '@/types/database';
import {
  Search, ShoppingCart, Plus, Minus, Trash2, X,
  CreditCard, Banknote, ArrowRightLeft, User,
  CheckCircle2, Printer, Package, AlertTriangle,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function POSPage() {
  const { user } = useAuthStore();
  const settings = useSettingsStore();
  const { refreshCount } = useSync();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'credit'>('cash');
  const [currency, setCurrency] = useState<'SSP' | 'USD'>('SSP');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<{ sale: any; items: CartItem[] } | null>(null);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(async () => {
    await seedOfflineData();
    const data = await getAllProducts();
    setProducts(data.filter(p => p.is_active && p.quantity_in_stock > 0));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.generic_name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === 'all' || p.category === category;
      return matchSearch && matchCategory;
    });
  }, [products, search, category]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity_in_stock) return prev;
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.product.id !== productId) return c;
        const newQty = c.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > c.product.quantity_in_stock) return c;
        return { ...c, quantity: newQty };
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      const converted = convertCurrency(item.product.unit_price, item.product.currency, currency, settings.exchangeRate);
      return sum + (converted * item.quantity);
    }, 0);
  }, [cart, currency, settings.exchangeRate]);

  const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const handlePay = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);

    try {
      const saleId = generateId();
      const invoiceNumber = `POS-${Date.now().toString(36).toUpperCase()}`;

      const sale = await addSale({
        invoice_number: invoiceNumber,
        customer_id: null,
        user_id: user?.id || '',
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        currency,
        payment_method: paymentMethod,
        status: 'completed',
        notes: null,
      }, cart.map(item => {
        const convertedPrice = convertCurrency(item.product.unit_price, item.product.currency, currency, settings.exchangeRate);
        return {
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: convertedPrice,
          discount: 0,
          total: convertedPrice * item.quantity,
        };
      }));

      for (const item of cart) {
        await updateProduct(item.product.id, {
          quantity_in_stock: item.product.quantity_in_stock - item.quantity,
        });
      }

      await refreshCount();

      setCompletedSale({ sale: { ...sale, created_at: new Date().toISOString() }, items: [...cart] });
      setCart([]);
      setShowPayment(false);
      setShowReceipt(true);
    } catch (err) {
      alert('Failed to process sale. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const printReceipt = () => {
    const el = receiptRef.current;
    if (!el) return;
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html><head><title>Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 16px; max-width: 320px; margin: 0 auto; color: #000; }
        .logo { text-align: center; margin-bottom: 8px; }
        .logo img { max-height: 60px; }
        .store-name { text-align: center; font-size: 16px; font-weight: bold; }
        .store-info { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .row { display: flex; justify-content: space-between; margin: 3px 0; }
        .row-bold { font-weight: bold; }
        .item-name { flex: 1; }
        .item-qty { width: 40px; text-align: center; }
        .item-price { width: 80px; text-align: right; }
        .total-section { border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; }
        .footer { text-align: center; font-size: 10px; margin-top: 16px; color: #666; }
      </style></head><body>
      ${el.innerHTML}
      </body></html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); printWin.close(); }, 500);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchRef.current && !showPayment && !showReceipt) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showPayment, showReceipt]);

  return (
    <AuthGuard>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-primary text-white flex items-center px-4 gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {settings.logoBase64 ? (
              <img src={settings.logoBase64} alt="" className="h-8 w-8 rounded object-cover" />
            ) : (
              <Package className="w-6 h-6" />
            )}
            <span className="font-bold text-lg hidden sm:block">{settings.storeName || 'Global Pharmacy'}</span>
          </div>
          <span className="text-white/70 text-sm">Point of Sale</span>
          <div className="flex-1" />
          <a href="/dashboard" className="text-white/80 hover:text-white text-sm">Dashboard</a>
          <span className="text-white/50 text-sm">{user?.first_name} {user?.last_name}</span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Product Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search + Filters */}
            <div className="p-3 bg-white border-b border-gray-200 flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search products... (press /)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      category === c
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {filtered.map(product => {
                  const daysLeft = daysUntilExpiry(product.expiry_date);
                  const inCart = cart.find(c => c.product.id === product.id);
                  const outOfStock = product.quantity_in_stock <= 0;
                  const lowStock = product.quantity_in_stock <= product.reorder_level;
                  return (
                    <button
                      key={product.id}
                      onClick={() => !outOfStock && addToCart(product)}
                      disabled={outOfStock}
                      className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                        inCart
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : outOfStock
                            ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 bg-white hover:border-primary hover:shadow-md cursor-pointer'
                      }`}
                    >
                      {inCart && (
                        <span className="absolute -top-2 -right-2 bg-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow">
                          {inCart.quantity}
                        </span>
                      )}
                      {daysLeft <= 0 && (
                        <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">EXPIRED</span>
                      )}
                      {daysLeft > 0 && daysLeft <= 30 && (
                        <span className="absolute top-1 left-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{daysLeft}d left</span>
                      )}
                      <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</div>
                      <div className="text-xs text-gray-500 mb-1">{product.manufacturer}</div>
                      <div className="text-xs text-gray-400 mb-2">SKU: {product.sku}</div>
                      <div className="font-bold text-primary text-sm">
                        {formatCurrencyPair(product.unit_price, product.currency, settings.exchangeRate)}
                      </div>
                      <div className={`text-xs mt-1 font-medium ${outOfStock ? 'text-red-600' : lowStock ? 'text-orange-600' : 'text-green-600'}`}>
                        Stock: {product.quantity_in_stock}
                      </div>
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <Package className="w-12 h-12 mb-2" />
                  <p>No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart Panel */}
          <div className="w-80 lg:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
            {/* Cart Header */}
            <div className="p-3 border-b border-gray-200 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">Cart</span>
              <span className="text-xs text-gray-500">({itemCount} items)</span>
              <div className="flex-1" />
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Clear</button>
              )}
            </div>

            {/* Currency + Payment Toggle */}
            <div className="p-3 border-b border-gray-200 flex gap-2">
              <div className="flex rounded-lg border border-gray-300 overflow-hidden flex-1">
                <button
                  onClick={() => setCurrency('SSP')}
                  className={`flex-1 py-1.5 text-xs font-medium ${currency === 'SSP' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}
                >
                  SSP
                </button>
                <button
                  onClick={() => setCurrency('USD')}
                  className={`flex-1 py-1.5 text-xs font-medium ${currency === 'USD' ? 'bg-primary text-white' : 'bg-gray-50 text-gray-600'}`}
                >
                  USD
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-sm">Tap a product to add</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map(item => {
                    const convertedPrice = convertCurrency(item.product.unit_price, item.product.currency, currency, settings.exchangeRate);
                    const itemTotal = convertedPrice * item.quantity;
                    return (
                      <div key={item.product.id} className="p-3 flex gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.product.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatCurrency(convertedPrice, currency)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateCartQty(item.product.id, -1)}
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQty(item.product.id, 1)}
                            className="w-7 h-7 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-sm">
                            {formatCurrency(itemTotal, currency)}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-400 hover:text-red-600 mt-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            <div className="border-t border-gray-200 p-3 shrink-0">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mb-3">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(subtotal, currency)}</span>
              </div>
              <button
                onClick={() => cart.length > 0 && setShowPayment(true)}
                disabled={cart.length === 0}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay {cart.length > 0 ? formatCurrency(subtotal, currency) : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !processing && setShowPayment(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold text-lg">Complete Payment</h2>
                {!processing && (
                  <button onClick={() => setShowPayment(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="p-4 space-y-4">
                {/* Total */}
                <div className="text-center py-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500 mb-1">Amount to Pay</div>
                  <div className="text-3xl font-bold text-primary">{formatCurrency(subtotal, currency)}</div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'cash' as const, label: 'Cash', icon: Banknote },
                      { value: 'card' as const, label: 'Card', icon: CreditCard },
                      { value: 'transfer' as const, label: 'Transfer', icon: ArrowRightLeft },
                      { value: 'credit' as const, label: 'Credit', icon: User },
                    ].map(m => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2 text-sm font-medium transition-all ${
                          paymentMethod === m.value
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <m.icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Items</span><span>{itemCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Currency</span><span>{currency}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="capitalize">{paymentMethod}</span></div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(subtotal, currency)}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handlePay}
                  disabled={processing}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Confirm Payment
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && completedSale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Sale Complete
                </h2>
                <button onClick={() => { setShowReceipt(false); setCompletedSale(null); }} className="p-1 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {/* Receipt Preview */}
                <div ref={receiptRef} className="border border-gray-200 rounded-xl p-4 bg-white text-xs">
                  {/* Logo */}
                  {settings.logoBase64 ? (
                    <div className="text-center mb-2">
                      <img src={settings.logoBase64} alt="" className="h-14 mx-auto object-contain" />
                    </div>
                  ) : (
                    <div className="text-center mb-2">
                      <Package className="w-10 h-10 mx-auto text-primary" />
                    </div>
                  )}
                  <div className="text-center">
                    <div className="font-bold text-base">{settings.storeName || 'Global Pharmacy'}</div>
                    <div className="text-gray-500 text-[10px]">{settings.address || 'Juba, South Sudan'}</div>
                    {settings.phone && <div className="text-gray-500 text-[10px]">Tel: {settings.phone}</div>}
                    {settings.licenseNumber && <div className="text-gray-500 text-[10px]">License: {settings.licenseNumber}</div>}
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-3" />
                  <div className="text-center text-gray-500 text-[10px] mb-2">SALES RECEIPT</div>
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between"><span>Invoice:</span><span className="font-mono">{completedSale.sale.invoice_number}</span></div>
                    <div className="flex justify-between"><span>Date:</span><span>{new Date(completedSale.sale.created_at).toLocaleDateString('en-SS')}</span></div>
                    <div className="flex justify-between"><span>Time:</span><span>{new Date(completedSale.sale.created_at).toLocaleTimeString('en-SS')}</span></div>
                    <div className="flex justify-between"><span>Cashier:</span><span>{user?.first_name} {user?.last_name}</span></div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  {/* Items */}
                  <div className="font-bold text-[10px] text-gray-500 flex mb-1">
                    <span className="flex-1">ITEM</span>
                    <span className="w-10 text-center">QTY</span>
                    <span className="w-16 text-right">PRICE</span>
                    <span className="w-16 text-right">TOTAL</span>
                  </div>
                  {completedSale.items.map((item, i) => (
                    <div key={i} className="flex py-1 border-b border-gray-100">
                      <span className="flex-1 truncate">{item.product.name}</span>
                      <span className="w-10 text-center">{item.quantity}</span>
                      <span className="w-16 text-right">{formatCurrency(item.product.unit_price, item.product.currency)}</span>
                      <span className="w-16 text-right font-medium">{formatCurrency(item.product.unit_price * item.quantity, item.product.currency)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-300 mt-2 pt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>TOTAL ({completedSale.sale.currency})</span>
                      <span>{formatCurrency(completedSale.sale.total, completedSale.sale.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Payment:</span>
                      <span className="capitalize">{completedSale.sale.payment_method}</span>
                    </div>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-3" />
                  <div className="text-center text-gray-500 text-[10px]">Thank you for your purchase!</div>
                  <div className="text-center text-gray-400 text-[9px] mt-1">{settings.storeName || 'Global Pharmacy'} — {settings.address || 'Juba, South Sudan'}</div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex gap-2 shrink-0">
                <button
                  onClick={printReceipt}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => { setShowReceipt(false); setCompletedSale(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 font-medium text-sm hover:bg-gray-50"
                >
                  New Sale
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
