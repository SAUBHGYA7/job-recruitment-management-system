import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, MapPin, Mail, Phone, GraduationCap, Briefcase, Sparkles, Filter } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

import { mockData } from '../../services/mockDb';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState(mockData.candidates);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    fname: '',
    mname: '',
    lname: '',
    dob: '2001-05-15',
    gender: 'Male',
    house_no: '',
    city: '',
    street: '',
    email: '',
    phone: '',
    edu_id: 'ED001',
    app_id: 'APP001',
    dep_id: 'D001',
    int_id: 'INT001'
  });

  const { addToast } = useToast();

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates', {
        params: { search, gender: genderFilter !== 'ALL' ? genderFilter : undefined }
      });
      if (res.data?.data) {
        setCandidates(res.data.data);
      }
    } catch {
      addToast('Failed to load candidates from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [search, genderFilter]);

  const viewCandidate = async (id) => {
    setLoadingDetails(true);
    setShowDetailModal(true);
    try {
      const res = await api.get(`/candidates/${id}`);
      if (res.data?.data) {
        setSelectedCandidate(res.data.data);
      }
    } catch {
      addToast('Failed to load candidate profile', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/candidates', formData);
      if (res.data.success) {
        addToast('Candidate added to Oracle Database', 'success');
        setShowAddModal(false);
        setFormData({
          fname: '', mname: '', lname: '', dob: '2001-05-15', gender: 'Male',
          house_no: '', city: '', street: '', email: '', phone: '',
          edu_id: 'ED001', app_id: 'APP001', dep_id: 'D001', int_id: 'INT001'
        });
        fetchCandidates();
      }
    } catch {
      addToast('Failed to create candidate', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete candidate #${id} from the database?`)) {
      return;
    }
    try {
      await api.delete(`/candidates/${id}`);
      addToast(`Candidate #${id} deleted from database`, 'success');
      fetchCandidates();
    } catch {
      addToast('Failed to delete candidate', 'error');
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Heading & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Candidates Directory</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage candidate records decomposed into Candidate, Address, Phone, Email, Education, and Skills.
          </p>
        </div>
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          Add Candidate
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-slate-900 border border-slate-800 rounded">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, ID, or specialization..."
            className="w-full bg-slate-950 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Candidates Data Table */}
      {loading ? (
        <Loader text="Loading candidates from Oracle Database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate ID</th>
                <th>Full Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>City</th>
                <th>Education</th>
                <th>Application Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No candidate records found in database.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.cand_id}>
                    <td className="font-mono font-bold text-blue-400">#{c.cand_id}</td>
                    <td className="font-semibold text-white">{c.fullName}</td>
                    <td>{c.gender}</td>
                    <td className="font-mono text-slate-400 text-xs">{c.dob}</td>
                    <td>{c.address.city || 'N/A'}</td>
                    <td className="text-slate-300">
                      {c.education.specialization ? `${c.education.specialization} (${c.education.cgpa} CGPA)` : 'N/A'}
                    </td>
                    <td>
                      <Badge variant={c.application.app_status === 'Shortlisted' ? 'success' : 'default'}>
                        {c.application.app_status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => viewCandidate(c.cand_id)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(c.cand_id)}
                        className="px-2 py-1 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900 text-xs font-medium inline-flex items-center gap-1 transition-colors"
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

      {/* Candidate Details Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={selectedCandidate ? `Candidate #${selectedCandidate.cand_id}: ${selectedCandidate.fullName}` : 'Candidate Profile'}
        subtitle="Decomposed Candidate ⨝ Address ⨝ Phone ⨝ Email ⨝ Education ⨝ Has ⨝ Skill"
      >
        {loadingDetails || !selectedCandidate ? (
          <Loader text="Querying candidate multi-relation profile..." />
        ) : (
          <div className="space-y-4 text-xs">
            {/* Primary Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded border border-slate-800 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Gender</span>
                <span className="font-semibold text-white">{selectedCandidate.gender}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">DOB</span>
                <span className="font-semibold text-white">{selectedCandidate.dob}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Education</span>
                <span className="font-semibold text-white">
                  {selectedCandidate.education.specialization} ({selectedCandidate.education.cgpa} CGPA)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Application Status</span>
                <span className="font-semibold text-emerald-400">
                  {selectedCandidate.application.app_status} ({selectedCandidate.application.final_result})
                </span>
              </div>
            </div>

            {/* Address & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Candidate_Address
                </span>
                <p className="text-slate-300">
                  {selectedCandidate.address.house_no} {selectedCandidate.address.street}, {selectedCandidate.address.city}
                </p>
              </div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Candidate_Phone &amp; Candidate_Email
                </span>
                <p className="text-slate-300 font-mono">
                  Phone: {selectedCandidate.phones?.join(', ') || 'N/A'}
                </p>
                <p className="text-slate-300 font-mono mt-0.5">
                  Email: {selectedCandidate.emails?.join(', ') || 'N/A'}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Candidate Skills (Has ⨝ Skill)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.skills?.map((sk, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200">
                    {sk.skill_name} ({sk.pgd_level}, {sk.years_of_exp} yrs)
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setShowDetailModal(false)}>
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Candidate Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Candidate Record"
        subtitle="Inserts across Candidate, Candidate_Address, Candidate_Phone, and Candidate_Email"
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.fname}
                onChange={(e) => setFormData({ ...formData, fname: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="First"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.mname}
                onChange={(e) => setFormData({ ...formData, mname: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Middle"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lname}
                onChange={(e) => setFormData({ ...formData, lname: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Last"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">House No</label>
              <input
                type="text"
                value={formData.house_no}
                onChange={(e) => setFormData({ ...formData, house_no: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. 104"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Main St"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Bengaluru"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="cand@example.com"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Insert Candidate Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
