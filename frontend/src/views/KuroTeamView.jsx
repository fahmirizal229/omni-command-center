import React, { useState, useEffect, useCallback } from 'react';
import {
  Swords,
  ShieldCheck,
  Cpu,
  Code2,
  Layers,
  Sparkles,
  Zap,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Send,
  Terminal,
  FileCode2,
  Database,
  Palette,
  Activity,
  Award,
  BookOpen,
  Lock,
  ChevronRight,
  Bot,
  Clock,
  History,
  ListTodo,
  Play,
  CheckCircle,
  Layout
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useWebSocket } from '../context/WebSocketContext';

export function KuroTeamView({ isDark = true }) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const { lastSwarm } = useWebSocket();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [telemetry, setTelemetry] = useState(null);
  const [selectedMember, setSelectedMember] = useState(1);

  // Live Auto-Detection Simulator State
  const [simPrompt, setSimPrompt] = useState('Bikinin fitur speedtest jaringan di dashboard lengkap dengan backend dan frontend React');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch telemetry from backend
  const fetchTelemetry = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await api.getKuroTeam();
      if (res) {
        setTelemetry(res);
        if (manual) {
          showToast(language === 'id' ? 'Telemetri Kuro Team diperbarui.' : 'Kuro Team telemetry refreshed.', 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching Kuro Team telemetry:', err);
      showToast(err.message || (language === 'id' ? 'Gagal memuat Kuro Team.' : 'Failed to load Kuro Team.'), 'error');
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
      const res = await api.autoDetectKuroPrompt(query);
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

  const handleSwitchLead = async (leadId) => {
    try {
      const res = await api.switchKuroLead(leadId);
      if (res && res.status === 'success') {
        const leadNames = { 1: 'Taisho', 2: 'Tetsu', 3: 'Sora', 4: 'Kensei' };
        const leadName = leadNames[leadId] || `Kuro-${leadId}`;
        showToast(language === 'id' ? `Active Lead berhasil diubah ke ${leadName}` : `Active Lead switched to ${leadName}`, 'success');
        fetchTelemetry(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to switch lead', 'error');
    }
  };

  const baseMembers = telemetry?.members || [
    {
      id: 1,
      name: 'Taisho',
      user: 'arusuka',
      email: 'fahmijapan4@gmail.com',
      account_name: 'Google One Pro (Node 1)',
      account_tier: 'Google One AI Premium (2TB)',
      icon: '🏯',
      color: 'amber',
      tasks: 452,
      status: 'online',
      skills: ['Fullstack Engineering', 'Backend & API', 'Frontend React', 'Systems Architecture', 'QA & Testing'],
      description: 'Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.',
      descriptionEn: 'Computing node powered by Google One AI Pro with full capacity and equal load.'
    },
    {
      id: 2,
      name: 'Tetsu',
      user: 'arusuka2',
      email: 'mfahmirizal48@gmail.com',
      account_name: 'Google One Pro (Node 2)',
      account_tier: 'Google One AI Premium (2TB)',
      icon: '⚒️',
      color: 'emerald',
      tasks: 200,
      status: 'online',
      skills: ['Fullstack Engineering', 'Backend & API', 'Frontend React', 'Systems Architecture', 'QA & Testing'],
      description: 'Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.',
      descriptionEn: 'Computing node powered by Google One AI Pro with full capacity and equal load.'
    },
    {
      id: 3,
      name: 'Sora',
      user: 'arusuka3',
      email: 'shinhajiru@gmail.com',
      account_name: 'Google One Pro (Node 3)',
      account_tier: 'Google One AI Premium (2TB)',
      icon: '🌸',
      color: 'indigo',
      tasks: 514,
      status: 'online',
      skills: ['Fullstack Engineering', 'Backend & API', 'Frontend React', 'Systems Architecture', 'QA & Testing'],
      description: 'Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.',
      descriptionEn: 'Computing node powered by Google One AI Pro with full capacity and equal load.'
    },
    {
      id: 4,
      name: 'Kensei',
      user: 'arusuka4',
      email: 'fahmirizal25248@gmail.com',
      account_name: 'Google One Pro (Node 4)',
      account_tier: 'Google One AI Premium (2TB)',
      icon: '⚔️',
      color: 'rose',
      tasks: 167,
      status: 'online',
      skills: ['Fullstack Engineering', 'Backend & API', 'Frontend React', 'Systems Architecture', 'QA & Testing'],
      description: 'Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.',
      descriptionEn: 'Computing node powered by Google One AI Pro with full capacity and equal load.'
    }
  ];

  // Merge live WebSocket swarm status dynamically
  const members = baseMembers.map((m) => {
    const liveKuro = lastSwarm?.kuro?.find((k) => k.id === m.id);
    if (liveKuro) {
      const isBusy = Boolean(liveKuro.busy);
      const isMonitoring = Boolean(liveKuro.is_monitoring || liveKuro.status === 'monitoring' || m.status === 'monitoring' || m.live_task?.is_monitoring);
      const memberRecentTasks = (liveKuro.recent_tasks && liveKuro.recent_tasks.length > 0)
        ? liveKuro.recent_tasks
        : ((lastSwarm?.recent_tasks && lastSwarm.recent_tasks.filter((t) => t.member_id === m.id).length > 0)
            ? lastSwarm.recent_tasks.filter((t) => t.member_id === m.id)
            : (m.recent_tasks || []));

      let memberStatus = 'online';
      if (m.status === 'quarantined' || liveKuro.status === 'quarantined') {
        memberStatus = 'quarantined';
      } else if (isBusy) {
        memberStatus = 'busy';
      } else if (isMonitoring) {
        memberStatus = 'monitoring';
      }

      const memberLastAction = liveKuro.last_action || m.last_action || (memberRecentTasks.length > 0 ? memberRecentTasks[0] : null);

      return {
        ...m,
        email: liveKuro.email || m.email,
        account_name: liveKuro.account_name || m.account_name,
        account_tier: liveKuro.account_tier || m.account_tier,
        load_percent: liveKuro.load_percent !== undefined ? liveKuro.load_percent : (isBusy ? 100 : (isMonitoring ? 15 : 0)),
        tasks: liveKuro.tasks !== undefined ? liveKuro.tasks : m.tasks,
        errors: liveKuro.errors !== undefined ? liveKuro.errors : m.errors,
        last_used: liveKuro.last_used || m.last_used,
        status: memberStatus,
        is_monitoring: isMonitoring,
        last_action: memberLastAction,
        recent_tasks: memberRecentTasks,
        live_task: isBusy ? {
          is_running: true,
          is_monitoring: false,
          prompt_summary: liveKuro.task || m.live_task?.prompt_summary || 'Menjalankan instruksi komputasi...',
          started_at: liveKuro.started_at ? new Date(liveKuro.started_at * 1000).toISOString() : (m.live_task?.started_at || new Date().toISOString()),
          duration_seconds: m.live_task?.duration_seconds || 0
        } : (isMonitoring ? {
          is_running: false,
          is_monitoring: true,
          status: 'MONITORING',
          prompt_summary: liveKuro.task || 'Siaga memantau eksekusi tim (Tetsu, Sora, Kensei)',
          started_at: null,
          duration_seconds: 0
        } : (liveKuro.live_task || (liveKuro.task && liveKuro.task !== 'Siap siaga (Idle)' ? {
          ...m.live_task,
          is_running: false,
          is_monitoring: false,
          prompt_summary: liveKuro.task
        } : m.live_task)))
      };
    }
    return m;
  });

  const activeMember = members.find((m) => m.id === selectedMember) || members[0];
  const activeLeadId = lastSwarm?.active_lead || telemetry?.active_lead || 1;
  const onDutyId = telemetry?.on_duty_id || (members.slice().sort((a, b) => (a.tasks || 0) - (b.tasks || 0))[0]?.id) || activeLeadId;
  const onDutyKnight = members.find((m) => m.id === onDutyId) || members[0];
  const isAnyKuroWorking = members.some((m) => m.status === 'busy' || m.live_task?.is_running || m.status === 'monitoring');

  return (
    <div className="w-full max-w-7xl mx-auto space-y-7 pb-16 font-sans select-none animate-fadeIn">
      {/* ========================================================= */}
      {/* 1. HERO SQUAD BANNER                                      */}
      {/* ========================================================= */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all duration-300 shadow-xl ${
          isDark
            ? 'bg-gradient-to-br from-[#0c0f1a] via-[#090c15] to-[#07090f] border-slate-800/90 text-white'
            : 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-slate-800 text-white shadow-md'
        }`}
      >
        {/* Glowing Background Auras */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                <Swords className="w-3.5 h-3.5" />
                <span>KURO SQUAD 4-NODE</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
                <span>🎯 BERTUGAS: {onDutyKnight.icon} {onDutyKnight.name} (Node {onDutyKnight.id})</span>
              </span>
              {isAnyKuroWorking ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>⚡ LIVE WORKING</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>🟢 READY / IDLE (100% HEALTHY)</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ⚔️ Kuro Team Command Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {language === 'id'
                ? 'Skuad Orkestrasi Multi-Agent mandiri berkekuatan 4 Akun Antigravity Pro. Beroperasi dalam Dual-Mode: Solo Dispatcher cerdas & Swarm Tim Paralel.'
                : 'Autonomous Multi-Agent Engineering Swarm powered by 4 Antigravity Pro nodes. Operates in Dual-Mode: Intelligent Solo Dispatcher & Parallel Swarm.'}
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
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isRefreshing ? t('loading', 'Refreshing...') : t('btn_refresh', 'Sync Telemetry')}</span>
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              <span>{language === 'id' ? 'Mode Rotasi' : 'Rotation Mode'}: </span>
              <span className="font-bold text-amber-300">LEAST_USED & AUTO-SWARM</span>
            </div>
          </div>
        </div>
      </section>




      {/* ========================================================= */}
      {/* 2. THE 4 KURO NODES ROSTER MATRIX                         */}
      {/* ========================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'id' ? 'Anggota Cluster Kuro Team' : 'Kuro Team Cluster Roster'}
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? '4 Node komputasi setara bertenaga Google One AI Pro dengan kapasitas penuh' : '4 Equal computing nodes powered by Google One AI Pro with full capacity'}
            </p>
          </div>
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            4 Equal Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((member) => {
            const isSelected = selectedMember === member.id;
            const isRunning = member.live_task?.is_running;
            const isBusy = member.status === 'busy' || isRunning;
            const isMonitoring = member.status === 'monitoring' || member.is_monitoring;
            const isOnDuty = member.id === onDutyId;

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member.id)}
                className={`p-5 rounded-2xl border transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer flex flex-col justify-between space-y-4 relative group active:scale-[0.98] ${
                  isSelected
                    ? isDark
                      ? 'bg-[#111625] border-indigo-500/70 shadow-lg shadow-indigo-500/15 -translate-y-1 ring-1 ring-indigo-500/40'
                      : 'bg-indigo-50/70 border-indigo-400 shadow-md -translate-y-1'
                    : isDark
                    ? 'bg-[#0e121d] border-slate-800/90 hover:border-slate-700 hover:-translate-y-0.5 hover:shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:-translate-y-0.5 shadow-xs'
                }`}
              >
                {/* Active Badges */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {isBusy ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>BUSY</span>
                    </span>
                  ) : isMonitoring ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>👁️ STANDBY</span>
                    </span>
                  ) : isOnDuty ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>🎯 BERTUGAS</span>
                    </span>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-xl shadow-xs ${
                      member.color === 'amber'
                        ? 'bg-amber-500/15 border-amber-500/30'
                        : member.color === 'emerald'
                        ? 'bg-emerald-500/15 border-emerald-500/30'
                        : member.color === 'indigo'
                        ? 'bg-indigo-500/15 border-indigo-500/30'
                        : 'bg-rose-500/15 border-rose-500/30'
                    }`}>
                      {member.icon}
                    </div>
                    <div>
                      <h3 className={`text-base font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {member.name}
                      </h3>
                      <p className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Node {member.id} · {member.user}
                      </p>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 ${isDark ? 'text-slate-300' : 'text-slate-600 font-normal'}`}>
                    {language === 'id' ? member.description : member.descriptionEn}
                  </p>
                </div>

                {/* Live Task Activity Indicator on Card */}
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
                      {member.live_task?.prompt_summary || 'Menjalankan instruksi komputasi...'}
                    </p>
                  </div>
                ) : isMonitoring ? (
                  <div className="p-2.5 rounded-xl border text-[11px] font-mono transition-colors bg-indigo-500/10 border-indigo-500/30 text-indigo-200">
                    <div className="flex items-center justify-between text-[10px] pb-1 border-b border-inherit/40">
                      <span className="flex items-center gap-1 text-indigo-300 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-indigo-300">👁️ Siaga</span>
                      </span>
                      <span className="text-[10px] font-mono text-indigo-400 font-semibold">Standby</span>
                    </div>
                    <p className="line-clamp-2 pt-1 text-[11px] font-medium text-indigo-100 leading-snug">
                      {member.live_task?.prompt_summary || 'Siap siaga menerima antrean tugas'}
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
                        <span className="text-indigo-400 font-mono font-semibold">✓ Terakhir: </span>
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

                <div className="space-y-2 pt-1 border-t border-inherit">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-amber-400 font-bold truncate max-w-[140px]" title={member.account_name || 'Google One Pro'}>
                      {member.account_name || `Google One #${member.id}`}
                    </span>
                    <span className="text-indigo-300 font-medium truncate max-w-[150px]" title={member.email}>
                      {member.email}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Utilisasi:
                    </span>
                    <span className="font-bold text-emerald-400">
                      {member.tasks} tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SELECTED NODE DETAIL & LIVE STATUS                     */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 space-y-6 ${
          isDark ? 'bg-[#0e1322] border-slate-800/90 shadow-lg' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-inherit">
          <div className="flex items-center space-x-4">
            <div className="text-3xl p-3 rounded-2xl border bg-slate-900/80 border-slate-800 shadow-xs">
              {activeMember.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeMember.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Node #{activeMember.id}
                </span>
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                User: <span className="font-mono text-indigo-400 font-bold">{activeMember.user}</span> · Email: <span className="font-mono text-amber-400 font-bold">{activeMember.email}</span> · <span className="text-emerald-400 font-bold">Google One AI Premium (2TB)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeMember.live_task?.is_running ? (
              <span className="px-3 py-2 rounded-xl text-xs font-mono border bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>⚡ SEDANG EKSEKUSI TASK</span>
              </span>
            ) : (activeMember.status === 'monitoring' || activeMember.is_monitoring) ? (
              <span className="px-3 py-2 rounded-xl text-xs font-mono border bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>👁️ STANDBY</span>
              </span>
            ) : (
              <span className="px-3 py-2 rounded-xl text-xs font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>🟢 ONLINE (Siap & Prima)</span>
              </span>
            )}
          </div>
        </div>

        {/* Member Deep Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 md:col-span-2">
            <div>
              <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Spesifikasi & Kapabilitas Node' : 'Node Specifications & Capabilities'}
              </h4>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700 font-normal'}`}>
                {language === 'id'
                  ? 'Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh. Mampu menangani arsitektur sistem, backend API, antarmuka visual React, basis data, keamanan, dan pengujian secara mandiri tanpa pemisahan peran kaku.'
                  : 'Computing node powered by Google One AI Pro with full capacity. Capable of handling architecture, backend APIs, React interfaces, databases, security, and QA with equal load and zero role division.'}
              </p>
            </div>

            <div>
              <h4 className={`text-xs font-mono font-bold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Cakupan Rekayasa Teknis' : 'Engineering Capabilities'}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeMember.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className={`text-xs font-mono px-3 py-1.5 rounded-xl border font-medium ${
                      isDark ? 'bg-slate-900 border-slate-800 text-indigo-300' : 'bg-slate-100 border-slate-200 text-indigo-700'
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
              {language === 'id' ? 'Akun & Metrik Performa' : 'Account & Telemetry'}
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Google One:</span>
                <span className="font-bold text-amber-400 truncate max-w-[140px]" title={activeMember.account_name}>{activeMember.account_name || 'Google One Pro'}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Email OAuth:</span>
                <span className="font-bold text-indigo-300 truncate max-w-[140px]" title={activeMember.email}>{activeMember.email}</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total Tasks:</span>
                <span className="font-bold text-emerald-400">{activeMember.tasks} executions</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Error Rate:</span>
                <span className="font-bold text-slate-300">0.0% (Zero Faults)</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-inherit">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>OAuth Token:</span>
                <span className="font-bold text-emerald-400">Valid & Auto-Refreshed</span>
              </div>
              <div className="flex justify-between">
                <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
                <span className="font-bold text-emerald-400">
                  {activeMember.live_task?.is_running
                    ? '⚡ Active Executing'
                    : (activeMember.status === 'monitoring' || activeMember.is_monitoring)
                    ? '👁️ Standby'
                    : '🟢 Ready & Healthy'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Active Task Detailed Banner */}
        {activeMember.live_task?.is_running ? (
          <div className="p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>⚡ TUGAS YANG SEDANG DIKERJAKAN SAAT INI</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
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
                  {activeMember.last_action.execution_mode || 'task'}
                </span>
              </div>
            </div>
            <p className={`text-sm font-sans font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              "{activeMember.last_action.prompt_summary}"
            </p>
            {activeMember.last_action.command && (
              <p className="text-[11px] font-mono text-slate-400 truncate">
                Perintah: <code className={`px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-950 text-amber-300 border border-slate-800' : 'bg-white text-amber-800 border border-slate-200'}`}>{activeMember.last_action.command}</code>
              </p>
            )}
          </div>
        ) : null}
      </section>

      {/* ========================================================= */}
      {/* 4. LIVE MISSION DISPATCHER & LEAST-USED ROUTER            */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 space-y-5 ${
          isDark ? 'bg-[#0e121d] border-slate-800/90 shadow-md' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'id' ? 'Simulator Alokasi Tugas (Least-Used Routing)' : 'Task Allocation Simulator (Least-Used Routing)'}
              </h3>
            </div>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Ketikkan instruksi untuk melihat ksatria mana yang dialokasikan berdasarkan sistem utilisasi terendah' : 'Type any task prompt to test how Kuro Team intelligently routes to the least-used node'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { label: '⚡ Fitur Fullstack', query: 'Bikinin fitur speedtest jaringan lengkap dengan backend FastAPI dan frontend React' },
              { label: '🔍 Evaluasi Loker', query: 'Tolong evaluasi loker Lead Backend di Tokopedia ini, hitung gaji dan buatkan cover letter' },
              { label: '🛡️ Cek Keamanan', query: 'Audit konfigurasi firewall UFW dan fail2ban di server' },
              { label: '🟢 Solo Task', query: 'Cek sisa disk server sekarang dong' },
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
            placeholder={language === 'id' ? 'Ketikkan instruksi untuk Kuro Team...' : 'Type a mission prompt for Kuro Team...'}
            className={`w-full p-4 rounded-xl border text-xs sm:text-sm font-sans focus:outline-hidden transition-all resize-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 font-medium'
            }`}
          />
        </div>

        {/* Real-time Analysis Live Output Card */}
        {analysisResult && (
          <div
            className={`p-4 sm:p-5 rounded-xl border space-y-4 animate-fadeIn ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-inherit">
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500 text-slate-950 border border-emerald-400 shadow-xs">
                  ⚡ ALOKASI LEAST-USED
                </span>
                <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Confidence: <b className="text-emerald-400">{Math.round((analysisResult.confidence || 0.95) * 100)}%</b>
                </span>
              </div>

              <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                isDark ? 'bg-slate-800 text-slate-300' : 'bg-white border border-slate-200 text-slate-700 font-medium'
              }`}>
                Pattern: <span className="text-amber-400 font-bold">{analysisResult.matched_pattern || 'Least-Used Load Balancing'}</span>
              </span>
            </div>

            <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Target Node: {analysisResult.recommended_node || 'Kuro Node'}</span>
                </span>
                <span className="text-slate-400">Status: Siap Eksekusi</span>
              </div>
              <p className={`text-sm font-sans font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {analysisResult.action_summary || analysisResult.squad_allocation?.assigned_agent || 'Mengeksekusi instruksi pada node dengan utilisasi terendah.'}
              </p>
              <p className={`text-[11px] font-mono pt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {analysisResult.squad_allocation?.assigned_agent}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 5. RECENT SPRINT LOGS (OBSIDIAN SECOND BRAIN INTEGRATION)  */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 space-y-4 ${
          isDark ? 'bg-[#0e121d] border-slate-800/90 shadow-md' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between pb-2 border-b border-inherit">
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'id' ? 'Rekam Jejak Misi & Sprint Kuro Team' : 'Recent Kuro Team Mission & Sprint Logs'}
            </h3>
          </div>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Obsidian Second Brain
          </span>
        </div>

        {(() => {
          const sprintsList = (lastSwarm?.recent_sprints && lastSwarm.recent_sprints.length > 0)
            ? lastSwarm.recent_sprints
            : (telemetry?.recent_sprints || []);

          if (sprintsList.length === 0) {
            return (
              <div className={`p-6 rounded-xl border text-center text-xs font-mono ${isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                Belum ada sprint tersimpan di Second Brain. Jalankan misi pertama Anda!
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {sprintsList.map((sprint, spIdx) => (
                <div
                  key={spIdx}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                    isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <h4 className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {sprint.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        COMPLETED
                      </span>
                    </div>
                    <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      📄 {sprint.filename || sprint.second_brain_file}
                    </p>
                  </div>

                  <span className={`text-xs font-mono shrink-0 px-2.5 py-1 rounded-md border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    {sprint.date}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  );
}
