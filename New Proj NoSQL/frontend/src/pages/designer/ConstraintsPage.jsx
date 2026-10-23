import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Search, Filter, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  const fetchConstraints = useCallback(async () => {
    let isCurrent = true;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/designer/constraints', {
        params: { type: typeFilter !== 'ALL' ? typeFilter : undefined }
      });
      if (isCurrent) {
        if (res.data?.data) {
          setConstraints(res.data.data);
        } else {
          setConstraints([]);
        }
      }
    } catch (err) {
      if (isCurrent) {
        const message = 'Unable to load database constraints. Please check the database connection and try again.';
        setError(message);
        addToast('Failed to load constraints', 'error');
      }
    } finally {
      if (isCurrent) {
        setLoading(false);
      }
    }
    return () => {
      isCurrent = false;
    };
  }, [typeFilter, addToast]);

  useEffect(() => {
    fetchConstraints();
  }, [fetchConstraints]);

  const searchLower = search.trim().toLowerCase();
  const filtered = constraints.filter((c) => {
    const nameMatch = (c.constraintName || '').toLowerCase().includes(searchLower);
    const tableMatch = (c.tableName || '').toLowerCase().includes(searchLower);
    const typeMatch = (c.type || '').toLowerCase().includes(searchLower);
    const condMatch = (c.searchCondition || '').toLowerCase().includes(searchLower);
    const cols = Array.isArray(c.columns) ? c.columns.join(' ').toLowerCase() : String(c.columns || '').toLowerCase();
    const colsMatch = cols.includes(searchLower);
    return nameMatch || tableMatch || typeMatch || condMatch || colsMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Oracle Schema Constraints Matrix</h2>
            {!loading && !error && (
              <Badge variant="purple">{filtered.length} Constraints</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Queried from Oracle dictionary view <code className="text-designer-400">USER_CONSTRAINTS</code>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchConstraints}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 border border-slate-800 rounded p-4 glass-card">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by constraint name, table name, column, or rule..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-designer-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-designer-500 cursor-pointer"
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
        ) : error ? (
          <div className="py-12 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Failed to Load Constraints</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{error}</p>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchConstraints}>
              Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Constraints Found</h3>
            <p className="text-xs text-slate-400">
              {search
                ? `No constraints matching "${search}" for the selected filter.`
                : 'No constraints found in this category.'}
            </p>
          </div>
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
                {filtered.map((c) => {
                  const cols = Array.isArray(c.columns)
                    ? c.columns.filter(Boolean)
                    : typeof c.columns === 'string'
                    ? c.columns.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <tr key={c.constraintName} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-designer-400 shrink-0" />
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
                          {c.type || c.typeCode}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-md truncate">
                        {c.searchCondition ? (
                          <span className="text-amber-300">{c.searchCondition}</span>
                        ) : c.rConstraintName ? (
                          <span className="text-indigo-300">→ {c.rConstraintName}</span>
                        ) : cols.length > 0 ? (
                          <span>Columns: {cols.join(', ')}</span>
                        ) : (
                          <span className="text-slate-500 italic">No columns mapped</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant="success">{c.status || 'ENABLED'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
