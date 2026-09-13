import React, { useState, useEffect } from 'react';
import { Layers, Search, Filter } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function DatabaseObjectsPage() {
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchObjects() {
      try {
        setLoading(true);
        const res = await api.get('/dba/objects', { params: { type: typeFilter !== 'ALL' ? typeFilter : undefined } });
        if (res.data?.data) {
          setObjects(res.data.data);
        }
      } catch {
        addToast('Failed to load USER_OBJECTS', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchObjects();
  }, [typeFilter]);

  const filtered = objects.filter(o => o.OBJECT_NAME.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Oracle Schema Objects</h2>
            <Badge variant="success">{objects.length} Objects</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Queried from Oracle dictionary view <code className="text-emerald-400">USER_OBJECTS</code></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/90 border border-slate-800 rounded p-4 glass-card">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search object name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Object Types</option>
            <option value="TABLE">TABLE</option>
            <option value="INDEX">INDEX</option>
            <option value="SEQUENCE">SEQUENCE</option>
            <option value="TRIGGER">TRIGGER</option>
          </select>
        </div>
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Querying USER_OBJECTS..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Object Name</th>
                  <th className="py-3 px-4">Object Type</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4">Last DDL Timestamp</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {filtered.map((obj, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      {obj.OBJECT_NAME}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-400">{obj.OBJECT_TYPE}</td>
                    <td className="py-3.5 px-4 text-slate-400">{obj.CREATED}</td>
                    <td className="py-3.5 px-4 text-slate-400">{obj.LAST_DDL_TIME}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="success">{obj.STATUS}</Badge>
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
