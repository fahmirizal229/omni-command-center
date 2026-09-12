/**
 * @file SessionsView.jsx
 * @description Redesigned AI Logs & LLM Token Usage Inspector.
 * Provides multi-model token accounting (Antigravity Gemini, DeepSeek-V3, Hermes Local),
 * visual token comparison, and interactive session transcript inspector.
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
  Wrench
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
  const [copiedId, setCopiedId] = useState(null);
  const [expandedThinking, setExpandedThinking] = useState({});

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [sessRes, analRes] = await Promise.all([
        api.getSessions({ search: searchQuery, model: modelFilter !== 'all' ? modelFilter : '' }).catch(() => ({ sessions: [] })),
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
      console.error('Error loading AI logs:', err);
      showToast('Gagal memuat log sesi AI', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modelFilter]);

  // Load Session Detail
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
        if (isCurrent) showToast('Gagal memuat detail transkrip', 'error');
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

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('ID Sesi disalin ke clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleThinking = (turnId) => {
    setExpandedThinking((prev) => ({ ...prev, [turnId]: !prev[turnId] }));
  };

  // Helper format token count
  const formatTokens = (num) => {
    if (!num) return '0';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const summary = analytics?.summary || { total_tokens: 0, total_sessions: 0, total_turns: 0, estimated_savings_usd: 0 };
  const modelsList = analytics?.models || [];

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
                  <span>AI Logs & Token Usage Inspector</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-indigo-300 font-mono border border-zinc-700">
                    Live Telemetry
                  </span>
                </h2>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  Pantau riwayat percakapan dan audit konsumsi token secara real-time pada 3 engine utama: Antigravity, DeepSeek-V3, dan Hermes Local.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
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

        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Total Tokens */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="text-xs font-mono">Total Tokens</span>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-zinc-100 font-mono">
              {formatTokens(summary.total_tokens)}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">
              {summary.total_turns} Total Conversation Turns
            </p>
          </div>

          {/* Antigravity Engine */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-indigo-900/40 space-y-1">
            <div className="flex items-center justify-between text-indigo-400">
              <span className="text-xs font-mono font-semibold">Antigravity (Gemini)</span>
              <Code2 className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-indigo-300 font-mono">
              {formatTokens(modelsList.find(m => m.id === 'antigravity')?.total_tokens || summary.total_tokens)}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">0 Token / Developer Quota</p>
          </div>

          {/* DeepSeek-V3 */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-sky-900/40 space-y-1">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-xs font-mono font-semibold">DeepSeek-V3</span>
              <MessageCircle className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-sky-300 font-mono">
              {formatTokens(modelsList.find(m => m.id === 'deepseek')?.total_tokens || 0)}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">Curhat & Moral Companion</p>
          </div>

          {/* Savings / Local Engine */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-900/40 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-xs font-mono font-semibold">0-Token Savings</span>
              <Coins className="w-4 h-4" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono">
              ${summary.estimated_savings_usd}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">Hemat via Local & Dev Tier</p>
          </div>
        </div>
      </div>

      {/* 3. Workload Policy Status Banner */}
      <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active LLM Workload Tiers</span>
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono">Policy Enforcement</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {modelsList.map((m) => (
            <div key={m.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.badge_color }} />
                  <span>{m.name}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: `${m.badge_color}20`, color: m.badge_color }}>
                  {m.is_free ? 'FREE / DEV' : 'PAID API'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{m.role}</p>
              <div className="pt-1 border-t border-zinc-900 flex justify-between text-[10px] font-mono text-zinc-500">
                <span>Tokens: <strong className="text-zinc-300">{formatTokens(m.total_tokens)}</strong></span>
                <span>Biaya: <strong className="text-zinc-300">${m.cost_usd}</strong></span>
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
                placeholder="Cari kata kunci percakapan..."
                className="w-full pl-9 pr-20 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] rounded-md transition-colors"
              >
                Cari
              </button>
            </form>

            {/* Model Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 custom-scrollbar text-[11px]">
              <button
                onClick={() => setModelFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium ${
                  modelFilter === 'all' ? 'bg-zinc-800 text-zinc-100 font-bold border border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950'
                }`}
              >
                Semua Model
              </button>
              <button
                onClick={() => setModelFilter('antigravity')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium ${
                  modelFilter === 'antigravity' ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950'
                }`}
              >
                Antigravity
              </button>
              <button
                onClick={() => setModelFilter('deepseek')}
                className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 font-medium ${
                  modelFilter === 'deepseek' ? 'bg-sky-600/30 text-sky-300 font-bold border border-sky-500/40' : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950'
                }`}
              >
                DeepSeek
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
                Tidak ada sesi AI yang ditemukan.
              </div>
            ) : (
              sessions.map((sess) => {
                const isSelected = sess.session_id === selectedSessionId;
                const m = sess.primary_model || {};

                return (
                  <div
                    key={sess.session_id}
                    onClick={() => setSelectedSessionId(sess.session_id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2.5 shadow-sm ${
                      isSelected
                        ? 'bg-zinc-800/90 border-indigo-500/60 ring-1 ring-indigo-500/30'
                        : 'bg-[#121215] border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1.5" style={{ backgroundColor: `${m.badge_color}18`, color: m.badge_color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.badge_color }} />
                        <span>{m.name || 'AI Model'}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{sess.last_active}</span>
                    </div>

                    <h5 className="text-xs font-bold text-zinc-100 line-clamp-2 leading-relaxed">
                      {sess.title}
                    </h5>

                    <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>{sess.message_count} Turns</span>
                      <span>{formatTokens(sess.total_tokens)} Tokens</span>
                      <span className="text-indigo-400 font-semibold">{sess.source}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Transcript & Tool Calls Reader (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedSessionId && sessionDetail ? (
            <div className="rounded-xl bg-[#121215] border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
              {/* Detail Header */}
              <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
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
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                      {sessionDetail.primary_model?.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {sessionDetail.total_turns} Turns Transcribed
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-zinc-400">
                  Engine: <span className="text-emerald-400">{sessionDetail.source}</span>
                </div>
              </div>

              {/* Transcript Stream */}
              <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar text-xs leading-relaxed">
                {loadingDetail ? (
                  <div className="p-12 text-center text-zinc-500 font-mono">Memuat transkrip percakapan...</div>
                ) : sessionDetail.turns?.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 font-mono">Tidak ada transkrip pesan.</div>
                ) : (
                  sessionDetail.turns.map((turn, tIdx) => {
                    const isUser = turn.role === 'user';
                    const hasThinking = Boolean(turn.thinking);
                    const hasTools = Array.isArray(turn.tool_calls) && turn.tool_calls.length > 0;

                    return (
                      <div
                        key={tIdx}
                        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-1">
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
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1.5 gap-4">
                              <span className="font-semibold text-zinc-400">
                                {isUser ? 'User Request' : turn.model?.name || 'AI Assistant'}
                              </span>
                              <span>{turn.timestamp}</span>
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
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 font-mono text-xs">
              Pilih salah satu sesi di sebelah kiri untuk melihat transkrip dan tool call inspector.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
