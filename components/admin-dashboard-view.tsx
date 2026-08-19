'use client';

import React, { useState } from 'react';
import { useLocale } from '@/hooks/use-locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { toggleUserStatus, changeUserRole, adminCreateUser } from '@/actions/admin';
import {
  Users,
  History,
  UserPlus,
  Search,
  Power,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface AdminDashboardViewProps {
  users: any[];
  logs: any[];
  currentAdminId: string;
  defaultTab?: 'users' | 'logs';
}

export function AdminDashboardView({ users, logs, currentAdminId, defaultTab = 'users' }: AdminDashboardViewProps) {
  const { t } = useLocale();
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>(defaultTab);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal Dialogs
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  
  // Forms
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<Role>('EDITOR');
  const [submitting, setSubmitting] = useState(false);

  // Add User Fields
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<Role>('EDITOR');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = async (userId: string) => {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      const res = await toggleUserStatus(formData);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('User status updated successfully.');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    }
  };

  const handleEditRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', selectedUser.id);
      formData.append('role', newRole);

      const res = await changeUserRole(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('User role changed successfully!');
        setIsEditRoleOpen(false);
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail || !addPassword) {
      toast.error('Please fill all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', addName);
      formData.append('email', addEmail);
      formData.append('password', addPassword);
      formData.append('role', addRole);

      const res = await adminCreateUser(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('User created successfully!');
        setIsAddUserOpen(false);
        setAddName('');
        setAddEmail('');
        setAddPassword('');
        window.location.reload();
      }
    } catch (err) {
      toast.error('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts Management</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-2 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="h-4 w-4" />
          <span>System Audit Logs</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border">
            <div className="flex gap-2 items-center w-full sm:max-w-xs">
              <Input
                placeholder="Search by Name or Email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-background text-xs border border-border rounded-lg p-2 focus:ring-primary focus:outline-hidden"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrators</option>
                <option value="CHIEF_EDITOR">Chief Editors</option>
                <option value="EDITOR">Editors</option>
                <option value="GUEST_EDITOR">Guest Editors</option>
                <option value="REVIEWER">Reviewers</option>
                <option value="AUTHOR">Authors</option>
              </select>
              <Button onClick={() => setIsAddUserOpen(true)} size="sm" className="shrink-0">
                <UserPlus className="h-4 w-4 mr-1.5" />
                <span>Add User</span>
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-foreground">Name</th>
                    <th className="p-4 font-bold text-foreground">Email</th>
                    <th className="p-4 font-bold text-foreground">Role</th>
                    <th className="p-4 font-bold text-foreground">Status</th>
                    <th className="p-4 font-bold text-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/15 transition-all">
                      <td className="p-4 font-semibold text-foreground">{user.name}</td>
                      <td className="p-4 text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={user.isActive ? 'success' : 'destructive'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4 flex justify-end gap-2 text-right">
                        <Button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setIsEditRoleOpen(true);
                          }}
                          disabled={user.id === currentAdminId}
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                        >
                          Change Role
                        </Button>
                        <Button
                          onClick={() => handleToggleStatus(user.id)}
                          disabled={user.id === currentAdminId}
                          variant={user.isActive ? 'destructive' : 'secondary'}
                          size="sm"
                          className="h-8 px-2"
                        >
                          <Power className="h-3.5 w-3.5 mr-1" />
                          <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Logs view */
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border">
                    <th className="p-4 font-bold text-foreground">Timestamp</th>
                    <th className="p-4 font-bold text-foreground">User</th>
                    <th className="p-4 font-bold text-foreground">Action</th>
                    <th className="p-4 font-bold text-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-secondary/15 transition-all">
                      <td className="p-4 text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-foreground font-medium">{log.userEmail || 'System'}</td>
                      <td className="p-4">
                        <Badge variant="info" className="font-mono text-[9px]">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-4 text-muted-foreground max-w-sm truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dialog: Change User Role */}
      {selectedUser && (
        <Dialog
          isOpen={isEditRoleOpen}
          onClose={() => setIsEditRoleOpen(false)}
          title={`Edit Role for ${selectedUser.name}`}
        >
          <form onSubmit={handleEditRoleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Account Role</Label>
              <Select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="CHIEF_EDITOR">CHIEF_EDITOR</option>
                <option value="EDITOR">EDITOR</option>
                <option value="GUEST_EDITOR">GUEST_EDITOR</option>
                <option value="REVIEWER">REVIEWER</option>
                <option value="AUTHOR">AUTHOR</option>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t('common.loading') : 'Update Role'}
            </Button>
          </form>
        </Dialog>
      )}

      {/* Dialog: Add User */}
      <Dialog
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Add Staff / User Account"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="addName">Full Name</Label>
            <Input
              id="addName"
              placeholder="Full name..."
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addEmail">Email Address</Label>
            <Input
              id="addEmail"
              type="email"
              placeholder="staff@mattengg.com"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addPassword">Password</Label>
            <Input
              id="addPassword"
              type="password"
              placeholder="Secure password..."
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addRole">Account Role</Label>
            <Select
              id="addRole"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as Role)}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="CHIEF_EDITOR">CHIEF_EDITOR</option>
              <option value="EDITOR">EDITOR</option>
              <option value="GUEST_EDITOR">GUEST_EDITOR</option>
              <option value="REVIEWER">REVIEWER</option>
              <option value="AUTHOR">AUTHOR</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? t('common.loading') : 'Create User'}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
