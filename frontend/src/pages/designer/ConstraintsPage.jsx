import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchConstraints() {
      try {
        setLoading(true);
        const res = await api.get('/designer/constraints', {
          params: { type: typeFilter !== 'ALL' ? typeFilter : undefined }
        });
        if (res.data?.data) {
          setConstraints(res.data.data);
        }
      } catch {
        addToast('Failed to load constraints', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchConstraints();
  }, [typeFilter]);

  const filtered = constraints.filter(
    (c) =>
      c.constraintName.toLowerCase().includes(search.toLowerCase()) ||
      c.tableName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Oracle Schema Constraints Matrix</h2>
            <Badge variant="purple">{constraints.length} Constraints</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Queried from Oracle dictionary view <code className="text-designer-400">USER_CONSTRAINTS</code></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 border border-slate-800 rounded p-4 glass-card">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by constraint name or table name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-designer-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-designer-500"
          >
            <option value="ALL">All Constraint Types</option>
            <option value="P">Primary Key (P)</option>
            <option value="R">Foreign Key (R)</option>
            <option value="C">Check Constraint (C)</option>
            <option value="U">Unique Constraint (U)</option>
          </select>
        </div>
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Loading USER_CONSTRAINTS..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Constraint Name</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Enforced Rule / Condition</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {filtered.map((c) => (
                  <tr key={c.constraintName} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-designer-400" />
                      {c.constraintName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-300">{c.tableName}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          c.typeCode === 'P'
                            ? 'success'
                            : c.typeCode === 'R'
                            ? 'purple'
                            : c.typeCode === 'C'
                            ? 'amber'
                            : 'primary'
                        }
                      >
                        {c.type}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-md truncate">
                      {c.searchCondition ? (
                        <span className="text-amber-300">{c.searchCondition}</span>
                      ) : c.rConstraintName ? (
                        <span className="text-indigo-300">→ {c.rConstraintName}</span>
                      ) : (
                        <span>Columns: {c.columns.join(', ')}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="success">{c.status}</Badge>
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
