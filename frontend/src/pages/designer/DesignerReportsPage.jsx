import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Table, Layers } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import Button from '../../components/common/Button';

export default function DesignerReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchReport() {
      try {
        setLoading(true);
        const res = await api.get('/reports/designer');
        if (res.data?.data) {
          setReport(res.data.data);
        }
      } catch {
        addToast('Failed to load designer reports', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`Exported ${filename}.csv successfully`, 'success');
  };

  if (loading) return <Loader text="Generating schema metadata report..." />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Database Schema Reports</h2>
          <p className="text-xs text-slate-400 mt-1">Exportable schema structure, key definitions, and constraint metrics</p>
        </div>
        <Button
          icon={Download}
          variant="designer"
          onClick={() => exportCSV(report.tableReport, 'oracle_schema_report')}
        >
          Export Schema CSV
        </Button>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase bg-slate-800/40 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Table Name</th>
                <th className="py-3 px-4">Primary Key</th>
                <th className="py-3 px-4">Columns</th>
                <th className="py-3 px-4">Foreign Keys</th>
                <th className="py-3 px-4">Checks</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Row Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
              {report?.tableReport?.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-white">{t.tableName}</td>
                  <td className="py-3 px-4 text-emerald-400">{t.primaryKey}</td>
                  <td className="py-3 px-4 text-slate-300">{t.columnCount}</td>
                  <td className="py-3 px-4 text-indigo-400">{t.foreignKeyCount}</td>
                  <td className="py-3 px-4 text-amber-400">{t.checkConstraintCount}</td>
                  <td className="py-3 px-4 text-right font-bold text-brand-400">{t.rowCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
