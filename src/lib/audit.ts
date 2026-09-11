import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth';
import type { AuditLog } from '@/types/database';

function generateId(): string {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): string {
  return new Date().toISOString();
}

function getCurrentUser(): { id: string; name: string; role: string } {
  try {
    const state = useAuthStore.getState();
    if (state.user) {
      return {
        id: state.user.id,
        name: `${state.user.first_name} ${state.user.last_name}`,
        role: state.user.role,
      };
    }
  } catch { /* not in browser */ }
  return { id: 'unknown', name: 'Unknown User', role: 'unknown' };
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '(empty)';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key === 'currency') return String(value);
  if (key === 'salary' || key === 'amount' || key === 'unit_price' || key === 'cost_price'
    || key === 'total' || key === 'subtotal' || key === 'tax' || key === 'discount'
    || key === 'net_pay' || key === 'base_salary' || key === 'allowances' || key === 'deductions'
    || key === 'spent') {
    return `${Number(value).toLocaleString()}`;
  }
  return String(value);
}

function diffDescription(
  entityType: string,
  entityName: string,
  oldVals: Record<string, unknown> | null,
  newVals: Record<string, unknown> | null,
): string {
  if (!oldVals || !newVals) return `${entityType} "${entityName}"`;
  const changes: string[] = [];
  const fieldLabels: Record<string, string> = {
    first_name: 'First name', last_name: 'Last name', name: 'Name',
    role: 'Role', phone: 'Phone', email: 'Email', salary: 'Salary',
    hire_date: 'Hire date', is_active: 'Status', description: 'Description',
    amount: 'Amount', currency: 'Currency', date: 'Date', category: 'Category',
    unit_price: 'Price', cost_price: 'Cost price', quantity_in_stock: 'Stock quantity',
    reorder_level: 'Reorder level', expiry_date: 'Expiry date', batch_number: 'Batch',
    manufacturer: 'Manufacturer', sku: 'SKU', barcode: 'Barcode',
    subtotal: 'Subtotal', tax: 'Tax', discount: 'Discount', total: 'Total',
    payment_method: 'Payment method', status: 'Status', notes: 'Notes',
    invoice_number: 'Invoice', customer_id: 'Customer', supplier_id: 'Supplier',
    user_id: 'Staff', storeName: 'Store name', address: 'Address',
    licenseNumber: 'License number', tagline: 'Tagline',
    exchangeRate: 'Exchange rate', expiryCriticalDays: 'Critical expiry days',
    expiryWarningDays: 'Warning expiry days', categories: 'Categories', roles: 'Roles',
    logoBase64: 'Logo', period_start: 'Period start', period_end: 'Period end',
    base_salary: 'Base salary', allowances: 'Allowances', deductions: 'Deductions',
    net_pay: 'Net pay', paid_at: 'Paid date', staff_id: 'Staff member',
    content: 'Content', old_pin: 'Old PIN', new_pin: 'New PIN',
    username: 'Username', password: 'Password',
  };
  const allKeys = new Set([...Object.keys(oldVals), ...Object.keys(newVals)]);
  for (const key of allKeys) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'logoBase64') continue;
    const oldVal = oldVals[key];
    const newVal = newVals[key];
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;
    const label = fieldLabels[key] || key;
    changes.push(`${label} from ${formatValue(key, oldVal)} to ${formatValue(key, newVal)}`);
  }
  if (changes.length === 0) return `${entityType} "${entityName}" (no visible changes)`;
  return `${entityType} "${entityName}" — changed ${changes.join('; ')}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function logAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  entityName: string,
  description: string,
  oldValues: Record<string, unknown> | null = null,
  newValues: Record<string, unknown> | null = null,
): Promise<void> {
  const user = getCurrentUser();
  const entry: AuditLog = {
    id: generateId(),
    staff_id: user.id,
    staff_name: user.name,
    staff_role: user.role,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    description,
    old_values: oldValues,
    new_values: newValues,
    created_at: now(),
  };

  try { await db.auditLogs.add(entry); } catch { /* ignore */ }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('audit_logs') as any).upsert({
      id: entry.id,
      staff_id: entry.staff_id,
      staff_name: entry.staff_name,
      staff_role: entry.staff_role,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      entity_name: entry.entity_name,
      description: entry.description,
      old_values: entry.old_values,
      new_values: entry.new_values,
      created_at: entry.created_at,
    });
  } catch { /* offline */ }
}

export async function logCreate(entityType: string, entityId: string, entityName: string, newValues: Record<string, unknown>): Promise<void> {
  const desc = `${capitalize(entityType)} "${entityName}" was created — ${Object.entries(newValues)
    .filter(([k]) => !['id', 'created_at', 'updated_at', 'logoBase64'].includes(k))
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${formatValue(k, v)}`)
    .join(', ')}`;
  await logAudit('create', entityType, entityId, entityName, desc, null, newValues);
}

export async function logUpdate(entityType: string, entityId: string, entityName: string, oldValues: Record<string, unknown>, newValues: Record<string, unknown>): Promise<void> {
  const desc = diffDescription(entityType, entityName, oldValues, newValues);
  await logAudit('update', entityType, entityId, entityName, desc, oldValues, newValues);
}

export async function logDelete(entityType: string, entityId: string, entityName: string, oldValues: Record<string, unknown>): Promise<void> {
  const desc = `${capitalize(entityType)} "${entityName}" was deleted`;
  await logAudit('delete', entityType, entityId, entityName, desc, oldValues, null);
}

export async function logSale(invoiceNumber: string, total: number, currency: string, itemCount: number): Promise<void> {
  const desc = `Sale completed — Invoice ${invoiceNumber}, ${itemCount} item(s), total ${currency} ${total.toLocaleString()}`;
  await logAudit('create', 'sale', null, invoiceNumber, desc, null, { invoice_number: invoiceNumber, total, currency, items: itemCount });
}

export async function logPurchase(invoiceNumber: string, total: number, currency: string): Promise<void> {
  const desc = `Purchase recorded — Invoice ${invoiceNumber}, total ${currency} ${total.toLocaleString()}`;
  await logAudit('create', 'purchase', null, invoiceNumber, desc, null, { invoice_number: invoiceNumber, total, currency });
}

export async function logLogin(userFirst: string, userLast: string, role: string): Promise<void> {
  const desc = `${userFirst} ${userLast} (${capitalize(role.replace('_', ' '))}) logged in`;
  await logAudit('login', 'auth', null, `${userFirst} ${userLast}`, desc);
}

export async function logLogout(userFirst: string, userLast: string, role: string): Promise<void> {
  const desc = `${userFirst} ${userLast} (${capitalize(role.replace('_', ' '))}) logged out`;
  await logAudit('logout', 'auth', null, `${userFirst} ${userLast}`, desc);
}

export async function logSettingsChange(oldSettings: Record<string, unknown>, newSettings: Record<string, unknown>): Promise<void> {
  const changes: string[] = [];
  const fieldLabels: Record<string, string> = {
    storeName: 'Store name', address: 'Address', phone: 'Phone', secondaryPhone: 'Secondary phone',
    email: 'Email', licenseNumber: 'License', tagline: 'Tagline', currency: 'Currency',
    exchangeRate: 'Exchange rate', expiryCriticalDays: 'Critical expiry days',
    expiryWarningDays: 'Warning expiry days', categories: 'Categories', roles: 'Roles',
  };
  const allKeys = new Set([...Object.keys(oldSettings), ...Object.keys(newSettings)]);
  for (const key of allKeys) {
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'logoBase64') continue;
    if (JSON.stringify(oldSettings[key]) === JSON.stringify(newSettings[key])) continue;
    const label = fieldLabels[key] || key;
    changes.push(label);
  }
  const desc = changes.length > 0
    ? `Settings updated — changed: ${changes.join(', ')}`
    : 'Settings updated';
  await logAudit('update', 'settings', 'app', 'Application Settings', desc, oldSettings, newSettings);
}
