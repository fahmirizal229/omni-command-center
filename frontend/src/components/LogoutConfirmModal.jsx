import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Custom Responsive Confirmation Modal for Logging Out.
 * Follows the OMNI Design System with adaptive mobile bottom-sheet & Iris/Rose accents.
 * 
 * @param {{ isOpen: boolean, onClose: () => void, onConfirm: () => void }} props
 */
export function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const { t } = useLanguage();

  // Escape key listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className="w-full sm:max-w-sm bg-[#ffffff] dark:bg-[#0e121c] border-t sm:border border-slate-200 dark:border-slate-800/90 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.8)] space-y-5 text-slate-900 dark:text-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle Ambient Red/Rose Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-rose-500/10 blur-[40px] pointer-events-none" />

            {/* Header with Icon & Close */}
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
                <LogOut className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight font-sans">
                {t("modal_logout_title") || "Sign out of gateway?"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                {t("modal_logout_desc") || "Your active session token will be invalidated. You will need your passkey to sign back in."}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-slate-950 dark:hover:text-white border border-slate-300 dark:border-slate-700/60 transition-colors cursor-pointer text-center"
              >
                {t("modal_logout_btn_cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirm();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-600/20 dark:shadow-[0_0_16px_rgba(244,63,94,0.3)] flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("modal_logout_btn_confirm") || "Sign Out"}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
