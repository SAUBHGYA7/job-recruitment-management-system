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
    <aside className="w-56 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="h-12 px-4 flex items-center gap-2 border-b border-slate-800 bg-slate-900/50">
        <Database className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-bold tracking-wide text-white font-mono">JRMS DBMS v2.0</span>
      </div>

      {/* Role Banner */}
      <div className="px-4 py-2 bg-slate-900/30 border-b border-slate-800/60 text-[11px]">
        <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px]">Actor Mode: </span>
        <span className="font-bold text-slate-200">{role}</span>
      </div>

      {/* Nav Items */}
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
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* Database Designer Section */}
        {(role === 'DATABASE_DESIGNER' || role === 'DBA') && (
          <div className="mb-3 pt-2 border-t border-slate-900">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Database Designer
            </p>
            {designerLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {/* DBA Console Section */}
        {role === 'DBA' && (
          <div className="mb-3 pt-2 border-t border-slate-900">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              DBA Console
            </p>
            {dbaLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-emerald-700 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30 text-[10px] text-slate-500 font-mono">
        Oracle 23c • FREEPDB1
      </div>
    </aside>
  );
}
