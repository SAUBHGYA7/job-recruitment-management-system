import React, { useState, useEffect } from 'react';
import { Link2, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function ForeignKeysPage() {
  const [fks, setFks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchFks() {
      try {
        setLoading(true);
        const res = await api.get('/designer/foreign-keys');
        if (res.data?.data) {
          setFks(res.data.data);
        }
      } catch {
        addToast('Failed to load foreign keys', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchFks();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Foreign Key &amp; Referential Constraints</h2>
          <Badge variant="purple">{fks.length} Foreign Keys</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">Queried from Oracle dictionary: <code className="text-designer-400">USER_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'R'</code></p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        {loading ? (
          <Loader text="Loading foreign key mappings..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">FK Constraint</th>
                  <th className="py-3 px-4">Child Table</th>
                  <th className="py-3 px-4">Foreign Column</th>
                  <th className="py-3 px-4">Parent Referenced Table</th>
                  <th className="py-3 px-4">Delete Rule</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {fks.map((fk) => (
                  <tr key={fk.constraintName} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-indigo-400 flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                      {fk.constraintName}
                    </td>
                    <td className="py-3.5 px-4 text-white font-bold">{fk.tableName}</td>
                    <td className="py-3.5 px-4 text-brand-400">{fk.columns.join(', ')}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      {fk.referencedTable}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={fk.deleteRule === 'CASCADE' ? 'danger' : 'default'}>
                        {fk.deleteRule}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="success">{fk.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
