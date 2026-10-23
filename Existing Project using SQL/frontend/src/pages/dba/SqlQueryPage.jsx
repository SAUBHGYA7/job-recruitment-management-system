import React, { useState } from 'react';
import { Terminal, Play, Download, AlertCircle, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';

export default function SqlQueryPage() {
  const [query, setQuery] = useState('SELECT * FROM Candidate ORDER BY cand_id ASC');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const sampleQueries = [
    { label: 'All Candidates', sql: 'SELECT * FROM Candidate ORDER BY cand_id' },
    { label: 'All Jobs', sql: 'SELECT * FROM Job ORDER BY job_key' },
    { label: 'All Applications', sql: 'SELECT * FROM Application ORDER BY app_id' },
    { label: 'USER_TABLES', sql: 'SELECT table_name, num_rows, tablespace_name FROM user_tables ORDER BY table_name' },
    { label: 'Candidate Columns', sql: "SELECT column_name, data_type, data_length, nullable FROM user_tab_columns WHERE table_name = 'CANDIDATE' ORDER BY column_id" },
    { label: 'Skill Demand Join', sql: 'SELECT s.skill_name, COUNT(*) AS demand FROM Requires r JOIN Skill s ON s.skill_id = r.skill_id GROUP BY s.skill_name ORDER BY demand DESC' }
  ];

  const handleExecute = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/dba/execute-sql', { query });
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'SQL execution failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleExecute();
    }
  };

  const exportCSV = () => {
    if (!result || !result.rows || result.rows.length === 0) return;
    const headers = result.columns.join(',');
    const rows = result.rows.map(row =>
      result.columns.map(col => `"${row[col] === null || row[col] === undefined ? '' : String(row[col]).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          DBA SQL Query Console
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Execute read-only queries directly against Oracle Database (FREEPDB1).
        </p>
      </div>

      {/* Preset Quick Queries */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-slate-500 font-medium">Quick Queries:</span>
        {sampleQueries.map((sq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setQuery(sq.sql)}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            {sq.label}
          </button>
        ))}
      </div>

      {/* Query Editor Box */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="px-3 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400 text-[11px]">SQL Editor (SELECT queries only)</span>
          <span className="text-slate-500 text-[11px]">Press Ctrl + Enter to run</span>
        </div>
        <textarea
          rows={5}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter SQL SELECT statement (e.g. SELECT * FROM Candidate;)..."
          className="w-full bg-slate-900 px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none resize-y"
          spellCheck={false}
        />
        <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Read-only security enforced: DDL/DML commands are rejected.</span>
          </div>
          <Button
            size="sm"
            variant="success"
            icon={Play}
            loading={loading}
            onClick={handleExecute}
          >
            Execute Query
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="font-mono">{error}</div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white">Query Results</span>
              <span className="flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {result.rowCount} rows returned
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {result.executionTimeMs} ms
              </span>
            </div>
            {result.rowCount > 0 && (
              <Button size="sm" variant="outline" icon={Download} onClick={exportCSV}>
                Export CSV
              </Button>
            )}
          </div>

          <div className="table-container max-h-[500px]">
            {result.rows.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">
                Query executed successfully. 0 rows returned.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col} className="font-mono">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {result.columns.map((col, cIdx) => (
                        <td key={cIdx} className="font-mono text-xs whitespace-nowrap">
                          {row[col] === null || row[col] === undefined ? (
                            <span className="text-slate-600 italic">NULL</span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
