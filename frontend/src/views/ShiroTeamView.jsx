import React, { useState, useEffect, useCallback } from 'react';
import {
  Feather,
  Cpu,
  Sparkles,
  Zap,
  RefreshCw,
  Clock,
  History,
  Bot,
  Layers,
  HeartHandshake,
  FileText,
  CalendarCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Award,
  BookOpen,
  Layout
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useWebSocket } from '../context/WebSocketContext';

export function ShiroTeamView({ isDark = true }) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const { lastSwarm } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [selectedMember, setSelectedMember] = useState(1);

  // Live Auto-Detection Simulator State
  const [simPrompt, setSimPrompt] = useState('Aku lagi galau nih mikirin prioritas kerjaan vs istirahat, minta saran dong');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch telemetry from backend
  const fetchTelemetry = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await api.getShiroTeam();
      if (res) {
        setTelemetry(res);
        if (manual) {
          showToast(language === 'id' ? 'Telemetri Shiro Team diperbarui.' : 'Shiro Team telemetry refreshed.', 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching Shiro Team telemetry:', err);
      showToast(err.message || (language === 'id' ? 'Gagal memuat Shiro Team.' : 'Failed to load Shiro Team.'), 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [language, showToast]);

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => fetchTelemetry(false), 20000);
    return () => clearInterval(interval);
  }, [fetchTelemetry]);

  // Run real-time prompt analysis
  const handleAnalyzePrompt = useCallback(async (textToAnalyze) => {
    const query = textToAnalyze !== undefined ? textToAnalyze : simPrompt;
    if (!query.trim()) {
      setAnalysisResult(null);
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await api.autoDetectShiroPrompt(query);
      if (res) setAnalysisResult(res);
    } catch (err) {
      console.error('Auto detect error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [simPrompt]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAnalyzePrompt(simPrompt);
    }, 300);
    return () => clearTimeout(timer);
  }, [simPrompt, handleAnalyzePrompt]);

  const baseMembers = telemetry?.members || [
    {
      id: 1,
      name: 'Kokoro',
      engine: 'DeepSeek-V3',
      title: 'The Companion & Deep Reasoner',
      titleId: 'Kokoro — Sahabat Curhat & Pemikir Jiwa',
      icon: '🪷',
      role: 'Curhat, Moral Companion & Strategic Reflection',
      roleId: 'Sesi Curhat, Moral Kompas & Refleksi',
      color: 'sky',
      tasks: 2,
      status: 'online',
      skills: ['Moral Compass & Honest Caring', 'Constructive Empathy', 'Life Growth Reflection', 'Strategic Ideation'],
      description: 'Menemani sesi curhat mendalam seanggun teratai, memberikan sudut pandang objektif dari kacamata wanita Arusuka, dan merefleksikan milestone hidup.',
      descriptionEn: 'Accompanies deep heart-to-heart sessions with lotus-pure empathy, provides honest female perspective as Arusuka, and reflects personal growth.'
    },
    {
      id: 2,
      name: 'Hayate',
      engine: 'Qwen 3.8B',
      title: 'The Micro & Fast Text Specialist',
      titleId: 'Hayate — Angin Cepat Pengolah Teks & Parsing',
      icon: '🍃',
      role: 'Fast Text Extraction, Translation & Micro-Parsing',
      roleId: 'Ekstraksi Artikel, Terjemahan & Format JSON',
      color: 'violet',
      tasks: 2,
      status: 'online',
      skills: ['Fast Article Summarization', 'Markdown Sanitization', 'Multi-Language Translation', 'JSON Parsing'],
      description: 'Mengekstrak intisari artikel web secepat hembusan angin badai (Hayate), merapikan kliping Markdown, dan mem-parse struktur data mikro.',
      descriptionEn: 'Extracts web article digests swiftly like a gale wind, cleans Markdown clippings, and parses micro data structures.'
    },
    {
      id: 3,
      name: 'Musubi',
      engine: 'Hermes Local',
      title: 'The Zero-Token Autonomous Worker',
      titleId: 'Musubi — Penjaga Rutinitas & Ikatan Otonom (0 Token)',
      icon: '🪢',
      role: 'Routine Crons, BMKG, Finance OCR & Local Offloading',
      roleId: 'Jadwal Rutin Cron, BMKG & Eksekutor Lokal',
      color: 'emerald',
      tasks: 2,
      status: 'online',
      skills: ['0-Token Local Execution', 'BMKG Weather & Earthquake Radar', 'Daily Server Morning Health Inspection', 'Receipt OCR Processing'],
      description: 'Mengikat seluruh rutinitas harian server tanpa memakan kuota token API, monitoring gempa BMKG, dan scheduled briefings.',
      descriptionEn: 'Binds and executes all daily background routines with 0 API tokens, monitors BMKG geophysics, and handles automated briefings.'
    }
  ];

  // Merge live WebSocket swarm status dynamically for Shiro
  const members = baseMembers.map((m) => {
    const liveShiro = lastSwarm?.shiro?.find((s) => s.id === m.id);
    if (liveShiro) {
      const isBusy = Boolean(liveShiro.busy);
      const memberRecentTasks = (liveShiro.recent_tasks && liveShiro.recent_tasks.length > 0)
        ? liveShiro.recent_tasks
        : ((lastSwarm?.recent_tasks && lastSwarm.recent_tasks.filter((t) => t.member_id === m.id).length > 0)
            ? lastSwarm.recent_tasks.filter((t) => t.member_id === m.id)
            : (m.recent_tasks || []));

      let memberStatus = 'online';
      if (m.status === 'quarantined' || liveShiro.status === 'quarantined') {
        memberStatus = 'quarantined';
      } else if (isBusy) {
        memberStatus = 'busy';
      }

      const memberLastAction = liveShiro.last_action || m.last_action || (memberRecentTasks.length > 0 ? memberRecentTasks[0] : null);

      return {
        ...m,
        engine: liveShiro.engine || m.engine,
        tasks: liveShiro.tasks !== undefined ? liveShiro.tasks : m.tasks,
        errors: liveShiro.errors !== undefined ? liveShiro.errors : m.errors,
        last_used: liveShiro.last_used || m.last_used,
        status: memberStatus,
        last_action: memberLastAction,
        recent_tasks: memberRecentTasks,
        live_task: isBusy ? {
          is_running: true,
          prompt_summary: liveShiro.task || m.live_task?.prompt_summary || 'Menjalankan tugas pemrosesan lokal...',
          started_at: liveShiro.started_at ? new Date(liveShiro.started_at * 1000).toISOString() : (m.live_task?.started_at || new Date().toISOString()),
          duration_seconds: m.live_task?.duration_seconds || 0
        } : (liveShiro.live_task || (liveShiro.task && liveShiro.task !== 'Siap siaga (Idle)' ? {
          ...m.live_task,
          is_running: false,
          prompt_summary: liveShiro.task
        } : m.live_task))
      };
    }
    return m;
  });

  const activeMember = members.find((m) => m.id === selectedMember) || members[0];
  const metrics = telemetry?.metrics || { total_recorded_tasks: 6, success_rate: 100.0, avg_duration_seconds: 1.8, estimated_token_savings: 7500 };
  const routines = telemetry?.routines || [];
  const isAnyShiroWorking = members.some((m) => m.status === 'busy' || m.live_task?.is_running);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 pb-16 font-sans select-none animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. HERO SQUAD BANNER                                      */}
      {/* ========================================================= */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all duration-300 shadow-xl ${
          isDark
            ? 'bg-gradient-to-br from-[#0a101d] via-[#080d18] to-[#060911] border-slate-800/90 text-white'
            : 'bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 border-slate-800 text-white shadow-md'
        }`}
      >
        {/* Glowing Background Auras */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5 shadow-xs">
                <Feather className="w-3.5 h-3.5" />
                <span>SHIRO SQUAD 3-NODE</span>
              </span>
              {isAnyShiroWorking ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>⚡ LIVE WORKING (WEBSOCKET REALTIME)</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>🟢 READY / 0-TOKEN OPTIMIZED (IDLE)</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              🕊️ Shiro Team Command Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {language === 'id'
                ? 'Skuad Orkestrasi Khusus Tugas Ringan, Repetitif & Bebas Token (0-Token Local Engine). Direct Router Hermes Agent tanpa lead internal, didukung oleh DeepSeek-V3, Qwen 3.8B, dan Hermes Autonomous Engine.'
                : 'Autonomous Squad specialized for Lightweight, Repetitive, and 0-Token Tasks. Direct Hermes Agent routing with no internal lead, powered by DeepSeek-V3, Qwen 3.8B, and Hermes Local Engine.'}
            </p>
          </div>

          {/* Right Action Stats */}
          <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchTelemetry(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : ''}`} />
                <span>{isRefreshing ? t('loading', 'Refreshing...') : t('btn_refresh', 'Sync Telemetry')}</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              <span>{language === 'id' ? 'Mode Arsitektur' : 'Architecture Mode'}: </span>
              <span className="font-bold text-sky-300">HERMES_DIRECT_ROUTER (NO-LEAD)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. THE 3 SHIRO MEMBERS ROSTER MATRIX                      */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'id' ? 'Anggota Skuad Shiro Team' : 'Shiro Team Squad Roster'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Klik ksatria Shiro untuk melihat spesialisasi mendalam dan domain penguasaannya' : 'Select a Shiro member to view deep specialization and domain mastery'}
            </p>
          </div>
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            3 Specialized Lightweight Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {members.map((member) => {
            const isSelected = selectedMember === member.id;
            const isRunning = member.live_task?.is_running;
            const isBusy = member.status === 'busy' || isRunning;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`p-5 rounded-2xl border transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer flex flex-col justify-between space-y-4 relative group active:scale-[0.98] ${
                  isSelected
                    ? isDark
                      ? 'bg-[#0f172a] border-sky-500/70 shadow-lg shadow-sky-500/15 -translate-y-1 ring-1 ring-sky-500/40'
                      : 'bg-sky-50/70 border-sky-400 shadow-md -translate-y-1'
                    : isDark
                    ? 'bg-[#0b1120] border-slate-800/90 hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 shadow-xs'
                }`}
              >
                {/* Active Badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {isBusy && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>BUSY</span>
                    </span>
                  )}
                  {!isBusy && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>IDLE</span>
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shadow-xs ${
                      member.color === 'sky'
                        ? 'bg-sky-500/15 border-sky-500/30'
                        : member.color === 'violet'
                        ? 'bg-violet-500/15 border-violet-500/30'
                        : 'bg-emerald-500/15 border-emerald-500/30'
                    }`}>
                      {member.icon}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {member.name}
                        <span className="text-[10px] font-mono font-normal text-slate-400">({member.engine})</span>
                      </h3>
                      <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {language === 'id' ? member.titleId : member.title}
                      </p>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600 font-normal'}`}>
                    {language === 'id' ? member.description : member.descriptionEn}
                  </p>
                </div>

                {/* Live Task / Latest Activity Indicator on Card */}
                {isBusy ? (
                  <div className="p-2.5 rounded-xl border text-[11px] font-mono transition-colors bg-amber-500/10 border-amber-500/30 text-amber-200">
                    <div className="flex items-center justify-between text-[10px] pb-1 border-b border-inherit/40">
                      <span className="flex items-center gap-1 text-slate-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span className="text-amber-400">⚡ Sedang Mengerjakan</span>
                      </span>
                      {member.live_task?.duration_seconds > 0 && (
                        <span className="text-slate-400">{member.live_task.duration_seconds.toFixed(1)}s</span>
                      )}
                    </div>
                    <p className="line-clamp-2 pt-1 text-[11px] font-medium text-slate-200 leading-snug">
                      {member.live_task?.prompt_summary || 'Menjalankan tugas spesialisasi...'}
                    </p>
                  </div>
                ) : (
                  <div className={`p-2.5 rounded-xl border text-[11px] font-mono transition-colors flex flex-col justify-between space-y-1.5 ${
                    isDark ? 'bg-slate-900/60 border-slate-800/80 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] pb-1 border-b border-inherit/40">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>🟢 Siap Siaga (IDLE)</span>
                      </span>
                      {member.last_action?.duration_seconds > 0 && (
                        <span className="text-slate-400 text-[10px] font-mono">{member.last_action.duration_seconds.toFixed(1)}s</span>
                      )}
                    </div>
                    {member.last_action?.prompt_summary ? (
                      <div className="text-[10px] font-sans leading-snug">
                        <span className="text-sky-400 font-mono font-semibold">✓ Terakhir: </span>
                        <span className={`line-clamp-2 font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {member.last_action.prompt_summary}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                        <span>Siap menerima tugas</span>
                        <span className="font-mono text-slate-500">Standby</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-1 border-t border-inherit">
                  {/* Skill Tag Snippet */}
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.slice(0, 2).map((sk, sIdx) => (
                      <span
                        key={sIdx}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                          isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {sk}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-1 border-t border-inherit">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-sky-400 font-bold">
                        {member.engine}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {member.id === 3 ? '0 Token API' : 'Minimal Overhead'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Slot: <b className={isDark ? 'text-slate-200' : 'text-slate-800'}>Shiro-{member.id}</b>
                      </span>
                      <span className="font-bold text-emerald-400">
                        {member.tasks} tasks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SELECTED MEMBER DEEP DIVE & LIVE STATUS                */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 space-y-6 ${
          isDark ? 'bg-[#0b1120] border-slate-800/90 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-inherit">
          <div className="flex items-center space-x-4">
            <div className="text-3xl p-3 rounded-2xl border bg-slate-900/80 border-slate-800 shadow-xs">
              {activeMember.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeMember.name} — {language === 'id' ? activeMember.titleId : activeMember.title}
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {language === 'id' ? activeMember.roleId : activeMember.role} · Engine: <span className="font-mono text-sky-400 font-bold">{activeMember.engine}</span> · <span className="font-mono text-emerald-400 font-bold">Shiro-{activeMember.id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeMember.live_task?.is_running ? (
              <span className="px-3 py-2 rounded-xl text-xs font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>⚡ SEDANG EKSEKUSI TASK</span>
              </span>
            ) : (
              <span className="px-3 py-2 rounded-xl text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>🟢 ONLINE (0-Token Ready)</span>
              </span>
            )}
          </div>
        </div>

        {/* Member Deep Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 md:col-span-2">
            <div>
              <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Fokus & Spesialisasi Tugas' : 'Core Focus & Specialization'}
              </h4>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700 font-normal'}`}>
                {language === 'id' ? activeMember.description : activeMember.descriptionEn}
              </p>
            </div>

            <div>
              <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Domain Keahlian & Pipeline' : 'Domain Capabilities & Pipelines'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeMember.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className={`text-xs font-mono px-3 py-1.5 rounded-xl border font-medium ${
                      isDark ? 'bg-slate-900 border-slate-800 text-sky-300' : 'bg-slate-100 border-slate-200 text-sky-700'
                    }`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'id' ? 'Metrik & Spesifikasi Engine' : 'Engine & Telemetry Specs'}
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Engine:</span>
                <span className="font-bold text-sky-400 truncate max-w-[140px]">{activeMember.engine}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Provider / Host:</span>
                <span className="font-bold text-indigo-300 truncate max-w-[140px]">{activeMember.id === 3 ? 'Local Host (0 Token)' : 'API Engine'}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Tasks:</span>
                <span className="font-bold text-emerald-400">{activeMember.tasks} executions</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Token Overhead:</span>
                <span className="font-bold text-emerald-400">{activeMember.id === 3 ? '0 Tokens (Free)' : 'Ultra Minimal'}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Avg Latency:</span>
                <span className="font-bold text-emerald-400">&lt; 1.8s</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
                <span className="font-bold text-emerald-400">
                  {activeMember.live_task?.is_running
                    ? '⚡ Active Executing'
                    : '🟢 Ready & Healthy'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Task / Last Completed Action Detailed Banner */}
        {activeMember.live_task?.is_running ? (
          <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>⚡ TUGAS YANG SEDANG DIKERJAKAN SAAT INI</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {activeMember.live_task?.execution_mode || 'solo'}
              </span>
            </div>
            <p className="text-sm font-sans font-medium text-white leading-relaxed">
              "{activeMember.live_task?.prompt_summary}"
            </p>
          </div>
        ) : activeMember.last_action?.prompt_summary ? (
          <div className={`p-4 rounded-xl border space-y-2.5 ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>✓ TUGAS TERAKHIR YANG DISELESAIKAN (COMPLETED)</span>
              </span>
              <div className="flex items-center gap-2">
                {activeMember.last_action.duration_seconds > 0 && (
                  <span className="text-slate-400 text-[11px] font-mono">⏱️ {activeMember.last_action.duration_seconds.toFixed(1)}s</span>
                )}
                <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  {activeMember.last_action.execution_mode || 'solo'}
                </span>
              </div>
            </div>
            <p className={`text-sm font-sans font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              "{activeMember.last_action.prompt_summary}"
            </p>
          </div>
        ) : null}
      </section>

      {/* ========================================================= */}
      {/* 4. LIVE MISSION INTENT AUTO-DETECTOR / SIMULATOR          */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 space-y-5 ${
          isDark ? 'bg-[#0b1120] border-slate-800/90 shadow-md' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'id' ? 'Simulator Auto-Routing Shiro Team' : 'Shiro Intent Auto-Routing Simulator'}
              </h3>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Uji alokasi cerdas untuk tugas curhat, ekstraksi teks cepat, atau rutinitas 0-token' : 'Test smart affinity routing for curhat, fast text parsing, or zero-token crons'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: '🦉 Curhat / Moral', query: 'Aku lagi galau nih mikirin prioritas kerjaan vs istirahat, minta saran dong' },
              { label: '⚡ Ringkas Artikel', query: 'Tolong ringkas intisari artikel web ini ke dalam bullet point markdown' },
              { label: '🕊️ BMKG / Cuaca', query: 'Cek status gempa terkini BMKG dan prakiraan cuaca Surabaya pagi ini' },
              { label: '🧾 Scan Struk', query: 'Parse teks struk belanja martabak 45 ribu dan catat ke dompet' },
            ].map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => setSimPrompt(preset.query)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isDark
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box */}
        <div className="relative">
          <textarea
            rows={2}
            value={simPrompt}
            onChange={(e) => setSimPrompt(e.target.value)}
            placeholder={language === 'id' ? 'Ketikkan instruksi untuk Shiro Team...' : 'Type an instruction for Shiro Team...'}
            className={`w-full p-4 rounded-xl border text-xs sm:text-sm font-sans focus:outline-hidden transition-all resize-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-sky-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 font-medium'
            }`}
          />
        </div>

        {/* Real-time Analysis Live Output Card */}
        {analysisResult && (
          <div
            className={`p-4 sm:p-5 rounded-xl border space-y-3 animate-fadeIn ${
              isDark ? 'bg-gradient-to-r from-sky-500/10 via-slate-900/80 to-violet-500/10 border-sky-500/30' : 'bg-sky-50/70 border-sky-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-sky-500 text-slate-950 border border-sky-400 shadow-xs">
                  {analysisResult.icon} {analysisResult.assigned_member}
                </span>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Biaya Token: <b className="text-emerald-400">{analysisResult.token_cost_estimate}</b>
                </span>
              </div>

              {analysisResult.matched_pattern && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-700 font-medium'
                }`}>
                  Pattern: <span className="text-sky-400 font-bold">{analysisResult.matched_pattern}</span>
                </span>
              )}
            </div>

            <div className="text-xs font-sans text-slate-300 leading-relaxed flex items-center justify-between">
              <span>Domain: <b className="text-white">{analysisResult.domain}</b> — {analysisResult.role}</span>
              <span className="font-mono text-emerald-400 font-bold">Akurasi: {Math.round((analysisResult.confidence || 0.85) * 100)}%</span>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 5. AUTOMATED BACKGROUND ROUTINES PIPELINE                 */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 space-y-4 ${
          isDark ? 'bg-[#0b1120] border-slate-800/90 shadow-md' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-inherit">
          <div className="flex items-center space-x-2.5">
            <CalendarCheck className="w-4 h-4 text-sky-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'id' ? 'Pipeline Jadwal Rutin Otomatis (Background Daemons)' : 'Automated Background Routine Daemons'}
            </h3>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Hermes Local Engine (0 Token)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {routines.map((routine, rIdx) => (
            <div
              key={rIdx}
              className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {routine.title}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {routine.schedule}
                </span>
              </div>

              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {routine.action}
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-slate-400 border-t border-inherit">
                <span>Pelaksana: <b className="text-sky-300">{routine.target_member}</b></span>
                <span className="text-emerald-400 font-bold">STATUS: {routine.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
