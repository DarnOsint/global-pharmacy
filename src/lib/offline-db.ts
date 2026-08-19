import { db } from '@/lib/db';
import { queueMutation } from '@/lib/sync';
import type { Product, Supplier, Customer, Sale, SaleItem, Purchase, PurchaseItem, Expense, Staff, Payroll } from '@/types/database';
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
