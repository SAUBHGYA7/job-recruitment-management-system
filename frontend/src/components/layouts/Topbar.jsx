import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, LogOut, User } from 'lucide-react';

export default function Topbar() {
  const { user, logout, quickLogin } = useAuth();

  return (
    <header className="h-12 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-white">Job Recruitment Management System</span>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Oracle FREEPDB1: Connected</span>
        </div>
      </div>

      {/* Right: Role Switcher & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Role Switcher for Academic Viva */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-800 rounded p-0.5">
          <span className="text-slate-500 px-2 font-medium">Switch:</span>
          <button
            onClick={() => quickLogin('USER')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'USER' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            User
          </button>
          <button
            onClick={() => quickLogin('DATABASE_DESIGNER')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'DATABASE_DESIGNER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Designer
          </button>
          <button
            onClick={() => quickLogin('DBA')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              user?.role === 'DBA' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            DBA
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="text-right hidden md:block">
            <span className="text-slate-200 font-medium">{user?.username}</span>
            <span className="text-[10px] text-slate-400 block font-mono">({user?.role})</span>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
