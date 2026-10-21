import React, { useState, useEffect } from 'react';
import { Award, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function CandidateSkillsPage() {
  const [candidateSkills, setCandidateSkills] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cand_id: '',
    skill_id: '',
    pgd_level: 'Advanced',
    years_of_exp: '3'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [csRes, candRes, skillRes] = await Promise.all([
        api.get('/candidate-skills', { params: { search } }),
        api.get('/candidates'),
        api.get('/skills')
      ]);
      if (csRes.data?.data) setCandidateSkills(csRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
      if (skillRes.data?.data) setSkills(skillRes.data.data);
    } catch {
      addToast('Failed to load candidate skills', 'error');
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
      const res = await api.post('/candidate-skills', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Candidate skill mapped', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error mapping candidate skill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/candidate-skills/${editItem.cand_id}/${editItem.skill_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Candidate skill updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating candidate skill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/candidate-skills/${deleteTarget.cand_id}/${deleteTarget.skill_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Candidate skill removed', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing candidate skill', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      cand_id: item.cand_id,
      skill_id: item.skill_id,
      pgd_level: item.pgd_level || 'Intermediate',
      years_of_exp: String(item.years_of_exp || '2')
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Skills (HAS)</h1>
            <Badge variant="cyan">Relations #23 & #31</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manages technical competencies possessed by candidates, proficiency ratings, and verified experience durations.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              skill_id: skills[0]?.skill_id || '',
              pgd_level: 'Advanced',
              years_of_exp: '3'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Assign Skill
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by candidate name, skill, or proficiency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Mappings: <span className="text-cyan-400 font-semibold">{candidateSkills.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading candidate skills from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Skill</th>
                <th>Category</th>
                <th>Proficiency Level</th>
                <th>Experience (Years)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidateSkills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No candidate skills mapped.
                  </td>
                </tr>
              ) : (
                candidateSkills.map((item, idx) => (
                  <tr key={`${item.cand_id}-${item.skill_id}-${idx}`}>
                    <td className="font-medium text-white">
                      {item.candidate_name} <span className="font-mono text-slate-500 text-xs">(#{item.cand_id})</span>
                    </td>
                    <td>
                      <span className="font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 text-xs">
                        {item.skill_name}
                      </span>
                    </td>
                    <td className="text-slate-400 text-xs">{item.skill_category}</td>
                    <td>
                      <Badge variant={item.pgd_level === 'Expert' ? 'success' : item.pgd_level === 'Advanced' ? 'cyan' : 'default'}>
                        {item.pgd_level}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs text-slate-300 font-semibold">
                      {item.years_of_exp} yrs
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
        <Modal title="Assign Skill to Candidate" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Candidate</label>
              <select
                value={formData.cand_id}
                onChange={(e) => setFormData({ ...formData, cand_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Skill</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Proficiency Level</label>
                <select
                  value={formData.pgd_level}
                  onChange={(e) => setFormData({ ...formData, pgd_level: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Years of Experience</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.years_of_exp}
                  onChange={(e) => setFormData({ ...formData, years_of_exp: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Assign Skill</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Skill Assignment`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div className="text-xs text-slate-400 mb-2">
              Editing <span className="text-white font-semibold">{editItem.skill_name}</span> for Candidate <span className="text-white font-semibold">{editItem.candidate_name}</span>.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proficiency Level</label>
                <select
                  value={formData.pgd_level}
                  onChange={(e) => setFormData({ ...formData, pgd_level: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Years of Experience</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.years_of_exp}
                  onChange={(e) => setFormData({ ...formData, years_of_exp: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Skill</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to remove skill <span className="font-semibold text-cyan-400">{deleteTarget.skill_name}</span> from Candidate <span className="text-white font-semibold">{deleteTarget.candidate_name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Remove Skill</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
