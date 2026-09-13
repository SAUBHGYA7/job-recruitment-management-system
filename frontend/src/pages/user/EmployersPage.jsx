import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function EmployersPage() {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    founded_year: 2018,
    company_mail: '',
    website: '',
    headquarter: 'Bengaluru',
    phone_no: ''
  });

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/employers', formData);
      if (res.data.success) {
        addToast('Employer added to Oracle Database', 'success');
        setShowAddModal(false);
        fetchEmployers();
      }
    } catch {
      addToast('Failed to add employer', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employers &amp; Partner Companies</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Employer (company_name, founded_year) ⨝ Employer_Details ⨝ Recruitment_License relations.
          </p>
        </div>
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          Add Employer
        </Button>
      </div>

      {loading ? (
        <Loader text="Loading employers from Oracle Database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employer ID</th>
                <th>Company Name</th>
                <th>Founded</th>
                <th>Headquarters</th>
                <th>Contact Email</th>
                <th>Phone</th>
                <th>License No</th>
                <th>Agency</th>
              </tr>
            </thead>
            <tbody>
              {employers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No employer records found.
                  </td>
                </tr>
              ) : (
                employers.map((emp) => (
                  <tr key={emp.emp_id}>
                    <td className="font-mono font-bold text-blue-400">{emp.emp_id}</td>
                    <td className="font-semibold text-white">{emp.company_name}</td>
                    <td className="font-mono text-slate-400">{emp.founded_year}</td>
                    <td>{emp.headquarter}</td>
                    <td className="font-mono text-slate-300 text-xs">{emp.company_mail}</td>
                    <td className="font-mono text-slate-400 text-xs">{emp.phones?.join(', ') || 'N/A'}</td>
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
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Apex Global Tech"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Founded Year</label>
              <input
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Headquarters</label>
              <input
                type="text"
                value={formData.headquarter}
                onChange={(e) => setFormData({ ...formData, headquarter: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Bengaluru"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Corporate Email</label>
              <input
                type="email"
                value={formData.company_mail}
                onChange={(e) => setFormData({ ...formData, company_mail: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="hr@company.com"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.phone_no}
                onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Website URL</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="https://company.example.com"
            />
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
