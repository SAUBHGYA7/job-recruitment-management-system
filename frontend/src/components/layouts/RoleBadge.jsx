import React from 'react';
import { User, Layers, ShieldCheck } from 'lucide-react';

export default function RoleBadge({ role, size = 'md' }) {
  const configs = {
    USER: {
      label: 'End User / Recruiter',
      shortLabel: 'USER',
      icon: User,
      classes: 'bg-brand-500/10 text-brand-400 border-brand-500/30'
    },
    DATABASE_DESIGNER: {
      label: 'Database Designer',
      shortLabel: 'DESIGNER',
      icon: Layers,
      classes: 'bg-designer-500/10 text-designer-400 border-designer-500/30'
    },
    DBA: {
      label: 'Database Administrator',
      shortLabel: 'DBA',
      icon: ShieldCheck,
      classes: 'bg-dba-500/10 text-dba-400 border-dba-500/30'
    }
  };

  const config = configs[role] || configs.USER;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${config.classes} ${sizeClasses[size]}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
}
