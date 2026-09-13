import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Topbar() {
  const { user, logout, quickLogin } = useAuth();

  return (
    <header className="h-12 bg-[#0e131b] border-b border-[#1d2533] px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-200">Job Recruitment Management System</span>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Oracle DB (Live Relational Engine)</span>
        </div>
      </div>

      {/* Right: Role Switcher & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher */}
        <div className="flex items-center gap-1 text-[11px] bg-[#121822] border border-[#1e2736] rounded p-0.5">
          <span className="text-slate-500 px-2 font-medium">Actor:</span>
          <button
            onClick={() => quickLogin('USER')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'USER' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            User
          </button>
          <button
            onClick={() => quickLogin('DATABASE_DESIGNER')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'DATABASE_DESIGNER' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Designer
          </button>
          <button
            onClick={() => quickLogin('DBA')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'DBA' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            DBA
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 text-xs border-l border-[#1e2736] pl-3">
          <div className="text-right hidden sm:block">
            <span className="text-slate-200 font-medium block leading-tight">{user?.username}</span>
            <span className="text-[10px] text-slate-500 font-mono leading-tight">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded bg-[#141b26] border border-[#202938] hover:bg-rose-950/40 hover:border-rose-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
