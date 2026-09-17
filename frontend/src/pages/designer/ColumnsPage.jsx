import React, { useState, useEffect, useCallback } from 'react';
import { Columns, Search, Filter, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { addToast } = useToast();

  const fetchColumns = useCallback(async () => {
    let isCurrent = true;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/designer/columns', { params: { search: search || undefined } });
      if (isCurrent) {
        if (res.data?.data) {
          setColumns(res.data.data);
        } else {
          setColumns([]);
        }
      }
    } catch (err) {
      if (isCurrent) {
        const message = 'Unable to load columns catalog. Please check the database connection and try again.';
        setError(message);
        addToast('Failed to load columns', 'error');
      }
    } finally {
      if (isCurrent) {
        setLoading(false);
      }
    }
    return () => {
      isCurrent = false;
    };
  }, [search, addToast]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const filtered = columns.filter((c) => {
    if (typeFilter === 'ALL') return true;
    return (c.DATA_TYPE || '').toUpperCase() === typeFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Oracle Columns Catalog</h2>
            {!loading && !error && (
              <Badge variant="purple">{filtered.length} Total Columns</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Global index from Oracle <code className="text-designer-400">USER_TAB_COLUMNS</code>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchColumns}
        >
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 border border-slate-800 rounded p-4 glass-card">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search column name or table name..."
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
            <option value="ALL">All Types</option>
            <option value="NUMBER">NUMBER</option>
            <option value="VARCHAR2">VARCHAR2</option>
            <option value="DATE">DATE</option>
            <option value="CHAR">CHAR</option>
          </select>
        </div>
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Loading USER_TAB_COLUMNS..." />
        ) : error ? (
          <div className="py-12 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Failed to Load Columns</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{error}</p>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchColumns}>
              Try Again
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Columns Found</h3>
            <p className="text-xs text-slate-400">
              {search
                ? `No columns matching "${search}".`
                : 'No column definitions found in the schema catalog.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Column Name</th>
                  <th className="py-3 px-4">Table</th>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Precision / Length</th>
                  <th className="py-3 px-4 rounded-r-xl">Nullable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 font-mono text-[11px]">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-1.5">
                      <Columns className="w-3.5 h-3.5 text-designer-400 shrink-0" />
                      {c.COLUMN_NAME}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{c.TABLE_NAME}</td>
                    <td className="py-3 px-4 text-brand-400 font-bold">{c.DATA_TYPE}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {c.DATA_PRECISION ? `(${c.DATA_PRECISION}, ${c.DATA_SCALE || 0})` : `(${c.DATA_LENGTH})`}
                    </td>
                    <td className="py-3 px-4">
                      <span className={c.NULLABLE === 'N' ? 'text-rose-400 font-bold' : 'text-slate-500'}>
                        {c.NULLABLE === 'N' ? 'NOT NULL' : 'NULL'}
                      </span>
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
