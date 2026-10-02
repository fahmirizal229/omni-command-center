import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playClickSound } from '../../utils/soundEffects';

/**
 * Accessible dialog Modal with backdrop blur, smooth animations, escape listener, and click-outside handling.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = 'cyan',
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  isDark = true,
  closeOnOutsideClick = true,
  closeOnEsc = true,
  className = '',
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-[95vw] h-[90vh]',
  };

  const iconColorStyles = {
    cyan: isDark ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-cyan-50 text-cyan-600 border-cyan-200',
    emerald: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    violet: isDark ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'bg-violet-50 text-violet-600 border-violet-200',
    amber: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
    rose: isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200',
    blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200',
  };

  const handleClose = () => {
    try {
      playClickSound();
    } catch (_) {}
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnOutsideClick ? handleClose : undefined}
            className={`fixed inset-0 backdrop-blur-md ${
              isDark ? 'bg-slate-950/75' : 'bg-slate-900/40'
            }`}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full ${sizeClasses[size] || sizeClasses.md} rounded-2xl border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] ${
              isDark
                ? 'bg-[#0e121d] border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            } ${className}`}
          >
            {/* Header */}
            {(title || Icon) && (
              <div
                className={`p-5 sm:p-6 pb-4 flex items-center justify-between gap-4 border-b shrink-0 ${
                  isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-100 bg-slate-50/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {Icon && (
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${
                        iconColorStyles[iconColor] || iconColorStyles.cyan
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h3
                        className={`text-lg font-semibold tracking-tight truncate ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {title}
                      </h3>
                    )}
                    {subtitle && (
                      <p
                        className={`text-xs sm:text-sm mt-0.5 truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className={`p-2 rounded-xl border transition-colors shrink-0 ${
                    isDark
                      ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>

            {/* Footer */}
            {footer && (
              <div
                className={`p-4 sm:p-5 pt-3 border-t flex items-center justify-end gap-3 shrink-0 ${
                  isDark
                    ? 'border-slate-800/80 bg-slate-950/40'
                    : 'border-slate-100 bg-slate-50/80'
                }`}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
