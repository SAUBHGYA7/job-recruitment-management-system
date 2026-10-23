import React, { useState, useEffect } from 'react';
import { UserPlus, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function FollowsPage() {
  const [follows, setFollows] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cand_id: '',
    emp_id: '',
    follow_date: '2026-08-20'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [folRes, candRes, empRes] = await Promise.all([
        api.get('/follows', { params: { search } }),
        api.get('/candidates'),
        api.get('/employers')
      ]);
      if (folRes.data?.data) setFollows(folRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
      if (empRes.data?.data) setEmployers(empRes.data.data);
    } catch {
      addToast('Failed to load candidate follows', 'error');
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
      const res = await api.post('/follows', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Follow relationship added', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error adding follow relationship', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/follows/${deleteTarget.cand_id}/${deleteTarget.emp_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Unfollowed employer', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing follow relation', 'error');
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
            <UserPlus className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Follows (FOLLOWS)</h1>
            <Badge variant="cyan">Relation #28</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tracks candidate engagement subscriptions and company following relationships across enterprise employers.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              emp_id: employers[0]?.emp_id || '',
              follow_date: '2026-08-20'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Follower
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by candidate name, employer, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Follows: <span className="text-cyan-400 font-semibold">{follows.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading follow relationships from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Candidate Name</th>
                <th>Followed Employer Code</th>
                <th>Company Name</th>
                <th>Follow Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {follows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No follow relationships found.
                  </td>
                </tr>
              ) : (
                follows.map((item, idx) => (
                  <tr key={`${item.cand_id}-${item.emp_id}-${idx}`}>
                    <td className="font-mono text-cyan-400 font-bold">#{item.cand_id}</td>
                    <td className="font-medium text-white">{item.candidate_name}</td>
                    <td className="font-mono text-slate-300 font-semibold">{item.emp_id}</td>
                    <td className="text-slate-200 font-semibold">{item.company_name}</td>
                    <td className="font-mono text-xs text-slate-400">{item.follow_date}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Unfollow
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
        <Modal title="Add Follow Relationship (FOLLOWS)" onClose={() => setShowAddModal(false)}>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Employer</label>
              <select
                value={formData.emp_id}
                onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              >
                <option value="">-- Select Employer --</option>
                {employers.map((emp) => (
                  <option key={emp.emp_id} value={emp.emp_id}>
                    {emp.emp_id} - {emp.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Follow Date</label>
              <input
                type="date"
                value={formData.follow_date}
                onChange={(e) => setFormData({ ...formData, follow_date: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Follow</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Unfollow" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure Candidate <span className="text-white font-semibold">{deleteTarget.candidate_name}</span> should unfollow Employer <span className="font-semibold text-cyan-400">{deleteTarget.company_name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Unfollow</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
