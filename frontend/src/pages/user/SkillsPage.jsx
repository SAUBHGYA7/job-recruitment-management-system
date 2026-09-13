import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);

  const [formData, setFormData] = useState({
    skill_name: '',
    skill_category: 'Programming',
    description: ''
  });

  const { addToast } = useToast();

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await api.get('/skills');
      if (res.data?.data) {
        setSkills(res.data.data);
      }
    } catch {
      addToast('Failed to load skills from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await api.post('/skills', formData);
      if (res.data.success) {
        addToast('Skill added to Skill and Skill_Details tables', 'success');
        setShowAddModal(false);
        setFormData({ skill_name: '', skill_category: 'Programming', description: '' });
        fetchSkills();
      }
    } catch {
      addToast('Failed to add skill', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Skills Catalog</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Skill (skill_id, skill_name) ⨝ Skill_Details (category, description) taxonomy.
          </p>
        </div>
        <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          Add Skill
        </Button>
      </div>

      {loading ? (
        <Loader text="Loading skill catalog from Oracle Database..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Skill ID</th>
                <th>Skill Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Job Postings Demanding</th>
                <th>Candidates Possessing</th>
              </tr>
            </thead>
            <tbody>
              {skills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-xs text-slate-500 font-mono">
                    No skill records found.
                  </td>
                </tr>
              ) : (
                skills.map((sk) => (
                  <tr key={sk.skill_id}>
                    <td className="font-mono font-bold text-blue-400">#{sk.skill_id}</td>
                    <td className="font-semibold text-white">{sk.skill_name}</td>
                    <td>
                      <Badge variant="purple">{sk.skill_category}</Badge>
                    </td>
                    <td className="text-slate-300 text-xs">{sk.description}</td>
                    <td className="font-mono text-slate-200">{sk.demandCount} jobs</td>
                    <td className="font-mono text-emerald-400">{sk.candidatesWithSkill} candidates</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Skill Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Skill to Taxonomy"
        subtitle="Inserts into Skill (PK: skill_id) and Skill_Details (PK: skill_name)"
      >
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Skill Name *</label>
            <input
              type="text"
              required
              value={formData.skill_name}
              onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Oracle PL/SQL"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Category</label>
            <select
              value={formData.skill_category}
              onChange={(e) => setFormData({ ...formData, skill_category: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Programming">Programming</option>
              <option value="Database">Database</option>
              <option value="Database Administration">Database Administration</option>
              <option value="Design">Design</option>
              <option value="Cloud / DevOps">Cloud / DevOps</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Skill scope and requirements..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Save Skill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
