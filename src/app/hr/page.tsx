'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Users, Plus, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { useSync } from '@/lib/use-sync';
import { getAllStaff, addStaff, updateStaff, getAllPayroll, addPayroll } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Staff, Payroll } from '@/types/database';

const roleColors: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
  admin: 'info', pharmacist: 'success', cashier: 'warning', store_manager: 'default',
};

export default function HRPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { refreshCount } = useSync();
  const [activeTab, setActiveTab] = useState<'staff' | 'payroll'>('staff');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [payrollList, setPayrollList] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const loadData = useCallback(async () => {
    await seedOfflineData();
    const [staff, payroll] = await Promise.all([getAllStaff(), getAllPayroll()]);
    setStaffList(staff);
    setPayrollList(payroll);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getStaffName = (staffId: string) => {
    const s = staffList.find(s => s.id === staffId);
    return s ? `${s.first_name} ${s.last_name}` : 'Unknown';
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    await addStaff({
      first_name: (form.querySelector('#fname') as HTMLInputElement).value,
      last_name: (form.querySelector('#lname') as HTMLInputElement).value,
      role: (form.querySelector('#role') as HTMLSelectElement).value as Staff['role'],
      phone: (form.querySelector('#phone') as HTMLInputElement).value,
      email: (form.querySelector('#email') as HTMLInputElement).value,
      salary: Number((form.querySelector('#salary') as HTMLInputElement).value),
      hire_date: (form.querySelector('#hire_date') as HTMLInputElement).value,
      is_active: true,
    });
    await refreshCount();
    setShowAddStaff(false);
    await loadData();
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStaff) return;
    const form = e.target as HTMLFormElement;
    await updateStaff(editStaff.id, {
      first_name: (form.querySelector('#efname') as HTMLInputElement).value,
      last_name: (form.querySelector('#elname') as HTMLInputElement).value,
      role: (form.querySelector('#erole') as HTMLSelectElement).value as Staff['role'],
      phone: (form.querySelector('#ephone') as HTMLInputElement).value,
      email: (form.querySelector('#eemail') as HTMLInputElement).value,
      salary: Number((form.querySelector('#esalary') as HTMLInputElement).value),
    });
    await refreshCount();
    setShowEditStaff(false);
    await loadData();
  };

  const handleProcessPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const staffId = (form.querySelector('#pstaff') as HTMLSelectElement).value;
    const base = Number((form.querySelector('#pbase') as HTMLInputElement).value);
    const allowances = Number((form.querySelector('#pallow') as HTMLInputElement).value);
    const deductions = Number((form.querySelector('#pdeduct') as HTMLInputElement).value);
    await addPayroll({
      staff_id: staffId,
      period_start: (form.querySelector('#pstart') as HTMLInputElement).value,
      period_end: (form.querySelector('#pend') as HTMLInputElement).value,
      base_salary: base,
      allowances,
      deductions,
      net_pay: base + allowances - deductions,
      status: 'pending',
      paid_at: null,
    });
    await refreshCount();
    setShowPayrollModal(false);
    await loadData();
  };

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">HR & Payroll</h1>
            <p className="text-sm text-muted-foreground">{staffList.length} staff members</p>
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
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{staff.first_name} {staff.last_name}</td>
                      <td className="p-3"><Badge variant={roleColors[staff.role]}>{staff.role.replace('_', ' ')}</Badge></td>
                      <td className="p-3 text-muted-foreground">{staff.phone}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(staff.salary, 'SSP')}</td>
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
                  {payrollList.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{getStaffName(p.staff_id)}</td>
                      <td className="p-3 text-muted-foreground text-xs">{formatDate(p.period_start)} - {formatDate(p.period_end)}</td>
                      <td className="p-3 text-right">{formatCurrency(p.base_salary, 'SSP')}</td>
                      <td className="p-3 text-right text-success">+{formatCurrency(p.allowances, 'SSP')}</td>
                      <td className="p-3 text-right text-danger">-{formatCurrency(p.deductions, 'SSP')}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(p.net_pay, 'SSP')}</td>
                      <td className="p-3"><Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Modal open={showEditStaff} onClose={() => setShowEditStaff(false)} title={`Edit Staff`} size="lg">
          {editStaff && (
            <form className="space-y-4" onSubmit={handleEditStaff}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" id="efname" defaultValue={editStaff.first_name} required />
                <Input label="Last Name" id="elname" defaultValue={editStaff.last_name} required />
                <Select label="Role" id="erole" defaultValue={editStaff.role} options={[
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
          )}
        </Modal>

        <Modal open={showAddStaff} onClose={() => setShowAddStaff(false)} title="Add Staff Member" size="lg">
          <form className="space-y-4" onSubmit={handleAddStaff}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" id="fname" required />
              <Input label="Last Name" id="lname" required />
              <Select label="Role" id="role" options={[
                { value: 'pharmacist', label: 'Pharmacist' },
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

        <Modal open={showPayrollModal} onClose={() => setShowPayrollModal(false)} title="Process Payroll" size="lg">
          <form className="space-y-4" onSubmit={handleProcessPayroll}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Staff Member" id="pstaff" options={staffList.filter(s => s.is_active).map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))} />
              <Input label="Period Start" id="pstart" type="date" required />
              <Input label="Period End" id="pend" type="date" required />
              <Input label="Base Salary (SSP)" id="pbase" type="number" required />
              <Input label="Allowances (SSP)" id="pallow" type="number" defaultValue={0} />
              <Input label="Deductions (SSP)" id="pdeduct" type="number" defaultValue={0} />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => setShowPayrollModal(false)}>Cancel</Button>
              <Button type="submit">Process Payroll</Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}
