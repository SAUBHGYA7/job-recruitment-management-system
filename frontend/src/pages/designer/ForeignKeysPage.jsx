import React, { useState, useEffect, useCallback } from 'react';
import { Link2, ArrowRight, RefreshCw, AlertCircle, Inbox } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ForeignKeysPage() {
  const [fks, setFks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const fetchFks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/designer/foreign-keys');
      if (res.data?.data) {
        setFks(res.data.data);
      } else {
        setFks([]);
      }
    } catch (err) {
      const message = 'Unable to load foreign key metadata. Please check the database connection and try again.';
      setError(message);
      addToast('Failed to load foreign keys', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFks();
  }, [fetchFks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Foreign Key &amp; Referential Constraints</h2>
            {!loading && !error && (
              <Badge variant="purple">{fks.length} Foreign Keys</Badge>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Queried from Oracle dictionary: <code className="text-designer-400">USER_CONSTRAINTS WHERE CONSTRAINT_TYPE = 'R'</code>
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          icon={RefreshCw}
          loading={loading}
          onClick={fetchFks}
        >
          Refresh
        </Button>
      </div>

      <div className="panel p-4">
        {loading ? (
          <Loader text="Loading foreign key mappings..." />
        ) : error ? (
          <div className="py-12 px-4 text-center">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">Failed to Load Foreign Keys</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">{error}</p>
            <Button size="sm" variant="secondary" icon={RefreshCw} onClick={fetchFks}>
              Try Again
            </Button>
          </div>
        ) : fks.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Inbox className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">No Foreign Keys Found</h3>
            <p className="text-xs text-slate-400">No foreign key constraints found in the schema.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl">FK Constraint</th>
                  <th className="py-3 px-4">Child Table</th>
                  <th className="py-3 px-4">Foreign Column</th>
                  <th className="py-3 px-4">Parent Referenced Table</th>
                  <th className="py-3 px-4">Delete Rule</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {fks.map((fk) => {
                  const cols = Array.isArray(fk.columns)
                    ? fk.columns.filter(Boolean)
                    : typeof fk.columns === 'string'
                    ? fk.columns.split(',').map((c) => c.trim()).filter(Boolean)
                    : [];

                  return (
                    <tr key={fk.constraintName} className="hover:bg-slate-800/30">
                      <td className="py-3.5 px-4 font-bold text-indigo-400 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        {fk.constraintName}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">{fk.tableName}</td>
                      <td className="py-3.5 px-4 text-brand-400">
                        {cols.length > 0 ? cols.join(', ') : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                        {fk.referencedTable}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={fk.deleteRule === 'CASCADE' ? 'danger' : 'default'}>
                          {fk.deleteRule || 'NO ACTION'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant="success">{fk.status || 'ENABLED'}</Badge>
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
