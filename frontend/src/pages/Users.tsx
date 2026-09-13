import React, { useState, useEffect } from 'react';
import { usersApi } from '../api/users';
import type { UserCreateInput } from '../api/users';
import type { User, UserRole, UserStatus } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from '../components/ui/Table';
import { formatDate } from '../utils/formatters';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Shield,
  SearchCode,
  LineChart,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Check,
  Mail
} from 'lucide-react';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState<UserCreateInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'INVESTIGATOR',
    department: 'Special Investigation Unit',
    status: 'ACTIVE',
  });
  const [newPassword, setNewPassword] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await usersApi.getUsers({
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        role: roleFilter ? (roleFilter as UserRole) : undefined,
        status: statusFilter ? (statusFilter as UserStatus) : undefined,
      });
      setUsers(data.items);
      setTotalItems(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadUsers();
  };

  const handleOpenCreate = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'INVESTIGATOR',
      department: 'Special Investigation Unit',
      status: 'ACTIVE',
    });
    setActionError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department,
      status: user.status,
    });
    setActionError(null);
    setIsEditOpen(true);
  };

  const handleOpenResetPass = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setActionError(null);
    setIsResetPassOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await usersApi.createUser(formData);
      setIsCreateOpen(false);
      setActionSuccess('User created successfully');
      setTimeout(() => setActionSuccess(null), 4000);
      loadUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionError(null);
    try {
      await usersApi.updateUser(selectedUser.id, {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        department: formData.department,
        status: formData.status,
      });
      setIsEditOpen(false);
      setActionSuccess('User updated successfully');
      setTimeout(() => setActionSuccess(null), 4000);
      loadUsers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update user');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    setActionError(null);
    try {
      await usersApi.resetPassword(selectedUser.id, newPassword);
      setIsResetPassOpen(false);
      setActionSuccess(`Password reset successfully for ${selectedUser.email}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await usersApi.updateStatus(user.id, nextStatus);
      setActionSuccess(`User status changed to ${nextStatus}`);
      setTimeout(() => setActionSuccess(null), 3000);
      loadUsers();
    } catch (err: any) {
      console.error(err);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-3.5 w-3.5 text-purple-400" />;
      case 'INVESTIGATOR':
        return <SearchCode className="h-3.5 w-3.5 text-blue-400" />;
      case 'ANALYST':
        return <LineChart className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <UsersIcon className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80';
      case 'INVESTIGATOR':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/80';
      case 'ANALYST':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <UsersIcon className="h-7 w-7 text-blue-500" />
            User & Role Access Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure system access, RBAC permissions, and investigator assignments for HealthGuard AI.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-600/50 text-emerald-300 px-4 py-3 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Filters Card */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-md">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="INVESTIGATOR">INVESTIGATOR</option>
                <option value="ANALYST">ANALYST</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>

              <Button type="submit" variant="secondary" size="md" className="text-xs">
                Filter
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                  Loading user accounts...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                  No users found matching search criteria.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">
                          {u.first_name} {u.last_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${getRoleBadge(u.role)}`}>
                      {getRoleIcon(u.role)}
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-300">
                    {u.department || 'Claims Operations'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        u.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : u.status === 'SUSPENDED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {u.status === 'ACTIVE' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {u.last_login ? formatDate(u.last_login) : 'Never'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {formatDate(u.created_at)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User"
                        className="h-8 w-8 p-0 text-slate-300 hover:text-white"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenResetPass(u)}
                        title="Reset Password"
                        className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(u)}
                        title={u.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
                        className={`h-8 w-8 p-0 ${u.status === 'ACTIVE' ? 'text-rose-400 hover:text-rose-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                      >
                        {u.status === 'ACTIVE' ? <XCircle className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User Account"
        description="Provision a new account with customized role-based privileges."
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 bg-rose-950/70 border border-rose-700/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">First Name *</label>
              <Input
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Ramesh"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Last Name *</label>
              <Input
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Verma"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Email Address *</label>
            <Input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="r.verma@healthguard.ai"
              icon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Initial Password *</label>
            <Input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters"
              icon={<Lock className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">System Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="INVESTIGATOR">INVESTIGATOR (SIU)</option>
                <option value="ADMIN">ADMIN (System Administrator)</option>
                <option value="ANALYST">ANALYST (Risk Monitoring)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Department</label>
              <Input
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Special Investigation Unit"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User Profile"
        description="Update user account information and role assignments."
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 bg-rose-950/70 border border-rose-700/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">First Name *</label>
              <Input
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Last Name *</label>
              <Input
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Email Address</label>
            <Input disabled value={formData.email} className="opacity-60 cursor-not-allowed" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="INVESTIGATOR">INVESTIGATOR</option>
                <option value="ADMIN">ADMIN</option>
                <option value="ANALYST">ANALYST</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">Department</label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPassOpen}
        onClose={() => setIsResetPassOpen(false)}
        title="Reset User Password"
        description={`Set a new temporary password for ${selectedUser?.email}.`}
        size="sm"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 bg-rose-950/70 border border-rose-700/60 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              {actionError}
            </div>
          )}

          <div>
            <label className="text-xs text-slate-300 font-medium block mb-1">New Password *</label>
            <Input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 chars)"
              icon={<KeyRound className="h-4 w-4" />}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsResetPassOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger">
              Confirm Reset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
