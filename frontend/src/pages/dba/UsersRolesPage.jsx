import React, { useState, useEffect } from 'react';
import { Shield, Plus, UserCheck, UserX, Key, Mail, User } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function UsersRolesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'USER'
  });

  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dba/users');
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch {
      addToast('Failed to load application users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/dba/users', formData);
      if (res.data.success) {
        addToast(`User ${formData.username} created with role ${formData.role}`, 'success');
        setShowAddModal(false);
        setFormData({ username: '', password: '', full_name: '', email: '', role: 'USER' });
        fetchUsers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await api.put(`/dba/users/${userId}/role`, { role: newRole });
      addToast(`Updated user role to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.put(`/dba/users/${userId}/toggle-status`);
      addToast(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to toggle status', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">User Security &amp; Role-Based Access</h2>
            <Badge variant="success">RBAC Engine</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Application users stored in Oracle <code className="text-emerald-400">APP_USERS</code> with BCrypt hashing</p>
        </div>
        <Button icon={Plus} variant="dba" onClick={() => setShowAddModal(true)}>
          Create User Account
        </Button>
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Loading APP_USERS from database..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">User ID</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{u.user_id}</td>
                    <td className="py-3.5 px-4 font-bold text-white font-mono">{u.username}</td>
                    <td className="py-3.5 px-4">{u.full_name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.user_id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="USER">USER</option>
                        <option value="DATABASE_DESIGNER">DATABASE_DESIGNER</option>
                        <option value="DBA">DBA</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.is_active ? 'success' : 'danger'}>
                        {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.user_id)}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.is_active
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                        }`}
                        title={u.is_active ? 'Deactivate Account' : 'Activate Account'}
                      >
                        {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Application User"
        subtitle="Inserts into APP_USERS with BCrypt hashed password and audit logging"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="e.g. jsmith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="jsmith@jrms.org"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="USER">USER (Recruitment Portal)</option>
              <option value="DATABASE_DESIGNER">DATABASE_DESIGNER (Schema Architecture)</option>
              <option value="DBA">DBA (Full Administrator)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="dba" loading={addLoading}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
