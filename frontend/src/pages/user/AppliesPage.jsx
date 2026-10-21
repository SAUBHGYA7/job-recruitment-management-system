import React, { useState, useEffect } from 'react';
import { Send, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function AppliesPage() {
  const [appliesList, setAppliesList] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cand_id: '',
    job_key: ''
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, candRes, jobRes] = await Promise.all([
        api.get('/applies', { params: { search } }),
        api.get('/candidates'),
        api.get('/jobs')
      ]);
      if (appRes.data?.data) setAppliesList(appRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
      if (jobRes.data?.data) setJobs(jobRes.data.data);
    } catch {
      addToast('Failed to load job application relationships', 'error');
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
      const res = await api.post('/applies', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Application relationship added', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving application relationship', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/applies/${deleteTarget.cand_id}/${deleteTarget.job_key}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Application link removed', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing application link', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Job Submissions (APPLIES)</h1>
            <Badge variant="cyan">Relation #27</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Composite relationship tracking candidate applications across job opportunities.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              job_key: jobs[0]?.job_key || ''
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Submit Application Link
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by candidate name, job title, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Relationships: <span className="text-cyan-400 font-semibold">{appliesList.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading application relationships from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Candidate Name</th>
                <th>Target Job Code</th>
                <th>Job Title</th>
                <th>Salary (INR)</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appliesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No application links found.
                  </td>
                </tr>
              ) : (
                appliesList.map((item, idx) => (
                  <tr key={`${item.cand_id}-${item.job_key}-${idx}`}>
                    <td className="font-mono text-cyan-400 font-bold">#{item.cand_id}</td>
                    <td className="font-medium text-white">{item.candidate_name}</td>
                    <td className="font-mono text-slate-300 font-semibold">#{item.job_key}</td>
                    <td className="text-slate-200 font-semibold">{item.job_title}</td>
                    <td className="font-mono text-slate-300">₹{item.salary ? Number(item.salary).toLocaleString() : '65,000'}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Link
                      </button>
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
        <Modal title="Create Application Link (APPLIES)" onClose={() => setShowAddModal(false)}>
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

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Record Submission</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Link Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to remove the application link between Candidate <span className="text-white font-semibold">{deleteTarget.candidate_name}</span> and Job <span className="font-semibold text-cyan-400">{deleteTarget.job_title}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Remove Link</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
