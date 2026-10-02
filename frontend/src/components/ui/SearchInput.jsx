import React, { useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

/**
 * Polished SearchInput with leading icon, clear button, loading spinner, and shortcut indicator.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  shortcut,
  loading = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  isDark = true,
  autoFocus = false,
  className = '',
  ...props
}) {
  const inputRef = useRef(null);

  const sizeClasses = {
    sm: 'h-8 text-xs pl-8 pr-8 rounded-lg',
    md: 'h-10 text-sm pl-9 pr-9 rounded-xl',
    lg: 'h-12 text-base pl-11 pr-11 rounded-2xl',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5 left-2.5',
    md: 'w-4 h-4 left-3',
    lg: 'w-5 h-5 left-3.5',
  };

  const handleClear = () => {
    if (onClear) onClear();
    else if (onChange) onChange({ target: { value: '' } });
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {/* Leading Icon / Spinner */}
      <div
        className={`absolute pointer-events-none flex items-center justify-center ${
          iconSizes[size] || iconSizes.md
        } ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Search />
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={`w-full border transition-all duration-200 outline-hidden ${
          sizeClasses[size] || sizeClasses.md
        } ${
          isDark
            ? 'bg-[#0b0f19] border-slate-800 text-slate-100 placeholder-slate-500 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40 focus:bg-[#0e121d]'
            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white'
        }`}
        {...props}
      />

      {/* Trailing Clear Button or Shortcut */}
      <div className="absolute right-2.5 flex items-center gap-1">
        {value && !loading && (
          <button
            type="button"
            onClick={handleClear}
            className={`p-1 rounded-md transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {shortcut && !value && (
          <kbd
            className={`hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded border ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
          >
            {shortcut}
          </kbd>
        )}
      </div>
    </div>
  );
}
