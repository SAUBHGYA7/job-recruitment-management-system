import React, { useState } from 'react';
import { Terminal, Play, Download, AlertCircle, Clock, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';

const ALLOWLISTED_TEMPLATES = [
  {
    id: 'LIST_CANDIDATES',
    label: '1. List Candidates Pipeline',
    description: 'Active candidate talent pool with submitted applications and scheduled interview counts',
    query: 'LIST_CANDIDATES'
  },
  {
    id: 'SEARCH_JOBS',
    label: '2. Search Job Postings',
    description: 'Recruitment postings with live applicant volume and required skill sets',
    query: 'SEARCH_JOBS'
  },
  {
    id: 'ALL_APPLICATIONS',
    label: '3. All Applications & Traversal',
    description: 'Reconciled Candidate -> Application -> Job multi-hop graph traversal',
    query: 'ALL_APPLICATIONS'
  },
  {
    id: 'SCHEMA_CONSTRAINTS_HEALTH',
    label: '4. Schema Constraints & Indexes',
    description: 'Active Neo4j uniqueness constraints and lookup indexes (SHOW CONSTRAINTS)',
    query: 'SCHEMA_CONSTRAINTS_HEALTH'
  },
  {
    id: 'AUDIT_LOG_STREAM',
    label: '5. Security Audit Log Stream',
    description: 'Real-time administrative, CRUD, and authentication audit trail in Neo4j',
    query: 'AUDIT_LOG_STREAM'
  },
  {
    id: 'SKILL_DEMAND_ANALYSIS',
    label: '6. Skill Demand vs Supply',
    description: 'Job requirement demand compared against candidate talent pool supply',
    query: 'SKILL_DEMAND_ANALYSIS'
  },
  {
    id: 'RELATIONSHIP_SUMMARY',
    label: '7. Graph Relationship Counts',
    description: 'Edge distribution across all 18 canonical relationship types',
    query: 'RELATIONSHIP_SUMMARY'
  }
];

export default function SqlQueryPage() {
  const [query, setQuery] = useState(ALLOWLISTED_TEMPLATES[0].query);
  const [selectedTemplate, setSelectedTemplate] = useState(ALLOWLISTED_TEMPLATES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTemplateSelect = (tmpl) => {
    setSelectedTemplate(tmpl);
    setQuery(tmpl.query);
    setError(null);
  };

  const handleExecute = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/dba/execute-sql', { query: query.trim() });
      if (res.data?.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Execution failed';
      setError(errMsg);
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
    link.setAttribute('download', `neo4j_query_result_${Date.now()}.csv`);
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
          DBA Cypher Query Console
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Execute authorized read-only Cypher query templates against the live Neo4j graph database.
        </p>
      </div>

      {/* Security Governance Notice */}
      <div className="p-3 rounded bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-200">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-300">Allowlist Security Governance:</strong> Queries run strictly inside read-only transactions using parameterized templates. Arbitrary Cypher execution and destructive mutations (<code className="text-emerald-300">DETACH DELETE</code>, <code className="text-emerald-300">DROP</code>) are blocked with HTTP 403 Forbidden.
        </div>
      </div>

      {/* Pre-Approved Query Templates */}
      <div>
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">
          Authorized Read-Only Templates (7 Templates)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {ALLOWLISTED_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleTemplateSelect(tmpl)}
              className={`p-2.5 rounded text-left border transition-all text-xs flex flex-col justify-between ${
                query === tmpl.query
                  ? 'bg-emerald-950/70 border-emerald-500/80 text-white shadow-sm'
                  : 'bg-[#101621] border-[#1d2636] text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <span className="font-semibold text-emerald-400 block mb-1">{tmpl.label}</span>
              <span className="text-[11px] text-slate-400 leading-snug line-clamp-2">{tmpl.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Query Editor Box */}
      <div className="bg-[#101621] border border-[#1d2636] rounded overflow-hidden">
        <div className="px-3 py-2 bg-[#0c1017] border-b border-[#1d2636] flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400 text-[11px]">
            Selected Query / Template: <strong className="text-emerald-400">{query}</strong>
          </span>
          <span className="text-slate-500 text-[11px]">Press Ctrl + Enter to run</span>
        </div>
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter authorized query template name or matching Cypher..."
          className="w-full bg-[#0a0f16] px-3 py-2.5 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none resize-y"
          spellCheck={false}
        />
        <div className="px-3 py-2 bg-[#0c1017] border-t border-[#1d2636] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Read-only execution: DDL, DML, and write operations are strictly rejected.</span>
          </div>
          <Button
            size="sm"
            variant="success"
            icon={Play}
            loading={loading}
            onClick={handleExecute}
          >
            Execute Template
          </Button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="font-mono leading-relaxed">{error}</div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white">Results ({result.template || 'Live Execution'})</span>
              <span className="flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {result.rowCount} records returned
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
                Query executed successfully. 0 records returned.
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
                            <span className="text-slate-600 italic">null</span>
                          ) : Array.isArray(row[col]) ? (
                            <span className="text-cyan-400">[{row[col].join(', ')}]</span>
                          ) : typeof row[col] === 'object' ? (
                            JSON.stringify(row[col])
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
