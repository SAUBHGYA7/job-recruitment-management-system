import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { validateRequired, validateDate, validateLength } from '../../utils/validation';


export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    int_date: '2026-09-20',
    int_time: '11:00',
    int_mode: 'Online',
    location: 'Google Meet (Room Alpha)',
    int_status: 'Scheduled',
    score: null,
    feedback: ''
  });

  const [errors, setErrors] = useState({});

  const { addToast } = useToast();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews', {
        params: { search, mode: modeFilter !== 'ALL' ? modeFilter : undefined }
      });
      if (res.data?.data) {
        setInterviews(res.data.data);
      }
    } catch {
      addToast('Failed to load interviews from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [search, modeFilter]);

  const validateForm = () => {
    const errs = {};
    const dateErr = validateRequired(formData.int_date, 'Interview Date') || validateDate(formData.int_date, { label: 'Interview Date' });
    if (dateErr) errs.int_date = dateErr;

    const timeErr = validateRequired(formData.int_time, 'Interview Time') || validateLength(formData.int_time, { max: 10, label: 'Time' });
    if (timeErr) errs.int_time = timeErr;

    if (formData.location) {
      const locErr = validateLength(formData.location, { max: 50, label: 'Location' });
      if (locErr) errs.location = locErr;
    }

    if (formData.feedback) {
      const fbErr = validateLength(formData.feedback, { max: 200, label: 'Instructions/Notes' });
      if (fbErr) errs.feedback = fbErr;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please correct the validation errors', 'error');
      return;
    }
    setAddLoading(true);
    try {
      const res = await api.post('/interviews', formData);
      if (res.data.success) {
        addToast('Interview round scheduled in Oracle DB', 'success');
        setShowAddModal(false);
        setFormData({
          int_date: '2026-09-20', int_time: '11:00', int_mode: 'Online',
          location: 'Google Meet (Room Alpha)', int_status: 'Scheduled',
          score: null, feedback: ''
        });
        setErrors({});
        fetchInterviews();
      }
    } catch {
      addToast('Failed to schedule interview', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/interviews/${deleteTarget.int_id}`);
      addToast(`Interview #${deleteTarget.int_id} deleted successfully`, 'success');
      setInterviews(prev => prev.filter(i => i.int_id !== deleteTarget.int_id));
      setDeleteTarget(null);
      fetchInterviews();
    } catch {
      addToast('Failed to delete interview', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interviews &amp; Evaluation Pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interview (int_date, int_time) ⨝ Interview_Details (int_mode, location, score, feedback) BCNF relations.
          </p>
        </div>
        <Button
          icon={Plus}
          variant="primary"
          size="sm"
          onClick={() => {
            setErrors({});
            setShowAddModal(true);
          }}
        >
          Schedule Interview
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate, location, or feedback..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Modes</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Interviews Table */}
      {loading ? (
        <Loader text="Loading scheduled interviews from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Interview ID</th>
                <th>Candidate</th>
                <th>Date &amp; Time</th>
                <th>Mode / Venue</th>
                <th>Status</th>
                <th>Score</th>
                <th>Evaluator Feedback</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No scheduled interviews found.
                  </td>
                </tr>
              ) : (
                interviews.map((intV) => (
                  <tr key={intV.int_id}>
                    <td className="font-mono font-bold text-blue-400">#{intV.int_id}</td>
                    <td className="font-semibold text-white">{intV.candidate_name || (intV.candidate ? intV.candidate.name : 'Candidate Pool')}</td>
                    <td className="font-mono text-slate-300">
                      {intV.int_date} at {intV.int_time}
                    </td>
                    <td className="text-slate-300">
                      {intV.int_mode} ({intV.location})
                    </td>
                    <td>
                      <Badge variant={intV.int_status === 'Completed' ? 'success' : 'warning'}>
                        {intV.int_status}
                      </Badge>
                    </td>
                    <td className="font-mono">
                      {intV.score ? (
                        <span className="text-emerald-400 font-bold">{intV.score}/100</span>
                      ) : (
                        <span className="text-slate-500 italic">Pending</span>
                      )}
                    </td>
                    <td className="text-slate-400 text-xs max-w-md truncate">{intV.feedback || 'None'}</td>
                    <td className="text-right">
                      <button
                        onClick={() => setDeleteTarget(intV)}
                        className="px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Schedule Interview Round"
        subtitle="Saves to Interview and Interview_Details tables in Oracle"
      >
        <form onSubmit={handleSchedule} noValidate className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Interview Date *</label>
              <input
                type="date"
                value={formData.int_date}
                onChange={(e) => {
                  setFormData({ ...formData, int_date: e.target.value });
                  if (errors.int_date) setErrors({ ...errors, int_date: null });
                }}
                className={`w-full bg-slate-950 border ${errors.int_date ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              />
              {errors.int_date && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.int_date}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Time *</label>
              <input
                type="text"
                value={formData.int_time}
                onChange={(e) => {
                  setFormData({ ...formData, int_time: e.target.value });
                  if (errors.int_time) setErrors({ ...errors, int_time: null });
                }}
                className={`w-full bg-slate-950 border ${errors.int_time ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="11:00"
              />
              {errors.int_time && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.int_time}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Mode</label>
              <select
                value={formData.int_mode}
                onChange={(e) => setFormData({ ...formData, int_mode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Location / Platform</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (errors.location) setErrors({ ...errors, location: null });
                }}
                className={`w-full bg-slate-950 border ${errors.location ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Bengaluru Hub or Google Meet"
              />
              {errors.location && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.location}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Instructions / Notes</label>
            <textarea
              rows={3}
              value={formData.feedback}
              onChange={(e) => {
                setFormData({ ...formData, feedback: e.target.value });
                if (errors.feedback) setErrors({ ...errors, feedback: null });
              }}
              className={`w-full bg-slate-950 border ${errors.feedback ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="Technical topics to evaluate..."
            />
            {errors.feedback && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.feedback}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Schedule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Interview"
        subtitle="This removes the interview and its details from the database"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to delete Interview{' '}
            <span className="text-rose-400 font-mono font-bold">#{deleteTarget?.int_id}</span>?{' '}
            This will also remove linked Interview_Details records.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" variant="danger" loading={deleteLoading} onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
