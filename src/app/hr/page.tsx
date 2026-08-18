'use client';

import { useState } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Users, Plus, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';

const mockStaff = [
  { id: 'a0000000-0000-0000-0000-000000000001', first_name: 'Clara', last_name: 'Evelino Modi', role: 'admin', phone: '+211920123456', email: 'clara@globalpharmacy.ss', hire_date: '2024-01-15', salary: 450000, is_active: true },
  { id: 'a0000000-0000-0000-0000-000000000002', first_name: 'Nyamal', last_name: 'Kuol', role: 'pharmacist', phone: '+211921234567', email: 'nyamal@globalpharmacy.ss', hire_date: '2024-03-20', salary: 350000, is_active: true },
  { id: 'a0000000-0000-0000-0000-000000000003', first_name: 'Bol', last_name: 'Mawut', role: 'pharmacist', phone: '+211922345678', email: 'bol@globalpharmacy.ss', hire_date: '2024-06-10', salary: 350000, is_active: true },
  { id: 'a0000000-0000-0000-0000-000000000004', first_name: 'Akello', last_name: 'James', role: 'cashier', phone: '+211923456789', email: 'akello@globalpharmacy.ss', hire_date: '2025-01-05', salary: 200000, is_active: true },
  { id: 'a0000000-0000-0000-0000-000000000005', first_name: 'Kur', last_name: 'Lual', role: 'store_manager', phone: '+211924567890', email: 'kur@globalpharmacy.ss', hire_date: '2025-06-15', salary: 280000, is_active: true },
];

const mockPayroll = [
  { id: '1', staff_name: 'Clara Evelino Modi', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 225000, allowances: 50000, deductions: 25000, net_pay: 250000, status: 'paid' },
  { id: '2', staff_name: 'Nyamal Kuol', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 175000, allowances: 30000, deductions: 15000, net_pay: 190000, status: 'paid' },
  { id: '3', staff_name: 'Akello James', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 100000, allowances: 15000, deductions: 10000, net_pay: 105000, status: 'pending' },
];

const roleColors: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  admin: 'info', pharmacist: 'success', cashier: 'warning', store_manager: 'default',
};

export default function HRPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'staff' | 'payroll'>('staff');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [editStaff, setEditStaff] = useState(mockStaff[0]);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">HR & Payroll</h1>
            <p className="text-sm text-muted-foreground">Manage staff and payroll</p>
          </div>
          {isAdmin && (
            <Button onClick={() => activeTab === 'staff' ? setShowAddStaff(true) : setShowPayrollModal(true)}>
              <Plus className="w-4 h-4 mr-2" /> {activeTab === 'staff' ? 'Add Staff' : 'Process Payroll'}
            </Button>
          )}
        </div>

        <div className="flex gap-2 border-b border-border">
          {(['staff', 'payroll'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab === 'staff' ? 'Staff Members' : 'Payroll'}
            </button>
          ))}
        </div>

        {activeTab === 'staff' && (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-right p-3 font-medium">Salary</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    {isAdmin && <th className="text-right p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {mockStaff.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{staff.first_name} {staff.last_name}</td>
                      <td className="p-3"><Badge variant={roleColors[staff.role]}>{staff.role}</Badge></td>
                      <td className="p-3 text-muted-foreground">{staff.phone}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(staff.salary)}</td>
                      <td className="p-3"><Badge variant={staff.is_active ? 'success' : 'danger'}>{staff.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <button onClick={() => { setEditStaff(staff); setShowEditStaff(true); }} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'payroll' && (
          <Card>
            <CardHeader><CardTitle>Payroll Records</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Staff</th>
                    <th className="text-left p-3 font-medium">Period</th>
                    <th className="text-right p-3 font-medium">Base</th>
                    <th className="text-right p-3 font-medium">Allow.</th>
                    <th className="text-right p-3 font-medium">Deduct.</th>
                    <th className="text-right p-3 font-medium">Net Pay</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPayroll.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.staff_name}</td>
                      <td className="p-3 text-muted-foreground text-xs">{formatDate(p.period_start)} - {formatDate(p.period_end)}</td>
                      <td className="p-3 text-right">{formatCurrency(p.base_salary)}</td>
                      <td className="p-3 text-right text-success">+{formatCurrency(p.allowances)}</td>
                      <td className="p-3 text-right text-danger">-{formatCurrency(p.deductions)}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(p.net_pay)}</td>
                      <td className="p-3"><Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Modal open={showEditStaff} onClose={() => setShowEditStaff(false)} title={`Edit Staff - ${editStaff.first_name} ${editStaff.last_name}`} size="lg">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowEditStaff(false); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" id="efname" defaultValue={editStaff.first_name} required />
              <Input label="Last Name" id="elname" defaultValue={editStaff.last_name} required />
              <Select label="Role" id="erole" options={[
                { value: 'admin', label: 'Admin' }, { value: 'pharmacist', label: 'Pharmacist' },
                { value: 'cashier', label: 'Cashier' }, { value: 'store_manager', label: 'Store Manager' },
              ]} />
              <Input label="Phone" id="ephone" defaultValue={editStaff.phone} required />
              <Input label="Email" id="eemail" type="email" defaultValue={editStaff.email} required />
              <Input label="Monthly Salary (SSP)" id="esalary" type="number" defaultValue={editStaff.salary} required />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowEditStaff(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>

        <Modal open={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member" size="lg">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddStaff(false); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" id="fname" required />
              <Input label="Last Name" id="lname" required />
              <Select label="Role" id="role" options={[
                { value: 'admin', label: 'Admin' }, { value: 'pharmacist', label: 'Pharmacist' },
                { value: 'cashier', label: 'Cashier' }, { value: 'store_manager', label: 'Store Manager' },
              ]} />
              <Input label="Phone" id="phone" required />
              <Input label="Email" id="email" type="email" required />
              <Input label="Monthly Salary (SSP)" id="salary" type="number" required />
              <Input label="Hire Date" id="hire_date" type="date" required />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowAddStaff(false)}>Cancel</Button>
              <Button type="submit">Save Staff</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
