import React, { useState, useEffect } from 'react';
import { Sparkles, Briefcase, Code, Plus, Search, Trash2, Edit, UserCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function SubtypesPage() {
  const [activeTab, setActiveTab] = useState('fresher'); // 'fresher' | 'experienced' | 'freelancer'
  const [data, setData] = useState({ freshers: [], experienced: [], freelancers: [], candidates: [] });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cand_id: '',
    grad_year: '2024',
    internship_count: '2',
    total_exp: '3.5',
    current_company: 'Infosys',
    hourly_rate: '850',
    portfolio_url: 'https://portfolio.dev'
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subtypes');
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch {
      addToast('Failed to load candidate subtypes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentList = () => {
    let list = [];
    if (activeTab === 'fresher') list = data.freshers || [];
    else if (activeTab === 'experienced') list = data.experienced || [];
    else if (activeTab === 'freelancer') list = data.freelancers || [];

    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(item =>
      (item.candidate_name || '').toLowerCase().includes(q) ||
      String(item.cand_id).includes(q) ||
      (item.current_company || '').toLowerCase().includes(q) ||
      (item.portfolio_url || '').toLowerCase().includes(q)
    );
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post(`/subtypes/${activeTab}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Subtype record added', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving subtype profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/subtypes/${activeTab}/${editItem.cand_id}`, formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Subtype record updated', 'success');
        setShowEditModal(false);
        setEditItem(null);
        fetchData();
      }
    } catch {
      addToast('Error updating subtype profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/subtypes/${activeTab}/${deleteTarget.cand_id}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Record removed', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing subtype record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData({
      cand_id: item.cand_id,
      grad_year: String(item.grad_year || '2024'),
      internship_count: String(item.internship_count || '1'),
      total_exp: String(item.total_exp || '3'),
      current_company: item.current_company || '',
      hourly_rate: String(item.hourly_rate || '750'),
      portfolio_url: item.portfolio_url || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1d2533]">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Subtypes</h1>
            <Badge variant="cyan">Relations #8, #9, #10</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Specialized candidate profiles: Freshers (academic metrics), Experienced (corporate tenures), and Freelancers (rates & portfolios).
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: data.candidates[0]?.cand_id || '',
              grad_year: '2024',
              internship_count: '2',
              total_exp: '3.5',
              current_company: 'Infosys',
              hourly_rate: '850',
              portfolio_url: 'https://portfolio.dev'
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1d2533] pb-2">
        <button
          onClick={() => setActiveTab('fresher')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'fresher'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121822]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Freshers ({data.freshers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('experienced')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'experienced'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121822]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Experienced ({data.experienced?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('freelancer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
            activeTab === 'freelancer'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/80'
              : 'text-slate-400 hover:text-slate-200 hover:bg-[#121822]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Freelancers ({data.freelancers?.length || 0})
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab} profiles by candidate, company, or link...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <Loader text="Loading candidate subtype profiles..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              {activeTab === 'fresher' && (
                <tr>
                  <th>Cand ID</th>
                  <th>Candidate Name</th>
                  <th>Graduation Year</th>
                  <th>Internship Count</th>
                  <th className="text-right">Actions</th>
                </tr>
              )}
              {activeTab === 'experienced' && (
                <tr>
                  <th>Cand ID</th>
                  <th>Candidate Name</th>
                  <th>Total Experience (Years)</th>
                  <th>Current / Last Company</th>
                  <th className="text-right">Actions</th>
                </tr>
              )}
              {activeTab === 'freelancer' && (
                <tr>
                  <th>Cand ID</th>
                  <th>Candidate Name</th>
                  <th>Hourly Rate (INR)</th>
                  <th>Portfolio / Work URL</th>
                  <th className="text-right">Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {currentList().length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No {activeTab} profiles found.
                  </td>
                </tr>
              ) : (
                currentList().map((item) => (
                  <tr key={item.cand_id}>
                    <td className="font-mono text-cyan-400 font-bold">#{item.cand_id}</td>
                    <td className="font-medium text-white">{item.candidate_name}</td>

                    {activeTab === 'fresher' && (
                      <>
                        <td className="font-mono text-slate-300">{item.grad_year}</td>
                        <td>
                          <span className="font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-900/50 text-xs">
                            {item.internship_count} Completed
                          </span>
                        </td>
                      </>
                    )}

                    {activeTab === 'experienced' && (
                      <>
                        <td>
                          <span className="font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/50 text-xs">
                            {item.total_exp} yrs
                          </span>
                        </td>
                        <td className="text-slate-300 font-semibold">{item.current_company}</td>
                      </>
                    )}

                    {activeTab === 'freelancer' && (
                      <>
                        <td className="font-mono text-emerald-400 font-bold">₹{item.hourly_rate}/hr</td>
                        <td>
                          <a
                            href={item.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:underline text-xs font-mono"
                          >
                            {item.portfolio_url}
                          </a>
                        </td>
                      </>
                    )}

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
                          Remove
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
        <Modal title={`Add ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Profile`} onClose={() => setShowAddModal(false)}>
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
                {data.candidates.map((c) => (
                  <option key={c.cand_id} value={c.cand_id}>
                    #{c.cand_id} - {c.candidate_name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'fresher' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => setFormData({ ...formData, grad_year: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Internship Count</label>
                  <input
                    type="number"
                    value={formData.internship_count}
                    onChange={(e) => setFormData({ ...formData, internship_count: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === 'experienced' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.total_exp}
                    onChange={(e) => setFormData({ ...formData, total_exp: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Company</label>
                  <input
                    type="text"
                    value={formData.current_company}
                    onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                    placeholder="e.g. Infosys, TCS, Oracle"
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === 'freelancer' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hourly Rate (INR)</label>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    placeholder="https://mywork.dev"
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Subtype</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && editItem && (
        <Modal title={`Edit ${activeTab} Profile #${editItem.cand_id}`} onClose={() => { setShowEditModal(false); setEditItem(null); }}>
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div className="text-xs text-slate-400 mb-2">
              Editing subtype details for Candidate <span className="text-white font-semibold">{editItem.candidate_name}</span> (#{editItem.cand_id}).
            </div>

            {activeTab === 'fresher' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => setFormData({ ...formData, grad_year: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Internship Count</label>
                  <input
                    type="number"
                    value={formData.internship_count}
                    onChange={(e) => setFormData({ ...formData, internship_count: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === 'experienced' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Experience (Years)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.total_exp}
                    onChange={(e) => setFormData({ ...formData, total_exp: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Current Company</label>
                  <input
                    type="text"
                    value={formData.current_company}
                    onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            {activeTab === 'freelancer' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hourly Rate (INR)</label>
                  <input
                    type="number"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Portfolio URL</label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                    className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => { setShowEditModal(false); setEditItem(null); }}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Update Subtype</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to remove Candidate <span className="text-white font-semibold">{deleteTarget.candidate_name}</span> (#{deleteTarget.cand_id}) from the <span className="font-semibold text-cyan-400">{activeTab}</span> subtype?
            </p>
            <p className="text-[11px] text-slate-500">
              The candidate record will remain intact in the Candidate table.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Remove Subtype</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
