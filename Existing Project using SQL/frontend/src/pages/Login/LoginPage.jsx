import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Database, User, PencilRuler, ShieldAlert, ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const [loadingRole, setLoadingRole] = useState(null);
  const { quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = async (role) => {
    setLoadingRole(role);
    try {
      const res = await quickLogin(role);
      if (res.success) {
        if (role === 'DBA') navigate('/dba/dashboard');
        else if (role === 'DATABASE_DESIGNER') navigate('/designer/dashboard');
        else navigate('/user/dashboard');
      }
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0f15] flex flex-col items-center justify-center p-4 text-slate-200">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Academic Header */}
        <div className="text-center space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#131a24] border border-[#212a38] text-xs font-mono text-cyan-400 mb-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>ORACLE DATABASE 23c BACKEND</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide font-mono">
            Job Recruitment Management System
          </h1>
          <p className="text-xs text-slate-400">
            Select your actor role to enter the database console
          </p>
        </div>

        {/* Big 3 Actor Role Buttons */}
        <div className="grid grid-cols-1 gap-3.5">
          
          {/* USER ACTOR */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleRoleSelect('USER')}
            className="group relative w-full text-left p-4 rounded bg-[#111722] hover:bg-[#151d2b] border border-[#1f293a] hover:border-cyan-500/60 transition-all duration-150 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded bg-[#182335] border border-[#24334d] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-colors shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    1. End User (Recruiter)
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300">
                    User Access
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Browse Candidates, Postings, Pipeline Applications &amp; Interview Schedules
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* DATABASE DESIGNER */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleRoleSelect('DATABASE_DESIGNER')}
            className="group relative w-full text-left p-4 rounded bg-[#111722] hover:bg-[#151d2b] border border-[#1f293a] hover:border-indigo-500/60 transition-all duration-150 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded bg-[#1d1f36] border border-[#2e3256] flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors shrink-0">
                <PencilRuler className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                    2. Database Designer
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-950/70 border border-indigo-800/60 text-indigo-300">
                    Schema Architect
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect 41 BCNF Normalized Tables, Primary &amp; Foreign Keys, Relational Graph
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* DBA */}
          <button
            type="button"
            disabled={loadingRole !== null}
            onClick={() => handleRoleSelect('DBA')}
            className="group relative w-full text-left p-4 rounded bg-[#111722] hover:bg-[#151d2b] border border-[#1f293a] hover:border-emerald-500/60 transition-all duration-150 flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded bg-[#12231e] border border-[#1d3830] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    3. Database Administrator (DBA)
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-300">
                    Full Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live SQL Query Console, USER_TABLES Data Inspector, Storage &amp; Audit Logs
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#1a2230] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Connected: localhost:1521/FREEPDB1</span>
          <span>41 Normalized Relations</span>
        </div>

      </div>
    </div>
  );
}
