/**
 * @file SessionsView.jsx
 * @description Redesigned AI Logs & LLM Token Usage Inspector.
 * Provides per-message LLM identification, real-time agy-pool account synchronization,
 * and interactive transcript inspector.
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
  Database,
  ArrowUpDown,
  Code2,
  CheckCircle2,
  Wrench,
  Brain,
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
  const [turns, setTurns] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = newest turn on top, 'asc' = chronological
  const [analytics, setAnalytics] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [expandedThinking, setExpandedThinking] = useState({});

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sessRes, analRes] = await Promise.all([
        api.getSessions({
          search: searchQuery,
          source: sourceFilter !== 'all' ? sourceFilter : '',
          account: accountFilter !== 'all' ? accountFilter : ''
        }).catch(() => ({ sessions: [] })),
        api.getModelAnalytics().catch(() => null)
      ]);
      const list = sessRes?.sessions || [];
      setSessions(list);
      if (analRes) setAnalytics(analRes);
    } catch (err) {
      console.error('Error loading AI logs:', err);
      showToast('Gagal memuat log sesi AI', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sourceFilter, accountFilter]);

  // Load Session Turns on demand when selected or sort order changes
  const fetchSessionTurns = async (sessionId, order = sortOrder, offset = 0, append = false) => {
    if (!sessionId) return;
    if (!append) {
      setLoadingDetail(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await api.getSessionDetail(sessionId, { limit: 25, offset, order });
      setSessionDetail(res);
      if (append) {
        setTurns((prev) => [...prev, ...(res.turns || [])]);
      } else {
        setTurns(res.turns || []);
      }
      setHasMore(Boolean(res.has_more));
    } catch (err) {
      console.error('Error loading session detail:', err);
      showToast('Gagal memuat transkrip percakapan', 'error');
    } finally {
      setLoadingDetail(false);
      setLoadingMore(false);
    }
  };

  const handleSelectSession = (sessionId) => {
    if (sessionId === selectedSessionId && sessionDetail) return;
    setSelectedSessionId(sessionId);
    setTurns([]);
    fetchSessionTurns(sessionId, sortOrder, 0, false);
  };

  const handleToggleOrder = () => {
    const nextOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(nextOrder);
    if (selectedSessionId) {
      setTurns([]);
      fetchSessionTurns(selectedSessionId, nextOrder, 0, false);
    }
  };

  const handleLoadMore = () => {
    if (!selectedSessionId || loadingMore || !hasMore) return;
    fetchSessionTurns(selectedSessionId, sortOrder, turns.length, true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData(true);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('ID Sesi disalin ke clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThinking = (turnId) => {
    setExpandedThinking((prev) => ({ ...prev, [turnId]: !prev[turnId] }));
  };

  const handlePruneLogs = async (days = 7) => {
    if (!window.confirm(`Hapus seluruh riwayat log AI yang tidak aktif lebih dari ${days} hari?`)) return;
    try {
      setRefreshing(true);
      const res = await api.pruneSessions(days);
      showToast(res.message || 'Log berhasil dibersihkan', 'success');
      setSelectedSessionId(null);
      setSessionDetail(null);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Gagal membersihkan log', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('PERINGATAN: Kosongkan seluruh riwayat log percakapan AI dari server? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      setRefreshing(true);
      const res = await api.clearSessions();
      showToast(res.message || 'Seluruh log berhasil dikosongkan', 'success');
      setSelectedSessionId(null);
      setSessionDetail(null);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Gagal mengosongkan log', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteSingleSession = async (sessionId) => {
    if (!window.confirm(`Hapus riwayat sesi ini (${sessionId})? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      setRefreshing(true);
      const res = await api.deleteSession(sessionId);
      showToast(res.message || 'Sesi berhasil dihapus', 'success');
      setSelectedSessionId(null);
      setSessionDetail(null);
      loadData(true);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus sesi', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Helper format token count
  const formatTokens = (num) => {
    if (!num) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const summary = analytics?.summary || { total_tokens: 0, total_sessions: 0, total_turns: 0, estimated_savings_usd: 0 };
  const accountsList = analytics?.accounts || [];
  const modelsList = analytics?.models || [];
  const activeAccount = summary?.active_antigravity_account || {};

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Hero Card */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <MessageSquareCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                  <span>AI Logs & Multi-Account Inspector</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Realtime agy-pool</span>
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Audit percakapan AI & pembagian beban cluster 3 akun Antigravity Google One Pro secara realtime dari agy-pool.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handlePruneLogs(7)}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Bersihkan log percakapan tidak aktif lebih dari 7 hari"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Bersihkan &gt; 7 Hari</span>
            </button>

            <button
              onClick={handleClearLogs}
              disabled={refreshing}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Kosongkan seluruh riwayat log percakapan AI"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Kosongkan Log</span>
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards - Live Sync from agy-pool */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Total Tokens */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-[11px] font-mono">Total Tokens</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-zinc-100 font-mono">
              {formatTokens(summary.total_tokens)}
            </p>
            <p className="text-[9px] text-zinc-500 font-mono">
              {summary.total_turns} Turns Total
            </p>
          </div>

          {/* Antigravity Accounts 1, 2, 3 dynamically */}
          {accountsList.map((acc, idx) => {
            const modelStat = modelsList.find(m => m.account_id === acc.id) || {};
            return (
              <div
                key={acc.id || idx}
                className="p-3.5 rounded-xl bg-zinc-950 space-y-1 relative overflow-hidden border"
                style={{
                  borderColor: acc.is_active ? `${acc.badge_color}70` : `${acc.badge_color}25`
                }}
              >
                {acc.is_active && (
                  <span
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-1"
                    style={{ backgroundColor: `${acc.badge_color}30`, color: acc.badge_color }}
                  >
                    <Flame className="w-2.5 h-2.5" />
                    <span>AKTIF</span>
                  </span>
                )}
                <div className="flex items-center justify-between" style={{ color: acc.badge_color }}>
                  <span className="text-[11px] font-mono font-semibold">{acc.short_name}</span>
                  <Code2 className="w-3.5 h-3.5 opacity-80" />
                </div>
                <p className="text-lg sm:text-xl font-bold font-mono" style={{ color: acc.badge_color }}>
                  {formatTokens(modelStat.total_tokens || 0)}
                </p>
                <p className="text-[9px] text-zinc-400 font-mono truncate" title={acc.name ? `${acc.name} (${acc.email})` : acc.email}>
                  {acc.name ? acc.name : (acc.email ? acc.email.split('@')[0] : acc.short_name)}
                </p>
              </div>
            );
          })}

          {/* DeepSeek-V3 */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-sky-900/40 space-y-1">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-[11px] font-mono font-semibold">DeepSeek-V3</span>
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-sky-300 font-mono">
              {formatTokens(modelsList.find(m => m.id === 'deepseek')?.total_tokens || 0)}
            </p>
            <p className="text-[9px] text-zinc-500 font-mono">Moral Companion</p>
          </div>

          {/* Savings / Local Engine */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-emerald-900/40 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] font-mono font-semibold">0-Token</span>
              <Coins className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              ${summary.estimated_savings_usd}
            </p>
            <p className="text-[9px] text-zinc-500 font-mono">Hemat Dev Tier</p>
          </div>
        </div>
      </div>

      {/* 3. Live agy-pool Status Banner */}
      <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dedicated Antigravity Accounts (agy-pool sync)</span>
          </h4>
          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
            <span>Akun Aktif:</span>
            <strong className="text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {activeAccount.short_name}: {activeAccount.name} ({activeAccount.email})
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {accountsList.map((acc) => (
            <div
              key={acc.id}
              className={`p-3 rounded-lg bg-zinc-950 border space-y-2 transition-all ${
                acc.is_active ? 'ring-1 ring-indigo-500/40' : ''
              }`}
              style={{ borderColor: acc.is_active ? `${acc.badge_color}60` : '#27272a' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.badge_color }} />
                  <span className="truncate">{acc.short_name}: {acc.name}</span>
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0"
                  style={{ backgroundColor: `${acc.badge_color}20`, color: acc.badge_color }}
                >
                  {acc.is_active ? '🔥 ACTIVE POOL' : '🟢 READY'}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 truncate flex items-center gap-1">
                <span>✉️</span>
                <span className="font-semibold">{acc.email || 'Belum Dikonfigurasi'}</span>
              </p>
              <div className="pt-1 border-t border-zinc-900 flex justify-between text-[10px] font-mono text-zinc-500">
                <span>Status: <strong className="text-zinc-400 uppercase">{acc.status}</strong></span>
                <span>Tasks Selesai: <strong className="text-zinc-300">{acc.total_tasks || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Main Two-Column Layout (Session List & Transcript) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Session Explorer List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Filter Bar */}
          <div className="p-3.5 rounded-xl bg-[#121215] border border-zinc-800 space-y-3 shadow-lg">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sesi / kata kunci..."
                className="w-full pl-9 pr-20 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] rounded-md transition-colors"
              >
                Cari
              </button>
            </form>

            {/* Platform & Account Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
              <button
                onClick={() => { setSourceFilter('all'); setAccountFilter('all'); }}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium ${
                  sourceFilter === 'all' && accountFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950'
                }`}
              >
                Semua Sesi
              </button>
              <button
                onClick={() => { setSourceFilter('antigravity-cli'); setAccountFilter('all'); }}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium flex items-center gap-1.5 ${
                  sourceFilter === 'antigravity-cli' && accountFilter === 'all'
                    ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Antigravity CLI</span>
              </button>
              <button
                onClick={() => { setSourceFilter('telegram'); setAccountFilter('all'); }}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium flex items-center gap-1.5 ${
                  sourceFilter === 'telegram'
                    ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                <span>Telegram / Gateway</span>
              </button>
            </div>
          </div>

          {/* Session Cards Scrollable List */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1 custom-scrollbar">
            {loading ? (
              <div className="p-12 text-center text-xs text-zinc-500 font-mono animate-pulse">
                Memuat riwayat sesi AI...
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
                Tidak ada sesi AI yang ditemukan untuk filter ini.
              </div>
            ) : (
              sessions.map((sess) => {
                const isSelected = sess.session_id === selectedSessionId;

                return (
                  <div
                    key={sess.session_id}
                    onClick={() => handleSelectSession(sess.session_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 shadow-sm ${
                      isSelected
                        ? 'bg-zinc-800/90 border-indigo-500/60 ring-1 ring-indigo-500/30'
                        : 'bg-[#121215] border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
                          <MessageSquareCode className="w-3 h-3 text-indigo-400" />
                          <span>{sess.source === 'antigravity-cli' ? 'Antigravity CLI' : (sess.source || 'Session')}</span>
                        </span>
                        {sess.account_tag && (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                            style={{
                              backgroundColor: `${sess.account_badge_color || '#6366f1'}20`,
                              color: sess.account_badge_color || '#6366f1'
                            }}
                          >
                            {sess.account_tag}
                          </span>
                        )}
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900/60 text-zinc-500 font-mono">
                          {sess.session_id ? sess.session_id.slice(0, 8) : ''}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{sess.last_active}</span>
                    </div>

                    <h5 className="text-xs font-bold text-zinc-100 line-clamp-2 leading-relaxed">
                      {sess.title}
                    </h5>

                    <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{sess.message_count} Turns</span>
                      <span>{formatTokens(sess.total_tokens)} Tokens</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Transcript & Per-Message LLM Reader (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSessionId && sessionDetail ? (
            <div className="rounded-xl bg-[#121215] border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
              {/* Detail Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span>ID: <strong className="text-zinc-200">{sessionDetail.session_id}</strong></span>
                    <button
                      onClick={() => copyToClipboard(sessionDetail.session_id, 'sid')}
                      className="p-1 hover:text-white transition-colors"
                      title="Salin ID Sesi"
                    >
                      {copiedId === 'sid' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-indigo-400" />
                      <span>{sessionDetail.source === 'antigravity-cli' ? 'Antigravity CLI Session' : (sessionDetail.source || 'Session')}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {sessionDetail.total_turns} Turns Total
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleOrder}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-mono flex items-center gap-1.5 transition-all"
                    title="Ubah urutan kronologis percakapan"
                  >
                    <ArrowUpDown className="w-3 h-3 text-indigo-400" />
                    <span>{sortOrder === 'desc' ? 'Terbaru di Atas' : 'Lama di Atas'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteSingleSession(sessionDetail.session_id)}
                    className="p-1.5 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all text-xs flex items-center gap-1"
                    title="Hapus sesi ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>

              {/* Transcript Stream with Per-Message LLM Badges */}
              <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar text-xs leading-relaxed">
                {loadingDetail ? (
                  <div className="p-12 text-center text-zinc-500 font-mono animate-pulse">Memuat transkrip percakapan...</div>
                ) : turns.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 font-mono">Tidak ada transkrip pesan.</div>
                ) : (
                  <>
                    {turns.map((turn, tIdx) => {
                      const isUser = turn.role === 'user';
                      const hasThinking = Boolean(turn.thinking);
                      const hasTools = Array.isArray(turn.tool_calls) && turn.tool_calls.length > 0;
                      const badgeColor = turn.handler?.badge_color || turn.model?.badge_color || '#6366f1';
                      const modelName = turn.model_name || turn.model?.name || 'Gemini 3.7 Flash';

                      return (
                        <div
                          key={`${turn.turn_id}-${tIdx}`}
                          className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && (
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 border"
                              style={{
                                backgroundColor: `${badgeColor}20`,
                                borderColor: `${badgeColor}50`,
                                color: badgeColor
                              }}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                            {/* Message Bubble */}
                            <div
                              className={`p-3.5 rounded-xl border leading-relaxed ${
                                isUser
                                  ? 'bg-indigo-600/20 border-indigo-500/40 text-zinc-100 rounded-tr-none'
                                  : 'bg-zinc-950 border-zinc-800 text-zinc-200 rounded-tl-none'
                              }`}
                            >
                              {/* Per-Message Metadata Bar */}
                              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2 gap-4 flex-wrap pb-1.5 border-b border-zinc-900">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {isUser ? (
                                    <span className="font-semibold text-indigo-300 flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      <span>User Request</span>
                                    </span>
                                  ) : (
                                    <>
                                      {/* Per-message exact LLM Model badge */}
                                      <span
                                        className="px-2 py-0.5 rounded font-semibold text-[9.5px] flex items-center gap-1.5 border font-mono"
                                        style={{
                                          backgroundColor: `${badgeColor}20`,
                                          color: badgeColor,
                                          borderColor: `${badgeColor}40`
                                        }}
                                      >
                                        <Sparkles className="w-2.5 h-2.5" />
                                        <span>{modelName}</span>
                                      </span>

                                      {(turn.handler?.email || turn.handler?.name) && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono border border-zinc-800">
                                          {turn.handler?.short_name || 'AGY'}: {turn.handler?.name ? `${turn.handler.name} (${turn.handler.email})` : turn.handler?.email}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                <span className="text-zinc-500">{turn.timestamp}</span>
                              </div>

                              {/* Thinking Process Accordion */}
                              {hasThinking && (
                                <div className="mb-2.5 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => toggleThinking(turn.turn_id)}
                                    className="w-full px-2.5 py-1.5 flex items-center justify-between text-[10px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900/80"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <Brain className="w-3 h-3 text-purple-400" />
                                      <span>Thought Process ({turn.thinking.length} chars)</span>
                                    </span>
                                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedThinking[turn.turn_id] ? 'rotate-180' : ''}`} />
                                  </button>
                                  {expandedThinking[turn.turn_id] && (
                                    <div className="p-2.5 text-[10px] font-mono text-zinc-400 border-t border-zinc-800 whitespace-pre-wrap bg-zinc-950/70 max-h-48 overflow-y-auto custom-scrollbar">
                                      {turn.thinking}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Main Content Text */}
                              <div className="whitespace-pre-wrap font-sans text-xs text-zinc-200 leading-relaxed">
                                {turn.content}
                              </div>

                              {/* Tool Calls Inspection */}
                              {hasTools && (
                                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 space-y-1.5">
                                  <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                                    <Wrench className="w-3 h-3 text-amber-400" />
                                    <span>Executed Tool Calls ({turn.tool_calls.length})</span>
                                  </p>
                                  <div className="space-y-1">
                                    {turn.tool_calls.map((tc, tcIdx) => (
                                      <div key={tcIdx} className="p-2 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-300">
                                        <span className="text-amber-400 font-bold">{tc.tool || tc.name || 'tool'}</span>
                                        {tc.args && <p className="text-zinc-400 text-[9px] truncate mt-0.5">{JSON.stringify(tc.args)}</p>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {isUser && (
                            <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0 mt-1">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Lazy Load / Load More Turns Button */}
                    {hasMore && (
                      <div className="pt-4 pb-2 text-center">
                        <button
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                        >
                          {loadingMore ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                              <span>Memuat pesan lainnya...</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Muat Pesan Sebelumnya (+25 turns)</span>
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1.5">
                          Menampilkan {turns.length} dari {sessionDetail.total_turns} total turns
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 flex flex-col items-center justify-center text-center border border-dashed border-zinc-800 rounded-xl space-y-3 bg-[#121215]/50 shadow-inner">
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500">
                <MessageSquareCode className="w-8 h-8 text-indigo-400/70" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-zinc-200">Pilih Sesi Percakapan</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Pilih salah satu sesi dari daftar di sebelah kiri untuk memuat transkrip pesan dan tool calls secara instan on-demand.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
