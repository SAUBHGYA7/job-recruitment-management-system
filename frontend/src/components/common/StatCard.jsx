import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white font-mono">{value}</span>
      </div>
      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
}
