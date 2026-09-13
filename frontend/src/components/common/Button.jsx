import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  className = ''
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
    outline: 'border border-slate-700 hover:bg-slate-800 text-slate-300',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white border border-rose-600',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500',
    designer: 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500',
    dba: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2'
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      {children}
    </button>
  );
}
