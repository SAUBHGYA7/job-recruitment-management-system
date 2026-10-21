import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Trash2, Edit, Award } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function EducationPage() {
  const [educationList, setEducationList] = useState([]);
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
    degree: 'BTech',
    cgpa: '8.5',
    specialization: 'Computer Science',
    university: 'Delhi University',
    start_year: '2020',
    end_year: '2024'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eduRes, candRes] = await Promise.all([
        api.get('/education', { params: { search } }),
        api.get('/candidates')
      ]);
      if (eduRes.data?.data) setEducationList(eduRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
    } catch {
      addToast('Failed to load education records', 'error');
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
      const res = await api.post('/education', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Education record created', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving education record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/education/${editItem.edu_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Education record updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating education record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/education/${deleteTarget.edu_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Education record deleted', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error deleting education record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      cand_id: item.cand_id || '',
      degree: item.degree || 'BTech',
      cgpa: String(item.cgpa || '8.5'),
      specialization: item.specialization || '',
      university: item.university || '',
      start_year: String(item.start_year || '2020'),
      end_year: String(item.end_year || '2024')
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Education</h1>
            <Badge variant="cyan">Relation #5</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manages degrees, universities, graduation timelines, and CGPA metrics across candidate profiles.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              degree: 'BTech',
              cgpa: '8.5',
              specialization: 'Computer Science',
              university: 'Delhi University',
              start_year: '2020',
              end_year: '2024'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Education
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by degree, specialization, university, or candidate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Records: <span className="text-cyan-400 font-semibold">{educationList.length}</span>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <Loader text="Loading education profiles from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Edu Code</th>
                <th>Candidate</th>
                <th>Degree</th>
                <th>Specialization</th>
                <th>University</th>
                <th>Timeline</th>
                <th>CGPA</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {educationList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No education records found.
                  </td>
                </tr>
              ) : (
                educationList.map((item) => (
                  <tr key={item.edu_id}>
                    <td className="font-mono text-cyan-400 font-bold">{item.edu_id}</td>
                    <td className="font-medium text-white">{item.candidate_name}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 text-[11px] font-semibold">
                        {item.degree}
                      </span>
                    </td>
                    <td className="text-slate-300">{item.specialization}</td>
                    <td className="text-slate-400 text-xs">{item.university}</td>
                    <td className="font-mono text-xs text-slate-400">
                      {item.start_year} – {item.end_year}
                    </td>
                    <td>
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50 text-xs">
                        {item.cgpa ? Number(item.cgpa).toFixed(2) : 'N/A'}
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
        <Modal title="Add Education Record" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Associated Candidate</label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Degree</label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. BTech, MTech, MBA"
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">CGPA (Scale 10.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Specialization / Major</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Computer Science, AI & ML"
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">University / Institute</label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="e.g. Delhi University, Anna University"
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Year</label>
                <input
                  type="number"
                  value={formData.start_year}
                  onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">End / Graduation Year</label>
                <input
                  type="number"
                  value={formData.end_year}
                  onChange={(e) => setFormData({ ...formData, end_year: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Education</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Education #${editItem.edu_id}`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Associated Candidate</label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Degree</label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Specialization</label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">University</label>
              <input
                type="text"
                value={formData.university}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Start Year</label>
                <input
                  type="number"
                  value={formData.start_year}
                  onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year</label>
                <input
                  type="number"
                  value={formData.end_year}
                  onChange={(e) => setFormData({ ...formData, end_year: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Education</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete education record <span className="font-mono text-cyan-400 font-semibold">{deleteTarget.edu_id}</span> ({deleteTarget.degree} - {deleteTarget.specialization})?
            </p>
            <p className="text-[11px] text-slate-500">
              Foreign key constraints in Candidate table will be updated automatically.
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
