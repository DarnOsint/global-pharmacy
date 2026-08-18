export interface Product {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  supplier_id: string | null;
  sku: string;
  barcode: string | null;
  unit_price: number;
  cost_price: number;
  quantity_in_stock: number;
  reorder_level: number;
  expiry_date: string;
  batch_number: string;
  manufacturer: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string | null;
  address: string;
  city: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  user_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'cash' | 'card' | 'transfer' | 'credit';
  status: 'completed' | 'returned' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoice_number: string;
  supplier_id: string;
  user_id: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'ordered' | 'received' | 'cancelled';
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  user_id: string;
  receipt_url: string | null;
  created_at: string;
}

export interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'pharmacist' | 'cashier' | 'store_manager';
  phone: string;
  email: string;
  hire_date: string;
  salary: number;
  is_active: boolean;
  created_at: string;
}

export interface Payroll {
  id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'credit';
export type UserRole = 'admin' | 'pharmacist' | 'cashier' | 'store_manager';

export interface Database {
  public: {
    Tables: {
      suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      sales: { Row: Sale; Insert: Partial<Sale>; Update: Partial<Sale> };
      sale_items: { Row: SaleItem; Insert: Partial<SaleItem>; Update: Partial<SaleItem> };
      purchases: { Row: Purchase; Insert: Partial<Purchase>; Update: Partial<Purchase> };
      purchase_items: { Row: PurchaseItem; Insert: Partial<PurchaseItem>; Update: Partial<PurchaseItem> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      staff: { Row: Staff; Insert: Partial<Staff>; Update: Partial<Staff> };
      payroll: { Row: Payroll; Insert: Partial<Payroll>; Update: Partial<Payroll> };
    };
    Enums: {
      user_role: UserRole;
      payment_method: PaymentMethod;
      order_status: 'ordered' | 'received' | 'cancelled';
      sale_status: 'completed' | 'returned' | 'cancelled';
      payroll_status: 'pending' | 'paid';
    };
  };
}
