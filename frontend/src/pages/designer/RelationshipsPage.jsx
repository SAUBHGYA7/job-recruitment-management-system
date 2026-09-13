import React, { useState, useEffect } from 'react';
import { GitFork, Layers, Key, Link2, ArrowRight, Table, Sparkles, Filter } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function RelationshipsPage() {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filterGroup, setFilterGroup] = useState('ALL');
  const { addToast } = useToast();

  useEffect(() => {
    async function fetchRelationships() {
      try {
        setLoading(true);
        const res = await api.get('/designer/relationships');
        if (res.data?.data) {
          setSchema(res.data.data);
          if (res.data.data.nodes?.length > 0) {
            setSelectedNode(res.data.data.nodes.find(n => n.id === 'CANDIDATE') || res.data.data.nodes[0]);
          }
        }
      } catch {
        addToast('Failed to load relationship graph', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchRelationships();
  }, []);

  if (loading) return <Loader text="Constructing relational schema graph from Oracle metadata..." />;
  if (!schema) return <div className="text-center text-slate-400 p-8">No schema graph available.</div>;

  const filteredNodes = schema.nodes.filter(
    n => filterGroup === 'ALL' || n.group === filterGroup
  );

  const incomingEdges = schema.edges.filter(e => e.to === selectedNode?.id);
  const outgoingEdges = schema.edges.filter(e => e.from === selectedNode?.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-white tracking-tight">Interactive Entity-Relationship Viewer</h2>
            <Badge variant="purple">{schema.nodes.length} Schema Nodes</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual structural mapping faithful to the DA1 Relational Schema &amp; BCNF decomposition
          </p>
        </div>

        {/* Group Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-designer-500"
          >
            <option value="ALL">All Categories ({schema.nodes.length})</option>
            <option value="entity">Core Entities</option>
            <option value="decomposed">Decomposed (BCNF)</option>
            <option value="relationship">M:N Relationships</option>
            <option value="subtype">Candidate Subtypes</option>
            <option value="security">Security &amp; RBAC</option>
          </select>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Schema Nodes Grid */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-designer-400" />
              Relational Tables
            </h3>
            <span className="text-[11px] text-slate-500">Click any table to inspect foreign references</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredNodes.map((n) => {
              const isSelected = selectedNode?.id === n.id;
              const groupColors = {
                entity: 'border-brand-500/40 hover:border-brand-400 text-brand-300',
                decomposed: 'border-designer-500/40 hover:border-designer-400 text-designer-300',
                relationship: 'border-amber-500/40 hover:border-amber-400 text-amber-300',
                subtype: 'border-emerald-500/40 hover:border-emerald-400 text-emerald-300',
                security: 'border-rose-500/40 hover:border-rose-400 text-rose-300'
              };

              return (
                <button
                  key={n.id}
                  onClick={() => setSelectedNode(n)}
                  className={`p-3 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-designer-600/20 border-designer-400 shadow-lg shadow-designer-600/20 ring-1 ring-designer-400'
                      : 'bg-slate-950/80 hover:bg-slate-800/60 ' + groupColors[n.group]
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-mono text-xs font-bold text-white truncate">{n.label}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-semibold">
                      {n.group}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{n.columnCount} cols</span>
                    <span>{n.rowCount} rows</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Node Inspector */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel flex flex-col justify-between space-y-6">
          {selectedNode ? (
            <div>
              <div className="border-b border-slate-800 pb-4 mb-4">
                <span className="text-[10px] font-bold text-designer-400 uppercase tracking-wider font-mono">
                  {selectedNode.group} Relation
                </span>
                <h3 className="text-xl font-black text-white font-mono mt-0.5">{selectedNode.label}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedNode.columns?.length} columns • {selectedNode.rowCount} rows in Oracle
                </p>
              </div>

              {/* Columns List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">Columns Schema:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedNode.columns?.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        {c.isPk && <Key className="w-3 h-3 text-emerald-400 shrink-0" />}
                        {c.name}
                      </span>
                      <span className="text-[10px] text-brand-400 font-bold">{c.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outgoing References */}
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                  References (Foreign Keys Out):
                </h4>
                {outgoingEdges.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No outgoing foreign keys.</p>
                ) : (
                  <div className="space-y-1.5">
                    {outgoingEdges.map((e, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between font-mono"
                      >
                        <span className="text-indigo-300">{e.label}</span>
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          {e.to}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Incoming References */}
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-emerald-400" />
                  Referenced By (Children):
                </h4>
                {incomingEdges.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No child tables reference this relation.</p>
                ) : (
                  <div className="space-y-1.5">
                    {incomingEdges.map((e, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] flex items-center justify-between font-mono"
                      >
                        <span className="text-emerald-300 font-bold">{e.from}</span>
                        <span className="text-slate-500">via {e.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">Select a table to inspect.</p>
          )}
        </div>
      </div>
    </div>
  );
}
