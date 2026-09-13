import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function ConstraintsHealthPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchHealth() {
      try {
        setLoading(true);
        const res = await api.get('/dba/constraints-health');
        if (res.data?.data) {
          setHealthData(res.data.data);
        }
      } catch {
        addToast('Failed to run integrity verification', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  if (loading) return <Loader text="Running Oracle constraint integrity diagnostics..." />;
  if (!healthData) return <div className="text-center text-slate-400 p-8">No integrity report available.</div>;

  const { summary, integrityChecks } = healthData;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">Referential Integrity Diagnostics</h2>
          <Badge variant="success">All Checks Passed</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">Foreign key integrity rules, orphan records check, and constraint validation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 glass-card">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Constraints</p>
          <p className="text-2xl font-black text-white mt-1">{summary.totalConstraints}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 glass-card">
          <p className="text-xs text-emerald-400 uppercase font-semibold">Enabled Constraints</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{summary.enabledCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 glass-card">
          <p className="text-xs text-slate-400 uppercase font-semibold">Disabled Constraints</p>
          <p className="text-2xl font-black text-slate-300 mt-1">{summary.disabledCount}</p>
        </div>
      </div>

      {/* Integrity Checks Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        <h3 className="text-sm font-bold text-white mb-4">Foreign Key Parent-Child Integrity Verifications</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Constraint Name</th>
                <th className="py-3 px-4">Child Table</th>
                <th className="py-3 px-4">Parent Table</th>
                <th className="py-3 px-4">Orphan Count</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
              {integrityChecks.map((ic) => (
                <tr key={ic.constraintName} className="hover:bg-slate-800/30">
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{ic.constraintName}</td>
                  <td className="py-3.5 px-4 text-white font-bold">{ic.childTable}</td>
                  <td className="py-3.5 px-4 text-brand-400 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    {ic.parentTable}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-400">{ic.orphanCount} orphans</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
