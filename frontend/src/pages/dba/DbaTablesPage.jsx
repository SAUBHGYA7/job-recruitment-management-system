import React, { useState, useEffect } from 'react';
import { Table, Search, Eye, Database, Columns, Key, Link2, SlidersHorizontal, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function DbaTablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetails, setTableDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'columns' | 'constraints'

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dba/tables');
      if (res.data?.data) {
        setTables(res.data.data);
        if (!selectedTable && res.data.data.length > 0) {
          inspectTable(res.data.data.find(t => t.tableName === 'CANDIDATE') || res.data.data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const inspectTable = async (tbl) => {
    setSelectedTable(tbl);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/dba/tables/${tbl.tableName}/data`);
      if (res.data?.data) {
        setTableDetails(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredTables = tables.filter(t =>
    t.tableName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            DBA Table Explorer &amp; Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query tables dynamically from Oracle dictionary (<code className="text-slate-300">USER_TABLES</code>).
          </p>
        </div>
        <Button size="sm" variant="outline" icon={RefreshCw} onClick={fetchTables}>
          Refresh Tables
        </Button>
      </div>

      {loading ? (
        <Loader text="Loading Oracle tables..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Table List */}
          <div className="lg:col-span-4 panel overflow-hidden flex flex-col h-[700px]">
            <div className="p-2.5 bg-slate-950 border-b border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter tables..."
                  className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60">
              {filteredTables.map((tbl) => {
                const isSelected = selectedTable?.tableName === tbl.tableName;
                return (
                  <button
                    key={tbl.tableName}
                    onClick={() => inspectTable(tbl)}
                    className={`w-full text-left p-2.5 flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? 'bg-emerald-950/60 text-white font-semibold border-l-2 border-emerald-400'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="font-mono truncate">{tbl.tableName}</div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 shrink-0">
                      <span>{tbl.columnCount} cols</span>
                      <span className="text-slate-400 font-bold">{tbl.rowCount} rows</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected Table Details & Data Viewer */}
          <div className="lg:col-span-8 panel overflow-hidden flex flex-col h-[700px]">
            {selectedTable && (
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{selectedTable.tableName}</span>
                    <Badge variant="success">{selectedTable.rowCount} rows</Badge>
                    <Badge variant="default">{selectedTable.columnCount} columns</Badge>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 text-xs bg-slate-900 border border-slate-800 rounded p-0.5">
                  <button
                    onClick={() => setActiveTab('data')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'data' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    View Data
                  </button>
                  <button
                    onClick={() => setActiveTab('columns')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'columns' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Columns ({tableDetails?.columns?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('constraints')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      activeTab === 'constraints' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Constraints ({tableDetails?.constraints?.length || 0})
                  </button>
                </div>
              </div>
            )}

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-3">
              {loadingDetails ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  Loading table data from Oracle...
                </div>
              ) : !tableDetails ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Select a table from the list to inspect.
                </div>
              ) : activeTab === 'data' ? (
                /* Data View */
                <div>
                  {tableDetails.rows?.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 font-mono">
                      Table {selectedTable.tableName} contains 0 rows in Oracle.
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {Object.keys(tableDetails.rows[0]).map((col) => (
                              <th key={col} className="font-mono">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableDetails.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="font-mono text-xs whitespace-nowrap">
                                  {val === null || val === undefined ? (
                                    <span className="text-slate-600 italic">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : activeTab === 'columns' ? (
                /* Columns View */
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th>Length / Precision</th>
                        <th>Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableDetails.columns?.map((c) => (
                        <tr key={c.COLUMN_NAME} className="font-mono text-xs">
                          <td className="font-bold text-white">{c.COLUMN_NAME}</td>
                          <td className="text-blue-400">{c.DATA_TYPE}</td>
                          <td className="text-slate-400">
                            {c.DATA_PRECISION ? `(${c.DATA_PRECISION}, ${c.DATA_SCALE || 0})` : `(${c.DATA_LENGTH})`}
                          </td>
                          <td>
                            <span className={c.NULLABLE === 'N' ? 'text-rose-400 font-semibold' : 'text-slate-500'}>
                              {c.NULLABLE === 'N' ? 'NOT NULL' : 'NULL'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Constraints View */
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Constraint Name</th>
                        <th>Type</th>
                        <th>Details / Rule</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableDetails.constraints?.map((ct) => (
                        <tr key={ct.CONSTRAINT_NAME} className="font-mono text-xs">
                          <td className="font-bold text-white">{ct.CONSTRAINT_NAME}</td>
                          <td>
                            <Badge
                              variant={
                                ct.CONSTRAINT_TYPE === 'P'
                                  ? 'success'
                                  : ct.CONSTRAINT_TYPE === 'R'
                                  ? 'purple'
                                  : 'amber'
                              }
                            >
                              {ct.CONSTRAINT_TYPE === 'P'
                                ? 'PRIMARY KEY'
                                : ct.CONSTRAINT_TYPE === 'R'
                                ? 'FOREIGN KEY'
                                : 'CHECK'}
                            </Badge>
                          </td>
                          <td className="text-slate-400 truncate max-w-md">
                            {ct.SEARCH_CONDITION || ct.R_CONSTRAINT_NAME || '-'}
                          </td>
                          <td>
                            <span className="text-emerald-400 font-semibold">{ct.STATUS}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
