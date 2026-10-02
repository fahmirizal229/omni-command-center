import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Radio,
  ExternalLink,
  Download,
  Loader2,
  Waves,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ShakemapModal({
  isOpen,
  onClose,
  quake,
  isDark = true,
}) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Close on Escape key & lock scroll
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

  // Reset loading state when quake/url changes
  useEffect(() => {
    if (isOpen) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [isOpen, quake?.shakemap_url]);

  const shakemapUrl = quake?.shakemap_url || '';
  const impact = quake?.impact || {
    impact_title: 'Safe (Not Felt)',
    mmi_label: 'I MMI',
    impact_desc: 'Too far away to be felt in Surabaya.',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && quake && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 450, damping: 32 }}
            className={`max-w-2xl w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all max-h-[92vh] ${
              isDark
                ? 'bg-[#0e121c] border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-100'
                : 'bg-white border-slate-300 shadow-2xl text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDark ? 'border-slate-800 bg-[#080b12]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500 text-white shadow-xs">
                  M {quake.magnitude}
                </span>
                <h3 className="text-sm font-bold truncate">Earthquake Shakemap</h3>
              </div>
              <p className={`text-[11px] font-mono truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {quake.tanggal} • {quake.jam} • Depth {quake.depth}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 ml-3">
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Shakemap Image Viewer */}
        <div className={`p-4 sm:p-5 overflow-y-auto flex flex-col items-center justify-center min-h-[280px] max-h-[60vh] relative ${
          isDark ? 'bg-[#090c14]' : 'bg-slate-100/60'
        }`}>
          {/* Loading Spinner */}
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2.5 font-mono text-xs text-slate-400 z-10">
              <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
              <span>Loading earthquake shakemap...</span>
            </div>
          )}

          {/* Shakemap Image */}
          {shakemapUrl && !imageError ? (
            <div className="relative rounded-xl overflow-hidden border border-inherit shadow-md max-w-full">
              <img
                src={shakemapUrl}
                alt={`BMKG Shakemap M ${quake.magnitude} - ${quake.wilayah}`}
                className={`max-w-full max-h-[52vh] object-contain rounded-xl transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-2 font-mono text-xs text-slate-400">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-1" />
              <p className="font-semibold text-slate-300">Shakemap Not Available</p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                A visual shaking map has not been published for this earthquake yet.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer: Episentrum & Surabaya Impact */}
        <div
          className={`px-5 py-3.5 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-[#080b12] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="font-bold truncate max-w-sm" title={quake.wilayah}>
                {quake.wilayah}
              </span>
            </div>
            <p className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Distance to Surabaya: <strong className="text-sky-400">± {quake.distance_km} km</strong> • Surabaya Impact: <strong className="text-emerald-400">{impact.impact_title}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {shakemapUrl && !imageError && (
              <a
                href={shakemapUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer active:scale-95 ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
                title="Open full resolution image"
              >
                <span>Full HD</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all active:scale-95 cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>,
document.body
);
}
