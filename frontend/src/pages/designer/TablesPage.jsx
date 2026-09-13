import React, { useState, useEffect } from 'react';
import { Table, Search, Eye, ArrowUpRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function TablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchTables() {
      try {
        setLoading(true);
        const res = await api.get('/designer/tables');
        if (res.data?.data) {
          setTables(res.data.data);
        }
      } catch {
        addToast('Failed to load USER_TABLES metadata', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, []);

  const filtered = tables.filter(t => t.tableName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Oracle Tables Catalog</h2>
            <Badge variant="purple">{tables.length} Relations</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Queried from Oracle dictionary view <code className="text-designer-400">USER_TABLES</code></p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter table names (e.g. CANDIDATE, JOB_DETAILS)..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-designer-500"
        />
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Fetching USER_TABLES from Oracle dictionary..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Table Name</th>
                  <th className="py-3 px-4">Primary Key</th>
                  <th className="py-3 px-4">Columns</th>
                  <th className="py-3 px-4">Foreign Keys</th>
                  <th className="py-3 px-4">Row Count</th>
                  <th className="py-3 px-4">Tablespace</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filtered.map((t) => (
                  <tr key={t.tableName} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                      <Table className="w-3.5 h-3.5 text-designer-400" />
                      {t.tableName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-400 font-semibold">
                      {t.primaryKey}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">{t.columnCount} cols</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-400">{t.foreignKeyCount} FKs</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={t.rowCount > 0 ? 'success' : 'default'}>{t.rowCount} rows</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{t.tablespace}</td>
                    <td className="py-3.5 px-4 text-right">
                      <NavLink
                        to={`/designer/tables/${t.tableName}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-designer-600 hover:text-white text-slate-300 transition-colors text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </NavLink>
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
