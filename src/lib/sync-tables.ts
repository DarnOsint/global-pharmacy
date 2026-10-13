// Shared by the browser sync engine and the server routes. The server is the
// enforcement point: it reads these rules and rejects anything outside them.

export type Role = 'admin' | 'pharmacist' | 'cashier' | 'general_manager';

export const ALL_ROLES: Role[] = ['admin', 'pharmacist', 'cashier', 'general_manager'];
export const MANAGEMENT_ROLES: Role[] = ['admin', 'cashier', 'general_manager'];
export const OWNER_ROLES: Role[] = ['admin', 'general_manager'];

export interface TablePolicy {
  remote: string;
  scoped: boolean;
  read: readonly Role[];
  write: readonly Role[];
}

export const SYNC_TABLES = {
  products: { remote: 'products', scoped: true, read: ALL_ROLES, write: ALL_ROLES },
  customers: { remote: 'customers', scoped: true, read: ALL_ROLES, write: ALL_ROLES },
  sales: { remote: 'sales', scoped: true, read: ALL_ROLES, write: ALL_ROLES },
  sale_items: { remote: 'sale_items', scoped: true, read: ALL_ROLES, write: ALL_ROLES },
  suppliers: { remote: 'suppliers', scoped: true, read: MANAGEMENT_ROLES, write: MANAGEMENT_ROLES },
  purchases: { remote: 'purchases', scoped: true, read: MANAGEMENT_ROLES, write: MANAGEMENT_ROLES },
  purchase_items: { remote: 'purchase_items', scoped: true, read: MANAGEMENT_ROLES, write: MANAGEMENT_ROLES },
  expenses: { remote: 'expenses', scoped: true, read: MANAGEMENT_ROLES, write: MANAGEMENT_ROLES },
  budgets: { remote: 'budgets', scoped: true, read: MANAGEMENT_ROLES, write: MANAGEMENT_ROLES },
  payroll: { remote: 'payroll', scoped: true, read: OWNER_ROLES, write: OWNER_ROLES },
  staff: { remote: 'staff', scoped: false, read: MANAGEMENT_ROLES, write: OWNER_ROLES },
  auditLogs: { remote: 'audit_logs', scoped: true, read: OWNER_ROLES, write: ALL_ROLES },
} as const satisfies Record<string, TablePolicy>;

export type SyncTableName = keyof typeof SYNC_TABLES;

export function isSyncTable(name: string): name is SyncTableName {
  return Object.prototype.hasOwnProperty.call(SYNC_TABLES, name);
}
