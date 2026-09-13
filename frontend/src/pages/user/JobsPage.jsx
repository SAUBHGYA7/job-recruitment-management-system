import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    job_title: '',
    job_status: 'Open',
    salary: 65000,
    descriptive: '',
    closing_date: '2026-10-31',
    app_id: 'APP001'
  });

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/jobs', formData);
      if (res.data.success) {
        addToast('Job posting created in Oracle Database', 'success');
        setShowAddModal(false);
        setFormData({ job_title: '', job_status: 'Open', salary: 65000, descriptive: '', closing_date: '2026-10-31', app_id: 'APP001' });
        fetchJobs();
      }
    } catch {
      addToast('Failed to create job', 'error');
    } finally {
      setAddLoading(false);
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
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
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
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
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
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. S/W Dev or Data Analyst"
            />
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
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Closing Date</label>
            <input
              type="date"
              value={formData.closing_date}
              onChange={(e) => setFormData({ ...formData, closing_date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Job Description</label>
            <textarea
              rows={3}
              value={formData.descriptive}
              onChange={(e) => setFormData({ ...formData, descriptive: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Core responsibilities and requirements..."
            />
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
    </div>
  );
}
