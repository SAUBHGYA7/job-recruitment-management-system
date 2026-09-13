import React, { useState, useEffect } from 'react';
import { HardDrive, Search } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function IndexesPage() {
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchIndexes() {
      try {
        setLoading(true);
        const res = await api.get('/dba/indexes');
        if (res.data?.data) {
          setIndexes(res.data.data);
        }
      } catch {
        addToast('Failed to load USER_INDEXES', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchIndexes();
  }, []);

  const filtered = indexes.filter(
    (idx) =>
      idx.INDEX_NAME.toLowerCase().includes(search.toLowerCase()) ||
      idx.TABLE_NAME.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Oracle Indexes &amp; Performance</h2>
          <Badge variant="success">{indexes.length} Indexes</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">Queried from Oracle dictionary view <code className="text-emerald-400">USER_INDEXES</code></p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search index or table name..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        {loading ? (
          <Loader text="Loading USER_INDEXES..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Index Name</th>
                  <th className="py-3 px-4">Target Table</th>
                  <th className="py-3 px-4">Uniqueness</th>
                  <th className="py-3 px-4">Tablespace</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {filtered.map((idx) => (
                  <tr key={idx.INDEX_NAME} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                      {idx.INDEX_NAME}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{idx.TABLE_NAME}</td>
                    <td className="py-3.5 px-4 text-brand-400 font-bold">{idx.UNIQUENESS}</td>
                    <td className="py-3.5 px-4 text-slate-400">{idx.TABLESPACE_NAME}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="success">{idx.STATUS}</Badge>
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
