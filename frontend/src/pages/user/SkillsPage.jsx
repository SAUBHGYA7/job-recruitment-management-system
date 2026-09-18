import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';


import { validateRequired, validateLength } from '../../utils/validation';

export default function SkillsPage() {
  const [skills, setSkills] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSkill, setEditSkill] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

  const validateForm = () => {
    const errors = {};
    const nameErr = validateRequired(formData.skill_name, 'Skill name') ||
      validateLength(formData.skill_name, 2, 50, 'Skill name');
    if (nameErr) errors.skill_name = nameErr;

    if (formData.description) {
      const descErr = validateLength(formData.description, 0, 300, 'Description');
      if (descErr) errors.description = descErr;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setAddLoading(true);
    try {
      const res = await api.post('/skills', formData);
      if (res.data.success) {
        addToast('Skill added to Skill and Skill_Details tables', 'success');
        setShowAddModal(false);
        setFormData({ skill_name: '', skill_category: 'Programming', description: '' });
        setFormErrors({});
        fetchSkills();
      }
    } catch {
      addToast('Failed to add skill', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEdit = (sk) => {
    setEditSkill(sk);
    setFormData({
      skill_name: sk.skill_name || '',
      skill_category: sk.skill_category || 'Programming',
      description: sk.description || ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!editSkill) return;
    setEditLoading(true);
    try {
      const res = await api.put(`/skills/${editSkill.skill_id}`, formData);
      if (res.data.success) {
        addToast('Skill updated in Oracle Database', 'success');
        setShowEditModal(false);
        fetchSkills();
      }
    } catch {
      addToast('Failed to update skill', 'error');
    } finally {
      setEditLoading(false);
    }
  };


  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/skills/${deleteTarget.skill_id}`);
      addToast(`Skill ${deleteTarget.skill_name} deleted successfully`, 'success');
      setSkills(prev => prev.filter(s => s.skill_id !== deleteTarget.skill_id));
      setDeleteTarget(null);
      fetchSkills();
    } catch {
      addToast('Failed to delete skill', 'error');
    } finally {
      setDeleteLoading(false);
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
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-500 font-mono">
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
                    <td className="text-right">
                      <button
                        onClick={() => handleEdit(sk)}
                        className="px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 text-xs font-medium inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(sk)}
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

      {/* Add Skill Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormErrors({});
        }}
        title="Add Skill to Taxonomy"
        subtitle="Inserts into Skill (PK: skill_id) and Skill_Details (PK: skill_name)"
      >
        <form onSubmit={handleCreate} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Skill Name *</label>
            <input
              type="text"
              value={formData.skill_name}
              onChange={(e) => {
                setFormData({ ...formData, skill_name: e.target.value });
                if (formErrors.skill_name) setFormErrors({ ...formErrors, skill_name: null });
              }}
              className={`w-full bg-slate-950 border ${
                formErrors.skill_name ? 'border-rose-500' : 'border-slate-700'
              } rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="e.g. Oracle PL/SQL"
            />
            {formErrors.skill_name && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.skill_name}</p>
            )}
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
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: null });
              }}
              className={`w-full bg-slate-950 border ${
                formErrors.description ? 'border-rose-500' : 'border-slate-700'
              } rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="Skill scope and requirements..."
            />
            {formErrors.description && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => {
              setShowAddModal(false);
              setFormErrors({});
            }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={addLoading}>
              Save Skill
            </Button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Skill"
        subtitle="Removes the skill and taxonomy category from the database"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to delete <span className="text-white font-semibold">{deleteTarget?.skill_name}</span> (#{deleteTarget?.skill_id})?
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
      {/* Edit Skill Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFormErrors({});
        }}
        title={editSkill ? `Edit Skill #${editSkill.skill_id}` : 'Edit Skill'}
        subtitle="Updates Skill and Skill_Details tables"
      >
        <form onSubmit={handleUpdate} noValidate className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Skill Name *</label>
            <input
              type="text"
              value={formData.skill_name}
              onChange={(e) => {
                setFormData({ ...formData, skill_name: e.target.value });
                if (formErrors.skill_name) setFormErrors({ ...formErrors, skill_name: null });
              }}
              className={`w-full bg-slate-950 border ${
                formErrors.skill_name ? 'border-rose-500' : 'border-slate-700'
              } rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="e.g. Oracle PL/SQL"
            />
            {formErrors.skill_name && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.skill_name}</p>
            )}
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
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                if (formErrors.description) setFormErrors({ ...formErrors, description: null });
              }}
              className={`w-full bg-slate-950 border ${
                formErrors.description ? 'border-rose-500' : 'border-slate-700'
              } rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500`}
              placeholder="Skill scope and requirements..."
            />
            {formErrors.description && (
              <p className="text-rose-400 text-[11px] mt-1">{formErrors.description}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button size="sm" variant="outline" onClick={() => {
              setShowEditModal(false);
              setFormErrors({});
            }}>
              Cancel
            </Button>
            <Button size="sm" type="submit" variant="primary" loading={editLoading}>
              Update Skill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
