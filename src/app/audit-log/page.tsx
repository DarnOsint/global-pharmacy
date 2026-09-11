'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncNowButton } from '@/components/sync-now-button';
import { Search, History, Download, RotateCcw } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getAllAuditLogs } from '@/lib/offline-db';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types/database';

const actionColors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
  login: 'warning',
  logout: 'default',
};

const actionLabels: Record<string, string> = {
  create: 'Created',
  update: 'Modified',
  delete: 'Deleted',
  login: 'Logged In',
  logout: 'Logged Out',
};

const entityLabels: Record<string, string> = {
  product: 'Product',
  supplier: 'Supplier',
  customer: 'Customer',
  expense: 'Expense',
  'staff member': 'Staff Member',
  payroll: 'Payroll',
  sale: 'Sale',
  purchase: 'Purchase',
  settings: 'Settings',
  auth: 'Authentication',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');

  const load = useCallback(async () => {
    const all = await getAllAuditLogs();
    setLogs(all);
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (entityFilter !== 'all' && log.entity_type !== entityFilter) return false;
    if (staffFilter !== 'all' && log.staff_name !== staffFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${log.description} ${log.staff_name} ${log.entity_name} ${actionLabels[log.action] || log.action}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const uniqueStaff = Array.from(new Set(logs.map((l) => l.staff_name))).sort();
  const uniqueEntities = Array.from(new Set(logs.map((l) => l.entity_type))).sort();

  const exportLogs = () => {
    const rows = filtered.map((l) => ({
      Date: formatDateTime(l.created_at),
      Time: new Date(l.created_at).toLocaleTimeString(),
      Staff: l.staff_name,
      Role: l.staff_role,
      Action: actionLabels[l.action] || l.action,
      Module: entityLabels[l.entity_type] || l.entity_type,
      Item: l.entity_name,
      Description: l.description,
    }));
    const csv = [
      ['Date', 'Time', 'Staff', 'Role', 'Action', 'Module', 'Item', 'Description'],
      ...rows.map((r) => [r.Date, r.Time, r.Staff, r.Role, r.Action, r.Module, r.Item, r.Description]),
    ].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'general_manager']}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Audit Log</h1>
              <p className="text-sm text-muted-foreground">Detailed record of who did what, and when — changes, logins and effects</p>
            </div>
            <div className="flex items-center gap-2">
              <SyncNowButton label="Sync Now" />
              <Button variant="outline" onClick={load}><RotateCcw className="w-4 h-4 mr-2" /> Refresh</Button>
              <Button onClick={exportLogs}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by staff, item, or description..."
                className="flex h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <Select id="action" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="sm:w-40" options={[
              { value: 'all', label: 'All Actions' },
              { value: 'create', label: 'Created' },
              { value: 'update', label: 'Modified' },
              { value: 'delete', label: 'Deleted' },
              { value: 'login', label: 'Logged In' },
              { value: 'logout', label: 'Logged Out' },
            ]} />
            <Select id="entity" value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="sm:w-44" options={[
              { value: 'all', label: 'All Modules' },
              ...uniqueEntities.map((t) => ({ value: t, label: entityLabels[t] || t })),
            ]} />
            <Select id="staff" value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="sm:w-48" options={[
              { value: 'all', label: 'All Staff' },
              ...uniqueStaff.map((s) => ({ value: s, label: s })),
            ]} />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Date & Time</th>
                    <th className="text-left p-3 font-medium">Staff Member</th>
                    <th className="text-left p-3 font-medium">Action</th>
                    <th className="text-left p-3 font-medium">Module</th>
                    <th className="text-left p-3 font-medium">Item</th>
                    <th className="text-left p-3 font-medium">Details / Effect</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading audit trail…</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No audit records match your filters.</td></tr>
                  )}
                  {filtered.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/30 align-top">
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium">{formatDate(log.created_at)}</div>
                        <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium">{log.staff_name}</div>
                        <Badge variant={log.staff_role === 'admin' ? 'info' : log.staff_role === 'pharmacist' ? 'success' : log.staff_role === 'cashier' ? 'warning' : 'default'}>
                          {log.staff_role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={actionColors[log.action] || 'default'}>{actionLabels[log.action] || log.action}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{entityLabels[log.entity_type] || log.entity_type}</td>
                      <td className="p-3 font-medium">{log.entity_name}</td>
                      <td className="p-3 text-muted-foreground max-w-md">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1"><History className="w-3.5 h-3.5" /> Showing {filtered.length} of {logs.length} audit records</span>
              <span>Records sync automatically across all devices</span>
            </div>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}