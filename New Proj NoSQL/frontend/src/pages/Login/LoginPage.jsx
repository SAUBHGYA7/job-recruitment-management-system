import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Database, User, PencilRuler, ShieldAlert, ChevronRight, AlertCircle, LogIn, Lock } from 'lucide-react';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const [loadingRole, setLoadingRole] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const { quickLogin, login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = async (role) => {
    setErrorMessage(null);
    setLoadingRole(role);
    try {
      const res = await quickLogin(role);
      if (res.success) {
        if (role === 'DBA') navigate('/dba/dashboard');
        else if (role === 'DATABASE_DESIGNER') navigate('/designer/dashboard');
        else navigate('/user/dashboard');
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please check graph database connection.');
      }
    } finally {
      setLoadingRole(null);
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setErrorMessage(null);
    setFormLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res.success) {
        const role = res.user?.role;
        if (role === 'DBA') navigate('/dba/dashboard');
        else if (role === 'DATABASE_DESIGNER') navigate('/designer/dashboard');
        else navigate('/user/dashboard');
      } else {
        setErrorMessage(res.message || 'Invalid username or password.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const isBusy = loadingRole !== null || formLoading;

  return (
    <div className="min-h-screen w-full bg-[#0b0f15] flex flex-col items-center justify-center p-4 text-slate-200">
      <div className="w-full max-w-xl space-y-5">
        
        {/* Modernized Header */}
        <div className="text-center space-y-1.5 pb-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#131a24] border border-[#212a38] text-xs font-mono text-cyan-400 mb-1">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>NEO4J GRAPH DATABASE 5.26 (BOLT)</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide font-mono">
            Job Recruitment Management System
          </h1>
          <p className="text-xs text-slate-400">
            Select an authorized actor role or sign in with your account
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-mono">{errorMessage}</div>
          </div>
        )}

        {/* 1-Click Actor Role Buttons */}
        <div className="grid grid-cols-1 gap-2.5">
          
          {/* USER ACTOR */}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleRoleSelect('USER')}
            className="group relative w-full text-left p-3.5 rounded bg-[#111722] hover:bg-[#151d2b] border border-[#1f293a] hover:border-cyan-500/60 transition-all duration-150 flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-[#182335] border border-[#24334d] flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/10 transition-colors shrink-0">
                <User className="w-4 h-4" />
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
                  Browse Candidates, Postings, Applications &amp; Interview Schedules
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* DATABASE DESIGNER */}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleRoleSelect('DATABASE_DESIGNER')}
            className="group relative w-full text-left p-3.5 rounded bg-[#111722] hover:bg-[#151d2b] border border-[#1f293a] hover:border-indigo-500/60 transition-all duration-150 flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-[#1d1f36] border border-[#2e3256] flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/10 transition-colors shrink-0">
                <PencilRuler className="w-4 h-4" />
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
                  Inspect BCNF Relations, Schema Catalog &amp; Graph Relationships
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

          {/* DBA */}
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleRoleSelect('DBA')}
            className="group relative w-full text-left p-3.5 rounded bg-[#111722] hover:bg-[#151d2b] border border-[#1f293a] hover:border-emerald-500/60 transition-all duration-150 flex items-center justify-between disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-[#12231e] border border-[#1d3830] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/10 transition-colors shrink-0">
                <ShieldAlert className="w-4 h-4" />
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
                  Cypher Console, Entity Inspector, Constraints &amp; Security Audit Log
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>

        </div>

        {/* Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-[#1d2636]"></div>
          <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Or Account Credentials
          </span>
          <div className="flex-grow border-t border-[#1d2636]"></div>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleCustomLogin} className="p-4 rounded bg-[#101621] border border-[#1d2636] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                disabled={isBusy}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. recruiter, dba_admin"
                className="w-full bg-[#0a0f16] border border-[#222e42] focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                disabled={isBusy}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0a0f16] border border-[#222e42] focus:border-cyan-500 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500 font-mono">
              Bcrypt hash verification against live Neo4j database
            </span>
            <Button
              type="submit"
              size="sm"
              variant="primary"
              icon={LogIn}
              loading={formLoading}
              disabled={isBusy}
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#1a2230] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Connected: bolt://localhost:7687</span>
          <span>18 Canonical Graph Relationships</span>
        </div>

      </div>
    </div>
  );
}
