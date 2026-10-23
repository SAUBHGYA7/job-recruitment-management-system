import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-[#111722] border border-[#1f2939] rounded p-3.5 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-xl font-bold text-white font-mono">{value}</span>
      </div>
      {subtitle && (
        <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">{subtitle}</p>
      )}
    </div>
  );
}
