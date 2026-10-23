import React from 'react';

export function Loader({ text = 'Loading data from Oracle Database...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-brand-500/20" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-400 animate-pulse">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
      {Icon && (
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-400 mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h4 className="text-base font-bold text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="text-xs font-semibold px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
