import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Search, Trash2, Edit, Building2, Award } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    agency_name: '',
    emp_id: '',
    lic_no: 'LIC-4110-KAR'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agencyRes, empRes] = await Promise.all([
        api.get('/agencies', { params: { search } }),
        api.get('/employers')
      ]);
      if (agencyRes.data?.data) setAgencies(agencyRes.data.data);
      if (empRes.data?.data) setEmployers(empRes.data.data);
    } catch {
      addToast('Failed to load recruitment agencies', 'error');
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
      const res = await api.post('/agencies', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Recruitment agency created', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving agency', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/agencies/${editItem.agency_no}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Recruitment agency updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating agency', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/agencies/${deleteTarget.agency_no}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Agency deleted', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error deleting agency', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      agency_name: item.agency_name || '',
      emp_id: item.emp_id || '',
      lic_no: item.lic_no || 'LIC-4100-KAR'
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Recruitment Agencies & Licenses</h1>
            <Badge variant="cyan">Relations #16, #17, #18</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintains external talent placement agencies, regulatory license numbers, and recruiter-employer contracts.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              agency_name: '',
              emp_id: employers[0]?.emp_id || '',
              lic_no: 'LIC-4120-GEN'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Agency
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by agency name, employer, or license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Records: <span className="text-cyan-400 font-semibold">{agencies.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading recruitment agencies from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Agency Code</th>
                <th>Agency Name</th>
                <th>Assigned Employer</th>
                <th>Recruiter License</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No recruitment agencies found.
                  </td>
                </tr>
              ) : (
                agencies.map((item) => (
                  <tr key={item.agency_no}>
                    <td className="font-mono text-cyan-400 font-bold">{item.agency_no}</td>
                    <td className="font-semibold text-white">{item.agency_name}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-slate-300 font-medium">{item.company_name}</span>
                        <span className="font-mono text-slate-500 text-xs">({item.emp_id})</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/50 text-xs">
                        {item.lic_no}
                      </span>
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
        <Modal title="Add Recruitment Agency" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Agency Name</label>
              <input
                type="text"
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                placeholder="e.g. Talent Bridge Global, Apex Search"
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contracted Employer</label>
              <select
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- None / Direct --</option>
                {employers.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Recruitment License Number</label>
              <input
                type="text"
                value={formData.lic_no}
                onChange={(e) => setFormData({ ...formData, lic_no: e.target.value })}
                placeholder="e.g. LIC-4101-KAR"
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Agency</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Agency #${editItem.agency_no}`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Agency Name</label>
              <input
                type="text"
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contracted Employer</label>
              <select
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- None / Direct --</option>
                {employers.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Recruitment License Number</label>
              <input
                type="text"
                value={formData.lic_no}
                onChange={(e) => setFormData({ ...formData, lic_no: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Agency</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete recruitment agency <span className="font-mono text-cyan-400 font-semibold">{deleteTarget.agency_no}</span> ({deleteTarget.agency_name})?
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
