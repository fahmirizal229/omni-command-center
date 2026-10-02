import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Metric & Telemetry StatCard with glowing accents, icons, delta indicators, and loading skeleton.
 */
export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'cyan', // 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'blue' | 'indigo'
  trend = null, // 'up' | 'down' | 'neutral'
  trendText,
  badge,
  badgeVariant = 'default',
  loading = false,
  isDark = true,
  onClick,
  className = '',
}) {
  const colorMap = {
    cyan: {
      bg: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
      border: isDark ? 'border-cyan-500/20' : 'border-cyan-200',
      text: isDark ? 'text-cyan-400' : 'text-cyan-600',
      glow: isDark ? 'group-hover:border-cyan-500/40 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.12)]' : 'group-hover:border-cyan-300 group-hover:shadow-md',
      bar: 'bg-cyan-500',
    },
    emerald: {
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      border: isDark ? 'border-emerald-500/20' : 'border-emerald-200',
      text: isDark ? 'text-emerald-400' : 'text-emerald-600',
      glow: isDark ? 'group-hover:border-emerald-500/40 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]' : 'group-hover:border-emerald-300 group-hover:shadow-md',
      bar: 'bg-emerald-500',
    },
    violet: {
      bg: isDark ? 'bg-violet-500/10' : 'bg-violet-50',
      border: isDark ? 'border-violet-500/20' : 'border-violet-200',
      text: isDark ? 'text-violet-400' : 'text-violet-600',
      glow: isDark ? 'group-hover:border-violet-500/40 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]' : 'group-hover:border-violet-300 group-hover:shadow-md',
      bar: 'bg-violet-500',
    },
    amber: {
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      border: isDark ? 'border-amber-500/20' : 'border-amber-200',
      text: isDark ? 'text-amber-400' : 'text-amber-600',
      glow: isDark ? 'group-hover:border-amber-500/40 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.12)]' : 'group-hover:border-amber-300 group-hover:shadow-md',
      bar: 'bg-amber-500',
    },
    rose: {
      bg: isDark ? 'bg-rose-500/10' : 'bg-rose-50',
      border: isDark ? 'border-rose-500/20' : 'border-rose-200',
      text: isDark ? 'text-rose-400' : 'text-rose-600',
      glow: isDark ? 'group-hover:border-rose-500/40 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.12)]' : 'group-hover:border-rose-300 group-hover:shadow-md',
      bar: 'bg-rose-500',
    },
    blue: {
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      border: isDark ? 'border-blue-500/20' : 'border-blue-200',
      text: isDark ? 'text-blue-400' : 'text-blue-600',
      glow: isDark ? 'group-hover:border-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.12)]' : 'group-hover:border-blue-300 group-hover:shadow-md',
      bar: 'bg-blue-500',
    },
    indigo: {
      bg: isDark ? 'bg-indigo-500/10' : 'bg-indigo-50',
      border: isDark ? 'border-indigo-500/20' : 'border-indigo-200',
      text: isDark ? 'text-indigo-400' : 'text-indigo-600',
      glow: isDark ? 'group-hover:border-indigo-500/40 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]' : 'group-hover:border-indigo-300 group-hover:shadow-md',
      bar: 'bg-indigo-500',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;
  const isClickable = Boolean(onClick);

  if (loading) {
    return (
      <div
        className={`p-5 rounded-2xl border ${
          isDark ? 'bg-[#0e121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
        } space-y-3 animate-pulse ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className={`h-4 w-24 rounded-md ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        </div>
        <div className={`h-8 w-28 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
        <div className={`h-3 w-36 rounded-md ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`} />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
        isDark
          ? 'bg-[#0e121d] border-slate-800/80 text-slate-100 hover:bg-[#111625]'
          : 'bg-white border-slate-200 text-slate-900 shadow-xs hover:bg-slate-50/80'
      } ${scheme.glow} ${isClickable ? 'cursor-pointer hover:-translate-y-0.5' : ''} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span
          className={`text-xs sm:text-sm font-medium tracking-wide ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-110 ${scheme.bg} ${scheme.border} ${scheme.text}`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <h3 className={`text-2xl sm:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </h3>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              badgeVariant === 'success'
                ? isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                : badgeVariant === 'warning'
                ? isDark ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                : badgeVariant === 'danger'
                ? isDark ? 'bg-rose-500/20 text-rose-300' : 'bg-rose-100 text-rose-800'
                : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed border-slate-800/40 text-xs">
          {trend && (
            <span
              className={`flex items-center gap-0.5 font-semibold ${
                trend === 'up'
                  ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                  : trend === 'down'
                  ? isDark ? 'text-rose-400' : 'text-rose-600'
                  : isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              {trendText}
            </span>
          )}
          {subtext && (
            <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} truncate`}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
