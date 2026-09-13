import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { Table, ArrowLeft, Key, Link2, SlidersHorizontal, Database } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function TableDetailPage() {
  const { tableName } = useParams();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchTableDetails() {
      try {
        setLoading(true);
        const res = await api.get(`/designer/tables/${tableName}`);
        if (res.data?.data) {
          setDetails(res.data.data);
        }
      } catch {
        addToast(`Failed to load details for table ${tableName}`, 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchTableDetails();
  }, [tableName]);

  if (loading) return <Loader text={`Querying metadata for ${tableName}...`} />;
  if (!details) return <div className="text-center text-slate-400 p-8">Table not found in Oracle schema.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <NavLink
          to="/designer/tables"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Tables Catalog
        </NavLink>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-designer-500/10 border border-designer-500/30 flex items-center justify-center text-designer-400 font-bold">
              <Table className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight font-mono">{details.tableName}</h2>
              <p className="text-xs text-slate-400">
                {details.columns?.length} columns • {details.rowCount} rows in Oracle
              </p>
            </div>
          </div>
          <Badge variant="purple">Relation Schema</Badge>
        </div>
      </div>

      {/* Columns Definition Table (USER_TAB_COLUMNS) */}
      <div className="panel p-4">
        <h3 className="text-base font-bold text-white mb-1">Column Definitions</h3>
        <p className="text-xs text-slate-400 mb-4">Derived from <code className="text-designer-400">USER_TAB_COLUMNS</code></p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Column Name</th>
                <th className="py-3 px-4">Data Type</th>
                <th className="py-3 px-4">Length / Precision</th>
                <th className="py-3 px-4">Nullable</th>
                <th className="py-3 px-4 rounded-r-xl">Key Constraints</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {details.columns?.map((c) => (
                <tr key={c.COLUMN_NAME} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                    {c.COLUMN_NAME}
                  </td>
                  <td className="py-3 px-4 font-mono text-brand-400">{c.DATA_TYPE}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {c.DATA_PRECISION ? `(${c.DATA_PRECISION}, ${c.DATA_SCALE || 0})` : `(${c.DATA_LENGTH})`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${c.NULLABLE === 'N' ? 'text-rose-400' : 'text-slate-500'}`}>
                      {c.NULLABLE === 'N' ? 'NOT NULL' : 'NULL'}
                    </span>
                  </td>
                  <td className="py-3 px-4 flex items-center gap-1.5">
                    {c.isPrimaryKey && (
                      <Badge variant="success">
                        <Key className="w-3 h-3 mr-1" />
                        PK
                      </Badge>
                    )}
                    {c.isForeignKey && (
                      <Badge variant="purple">
                        <Link2 className="w-3 h-3 mr-1" />
                        FK
                      </Badge>
                    )}
                    {!c.isPrimaryKey && !c.isForeignKey && <span className="text-slate-600">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Constraints for this Table */}
      {details.constraints?.length > 0 && (
        <div className="panel p-4">
          <h3 className="text-base font-bold text-white mb-1">Constraints &amp; Integrity Rules</h3>
          <p className="text-xs text-slate-400 mb-4">Derived from <code className="text-designer-400">USER_CONSTRAINTS</code></p>

          <div className="space-y-2">
            {details.constraints.map((ct) => (
              <div
                key={ct.CONSTRAINT_NAME}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-200">{ct.CONSTRAINT_NAME}</span>
                    <Badge variant={ct.CONSTRAINT_TYPE === 'P' ? 'success' : ct.CONSTRAINT_TYPE === 'R' ? 'purple' : 'amber'}>
                      {ct.CONSTRAINT_TYPE === 'P' ? 'PRIMARY KEY' : ct.CONSTRAINT_TYPE === 'R' ? 'FOREIGN KEY' : 'CHECK'}
                    </Badge>
                  </div>
                  {ct.SEARCH_CONDITION && (
                    <p className="text-[11px] font-mono text-slate-400 mt-1">CHECK: {ct.SEARCH_CONDITION}</p>
                  )}
                  {ct.R_CONSTRAINT_NAME && (
                    <p className="text-[11px] font-mono text-designer-400 mt-1">REFERENCES: {ct.R_CONSTRAINT_NAME} ({ct.DELETE_RULE || 'NO ACTION'})</p>
                  )}
                </div>
                <Badge variant="success">{ct.STATUS}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Rows Data Preview */}
      <div className="panel p-4">
        <h3 className="text-base font-bold text-white mb-1">Sample Oracle Rows</h3>
        <p className="text-xs text-slate-400 mb-4">Live table data preview ({details.sampleRows?.length} rows shown)</p>

        {details.sampleRows?.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No rows currently in this table.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  {Object.keys(details.sampleRows[0]).map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                {details.sampleRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 whitespace-nowrap">
                        {val === null ? <span className="text-slate-600">NULL</span> : String(val)}
                      </td>
                    ))}
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
