/**
 * @file OverviewView.jsx
 * @description Master Bento Glass Command Hub.
 * Features full-page edge-to-edge layout, multi-layered frosted glass panels,
 * realtime telemetry gauges, fitness biometrics, task previews, and direct module routing.
 */

import React from "react";
import {
  CheckSquare,
  Briefcase,
  Brain,
  CloudSun,
  Activity,
  Cpu,
  Server,
  HardDrive,
  Shield,
  Layers,
  ArrowRight,
  Moon,
  Flame,
  Footprints,
  CalendarClock,
  Sparkles,
  UserCheck,
  Zap,
  Compass,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Clock
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function OverviewView({ overview, onNavigate }) {
  const { t, language } = useLanguage();

  if (!overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-zinc-400 space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-14 h-14 rounded-3xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-spin">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-xl animate-pulse" />
        </div>
        <p className="text-xs font-mono tracking-widest uppercase text-zinc-400 animate-pulse">
          {t("overview_loading", "Sinkronisasi Telemetry & Workspace...")}
        </p>
      </div>
    );
  }

  const { system, tasks, jobs, second_brain, weather, zepp } = overview;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  // Zepp fitness metrics
  const steps = zepp?.today?.steps || 0;
  const stepGoal = zepp?.today?.goal || 8000;
  const stepPercent = Math.min(Math.round((steps / stepGoal) * 100), 100);
  const calories = zepp?.today?.calorie ?? zepp?.today?.calories_kcal ?? zepp?.today?.calories ?? 0;
  const distance = zepp?.today?.distance_km || 0;
  const sleepHours = zepp?.last_sleep?.sleep_hours || "--";

  // System gauges calculations
  const cpuPercent = Math.min(system?.cpu_percent ?? 0, 100);
  const ramPercent = Math.min(system?.ram_percent ?? system?.memory?.percent ?? 0, 100);
  const diskPercent = Math.min(system?.disk_percent ?? system?.disk?.percent ?? 0, 100);
  const ramUsedGb = system?.ram_used_gb ?? system?.memory?.used_gb;
  const ramTotalGb = system?.ram_total_gb ?? system?.memory?.total_gb;
  const diskFreeGb = system?.disk_free_gb ?? system?.disk?.free_gb;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* 1. Master Glass Hero Command Hub */}
      <div className="relative overflow-hidden rounded-3xl sm:rounded-[32px] bg-gradient-to-br from-indigo-950/30 via-[#0b0e1a]/85 to-[#060810]/95 border border-white/[0.1] p-6 sm:p-8 lg:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-3xl bento-highlight">
        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-[24rem] h-[24rem] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-sky-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-xs font-mono text-indigo-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Omni Workspace • {getGreeting()}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Arusuka <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-200 to-emerald-300">Command Center</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
              Monitoring terintegrasi untuk kesehatan server, otomasi cerdas, Second Brain, pelacak karir, dan data kebugaran Zepp.
            </p>
          </div>

          {/* Quick Jump Badges */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => onNavigate("tasks")}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold shadow-[0_4px_25px_rgba(245,158,11,0.35)] transition-all flex items-center space-x-2 active:scale-95 group"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tugas Pribadi</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("zepp")}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-emerald-500/20 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-bold transition-all active:scale-95 flex items-center space-x-2 backdrop-blur-xl shadow-lg"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Kebugaran</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("brain")}
              className="px-4 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-bold transition-all active:scale-95 flex items-center space-x-2 backdrop-blur-xl shadow-lg"
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Second Brain</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Primary 4-Column Bento Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Zepp Fitness Activity */}
        <div
          onClick={() => onNavigate("zepp")}
          className="glass-card-interactive rounded-3xl p-5 sm:p-6 flex flex-col justify-between group bento-highlight"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t("overview_stat_zepp", "Kebugaran Zepp")}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
              <Footprints className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                  {steps.toLocaleString()}
                </span>
                <span className="text-xs text-zinc-400 font-mono">/{stepGoal.toLocaleString()}</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30 shadow-sm">
                {stepPercent}%
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                style={{ width: `${stepPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/[0.06] font-mono">
              <span className="text-amber-300/90 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> {calories} kcal
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-sky-300/90">{distance} km</span>
              <span className="text-zinc-600">•</span>
              <span className="text-indigo-300/90 flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-400" /> {sleepHours}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Personal Tasks Radar */}
        <div
          onClick={() => onNavigate("tasks")}
          className="glass-card-interactive rounded-3xl p-5 sm:p-6 flex flex-col justify-between group bento-highlight"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-amber-300 transition-colors uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {t("overview_stat_tasks", "Tugas Pribadi")}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {tasks?.total_active || 0}
              </span>
              <span className="text-xs text-zinc-400 font-medium">tugas aktif</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-[11px] font-semibold text-amber-300">
                {tasks?.in_progress || 0} Berjalan
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] font-semibold text-rose-300">
                {tasks?.urgent || 0} Urgent
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-400">
                {tasks?.todo || 0} Antrean
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-400/90 pt-2 border-t border-white/[0.06] font-semibold">
              <span>Buka Kanban Board</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 3: Surabaya Realtime Weather & Environment */}
        <div
          onClick={() => onNavigate("weather")}
          className="glass-card-interactive rounded-3xl p-5 sm:p-6 flex flex-col justify-between group bento-highlight"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-sky-300 transition-colors uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              {t("overview_stat_weather", "Cuaca Surabaya")}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all">
              <CloudSun className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {weather?.temp_c ? `${weather.temp_c}°C` : "--°C"}
              </span>
              <span className="text-3xl">{weather?.icon || "🌤️"}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                AQI {weather?.aqi || "--"}
              </span>
              <span className="truncate text-zinc-300 font-medium">
                {weather?.condition || "Cerah Berawan"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-sky-400/90 pt-2 border-t border-white/[0.06] font-semibold">
              <span>Prakiraan & Radar Gempa</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Card 4: Second Brain Knowledge Vault */}
        <div
          onClick={() => onNavigate("brain")}
          className="glass-card-interactive rounded-3xl p-5 sm:p-6 flex flex-col justify-between group bento-highlight"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 group-hover:text-purple-300 transition-colors uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              {t("overview_stat_brain", "Second Brain")}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
              <Brain className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                {second_brain?.total_notes || 0}
              </span>
              <span className="text-xs text-zinc-400 font-medium">catatan obsidian</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="px-2 py-0.5 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-300 font-mono font-semibold">
                {second_brain?.graph_entities || 0} Entitas
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-mono">
                {second_brain?.graph_relations || 0} Relasi
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-400/90 pt-2 border-t border-white/[0.06] font-semibold">
              <span>Buka Knowledge Graph</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Deep Telemetry & Biometrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System & Server Infrastructure (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl sm:rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl bento-highlight">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  Kesehatan Infrastruktur & Server
                </h3>
                <p className="text-xs text-zinc-400 font-mono">Realtime Linux Telemetry & Shield Engine</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-mono">
              <span className="text-zinc-400">{t("overview_server_uptime", "Uptime")}:</span>
              <strong className="text-white font-bold">{system?.uptime || "--"}</strong>
            </div>
          </div>

          {/* 3 Core Resource Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CPU */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" /> {t("overview_cpu_load", "Beban CPU")}
                </span>
                <span className="font-black text-white font-mono text-base">{cpuPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                  style={{ width: `${cpuPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Thread Execution Balance</p>
            </div>

            {/* RAM */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" /> {t("overview_ram_usage", "Memori RAM")}
                </span>
                <span className="font-black text-white font-mono text-base">{ramPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                  style={{ width: `${ramPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {ramUsedGb ? `${ramUsedGb} GB / ${ramTotalGb} GB` : "RAM Terpakai"}
              </p>
            </div>

            {/* Disk */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-bold flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-sky-400" /> {t("overview_disk_usage", "Kapasitas Disk")}
                </span>
                <span className="font-black text-white font-mono text-base">{diskPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(14,165,233,0.5)]"
                  style={{ width: `${diskPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-400 font-mono truncate">
                {diskFreeGb ? `${diskFreeGb} GB Tersedia` : "NVMe SSD"}
              </p>
            </div>
          </div>

          {/* Fail2ban & Security Shield Glass Strip */}
          <div className="flex flex-wrap items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-white/[0.03] to-transparent border border-emerald-500/30 text-xs text-zinc-300 gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-zinc-100 text-sm">
                  {t("overview_fail2ban_title", "Pertahanan Fail2ban & SSH Shield")}
                </span>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  Port 25248 aktif •{" "}
                  <strong className="text-emerald-400 font-mono font-bold">
                    {system?.fail2ban?.sshd_banned || 0} IP Diblokir
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[11px] font-mono">
                <span className="text-zinc-400">{t("overview_fail2ban_perm", "Permanen Ban")}: </span>
                <strong className="text-zinc-100 font-bold">{system?.fail2ban?.recidive_banned || 0} IP</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Pelacak Karir / Jobs Quick Radar (1 col) */}
        <div
          onClick={() => onNavigate("jobs")}
          className="glass-card-interactive rounded-3xl sm:rounded-[32px] p-6 sm:p-8 flex flex-col justify-between space-y-6 group bento-highlight"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">Pelacak Karir</h3>
                <p className="text-xs text-zinc-400 font-mono">Job Hunter & Pipeline</p>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
              Remote / Local
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">
                {jobs?.total_active || 0}
              </span>
              <span className="text-xs text-zinc-400 font-medium">lamaran dalam proses</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] text-zinc-400">Dilamar</span>
                <p className="text-lg font-bold text-white font-mono mt-1">
                  {jobs?.applied || 0}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <span className="text-[11px] text-emerald-400">Interview</span>
                <p className="text-lg font-bold text-emerald-300 font-mono mt-1">
                  {jobs?.interview || 0}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Pantau status tahap rekrutmen, generate cover letter, dan riset lowongan kerja baru secara instan.
            </p>
          </div>

          <div className="pt-2 text-right">
            <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center justify-end gap-1.5 transition-colors">
              Buka Modul Karir <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </div>
      </div>

      {/* 4. Secondary Bento Modules Hub (3 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Storage Vault Card */}
        <div
          onClick={() => onNavigate("storage")}
          className="glass-card-interactive rounded-3xl p-6 group flex flex-col justify-between bento-highlight"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                Storage Vault
              </h4>
              <p className="text-xs text-zinc-400">Cloud Media & Private File Storage</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-300">
            <span className="font-mono text-zinc-400">Upload & Kelola File</span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Automation Schedules Card */}
        <div
          onClick={() => onNavigate("schedules")}
          className="glass-card-interactive rounded-3xl p-6 group flex flex-col justify-between bento-highlight"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                Jadwal Otomasi
              </h4>
              <p className="text-xs text-zinc-400">Cron & Scheduled Background Jobs</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-300">
            <span className="font-mono text-zinc-400">Lihat Rutinitas Agen</span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* Portfolio & CV CMS Card */}
        <div
          onClick={() => onNavigate("profile")}
          className="glass-card-interactive rounded-3xl p-6 group flex flex-col justify-between bento-highlight"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-rose-300 transition-colors">
                Profil & CV CMS
              </h4>
              <p className="text-xs text-zinc-400">Sinkronisasi Web Portfolio Utama</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-zinc-300">
            <span className="font-mono text-zinc-400">Edit Data arusuka.my.id</span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}
