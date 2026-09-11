import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', title = '', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    let defaultTitle = 'Informasi';
    if (type === 'error') defaultTitle = 'Error';
    if (type === 'success') defaultTitle = 'Berhasil';
    if (type === 'warning') defaultTitle = 'Peringatan';

    const newToast = {
      id,
      message,
      type,
      title: title || defaultTitle,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0 z-[999999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-[calc(100%-2rem)] sm:w-full">
        {toasts.map((toast) => {
          let borderClass = 'border-zinc-800';
          let bgIconClass = 'bg-zinc-800 text-zinc-300 border-zinc-700';
          let IconComponent = Info;
          let barColor = 'bg-zinc-400';

          if (toast.type === 'error') {
            borderClass = 'border-rose-500/40 shadow-rose-950/20';
            bgIconClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            IconComponent = AlertCircle;
            barColor = 'bg-rose-500';
          } else if (toast.type === 'success') {
            borderClass = 'border-emerald-500/30 shadow-emerald-950/10';
            bgIconClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            IconComponent = CheckCircle2;
            barColor = 'bg-emerald-500';
          } else if (toast.type === 'warning') {
            borderClass = 'border-amber-500/30 shadow-amber-950/10';
            bgIconClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            IconComponent = AlertTriangle;
            barColor = 'bg-amber-500';
          }

          return (
            <div
              key={toast.id}
              className={`relative overflow-hidden pointer-events-auto w-full bg-[#121215]/95 backdrop-blur-xl border ${borderClass} rounded-xl p-3.5 shadow-2xl transition-all duration-300 toast-enter flex items-start space-x-3`}
            >
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${bgIconClass}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="font-semibold text-xs text-zinc-100 tracking-tight">{toast.title}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                type="button"
                className="shrink-0 p-1 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
                onClick={() => dismissToast(toast.id)}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {toast.duration > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-800">
                  <div
                    className={`h-full ${barColor} transition-all ease-linear`}
                    style={{
                      width: '100%',
                      animation: `shrinkWidth ${toast.duration}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
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
