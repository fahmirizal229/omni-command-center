import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ShieldCheck,
  Cpu,
  Layers,
  HardDrive,
  Terminal,
  CloudSun,
  Footprints,
  ArrowRight,
  RefreshCw,
  Server,
  Droplets,
  Wind,
  Bot,
  Swords,
  Feather,
  Code2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Database,
  MessageSquare,
  User,
  Zap,
  Brain,
  Activity,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';

function OverviewSkeleton({ isDark = true, displayName, getTimeGreeting }) {
  const shimmer = isDark ? 'bg-slate-800/60 animate-pulse' : 'bg-slate-200/80 animate-pulse';
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      {/* Banner Skeleton */}
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? 'bg-[#0b0e17] border-slate-800/80' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="space-y-3">
          <div className={`h-8 w-64 rounded-xl ${shimmer}`} />
          <div className={`h-4 w-96 max-w-full rounded-lg ${shimmer}`} />
        </div>
      </section>

      {/* Hero Skeleton */}
      <section className={`p-6 sm:p-7 rounded-2xl border ${isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-inherit">
          <div className="flex items-center space-x-3.5">
            <div className={`w-11 h-11 rounded-xl ${shimmer}`} />
            <div className="space-y-2">
              <div className={`h-5 w-40 rounded-lg ${shimmer}`} />
              <div className={`h-3 w-56 max-w-full rounded-md ${shimmer}`} />
            </div>
          </div>
          <div className={`h-9 w-44 rounded-xl ${shimmer}`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className={`h-4 w-32 rounded ${shimmer}`} />
              <div className={`h-4 w-12 rounded ${shimmer}`} />
            </div>
            <div className={`h-2.5 w-full rounded-full ${shimmer}`} />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className={`h-4 w-32 rounded ${shimmer}`} />
              <div className={`h-4 w-24 rounded ${shimmer}`} />
            </div>
            <div className={`h-2.5 w-full rounded-full ${shimmer}`} />
          </div>
        </div>
      </section>

      {/* Modules Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-[#0e121d] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
              <div className="space-y-1.5 flex-1">
                <div className={`h-4 w-28 rounded ${shimmer}`} />
                <div className={`h-3 w-40 max-w-full rounded ${shimmer}`} />
              </div>
            </div>
            <div className={`h-16 w-full rounded-xl ${shimmer}`} />
            <div className={`h-4 w-24 rounded ${shimmer}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function OverviewView({ overview, isDark = true, onNavigate }) {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState(overview || null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (overview) setData(overview);
  }, [overview]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (language === 'id') {
      if (hour >= 4 && hour < 12) return 'Selamat pagi';
      if (hour >= 12 && hour < 17) return 'Selamat siang';
      if (hour >= 17 && hour < 20) return 'Selamat sore';
      return 'Selamat malam';
    }
    if (hour >= 4 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good evening';
  };

  const displayName =
    user?.display_name ||
    user?.name ||
    (user?.username === 'arusuka' ? 'Fahmi' : user?.username) ||
    'Fahmi';

  const fetchOverview = async () => {
    try {
      const res = await api.getOverview();
      if (res) setData(res);
    } catch (err) {
      console.error('Error refreshing overview:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!overview) fetchOverview();
    const interval = setInterval(fetchOverview, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchOverview();
  };

  const snapshot = overview || data;

  if (!snapshot || !snapshot.system) {
    return (
      <OverviewSkeleton
        isDark={isDark}
        displayName={displayName}
        getTimeGreeting={getTimeGreeting}
      />
    );
  }

  const system = snapshot.system;
  const cpuPercent = Number(system.cpu_percent ?? 0);
  const ramPercent = Number(system.ram_percent ?? 0);
  const ramUsedGb = Number(system.ram_used_gb ?? (ramPercent * (system.ram_total_gb || 7.8) / 100)).toFixed(1);
  const ramTotalGb = Number(system.ram_total_gb ?? 7.8).toFixed(1);

  // 3-Tier Status Calculation Engine
  const bannedToday = Number(system.fail2ban?.today_banned ?? 0);
  const activeTier = (() => {
    if (cpuPercent >= 90 || ramPercent >= 92) return 'critical';
    if (cpuPercent >= 70 || ramPercent >= 80 || bannedToday > 50) return 'warning';
    return 'normal';
  })();

  const rawWeather = snapshot?.weather || {};
  const aqiVal = Number(rawWeather.aqi ?? rawWeather.us_aqi ?? 42);
  
  const getAqiDetails = (val) => {
    if (val <= 50) return { category: 'Good', colorDark: 'text-emerald-400', colorLight: 'text-emerald-700' };
    if (val <= 100) return { category: 'Moderate', colorDark: 'text-amber-400', colorLight: 'text-amber-700' };
    if (val <= 150) return { category: 'Sensitive', colorDark: 'text-orange-400', colorLight: 'text-orange-700' };
    if (val <= 200) return { category: 'Unhealthy', colorDark: 'text-rose-400', colorLight: 'text-rose-700' };
    return { category: 'Very Unhealthy', colorDark: 'text-purple-400', colorLight: 'text-purple-700' };
  };

  const aqiDetails = getAqiDetails(aqiVal);

  const weather = {
    temp_c: rawWeather.temp_c ?? rawWeather.temperature_c ?? 31.4,
    condition: rawWeather.condition || 'Partly Cloudy',
    humidity_pct: rawWeather.humidity_pct ?? 45,
    wind_kmh: rawWeather.wind_kmh ?? 10.2,
    aqi: aqiVal,
    aqi_category: aqiDetails.category,
    aqi_color: isDark ? aqiDetails.colorDark : aqiDetails.colorLight,
    location: 'Surabaya',
  };

  const zepp = snapshot?.zepp || {
    today: { steps: 6420, goal: 8000, calories: 340, distance_km: 4.6 },
    last_sleep: { sleep_hours: '7h 15m' },
  };

  // Ring calculations for Activity style
  const stepPct = Math.min(Math.round((zepp.today.steps / (zepp.today.goal || 8000)) * 100), 100);
  const calPct = Math.min(Math.round((zepp.today.calories / 500) * 100), 100);
  const sleepPct = 85;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none">
      {/* ========================================================= */}
      {/* 1. PERSONAL GREETING & STATUS BANNER                      */}
      {/* ========================================================= */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-colors animate-stagger-1 ${
          isDark
            ? 'bg-[#0b0e17] border-slate-800/80 shadow-xl text-slate-100'
            : 'bg-white/90 border-slate-200/90 shadow-sm text-slate-900 backdrop-blur-sm'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1
              className={`text-2xl sm:text-3xl font-bold tracking-tight ${
                isDark ? 'text-slate-100' : 'text-slate-900'
              }`}
            >
              {getTimeGreeting()}, {displayName}
            </h1>

            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {t('overview_banner_desc', 'Everything you own in one place: files, backups, and Arusuka watching over it all.')}
            </p>
          </div>

          {/* Right Action: Clean Refresh Trigger */}
          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={handleManualRefresh}
              title={t('btn_refresh', 'Refresh Data')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border transition-all duration-150 ease-out cursor-pointer active:scale-95 text-xs font-mono font-medium ${
                isDark
                  ? 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  : 'bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-500' : 'text-slate-400'}`}
              />
              <span>{isRefreshing ? t('loading', 'Refreshing...') : t('btn_refresh', 'Refresh')}</span>
            </button>
          </div>
        </div>

        {/* Quick Actions Shortcuts Strip */}
        <div className={`mt-6 pt-5 border-t flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 ${
          isDark ? 'border-slate-800/80' : 'border-slate-200/80'
        }`}>
          <span className={`text-[11px] font-mono shrink-0 mr-1 flex items-center gap-1.5 font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {language === 'id' ? 'Akses Cepat:' : 'Quick Jump:'}
          </span>

          {[
            { id: 'secondbrain', label: 'Second Brain 3D', icon: Brain, color: 'purple' },
            { id: 'terminal', label: t('card_terminal_title', 'Terminal'), icon: Terminal, color: 'emerald' },
            { id: 'database', label: language === 'id' ? 'Database Studio' : 'Database Studio', icon: Database, color: 'indigo' },
            { id: 'profile', label: language === 'id' ? 'Profile & CV' : 'Profile & CV', icon: User, color: 'blue' },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'emerald' },
            { id: 'storage', label: t('card_storage_title', 'Storage'), icon: HardDrive, color: 'indigo' },
            { id: 'fitness', label: t('card_fitness_title', 'Fitness'), icon: Footprints, color: 'teal' },
            { id: 'weather', label: t('card_weather_title', 'Weather'), icon: CloudSun, color: 'sky' },
            { id: 'kuro', label: 'Kuro AI', icon: Swords, color: 'amber' },
            { id: 'shiro', label: 'Shiro AI', icon: Feather, color: 'cyan' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate && onNavigate(item.id)}
                className={`group shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800/90 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-850'
                    : 'bg-white border-slate-200/90 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                  item.color === 'emerald' ? (isDark ? 'text-emerald-400' : 'text-emerald-600') :
                  item.color === 'indigo' ? (isDark ? 'text-indigo-400' : 'text-indigo-600') :
                  item.color === 'blue' ? (isDark ? 'text-blue-400' : 'text-blue-600') :
                  item.color === 'teal' ? (isDark ? 'text-teal-400' : 'text-teal-600') :
                  item.color === 'sky' ? (isDark ? 'text-sky-400' : 'text-sky-600') :
                  item.color === 'amber' ? (isDark ? 'text-amber-400' : 'text-amber-600') :
                  (isDark ? 'text-cyan-400' : 'text-cyan-600')
                }`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 1.5. SYSGUARD REALTIME METRIC THRESHOLD ALERT BANNER      */}
      {/* ========================================================= */}
      {activeTier !== 'normal' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs shadow-lg transition-all ${
            activeTier === 'critical'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-rose-950/20'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-amber-950/20'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              activeTier === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm font-sans flex items-center gap-2 flex-wrap">
                <span>{activeTier === 'critical' ? '🚨 SysGuard Critical Threshold Alert' : '⚠️ SysGuard Elevated Workload Notice'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/40 border border-current font-mono font-semibold">
                  CPU {cpuPercent}% · RAM {ramPercent}%
                </span>
              </p>
              <p className="text-[11px] font-sans opacity-90 mt-0.5 leading-relaxed">
                {cpuPercent >= 90 ? 'Processor running near ceiling load. ' : cpuPercent >= 70 ? 'Processor spike detected. ' : ''}
                {ramPercent >= 92 ? 'RAM capacity critical. ' : ramPercent >= 80 ? 'Memory usage is elevated. ' : ''}
                {bannedToday > 30 ? `${bannedToday} malicious IPs banned by Fail2ban today.` : 'SysGuard sentinel is actively defending host.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('security')}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold font-sans cursor-pointer transition-all active:scale-95 ${
                activeTier === 'critical'
                  ? 'bg-rose-500/30 hover:bg-rose-500/40 border-rose-500/60 text-white'
                  : 'bg-amber-500/30 hover:bg-amber-500/40 border-amber-500/60 text-white'
              }`}
            >
              SysGuard Radar →
            </button>
          </div>
        </motion.div>
      )}

      {/* ========================================================= */}
      {/* 2. PRIMARY HERO ELEMENT: MAIN SERVER STATUS               */}
      {/* (3 Visual Status Tiers: Normal / Warning / Critical)      */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-200 ease-out animate-stagger-2 ${
          activeTier === 'critical'
            ? isDark
              ? 'bg-[#150f14] border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.15)] text-slate-100'
              : 'bg-rose-50/40 border-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.12)] text-slate-900'
            : activeTier === 'warning'
            ? isDark
              ? 'bg-[#141218] border-amber-500/50 shadow-[0_0_24px_rgba(245,158,11,0.08)] text-slate-100'
              : 'bg-amber-50/40 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.08)] text-slate-900'
            : isDark
            ? 'bg-[#0e121d] border-slate-800/90 text-slate-100 shadow-sm'
            : 'bg-white/95 border-slate-200 shadow-xs text-slate-900'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-inherit">
          <div className="flex items-center space-x-3.5">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors duration-200 ease-out ${
                activeTier === 'critical'
                  ? isDark
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                    : 'bg-rose-100 border-rose-300 text-rose-700'
                  : activeTier === 'warning'
                  ? isDark
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-amber-100 border-amber-300 text-amber-700'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700/60 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}
            >
              {activeTier === 'critical' ? (
                <AlertCircle className="w-5 h-5" />
              ) : activeTier === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Server className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <h2 className={`text-base sm:text-lg font-bold flex items-center leading-normal ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {t('hero_server_title', 'Main Server')}
                </h2>

                {/* 3-Tier Dynamic Status Badge */}
                {activeTier === 'critical' ? (
                  <span
                    className={`badge-capsule gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                      isDark
                        ? 'bg-rose-500/20 text-rose-200 border-rose-500/60'
                        : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}
                  >
                    {/* Subtle Pulse Animation on Dot Only */}
                    <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                    </span>
                    <span className="badge-text">{t('hero_status_critical', 'Critical — Full Load')}</span>
                  </span>
                ) : activeTier === 'warning' ? (
                  <span
                    className={`badge-capsule gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                      isDark
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    <span className="badge-dot w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="badge-text">{t('hero_status_warning', 'Needs Attention')}</span>
                  </span>
                ) : (
                  <span
                    className={`badge-capsule gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                      isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    <span className="badge-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="badge-text">{t('hero_status_normal', 'Normal & Stable')}</span>
                  </span>
                )}
              </div>

              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {activeTier === 'critical'
                  ? t('hero_desc_critical', 'Warning: Computing allocation near threshold — system response degraded')
                  : activeTier === 'warning'
                  ? t('hero_desc_warning', 'Processing load elevated — background tasks running intensively')
                  : `${t('hero_desc_normal_prefix', 'Running actively for')} ${system.uptime} ${t('hero_desc_normal_suffix', '· System load optimal')}`}
              </p>
            </div>
          </div>

          {/* Quick Security Status Badge */}
          <div
            className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
              activeTier === 'critical'
                ? isDark
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
                : activeTier === 'warning'
                ? isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
                : isDark
                ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <ShieldCheck
              className={`w-4 h-4 shrink-0 ${
                activeTier === 'critical'
                  ? 'text-rose-400'
                  : activeTier === 'warning'
                  ? 'text-amber-400'
                  : isDark
                  ? 'text-emerald-400'
                  : 'text-emerald-600'
              }`}
            />
            <span>{bannedToday} {t('hero_fail2ban_blocked', 'IPs blocked by Fail2ban today')}</span>
          </div>
        </div>

        {/* Big Dual Proportion Gauges (CPU & RAM) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 font-mono text-xs">
          {/* CPU Gauge */}
          <div className="space-y-2">
            <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-2 font-sans font-medium text-xs">
                <Cpu
                  className={`w-4 h-4 ${
                    activeTier === 'critical'
                      ? 'text-rose-500'
                      : activeTier === 'warning'
                      ? 'text-amber-500'
                      : 'text-indigo-500'
                  }`}
                />{' '}
                {t('hero_cpu_title', 'Processor Load (CPU)')}
              </span>
              <span className={`font-bold text-sm tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {cpuPercent}%
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <motion.div
                className={`h-full rounded-full ${
                  activeTier === 'critical'
                    ? 'bg-rose-600'
                    : activeTier === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(cpuPercent, 100)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
            <p className={`text-[11px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeTier === 'critical'
                ? t('hero_cpu_desc_critical', 'Processor operating at peak capacity.')
                : activeTier === 'warning'
                ? t('hero_cpu_desc_warning', 'Processor spike detected, monitoring recommended.')
                : t('hero_cpu_desc_normal', 'Thermal and power allocation within optimal limits.')}
            </p>
          </div>

          {/* RAM Gauge */}
          <div className="space-y-2">
            <div className={`flex justify-between items-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="flex items-center gap-2 font-sans font-medium text-xs">
                <Layers
                  className={`w-4 h-4 ${
                    activeTier === 'critical'
                      ? 'text-rose-500'
                      : activeTier === 'warning'
                      ? 'text-amber-500'
                      : 'text-indigo-500'
                  }`}
                />{' '}
                {t('hero_ram_title', 'Memory Usage (RAM)')}
              </span>
              <span className={`font-bold text-sm tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {ramUsedGb} GB / {ramTotalGb} GB ({ramPercent}%)
              </span>
            </div>
            <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
              <motion.div
                className={`h-full rounded-full ${
                  activeTier === 'critical'
                    ? 'bg-rose-600'
                    : activeTier === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(ramPercent, 100)}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>
            <p className={`text-[11px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {activeTier === 'critical'
                ? t('hero_ram_desc_critical', 'RAM capacity exhausted, system may utilize swap memory.')
                : activeTier === 'warning'
                ? t('hero_ram_desc_warning', 'RAM utilization is elevated.')
                : t('hero_ram_desc_normal', 'Ample memory available for heavy workloads.')}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. SUPPORTING MODULES (STORAGE, TERMINAL, ZEPP, WEATHER, KURO, SHIRO) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* ------------------------------------------------------- */}
        {/* CARD 0: Obsidian Second Brain & 3D Knowledge Graph     */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('secondbrain')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-5 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-3 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)]'
              : 'bg-white/90 border-slate-200/90 hover:border-purple-300 hover:shadow-[0_8px_30px_rgba(168,85,247,0.12)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 group-hover:border-purple-500/40'
                    : 'bg-purple-50 border-purple-200 text-purple-700 group-hover:bg-purple-100 group-hover:border-purple-300'
                }`}
              >
                <Brain className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold font-sans transition-colors ${
                    isDark
                      ? 'text-slate-100 group-hover:text-purple-300'
                      : 'text-slate-800 group-hover:text-purple-700'
                  }`}
                >
                  {language === 'id' ? 'Obsidian Second Brain' : 'Obsidian Second Brain'}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {language === 'id' ? '3D Spatial Graph & FTS5 Vault' : '3D Spatial Graph & FTS5 Vault'}
                </p>
              </div>
            </div>
            <span className={`badge-capsule gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold transition-transform duration-200 group-hover:scale-105 ${
              isDark ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30' : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
              <span className="badge-dot w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="badge-text">3D Orbit</span>
            </span>
          </div>

          {/* Quick Brain Metrics */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div
              className={`p-3 rounded-xl border space-y-1 transition-colors ${
                isDark ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
              }`}
            >
              <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Total Catatan' : 'Total Notes'}
              </span>
              <p className={`text-sm font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                75+ Notes
              </p>
              <span className={`text-[10px] font-sans ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                400+ Wikilinks
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border space-y-1 transition-colors ${
                isDark ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
              }`}
            >
              <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Kesehatan Vault' : 'Vault Health'}
              </span>
              <p className={`text-sm font-semibold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                100% Pristine
              </p>
              <span className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                0 Broken Link
              </span>
            </div>
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span className={`transition-colors flex items-center gap-1.5 ${isDark ? 'text-slate-400 group-hover:text-purple-300' : 'text-slate-600 group-hover:text-purple-700'}`}>
              <span>{language === 'id' ? 'Buka 3D Graph & Vault' : 'Open 3D Graph & Vault'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              0 Token Local
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 1: Storage Vault                                   */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('storage')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-5 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-3 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-indigo-500/50 hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)]'
              : 'bg-white/90 border-slate-200/90 hover:border-indigo-300 hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/60 text-slate-200 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30'
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-200'
                }`}
              >
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold font-sans transition-colors ${
                    isDark
                      ? 'text-slate-100 group-hover:text-indigo-300'
                      : 'text-slate-800 group-hover:text-indigo-600'
                  }`}
                >
                  {t('card_storage_title', 'Storage Vault')}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('card_storage_sub', 'Connected local drive & cloud storage')}
                </p>
              </div>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-all duration-200 group-hover:translate-x-1 ${
                isDark
                  ? 'text-slate-500 group-hover:text-indigo-400'
                  : 'text-slate-400 group-hover:text-indigo-600'
              }`}
            />
          </div>

          {/* Storage Indicators */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div
              className={`p-3 rounded-xl border space-y-1 transition-colors ${
                isDark ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
              }`}
            >
              <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('card_storage_nvme', 'Local Drive (NVMe)')}
              </span>
              <p className={`text-sm font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {system.disk_free_gb.toFixed(0)} GB
              </p>
              <span className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('card_storage_free', 'Available Space')}
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border space-y-1 transition-colors ${
                isDark ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
              }`}
            >
              <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('card_storage_cloud', 'Cloud S3')}
              </span>
              <p className={`text-sm font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                20 TB
              </p>
              <span className={`text-[10px] font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('card_storage_sec', 'Encrypted & Secure')}
              </span>
            </div>
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span className={`transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-800'}`}>{t('card_storage_open', 'Open Storage Vault')}</span>
            {/* Routine Metadata */}
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('card_storage_media', '2 Active Media')}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 2: Web Terminal                                    */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('terminal')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-5 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-3 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]'
              : 'bg-white/90 border-slate-200/90 hover:border-emerald-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/60 text-slate-200 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30'
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 group-hover:text-emerald-600 group-hover:bg-emerald-50 group-hover:border-emerald-200'
                }`}
              >
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold font-sans transition-colors ${
                    isDark
                      ? 'text-slate-100 group-hover:text-emerald-300'
                      : 'text-slate-800 group-hover:text-emerald-600'
                  }`}
                >
                  {t('card_terminal_title', 'Web Terminal')}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('card_terminal_sub', 'Direct host console access')}
                </p>
              </div>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-all duration-200 group-hover:translate-x-1 ${
                isDark
                  ? 'text-slate-500 group-hover:text-emerald-400'
                  : 'text-slate-400 group-hover:text-emerald-600'
              }`}
            />
          </div>

          {/* Quick Console Snippet */}
          <div
            className={`p-3 rounded-xl border font-mono text-[11px] space-y-1 transition-colors ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-300 shadow-inner group-hover:border-slate-750'
                : 'bg-slate-50 border-slate-200 text-slate-700 group-hover:bg-slate-100/70'
            }`}
          >
            <p className={isDark ? 'text-emerald-400' : 'text-emerald-600 font-semibold'}>arusuka@omni:~$ status</p>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('card_terminal_services', '• Services: Nginx (Active), Uvicorn (Active)')}</p>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{t('card_terminal_ready_session', '• Terminal Session: Ready')}</p>
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span className={`transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-800'}`}>{t('card_terminal_open', 'Open Host Terminal')}</span>
            {/* Routine Metadata */}
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('card_terminal_status', 'Ready to Connect')}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 3: Zepp Sleep & Recovery Radar Widget              */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('fitness')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-4 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-teal-500/50 hover:shadow-[0_8px_30px_rgba(20,184,166,0.12)]'
              : 'bg-white/90 border-slate-200/90 hover:border-teal-300 hover:shadow-[0_8px_30px_rgba(20,184,166,0.1)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/60 text-slate-200 group-hover:text-teal-400 group-hover:bg-teal-500/10 group-hover:border-teal-500/30'
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 group-hover:text-teal-600 group-hover:bg-teal-50 group-hover:border-teal-200'
                }`}
              >
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold font-sans transition-colors ${
                    isDark
                      ? 'text-slate-100 group-hover:text-teal-300'
                      : 'text-slate-800 group-hover:text-teal-600'
                  }`}
                >
                  {language === 'id' ? 'Zepp Sleep & Recovery Radar' : 'Zepp Sleep & Recovery Radar'}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {language === 'id' ? 'Biometrik harian & kualitas istirahat' : 'Daily biometrics & sleep readiness'}
                </p>
              </div>
            </div>
            <span className={`badge-capsule gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold transition-transform duration-200 group-hover:scale-105 ${
              isDark ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30' : 'bg-teal-50 text-teal-700 border border-teal-200'
            }`}>
              <span className="badge-dot w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span className="badge-text">Recovery 88%</span>
            </span>
          </div>

          {/* Activity Rings & Stage Breakdown */}
          <div className="flex items-center justify-between gap-4 py-0.5">
            <div className={`relative w-20 h-20 shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ${
              stepPct >= 100 ? 'ring-1 ring-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]' : ''
            }`}>
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Outer Ring: Steps */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={isDark ? '#1e2538' : '#e2e8f0'}
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="6"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * stepPct) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                {/* Middle Ring: Calories */}
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  stroke={isDark ? '#1e2538' : '#e2e8f0'}
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="30"
                  stroke="#6366f1"
                  strokeWidth="6"
                  strokeDasharray="188.4"
                  strokeDashoffset={188.4 - (188.4 * calPct) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
                {/* Inner Ring: Sleep */}
                <circle
                  cx="50"
                  cy="50"
                  r="20"
                  stroke={isDark ? '#1e2538' : '#e2e8f0'}
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="20"
                  stroke="#0ea5e9"
                  strokeWidth="6"
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * sleepPct) / 100}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </svg>
              <div className="absolute text-center font-mono">
                <span className={`text-[11px] font-bold block tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  {stepPct}%
                </span>
              </div>
            </div>

            {/* Sleep Stages & Biometric Indicators */}
            <div className="flex-1 space-y-1.5 font-mono text-xs font-medium tabular-nums min-w-0">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{zepp.today.steps.toLocaleString()} steps</span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{zepp.today.calories} kcal</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                  <span className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{zepp.last_sleep.sleep_hours} tidur</span>
                </span>
                <span className="text-[10px] text-teal-400 font-semibold">Deep 1h 45m</span>
              </div>
              {/* Stage Progress Bar (Deep / REM / Light) */}
              <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-slate-800">
                <div className="h-full bg-indigo-500" style={{ width: '28%' }} title="Deep Sleep 28%" />
                <div className="h-full bg-sky-400" style={{ width: '22%' }} title="REM Sleep 22%" />
                <div className="h-full bg-teal-400" style={{ width: '45%' }} title="Light Sleep 45%" />
                <div className="h-full bg-amber-400" style={{ width: '5%' }} title="Awake 5%" />
              </div>
            </div>
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span className={`transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-800'}`}>
              {language === 'id' ? 'Buka Detail Tidur & Fitness' : 'Open Sleep & Fitness'}
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>
              HR Rest 58 bpm
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 4: Surabaya Weather                                */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('weather')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-5 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-5 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-sky-500/50 hover:shadow-[0_8px_30px_rgba(14,165,233,0.12)]'
              : 'bg-white/90 border-slate-200/90 hover:border-sky-300 hover:shadow-[0_8px_30px_rgba(14,165,233,0.1)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/60 text-slate-200 group-hover:text-sky-400 group-hover:bg-sky-500/10 group-hover:border-sky-500/30'
                    : 'bg-slate-100/80 border-slate-200 text-slate-700 group-hover:text-sky-600 group-hover:bg-sky-50 group-hover:border-sky-200'
                }`}
              >
                <CloudSun className="w-4 h-4" />
              </div>
              <div>
                <h3
                  className={`text-sm font-semibold font-sans transition-colors ${
                    isDark
                      ? 'text-slate-100 group-hover:text-sky-300'
                      : 'text-slate-800 group-hover:text-sky-600'
                  }`}
                >
                  {t('card_weather_title', 'Surabaya Weather')}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('card_weather_sub', 'BMKG atmospheric & seismic radar')}
                </p>
              </div>
            </div>
            <ArrowRight
              className={`w-4 h-4 transition-all duration-200 group-hover:translate-x-1 ${
                isDark
                  ? 'text-slate-500 group-hover:text-sky-400'
                  : 'text-slate-400 group-hover:text-sky-600'
              }`}
            />
          </div>

          <div className="flex items-baseline justify-between py-1">
            <div>
              <span className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                {weather.temp_c}°C
              </span>
              <p className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {weather.condition}
              </p>
            </div>

            <div className="text-right font-mono space-y-1 font-medium tabular-nums">
              <span className={`text-xs block flex items-center justify-end gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Droplets className="w-3.5 h-3.5" /> {weather.humidity_pct}%
              </span>
              <span className={`text-xs block flex items-center justify-end gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <Wind className="w-3.5 h-3.5" /> {weather.wind_kmh} km/h
              </span>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium transition-colors ${
              isDark
                ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700'
                : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
            }`}
          >
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>{t('card_weather_aqi', 'Air Quality')}</span>
            <span className={`font-semibold tabular-nums ${weather.aqi_color}`}>
              AQI {weather.aqi} · {weather.aqi_category}
            </span>
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span className={`transition-colors ${isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-600 group-hover:text-slate-800'}`}>{t('card_weather_open', 'Open Climate & Radar')}</span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {t('card_weather_live', 'BMKG Live')}
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 5: Kuro Team — AI Engineering Squad                */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('kuro')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-5 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]'
              : 'bg-white/90 border-slate-200/90 hover:border-amber-300 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20 group-hover:border-amber-500/40'
                    : 'bg-amber-50 border-amber-200 text-amber-700 group-hover:bg-amber-100 group-hover:border-amber-300'
                }`}
              >
                <Swords className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold font-sans transition-colors ${
                  isDark ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-800 group-hover:text-amber-700'
                }`}>
                  {language === 'id' ? 'Skuad AI Kuro Team' : 'Kuro Team AI Squad'}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {language === 'id' ? '4 Skuad Antigravity Pro siap tempur' : '4-Node Antigravity Pro Squad'}
                </p>
              </div>
            </div>
            <span className={`badge-capsule text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold transition-transform duration-200 group-hover:scale-105 ${
              isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              <span className="badge-text">4 Nodes Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
            {(() => {
              const kuroMembers = snapshot?.kuro_team?.members || [
                { id: 1, name: "Taisho", icon: "🏯", status: "online", tasks: 0 },
                { id: 2, name: "Tetsu", icon: "⚒️", status: "online", tasks: 0 },
                { id: 3, name: "Sora", icon: "🌸", status: "online", tasks: 0 },
                { id: 4, name: "Kensei", icon: "⚔️", status: "online", tasks: 0 },
              ];
              const onDutyId = snapshot?.kuro_team?.on_duty_id || (kuroMembers.slice().sort((a, b) => (a.tasks || 0) - (b.tasks || 0))[0]?.id) || 4;

              return kuroMembers.map((member) => {
                const isBusy = member.status === 'busy' || member.live_task?.is_running;
                const isMonitoring = member.status === 'monitoring' || member.live_task?.is_monitoring;
                const isOnDuty = member.id === onDutyId;
                return (
                  <div
                    key={member.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition-all duration-150 ${
                      isBusy
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-xs'
                        : isMonitoring
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-xs'
                        : isOnDuty
                        ? isDark
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 ring-1 ring-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                          : 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-2xs ring-1 ring-amber-300'
                        : isDark
                        ? 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-sm">{member.icon}</span>
                      <div className="truncate">
                        <p className="text-[11px] font-bold truncate leading-tight flex items-center gap-1.5">
                          {member.name}
                          {isBusy ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          ) : isMonitoring ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                          ) : isOnDuty ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          ) : null}
                        </p>
                        <p className={`text-[9px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isBusy ? '⚡ Executing' : isMonitoring ? '👁️ Standby' : isOnDuty ? '🎯 Bertugas (Slot Aktif)' : `Node #${member.id} · Equal Power`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md ${
                      isOnDuty
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                        : isDark ? 'bg-slate-800/90 text-slate-400' : 'bg-white border border-slate-200 text-slate-600'
                    }`}>
                      {member.tasks ?? 0}t
                    </span>
                  </div>
                );
              });
            })()}
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span>{language === 'id' ? 'Least-used load balancing & auto-failover' : 'Least-used load-balanced & auto-failover'}</span>
            <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              0 Token Wasted
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 6: Shiro Team — Lightweight & Repetitive Swarm     */}
        {/* ------------------------------------------------------- */}
        <div
          onClick={() => onNavigate && onNavigate('shiro')}
          className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-5 ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/80 hover:border-cyan-500/50 hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)]'
              : 'bg-white/90 border-slate-200/90 hover:border-cyan-300 hover:shadow-[0_8px_30px_rgba(6,182,212,0.1)] shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                  isDark
                    ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/40'
                    : 'bg-cyan-50 border-cyan-200 text-cyan-700 group-hover:bg-cyan-100 group-hover:border-cyan-300'
                }`}
              >
                <Feather className="w-4 h-4" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold font-sans transition-colors ${
                  isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-800 group-hover:text-cyan-700'
                }`}>
                  {language === 'id' ? 'Skuad AI Shiro Team' : 'Shiro Team AI Squad'}
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {language === 'id' ? 'DeepSeek, Qwen 3.8B & Hermes Local' : 'DeepSeek, Qwen 3.8B & Hermes Local'}
                </p>
              </div>
            </div>
            <span className={`badge-capsule text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold transition-transform duration-200 group-hover:scale-105 ${
              isDark ? 'bg-slate-800 text-cyan-300 border border-slate-700' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
            }`}>
              <span className="badge-text">0-Token Ready</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
            {(snapshot?.shiro_team?.members || [
              { id: 1, name: "Kokoro", engine: "DeepSeek", icon: "🪷", role: "Curhat/Moral", tasks: 2 },
              { id: 2, name: "Hayate", engine: "Qwen 3.8B", icon: "🍃", role: "Fast Text", tasks: 2 },
              { id: 3, name: "Musubi", engine: "Hermes", icon: "🪢", role: "0-Token Cron", tasks: 2 },
            ]).map((member) => {
              const isActiveLead = (snapshot?.shiro_team?.active_lead || 1) === member.id;
              return (
                <div
                  key={member.id}
                  className={`p-2 rounded-xl border flex items-center justify-between transition-all duration-150 ${
                    isActiveLead
                      ? isDark
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-200'
                        : 'bg-cyan-50/80 border-cyan-300 text-cyan-900 shadow-2xs'
                      : isDark
                      ? 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="text-sm">{member.icon}</span>
                    <div className="truncate">
                      <p className="text-[10px] font-bold truncate leading-tight flex items-center gap-1">
                        {member.name}
                        {isActiveLead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </p>
                      <p className={`text-[8.5px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {member.engine || member.role}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono shrink-0 px-1 py-0.5 rounded-md ${
                    isDark ? 'bg-slate-800/90 text-slate-400' : 'bg-white border border-slate-200 text-slate-600'
                  }`}>
                    {member.tasks ?? 0}t
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <span>{language === 'id' ? 'Bebas Token & Eksekusi Ringan' : '0-Token Local & Fast Routing'}</span>
            <span className={`font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>
              Hemat Kuota 100%
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------- */}
        {/* CARD 7: Arusuka Sentinel Pulse — Adaptive & Advisory    */}
        {/* ------------------------------------------------------- */}
        {(() => {
          const sentinel = snapshot?.sentinel_pulse || {
            status: 'ACTIVE',
            status_label: 'Siaga & Adaptif',
            circadian_mode: 'NIGHTLY_REFLECTION',
            circadian_desc: 'Refleksi Harian Singkat',
            consecutive_unanswered: 0,
            daily_messages_count: 19,
            last_topic: 'zepp_sync_reminder',
            last_active: 'Baru saja',
            engagement_pct: 100,
            total_messages_sent: 0,
            total_replies_received: 0,
            proposals_count: 1,
            active_advisory: 'Recursive Self-Improvement & 24/7 Advisory Aktif'
          };

          const isDiscreet = sentinel.status === 'DISCREET';
          const isSleep = sentinel.status === 'REST_SLEEP';
          const isWork = sentinel.status === 'WORK_FOCUS';

          return (
            <div
              onClick={() => onNavigate && onNavigate('sentinel')}
              className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between space-y-4 cursor-pointer group transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] animate-stagger-5 ${
                isDark
                  ? 'bg-[#0e121d] border-slate-800/80 hover:border-rose-500/50 hover:shadow-[0_8px_30px_rgba(244,63,94,0.12)]'
                  : 'bg-white/90 border-slate-200/90 hover:border-rose-300 hover:shadow-[0_8px_30px_rgba(244,63,94,0.1)] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:-rotate-3 ${
                      isDark
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:bg-rose-500/20 group-hover:border-rose-500/40'
                        : 'bg-rose-50 border-rose-200 text-rose-700 group-hover:bg-rose-100 group-hover:border-rose-300'
                    }`}
                  >
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold font-sans transition-colors ${
                      isDark ? 'text-slate-100 group-hover:text-rose-300' : 'text-slate-800 group-hover:text-rose-700'
                    }`}>
                      {language === 'id' ? 'Arusuka Sentinel Pulse' : 'Arusuka Sentinel Pulse'}
                    </h3>
                    <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {language === 'id' ? 'Adaptive Companion & 24/7 Advisory' : 'Adaptive Companion & 24/7 Advisory'}
                    </p>
                  </div>
                </div>
                <span className={`badge-capsule text-[10px] font-mono px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 transition-transform duration-200 group-hover:scale-105 ${
                  isDiscreet
                    ? isDark ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    : isSleep
                    ? isDark ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : isWork
                    ? isDark ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    : isDark ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isDiscreet ? 'bg-amber-400' : isSleep ? 'bg-indigo-400' : isWork ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse'
                  }`} />
                  <span className="badge-text">{sentinel.status_label || 'Siaga & Aktif'}</span>
                </span>
              </div>

              {/* Circadian Mode Strip */}
              <div className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                isDark ? 'bg-slate-900/70 border-slate-800/80 text-slate-300' : 'bg-slate-50/80 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center space-x-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-[11px] font-medium truncate font-sans">
                    {sentinel.circadian_desc || sentinel.circadian_mode}
                  </span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                  isDark ? 'bg-slate-800 text-rose-300' : 'bg-rose-100/70 text-rose-700 font-semibold'
                }`}>
                  WIB {sentinel.circadian_mode}
                </span>
              </div>

              {/* Quick Sentinel Metrics */}
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div
                  className={`p-2.5 rounded-xl border space-y-1 transition-colors ${
                    isDark ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
                  }`}
                >
                  <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {language === 'id' ? 'Engagement Rate' : 'Engagement Rate'}
                  </span>
                  <p className={`text-sm font-semibold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {sentinel.engagement_pct ?? 100}%
                  </p>
                  <span className={`text-[9px] font-sans ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    Feedback Adaptif
                  </span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border space-y-1 transition-colors ${
                    isDark ? 'bg-slate-900/80 border-slate-800/80 group-hover:border-slate-700' : 'bg-slate-50 border-slate-200 group-hover:bg-slate-100/70'
                  }`}
                >
                  <span className={`text-[10px] block font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {language === 'id' ? 'Anti-Spam State' : 'Anti-Nagging State'}
                  </span>
                  <p className={`text-sm font-semibold tabular-nums ${
                    sentinel.consecutive_unanswered >= 3
                      ? 'text-amber-400'
                      : isDark ? 'text-slate-100' : 'text-slate-800'
                  }`}>
                    {sentinel.consecutive_unanswered ?? 0} Unreplied
                  </p>
                  <span className={`text-[9px] font-sans ${
                    sentinel.consecutive_unanswered >= 3
                      ? 'text-amber-400'
                      : isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {sentinel.consecutive_unanswered === 0 ? 'Ritme Bersahabat' : `${sentinel.consecutive_unanswered}x Jeda Otomatis`}
                  </span>
                </div>
              </div>

              {/* Bottom Strip */}
              <div
                className={`pt-2 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-slate-800/80 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                  <span className="text-[11px] truncate">
                    {sentinel.active_advisory || 'Recursive Self-Improvement Aktif'}
                  </span>
                </div>
                <span className={`font-semibold shrink-0 text-[10px] ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
                  {sentinel.last_active || 'Baru saja'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
