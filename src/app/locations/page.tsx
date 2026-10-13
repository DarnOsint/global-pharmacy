'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Building2, MapPin, Users, RefreshCw, Plus, KeyRound, Check } from 'lucide-react';

interface SummaryLine { currency: 'SSP' | 'USD'; count?: number; revenue?: number; amount?: number; units?: number; cost_value?: number; retail_value?: number }
interface LocationSummary {
  location_id: string;
  code: string;
  name: string;
  is_active: boolean;
  sales: SummaryLine[];
  expenses: SummaryLine[];
  stock: SummaryLine[];
  low_stock: number;
  expiring: number;
}
interface LocationRow { id: string; code: string; name: string; is_active: boolean }
interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  location_ids: string[];
  has_pin: boolean;
}

const CURRENCIES = ['SSP', 'USD'] as const;

function dayStart(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString();
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthStartString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function addDays(value: string, days: number): string {
  const d = new Date(`${value}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function errorText(e: unknown): string {
  return e instanceof ApiError || e instanceof Error ? e.message : 'Something went wrong';
}

// Sums a per-currency field across locations, keeping currencies apart.
function totalsBy(lines: SummaryLine[][], field: keyof SummaryLine): Record<string, number> {
  const out: Record<string, number> = {};
  for (const group of lines) {
    for (const line of group) {
      const value = Number(line[field] ?? 0);
      out[line.currency] = (out[line.currency] ?? 0) + value;
    }
  }
  return out;
}

function Amounts({ lines, field }: { lines: SummaryLine[]; field: keyof SummaryLine }) {
  if (lines.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="space-y-0.5 block">
      {lines.map((l) => (
        <span key={l.currency} className="block whitespace-nowrap">
          {formatCurrency(Number(l[field] ?? 0), l.currency)}
        </span>
      ))}
    </span>
  );
}

export default function LocationsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [online, setOnline] = useState(true);
  const [from, setFrom] = useState(monthStartString());
  const [to, setTo] = useState(todayString());
  const [summary, setSummary] = useState<LocationSummary[]>([]);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [pins, setPins] = useState<Record<string, string>>({});
  const [assign, setAssign] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const load = useCallback(async () => {
    if (!navigator.onLine) return;
    setLoading(true);
    setMessage(null);
    try {
      const [s, l, st] = await Promise.all([
        apiFetch<{ locations: LocationSummary[] }>(
          `/api/admin/summary?from=${encodeURIComponent(dayStart(from))}&to=${encodeURIComponent(dayStart(addDays(to, 1)))}`
        ),
        apiFetch<LocationRow[]>('/api/admin/locations'),
        apiFetch<StaffRow[]>('/api/admin/staff'),
      ]);
      setSummary(s.locations);
      setLocations(l);
      setStaff(st);
      setAssign(Object.fromEntries(st.map((row) => [row.id, row.location_ids])));
    } catch (e) {
      setMessage({ kind: 'error', text: errorText(e) });
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => ({
    sales: totalsBy(summary.map((s) => s.sales), 'revenue'),
    count: summary.reduce((n, s) => n + s.sales.reduce((m, l) => m + (l.count ?? 0), 0), 0),
    expenses: totalsBy(summary.map((s) => s.expenses), 'amount'),
    stock: totalsBy(summary.map((s) => s.stock), 'cost_value'),
    low: summary.reduce((n, s) => n + s.low_stock, 0),
    expiring: summary.reduce((n, s) => n + s.expiring, 0),
  }), [summary]);

  const run = async (fn: () => Promise<unknown>, okText: string) => {
    setMessage(null);
    try {
      await fn();
      setMessage({ kind: 'ok', text: okText });
      await load();
    } catch (e) {
      setMessage({ kind: 'error', text: errorText(e) });
    }
  };

  const createLocation = () => run(async () => {
    await apiFetch('/api/admin/locations', { method: 'POST', body: JSON.stringify({ code: newCode, name: newName }) });
    setNewCode('');
    setNewName('');
  }, 'Location created');

  const toggleLocation = (loc: LocationRow) => run(
    () => apiFetch('/api/admin/locations', { method: 'PATCH', body: JSON.stringify({ id: loc.id, is_active: !loc.is_active }) }),
    loc.is_active ? `${loc.name} deactivated` : `${loc.name} reactivated`
  );

  const saveAssignments = (row: StaffRow) => run(
    () => apiFetch(`/api/admin/staff/${row.id}/locations`, { method: 'PUT', body: JSON.stringify({ location_ids: assign[row.id] ?? [] }) }),
    `Locations saved for ${row.first_name} ${row.last_name}`
  );

  const setPin = (row: StaffRow) => run(async () => {
    await apiFetch(`/api/admin/staff/${row.id}/pin`, { method: 'PUT', body: JSON.stringify({ pin: pins[row.id] ?? '' }) });
    setPins((p) => ({ ...p, [row.id]: '' }));
  }, `PIN set for ${row.first_name} ${row.last_name}`);

  const toggleAssign = (staffId: string, locationId: string) => {
    setAssign((prev) => {
      const current = prev[staffId] ?? [];
      const next = current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId];
      return { ...prev, [staffId]: next };
    });
  };

  return (
    <AuthGuard allowedRoles={['admin', 'general_manager']}>
      <AppShell>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">All Locations</h1>
              <p className="text-sm text-muted-foreground">
                Cross-site totals, locations and staff assignments. Amounts are shown per currency and are not converted.
              </p>
            </div>
            <Button variant="outline" onClick={load} disabled={!online || loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>

          {!online && (
            <div className="p-4 rounded-lg border border-warning/40 bg-warning/10 text-sm">
              This page needs an internet connection. Local sales and stock still work offline at each location.
            </div>
          )}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.kind === 'ok' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {message.text}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Cross-site summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-3 mb-4">
                <div>
                  <label className="block text-xs mb-1">From</label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs mb-1">To</label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border text-muted-foreground">
                      <th className="p-2 font-medium">Location</th>
                      <th className="p-2 font-medium">Sales</th>
                      <th className="p-2 font-medium">Revenue</th>
                      <th className="p-2 font-medium">Expenses</th>
                      <th className="p-2 font-medium">Stock (cost)</th>
                      <th className="p-2 font-medium">Low stock</th>
                      <th className="p-2 font-medium">Expiring</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((s) => (
                      <tr key={s.location_id} className="border-b border-border/60 align-top">
                        <td className="p-2 font-medium">{s.name}{!s.is_active && <Badge className="ml-2">inactive</Badge>}</td>
                        <td className="p-2">{s.sales.reduce((n, l) => n + (l.count ?? 0), 0)}</td>
                        <td className="p-2"><Amounts lines={s.sales} field="revenue" /></td>
                        <td className="p-2"><Amounts lines={s.expenses} field="amount" /></td>
                        <td className="p-2"><Amounts lines={s.stock} field="cost_value" /></td>
                        <td className="p-2">{s.low_stock}</td>
                        <td className="p-2">{s.expiring}</td>
                      </tr>
                    ))}
                    {summary.length > 0 && (
                      <tr className="font-semibold">
                        <td className="p-2">All locations</td>
                        <td className="p-2">{totals.count}</td>
                        <td className="p-2">
                          {CURRENCIES.filter((c) => totals.sales[c] !== undefined).map((c) => (
                            <span key={c} className="block">{formatCurrency(totals.sales[c], c)}</span>
                          ))}
                        </td>
                        <td className="p-2">
                          {CURRENCIES.filter((c) => totals.expenses[c] !== undefined).map((c) => (
                            <span key={c} className="block">{formatCurrency(totals.expenses[c], c)}</span>
                          ))}
                        </td>
                        <td className="p-2">
                          {CURRENCIES.filter((c) => totals.stock[c] !== undefined).map((c) => (
                            <span key={c} className="block">{formatCurrency(totals.stock[c], c)}</span>
                          ))}
                        </td>
                        <td className="p-2">{totals.low}</td>
                        <td className="p-2">{totals.expiring}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {summary.length === 0 && !loading && (
                  <p className="text-sm text-muted-foreground p-4">No data yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {locations.map((loc) => (
                  <div key={loc.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm">{loc.name}</p>
                      <p className="text-xs text-muted-foreground">{loc.code}</p>
                    </div>
                    {isAdmin ? (
                      <Button size="sm" variant="outline" onClick={() => toggleLocation(loc)} disabled={!online}>
                        {loc.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    ) : (
                      <Badge variant={loc.is_active ? 'success' : 'default'}>{loc.is_active ? 'active' : 'inactive'}</Badge>
                    )}
                  </div>
                ))}
                {isAdmin && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <p className="text-xs font-medium flex items-center gap-1"><Plus className="w-3 h-3" /> New location</p>
                    <Input placeholder="Code, e.g. KONYOKONYO" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                    <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <p className="text-xs text-muted-foreground">New locations start with an empty catalog and no staff.</p>
                    <Button size="sm" onClick={createLocation} disabled={!online || !newCode || !newName}>Create location</Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Staff assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Pharmacists and cashiers can only open the locations ticked here. Admins and general managers can open all locations.
                </p>
                <div className="space-y-3">
                  {staff.map((row) => (
                    <div key={row.id} className="p-3 rounded-lg border border-border space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{row.first_name} {row.last_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{row.role.replace('_', ' ')}{!row.is_active && ' · inactive'}</p>
                        </div>
                        <Badge variant={row.has_pin ? 'success' : 'warning'}>{row.has_pin ? 'PIN set' : 'No PIN'}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {locations.filter((l) => l.is_active).map((loc) => (
                          <label key={loc.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              disabled={!isAdmin || !online}
                              checked={(assign[row.id] ?? []).includes(loc.id)}
                              onChange={() => toggleAssign(row.id, loc.id)}
                            />
                            {loc.name}
                          </label>
                        ))}
                      </div>
                      {isAdmin && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => saveAssignments(row)} disabled={!online}>
                            <Check className="w-3 h-3 mr-1" /> Save locations
                          </Button>
                          <div className="flex items-center gap-2 ml-auto">
                            <KeyRound className="w-4 h-4 text-muted-foreground" />
                            <Input
                              className="w-32"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="New 4-digit PIN"
                              value={pins[row.id] ?? ''}
                              onChange={(e) => setPins((p) => ({ ...p, [row.id]: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            />
                            <Button size="sm" onClick={() => setPin(row)} disabled={!online || (pins[row.id] ?? '').length !== 4}>
                              Set PIN
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
