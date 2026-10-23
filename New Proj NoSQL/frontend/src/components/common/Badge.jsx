import React from 'react';

export function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-blue-950 text-blue-300 border-blue-800',
    success: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    warning: 'bg-amber-950 text-amber-300 border-amber-800',
    danger: 'bg-rose-950 text-rose-300 border-rose-800',
    purple: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    amber: 'bg-amber-950 text-amber-300 border-amber-800'
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.2 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs'
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
}
