import React from 'react';

/**
 * Reusable StatusBadge with animated status dots, color presets, and customizable sizes.
 */
export function StatusBadge({
  status = 'neutral', // 'success' | 'warning' | 'error' | 'danger' | 'info' | 'neutral' | 'online' | 'offline' | 'running' | 'idle'
  label,
  icon: Icon,
  dot = true,
  pulse = false,
  size = 'sm', // 'xs' | 'sm' | 'md'
  variant = 'subtle', // 'subtle' | 'solid' | 'outline'
  isDark = true,
  className = '',
}) {
  const statusConfig = {
    success: {
      subtle: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      solid: 'bg-emerald-600 text-white border-transparent',
      outline: isDark ? 'border-emerald-500 text-emerald-400 bg-transparent' : 'border-emerald-600 text-emerald-700 bg-transparent',
      dotColor: 'bg-emerald-400',
      defaultLabel: 'Active',
    },
    online: {
      subtle: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      solid: 'bg-emerald-600 text-white border-transparent',
      outline: isDark ? 'border-emerald-500 text-emerald-400 bg-transparent' : 'border-emerald-600 text-emerald-700 bg-transparent',
      dotColor: 'bg-emerald-400',
      defaultLabel: 'Online',
    },
    running: {
      subtle: isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-700 border-cyan-200',
      solid: 'bg-cyan-600 text-white border-transparent',
      outline: isDark ? 'border-cyan-500 text-cyan-400 bg-transparent' : 'border-cyan-600 text-cyan-700 bg-transparent',
      dotColor: 'bg-cyan-400',
      defaultLabel: 'Running',
    },
    warning: {
      subtle: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
      solid: 'bg-amber-600 text-white border-transparent',
      outline: isDark ? 'border-amber-500 text-amber-400 bg-transparent' : 'border-amber-600 text-amber-700 bg-transparent',
      dotColor: 'bg-amber-400',
      defaultLabel: 'Warning',
    },
    idle: {
      subtle: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200',
      solid: 'bg-amber-600 text-white border-transparent',
      outline: isDark ? 'border-amber-500 text-amber-400 bg-transparent' : 'border-amber-600 text-amber-700 bg-transparent',
      dotColor: 'bg-amber-400',
      defaultLabel: 'Idle',
    },
    error: {
      subtle: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200',
      solid: 'bg-rose-600 text-white border-transparent',
      outline: isDark ? 'border-rose-500 text-rose-400 bg-transparent' : 'border-rose-600 text-rose-700 bg-transparent',
      dotColor: 'bg-rose-400',
      defaultLabel: 'Error',
    },
    danger: {
      subtle: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-700 border-rose-200',
      solid: 'bg-rose-600 text-white border-transparent',
      outline: isDark ? 'border-rose-500 text-rose-400 bg-transparent' : 'border-rose-600 text-rose-700 bg-transparent',
      dotColor: 'bg-rose-400',
      defaultLabel: 'Danger',
    },
    offline: {
      subtle: isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200',
      solid: 'bg-slate-600 text-white border-transparent',
      outline: isDark ? 'border-slate-700 text-slate-400 bg-transparent' : 'border-slate-300 text-slate-600 bg-transparent',
      dotColor: 'bg-slate-500',
      defaultLabel: 'Offline',
    },
    info: {
      subtle: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-700 border-blue-200',
      solid: 'bg-blue-600 text-white border-transparent',
      outline: isDark ? 'border-blue-500 text-blue-400 bg-transparent' : 'border-blue-600 text-blue-700 bg-transparent',
      dotColor: 'bg-blue-400',
      defaultLabel: 'Info',
    },
    neutral: {
      subtle: isDark ? 'bg-slate-800/80 text-slate-300 border-slate-700/60' : 'bg-slate-100 text-slate-700 border-slate-200',
      solid: 'bg-slate-700 text-white border-transparent',
      outline: isDark ? 'border-slate-700 text-slate-300 bg-transparent' : 'border-slate-300 text-slate-700 bg-transparent',
      dotColor: 'bg-slate-400',
      defaultLabel: 'Neutral',
    },
  };

  const current = statusConfig[status] || statusConfig.neutral;
  const styleVariant = current[variant] || current.subtle;

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
  };

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide whitespace-nowrap transition-colors ${sizeClasses[size] || sizeClasses.sm} ${styleVariant} ${className}`}
    >
      {dot && (
        <span className="relative flex items-center justify-center">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${current.dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${dotSizes[size] || dotSizes.sm} ${current.dotColor}`} />
        </span>
      )}
      {Icon && <Icon className={size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{label || current.defaultLabel}</span>
    </span>
  );
}
