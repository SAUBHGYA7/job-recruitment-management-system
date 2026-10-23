import React, { useState, useEffect } from 'react';
import { Table, Columns, Key, Link2, SlidersHorizontal, Layers, GitFork, BookOpen } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { getMockDesignerDashboard } from '../../services/mockDb';

export default function DesignerDashboard() {
  const [data, setData] = useState(getMockDesignerDashboard());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchDesignerData() {
      try {
        const res = await api.get('/designer/dashboard');
        if (res.data?.data?.metrics) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Designer dashboard error:', err);
      }
    }
    fetchDesignerData();
  }, []);

  const { metrics, tableRowCounts, normalizationMetrics } = data;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Database Schema Architecture</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real Oracle data dictionary views: <code className="text-slate-300">USER_TABLES</code>, <code className="text-slate-300">USER_TAB_COLUMNS</code>, <code className="text-slate-300">USER_CONSTRAINTS</code>.
          </p>
        </div>
        <NavLink
          to="/designer/relationships"
          className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
        >
          <GitFork className="w-3.5 h-3.5" />
          Relational Schema Graph
        </NavLink>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <StatCard title="Tables" value={metrics.totalTables} icon={Table} subtitle="USER_TABLES" />
        <StatCard title="Columns" value={metrics.totalColumns} icon={Columns} subtitle="USER_TAB_COLUMNS" />
        <StatCard title="Primary Keys" value={metrics.totalPrimaryKeys} icon={Key} subtitle="Constraint 'P'" />
        <StatCard title="Foreign Keys" value={metrics.totalForeignKeys} icon={Link2} subtitle="Constraint 'R'" />
        <StatCard title="Checks" value={metrics.totalCheckConstraints} icon={SlidersHorizontal} subtitle="Constraint 'C'" />
        <StatCard title="Total Constraints" value={metrics.totalConstraints} icon={Layers} subtitle="All Rules" />
      </div>

      {/* Grid: Row Counts & Decomposition List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Table Row Distribution */}
        <div className="lg:col-span-7 panel p-4">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Table Row Counts (Sample Distribution)
            </h3>
            <p className="text-[11px] text-slate-500">
              Live count of records across schema tables
            </p>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tableRowCounts} margin={{ top: 5, right: 10, left: -25, bottom: 35 }}>
                <XAxis dataKey="tableName" stroke="#64748b" fontSize={10} angle={-30} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }}
                />
                <Bar dataKey="rowCount" fill="#6366f1" radius={[2, 2, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BCNF Decompositions Summary */}
        <div className="lg:col-span-5 panel p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                DA1 BCNF Decompositions
              </h3>
              <NavLink to="/designer/normalization" className="text-xs text-indigo-400 hover:underline">
                Proofs →
              </NavLink>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Normalized tables to eliminate partial &amp; transitive dependencies
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {normalizationMetrics.decomposedRelations.map((d, idx) => (
                <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase font-mono">{d.original}</span>
                    <span className="text-[10px] text-indigo-400 font-mono">→ {d.decomposedInto.join(', ')}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{d.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
