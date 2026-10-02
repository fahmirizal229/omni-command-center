import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X, KeyRound, Sparkles } from 'lucide-react';

const ToastContext = createContext(null);

function ToastItem({ toast, index, total, isHovered, onDismiss }) {
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Icon & styling resolution
  let borderClass = 'border-slate-800/90 dark:border-slate-800/90 light:border-slate-200/90 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)]';
  let bgIconClass = 'bg-slate-800/60 text-slate-300 border-slate-700/60';
  let IconComponent = Info;
  let barColor = 'bg-slate-400';

  if (toast.type === 'session') {
    borderClass = 'border-indigo-500/40 dark:border-indigo-500/40 shadow-[0_16px_40px_-10px_rgba(99,102,241,0.25)]';
    bgIconClass = 'bg-indigo-500/15 text-indigo-400 dark:text-indigo-300 border-indigo-500/30';
    IconComponent = KeyRound;
    barColor = 'bg-gradient-to-r from-indigo-500 to-violet-500';
  } else if (toast.type === 'error') {
    borderClass = 'border-rose-500/30 dark:border-rose-500/40 shadow-[0_16px_40px_-10px_rgba(244,63,94,0.2)]';
    bgIconClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    IconComponent = AlertCircle;
    barColor = 'bg-rose-500';
  } else if (toast.type === 'success') {
    borderClass = 'border-emerald-500/30 dark:border-emerald-500/40 shadow-[0_16px_40px_-10px_rgba(165,243,209,0.2)]';
    bgIconClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    IconComponent = CheckCircle2;
    barColor = 'bg-emerald-500';
  } else if (toast.type === 'warning') {
    borderClass = 'border-amber-500/30 dark:border-amber-500/40 shadow-[0_16px_40px_-10px_rgba(245,158,11,0.2)]';
    bgIconClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    IconComponent = AlertTriangle;
    barColor = 'bg-amber-500';
  } else if (toast.type === 'info') {
    borderClass = 'border-indigo-500/30 dark:border-indigo-500/30 shadow-[0_16px_40px_-10px_rgba(99,102,241,0.18)]';
    bgIconClass = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
    IconComponent = Sparkles;
    barColor = 'bg-indigo-500';
  }

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  }, [onDismiss, toast.id]);

  // Touch Swipe-to-Dismiss handlers
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;
    if (delta > 0) {
      setTouchDeltaX(delta);
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaX > 75) {
      handleDismiss();
    } else {
      setTouchDeltaX(0);
    }
    setTouchStartX(null);
  };

  // Stacked card physics calculations
  // Newest item is index 0
  const isTop = index === 0;
  const isStacked = !isHovered && total > 1;

  let stackStyles = {};
  if (isStacked) {
    if (index === 0) {
      stackStyles = {
        transform: `translate3d(${touchDeltaX}px, 0px, 0px) scale(1)`,
        opacity: 1 - touchDeltaX / 200,
        zIndex: 50,
      };
    } else if (index === 1) {
      stackStyles = {
        transform: 'translate3d(0px, 12px, 0px) scale(0.95)',
        opacity: 0.85,
        zIndex: 40,
        pointerEvents: 'none',
      };
    } else if (index === 2) {
      stackStyles = {
        transform: 'translate3d(0px, 22px, 0px) scale(0.90)',
        opacity: 0.65,
        zIndex: 30,
        pointerEvents: 'none',
      };
    } else {
      stackStyles = {
        transform: 'translate3d(0px, 30px, 0px) scale(0.85)',
        opacity: 0,
        zIndex: 20,
        pointerEvents: 'none',
      };
    }
  } else {
    stackStyles = {
      transform: `translate3d(${touchDeltaX}px, 0px, 0px) scale(1)`,
      opacity: 1 - touchDeltaX / 200,
      zIndex: 50 - index,
    };
  }

  if (isExiting) {
    stackStyles = {
      ...stackStyles,
      transform: 'translate3d(100%, 0px, 0px) scale(0.92)',
      opacity: 0,
    };
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={stackStyles}
      className={`relative overflow-hidden pointer-events-auto w-full bg-[#10131c]/95 dark:bg-[#10131c]/95 light:bg-white/95 backdrop-blur-2xl border ${borderClass} rounded-2xl p-4 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-start space-x-3.5 shadow-2xl select-none`}
    >
      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${bgIconClass}`}>
        <IconComponent className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 tracking-tight">
            {toast.title}
          </p>
          {total > 1 && isTop && !isHovered && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
              +{total - 1} more
            </span>
          )}
        </div>
        <p className="text-[12px] text-slate-300 dark:text-slate-300 light:text-slate-600 mt-0.5 leading-relaxed break-words font-normal">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss toast"
        className="shrink-0 p-1 text-slate-400 hover:text-white dark:hover:text-white light:hover:text-slate-900 rounded-lg hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100 transition-colors active:scale-90"
        onClick={(e) => {
          e.stopPropagation();
          handleDismiss();
        }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800/60 dark:bg-slate-800/60 light:bg-slate-200">
          <div
            className={`h-full ${barColor} transition-all ease-linear`}
            style={{
              width: '100%',
              animation: `shrinkWidth ${toast.duration}ms linear forwards`,
              animationPlayState: isHovered ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const toastTimersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (toastTimersRef.current.has(id)) {
      clearTimeout(toastTimersRef.current.get(id));
      toastTimersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback((message, type = 'info', title = '', duration = 4500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    let defaultTitle = 'Notification';
    if (type === 'error') defaultTitle = 'Action Failed';
    if (type === 'success') defaultTitle = 'Success';
    if (type === 'warning') defaultTitle = 'Notice';
    if (type === 'session') defaultTitle = 'Session timed out';

    const newToast = {
      id,
      message,
      type,
      title: title || defaultTitle,
      duration,
      createdAt: Date.now(),
    };

    setToasts((prev) => [newToast, ...prev]);

    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      toastTimersRef.current.set(id, timer);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-[calc(100%-2.5rem)] sm:w-[380px]"
      >
        {toasts.map((toast, idx) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={idx}
            total={toasts.length}
            isHovered={isHovered}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
