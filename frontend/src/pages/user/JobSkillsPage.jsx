import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function JobSkillsPage() {
  const [jobSkills, setJobSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    job_key: '',
    skill_id: '',
    is_mandatory: 'Y',
    min_years: '2'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jsRes, jobRes, skillRes] = await Promise.all([
        api.get('/job-skills', { params: { search } }),
        api.get('/jobs'),
        api.get('/skills')
      ]);
      if (jsRes.data?.data) setJobSkills(jsRes.data.data);
      if (jobRes.data?.data) setJobs(jobRes.data.data);
      if (skillRes.data?.data) setSkills(skillRes.data.data);
    } catch {
      addToast('Failed to load job skill requirements', 'error');
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
      const res = await api.post('/job-skills', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Job skill requirement added', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving job skill requirement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/job-skills/${editItem.job_key}/${editItem.skill_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Requirement updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating requirement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/job-skills/${deleteTarget.job_key}/${deleteTarget.skill_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Requirement removed', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing requirement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      job_key: item.job_key,
      skill_id: item.skill_id,
      is_mandatory: item.is_mandatory || 'Y',
      min_years: String(item.min_years || '2')
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Job Skill Requirements (REQUIRES)</h1>
            <Badge variant="cyan">Relation #24</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Defines prerequisites and technical skill demands for job postings, including minimum experience and mandatory flags.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              job_key: jobs[0]?.job_key || '',
              skill_id: skills[0]?.skill_id || '',
              is_mandatory: 'Y',
              min_years: '2'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Requirement
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by job title, skill name, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Requirements: <span className="text-cyan-400 font-semibold">{jobSkills.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading job skill requirements from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Code</th>
                <th>Job Title</th>
                <th>Required Skill</th>
                <th>Category</th>
                <th>Mandatory?</th>
                <th>Minimum Experience</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobSkills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No job skill requirements defined.
                  </td>
                </tr>
              ) : (
                jobSkills.map((item, idx) => (
                  <tr key={`${item.job_key}-${item.skill_id}-${idx}`}>
                    <td className="font-mono text-cyan-400 font-bold">{item.job_id}</td>
                    <td className="font-semibold text-white">{item.job_title}</td>
                    <td>
                      <span className="font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 text-xs">
                        {item.skill_name}
                      </span>
                    </td>
                    <td className="text-slate-400 text-xs">{item.skill_category}</td>
                    <td>
                      <Badge variant={item.is_mandatory === 'Y' ? 'danger' : 'default'}>
                        {item.is_mandatory === 'Y' ? 'Mandatory' : 'Optional'}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs text-slate-300 font-semibold">
                      {item.min_years} yrs min
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
        <Modal title="Add Job Skill Requirement" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Job</label>
              <select
                value={formData.job_key}
                onChange={(e) => setFormData({ ...formData, job_key: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              >
                <option value="">-- Select Job --</option>
                {jobs.map((j) => (
                  <option key={j.job_key} value={j.job_key}>
                    #{j.job_key} - {j.job_title} ({j.job_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Required Skill</label>
              <select
                value={formData.skill_id}
                onChange={(e) => setFormData({ ...formData, skill_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              >
                <option value="">-- Select Skill --</option>
                {skills.map((s) => (
                  <option key={s.skill_id} value={s.skill_id}>
                    {s.skill_name} ({s.skill_category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mandatory Requirement?</label>
                <select
                  value={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Y">Yes (Mandatory)</option>
                  <option value="N">No (Optional / Good to have)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Years Required</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.min_years}
                  onChange={(e) => setFormData({ ...formData, min_years: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Requirement</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Requirement`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div className="text-xs text-slate-400 mb-2">
              Editing requirement <span className="text-white font-semibold">{editItem.skill_name}</span> for Job <span className="text-white font-semibold">{editItem.job_title}</span>.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mandatory Requirement?</label>
                <select
                  value={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Y">Yes (Mandatory)</option>
                  <option value="N">No (Optional / Good to have)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Minimum Years Required</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.min_years}
                  onChange={(e) => setFormData({ ...formData, min_years: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Requirement</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to remove skill requirement <span className="font-semibold text-cyan-400">{deleteTarget.skill_name}</span> from Job <span className="text-white font-semibold">{deleteTarget.job_title}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Remove Requirement</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
