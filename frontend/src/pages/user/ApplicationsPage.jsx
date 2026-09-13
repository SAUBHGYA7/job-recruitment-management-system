import React, { useState, useEffect } from 'react';
import { FileText, Edit3 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Shortlisted');
  const [newResult, setNewResult] = useState('Selected');
  const [updateLoading, setUpdateLoading] = useState(false);

  const { addToast } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications');
      if (res.data?.data) {
        setApplications(res.data.data);
      }
    } catch {
      addToast('Failed to load applications from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const openStatusModal = (app) => {
    setSelectedApp(app);
    setNewStatus(app.app_status);
    setNewResult(app.final_result);
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      await api.put(`/applications/${selectedApp.app_id}/status`, {
        app_status: newStatus,
        final_result: newResult
      });
      addToast(`Updated Application #${selectedApp.app_id} status`, 'success');
      setShowStatusModal(false);
      fetchApplications();
    } catch {
      addToast('Failed to update status', 'error');
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Applications Pipeline</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Application ⨝ Application_Info ⨝ Application_Date relations.
        </p>
      </div>

      {loading ? (
        <Loader text="Loading applications from Oracle Database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Candidate</th>
                <th>Applied Job</th>
                <th>Application Date</th>
                <th>Status</th>
                <th>Final Result</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No application records found.
                  </td>
                </tr>
              ) : (
                applications.map((a) => (
                  <tr key={a.app_id}>
                    <td className="font-mono font-bold text-blue-400">{a.app_id}</td>
                    <td className="font-semibold text-white">
                      {a.candidate ? a.candidate.name : 'Unknown Candidate'}
                    </td>
                    <td className="text-slate-300">{a.job ? a.job.job_title : 'General Pool'}</td>
                    <td className="font-mono text-slate-400 text-xs">{a.app_date}</td>
                    <td>
                      <Badge
                        variant={
                          a.app_status === 'Shortlisted'
                            ? 'success'
                            : a.app_status === 'Rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {a.app_status}
                      </Badge>
                    </td>
                    <td className="font-medium text-slate-200">{a.final_result}</td>
                    <td className="text-right">
                      <button
                        onClick={() => openStatusModal(a)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={`Update Application #${selectedApp?.app_id}`}
        subtitle="Modifies Application and Application_Date entities"
      >
        <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Application Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Shortlisted">Shortlisted</option>
              <option value="In Review">In Review</option>
              <option value="Rejected">Rejected</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Final Result</label>
            <select
              value={newResult}
              onChange={(e) => setNewResult(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Selected">Selected</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={updateLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
