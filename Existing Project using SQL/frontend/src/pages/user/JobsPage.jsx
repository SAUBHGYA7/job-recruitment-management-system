import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Filter, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { validateRequired, validateNumber, validateLength, validateDate } from '../../utils/validation';


export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [formData, setFormData] = useState({
    job_title: '',
    job_status: 'Open',
    salary: 65000,
    descriptive: '',
    closing_date: '2026-10-31',
    app_id: 'APP001'
  });

  const [errors, setErrors] = useState({});

  const { addToast } = useToast();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs', {
        params: { title: search, status: statusFilter !== 'ALL' ? statusFilter : undefined }
      });
      if (res.data?.data) {
        setJobs(res.data.data);
      }
    } catch {
      addToast('Failed to load jobs from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter]);

  const validateForm = () => {
    const errs = {};
    const titleErr = validateRequired(formData.job_title, 'Job Title') || validateLength(formData.job_title, { max: 60, label: 'Job Title' });
    if (titleErr) errs.job_title = titleErr;

    const salaryErr = validateNumber(formData.salary, { min: 0, max: 99999999, label: 'Salary' });
    if (salaryErr) errs.salary = salaryErr;

    const dateErr = validateDate(formData.closing_date, { label: 'Closing Date' });
    if (dateErr) errs.closing_date = dateErr;

    const descErr = validateLength(formData.descriptive, { max: 200, label: 'Job Description' });
    if (descErr) errs.descriptive = descErr;

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please correct the validation errors', 'error');
      return;
    }
    setAddLoading(true);
    try {
      const res = await api.post('/jobs', formData);
      if (res.data.success) {
        addToast('Job posting created in Oracle Database', 'success');
        setShowAddModal(false);
        setFormData({ job_title: '', job_status: 'Open', salary: 65000, descriptive: '', closing_date: '2026-10-31', app_id: 'APP001' });
        setErrors({});
        fetchJobs();
      }
    } catch {
      addToast('Failed to create job', 'error');
    } finally {
      setAddLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/jobs/${deleteTarget.job_key}`);
      addToast(`Job posting #${deleteTarget.job_id || deleteTarget.job_key} deleted successfully`, 'success');
      setJobs(prev => prev.filter(j => j.job_key !== deleteTarget.job_key && j.job_id !== deleteTarget.job_id));
      setDeleteTarget(null);
      fetchJobs();
    } catch {
      addToast('Failed to delete job posting', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (job) => {
    setEditJob(job);
    setFormData({
      job_title: job.job_title || '',
      job_status: job.job_status || 'Open',
      salary: job.salary || 65000,
      descriptive: job.descriptive || '',
      closing_date: job.closing_date || '2026-10-31',
      app_id: job.app_id || 'APP001'
    });
    setErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('Please correct the validation errors', 'error');
      return;
    }
    if (!editJob) return;
    setEditLoading(true);
    try {
      const res = await api.put(`/jobs/${editJob.job_key}`, formData);
      if (res.data.success) {
        addToast('Job updated in Oracle Database', 'success');
        setShowEditModal(false);
        fetchJobs();
      }
    } catch {
      addToast('Failed to update job', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Heading & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Job Postings</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Decomposed Job (job_status, salary) ⨝ Job_Details (job_title, descriptive) ⨝ Job_Posting (closing_date).
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
          Create Job Posting
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title or code..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Jobs Data Table */}
      {loading ? (
        <Loader text="Loading jobs from Oracle Database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Key</th>
                <th>Job Code</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Salary (INR)</th>
                <th>Closing Date</th>
                <th>Required Skills</th>
                <th>Applicants</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No job postings found in database.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.job_key}>
                    <td className="font-mono text-slate-400">#{j.job_key}</td>
                    <td className="font-mono font-bold text-blue-400">{j.job_id}</td>
                    <td className="font-semibold text-white">{j.job_title}</td>
                    <td>
                      <Badge variant={j.job_status === 'Open' ? 'success' : 'default'}>
                        {j.job_status}
                      </Badge>
                    </td>
                    <td className="font-mono text-slate-200">₹{Number(j.salary).toLocaleString()}</td>
                    <td className="font-mono text-slate-400 text-xs">{j.closing_date || 'N/A'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {j.required_skills?.map((sk, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-800 text-[11px] font-mono text-slate-300">
                            {sk.skill_name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="font-mono font-semibold text-slate-300">{j.applicant_count}</td>
                    <td className="text-right">
                      <button
                        onClick={() => handleEdit(j)}
                        className="px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(j)}
                        className="px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 text-xs font-medium inline-flex items-center gap-1 transition-colors ml-1"
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

      {/* Add Job Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Job Posting"
        subtitle="Inserts into Job, Job_Details, and Job_Posting tables"
      >
        <form onSubmit={handleCreate} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Job Title *</label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => {
                setFormData({ ...formData, job_title: e.target.value });
                if (errors.job_title) setErrors({ ...errors, job_title: null });
              }}
              className={`w-full bg-slate-950 border ${errors.job_title ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="e.g. S/W Dev or Data Analyst"
            />
            {errors.job_title && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.job_title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formData.job_status}
                onChange={(e) => setFormData({ ...formData, job_status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Salary (INR)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => {
                  setFormData({ ...formData, salary: e.target.value });
                  if (errors.salary) setErrors({ ...errors, salary: null });
                }}
                className={`w-full bg-slate-950 border ${errors.salary ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              />
              {errors.salary && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.salary}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Closing Date</label>
            <input
              type="date"
              value={formData.closing_date}
              onChange={(e) => {
                setFormData({ ...formData, closing_date: e.target.value });
                if (errors.closing_date) setErrors({ ...errors, closing_date: null });
              }}
              className={`w-full bg-slate-950 border ${errors.closing_date ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
            />
            {errors.closing_date && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.closing_date}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Job Description</label>
            <textarea
              rows={3}
              value={formData.descriptive}
              onChange={(e) => {
                setFormData({ ...formData, descriptive: e.target.value });
                if (errors.descriptive) setErrors({ ...errors, descriptive: null });
              }}
              className={`w-full bg-slate-950 border ${errors.descriptive ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="Core responsibilities and requirements..."
            />
            {errors.descriptive && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.descriptive}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Save Job Record
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Job Posting"
        subtitle="This removes the job posting and its requirements from Oracle DB"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to delete <span className="text-white font-semibold">{deleteTarget?.job_title}</span> ({deleteTarget?.job_id || '#' + deleteTarget?.job_key})?
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
      {/* Edit Job Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editJob ? `Edit Job #${editJob.job_id || editJob.job_key}` : 'Edit Job Posting'}
        subtitle="Updates Job, Job_Details, and Job_Posting tables"
      >
        <form onSubmit={handleUpdate} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Job Title *</label>
            <input
              type="text"
              value={formData.job_title}
              onChange={(e) => {
                setFormData({ ...formData, job_title: e.target.value });
                if (errors.job_title) setErrors({ ...errors, job_title: null });
              }}
              className={`w-full bg-slate-950 border ${errors.job_title ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="e.g. S/W Dev or Data Analyst"
            />
            {errors.job_title && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.job_title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formData.job_status}
                onChange={(e) => setFormData({ ...formData, job_status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Salary (INR)</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => {
                  setFormData({ ...formData, salary: e.target.value });
                  if (errors.salary) setErrors({ ...errors, salary: null });
                }}
                className={`w-full bg-slate-950 border ${errors.salary ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              />
              {errors.salary && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.salary}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Closing Date</label>
            <input
              type="date"
              value={formData.closing_date}
              onChange={(e) => {
                setFormData({ ...formData, closing_date: e.target.value });
                if (errors.closing_date) setErrors({ ...errors, closing_date: null });
              }}
              className={`w-full bg-slate-950 border ${errors.closing_date ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
            />
            {errors.closing_date && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.closing_date}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Job Description</label>
            <textarea
              rows={3}
              value={formData.descriptive}
              onChange={(e) => {
                setFormData({ ...formData, descriptive: e.target.value });
                if (errors.descriptive) setErrors({ ...errors, descriptive: null });
              }}
              className={`w-full bg-slate-950 border ${errors.descriptive ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="Core responsibilities and requirements..."
            />
            {errors.descriptive && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.descriptive}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={editLoading}>
              Update Job Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
