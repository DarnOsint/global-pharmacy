'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Users, Plus, Eye, Edit2, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const mockStaff = [
  { id: '1', first_name: 'Chidinma', last_name: 'Eze', role: 'admin', phone: '08012345678', email: 'chidinma@globalpharmacy.com', hire_date: '2024-01-15', salary: 180000, is_active: true },
  { id: '2', first_name: 'Blessing', last_name: 'Okoro', role: 'pharmacist', phone: '08023456789', email: 'blessing@globalpharmacy.com', hire_date: '2024-03-20', salary: 150000, is_active: true },
  { id: '3', first_name: 'Ibrahim', last_name: 'Mohammed', role: 'pharmacist', phone: '08034567890', email: 'ibrahim@globalpharmacy.com', hire_date: '2024-06-10', salary: 150000, is_active: true },
  { id: '4', first_name: 'Ngozi', last_name: 'Adeyemi', role: 'cashier', phone: '08045678901', email: 'ngozi@globalpharmacy.com', hire_date: '2025-01-05', salary: 95000, is_active: true },
  { id: '5', first_name: 'Tunde', last_name: 'Olawale', role: 'store_manager', phone: '08056789012', email: 'tunde@globalpharmacy.com', hire_date: '2025-06-15', salary: 120000, is_active: true },
];

const mockPayroll = [
  { id: '1', staff_id: '1', staff_name: 'Chidinma Eze', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 90000, allowances: 15000, deductions: 5000, net_pay: 100000, status: 'paid', paid_at: '2026-08-16T10:00:00Z' },
  { id: '2', staff_id: '2', staff_name: 'Blessing Okoro', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 75000, allowances: 10000, deductions: 3000, net_pay: 82000, status: 'paid', paid_at: '2026-08-16T10:00:00Z' },
  { id: '3', staff_id: '4', staff_name: 'Ngozi Adeyemi', period_start: '2026-08-01', period_end: '2026-08-15', base_salary: 47500, allowances: 5000, deductions: 2000, net_pay: 50500, status: 'pending', paid_at: null },
];

const roleColors: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  admin: 'info',
  pharmacist: 'success',
  cashier: 'warning',
  store_manager: 'default',
};

export default function HRPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'payroll'>('staff');
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const totalPayroll = mockPayroll.reduce((s, p) => s + p.net_pay, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">HR & Payroll</h1>
            <p className="text-sm text-muted-foreground">Manage staff and payroll</p>
          </div>
          <Button onClick={() => activeTab === 'staff' ? setShowAddStaff(true) : setShowPayrollModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> {activeTab === 'staff' ? 'Add Staff' : 'Process Payroll'}
          </Button>
        </div>

        <div className="flex gap-2 border-b border-border">
          {(['staff', 'payroll'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'staff' ? 'Staff Members' : 'Payroll'}
            </button>
          ))}
        </div>

        {activeTab === 'staff' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total Staff</p>
                  <p className="text-2xl font-bold">{mockStaff.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-success">{mockStaff.filter(s => s.is_active).length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(mockStaff.reduce((s, st) => s + st.salary, 0))}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Phone</th>
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-right p-3 font-medium">Salary</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockStaff.map((staff) => (
                      <tr key={staff.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 font-medium">{staff.first_name} {staff.last_name}</td>
                        <td className="p-3"><Badge variant={roleColors[staff.role]}>{staff.role}</Badge></td>
                        <td className="p-3 text-muted-foreground">{staff.phone}</td>
                        <td className="p-3 text-muted-foreground text-xs">{staff.email}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(staff.salary)}</td>
                        <td className="p-3"><Badge variant={staff.is_active ? 'success' : 'danger'}>{staff.is_active ? 'Active' : 'Inactive'}</Badge></td>
                        <td className="p-3 text-right">
                          <button className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'payroll' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total Payroll (Period)</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalPayroll)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-accent">{mockPayroll.filter(p => p.status === 'pending').length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-2xl font-bold text-success">{mockPayroll.filter(p => p.status === 'paid').length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Records</CardTitle>
              </CardHeader>
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
                        <td className="p-3 text-muted-foreground text-xs">{formatDate(p.period_start)} — {formatDate(p.period_end)}</td>
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
          </>
        )}

        <Modal open={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member" size="lg">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddStaff(false); }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" id="fname" required />
              <Input label="Last Name" id="lname" required />
              <Select label="Role" id="role" options={[
                { value: 'admin', label: 'Admin' },
                { value: 'pharmacist', label: 'Pharmacist' },
                { value: 'cashier', label: 'Cashier' },
                { value: 'store_manager', label: 'Store Manager' },
              ]} />
              <Input label="Phone" id="phone" required />
              <Input label="Email" id="email" type="email" required />
              <Input label="Monthly Salary (₦)" id="salary" type="number" required />
              <Input label="Hire Date" id="hire_date" type="date" required />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowAddStaff(false)}>Cancel</Button>
              <Button type="submit">Save Staff</Button>
            </div>
          </form>
        </Modal>

        <Modal open={showPayrollModal} onClose={() => setShowPayrollModal(false)} title="Process Payroll" size="md">
          <div className="space-y-4">
            <Select label="Staff Member" id="staff" options={mockStaff.map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Period Start" id="period_start" type="date" />
              <Input label="Period End" id="period_end" type="date" />
            </div>
            <Input label="Allowances (₦)" id="allowances" type="number" />
            <Input label="Deductions (₦)" id="deductions" type="number" />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowPayrollModal(false)}>Cancel</Button>
              <Button variant="accent">Process Payment</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
