import { db } from '@/lib/db';
import { queueMutation } from '@/lib/sync';
import type { Product, Supplier, Customer, Sale, SaleItem, Purchase, PurchaseItem, Expense, Staff, Payroll, Budget, AuditLog } from '@/types/database';
import { generateId } from '@/lib/utils';
import { logCreate, logUpdate, logDelete, logSale, logPurchase } from '@/lib/audit';

function now() { return new Date().toISOString(); }

// ─── Products ───────────────────────────────────────────
export async function getAllProducts(): Promise<Product[]> {
  return db.products.toArray();
}

export async function addProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
  const product: Product = { ...data, id: generateId(), created_at: now(), updated_at: now() };
  await db.products.add(product);
  await queueMutation('products', 'create', product, product.id);
  await logCreate('product', product.id, product.name, product as unknown as Record<string, unknown>);
  return product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const updates = { ...data, updated_at: now() };
  const before = await db.products.get(id);
  await db.products.update(id, updates);
  await queueMutation('products', 'update', { id, ...updates }, id);
  if (before) {
    await logUpdate('product', id, before.name, before as unknown as Record<string, unknown>, updates as unknown as Record<string, unknown>);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const before = await db.products.get(id);
  await db.products.delete(id);
  await queueMutation('products', 'delete', { id }, id);
  if (before) {
    await logDelete('product', id, before.name, before as unknown as Record<string, unknown>);
  }
}

// ─── Suppliers ──────────────────────────────────────────
export async function getAllSuppliers(): Promise<Supplier[]> {
  return db.suppliers.toArray();
}

export async function addSupplier(data: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier> {
  const supplier: Supplier = { ...data, id: generateId(), created_at: now() };
  await db.suppliers.add(supplier);
  await queueMutation('suppliers', 'create', supplier, supplier.id);
  await logCreate('supplier', supplier.id, supplier.name, supplier as unknown as Record<string, unknown>);
  return supplier;
}

export async function updateSupplier(id: string, data: Partial<Supplier>): Promise<void> {
  const before = await db.suppliers.get(id);
  await db.suppliers.update(id, data);
  await queueMutation('suppliers', 'update', { id, ...data }, id);
  if (before) {
    await logUpdate('supplier', id, before.name, before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
  }
}

export async function deleteSupplier(id: string): Promise<void> {
  const before = await db.suppliers.get(id);
  await db.suppliers.delete(id);
  await queueMutation('suppliers', 'delete', { id }, id);
  if (before) {
    await logDelete('supplier', id, before.name, before as unknown as Record<string, unknown>);
  }
}

// ─── Customers ──────────────────────────────────────────
export async function getAllCustomers(): Promise<Customer[]> {
  return db.customers.toArray();
}

export async function addCustomer(data: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  const customer: Customer = { ...data, id: generateId(), created_at: now() };
  await db.customers.add(customer);
  await queueMutation('customers', 'create', customer, customer.id);
  await logCreate('customer', customer.id, customer.name, customer as unknown as Record<string, unknown>);
  return customer;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  const before = await db.customers.get(id);
  await db.customers.update(id, data);
  await queueMutation('customers', 'update', { id, ...data }, id);
  if (before) {
    await logUpdate('customer', id, before.name, before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const before = await db.customers.get(id);
  await db.customers.delete(id);
  await queueMutation('customers', 'delete', { id }, id);
  if (before) {
    await logDelete('customer', id, before.name, before as unknown as Record<string, unknown>);
  }
}

// ─── Sales ──────────────────────────────────────────────
export async function getAllSales(): Promise<Sale[]> {
  return db.sales.orderBy('created_at').reverse().toArray();
}

export async function addSale(sale: Omit<Sale, 'id' | 'created_at'>, items: Omit<SaleItem, 'id' | 'sale_id'>[]): Promise<Sale> {
  const saleId = generateId();
  const fullSale: Sale = { ...sale, id: saleId, created_at: now() };
  const fullItems: SaleItem[] = items.map((item) => ({ ...item, id: generateId(), sale_id: saleId }));
  await db.sales.add(fullSale);
  await db.saleItems.bulkAdd(fullItems);
  await queueMutation('sales', 'create', fullSale, saleId);
  for (const item of fullItems) {
    await queueMutation('sale_items', 'create', item, item.id);
  }
  await logSale(fullSale.invoice_number, fullSale.total, fullSale.currency, fullItems.length);
  return fullSale;
}

export async function updateSale(id: string, data: Partial<Sale>): Promise<void> {
  await db.sales.update(id, data);
  await queueMutation('sales', 'update', { id, ...data }, id);
}

export async function deleteSale(id: string): Promise<void> {
  const items = await db.saleItems.where('sale_id').equals(id).toArray();
  for (const item of items) {
    await queueMutation('sale_items', 'delete', { id: item.id }, item.id);
  }
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
  const fullItems: PurchaseItem[] = items.map((item) => ({ ...item, id: generateId(), purchase_id: purchaseId }));
  await db.purchases.add(fullPurchase);
  await db.purchaseItems.bulkAdd(fullItems);
  await queueMutation('purchases', 'create', fullPurchase, purchaseId);
  for (const item of fullItems) {
    await queueMutation('purchase_items', 'create', item, item.id);
  }
  await logPurchase(fullPurchase.invoice_number, fullPurchase.total, fullPurchase.currency);
  return fullPurchase;
}

export async function updatePurchase(id: string, data: Partial<Purchase>): Promise<void> {
  await db.purchases.update(id, data);
  await queueMutation('purchases', 'update', { id, ...data }, id);
}

export async function deletePurchase(id: string): Promise<void> {
  const items = await db.purchaseItems.where('purchase_id').equals(id).toArray();
  for (const item of items) {
    await queueMutation('purchase_items', 'delete', { id: item.id }, item.id);
  }
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
  await logCreate('expense', expense.id, expense.description || expense.category, expense as unknown as Record<string, unknown>);
  return expense;
}

export async function updateExpense(id: string, data: Partial<Expense>): Promise<void> {
  const before = await db.expenses.get(id);
  await db.expenses.update(id, data);
  await queueMutation('expenses', 'update', { id, ...data }, id);
  if (before) {
    await logUpdate('expense', id, before.description || before.category, before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
  }
}

export async function deleteExpense(id: string): Promise<void> {
  const before = await db.expenses.get(id);
  await db.expenses.delete(id);
  await queueMutation('expenses', 'delete', { id }, id);
  if (before) {
    await logDelete('expense', id, before.description || before.category, before as unknown as Record<string, unknown>);
  }
}

// ─── Staff ──────────────────────────────────────────────
export async function getAllStaff(): Promise<Staff[]> {
  return db.staff.toArray();
}

export async function addStaff(data: Omit<Staff, 'id' | 'created_at'>): Promise<Staff> {
  const staff: Staff = { ...data, id: generateId(), created_at: now() };
  await db.staff.add(staff);
  await queueMutation('staff', 'create', staff, staff.id);
  await logCreate('staff member', staff.id, `${staff.first_name} ${staff.last_name}`, staff as unknown as Record<string, unknown>);
  return staff;
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<void> {
  const before = await db.staff.get(id);
  await db.staff.update(id, data);
  await queueMutation('staff', 'update', { id, ...data }, id);
  if (before) {
    await logUpdate('staff member', id, `${before.first_name} ${before.last_name}`, before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
  }
}

export async function deleteStaff(id: string): Promise<void> {
  const before = await db.staff.get(id);
  await db.staff.delete(id);
  await queueMutation('staff', 'delete', { id }, id);
  if (before) {
    await logDelete('staff member', id, `${before.first_name} ${before.last_name}`, before as unknown as Record<string, unknown>);
  }
}

// ─── Payroll ────────────────────────────────────────────
export async function getAllPayroll(): Promise<Payroll[]> {
  return db.payroll.toArray();
}

export async function addPayroll(data: Omit<Payroll, 'id' | 'created_at'>): Promise<Payroll> {
  const payroll: Payroll = { ...data, id: generateId(), created_at: now() };
  await db.payroll.add(payroll);
  await queueMutation('payroll', 'create', payroll, payroll.id);
  const staff = await db.staff.get(data.staff_id);
  await logCreate('payroll', payroll.id, `Payroll for ${staff ? staff.first_name + ' ' + staff.last_name : data.staff_id}`, payroll as unknown as Record<string, unknown>);
  return payroll;
}

export async function updatePayroll(id: string, data: Partial<Payroll>): Promise<void> {
  const before = await db.payroll.get(id);
  await db.payroll.update(id, data);
  await queueMutation('payroll', 'update', { id, ...data }, id);
  if (before) {
    const staff = await db.staff.get(before.staff_id);
    await logUpdate('payroll', id, `Payroll for ${staff ? staff.first_name + ' ' + staff.last_name : before.staff_id}`, before as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>);
  }
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

// ─── Audit Logs ─────────────────────────────────────────
export async function getAllAuditLogs(): Promise<AuditLog[]> {
  const logs = await db.auditLogs.orderBy('created_at').reverse().toArray();
  return logs.slice(0, 1000);
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
