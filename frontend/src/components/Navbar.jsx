import React, { useState, useEffect } from 'react';
import { RefreshCw, KeyRound, LogOut, User, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

export function Navbar({ onRefresh, refreshing, onOpenChangePassword }) {
  const { username, logout } = useAuth();
  const { wsStatus } = useWebSocket();
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB');
      setDateStr(now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#0c0d11]/90 backdrop-blur-md border-b border-zinc-800 px-4 lg:px-8 py-3 flex items-center justify-between transition-all">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/70 flex items-center justify-center text-zinc-100 font-bold text-sm tracking-wide">
          AR
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5">
            Arusuka <span className="text-zinc-400 font-normal">Dashboard</span>
          </h1>
          <p className="text-[11px] text-zinc-400">Personal Workspace & Server Hub</p>
        </div>
      </div>

      {/* Center Live Status & Clock */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Realtime WS Indicator */}
        <div
          title={wsStatus === 'connected' ? 'WebSocket Realtime Aktif (Sinkron Otomatis Tanpa Refresh)' : 'Menghubungkan WebSocket...'}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
            wsStatus === 'connected'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : wsStatus === 'connecting'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {wsStatus === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === 'connected'
                  ? 'bg-emerald-500'
                  : wsStatus === 'connecting'
                  ? 'bg-amber-500'
                  : 'bg-zinc-500'
              }`}
            ></span>
          </span>
          <span>{wsStatus === 'connected' ? 'Live Realtime' : wsStatus === 'connecting' ? 'Connecting...' : 'Offline'}</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
          <span className="font-medium text-zinc-200">{timeStr}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">{dateStr}</span>
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          type="button"
          onClick={onRefresh}
          title="Segarkan Data"
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-medium flex items-center space-x-1.5 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium hidden xs:inline">{username}</span>
          </div>

          <button
            type="button"
            onClick={onOpenChangePassword}
            title="Ganti Password"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Apakah kamu yakin ingin logout dari dashboard?')) {
                logout();
              }
            }}
            title="Logout"
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition-all text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
