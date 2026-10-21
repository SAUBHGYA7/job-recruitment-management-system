import React, { useState, useEffect } from 'react';
import { Network, Plus, Search, Trash2, Edit, Building2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    comp_type: 'Software Enterprise',
    emp_count: '250',
    emp_id: ''
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [compRes, empRes] = await Promise.all([
        api.get('/companies', { params: { search } }),
        api.get('/employers')
      ]);
      if (compRes.data?.data) setCompanies(compRes.data.data);
      if (empRes.data?.data) setEmployers(empRes.data.data);
    } catch {
      addToast('Failed to load companies from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/companies', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Company created', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving company', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/companies/${editItem.comp_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Company updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating company', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/companies/${deleteTarget.comp_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Company deleted', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error deleting company', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      comp_type: item.comp_type || '',
      emp_count: String(item.emp_count || '100'),
      emp_id: item.emp_id || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Companies & Affiliates</h1>
            <Badge variant="cyan">Relations #14, #15</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manages corporate entity classifications, headcount volume, and Employer-Company affiliations.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              comp_type: 'Software Enterprise',
              emp_count: '250',
              emp_id: employers[0]?.emp_id || ''
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Company
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company type, employer name, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Records: <span className="text-cyan-400 font-semibold">{companies.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading company profiles from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Comp ID</th>
                <th>Company Classification</th>
                <th>Workforce Count</th>
                <th>Linked Employer</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No company profiles found.
                  </td>
                </tr>
              ) : (
                companies.map((item) => (
                  <tr key={item.comp_id}>
                    <td className="font-mono text-cyan-400 font-bold">{item.comp_id}</td>
                    <td className="font-semibold text-white">{item.comp_type}</td>
                    <td>
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">
                        {item.emp_count ? Number(item.emp_count).toLocaleString() : 'N/A'} Employees
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 font-medium">
                          {item.company_name} <span className="font-mono text-slate-500 text-xs">({item.emp_id})</span>
                        </span>
                      </div>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Add Company Entity" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company Classification / Type</label>
              <input
                type="text"
                value={formData.comp_type}
                onChange={(e) => setFormData({ ...formData, comp_type: e.target.value })}
                placeholder="e.g. IT Services, Fintech, Clean Energy"
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Employee Count (Workforce)</label>
              <input
                type="number"
                value={formData.emp_count}
                onChange={(e) => setFormData({ ...formData, emp_count: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Affiliated Employer</label>
              <select
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- None / Standalone --</option>
                {employers.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Company</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Company #${editItem.comp_id}`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company Classification / Type</label>
              <input
                type="text"
                value={formData.comp_type}
                onChange={(e) => setFormData({ ...formData, comp_type: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Employee Count</label>
              <input
                type="number"
                value={formData.emp_count}
                onChange={(e) => setFormData({ ...formData, emp_count: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Affiliated Employer</label>
              <select
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- None / Standalone --</option>
                {employers.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Company</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete company record <span className="font-mono text-cyan-400 font-semibold">{deleteTarget.comp_id}</span> ({deleteTarget.comp_type})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete Permanently</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
