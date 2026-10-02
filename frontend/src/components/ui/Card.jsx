import React from 'react';

/**
 * Reusable Card container component with dark/light mode and glassmorphic styling.
 */
export function Card({
  children,
  className = '',
  variant = 'default', // 'default' | 'glass' | 'glow' | 'flat' | 'gradient'
  isDark = true,
  hoverEffect = false,
  glowColor = 'cyan', // 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'blue'
  onClick,
  ...props
}) {
  const glowStyles = {
    cyan: isDark ? 'hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'hover:border-cyan-400 hover:shadow-md',
    emerald: isDark ? 'hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'hover:border-emerald-400 hover:shadow-md',
    violet: isDark ? 'hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'hover:border-violet-400 hover:shadow-md',
    amber: isDark ? 'hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'hover:border-amber-400 hover:shadow-md',
    rose: isDark ? 'hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'hover:border-rose-400 hover:shadow-md',
    blue: isDark ? 'hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'hover:border-blue-400 hover:shadow-md',
  };

  const variantStyles = {
    default: isDark
      ? 'bg-[#0e121d] border-slate-800/80 text-slate-100'
      : 'bg-white border-slate-200/90 text-slate-900 shadow-sm',
    glass: isDark
      ? 'bg-[#0e121d]/70 backdrop-blur-xl border-slate-800/70 text-slate-100 shadow-xl'
      : 'bg-white/80 backdrop-blur-xl border-slate-200/80 text-slate-900 shadow-sm',
    glow: isDark
      ? 'bg-[#0e121d] border-slate-800 text-slate-100 shadow-[0_0_25px_rgba(14,165,233,0.08)]'
      : 'bg-white border-slate-200 text-slate-900 shadow-md',
    flat: isDark
      ? 'bg-slate-900/50 border-transparent text-slate-100'
      : 'bg-slate-50 border-transparent text-slate-900',
    gradient: isDark
      ? 'bg-gradient-to-br from-[#0e121d] via-[#111625] to-[#0a0d14] border-slate-800/80 text-slate-100'
      : 'bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 text-slate-900 shadow-sm',
  };

  const hoverClass = hoverEffect
    ? `transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 ${glowStyles[glowColor] || glowStyles.cyan}`
    : 'transition-colors duration-200';

  return (
    <div
      className={`rounded-2xl border ${variantStyles[variant] || variantStyles.default} ${hoverClass} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', isDark = true, action = null }) {
  return (
    <div className={`p-5 sm:p-6 pb-4 flex items-center justify-between gap-4 border-b ${isDark ? 'border-slate-800/50' : 'border-slate-100'} ${className}`}>
      <div className="space-y-1 min-w-0 flex-1">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ children, className = '', isDark = true }) {
  return (
    <h3 className={`text-base sm:text-lg font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'} ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', isDark = true }) {
  return (
    <p className={`text-xs sm:text-sm font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'} ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '', isDark = true }) {
  return (
    <div className={`p-4 sm:p-5 pt-3 border-t flex items-center justify-between gap-3 ${isDark ? 'border-slate-800/50 bg-slate-950/20' : 'border-slate-100 bg-slate-50/50'} rounded-b-2xl ${className}`}>
      {children}
    </div>
  );
}
