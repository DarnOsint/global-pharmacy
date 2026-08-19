import { db } from '@/lib/db';
import { queueMutation } from '@/lib/sync';
import type { Product, Supplier, Customer, Sale, SaleItem, Purchase, PurchaseItem, Expense, Staff, Payroll, Budget } from '@/types/database';
import { generateId } from '@/lib/utils';

function now() { return new Date().toISOString(); }

// ─── Products ───────────────────────────────────────────
export async function getAllProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function addProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const product: Product = { ...data, id: generateId(), created_at: now(), updated_at: now() };
  await db.products.add(product);
  await queueMutation('products', 'create', product, product.id);
  return product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const updates = { ...data, updated_at: now() };
  await db.products.update(id, updates);
  await queueMutation('products', 'update', { id, ...updates }, id);
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id);
  await queueMutation('products', 'delete', { id }, id);
}

// ─── Suppliers ──────────────────────────────────────────
export async function getAllSuppliers(): Promise<Supplier[]> {
  return db.suppliers.toArray();
}

export async function addSupplier(data: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
  const supplier: Supplier = { ...data, id: generateId(), created_at: now() };
  await db.suppliers.add(supplier);
  await queueMutation('suppliers', 'create', supplier, supplier.id);
  return supplier;
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<void> {
  await db.suppliers.update(id, data);
  await queueMutation('suppliers', 'update', { id, ...data }, id);
}

export async function deleteSupplier(id: string): Promise<void> {
  await db.suppliers.delete(id);
  await queueMutation('suppliers', 'delete', { id }, id);
}

// ─── Customers ──────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  return db.customers.toArray();
}

export async function addCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  const customer: Customer = { ...data, id: generateId(), created_at: now() };
  await db.customers.add(customer);
  await queueMutation('customers', 'create', customer, customer.id);
  return customer;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  await db.customers.update(id, data);
  await queueMutation('customers', 'update', { id, ...data }, id);
}

export async function deleteCustomer(id: string): Promise<void> {
  await db.customers.delete(id);
  await queueMutation('customers', 'delete', { id }, id);
}

// ─── Sales ──────────────────────────────────────────────
export async function getAllSales(): Promise<Sale[]> {
  return db.sales.orderBy('created_at').reverse().toArray();
}

export async function addSale(sale: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id'>[]): Promise<Sale> {
  const saleId = generateId();
  const fullSale: Sale = { ...sale, id: saleId, created_at: now() };
  await db.sales.add(fullSale);
  for (const item of items) {
    const saleItem: SaleItem = { ...item, id: generateId(), sale_id: saleId };
    await db.saleItems.add(saleItem);
  }
  await queueMutation('sales', 'create', { sale: fullSale, items }, saleId);
  return fullSale;
}

export async function updateSale(id: string, data: Partial<Sale>): Promise<void> {
  await db.sales.update(id, data);
  await queueMutation('sales', 'update', { id, ...data }, id);
}

export async function deleteSale(id: string): Promise<void> {
  await db.saleItems.where('sale_id').equals(id).delete();
  await db.sales.delete(id);
  await queueMutation('sales', 'delete', { id }, id);
}

// ─── Purchases ──────────────────────────────────────────
export async function getAllPurchases(): Promise<Purchase[]> {
  return db.purchases.orderBy('created_at').reverse().toArray();
}

export async function addPurchase(purchase: Omit<Purchase, 'id' | 'created_at'>, items: Omit<PurchaseItem, 'id' | 'purchase_id'>[]): Promise<Purchase> {
  const purchaseId = generateId();
  const fullPurchase: Purchase = { ...purchase, id: purchaseId, created_at: now() };
  await db.purchases.add(fullPurchase);
  for (const item of items) {
    const purchaseItem: PurchaseItem = { ...item, id: generateId(), purchase_id: purchaseId };
    await db.purchaseItems.add(purchaseItem);
  }
  await queueMutation('purchases', 'create', { purchase: fullPurchase, items }, purchaseId);
  return fullPurchase;
}

export async function updatePurchase(id: string, data: Partial<Purchase>): Promise<void> {
  await db.purchases.update(id, data);
  await queueMutation('purchases', 'update', { id, ...data }, id);
}

export async function deletePurchase(id: string): Promise<void> {
  await db.purchaseItems.where('purchase_id').equals(id).delete();
  await db.purchases.delete(id);
  await queueMutation('purchases', 'delete', { id }, id);
}

// ─── Expenses ───────────────────────────────────────────
export async function getAllExpenses(): Promise<Expense[]> {
  return db.expenses.orderBy('date').reverse().toArray();
}

export async function addExpense(data: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  const expense: Expense = { ...data, id: generateId(), created_at: now() };
  await db.expenses.add(expense);
  await queueMutation('expenses', 'create', expense, expense.id);
  return expense;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<void> {
  await db.expenses.update(id, data);
  await queueMutation('expenses', 'update', { id, ...data }, id);
}

export async function deleteExpense(id: string): Promise<void> {
  await db.expenses.delete(id);
  await queueMutation('expenses', 'delete', { id }, id);
}

// ─── Staff ──────────────────────────────────────────────
export async function getAllStaff(): Promise<Staff[]> {
  return db.staff.toArray();
}

export async function addStaff(data: Omit<Staff, 'id' | 'created_at'>): Promise<Staff> {
  const staff: Staff = { ...data, id: generateId(), created_at: now() };
  await db.staff.add(staff);
  await queueMutation('staff', 'create', staff, staff.id);
  return staff;
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<void> {
  await db.staff.update(id, data);
  await queueMutation('staff', 'update', { id, ...data }, id);
}

export async function deleteStaff(id: string): Promise<void> {
  await db.staff.delete(id);
  await queueMutation('staff', 'delete', { id }, id);
}

// ─── Payroll ────────────────────────────────────────────
export async function getAllPayroll(): Promise<Payroll[]> {
  return db.payroll.toArray();
}

export async function addPayroll(data: Omit<Payroll, 'id' | 'created_at'>): Promise<Payroll> {
  const payroll: Payroll = { ...data, id: generateId(), created_at: now() };
  await db.payroll.add(payroll);
  await queueMutation('payroll', 'create', payroll, payroll.id);
  return payroll;
}

export async function updatePayroll(id: string, data: Partial<Payroll>): Promise<void> {
  await db.payroll.update(id, data);
  await queueMutation('payroll', 'update', { id, ...data }, id);
}

// ─── Sale Items ─────────────────────────────────────────
export async function getSaleItemsBySale(saleId: string): Promise<SaleItem[]> {
  return db.saleItems.where('sale_id').equals(saleId).toArray();
}

export async function addSaleItem(data: Omit<SaleItem, 'id'>): Promise<SaleItem> {
  const item: SaleItem = { ...data, id: generateId() };
  await db.saleItems.add(item);
  return item;
}

export async function deleteSaleItemsBySale(saleId: string): Promise<void> {
  await db.saleItems.where('sale_id').equals(saleId).delete();
}

// ─── Purchase Items ─────────────────────────────────────
export async function getPurchaseItemsByPurchase(purchaseId: string): Promise<PurchaseItem[]> {
  return db.purchaseItems.where('purchase_id').equals(purchaseId).toArray();
}

export async function addPurchaseItem(data: Omit<PurchaseItem, 'id'>): Promise<PurchaseItem> {
  const item: PurchaseItem = { ...data, id: generateId() };
  await db.purchaseItems.add(item);
  return item;
}

export async function deletePurchaseItemsByPurchase(purchaseId: string): Promise<void> {
  await db.purchaseItems.where('purchase_id').equals(purchaseId).delete();
}

// ─── Budgets ────────────────────────────────────────────
export async function getAllBudgets(): Promise<Budget[]> {
  return db.budgets.toArray();
}

export async function addBudget(data: Omit<Budget, 'id' | 'created_at' | 'spent'>): Promise<Budget> {
  const budget: Budget = { ...data, id: generateId(), spent: 0, created_at: now() };
  await db.budgets.add(budget);
  await queueMutation('budgets', 'create', budget, budget.id);
  return budget;
}

export async function updateBudget(id: string, data: Partial<Budget>): Promise<void> {
  await db.budgets.update(id, data);
  await queueMutation('budgets', 'update', { id, ...data }, id);
}

export async function deleteBudget(id: string): Promise<void> {
  await db.budgets.delete(id);
  await queueMutation('budgets', 'delete', { id }, id);
}

// ─── Query helpers ──────────────────────────────────────
export async function getProductsByCategory(): Promise<Record<string, number>> {
  const products = await db.products.toArray();
  const map: Record<string, number> = {};
  for (const p of products) { map[p.category] = (map[p.category] || 0) + p.quantity_in_stock; }
  return map;
}

export async function getTopSellingProducts(): Promise<{ name: string; sold: number; revenue: number }[]> {
  const items = await db.saleItems.toArray();
  const products = await db.products.toArray();
  const productMap = new Map(products.map(p => [p.id, p]));
  const tally: Record<string, { sold: number; revenue: number; name: string }> = {};
  for (const item of items) {
    const prod = productMap.get(item.product_id);
    const name = prod?.name || 'Unknown';
    if (!tally[item.product_id]) tally[item.product_id] = { sold: 0, revenue: 0, name };
    tally[item.product_id].sold += item.quantity;
    tally[item.product_id].revenue += item.total;
  }
  return Object.values(tally).sort((a, b) => b.revenue - a.revenue);
}

export async function getSlowMovingProducts(): Promise<{ name: string; stock: number; lastSold: string | null }[]> {
  const products = await db.products.toArray();
  const sales = await db.sales.toArray();
  const items = await db.saleItems.toArray();
  const lastSoldMap: Record<string, string> = {};
  for (const sale of sales) {
    const saleItems = items.filter(i => i.sale_id === sale.id);
    for (const item of saleItems) {
      if (!lastSoldMap[item.product_id] || sale.created_at > lastSoldMap[item.product_id]) {
        lastSoldMap[item.product_id] = sale.created_at;
      }
    }
  }
  return products
    .filter(p => p.is_active)
    .map(p => ({ name: p.name, stock: p.quantity_in_stock, lastSold: lastSoldMap[p.id] || null }))
    .sort((a, b) => b.stock - a.stock);
}

export async function getDailySummary(date: string): Promise<{ income: number; expenses: number; transactions: number }> {
  const sales = await db.sales.where('created_at').startsWith(date).toArray();
  const expenses = await db.expenses.where('date').equals(date).toArray();
  const completedSales = sales.filter(s => s.status === 'completed');
  return {
    income: completedSales.reduce((sum, s) => sum + s.total, 0),
    expenses: expenses.reduce((sum, e) => sum + e.amount, 0),
    transactions: completedSales.length,
  };
}

export async function getTotalStockValue(): Promise<{ ssp: number; usd: number }> {
  const products = await db.products.toArray();
  let ssp = 0, usd = 0;
  for (const p of products) {
    if (p.currency === 'USD') usd += p.cost_price * p.quantity_in_stock;
    else ssp += p.cost_price * p.quantity_in_stock;
  }
  return { ssp, usd };
}
