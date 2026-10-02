/**
 * @file ErrorBoundary.jsx
 * @description Industry-standard React Error Boundary component.
 * Catches JavaScript errors anywhere in child component trees, logs error details,
 * and renders a polished fallback UI instead of crashing the entire application.
 */

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled runtime error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = "overview";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 select-none">
          <div className="bg-[#121215] border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white">Terjadi Kesalahan Aplikasi / Application Error</h2>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Komponen ini mengalami error tak terduga. Silakan coba muat ulang atau kembali ke halaman utama.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-left overflow-x-auto text-[11px] font-mono text-rose-300/90 max-h-28">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ringkasan</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
