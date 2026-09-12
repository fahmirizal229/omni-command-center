/**
 * @file SessionsView.jsx
 * @description Hermes Multi-LLM Session History & Model Performance Inspector.
 * Allows inspecting all conversation turns, viewing user questions and AI answers,
 * with exact LLM model attribution, latency benchmarks, and quota analytics.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareCode,
  Bot,
  User,
  Sparkles,
  Zap,
  Clock,
  Coins,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Terminal,
  Activity,
  Layers,
  Cpu,
  Flame,
  Info,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Database,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export function SessionsView() {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [showAnalyticsBar, setShowAnalyticsBar] = useState(true);

  // Fetch Session List & Analytics
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sessRes, analRes] = await Promise.all([
        api.getSessions({ search: searchQuery, model: modelFilter !== 'all' ? modelFilter : '', source: sourceFilter !== 'all' ? sourceFilter : '' }).catch(() => ({ sessions: [] })),
        api.getModelAnalytics().catch(() => null)
      ]);
      const list = sessRes?.sessions || [];
      setSessions(list);
      if (analRes) setAnalytics(analRes);

      // Auto-select first session if none selected
      if (list.length > 0 && (!selectedSessionId || !list.some(s => s.session_id === selectedSessionId))) {
        setSelectedSessionId(list[0].session_id);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
      showToast('Gagal memuat history session Hermes', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modelFilter, sourceFilter]);

  // Load Session Detail when selected
  useEffect(() => {
    if (!selectedSessionId) {
      setSessionDetail(null);
      return;
    }
    let isCurrent = true;
    setLoadingDetail(true);
    api.getSessionDetail(selectedSessionId)
      .then((res) => {
        if (isCurrent) setSessionDetail(res);
      })
      .catch((err) => {
        console.error('Error loading session detail:', err);
        if (isCurrent) showToast('Gagal memuat detail percakapan', 'error');
      })
      .finally(() => {
        if (isCurrent) setLoadingDetail(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedSessionId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(true);
  };

  const handlePruneOldLogs = async (days = 7) => {
    if (!window.confirm(`Hapus seluruh sesi dan riwayat obrolan yang tidak aktif lebih dari ${days} hari?`)) return;
    try {
      setRefreshing(true);
      const res = await api.pruneSessions(days);
      showToast(res.message || `Data tidak aktif > ${days} hari berhasil dibersihkan`, 'success');
      setSelectedSessionId(null);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Gagal membersihkan data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleResetAllLogs = async () => {
    if (!window.confirm('PERINGATAN: Kosongkan SELURUH riwayat sesi chat dan log AI dari nol? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      setRefreshing(true);
      const res = await api.resetSessions();
      showToast(res.message || 'Seluruh riwayat chat berhasil di-reset ke nol', 'success');
      setSelectedSessionId(null);
      setSessionDetail(null);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Gagal me-reset data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Teks berhasil disalin ke clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to format model badge
  const renderModelBadge = (modelInfo, size = 'sm') => {
    if (!modelInfo) return null;
    const name = modelInfo.name || 'Antigravity (Gemini 3.7)';
    const color = modelInfo.badge_color || '#6366f1';
    const isFree = modelInfo.is_free !== false;

    return (
      <span
        style={{
          borderColor: `${color}40`,
          backgroundColor: `${color}15`,
          color: color
        }}
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${
          size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span>{name}</span>
        {isFree ? (
          <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">FREE</span>
        ) : (
          <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 font-mono">PAID</span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header & Quick Controls */}
      <div className="p-6 rounded-2xl bg-[#0e111d]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-indigo-500/30 text-indigo-400">
              <MessageSquareCode className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Hermes AI Sessions & LLM Inspector</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                Multi-Model Hub
              </span>
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Pantau seluruh riwayat tanya-jawab Hermes, lihat transkrip pesan, dan evaluasi data model LLM mana yang menjawab setiap pesan secara akurat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handlePruneOldLogs(7)}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Hapus sesi tidak aktif > 7 hari"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Bersihkan &gt; 7 Hari</span>
          </button>

          <button
            onClick={handleResetAllLogs}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 hover:text-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Reset seluruh log ke nol"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset Log</span>
          </button>

          <button
            onClick={() => setShowAnalyticsBar(!showAnalyticsBar)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              showAnalyticsBar
                ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Radar Model LLM</span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white transition-all disabled:opacity-50"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Model Performance Radar (Collapsible) */}
      {showAnalyticsBar && analytics?.models && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {analytics.models.map((m) => {
            const isFree = m.is_free !== false;
            return (
              <div
                key={m.key}
                onClick={() => setModelFilter(modelFilter === m.key ? 'all' : m.key)}
                style={{ borderColor: modelFilter === m.key ? m.badge_color : 'rgba(255,255,255,0.08)' }}
                className={`p-3.5 rounded-xl bg-[#0e111d]/80 backdrop-blur-xl border transition-all cursor-pointer hover:scale-[1.02] shadow-sm relative overflow-hidden group ${
                  modelFilter === m.key ? 'ring-1 ring-indigo-500/50 bg-indigo-500/10' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate" style={{ color: m.badge_color }}>
                      {m.name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">{m.provider}</p>
                  </div>
                  {isFree ? (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">FREE</span>
                  ) : (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">PAID</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-zinc-500 text-[11px]">Total Panggilan:</span>
                    <span className="font-mono font-bold text-white">{m.calls}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-zinc-500 text-[11px]">Porsi:</span>
                    <span className="font-mono text-zinc-300">{m.usage_share_percent}%</span>
                  </div>
                </div>

                <p className="mt-2 text-[9px] text-zinc-500 line-clamp-2 leading-tight border-t border-white/[0.04] pt-1.5">
                  {m.policy}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0e111d]/70 backdrop-blur-xl border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan, jawaban, atau ID sesi..."
            className="w-full pl-9 pr-20 py-2 bg-zinc-950/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-lg transition-all"
          >
            Cari
          </button>
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-white/[0.08] px-2.5 py-1.5 rounded-xl text-xs">
            <Filter className="w-3 h-3 text-zinc-500" />
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0e111d] text-white">Semua Model LLM</option>
              <option value="antigravity" className="bg-[#0e111d] text-white">🛡️ Antigravity (Gemini 3.7)</option>
              <option value="deepseek" className="bg-[#0e111d] text-white">💖 DeepSeek-V3 (Curhat)</option>
              <option value="groq" className="bg-[#0e111d] text-white">🚀 Groq LPU (Fast Free)</option>
              <option value="mistral" className="bg-[#0e111d] text-white">🌪️ Mistral Small</option>
              <option value="openrouter" className="bg-[#0e111d] text-white">🌐 Nemotron (OpenRouter)</option>
              <option value="google_ai" className="bg-[#0e111d] text-white">🔷 Gemini 2.0 Flash Lite</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-white/[0.08] px-2.5 py-1.5 rounded-xl text-xs">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#0e111d] text-white">Semua Sumber</option>
              <option value="telegram" className="bg-[#0e111d] text-white">Telegram Chat</option>
              <option value="cron" className="bg-[#0e111d] text-white">Cron Routine</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Split Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sessions List */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-2.5 max-h-[780px] overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 rounded-2xl bg-[#0e111d]/60 border border-white/[0.08] text-center text-xs text-zinc-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
              <span>Memuat daftar session...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0e111d]/60 border border-white/[0.08] text-center text-xs text-zinc-500">
              <MessageSquareCode className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
              <span>Tidak ada session yang cocok dengan filter.</span>
            </div>
          ) : (
            sessions.map((sess) => {
              const isSelected = sess.session_id === selectedSessionId;
              const isCron = sess.source === 'cron' || sess.session_id.startsWith('cron_');

              return (
                <div
                  key={sess.session_id}
                  onClick={() => setSelectedSessionId(sess.session_id)}
                  className={`p-4 rounded-xl transition-all cursor-pointer border text-left relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#151928] border-indigo-500/60 shadow-[0_4px_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/40'
                      : 'bg-[#0e111d]/70 hover:bg-[#121624] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      {isCron ? (
                        <span className="p-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>CRON</span>
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold flex items-center gap-1">
                          <MessageCircle className="w-2.5 h-2.5" />
                          <span>CHAT</span>
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-zinc-400 truncate" title={sess.session_id}>
                        {sess.session_id.length > 20 ? sess.session_id.slice(0, 18) + '...' : sess.session_id}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                      {sess.started_at.split(',')[0]}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-zinc-200 line-clamp-1 mb-2 group-hover:text-white transition-colors">
                    {sess.title}
                  </p>

                  {sess.last_user_query && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1 italic mb-3 bg-black/20 px-2 py-1 rounded-md border border-white/[0.02]">
                      "{sess.last_user_query}"
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {renderModelBadge(sess.primary_model, 'xs')}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MessageSquareCode className="w-3 h-3 text-zinc-500" />
                        <span>{sess.message_count} pesan</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Chat Transcript & LLM Inspector */}
        <div className="lg:col-span-8 xl:col-span-8">
          {!selectedSessionId ? (
            <div className="p-12 rounded-2xl bg-[#0e111d]/60 border border-white/[0.08] text-center text-zinc-500">
              <Bot className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p className="text-sm font-semibold text-zinc-400">Pilih salah satu sesi di sebelah kiri</p>
              <p className="text-xs text-zinc-500 mt-1">Transkrip obrolan dan data model LLM akan muncul di sini.</p>
            </div>
          ) : loadingDetail ? (
            <div className="p-12 rounded-2xl bg-[#0e111d]/60 border border-white/[0.08] text-center text-xs text-zinc-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-indigo-400" />
              <span>Memuat transkrip percakapan...</span>
            </div>
          ) : !sessionDetail ? (
            <div className="p-12 rounded-2xl bg-[#0e111d]/60 border border-white/[0.08] text-center text-xs text-zinc-500">
              <span>Gagal memuat detail sesi.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session Detail Header Bar */}
              <div className="p-5 rounded-2xl bg-[#0e111d]/90 backdrop-blur-xl border border-white/[0.08] shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{sessionDetail.session?.title}</span>
                      <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/[0.05]">
                        {sessionDetail.session?.id}
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-3">
                      <span>Waktu Mulai: {sessionDetail.session?.started_at}</span>
                      <span>•</span>
                      <span>Total Pesan: {sessionDetail.total_messages}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderModelBadge(sessionDetail.session?.primary_model, 'sm')}
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(sessionDetail, null, 2), 'session-json')}
                      className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white transition-all text-xs"
                      title="Salin JSON Transkrip"
                    >
                      {copiedId === 'session-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Message Transcript Stream */}
              <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1 custom-scrollbar">
                {sessionDetail.messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isAssistant = msg.role === 'assistant';
                  const isSystem = msg.role === 'system';
                  const isTool = msg.role === 'tool';

                  if (isSystem) {
                    return (
                      <div key={msg.id || idx} className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.04] text-[11px] text-zinc-400 font-mono">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider block mb-1">System Prompt Context</span>
                        <p className="line-clamp-3 hover:line-clamp-none transition-all">{msg.content}</p>
                      </div>
                    );
                  }

                  if (isTool) {
                    return (
                      <div key={msg.id || idx} className="p-3 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 text-[11px] text-zinc-300 font-mono">
                        <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                          <span>🛠️ Tool Result: {msg.tool_name || 'Tool'}</span>
                          <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                        </div>
                        <pre className="text-[10px] text-zinc-400 overflow-x-auto whitespace-pre-wrap max-h-32 bg-black/40 p-2 rounded">
                          {msg.content}
                        </pre>
                      </div>
                    );
                  }

                  if (isUser) {
                    return (
                      <div key={msg.id || idx} className="flex gap-3 justify-end items-start group">
                        <div className="max-w-[85%] space-y-1 text-right">
                          <div className="inline-block p-4 rounded-2xl rounded-tr-sm bg-gradient-to-tr from-indigo-600/90 to-indigo-500/90 text-white text-xs leading-relaxed shadow-[0_4px_15px_rgba(99,102,241,0.2)] text-left whitespace-pre-wrap">
                            {msg.content}
                          </div>
                          <div className="flex items-center justify-end gap-2 text-[10px] text-zinc-500 font-mono">
                            <span>{msg.timestamp}</span>
                            <button
                              onClick={() => copyToClipboard(msg.content, `msg-${msg.id}`)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white"
                              title="Salin Pertanyaan"
                            >
                              {copiedId === `msg-${msg.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                          <User className="w-4 h-4 text-indigo-300" />
                        </div>
                      </div>
                    );
                  }

                  // Assistant / AI Turn
                  const modelMeta = msg.model_info || sessionDetail.session?.primary_model;

                  return (
                    <div key={msg.id || idx} className="flex gap-3 justify-start items-start group">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/30 to-indigo-500/30 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>

                      <div className="max-w-[88%] space-y-1.5">
                        {/* LLM Model Attribution Header Strip */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {renderModelBadge(modelMeta, 'sm')}
                          
                          {msg.latency_ms && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-zinc-300 border border-white/[0.06] flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 text-amber-400" />
                              <span>{(msg.latency_ms / 1000).toFixed(2)}s</span>
                            </span>
                          )}

                          {msg.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                              {msg.category}
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                            {msg.timestamp}
                          </span>
                        </div>

                        {/* AI Content Bubble */}
                        <div className="p-4 rounded-2xl rounded-tl-sm bg-[#121624] border border-white/[0.08] text-zinc-200 text-xs leading-relaxed shadow-sm space-y-2.5">
                          <div className="prose prose-invert prose-xs max-w-none whitespace-pre-wrap leading-relaxed text-zinc-100">
                            {msg.content}
                          </div>

                          {/* Tool Calls Execution Metadata */}
                          {msg.tool_calls && msg.tool_calls.length > 0 && (
                            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-indigo-400" />
                                <span>Tool Invocations ({msg.tool_calls.length})</span>
                              </p>
                              <div className="space-y-1">
                                {msg.tool_calls.map((tc, tcIdx) => (
                                  <div key={tcIdx} className="p-2 rounded bg-black/40 border border-white/[0.04] font-mono text-[10px] text-zinc-300">
                                    <span className="text-indigo-300 font-bold">{tc.function?.name || tc.name}</span>
                                    {tc.function?.arguments && (
                                      <pre className="text-[9px] text-zinc-400 mt-1 whitespace-pre-wrap max-h-24 overflow-x-auto">
                                        {typeof tc.function.arguments === 'string' ? tc.function.arguments : JSON.stringify(tc.function.arguments, null, 2)}
                                      </pre>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Footer */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            onClick={() => copyToClipboard(msg.content, `msg-${msg.id}`)}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/[0.04]"
                          >
                            {copiedId === `msg-${msg.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin Jawaban</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
