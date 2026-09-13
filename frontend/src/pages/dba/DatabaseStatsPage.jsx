import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, BarChart2, HardDrive } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import Button from '../../components/common/Button';

export default function DatabaseStatsPage() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dba/statistics');
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch {
      addToast('Failed to load table statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRecalculate = async () => {
    setRefreshing(true);
    try {
      await api.post('/dba/maintenance', { action: 'RECALCULATE_STATISTICS' });
      addToast('Recalculated optimizer statistics for all tables', 'success');
      fetchStats();
    } catch {
      addToast('Failed to recalculate statistics', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Oracle Table Statistics</h2>
          <p className="text-xs text-slate-400 mt-1">Optimizer row counts, block size estimations, and last analyzed timestamps</p>
        </div>
        <Button
          icon={RefreshCw}
          variant="dba"
          loading={refreshing}
          onClick={handleRecalculate}
        >
          Gather Optimizer Statistics
        </Button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        {loading ? (
          <Loader text="Gathering table statistics..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Table Name</th>
                  <th className="py-3 px-4">Row Count</th>
                  <th className="py-3 px-4">Avg Row Length (bytes)</th>
                  <th className="py-3 px-4">Estimated Size</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Last Analyzed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {stats.map((s) => (
                  <tr key={s.tableName} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      {s.tableName}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-brand-400">{s.rowCount}</td>
                    <td className="py-3.5 px-4 text-slate-300">{s.avgRowLengthBytes} B</td>
                    <td className="py-3.5 px-4 text-emerald-400">{s.estimatedSizeKB} KB</td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{s.lastAnalyzed}</td>
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
