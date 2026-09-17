import React, { useState, useEffect } from 'react';
import { FileText, Edit3, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { validateRequired } from '../../utils/validation';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Update-status modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('Shortlisted');
  const [newResult, setNewResult] = useState('Selected');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Add-application modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    app_status: 'In Review',
    final_result: 'Pending',
    app_date: new Date().toISOString().split('T')[0],
    offer_letter: 'Standard Application'
  });

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  /* ── Update Status ── */
  const openStatusModal = (app) => {
    setSelectedApp(app);
    setNewStatus(app.app_status || 'Shortlisted');
    setNewResult(app.final_result || 'Selected');
    setFormErrors({});
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    const errors = {};
    const statusErr = validateRequired(newStatus, 'Status');
    if (statusErr) errors.newStatus = statusErr;
    const resultErr = validateRequired(newResult, 'Final result');
    if (resultErr) errors.newResult = resultErr;
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

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

  /* ── Add Application ── */
  const handleAddApplication = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/applications', addForm);
      if (res.data.success) {
        addToast(`Application ${res.data.data?.app_id} created successfully`, 'success');
        setShowAddModal(false);
        setAddForm({ app_status: 'In Review', final_result: 'Pending', app_date: new Date().toISOString().split('T')[0], offer_letter: 'Standard Application' });
        fetchApplications();
      }
    } catch {
      addToast('Failed to create application', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Delete Application ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/applications/${deleteTarget.app_id}`);
      addToast(`Application #${deleteTarget.app_id} deleted successfully`, 'success');
      setApplications(prev => prev.filter(a => a.app_id !== deleteTarget.app_id));
      setDeleteTarget(null);
      fetchApplications();
    } catch {
      addToast('Failed to delete application', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Applications Pipeline</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Application ⨝ Application_Info ⨝ Application_Date relations.
          </p>
        </div>
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          Add Application
        </Button>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openStatusModal(a)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Update
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
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

      {/* Add Application Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Application"
        subtitle="Inserts into Application, Application_Info, and Application_Date tables"
      >
        <form onSubmit={handleAddApplication} noValidate className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Application Status</label>
              <select
                value={addForm.app_status}
                onChange={(e) => setAddForm({ ...addForm, app_status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="In Review">In Review</option>
                <option value="Shortlisted">Shortlisted</option>
                <option value="On Hold">On Hold</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Final Result</label>
              <select
                value={addForm.final_result}
                onChange={(e) => setAddForm({ ...addForm, final_result: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Selected">Selected</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Application Date</label>
            <input
              type="date"
              value={addForm.app_date}
              onChange={(e) => setAddForm({ ...addForm, app_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Offer Letter / Notes</label>
            <input
              type="text"
              value={addForm.offer_letter}
              onChange={(e) => setAddForm({ ...addForm, offer_letter: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Standard Application"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Create Application
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setFormErrors({});
        }}
        title={`Update Application #${selectedApp?.app_id}`}
        subtitle="Modifies Application and Application_Date entities"
      >
        <form onSubmit={handleUpdateStatus} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Application Status</label>
            <select
              value={newStatus}
              onChange={(e) => {
                setNewStatus(e.target.value);
                if (formErrors.newStatus) setFormErrors({ ...formErrors, newStatus: null });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Shortlisted">Shortlisted</option>
              <option value="In Review">In Review</option>
              <option value="Rejected">Rejected</option>
              <option value="On Hold">On Hold</option>
            </select>
            {formErrors.newStatus && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.newStatus}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Final Result</label>
            <select
              value={newResult}
              onChange={(e) => {
                setNewResult(e.target.value);
                if (formErrors.newResult) setFormErrors({ ...formErrors, newResult: null });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Selected">Selected</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            {formErrors.newResult && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.newResult}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => {
              setShowStatusModal(false);
              setFormErrors({});
            }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={updateLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Application"
        subtitle="This action will remove the application record from the database"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to delete Application{' '}
            <span className="text-rose-400 font-mono font-bold">#{deleteTarget?.app_id}</span>?
            This will also remove linked Application_Info records.
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
