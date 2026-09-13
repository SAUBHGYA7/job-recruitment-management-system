import React, { useState, useEffect } from 'react';
import { Columns, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function ColumnsPage() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchColumns() {
      try {
        setLoading(true);
        const res = await api.get('/designer/columns', { params: { search } });
        if (res.data?.data) {
          setColumns(res.data.data);
        }
      } catch {
        addToast('Failed to load columns', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchColumns();
  }, [search]);

  const filtered = columns.filter(c => typeFilter === 'ALL' || c.DATA_TYPE === typeFilter);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Oracle Columns Catalog</h2>
            <Badge variant="purple">{columns.length} Total Columns</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Global index from Oracle <code className="text-designer-400">USER_TAB_COLUMNS</code></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 glass-card">
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
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-designer-500"
          >
            <option value="ALL">All Types</option>
            <option value="NUMBER">NUMBER</option>
            <option value="VARCHAR2">VARCHAR2</option>
            <option value="DATE">DATE</option>
            <option value="CHAR">CHAR</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        {loading ? (
          <Loader text="Loading USER_TAB_COLUMNS..." />
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
                      <Columns className="w-3.5 h-3.5 text-designer-400" />
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
