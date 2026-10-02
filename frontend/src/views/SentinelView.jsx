import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Activity,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  Server,
  Layers,
  Palette,
  Terminal,
  Zap,
  Check,
  X,
  Filter,
  ArrowRight,
  Flame,
  Brain,
  MessageSquare,
  AlertTriangle,
  History,
  Lightbulb,
  FileText,
  Globe
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/soundEffects';
import { TechRadarView } from './TechRadarView';


const DOMAIN_CONFIG = {
  SERVER: { label: 'Server Hardening', color: 'rose', icon: Server },
  DASHBOARD: { label: 'Dashboard UI', color: 'amber', icon: Layers },
  PORTO: { label: 'Portfolio & CV', color: 'purple', icon: Palette },
  ARUSUKA: { label: 'Arusuka Persona', color: 'pink', icon: Bot },
  TOOLING: { label: 'Automation & Tooling', color: 'cyan', icon: Terminal },
};

export function SentinelView({ isDark = true }) {
  const { language } = useLanguage();
  const { showToast } = useToast ? useToast() : { showToast: () => {} };

  const [activeSubTab, setActiveSubTab] = useState('inbox'); // 'inbox' | 'propose' | 'circadian' | 'audit'
  const [telemetry, setTelemetry] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  // Custom Request Form State
  const [customForm, setCustomForm] = useState({
    title: '',
    domain: 'SERVER',
    description: '',
    action_plan: ''
  });
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);

  const fetchSentinelData = useCallback(async () => {
    try {
      const [telemRes, propRes] = await Promise.all([
        api.getSentinelTelemetry().catch(() => null),
        api.getSentinelProposals(statusFilter, domainFilter).catch(() => ({ proposals: [] }))
      ]);

      if (telemRes) setTelemetry(telemRes);
      if (propRes && propRes.proposals) setProposals(propRes.proposals);
    } catch (err) {
      console.error('Error fetching sentinel data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, domainFilter]);

  useEffect(() => {
    fetchSentinelData();
    const interval = setInterval(fetchSentinelData, 20000);
    return () => clearInterval(interval);
  }, [fetchSentinelData]);

  const handleRefresh = () => {
    playClickSound();
    setIsRefreshing(true);
    fetchSentinelData();
  };

  const handleProposalAction = async (proposalId, action) => {
    try {
      playClickSound();
      setActionLoadingId(proposalId);
      const res = await api.performSentinelAction(proposalId, action);
      if (res && (res.status === 'ok' || res.status === 'success')) {
        playSuccessSound();
        if (showToast) {
          showToast(
            action === 'approve'
              ? '⚡ Inisiatif berhasil diterapkan! Notifikasi detail dikirim ke Telegram.'
              : action === 'reject'
              ? 'Inisiatif ditolak & tidak akan disarankan lagi.'
              : 'Status inisiatif berhasil diperbarui.',
            'success'
          );
        }
        await fetchSentinelData();
      } else if (res && res.status === 'error') {
        playAlertSound();
        if (showToast) showToast('Gagal menerapkan inisiatif: ' + (res.message || 'Terjadi kendala'), 'error');
        await fetchSentinelData();
      }
    } catch (err) {
      console.error('Error performing proposal action:', err);
      playAlertSound();
      if (showToast) showToast('Gagal memproses inisiatif: ' + err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitCustomRequest = async (e) => {
    e.preventDefault();
    if (!customForm.title.trim() || !customForm.description.trim()) {
      if (showToast) showToast('Judul dan deskripsi inisiatif wajib diisi!', 'warning');
      return;
    }

    try {
      playClickSound();
      setIsSubmittingCustom(true);
      const res = await api.submitSentinelRequest(customForm);
      if (res && res.status === 'ok') {
        playSuccessSound();
        if (showToast) {
          showToast(
            '🚀 Inisiatif berhasil dikirim ke antrean Sentinel & Second Brain Inbox!',
            'success'
          );
        }
        setCustomForm({ title: '', domain: 'SERVER', description: '', action_plan: '' });
        setActiveSubTab('inbox');
        await fetchSentinelData();
      }
    } catch (err) {
      console.error('Error submitting custom request:', err);
      playAlertSound();
      if (showToast) showToast('Gagal mengirim inisiatif: ' + err.message, 'error');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  const pulse = telemetry?.pulse || {};
  const stats = telemetry?.stats || { total_proposals: proposals.length, pending: 0, approved: 0, executed: 0 };
  const circadianTimeline = telemetry?.circadian_timeline || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-sans select-none animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. HERO HEADER BANNER                                     */}
      {/* ========================================================= */}
      <section
        className={`rounded-2xl p-6 sm:p-7 border relative overflow-hidden transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-[#0c0f1a] via-[#101426] to-[#151020] border-slate-800/80 shadow-[0_12px_40px_rgba(0,0,0,0.4)]'
            : 'bg-gradient-to-br from-white via-rose-50/20 to-indigo-50/20 border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-inner ${
                  isDark
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    : 'bg-rose-100/70 border-rose-200 text-rose-700'
                }`}
              >
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className={`text-xl sm:text-2xl font-bold font-sans tracking-tight ${
                      isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                  >
                    Arusuka Sentinel & Advisory Center
                  </h1>
                  <span
                    className={`badge-capsule text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 ${
                      pulse.status === 'ACTIVE'
                        ? isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : pulse.status === 'DISCREET'
                        ? isDark
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        : isDark
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        pulse.status === 'ACTIVE'
                          ? 'bg-emerald-400 animate-pulse'
                          : pulse.status === 'DISCREET'
                          ? 'bg-amber-400'
                          : 'bg-indigo-400'
                      }`}
                    />
                    <span>{pulse.status_label || 'Siaga & Adaptif'}</span>
                  </span>
                </div>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  24/7 Autonomous Self-Improvement, Persetujuan Inisiatif Web & Telegram, dan Ritme Sirkadian
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-3 py-2 rounded-xl border text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan'}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Hero Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 font-mono text-xs border-t border-inherit/40 mt-5">
          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Menunggu Persetujuan
            </span>
            <p className="text-lg font-bold text-amber-400 tabular-nums">
              {stats.pending ?? 0}
            </p>
            <span className="text-[10px] text-amber-500/80 font-sans">Perlu Ditinjau Mas Fahmi</span>
          </div>

          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Telah Diterapkan
            </span>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">
              {(stats.executed || 0) + (stats.approved || 0)}
            </p>
            <span className="text-[10px] text-emerald-500/80 font-sans">Self-Improvement Sukses</span>
          </div>

          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Engagement Response Rate
            </span>
            <p className="text-lg font-bold text-cyan-400 tabular-nums">
              {pulse.engagement_pct ?? 100}%
            </p>
            <span className="text-[10px] text-cyan-500/80 font-sans">
              {pulse.consecutive_unanswered ?? 0} Unreplied (Anti-Nagging)
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border transition-colors ${
              isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white/80 border-slate-200/80 shadow-2xs'
            }`}
          >
            <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Mode Sirkadian WIB
            </span>
            <p className="text-sm font-bold text-rose-400 truncate">
              {pulse.circadian_mode || 'NIGHTLY_REFLECTION'}
            </p>
            <span className="text-[10px] text-rose-500/80 font-sans truncate block">
              {pulse.circadian_desc || 'Refleksi Harian Singkat'}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SUB-NAVIGATION TABS                                     */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-inherit pb-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-slate-900/30 border-slate-800/80">
          <button
            onClick={() => { playClickSound(); setActiveSubTab('inbox'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'inbox'
                ? isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 shadow-xs font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Inisiatif & Proposal Inbox</span>
            {stats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-amber-500/30 text-amber-300 font-bold">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => { playClickSound(); setActiveSubTab('propose'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'propose'
                ? isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 shadow-xs font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ajukan Ide Mas Fahmi</span>
          </button>

          <button
            onClick={() => { playClickSound(); setActiveSubTab('circadian'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'circadian'
                ? isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 shadow-xs font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Radar Sirkadian 24H</span>
          </button>

          <button
            onClick={() => { playClickSound(); setActiveSubTab('audit'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'audit'
                ? isDark
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                  : 'bg-white text-rose-700 border border-rose-200 shadow-xs font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Perbaikan</span>
          </button>

          <button
            onClick={() => { playClickSound(); setActiveSubTab('techradar'); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'techradar'
                ? isDark
                  ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40 shadow-xs'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tech Radar & Bacaan</span>
          </button>
        </div>

        {/* Filter Pills (Shown only on Inbox tab) */}
        {activeSubTab === 'inbox' && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Status</option>
              <option value="PENDING">Menunggu Persetujuan</option>
              <option value="APPROVED">Disetujui</option>
              <option value="EXECUTED">Telah Diterapkan</option>
              <option value="REJECTED">Ditolak</option>
            </select>

            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-sans transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Semua Domain</option>
              <option value="SERVER">Server Hardening</option>
              <option value="DASHBOARD">Dashboard UI</option>
              <option value="PORTO">Portfolio & CV</option>
              <option value="ARUSUKA">Arusuka Persona</option>
              <option value="TOOLING">Tooling & Automation</option>
            </select>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. TAB CONTENT: INBOX & PROPOSALS                         */}
      {/* ========================================================= */}
      {activeSubTab === 'inbox' && (
        <div className="space-y-4">
          {proposals.length === 0 ? (
            <div
              className={`p-12 text-center rounded-2xl border ${
                isDark ? 'bg-[#0e121d] border-slate-800/80 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <Lightbulb className="w-10 h-10 mx-auto mb-3 text-slate-500 opacity-60" />
              <h3 className="text-base font-semibold font-sans mb-1">Belum Ada Inisiatif di Kategori Ini</h3>
              <p className="text-xs">Sentinel terus mengamati sistem secara 24/7 dan akan mengajukan inisiatif baru secara berkala.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {proposals.map((item) => {
                const dom = DOMAIN_CONFIG[item.domain] || { label: item.domain, color: 'slate', icon: Sparkles };
                const IconComp = dom.icon;
                const isPending = item.status === 'PENDING';
                const isExecuting = item.status === 'EXECUTING';
                const isExecuted = item.status === 'EXECUTED';
                const isApproved = item.status === 'APPROVED';
                const isFailed = item.status === 'FAILED';
                const isRejected = item.status === 'REJECTED';
                const isLoadingAction = actionLoadingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-6 rounded-2xl border shadow-sm transition-all duration-200 ${
                      isDark
                        ? isPending
                          ? 'bg-[#0f1422] border-slate-800/90 hover:border-slate-700'
                          : 'bg-[#0c0f18] border-slate-800/60 opacity-90'
                        : isPending
                        ? 'bg-white border-slate-200/90 hover:border-slate-300'
                        : 'bg-slate-50/80 border-slate-200 opacity-90'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Domain & Details */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                          {/* Domain Badge */}
                          <span
                            className={`badge-capsule gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-semibold font-sans flex items-center ${
                              item.domain === 'SERVER'
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : item.domain === 'DASHBOARD'
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : item.domain === 'PORTO'
                                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                : item.domain === 'ARUSUKA'
                                ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                                : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            }`}
                          >
                            <IconComp className="w-3 h-3" />
                            <span>{dom.label}</span>
                          </span>

                          {/* Risk Level Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-sans ${
                              item.risk_level === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 font-semibold'
                                : 'bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            {item.risk_level === 'CRITICAL' ? '⚠️ Perlu Konfirmasi' : '🛡️ Aman (Non-Destruktif)'}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-sans flex items-center gap-1 ${
                              isPending
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : isExecuting
                                ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse'
                                : isExecuted
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : isApproved
                                ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                                : isFailed
                                ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-700/40 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {isPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                            {isExecuting && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />}
                            {isExecuted && <Check className="w-3 h-3 text-emerald-400" />}
                            {isFailed && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                            <span>
                              {isPending
                                ? 'PENDING'
                                : isExecuting
                                ? 'MENERAPKAN...'
                                : isExecuted
                                ? 'EXECUTED'
                                : isApproved
                                ? 'APPROVED'
                                : isFailed
                                ? 'FAILED'
                                : item.status}
                            </span>
                          </span>

                          {item.source === 'user_fahmi' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] bg-indigo-500/20 text-indigo-300 font-sans">
                              Ide Mas Fahmi
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2
                          className={`text-base sm:text-lg font-bold font-sans ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h2>

                        {/* Observasi & Problem */}
                        <div
                          className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                            isDark ? 'bg-slate-900/70 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <p className="font-semibold text-[11px] font-sans uppercase tracking-wider text-slate-400">
                            🔍 Observasi Sentinel:
                          </p>
                          <p className="leading-relaxed font-sans">{item.observation}</p>
                        </div>

                        {/* Action Plan & Benefit Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div
                            className={`p-3 rounded-xl border space-y-1 ${
                              isDark ? 'bg-slate-900/50 border-slate-800/70 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-indigo-400 block">
                              🛠️ Rencana Aksi Teknis:
                            </span>
                            <p className="leading-relaxed font-mono text-[11px]">{item.action_plan}</p>
                          </div>

                          <div
                            className={`p-3 rounded-xl border space-y-1 ${
                              isDark ? 'bg-slate-900/50 border-slate-800/70 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-emerald-400 block">
                              ✨ Dampak & Manfaat:
                            </span>
                            <p className="leading-relaxed font-sans text-[11px]">{item.benefit}</p>
                          </div>
                        </div>

                        {/* Resolution Notes if available */}
                        {item.resolution_notes && (
                          <div
                            className={`p-2.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                              isDark
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Catatan Eksekusi: {item.resolution_notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions Column */}
                      <div className="flex flex-row lg:flex-col items-center justify-end gap-2.5 shrink-0 pt-2 lg:pt-0">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleProposalAction(item.id, 'approve')}
                              disabled={isLoadingAction}
                              className="px-4 py-2 rounded-xl text-xs font-semibold font-sans flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isLoadingAction ? 'Memproses...' : 'Setujui & Terapkan'}</span>
                            </button>

                            <button
                              onClick={() => handleProposalAction(item.id, 'reject')}
                              disabled={isLoadingAction}
                              className={`px-3 py-2 rounded-xl text-xs font-sans flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                                isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-500/40'
                                  : 'bg-white border-slate-200 text-slate-600 hover:text-rose-700 hover:border-rose-200 shadow-2xs'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>

                            <button
                              onClick={() => handleProposalAction(item.id, 'snooze')}
                              disabled={isLoadingAction}
                              className={`px-3 py-2 rounded-xl text-xs font-sans flex items-center gap-1.5 border transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                                isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Tunda</span>
                            </button>
                          </>
                        ) : isExecuting ? (
                          <div className="flex items-center gap-2 text-xs font-sans text-blue-400 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 animate-pulse">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                            <span>Sedang Diterapkan...</span>
                          </div>
                        ) : isExecuted ? (
                          <div className="flex items-center gap-2 text-xs font-sans text-emerald-400 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Telah Diterapkan</span>
                          </div>
                        ) : isApproved ? (
                          <div className="flex items-center gap-2 text-xs font-sans text-teal-400 p-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            <span>Disetujui</span>
                          </div>
                        ) : isFailed ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2 text-xs font-sans text-rose-400 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                              <span>Gagal Diterapkan</span>
                            </div>
                            <button
                              onClick={() => handleProposalAction(item.id, 'approve')}
                              disabled={isLoadingAction}
                              className="px-3 py-1 rounded-lg text-[11px] font-sans text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition-all cursor-pointer"
                            >
                              Coba Lagi
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs font-sans text-slate-400 p-2 rounded-xl bg-slate-800/30 border border-slate-800">
                            <XCircle className="w-4 h-4 text-slate-500" />
                            <span>Ditolak</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. TAB CONTENT: AJUKAN IDE MAS FAHMI (MANUAL REQUEST)      */}
      {/* ========================================================= */}
      {activeSubTab === 'propose' && (
        <section
          className={`p-6 sm:p-7 rounded-2xl border ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="max-w-2xl mx-auto space-y-5">
            <div>
              <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                💡 Ajukan Ide atau Tantangan ke Arusuka Sentinel
              </h2>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Tuliskan perbaikan, fitur baru, atau inspeksi server yang Mas Fahmi butuhkan. Ide ini akan masuk ke antrean inisiatif Sentinel dan otomatis tercatat ke Second Brain Inbox.
              </p>
            </div>

            <form onSubmit={handleSubmitCustomRequest} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Judul Inisiatif / Ide Singkat
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Optimasi cache Nginx atau perbarui portofolio proyek Go"
                  value={customForm.title}
                  onChange={(e) => setCustomForm({ ...customForm, title: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-colors ${
                    isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Domain Kategori
                  </label>
                  <select
                    value={customForm.domain}
                    onChange={(e) => setCustomForm({ ...customForm, domain: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-colors ${
                      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="SERVER">Server Hardening & Performance</option>
                    <option value="DASHBOARD">Dashboard OMNI Command Center</option>
                    <option value="PORTO">Portfolio & CV Karir</option>
                    <option value="ARUSUKA">Arusuka Persona & Chat</option>
                    <option value="TOOLING">Automation & Tooling</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Rencana Teknis (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Buat systemd timer atau ubah konfigurasi nginx.conf"
                    value={customForm.action_plan}
                    onChange={(e) => setCustomForm({ ...customForm, action_plan: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-colors ${
                      isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Detail Observasi / Deskripsi Kebutuhan
                </label>
                <textarea
                  rows={4}
                  placeholder="Jelaskan apa yang ingin dicapai, alasan perbaikan, atau kendala yang dihadapi saat ini..."
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-colors ${
                    isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingCustom}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold font-sans flex items-center gap-2 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingCustom ? 'Mengirim...' : 'Kirim ke Antrean Sentinel'}</span>
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 5. TAB CONTENT: RADAR SIRKADIAN 24H                        */}
      {/* ========================================================= */}
      {activeSubTab === 'circadian' && (
        <section
          className={`p-6 sm:p-7 rounded-2xl border space-y-6 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Radar Sirkadian 24-Jam Biologis Mas Fahmi (WIB)
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Sentinel mengatur ritme proaktif secara otomatis agar tidak mengganggu jam kerja atau jam tidur Mas Fahmi.
            </p>
          </div>

          {/* 6 Circadian Blocks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {circadianTimeline.map((block) => {
              const isCurrentMode = pulse.circadian_mode === block.mode;
              return (
                <div
                  key={block.mode}
                  className={`p-4 rounded-xl border transition-all duration-200 ${
                    isCurrentMode
                      ? isDark
                        ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                        : 'bg-rose-50/80 border-rose-300 shadow-sm'
                      : isDark
                      ? 'bg-slate-900/60 border-slate-800/80'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-400">{block.time}</span>
                    {isCurrentMode && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-rose-500/20 text-rose-300 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                        Saat Ini Aktif
                      </span>
                    )}
                  </div>
                  <h3 className={`text-sm font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                    {block.name}
                  </h3>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{block.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Anti-Nagging & Pacing Explanation */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              isDark ? 'bg-slate-900/40 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <h4 className="font-bold font-sans text-rose-400 uppercase tracking-wider text-[11px]">
              🛡️ Protokol Anti-Nagging & Discrete Backoff
            </h4>
            <p className="leading-relaxed">
              Jika Mas Fahmi tidak membalas pesan Sentinel, interval pesan berikutnya akan otomatis memanjang secara eksponensial (2 jam → 3.5 jam → 6 jam). Jika mencapai 3 pesan tanpa balasan, Sentinel masuk ke <b>Mode Hening Total (Discreet Mode)</b> hingga Mas Fahmi menyapa kembali di Telegram atau menyetujui inisiatif di web ini.
            </p>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* 6. TAB CONTENT: RIWAYAT PERBAIKAN SISTEM                   */}
      {/* ========================================================= */}
      {activeSubTab === 'audit' && (
        <section
          className={`p-6 sm:p-7 rounded-2xl border space-y-5 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <h2 className={`text-lg font-bold font-sans ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Audit Log & Riwayat Milestone Perbaikan Sistem
            </h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Rekam jejak tindakan self-improvement yang telah dieksekusi dan tersimpan di Obsidian Second Brain.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {proposals.filter(p => p.status === 'EXECUTED' || p.status === 'APPROVED').map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold font-sans text-sm text-slate-100">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                      {item.domain}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans pl-6">{item.action_plan}</p>
                </div>
                <div className="text-right shrink-0 pl-6 sm:pl-0">
                  <span className="text-[10px] text-emerald-400 font-semibold block">Telah Diterapkan</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {item.executed_at ? new Date(item.executed_at * 1000).toLocaleString('id-ID') : 'Baru saja'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tech Radar & Curated Reads View */}
      {activeSubTab === 'techradar' && (
        <TechRadarView isDark={isDark} />
      )}
    </div>
  );
}

