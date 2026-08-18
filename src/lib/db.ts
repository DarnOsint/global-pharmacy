import { Dexie, type Table } from 'dexie';
import type {
  Product, Supplier, Customer, Sale, SaleItem,
  Purchase, PurchaseItem, Expense, Staff, Payroll
} from '@/types/database';

export class PharmacyDB extends Dexie {
  products!: Table<Product>;
  suppliers!: Table<Supplier>;
  customers!: Table<Customer>;
  sales!: Table<Sale>;
  saleItems!: Table<SaleItem>;
  purchases!: Table<Purchase>;
  purchaseItems!: Table<PurchaseItem>;
  expenses!: Table<Expense>;
  staff!: Table<Staff>;
  payroll!: Table<Payroll>;

  constructor() {
    super('GlobalPharmacyDB');
    this.version(1).stores({
      products: 'id, name, sku, barcode, category, supplier_id, expiry_date, is_active',
      suppliers: 'id, name, phone, is_active',
      customers: 'id, name, phone',
      sales: 'id, invoice_number, customer_id, user_id, status, created_at',
      saleItems: 'id, sale_id, product_id',
      purchases: 'id, invoice_number, supplier_id, user_id, status, created_at',
      purchaseItems: 'id, purchase_id, product_id',
      expenses: 'id, category, date, user_id',
      staff: 'id, role, is_active',
      payroll: 'id, staff_id, period_start, period_end, status',
    });
  }
}

export const db = new PharmacyDB();
