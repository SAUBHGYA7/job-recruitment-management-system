import React, { useState, useEffect } from 'react';
import { Plus, Video, MapPin, Star } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

import { mockData } from '../../services/mockDb';

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState(mockData.interviews);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    int_date: '2026-09-20',
    int_time: '11:00',
    int_mode: 'Online',
    location: 'Bengaluru Hub',
    feedback: ''
  });

  const { addToast } = useToast();

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/interviews');
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
  }, []);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/interviews', formData);
      if (res.data.success) {
        addToast('Interview scheduled in Oracle Database', 'success');
        setShowAddModal(false);
        fetchInterviews();
      }
    } catch {
      addToast('Failed to schedule interview', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Interviews Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Interview (int_date, int_time) ⨝ Interview_Details (mode, score, feedback) relations.
          </p>
        </div>
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          Schedule Interview
        </Button>
      </div>

      {loading ? (
        <Loader text="Loading interviews from Oracle Database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Interview ID</th>
                <th>Candidate</th>
                <th>Date &amp; Time</th>
                <th>Mode / Location</th>
                <th>Status</th>
                <th>Score</th>
                <th>Feedback / Evaluation Notes</th>
              </tr>
            </thead>
            <tbody>
              {interviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No interview records found.
                  </td>
                </tr>
              ) : (
                interviews.map((intV) => (
                  <tr key={intV.int_id}>
                    <td className="font-mono font-bold text-blue-400">{intV.int_id}</td>
                    <td className="font-semibold text-white">
                      {intV.candidate ? intV.candidate.name : 'General Evaluation'}
                    </td>
                    <td className="font-mono text-slate-300 text-xs">
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
        <form onSubmit={handleSchedule} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Interview Date</label>
              <input
                type="date"
                required
                value={formData.int_date}
                onChange={(e) => setFormData({ ...formData, int_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Time</label>
              <input
                type="text"
                required
                value={formData.int_time}
                onChange={(e) => setFormData({ ...formData, int_time: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="11:00"
              />
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
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Bengaluru Hub or Google Meet"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Instructions / Notes</label>
            <textarea
              rows={3}
              value={formData.feedback}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Technical topics to evaluate..."
            />
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
    </div>
  );
}
