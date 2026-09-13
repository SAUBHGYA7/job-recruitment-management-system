import React, { useState, useEffect } from 'react';
import { Activity, Shield, Download } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ActivityAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dba/audit-log');
      if (res.data?.data) {
        setLogs(res.data.data);
      }
    } catch {
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const exportCSV = () => {
    if (!logs || logs.length === 0) return;
    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'oracle_system_audit_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Audit log exported successfully', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">System &amp; Security Audit Trail</h2>
            <Badge variant="success">{logs.length} Logged Events</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Queried from Oracle security table <code className="text-emerald-400">APP_AUDIT_LOG</code></p>
        </div>
        <Button icon={Download} variant="outline" size="sm" onClick={exportCSV}>
          Export Audit Trail
        </Button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        {loading ? (
          <Loader text="Loading audit log entries..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Log ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor Role</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {logs.map((log) => (
                  <tr key={log.LOG_ID} className="hover:bg-slate-800/30">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{log.LOG_ID}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">{log.ACTION}</td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          log.ROLE === 'DBA'
                            ? 'success'
                            : log.ROLE === 'DATABASE_DESIGNER'
                            ? 'purple'
                            : 'primary'
                        }
                      >
                        {log.ROLE}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{log.USERNAME}</td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm truncate">{log.DETAILS}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{log.IP_ADDRESS}</td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {log.CREATED_AT}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
