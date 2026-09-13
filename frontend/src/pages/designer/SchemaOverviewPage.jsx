import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Database, Layers } from 'lucide-react';
import api from '../../services/api';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';

export default function SchemaOverviewPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        setLoading(true);
        const res = await api.get('/designer/normalization');
        if (res.data?.data) {
          setDocs(res.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  if (loading) return <Loader text="Loading normalization & BCNF proofs..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-white tracking-tight">BCNF Normalization &amp; FD Analysis</h2>
          <Badge variant="success">DA1 Proofs Verified</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Academic analysis and justification for all schema decomposition decisions according to DBMS principles.
        </p>
      </div>

      {/* Core Principle Alert */}
      <div className="p-5 rounded-3xl bg-brand-950/40 border border-brand-500/30 glass-panel flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-brand-400 shrink-0 mt-1" />
        <div>
          <h3 className="text-sm font-bold text-white">Hybrid Academic Normalization Principle (DA1 / DA2)</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Decomposition is applied <strong>only</strong> where Functional Dependency (FD) and BCNF analysis proves an anomaly or redundancy (e.g., partial or transitive dependencies). Relations without non-trivial dependency violations (such as <code className="text-brand-300">Dependent</code>, <code className="text-brand-300">Freelancer</code>, <code className="text-brand-300">Fresher</code>, <code className="text-brand-300">Experienced</code>) are preserved intact.
          </p>
        </div>
      </div>

      {/* Normalization Cards */}
      <div className="space-y-6">
        {docs.map((doc, idx) => (
          <div
            key={idx}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 glass-panel space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-designer-600/20 text-designer-400 font-mono font-bold flex items-center justify-center text-xs">
                  0{idx + 1}
                </span>
                <h3 className="text-base font-bold text-white">{doc.entity} Normalization Analysis</h3>
              </div>
              <Badge variant="success">{doc.bcnfStatus}</Badge>
            </div>

            {/* Initial Relation */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Initial Relation:</span>
              <p className="font-mono text-xs text-amber-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800 mt-1">
                {doc.initialRelation}
              </p>
            </div>

            {/* Functional Dependencies Identified */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Identified Functional Dependencies:</span>
              <ul className="mt-1 space-y-1">
                {doc.fdList.map((fd, fIdx) => (
                  <li key={fIdx} className="font-mono text-xs text-brand-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                    • {fd}
                  </li>
                ))}
              </ul>
            </div>

            {/* Dependency Problem Description */}
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/20 text-xs text-rose-200">
              <strong className="text-rose-400">Violation:</strong> {doc.problem}
            </div>

            {/* Final Normalized Tables */}
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Final BCNF Decomposed Tables:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                {doc.decomposedTables.map((dt, dIdx) => (
                  <div key={dIdx} className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {dt.name}
                    </span>
                    <p className="font-mono text-[11px] text-slate-300">{dt.schema}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
