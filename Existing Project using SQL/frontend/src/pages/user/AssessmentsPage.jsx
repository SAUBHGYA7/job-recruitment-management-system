import React, { useState, useEffect } from 'react';
import { Target, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [candidates, setCandidates] = useState([]);
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
    cand_id: '',
    job_key: '',
    skill_id: '',
    match_pct: '85',
    assessment_score: '88',
    assessment_date: '2026-08-25'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assRes, candRes, jobRes, skillRes] = await Promise.all([
        api.get('/assessments', { params: { search } }),
        api.get('/candidates'),
        api.get('/jobs'),
        api.get('/skills')
      ]);
      if (assRes.data?.data) setAssessments(assRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
      if (jobRes.data?.data) setJobs(jobRes.data.data);
      if (skillRes.data?.data) setSkills(skillRes.data.data);
    } catch {
      addToast('Failed to load skill assessments', 'error');
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
      const res = await api.post('/assessments', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Skill assessment recorded', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error recording assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/assessments/${editItem.cand_id}/${editItem.job_key}/${editItem.skill_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Assessment updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/assessments/${deleteTarget.cand_id}/${deleteTarget.job_key}/${deleteTarget.skill_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Assessment removed', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      cand_id: item.cand_id,
      job_key: item.job_key,
      skill_id: item.skill_id,
      match_pct: String(item.match_pct || '85'),
      assessment_score: String(item.assessment_score || '80'),
      assessment_date: item.assessment_date || '2026-08-25'
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Skill Assessments (ASSESSED_FOR)</h1>
            <Badge variant="cyan">Relation #25</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates candidates against target roles and required skills, generating automated match percentages and test scores.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              job_key: jobs[0]?.job_key || '',
              skill_id: skills[0]?.skill_id || '',
              match_pct: '85',
              assessment_score: '88',
              assessment_date: '2026-08-25'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Record Assessment
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by candidate, job title, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Assessments: <span className="text-cyan-400 font-semibold">{assessments.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading skill assessments from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Target Job</th>
                <th>Assessed Skill</th>
                <th>Match %</th>
                <th>Test Score</th>
                <th>Assessment Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No skill assessments recorded.
                  </td>
                </tr>
              ) : (
                assessments.map((item, idx) => (
                  <tr key={`${item.cand_id}-${item.job_key}-${item.skill_id}-${idx}`}>
                    <td className="font-medium text-white">
                      {item.candidate_name} <span className="font-mono text-slate-500 text-xs">(#{item.cand_id})</span>
                    </td>
                    <td className="text-slate-300 font-semibold">{item.job_title}</td>
                    <td>
                      <span className="font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50 text-xs">
                        {item.skill_name}
                      </span>
                    </td>
                    <td>
                      <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                        Number(item.match_pct) >= 80
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50'
                          : Number(item.match_pct) >= 60
                          ? 'bg-amber-950/40 text-amber-300 border-amber-900/50'
                          : 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                      }`}>
                        {item.match_pct}%
                      </span>
                    </td>
                    <td className="font-mono text-slate-200 font-bold">{item.assessment_score} / 100</td>
                    <td className="font-mono text-xs text-slate-400">{item.assessment_date}</td>
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
        <Modal title="Record Skill Assessment" onClose={() => setShowAddModal(false)}>
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
                    #{j.job_key} - {j.job_title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Skill Tested</label>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Match Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.match_pct}
                  onChange={(e) => setFormData({ ...formData, match_pct: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assessment Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.assessment_score}
                  onChange={(e) => setFormData({ ...formData, assessment_score: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assessment Date</label>
              <input
                type="date"
                value={formData.assessment_date}
                onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Assessment</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Assessment`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div className="text-xs text-slate-400 mb-2">
              Assessment for Candidate <span className="text-white font-semibold">{editItem.candidate_name}</span> on <span className="text-white font-semibold">{editItem.skill_name}</span> for <span className="text-white font-semibold">{editItem.job_title}</span>.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Match Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.match_pct}
                  onChange={(e) => setFormData({ ...formData, match_pct: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assessment Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.assessment_score}
                  onChange={(e) => setFormData({ ...formData, assessment_score: e.target.value })}
                  className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Assessment Date</label>
              <input
                type="date"
                value={formData.assessment_date}
                onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Assessment</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete assessment record for Candidate <span className="text-white font-semibold">{deleteTarget.candidate_name}</span> on <span className="font-semibold text-cyan-400">{deleteTarget.skill_name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete Assessment</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
