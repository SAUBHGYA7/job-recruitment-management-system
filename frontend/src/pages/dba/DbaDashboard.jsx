import React, { useState, useEffect } from 'react';
import { Shield, HardDrive, Layers, Activity, Wrench, Database, Terminal, Table } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { NavLink } from 'react-router-dom';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function DbaDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDbaData() {
      try {
        const res = await api.get('/dba/dashboard');
        if (res.data?.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('DBA dashboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDbaData();
  }, []);

  if (loading) return <Loader text="Querying Oracle DBA administrative metrics..." />;
  if (!data) return <div className="p-8 text-center text-xs text-slate-500">No administrative metrics found.</div>;

  const { summary, storageMetrics, objectTypes, recentAudit } = data;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Database Administrator Console</h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Instance: {summary.dbStatus.connectString} (User: {summary.dbStatus.user})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/dba/sql-query"
            className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            SQL Query Console
          </NavLink>
          <NavLink
            to="/dba/tables"
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
          >
            <Table className="w-3.5 h-3.5" />
            Tables Explorer
          </NavLink>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard title="Total Tables" value={summary.totalTables} icon={Database} subtitle="USER_TABLES" />
        <StatCard title="Total Indexes" value={summary.totalIndexes} icon={HardDrive} subtitle="USER_INDEXES" />
        <StatCard title="Total Objects" value={objectTypes.reduce((acc, o) => acc + o.count, 0)} icon={Layers} subtitle="USER_OBJECTS" />
        <StatCard title="App Users" value={`${summary.activeUsers} / ${summary.totalUsers}`} icon={Shield} subtitle="APP_USERS (RBAC)" />
      </div>

      {/* Tablespaces & Object Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Tablespaces */}
        <div className="lg:col-span-6 panel p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tablespace Storage Allocation
            </h3>
            <p className="text-[11px] text-slate-500">Allocated storage from user_segments</p>
          </div>

          <div className="space-y-3 pt-1">
            {storageMetrics.map((ts) => {
              const usedPct = ((ts.usedMB / ts.allocatedMB) * 100).toFixed(0);
              return (
                <div key={ts.tablespace} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-white">{ts.tablespace}</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {ts.usedMB} MB / {ts.allocatedMB} MB ({usedPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-600 rounded transition-all duration-500"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Object Types Breakdown */}
        <div className="lg:col-span-6 panel p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
              Oracle Object Breakdown
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">Grouped from USER_OBJECTS</p>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={objectTypes} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="type" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '4px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent System Audit Log */}
      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Recent System &amp; Security Audit Trail
            </h3>
            <p className="text-[11px] text-slate-500">Queried from APP_AUDIT_LOG table</p>
          </div>
          <NavLink to="/dba/audit-log" className="text-xs text-emerald-400 hover:underline">
            View All →
          </NavLink>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Action</th>
                <th>Actor Role</th>
                <th>Username</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map((log) => (
                <tr key={log.LOG_ID}>
                  <td className="font-mono text-emerald-400">#{log.LOG_ID}</td>
                  <td className="font-mono font-bold text-white">{log.ACTION}</td>
                  <td>
                    <Badge variant={log.ROLE === 'DBA' ? 'success' : log.ROLE === 'DATABASE_DESIGNER' ? 'purple' : 'primary'}>
                      {log.ROLE}
                    </Badge>
                  </td>
                  <td className="font-mono text-slate-300">{log.USERNAME}</td>
                  <td className="text-slate-300 text-xs truncate max-w-md">{log.DETAILS}</td>
                  <td className="font-mono text-slate-400 text-xs">{log.CREATED_AT}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
