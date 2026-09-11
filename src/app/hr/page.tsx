'use client';

import { useState, useEffect, useCallback } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { SyncNowButton } from '@/components/sync-now-button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth';
import { useSync } from '@/lib/use-sync';
import { useSettingsStore } from '@/lib/settings-store';
import { getAllStaff, addStaff, updateStaff, deleteStaff, getAllPayroll, addPayroll, updatePayroll } from '@/lib/offline-db';
import { seedOfflineData } from '@/lib/seed-data';
import type { Staff, Payroll } from '@/types/database';
import type { RoleConfig } from '@/lib/settings-store';

const roleColorVariants: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  info: 'info', success: 'success', warning: 'warning', danger: 'danger', default: 'default',
};

export default function HRPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { refreshCount } = useSync();
  const roles = useSettingsStore((s) => s.roles);
  const addRole = useSettingsStore((s) => s.addRole);
  const updateRoleSetting = useSettingsStore((s) => s.updateRole);
  const removeRole = useSettingsStore((s) => s.removeRole);
  const [activeTab, setActiveTab] = useState<'staff' | 'payroll' | 'roles'>('staff');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [payrollList, setPayrollList] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showEditStaff, setShowEditStaff] = useState(false);
  const [editStaff, setEditStaff] = useState<Staff | null>(null);
  const [deleteStaffTarget, setDeleteStaffTarget] = useState<Staff | null>(null);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEditPayroll, setShowEditPayroll] = useState(false);
  const [editPayroll, setEditPayroll] = useState<Payroll | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<RoleConfig | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<RoleConfig | null>(null);

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

  const roleLabel = (role: string) => {
    const r = roles.find(x => x.id === role);
    return r ? r.name : role.replace('_', ' ');
  };

  const roleColor = (role: string) => {
    const r = roles.find(x => x.id === role);
    return (r && roleColorVariants[r.color]) || 'default';
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    await addStaff({
      first_name: (form.querySelector('#fname') as HTMLInputElement).value,
      last_name: (form.querySelector('#lname') as HTMLInputElement).value,
      role: (form.querySelector('#role') as HTMLSelectElement).value,
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
      role: (form.querySelector('#erole') as HTMLSelectElement).value,
      phone: (form.querySelector('#ephone') as HTMLInputElement).value,
      email: (form.querySelector('#eemail') as HTMLInputElement).value,
      salary: Number((form.querySelector('#esalary') as HTMLInputElement).value),
      hire_date: (form.querySelector('#ehire_date') as HTMLInputElement).value,
      is_active: (form.querySelector('#eis_active') as HTMLSelectElement).value === 'true',
    });
    await refreshCount();
    setShowEditStaff(false);
    setEditStaff(null);
    await loadData();
  };

  const handleDeleteStaff = async () => {
    if (!deleteStaffTarget) return;
    await deleteStaff(deleteStaffTarget.id);
    await refreshCount();
    setDeleteStaffTarget(null);
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

  const handleEditPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayroll) return;
    const form = e.target as HTMLFormElement;
    const base = Number((form.querySelector('#epbase') as HTMLInputElement).value);
    const allowances = Number((form.querySelector('#epallow') as HTMLInputElement).value);
    const deductions = Number((form.querySelector('#epdeduct') as HTMLInputElement).value);
    const status = (form.querySelector('#epstatus') as HTMLSelectElement).value as 'pending' | 'paid';
    const paidInput = (form.querySelector('#eppaid') as HTMLInputElement).value;
    await updatePayroll(editPayroll.id, {
      staff_id: (form.querySelector('#epstaff') as HTMLSelectElement).value,
      period_start: (form.querySelector('#epstart') as HTMLInputElement).value,
      period_end: (form.querySelector('#epend') as HTMLInputElement).value,
      base_salary: base,
      allowances,
      deductions,
      net_pay: base + allowances - deductions,
      status,
      paid_at: status === 'paid' ? (paidInput || new Date().toISOString().slice(0, 10)) : null,
    });
    await refreshCount();
    setShowEditPayroll(false);
    setEditPayroll(null);
    await loadData();
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.querySelector('#role_name') as HTMLInputElement).value.trim();
    if (!name) return;
    const newRole: RoleConfig = {
      id: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      name,
      color: (form.querySelector('#role_color') as HTMLSelectElement).value,
    };
    if (!newRole.id) return;
    if (roles.some(r => r.id === newRole.id)) {
      alert('Role with this name already exists.');
      return;
    }
    addRole(newRole);
    setShowRoleModal(false);
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRole) return;
    const form = e.target as HTMLFormElement;
    updateRoleSetting(editRole.id, {
      name: (form.querySelector('#erole_name') as HTMLInputElement).value.trim(),
      color: (form.querySelector('#erole_color') as HTMLSelectElement).value,
    });
    setShowRoleModal(false);
    setEditRole(null);
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    if (deleteRoleTarget.id === 'admin') {
      alert('The Admin role cannot be deleted.');
      return;
    }
    if (staffList.some(s => s.role === deleteRoleTarget.id)) {
      alert(`Cannot delete "${deleteRoleTarget.name}" — it is assigned to staff members. Reassign them first.`);
      setDeleteRoleTarget(null);
      return;
    }
    removeRole(deleteRoleTarget.id);
    setDeleteRoleTarget(null);
  };

  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));
  const colorOptions = [
    { value: 'default', label: 'Grey' },
    { value: 'info', label: 'Orange' },
    { value: 'success', label: 'Green' },
    { value: 'warning', label: 'Yellow' },
    { value: 'danger', label: 'Red' },
  ];

  const showPayrollHeader = isAdmin;
  const showRoles = isAdmin;

  return (
    <AuthGuard>
      <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">HR & Payroll</h1>
            <p className="text-sm text-muted-foreground">{staffList.length} staff members</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SyncNowButton label="Sync Now" />
            {isAdmin && (
              <Button onClick={() => {
                if (activeTab === 'roles') { setEditRole(null); setShowRoleModal(true); }
                else if (activeTab === 'staff') { setShowAddStaff(true); }
                else { setShowPayrollModal(true); }
              }}>
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'roles' ? 'Add Role' : activeTab === 'staff' ? 'Add Staff' : 'Process Payroll'}
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-b border-border">
          {[['staff', 'Staff Members'], ['payroll', 'Payroll'], ...(showRoles ? [['roles', 'Roles']] : [])].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as 'staff' | 'payroll' | 'roles')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {label}
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
                    <th className="text-left p-3 font-medium">Hire Date</th>
                    <th className="text-right p-3 font-medium">Salary</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    {isAdmin && <th className="text-right p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{staff.first_name} {staff.last_name}</td>
                      <td className="p-3"><Badge variant={roleColor(staff.role)}>{roleLabel(staff.role)}</Badge></td>
                      <td className="p-3 text-muted-foreground">{staff.phone}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(staff.hire_date)}</td>
                      <td className="p-3 text-right font-medium">{formatCurrency(staff.salary, 'SSP')}</td>
                      <td className="p-3"><Badge variant={staff.is_active ? 'success' : 'danger'}>{staff.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      {isAdmin && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditStaff(staff); setShowEditStaff(true); }} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteStaffTarget(staff)} className="p-1.5 rounded hover:bg-muted text-danger"><Trash2 className="w-4 h-4" /></button>
                          </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium">Staff Member</th>
                    <th className="text-left p-3 font-medium">Period</th>
                    <th className="text-right p-3 font-medium">Net Pay</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    {showPayrollHeader && <th className="text-right p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {payrollList.map((p) => (
                    <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{getStaffName(p.staff_id)}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(p.period_start)} → {formatDate(p.period_end)}</td>
                      <td className="p-3 text-right font-bold text-primary">{formatCurrency(p.net_pay, 'SSP')}</td>
                      <td className="p-3"><Badge variant={p.status === 'paid' ? 'success' : 'warning'}>{p.status}</Badge></td>
                      {showPayrollHeader && (
                        <td className="p-3 text-right">
                          <button onClick={() => { setEditPayroll(p); setShowEditPayroll(true); }} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'roles' && showRoles && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Roles</CardTitle>
              <p className="text-sm text-muted-foreground">Create, rename, or delete staff roles. Deleting a role that is assigned to staff is blocked until they are reassigned.</p>
            </CardHeader>
            <div className="p-4 pt-0 space-y-3">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Badge variant={roleColorVariants[r.color]}>{r.name}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{r.id}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditRole(r); setShowRoleModal(true); }} className="p-1.5 rounded hover:bg-muted"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteRoleTarget(r)} className="p-1.5 rounded hover:bg-muted text-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
              {roles.length === 0 && <p className="text-sm text-muted-foreground">No roles defined.</p>}
            </div>
          </Card>
        )}

        <Modal open={showEditStaff} onClose={() => setShowEditStaff(false)} title={`Edit Staff`} size="lg">
          {editStaff && (
            <form className="space-y-4" onSubmit={handleEditStaff}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" id="efname" defaultValue={editStaff.first_name} required />
                <Input label="Last Name" id="elname" defaultValue={editStaff.last_name} required />
                <Select label="Role" id="erole" defaultValue={editStaff.role} options={roleOptions} />
                <Input label="Phone" id="ephone" defaultValue={editStaff.phone} required />
                <Input label="Email" id="eemail" type="email" defaultValue={editStaff.email} required />
                <Input label="Monthly Salary (SSP)" id="esalary" type="number" defaultValue={editStaff.salary} required />
                <Input label="Hire Date" id="ehire_date" type="date" defaultValue={editStaff.hire_date} required />
                <Select label="Status" id="eis_active" defaultValue={String(editStaff.is_active)} options={[
                  { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
                ]} />
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
              <Select label="Role" id="role" options={roleOptions} />
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

        <Modal open={!!deleteStaffTarget} onClose={() => setDeleteStaffTarget(null)} title="Delete Staff Member" size="md">
          {deleteStaffTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-medium text-foreground">{deleteStaffTarget.first_name} {deleteStaffTarget.last_name}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setDeleteStaffTarget(null)}>Cancel</Button>
                <Button variant="danger" type="button" onClick={handleDeleteStaff}>Delete</Button>
              </div>
            </div>
          )}
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

        <Modal open={showEditPayroll} onClose={() => setShowEditPayroll(false)} title="Edit Payroll" size="lg">
          {editPayroll && (
            <form className="space-y-4" onSubmit={handleEditPayroll}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Staff Member" id="epstaff" defaultValue={editPayroll.staff_id} options={staffList.filter(s => s.is_active).map(s => ({ value: s.id, label: `${s.first_name} ${s.last_name}` }))} />
                <Input label="Period Start" id="epstart" type="date" defaultValue={editPayroll.period_start} required />
                <Input label="Period End" id="epend" type="date" defaultValue={editPayroll.period_end} required />
                <Input label="Base Salary (SSP)" id="epbase" type="number" defaultValue={editPayroll.base_salary} required />
                <Input label="Allowances (SSP)" id="epallow" type="number" defaultValue={editPayroll.allowances} />
                <Input label="Deductions (SSP)" id="epdeduct" type="number" defaultValue={editPayroll.deductions} />
                <Select label="Status" id="epstatus" defaultValue={editPayroll.status} options={[
                  { value: 'pending', label: 'Pending' }, { value: 'paid', label: 'Paid' },
                ]} />
                <Input label="Paid Date" id="eppaid" type="date" defaultValue={editPayroll.paid_at || ''} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setShowEditPayroll(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </Modal>

        <Modal open={showRoleModal} onClose={() => setShowRoleModal(false)} title={editRole ? `Edit Role` : 'Add Role'} size="md">
          <form className="space-y-4" onSubmit={editRole ? handleEditRole : handleAddRole}>
            <Input label="Role Name" id={editRole ? 'erole_name' : 'role_name'} defaultValue={editRole?.name} required />
            <Select label="Label Color" id={editRole ? 'erole_color' : 'role_color'} defaultValue={editRole?.color || 'default'} options={colorOptions} />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" type="button" onClick={() => { setShowRoleModal(false); setEditRole(null); }}>Cancel</Button>
              <Button type="submit">{editRole ? 'Save Changes' : 'Add Role'}</Button>
            </div>
          </form>
        </Modal>

        <Modal open={!!deleteRoleTarget} onClose={() => setDeleteRoleTarget(null)} title="Delete Role" size="md">
          {deleteRoleTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete the <span className="font-medium text-foreground">{deleteRoleTarget.name}</span> role?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setDeleteRoleTarget(null)}>Cancel</Button>
                <Button variant="danger" type="button" onClick={handleDeleteRole}>Delete</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
    </AuthGuard>
  );
}