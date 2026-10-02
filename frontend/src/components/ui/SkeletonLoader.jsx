import React from 'react';

/**
 * Base atomic Skeleton block with smooth pulse shimmer.
 */
export function Skeleton({
  className = '',
  isDark = true,
  circle = false,
  width,
  height,
}) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      style={style}
      className={`animate-pulse ${
        circle ? 'rounded-full' : 'rounded-xl'
      } ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/80'} ${className}`}
    />
  );
}

/**
 * Card skeleton with header and content lines.
 */
export function CardSkeleton({ isDark = true, lines = 3, className = '' }) {
  return (
    <div
      className={`p-6 rounded-2xl border space-y-4 ${
        isDark ? 'bg-[#0e121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
      } ${className}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/30">
        <div className="flex items-center gap-3">
          <Skeleton isDark={isDark} className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton isDark={isDark} className="h-5 w-36" />
            <Skeleton isDark={isDark} className="h-3 w-24" />
          </div>
        </div>
        <Skeleton isDark={isDark} className="h-8 w-20 rounded-lg" />
      </div>

      <div className="space-y-2.5 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            isDark={isDark}
            className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Grid of StatCard skeletons.
 */
export function StatCardsGridSkeleton({ count = 4, isDark = true, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-5 rounded-2xl border space-y-3 ${
            isDark ? 'bg-[#0e121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <Skeleton isDark={isDark} className="h-4 w-24" />
            <Skeleton isDark={isDark} className="w-8 h-8 rounded-xl" />
          </div>
          <Skeleton isDark={isDark} className="h-8 w-20 rounded-lg" />
          <Skeleton isDark={isDark} className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table skeleton with customizable rows and columns.
 */
export function TableSkeleton({ rows = 5, cols = 4, isDark = true, className = '' }) {
  return (
    <div
      className={`rounded-2xl border overflow-hidden ${
        isDark ? 'bg-[#0e121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
      } ${className}`}
    >
      <div
        className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50'
        }`}
      >
        <Skeleton isDark={isDark} className="h-5 w-40" />
        <Skeleton isDark={isDark} className="h-8 w-28 rounded-lg" />
      </div>
      <div className="p-4 divide-y divide-slate-800/30">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="py-3.5 flex items-center justify-between gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                isDark={isDark}
                className={`h-4 ${c === 0 ? 'w-1/4' : 'w-1/6'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * List skeleton for activity feeds or timeline items.
 */
export function ListSkeleton({ count = 4, isDark = true, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-4 rounded-xl border flex items-center gap-4 ${
            isDark ? 'bg-[#0e121d]/60 border-slate-800/60' : 'bg-white border-slate-200'
          }`}
        >
          <Skeleton isDark={isDark} className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton isDark={isDark} className="h-4 w-1/3" />
            <Skeleton isDark={isDark} className="h-3 w-2/3" />
          </div>
          <Skeleton isDark={isDark} className="h-6 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}
