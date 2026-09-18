import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Filter, Trash2, Eye, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { validateRequired, validateEmail, validatePhone, validateLength, validateDate } from '../../utils/validation';


export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

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

  const [errors, setErrors] = useState({});

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
      addToast('Failed to load candidates from Oracle DB', 'error');
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

  const validateForm = () => {
    const errs = {};
    const fnameErr = validateRequired(formData.fname, 'First Name') || validateLength(formData.fname, { max: 30, label: 'First Name' });
    if (fnameErr) errs.fname = fnameErr;

    const lnameErr = validateRequired(formData.lname, 'Last Name') || validateLength(formData.lname, { max: 30, label: 'Last Name' });
    if (lnameErr) errs.lname = lnameErr;

    const mnameErr = validateLength(formData.mname, { max: 30, label: 'Middle Name' });
    if (mnameErr) errs.mname = mnameErr;

    const dobErr = validateRequired(formData.dob, 'Date of Birth') || validateDate(formData.dob, { label: 'Date of Birth' });
    if (dobErr) errs.dob = dobErr;

    if (formData.house_no) {
      const hErr = validateLength(formData.house_no, { max: 20, label: 'House No' });
      if (hErr) errs.house_no = hErr;
    }

    if (formData.street) {
      const sErr = validateLength(formData.street, { max: 60, label: 'Street' });
      if (sErr) errs.street = sErr;
    }

    if (formData.city) {
      const cErr = validateLength(formData.city, { max: 40, label: 'City' });
      if (cErr) errs.city = cErr;
    }

    if (formData.email) {
      const eErr = validateEmail(formData.email) || validateLength(formData.email, { max: 100, label: 'Email' });
      if (eErr) errs.email = eErr;
    }

    if (formData.phone) {
      const pErr = validatePhone(formData.phone) || validateLength(formData.phone, { max: 15, label: 'Phone' });
      if (pErr) errs.phone = pErr;
    }

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
      const res = await api.post('/candidates', formData);
      if (res.data.success) {
        addToast('Candidate added to Oracle Database', 'success');
        setShowAddModal(false);
        setFormData({
          fname: '', mname: '', lname: '', dob: '2001-05-15', gender: 'Male',
          house_no: '', city: '', street: '', email: '', phone: '',
          edu_id: 'ED001', app_id: 'APP001', dep_id: 'D001', int_id: 'INT001'
        });
        setErrors({});
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
      setCandidates(prev => prev.filter(c => c.cand_id !== id));
      fetchCandidates();
    } catch {
      addToast('Failed to delete candidate', 'error');
    }
  };

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate);
    setFormData({
      fname: candidate.fname || '',
      mname: candidate.mname || '',
      lname: candidate.lname || '',
      dob: candidate.dob || '2001-01-01',
      gender: candidate.gender || 'Male',
      house_no: candidate.address?.house_no || '',
      city: candidate.address?.city || '',
      street: candidate.address?.street || '',
      email: candidate.emails?.[0] || '',
      phone: candidate.phones?.[0] || '',
      edu_id: candidate.edu_id || 'ED001',
      app_id: candidate.app_id || 'APP001',
      dep_id: candidate.dep_id || 'D001',
      int_id: candidate.int_id || 'INT001'
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
    if (!selectedCandidate) return;
    setEditLoading(true);
    try {
      const res = await api.put(`/candidates/${selectedCandidate.cand_id}`, formData);
      if (res.data.success) {
        addToast('Candidate updated in Oracle Database', 'success');
        setShowEditModal(false);
        fetchCandidates();
      }
    } catch {
      addToast('Failed to update candidate', 'error');
    } finally {
      setEditLoading(false);
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
        <Button
          icon={Plus}
          variant="primary"
          size="sm"
          onClick={() => {
            setErrors({});
            setShowAddModal(true);
          }}
        >
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
        <Loader text="Querying candidates across Candidate & Decomposed tables..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Candidate Name</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>City / Address</th>
                <th>Specialization (Edu)</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No candidates found in database.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => (
                  <tr key={c.cand_id}>
                    <td className="font-mono text-slate-400 font-bold">#{c.cand_id}</td>
                    <td className="font-semibold text-white">
                      <button
                        onClick={() => viewCandidate(c.cand_id)}
                        className="hover:text-blue-400 text-left transition-colors flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {c.fullName || `${c.fname || ''} ${c.lname || ''}`}
                      </button>
                    </td>
                    <td>{c.gender}</td>
                    <td className="font-mono text-slate-400 text-xs">{c.dob || 'N/A'}</td>
                    <td className="text-slate-300">
                      {c.address ? `${c.address.city || ''}, ${c.address.street || ''}` : (c.city || 'N/A')}
                    </td>
                    <td className="text-slate-300">
                      {c.education?.specialization || 'General'}
                    </td>
                    <td>
                      <Badge
                        variant={
                          c.application?.app_status === 'Shortlisted'
                            ? 'success'
                            : c.application?.app_status === 'Rejected'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {c.application?.app_status || 'Applied'}
                      </Badge>
                    </td>
                    <td className="text-right space-x-1.5">
                      <button
                        onClick={() => viewCandidate(c.cand_id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleEdit(c)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                        title="Edit Candidate"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.cand_id)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Candidate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        title={selectedCandidate ? `${selectedCandidate.fullName || `${selectedCandidate.fname} ${selectedCandidate.lname}`} (#${selectedCandidate.cand_id})` : 'Candidate Profile'}
        subtitle="360° Relational View from Oracle DB (Normalized across 6 Tables)"
        size="lg"
      >
        {loadingDetails || !selectedCandidate ? (
          <Loader text="Joining candidate tables..." />
        ) : (
          <div className="space-y-4 text-xs">
            {/* Identity & Basic Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded bg-slate-950 border border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">DOB</span>
                <span className="font-mono text-slate-200">{selectedCandidate.dob || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gender</span>
                <span className="text-slate-200">{selectedCandidate.gender}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Registration</span>
                <span className="font-mono text-slate-200">{selectedCandidate.reg_date || '2026-09-01'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Application Status</span>
                <Badge variant={selectedCandidate.application?.app_status === 'Shortlisted' ? 'success' : 'warning'}>
                  {selectedCandidate.application?.app_status || 'Pending'}
                </Badge>
              </div>
            </div>

            {/* Address & Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Candidate_Address
                </span>
                <p className="text-slate-200 font-mono">
                  {selectedCandidate.address?.house_no} {selectedCandidate.address?.street}
                </p>
                <p className="text-slate-400 text-[11px] font-mono">
                  {selectedCandidate.address?.city || 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Candidate_Phone &amp; Candidate_Email
                </span>
                <p className="text-slate-300 font-mono">
                  Phone: {selectedCandidate.phones?.join(', ') || selectedCandidate.phone || 'N/A'}
                </p>
                <p className="text-slate-300 font-mono mt-0.5">
                  Email: {selectedCandidate.emails?.join(', ') || selectedCandidate.email || 'N/A'}
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
        <form onSubmit={handleCreate} noValidate className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.fname}
                onChange={(e) => {
                  setFormData({ ...formData, fname: e.target.value });
                  if (errors.fname) setErrors({ ...errors, fname: null });
                }}
                className={`w-full bg-slate-950 border ${errors.fname ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="First"
              />
              {errors.fname && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.fname}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.mname}
                onChange={(e) => {
                  setFormData({ ...formData, mname: e.target.value });
                  if (errors.mname) setErrors({ ...errors, mname: null });
                }}
                className={`w-full bg-slate-950 border ${errors.mname ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Middle"
              />
              {errors.mname && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.mname}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lname}
                onChange={(e) => {
                  setFormData({ ...formData, lname: e.target.value });
                  if (errors.lname) setErrors({ ...errors, lname: null });
                }}
                className={`w-full bg-slate-950 border ${errors.lname ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Last"
              />
              {errors.lname && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.lname}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => {
                  setFormData({ ...formData, dob: e.target.value });
                  if (errors.dob) setErrors({ ...errors, dob: null });
                }}
                className={`w-full bg-slate-950 border ${errors.dob ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              />
              {errors.dob && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.dob}</p>
              )}
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
                onChange={(e) => {
                  setFormData({ ...formData, house_no: e.target.value });
                  if (errors.house_no) setErrors({ ...errors, house_no: null });
                }}
                className={`w-full bg-slate-950 border ${errors.house_no ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="e.g. 104"
              />
              {errors.house_no && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.house_no}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => {
                  setFormData({ ...formData, street: e.target.value });
                  if (errors.street) setErrors({ ...errors, street: null });
                }}
                className={`w-full bg-slate-950 border ${errors.street ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Main St"
              />
              {errors.street && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.street}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  if (errors.city) setErrors({ ...errors, city: null });
                }}
                className={`w-full bg-slate-950 border ${errors.city ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Bengaluru"
              />
              {errors.city && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.city}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full bg-slate-950 border ${errors.email ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="cand@example.com"
              />
              {errors.email && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                className={`w-full bg-slate-950 border ${errors.phone ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="9876543210"
              />
              {errors.phone && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>
              )}
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

      {/* Edit Candidate Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={selectedCandidate ? `Edit Candidate #${selectedCandidate.cand_id}` : 'Edit Candidate'}
        subtitle="Updates Candidate, Candidate_Address, Candidate_Phone, and Candidate_Email"
      >
        <form onSubmit={handleUpdate} noValidate className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.fname}
                onChange={(e) => {
                  setFormData({ ...formData, fname: e.target.value });
                  if (errors.fname) setErrors({ ...errors, fname: null });
                }}
                className={`w-full bg-slate-950 border ${errors.fname ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="First"
              />
              {errors.fname && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.fname}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Middle Name</label>
              <input
                type="text"
                value={formData.mname}
                onChange={(e) => {
                  setFormData({ ...formData, mname: e.target.value });
                  if (errors.mname) setErrors({ ...errors, mname: null });
                }}
                className={`w-full bg-slate-950 border ${errors.mname ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Middle"
              />
              {errors.mname && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.mname}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Last Name *</label>
              <input
                type="text"
                value={formData.lname}
                onChange={(e) => {
                  setFormData({ ...formData, lname: e.target.value });
                  if (errors.lname) setErrors({ ...errors, lname: null });
                }}
                className={`w-full bg-slate-950 border ${errors.lname ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Last"
              />
              {errors.lname && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.lname}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Date of Birth *</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => {
                  setFormData({ ...formData, dob: e.target.value });
                  if (errors.dob) setErrors({ ...errors, dob: null });
                }}
                className={`w-full bg-slate-950 border ${errors.dob ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              />
              {errors.dob && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.dob}</p>
              )}
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
                onChange={(e) => {
                  setFormData({ ...formData, house_no: e.target.value });
                  if (errors.house_no) setErrors({ ...errors, house_no: null });
                }}
                className={`w-full bg-slate-950 border ${errors.house_no ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="e.g. 104"
              />
              {errors.house_no && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.house_no}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Street</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => {
                  setFormData({ ...formData, street: e.target.value });
                  if (errors.street) setErrors({ ...errors, street: null });
                }}
                className={`w-full bg-slate-950 border ${errors.street ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Main St"
              />
              {errors.street && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.street}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => {
                  setFormData({ ...formData, city: e.target.value });
                  if (errors.city) setErrors({ ...errors, city: null });
                }}
                className={`w-full bg-slate-950 border ${errors.city ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Bengaluru"
              />
              {errors.city && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.city}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full bg-slate-950 border ${errors.email ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="cand@example.com"
              />
              {errors.email && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: null });
                }}
                className={`w-full bg-slate-950 border ${errors.phone ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="9876543210"
              />
              {errors.phone && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={editLoading}>
              Update Candidate Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
