import React from 'react';
import { Loader2 } from 'lucide-react';
import { playClickSound } from '../../utils/soundEffects';

/**
 * Interactive Button component with loading spinner, variants, sizes, and sound effects.
 */
export function Button({
  children,
  onClick,
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'glass'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
  icon: Icon,
  trailingIcon: TrailingIcon,
  loading = false,
  disabled = false,
  playSound = true,
  isDark = true,
  className = '',
  type = 'button',
  ...props
}) {
  const handleClick = (e) => {
    if (disabled || loading) return;
    if (playSound) {
      try {
        playClickSound();
      } catch (_) {}
    }
    if (onClick) onClick(e);
  };

  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 rounded-lg gap-1.5 font-medium',
    sm: 'text-xs px-3.5 py-1.5 rounded-xl gap-2 font-medium',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 font-medium',
    lg: 'text-base px-6 py-2.5 rounded-2xl gap-2.5 font-semibold',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const variantClasses = {
    primary:
      'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20 active:scale-[0.98]',
    secondary: isDark
      ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:scale-[0.98]'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 active:scale-[0.98]',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 active:scale-[0.98]',
    outline: isDark
      ? 'border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800/50 active:scale-[0.98]'
      : 'border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 active:scale-[0.98]',
    ghost: isDark
      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60 active:scale-[0.98]'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-[0.98]',
    glass: isDark
      ? 'bg-slate-900/60 backdrop-blur-md border border-slate-800 text-slate-100 hover:bg-slate-800/80 active:scale-[0.98]'
      : 'bg-white/80 backdrop-blur-md border border-slate-200 text-slate-900 hover:bg-white active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${iconSizes[size] || iconSizes.md}`} />
      ) : (
        Icon && <Icon className={iconSizes[size] || iconSizes.md} />
      )}
      {children && <span>{children}</span>}
      {!loading && TrailingIcon && <TrailingIcon className={iconSizes[size] || iconSizes.md} />}
    </button>
  );
}
