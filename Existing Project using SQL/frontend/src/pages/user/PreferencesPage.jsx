import React, { useState, useEffect } from 'react';
import { Compass, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    cand_id: '',
    pincode: ''
  });

  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prefRes, candRes, locRes] = await Promise.all([
        api.get('/preferences', { params: { search } }),
        api.get('/candidates'),
        api.get('/locations')
      ]);
      if (prefRes.data?.data) setPreferences(prefRes.data.data);
      if (candRes.data?.data) setCandidates(candRes.data.data);
      if (locRes.data?.data) setLocations(locRes.data.data);
    } catch {
      addToast('Failed to load location preferences', 'error');
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
      const res = await api.post('/preferences', formData);
      if (res.data?.success) {
        addToast(res.data.message || 'Location preference added', 'success');
        setShowAddModal(false);
        fetchData();
      }
    } catch {
      addToast('Error saving location preference', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      const res = await api.delete(`/preferences/${deleteTarget.cand_id}/${deleteTarget.pincode}`);
      if (res.data?.success) {
        addToast(res.data.message || 'Preference removed', 'success');
        setDeleteTarget(null);
        fetchData();
      }
    } catch {
      addToast('Error removing location preference', 'error');
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
            <Compass className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">Candidate Preferences (PREFERS)</h1>
            <Badge variant="cyan">Relation #30</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manages preferred work locations and desired employment cities specified by candidate jobseekers.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setFormData({
              cand_id: candidates[0]?.cand_id || '',
              pincode: locations[0]?.pincode || ''
            });
            setShowAddModal(true);
          }}
          icon={Plus}
        >
          Add Preference
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by candidate name, city, state, or pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121822] border border-[#1d2533] rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Total Preferences: <span className="text-cyan-400 font-semibold">{preferences.length}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loader text="Loading candidate preferences from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Preferred Pincode</th>
                <th>Target City</th>
                <th>State</th>
                <th>Country</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {preferences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No location preferences found.
                  </td>
                </tr>
              ) : (
                preferences.map((item, idx) => (
                  <tr key={`${item.cand_id}-${item.pincode}-${idx}`}>
                    <td className="font-medium text-white">
                      {item.candidate_name} <span className="font-mono text-slate-500 text-xs">(#{item.cand_id})</span>
                    </td>
                    <td className="font-mono text-cyan-400 font-bold">{item.pincode}</td>
                    <td className="text-slate-200 font-semibold">{item.city}</td>
                    <td className="text-slate-400 text-xs">{item.state}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono">
                        {item.country}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
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
        <Modal title="Add Candidate Location Preference" onClose={() => setShowAddModal(false)}>
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
              <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Location (Pincode / City)</label>
              <select
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full bg-[#121822] border border-[#1d2533] rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                required
              >
                <option value="">-- Select Location --</option>
                {locations.map((loc) => (
                  <option key={loc.pincode} value={loc.pincode}>
                    {loc.pincode} - {loc.city}, {loc.state}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>Save Preference</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <Modal title="Confirm Removal" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Are you sure you want to remove preferred location <span className="font-semibold text-cyan-400">{deleteTarget.city} ({deleteTarget.pincode})</span> for Candidate <span className="text-white font-semibold">{deleteTarget.candidate_name}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1d2533]">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={submitting}>Remove Preference</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
