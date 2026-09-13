import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function PrimaryKeysPage() {
  const [pks, setPks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchPks() {
      try {
        setLoading(true);
        const res = await api.get('/designer/primary-keys');
        if (res.data?.data) {
          setPks(res.data.data);
        }
      } catch {
        addToast('Failed to load primary keys', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchPks();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Primary Key Constraints</h2>
          <Badge variant="success">{pks.length} PKs Enforced</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">Queried from Oracle dictionary: <code className="text-designer-400">USER_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'P'</code></p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        {loading ? (
          <Loader text="Loading primary key constraints..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Constraint Name</th>
                  <th className="py-3 px-4">Target Table</th>
                  <th className="py-3 px-4">Key Column(s)</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {pks.map((pk) => (
                  <tr key={pk.constraintName} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      {pk.constraintName}
                    </td>
                    <td className="py-3.5 px-4 text-white font-bold">{pk.tableName}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {pk.columns.map((c, idx) => (
                        <span key={idx} className="px-2 py-0.5 mr-1 rounded bg-slate-800 border border-slate-700 text-brand-400 font-bold">
                          {c}
                        </span>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="success">{pk.status}</Badge>
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
