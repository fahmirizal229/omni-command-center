import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Activity,
  Cpu,
  Zap,
  Terminal,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '../api';
import { useWebSocket } from '../context/WebSocketContext';
import { useToast } from '../context/ToastContext';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/soundEffects';

export function WarRoomView({ isDark = true }) {
  const { showToast } = useToast();
  const { addListener } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [warRoomData, setWarRoomData] = useState(null);
  const [taskPrompt, setTaskPrompt] = useState('');
  const [selectedSwarm, setSelectedSwarm] = useState('kuro');
  const [complexity, setComplexity] = useState('heavy');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [filterSwarm, setFilterSwarm] = useState('all');

  const logEndRef = useRef(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getWarRoomStatus();
      setWarRoomData(data);
    } catch (err) {
      showToast(err.message || 'Gagal memuat status War Room', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      api.getWarRoomStatus().then((d) => setWarRoomData(d)).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live WebSocket events
  useEffect(() => {
    const unsub = addListener('warroom_event', (msg) => {
      if (msg.event) {
        setWarRoomData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            timeline: [msg.event, ...(prev.timeline || [])].slice(0, 40),
          };
        });
        playAlertSound();
      }
    });
    return () => unsub();
  }, [addListener]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!taskPrompt.trim()) {
      showToast('Masukkan prompt atau instruksi task!', 'warning');
      return;
    }
    try {
      playClickSound();
      setIsBroadcasting(true);
      const res = await api.broadcastWarRoomTask({
        task_title: taskPrompt,
        target_swarm: selectedSwarm,
        complexity,
      });
      playSuccessSound();
      showToast(res.message || 'Task berhasil dibroadcast ke Swarm!', 'success');
      setTaskPrompt('');
      fetchStatus();
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal broadcast task', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredTimeline = (warRoomData?.timeline || []).filter((item) => {
    if (filterSwarm === 'all') return true;
    return item.swarm === filterSwarm;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-viewCrossfade">
      {/* 1. Header Banner with Live Pulse */}
      <div
        className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? 'bg-[#0b0f19] border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-rose-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-2 ring-rose-400/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className={`text-lg sm:text-xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AGENT WAR ROOM & TELEMETRY
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  LIVE SWARM
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Visualisasi terpadu Kuro Squad (Heavy) & Shiro Squad (Light) dengan pemantauan tugas seketika.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                playClickSound();
                fetchStatus();
              }}
              disabled={loading}
              className={`p-2.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
              Sync Telemetry
            </button>
          </div>
        </div>
      </div>

      {/* 2. Unified Swarm Node Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KURO SQUAD (Heavy Engineering) */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl relative ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">🏯</span>
              <div>
                <h3 className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  KURO SQUAD (4 EQUAL KNIGHTS)
                </h3>
                <span className="text-[11px] text-indigo-400 font-mono">
                  Mode: {warRoomData?.kuro?.balancer_mode?.toUpperCase() || 'LEAST_USED'}
                </span>
              </div>
            </div>
            {warRoomData?.kuro?.on_duty && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                🎯 ON-DUTY: {warRoomData.kuro.on_duty.name || `Node ${warRoomData.kuro.on_duty.id}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(warRoomData?.kuro?.members || []).map((node) => {
              const isOnDuty = warRoomData?.kuro?.on_duty?.id === node.id;
              const isBusy = node.status === 'busy';
              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOnDuty
                      ? isDark
                        ? 'bg-amber-500/[0.08] border-amber-500/40 ring-1 ring-amber-500/30'
                        : 'bg-amber-50 border-amber-300 ring-1 ring-amber-400'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{node.avatar || '⚔️'}</span>
                      <span className={`font-mono font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {node.name}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isBusy
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isBusy ? 'BUSY' : 'READY'}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tasks:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {node.tasks_completed || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SHIRO SQUAD (Light & Routines) */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl relative ${
            isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">🕊️</span>
              <div>
                <h3 className={`font-mono font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  SHIRO SQUAD (LIGHTWEIGHT & CRON)
                </h3>
                <span className="text-[11px] text-teal-400 font-mono">
                  Mode: {warRoomData?.shiro?.balancer_mode?.toUpperCase() || 'ROUND_ROBIN'}
                </span>
              </div>
            </div>
            {warRoomData?.shiro?.on_duty && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30 flex items-center gap-1.5">
                🎯 ON-DUTY: {warRoomData.shiro.on_duty.name || `Node ${warRoomData.shiro.on_duty.id}`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(warRoomData?.shiro?.members || []).map((node) => {
              const isOnDuty = warRoomData?.shiro?.on_duty?.id === node.id;
              const isBusy = node.status === 'busy';
              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isOnDuty
                      ? isDark
                        ? 'bg-teal-500/[0.08] border-teal-500/40 ring-1 ring-teal-500/30'
                        : 'bg-teal-50 border-teal-300 ring-1 ring-teal-400'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{node.avatar || '🕊️'}</span>
                      <span className={`font-mono font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {node.name}
                      </span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        isBusy
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isBusy ? 'BUSY' : 'READY'}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tasks:</span>
                    <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {node.tasks_completed || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Interactive Swarm Task Broadcast Dispatcher */}
      <div
        className={`p-5 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className={`font-mono font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            DISPATCH SWARM MISSION / PROMPT
          </h3>
        </div>

        <form onSubmit={handleBroadcast} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={taskPrompt}
              onChange={(e) => setTaskPrompt(e.target.value)}
              placeholder="Ketik instruksi atau prompt task untuk dieksekusi oleh swarm..."
              className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-mono transition-all outline-hidden ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-600'
              }`}
            />
            <div className="flex gap-2">
              <select
                value={selectedSwarm}
                onChange={(e) => setSelectedSwarm(e.target.value)}
                className={`px-3 py-2.5 rounded-xl border text-xs font-mono outline-hidden cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="kuro">🏯 Kuro (Heavy)</option>
                <option value="shiro">🕊️ Shiro (Light)</option>
                <option value="both">⚡ Dual Swarm</option>
              </select>
              <button
                type="submit"
                disabled={isBroadcasting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-mono text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
              >
                {isBroadcasting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Dispatch
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 4. Live Event Timeline Stream */}
      <div
        className={`p-5 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <h3 className={`font-mono font-bold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              LIVE EXECUTION TIMELINE
            </h3>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs font-mono">
            <button
              onClick={() => setFilterSwarm('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterSwarm === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSwarm('kuro')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterSwarm === 'kuro'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kuro
            </button>
            <button
              onClick={() => setFilterSwarm('shiro')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterSwarm === 'shiro'
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Shiro
            </button>
          </div>
        </div>

        {filteredTimeline.length === 0 ? (
          <div className={`p-8 text-center font-mono text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Belum ada aktivitas task pada swarm.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredTimeline.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isDark
                    ? 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/50'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      item.swarm === 'kuro'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                    }`}
                  >
                    {item.swarm === 'kuro' ? '⚔️' : '🕊️'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-indigo-400">{item.node_name}</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 truncate font-sans ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0 text-[11px] font-mono text-slate-400 sm:self-center self-end">
                  {item.tokens > 0 && <span>{item.tokens} tokens</span>}
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
