import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Database, Lock, User, KeyRound, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';

export default function LoginPage() {
  const [username, setUsername] = useState('recruiter');
  const [password, setPassword] = useState('User@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      if (res.user.role === 'DBA') navigate('/dba/dashboard');
      else if (res.user.role === 'DATABASE_DESIGNER') navigate('/designer/dashboard');
      else navigate('/user/dashboard');
    } else {
      setError(res.message || 'Invalid username or password.');
    }
  };

  const handleQuickRole = async (role) => {
    setLoading(true);
    setError('');
    const res = await quickLogin(role);
    setLoading(false);
    if (res.success) {
      if (role === 'DBA') navigate('/dba/dashboard');
      else if (role === 'DATABASE_DESIGNER') navigate('/designer/dashboard');
      else navigate('/user/dashboard');
    } else {
      setError(res.message || 'Failed to authenticate quick demo account.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 font-sans text-slate-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded p-6 space-y-6">
        {/* Header */}
        <div className="border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Database className="w-5 h-5" />
            <h1 className="text-base font-bold text-white tracking-wide font-mono">
              Job Recruitment Management System
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Academic DBMS Project • Oracle Database 23c Backend
          </p>
        </div>

        {/* Quick Actor Selector for Evaluation / Viva */}
        <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs space-y-2">
          <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
            Quick Select Actor (Academic Evaluation):
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickRole('USER')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-blue-400 text-center transition-colors"
            >
              1. User
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('DATABASE_DESIGNER')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-indigo-400 text-center transition-colors"
            >
              2. Designer
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('DBA')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-emerald-400 text-center transition-colors"
            >
              3. DBA
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                placeholder="Username"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                placeholder="Password"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" loading={loading} className="w-full py-2">
            Sign In to System
          </Button>
        </form>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          Source of Truth: Oracle Database (system@localhost:1521/FREEPDB1)
        </div>
      </div>
    </div>
  );
}
