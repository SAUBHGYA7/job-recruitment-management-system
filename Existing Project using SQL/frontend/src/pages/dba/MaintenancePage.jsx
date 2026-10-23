import React, { useState } from 'react';
import { Wrench, RotateCcw, CheckCircle2, ShieldAlert, RefreshCw, Database, Lock } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';

export default function MaintenancePage() {
  const [loadingAction, setLoadingAction] = useState(null);
  const { addToast } = useToast();

  const handleAction = async (action, actionName) => {
    if (!window.confirm(`Are you sure you want to execute administrative maintenance task: "${actionName}"?`)) {
      return;
    }

    setLoadingAction(action);
    try {
      const res = await api.post('/dba/maintenance', { action });
      addToast(res.data?.message || 'Action executed successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Maintenance action failed', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight">Controlled Database Maintenance</h2>
        <p className="text-xs text-slate-400 mt-1">Safe diagnostic and maintenance operations for the Oracle schema</p>
      </div>

      <div className="p-4 rounded bg-amber-950/20 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-400">Academic Project Safety Policy:</strong> Unrestricted destructive commands such as <code className="text-amber-300">DROP DATABASE</code> or unrestricted arbitrary SQL injection are blocked. Controlled administrative tasks are listed below.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Action 1: Reset Sample Data */}
        <div className="panel p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Reset DA1 Seed Data</h3>
            <p className="text-xs text-slate-400 mt-1">
              Restores all 41 tables to the pristine baseline dataset from DA1 pages 2–9.
            </p>
          </div>
          <Button
            variant="outline"
            loading={loadingAction === 'RESET_SEED_DATA'}
            onClick={() => handleAction('RESET_SEED_DATA', 'Reset DA1 Seed Data')}
          >
            Reset Seed Data
          </Button>
        </div>

        {/* Action 2: Verify Schema Integrity */}
        <div className="panel p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Verify Constraint Integrity</h3>
            <p className="text-xs text-slate-400 mt-1">
              Scans all foreign keys for missing parent references, orphan rows, and check constraints.
            </p>
          </div>
          <Button
            variant="dba"
            loading={loadingAction === 'VERIFY_INTEGRITY'}
            onClick={() => handleAction('VERIFY_INTEGRITY', 'Verify Integrity')}
          >
            Run Integrity Diagnostic
          </Button>
        </div>

        {/* Action 3: Recalculate Statistics */}
        <div className="panel p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Gather Schema Statistics</h3>
            <p className="text-xs text-slate-400 mt-1">
              Executes Oracle DBMS_STATS equivalent to analyze block distribution and row selectivity.
            </p>
          </div>
          <Button
            variant="designer"
            loading={loadingAction === 'RECALCULATE_STATISTICS'}
            onClick={() => handleAction('RECALCULATE_STATISTICS', 'Gather Statistics')}
          >
            Analyze Schema
          </Button>
        </div>
      </div>
    </div>
  );
}
