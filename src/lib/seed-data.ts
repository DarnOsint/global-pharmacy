import { db } from '@/lib/db';
import type { Currency } from '@/lib/utils';

export async function seedOfflineData() {
  const productCount = await db.products.count();
  if (productCount > 0) return;

  await db.products.bulkAdd([
    { id: 'p1', name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', category: 'antibiotics', sku: 'AMX-500', unit_price: 8500, cost_price: 6000, currency: 'SSP' as Currency, quantity_in_stock: 45, reorder_level: 20, expiry_date: '2027-06-15', alert_days: 90, batch_number: 'BCH-001', manufacturer: 'Juba Pharma', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p2', name: 'Paracetamol 500mg', generic_name: 'Acetaminophen', category: 'analgesics', sku: 'PCM-500', unit_price: 2000, cost_price: 1200, currency: 'SSP' as Currency, quantity_in_stock: 200, reorder_level: 50, expiry_date: '2027-12-20', alert_days: 30, batch_number: 'BCH-002', manufacturer: 'Juba Pharma', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p3', name: 'Metformin 850mg', generic_name: 'Metformin HCl', category: 'diabetes', sku: 'MET-850', unit_price: 5.50, cost_price: 3.80, currency: 'USD' as Currency, quantity_in_stock: 30, reorder_level: 15, expiry_date: '2027-03-10', alert_days: 60, batch_number: 'BCH-003', manufacturer: 'Medipharm', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p4', name: 'Lisinopril 10mg', generic_name: 'Lisinopril', category: 'cardiovascular', sku: 'LIS-10', unit_price: 4.00, cost_price: 2.50, currency: 'USD' as Currency, quantity_in_stock: 60, reorder_level: 30, expiry_date: '2027-09-25', alert_days: 90, batch_number: 'BCH-004', manufacturer: 'Cipla', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p5', name: 'Vitamin C 1000mg', generic_name: 'Ascorbic Acid', category: 'vitamins', sku: 'VTC-1000', unit_price: 3000, cost_price: 1800, currency: 'SSP' as Currency, quantity_in_stock: 120, reorder_level: 30, expiry_date: '2027-08-30', alert_days: 30, batch_number: 'BCH-005', manufacturer: 'VitaHealth', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p6', name: 'Ibuprofen 400mg', generic_name: 'Ibuprofen', category: 'analgesics', sku: 'IBU-400', unit_price: 3.00, cost_price: 1.80, currency: 'USD' as Currency, quantity_in_stock: 8, reorder_level: 25, expiry_date: '2026-08-25', alert_days: 14, batch_number: 'BCH-006', manufacturer: 'Swiss Pharma', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p7', name: 'Artemether-Lumefantrine', generic_name: 'ACT', category: 'antibiotics', sku: 'ACT-20', unit_price: 15000, cost_price: 10000, currency: 'SSP' as Currency, quantity_in_stock: 35, reorder_level: 20, expiry_date: '2027-05-18', alert_days: 60, batch_number: 'BCH-007', manufacturer: 'Bliss GVS', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'p8', name: 'ORS Sachets', generic_name: 'Oral Rehydration Salts', category: 'other', sku: 'ORS-01', unit_price: 1500, cost_price: 800, currency: 'SSP' as Currency, quantity_in_stock: 300, reorder_level: 100, expiry_date: '2028-01-01', alert_days: 90, batch_number: 'BCH-008', manufacturer: 'UNICEF Supply', description: null, image_url: null, is_active: true, supplier_id: null, barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]);

  await db.sales.bulkAdd([
    { id: 's1', invoice_number: 'GS-260801-0001', customer_id: null, user_id: 'u1', subtotal: 35000, discount: 2000, tax: 0, total: 33000, currency: 'SSP' as Currency, payment_method: 'cash', status: 'completed', notes: 'Amina Deng', created_at: '2026-08-18T10:00:00Z' },
    { id: 's2', invoice_number: 'GS-260801-0002', customer_id: null, user_id: 'u1', subtotal: 11.00, discount: 0, tax: 0, total: 11.00, currency: 'USD' as Currency, payment_method: 'cash', status: 'completed', notes: 'Peter Garang', created_at: '2026-08-18T11:30:00Z' },
    { id: 's3', invoice_number: 'GS-260801-0003', customer_id: null, user_id: 'u1', subtotal: 22500, discount: 1000, tax: 0, total: 21500, currency: 'SSP' as Currency, payment_method: 'transfer', status: 'completed', notes: 'Sarah Nyabol', created_at: '2026-08-17T09:00:00Z' },
    { id: 's4', invoice_number: 'GS-260801-0004', customer_id: null, user_id: 'u1', subtotal: 16000, discount: 0, tax: 0, total: 16000, currency: 'SSP' as Currency, payment_method: 'card', status: 'completed', notes: 'James Bol', created_at: '2026-08-17T14:00:00Z' },
    { id: 's5', invoice_number: 'GS-260801-0005', customer_id: null, user_id: 'u1', subtotal: 28.50, discount: 3.50, tax: 0, total: 25.00, currency: 'USD' as Currency, payment_method: 'cash', status: 'returned', notes: 'Grace Akello', created_at: '2026-08-16T16:00:00Z' },
    { id: 's6', invoice_number: 'GS-260801-0006', customer_id: null, user_id: 'u1', subtotal: 8500, discount: 0, tax: 0, total: 8500, currency: 'SSP' as Currency, payment_method: 'credit', status: 'completed', notes: 'David Malual', created_at: '2026-08-16T08:00:00Z' },
  ]);

  await db.purchases.bulkAdd([
    { id: 'pu1', invoice_number: 'GP-260801-0001', supplier_id: 'sup1', user_id: 'u1', subtotal: 450000, tax: 0, total: 450000, currency: 'SSP' as Currency, status: 'received', notes: null, created_at: '2026-08-01T10:00:00Z' },
    { id: 'pu2', invoice_number: 'GP-260801-0002', supplier_id: 'sup2', user_id: 'u1', subtotal: 125.00, tax: 0, total: 125.00, currency: 'USD' as Currency, status: 'received', notes: null, created_at: '2026-08-05T10:00:00Z' },
    { id: 'pu3', invoice_number: 'GP-260801-0003', supplier_id: 'sup3', user_id: 'u1', subtotal: 280000, tax: 0, total: 280000, currency: 'SSP' as Currency, status: 'ordered', notes: null, created_at: '2026-08-10T10:00:00Z' },
    { id: 'pu4', invoice_number: 'GP-260801-0004', supplier_id: 'sup1', user_id: 'u1', subtotal: 850000, tax: 0, total: 850000, currency: 'SSP' as Currency, status: 'received', notes: null, created_at: '2026-08-12T10:00:00Z' },
    { id: 'pu5', invoice_number: 'GP-260801-0005', supplier_id: 'sup4', user_id: 'u1', subtotal: 55.00, tax: 0, total: 55.00, currency: 'USD' as Currency, status: 'cancelled', notes: null, created_at: '2026-08-14T10:00:00Z' },
  ]);

  await db.suppliers.bulkAdd([
    { id: 'sup1', name: 'Juba Pharma Ltd', contact_person: 'John Bul', phone: '+211912345678', email: 'info@jubapharma.ss', address: 'Custom Market', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: 'sup2', name: 'Medipharm Distributors', contact_person: 'Peter Gatluak', phone: '+211923456789', email: 'sales@medipharm.ss', address: 'Kator', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: 'sup3', name: 'Bliss GVS Juba', contact_person: 'Mary Nyaluak', phone: '+211934567890', email: 'orders@blissgvs.ss', address: 'New Site', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: 'sup4', name: 'Swiss Pharma Juba', contact_person: 'David Mawien', phone: '+211945678901', email: 'info@swisspharma.ss', address: 'Nimra Talata', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
    { id: 'sup5', name: 'VitaHealth South Sudan', contact_person: 'Grace Akello', phone: '+211956789012', email: 'orders@vitahealth.ss', address: 'Juba Teaching Hospital Road', city: 'Juba', notes: null, is_active: true, created_at: new Date().toISOString() },
  ]);

  await db.expenses.bulkAdd([
    { id: 'e1', category: 'rent', description: 'Monthly shop rent - August', amount: 2500000, currency: 'SSP' as Currency, date: '2026-08-01', user_id: 'u1', receipt_url: null, created_at: new Date().toISOString() },
    { id: 'e2', category: 'utilities', description: 'Electricity bill (JEDCO)', amount: 350000, currency: 'SSP' as Currency, date: '2026-08-05', user_id: 'u1', receipt_url: null, created_at: new Date().toISOString() },
    { id: 'e3', category: 'utilities', description: 'Zain internet subscription', amount: 150000, currency: 'SSP' as Currency, date: '2026-08-05', user_id: 'u1', receipt_url: null, created_at: new Date().toISOString() },
    { id: 'e4', category: 'supplies', description: 'Receipt printer paper rolls', amount: 45000, currency: 'SSP' as Currency, date: '2026-08-10', user_id: 'u1', receipt_url: null, created_at: new Date().toISOString() },
    { id: 'e5', category: 'transport', description: 'Delivery to Malakal customer', amount: 15.00, currency: 'USD' as Currency, date: '2026-08-12', user_id: 'u1', receipt_url: null, created_at: new Date().toISOString() },
    { id: 'e6', category: 'maintenance', description: 'Generator fuel', amount: 200000, currency: 'SSP' as Currency, date: '2026-08-14', user_id: 'u1', receipt_url: null, created_at: new Date().toISOString() },
  ]);

  await db.staff.bulkAdd([
    { id: 'a0000000-0000-0000-0000-000000000001', first_name: 'Clara', last_name: 'Evelino Modi', role: 'admin', phone: '+211920123456', email: 'clara@globalpharmacy.ss', hire_date: '2024-01-15', salary: 450000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000002', first_name: 'Nyamal', last_name: 'Kuol', role: 'pharmacist', phone: '+211921234567', email: 'nyamal@globalpharmacy.ss', hire_date: '2024-03-20', salary: 350000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000003', first_name: 'Bol', last_name: 'Mawut', role: 'pharmacist', phone: '+211922345678', email: 'bol@globalpharmacy.ss', hire_date: '2024-06-10', salary: 350000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000004', first_name: 'Akello', last_name: 'James', role: 'cashier', phone: '+211923456789', email: 'akello@globalpharmacy.ss', hire_date: '2025-01-05', salary: 200000, is_active: true, created_at: new Date().toISOString() },
    { id: 'a0000000-0000-0000-0000-000000000005', first_name: 'Kur', last_name: 'Lual', role: 'store_manager', phone: '+211924567890', email: 'kur@globalpharmacy.ss', hire_date: '2025-06-15', salary: 280000, is_active: true, created_at: new Date().toISOString() },
  ]);

  await db.payroll.bulkAdd([
    { id: 'py1', staff_id: 'a0000000-0000-0000-0000-000000000001', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 225000, allowances: 50000, deductions: 25000, net_pay: 250000, status: 'paid', paid_at: '2026-08-16', created_at: new Date().toISOString() },
    { id: 'py2', staff_id: 'a0000000-0000-0000-0000-000000000002', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 175000, allowances: 30000, deductions: 15000, net_pay: 190000, status: 'paid', paid_at: '2026-08-16', created_at: new Date().toISOString() },
    { id: 'py3', staff_id: 'a0000000-0000-0000-0000-000000000004', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 100000, allowances: 15000, deductions: 10000, net_pay: 105000, status: 'pending', paid_at: null, created_at: new Date().toISOString() },
  ]);

  await db.customers.bulkAdd([
    { id: 'c1', name: 'Amina Deng', phone: '+211920111111', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: 'c2', name: 'Peter Garang', phone: '+211920222222', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: 'c3', name: 'Sarah Nyabol', phone: '+211920333333', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: 'c4', name: 'James Bol', phone: '+211920444444', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: 'c5', name: 'Grace Akello', phone: '+211920555555', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
    { id: 'c6', name: 'David Malual', phone: '+211920666666', email: null, address: null, date_of_birth: null, created_at: new Date().toISOString() },
  ]);
}
