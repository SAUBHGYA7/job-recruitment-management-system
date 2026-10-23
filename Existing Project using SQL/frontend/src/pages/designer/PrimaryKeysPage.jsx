import React, { useState, useEffect, useCallback } from 'react';
import { Key, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function PrimaryKeysPage() {
  const [pks, setPks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchPks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/designer/primary-keys');
      if (res.data?.data) {
        setPks(res.data.data);
      } else {
        setPks([]);
      }
    } catch (err) {
      const message = 'Unable to load primary key metadata. Please check the database connection and try again.';
      setError(message);
      addToast('Failed to load primary keys', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchPks();
  }, [fetchPks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Primary Key Constraints</h2>
            {!loading && !error && (
              <Badge variant="success">{pks.length} PKs Enforced</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Queried from Oracle dictionary: <code className="text-designer-400">USER_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'P'</code>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchPks}
        >
          Refresh
        </Button>
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Loading primary key constraints..." />
        ) : error ? (
          <div className="py-12 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Failed to Load Primary Keys</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{error}</p>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchPks}>
              Try Again
            </Button>
          </div>
        ) : pks.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Records Found</h3>
            <p className="text-xs text-slate-400">No primary key constraints found in the schema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">Constraint Name</th>
                  <th className="py-3 px-4">Target Table</th>
                  <th className="py-3 px-4">Key Column(s)</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {pks.map((pk) => {
                  const cols = Array.isArray(pk.columns)
                    ? pk.columns.filter(Boolean)
                    : typeof pk.columns === 'string'
                    ? pk.columns.split(',').map((c) => c.trim()).filter(Boolean)
                    : [];

                  return (
                    <tr key={pk.constraintName} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-emerald-400 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        {pk.constraintName}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">{pk.tableName}</td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex flex-wrap gap-1">
                          {cols.map((c, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-brand-400 font-bold"
                            >
                              {c}
                            </span>
                          ))}
                          {cols.length === 0 && (
                            <span className="text-slate-500 italic">No columns mapped</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant="success">{pk.status || 'ENABLED'}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
