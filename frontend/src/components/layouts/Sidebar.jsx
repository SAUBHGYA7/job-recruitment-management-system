import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Briefcase,
  FileText,
  CalendarCheck,
  Building2,
  Sparkles,
  BarChart3,
  Database,
  Table,
  Columns,
  Key,
  Link2,
  SlidersHorizontal,
  GitFork,
  BookOpen,
  Terminal,
  Shield,
  HardDrive,
  Activity,
  Wrench,
  Layers,
  LayoutDashboard
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'USER';

  const userLinks = [
    { to: '/user/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/user/candidates', label: 'Candidates', icon: Users },
    { to: '/user/jobs', label: 'Job Postings', icon: Briefcase },
    { to: '/user/applications', label: 'Applications', icon: FileText },
    { to: '/user/interviews', label: 'Interviews', icon: CalendarCheck },
    { to: '/user/employers', label: 'Employers', icon: Building2 },
    { to: '/user/skills', label: 'Skills Catalog', icon: Sparkles },
    { to: '/user/reports', label: 'Reports & Export', icon: BarChart3 },
  ];

  const designerLinks = [
    { to: '/designer/dashboard', label: 'Schema Overview', icon: LayoutDashboard },
    { to: '/designer/tables', label: 'Tables (USER_TABLES)', icon: Table },
    { to: '/designer/columns', label: 'Columns Catalog', icon: Columns },
    { to: '/designer/primary-keys', label: 'Primary Keys', icon: Key },
    { to: '/designer/foreign-keys', label: 'Foreign Keys & Rules', icon: Link2 },
    { to: '/designer/constraints', label: 'Integrity Constraints', icon: SlidersHorizontal },
    { to: '/designer/relationships', label: 'Relational Schema Graph', icon: GitFork },
    { to: '/designer/normalization', label: 'BCNF Normalization Guide', icon: BookOpen },
    { to: '/designer/reports', label: 'Schema Reports', icon: BarChart3 },
  ];

  const dbaLinks = [
    { to: '/dba/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/dba/sql-query', label: 'SQL Query Console', icon: Terminal },
    { to: '/dba/tables', label: 'Tables Explorer', icon: Table },
    { to: '/dba/objects', label: 'Objects (USER_OBJECTS)', icon: Layers },
    { to: '/dba/users', label: 'Users & Roles (RBAC)', icon: Shield },
    { to: '/dba/indexes', label: 'Indexes & Storage', icon: HardDrive },
    { to: '/dba/constraints-health', label: 'Referential Health', icon: SlidersHorizontal },
    { to: '/dba/statistics', label: 'Optimizer Statistics', icon: BarChart3 },
    { to: '/dba/audit-log', label: 'System Audit Log', icon: Activity },
    { to: '/dba/maintenance', label: 'Maintenance Tasks', icon: Wrench },
  ];

  return (
    <aside className="w-56 bg-[#0e131b] border-r border-[#1d2533] flex flex-col shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="h-12 px-3.5 flex items-center gap-2.5 border-b border-[#1d2533] bg-[#121822]">
        <div className="w-6 h-6 rounded bg-[#182333] border border-[#273852] flex items-center justify-center text-cyan-400">
          <Database className="w-3.5 h-3.5" />
        </div>
        <div className="leading-tight">
          <span className="text-xs font-bold tracking-wide text-white font-mono block">JRMS CONSOLE</span>
          <span className="text-[10px] text-slate-500 font-mono block">Oracle 23c Free</span>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-3 py-2 bg-[#101621] border-b border-[#1a2230] flex items-center justify-between text-xs">
        <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Actor</span>
        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
          role === 'DBA' 
            ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-400' 
            : role === 'DATABASE_DESIGNER'
            ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-400'
            : 'bg-cyan-950/60 border-cyan-800/60 text-cyan-400'
        }`}>
          {role}
        </span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {/* User Portal Section */}
        {(role === 'USER' || role === 'DATABASE_DESIGNER' || role === 'DBA') && (
          <div className="mb-3">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Recruitment System
            </p>
            {userLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 font-medium border border-cyan-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c27]'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Database Designer Section */}
        {(role === 'DATABASE_DESIGNER' || role === 'DBA') && (
          <div className="mb-3">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Database Designer
            </p>
            {designerLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-950/80 text-indigo-300 font-medium border border-indigo-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c27]'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* DBA Admin Section */}
        {role === 'DBA' && (
          <div className="mb-3">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              DBA Console
            </p>
            {dbaLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-emerald-950/80 text-emerald-300 font-medium border border-emerald-800/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c27]'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Database Quick Health */}
      <div className="p-2.5 border-t border-[#1d2533] bg-[#0c1017] text-[11px] font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>FREEPDB1: Live</span>
        </div>
      </div>
    </aside>
  );
}
