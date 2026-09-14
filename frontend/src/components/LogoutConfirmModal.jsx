import React from 'react';
import { LogOut, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * Custom Confirmation Modal for Logging Out.
 * Replaces native browser confirm dialog with a sleek dark-themed UI.
 * 
 * @param {{ isOpen: boolean, onClose: () => void, onConfirm: () => void }} props
 */
export function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="max-w-sm w-full bg-[#121215] border border-zinc-800/90 rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleUp text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Icon & Close */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shadow-inner shadow-rose-500/5">
            <LogOut className="w-6 h-6" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-zinc-100 tracking-tight">
            {t('logout_modal_title', 'Konfirmasi Keluar')}
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {t('logout_modal_desc', 'Apakah kamu yakin ingin keluar dari sesi dashboard? Kamu perlu memasukkan kredensial login kembali untuk mengakses workspace.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-800 hover:text-white border border-zinc-700/60 transition-colors"
          >
            {t('cancel', 'Batal')}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/50 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('btn_logout', 'Keluar')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
