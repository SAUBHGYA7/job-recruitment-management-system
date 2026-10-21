import React, { useState, useEffect } from 'react';
import { HeartHandshake, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function DependentsPage() {
  const [dependents, setDependents] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cand_id: '',
    dob: '2010-06-15',
    relationship: 'Child'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, candRes] = await Promise.all([
        api.get('/dependents', { params: { search } }),
        api.get('/candidates')
      ]);
      if (depRes.data?.data) setDependents(depRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
    } catch {
      addToast('Failed to load dependents from database', 'error');
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
      const res = await api.post('/dependents', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Dependent record created', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving dependent record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/dependents/${editItem.dep_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Dependent record updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating dependent record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/dependents/${deleteTarget.dep_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Dependent record deleted', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error deleting dependent record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      cand_id: item.cand_id || '',
      dob: item.dob || '2010-06-15',
      relationship: item.relationship || 'Child'
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Dependents</h1>
            <Badge variant="cyan">Relation #7</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manages candidate family members, relations (Spouse, Child, Parent), and birth records.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              dob: '2010-06-15',
              relationship: 'Child'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Dependent
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by relationship or candidate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Records: <span className="text-cyan-400 font-semibold">{dependents.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading dependents from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dep ID</th>
                <th>Associated Candidate</th>
                <th>Relationship</th>
                <th>Date of Birth</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dependents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No dependent records found.
                  </td>
                </tr>
              ) : (
                dependents.map((item) => (
                  <tr key={item.dep_id}>
                    <td className="font-mono text-cyan-400 font-bold">{item.dep_id}</td>
                    <td className="font-medium text-white">{item.candidate_name}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[11px] font-semibold">
                        {item.relationship}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-400">{item.dob}</td>
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
        <Modal title="Add Dependent" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Candidate</label>
              <select
                value={formData.cand_id}
                onChange={(e) => setFormData({ ...formData, cand_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Select Candidate --</option>
                {candidates.map((c) => (
                  <option key={c.cand_id} value={c.cand_id}>
                    #{c.cand_id} - {c.fullName || `${c.fname} ${c.lname}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Child">Child</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Dependent</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Dependent #${editItem.dep_id}`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Candidate</label>
              <select
                value={formData.cand_id}
                onChange={(e) => setFormData({ ...formData, cand_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Select Candidate --</option>
                {candidates.map((c) => (
                  <option key={c.cand_id} value={c.cand_id}>
                    #{c.cand_id} - {c.fullName || `${c.fname} ${c.lname}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Relationship</label>
              <select
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Child">Child</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Dependent</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete dependent <span className="font-mono text-cyan-400 font-semibold">{deleteTarget.dep_id}</span> ({deleteTarget.relationship})?
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
