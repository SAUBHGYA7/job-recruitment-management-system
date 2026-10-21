import React, { useState, useEffect } from 'react';
import { GitCompare, Plus, Search, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
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
    match_date: '2026-08-25'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matchRes, candRes, jobRes] = await Promise.all([
        api.get('/matches', { params: { search } }),
        api.get('/candidates'),
        api.get('/jobs')
      ]);
      if (matchRes.data?.data) setMatches(matchRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
      if (jobRes.data?.data) setJobs(jobRes.data.data);
    } catch {
      addToast('Failed to load candidate matches', 'error');
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
      const res = await api.post('/matches', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Match generated', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error generating candidate match', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/matches/${editItem.match_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Match updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating match', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/matches/${deleteTarget.match_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Match deleted', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing match', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      cand_id: item.cand_id,
      job_key: item.job_key,
      match_date: item.match_date || '2026-08-25'
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate–Job Matches (MATCHED_TO)</h1>
            <Badge variant="cyan">Relation #26</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manages algorithmic matches pairing candidate qualification profiles with open job roles.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              job_key: jobs[0]?.job_key || '',
              match_date: '2026-08-25'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Create Match
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by match ID, candidate name, or job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Matches: <span className="text-cyan-400 font-semibold">{matches.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading candidate matches from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Match ID</th>
                <th>Candidate</th>
                <th>Matched Job Title</th>
                <th>Offered Salary (INR)</th>
                <th>Match Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No candidate matches found.
                  </td>
                </tr>
              ) : (
                matches.map((item) => (
                  <tr key={item.match_id}>
                    <td className="font-mono text-cyan-400 font-bold">{item.match_id}</td>
                    <td className="font-medium text-white">
                      {item.candidate_name} <span className="font-mono text-slate-500 text-xs">(#{item.cand_id})</span>
                    </td>
                    <td className="text-slate-300 font-semibold">{item.job_title}</td>
                    <td className="font-mono text-slate-300">
                      ₹{item.salary ? Number(item.salary).toLocaleString() : '65,000'}
                    </td>
                    <td className="font-mono text-xs text-slate-400">{item.match_date}</td>
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
        <Modal title="Create Candidate–Job Match" onClose={() => setShowAddModal(false)}>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Match Date</label>
              <input
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Generate Match</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit Match #${editItem.match_id}`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Job</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Match Date</label>
              <input
                type="date"
                value={formData.match_date}
                onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Match</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete match <span className="font-mono text-cyan-400 font-semibold">{deleteTarget.match_id}</span> ({deleteTarget.candidate_name} &rarr; {deleteTarget.job_title})?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Delete Match</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
