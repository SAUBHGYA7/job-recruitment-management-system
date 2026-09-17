import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { validateRequired, validateNumber, validateEmail, validatePhone, validateLength } from '../../utils/validation';

import { mockData } from '../../services/mockDb';

export default function EmployersPage() {
  const [employers, setEmployers] = useState(mockData.employers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    founded_year: 2012,
    headquarter: '',
    company_mail: '',
    website: '',
    phone_no: '',
    comp_type: 'Private Tech Corp',
    emp_count: 500,
    agency_no: ''
  });

  const [errors, setErrors] = useState({});

  const { addToast } = useToast();

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employers');
      if (res.data?.data) {
        setEmployers(res.data.data);
      }
    } catch {
      addToast('Failed to load employers from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployers();
  }, []);

  const validateForm = () => {
    const errs = {};
    const nameErr = validateRequired(formData.company_name, 'Company Name') || validateLength(formData.company_name, { max: 60, label: 'Company Name' });
    if (nameErr) errs.company_name = nameErr;

    if (formData.founded_year) {
      const yearErr = validateNumber(formData.founded_year, { min: 1800, max: 2099, integerOnly: true, label: 'Founded Year' });
      if (yearErr) errs.founded_year = yearErr;
    }

    if (formData.headquarter) {
      const hqErr = validateLength(formData.headquarter, { max: 60, label: 'Headquarters' });
      if (hqErr) errs.headquarter = hqErr;
    }

    if (formData.company_mail) {
      const mailErr = validateEmail(formData.company_mail, { label: 'Company Email' }) || validateLength(formData.company_mail, { max: 100, label: 'Company Email' });
      if (mailErr) errs.company_mail = mailErr;
    }

    if (formData.phone_no) {
      const phoneErr = validatePhone(formData.phone_no, { label: 'Phone Number' }) || validateLength(formData.phone_no, { max: 15, label: 'Phone Number' });
      if (phoneErr) errs.phone_no = phoneErr;
    }

    if (formData.website) {
      const webErr = validateLength(formData.website, { max: 100, label: 'Website' });
      if (webErr) errs.website = webErr;
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
      const res = await api.post('/employers', formData);
      if (res.data.success) {
        addToast('Employer created across 3 normalized tables', 'success');
        setShowAddModal(false);
        setFormData({
          company_name: '', founded_year: 2012, headquarter: '',
          company_mail: '', website: '', phone_no: '',
          comp_type: 'Private Tech Corp', emp_count: 500, agency_no: ''
        });
        setErrors({});
        fetchEmployers();
      }
    } catch {
      addToast('Failed to create employer', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = employers.filter(
    (e) =>
      e.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.headquarter || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employers &amp; Companies</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Normalized across Employer, Employer_Details, Employer_Phone, Company, and Recruitment.
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
          Add Employer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name or HQ..."
          className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Employers Table */}
      {loading ? (
        <Loader text="Loading employers from database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employer ID</th>
                <th>Company Name</th>
                <th>Founded</th>
                <th>HQ Location</th>
                <th>Email</th>
                <th>Phone</th>
                <th>License</th>
                <th>Agency</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No employers found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.emp_id}>
                    <td className="font-mono font-bold text-blue-400">{emp.emp_id}</td>
                    <td className="font-semibold text-white">{emp.company_name}</td>
                    <td className="font-mono text-slate-400">{emp.founded_year}</td>
                    <td>{emp.headquarter}</td>
                    <td className="font-mono text-slate-300 text-xs">{emp.company_mail}</td>
                    <td className="font-mono text-slate-400 text-xs">{emp.phones?.join(', ') || emp.phone_no || 'N/A'}</td>
                    <td className="font-mono text-emerald-400 text-xs">{emp.license_no || 'N/A'}</td>
                    <td className="text-slate-400 text-xs">{emp.agency_name || 'Direct'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employer Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Employer"
        subtitle="Saves to Employer, Employer_Details, and Employer_Phone tables"
      >
        <form onSubmit={handleCreate} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => {
                setFormData({ ...formData, company_name: e.target.value });
                if (errors.company_name) setErrors({ ...errors, company_name: null });
              }}
              className={`w-full bg-slate-950 border ${errors.company_name ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="e.g. Apex Global Tech"
            />
            {errors.company_name && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.company_name}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Founded Year</label>
              <input
                type="number"
                value={formData.founded_year}
                onChange={(e) => {
                  setFormData({ ...formData, founded_year: e.target.value });
                  if (errors.founded_year) setErrors({ ...errors, founded_year: null });
                }}
                className={`w-full bg-slate-950 border ${errors.founded_year ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              />
              {errors.founded_year && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.founded_year}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Headquarters</label>
              <input
                type="text"
                value={formData.headquarter}
                onChange={(e) => {
                  setFormData({ ...formData, headquarter: e.target.value });
                  if (errors.headquarter) setErrors({ ...errors, headquarter: null });
                }}
                className={`w-full bg-slate-950 border ${errors.headquarter ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="Bengaluru"
              />
              {errors.headquarter && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.headquarter}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Company Email</label>
              <input
                type="email"
                value={formData.company_mail}
                onChange={(e) => {
                  setFormData({ ...formData, company_mail: e.target.value });
                  if (errors.company_mail) setErrors({ ...errors, company_mail: null });
                }}
                className={`w-full bg-slate-950 border ${errors.company_mail ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="contact@company.com"
              />
              {errors.company_mail && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.company_mail}</p>
              )}
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Phone</label>
              <input
                type="text"
                value={formData.phone_no}
                onChange={(e) => {
                  setFormData({ ...formData, phone_no: e.target.value });
                  if (errors.phone_no) setErrors({ ...errors, phone_no: null });
                }}
                className={`w-full bg-slate-950 border ${errors.phone_no ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
                placeholder="080-22345678"
              />
              {errors.phone_no && (
                <p className="text-rose-400 text-[11px] mt-1">{errors.phone_no}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Website</label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => {
                setFormData({ ...formData, website: e.target.value });
                if (errors.website) setErrors({ ...errors, website: null });
              }}
              className={`w-full bg-slate-950 border ${errors.website ? 'border-rose-500' : 'border-slate-700'} rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="https://company.com"
            />
            {errors.website && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.website}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Save Employer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
