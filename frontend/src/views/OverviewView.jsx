import React from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function OverviewView({ overview, onNavigate }) {
  const { t } = useLanguage();

  if (!overview) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-xs">
        {t('overview_loading', 'Memuat ringkasan sistem...')}
      </div>
    );
  }

  const { system, tasks, jobs, second_brain, weather, zepp } = overview;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 lg:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              {t('overview_banner_title', 'Ringkasan Workspace & Server')}
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {t('overview_banner_desc', 'Status infrastruktur, antrean tugas pribadi, data Second Brain, dan pemantauan perangkat harian.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('tasks')}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-all shadow-sm flex items-center space-x-1.5"
            >
              <span>{t('overview_btn_tasks', 'Tugas Pribadi')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('jobs')}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs font-medium transition-all"
            >
              {t('overview_btn_jobs', 'Pelacak Karir')}
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Personal Tasks Card */}
        <div
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{t('overview_stat_tasks', 'Tugas Pribadi')}</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-zinc-100 font-mono">{tasks?.total_active || 0}</p>
            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-1">
              <span className="text-zinc-300 font-medium">{tasks?.in_progress || 0} {t('overview_stat_in_progress', 'Sedang Jalan')}</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{tasks?.urgent || 0} {t('overview_stat_urgent', 'Urgent')}</span>
            </div>
          </div>
        </div>

        {/* Career Tracker Card */}
        <div
          onClick={() => onNavigate('jobs')}
          className="cursor-pointer rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{t('overview_stat_jobs', 'Pelacak Karir')}</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-zinc-100 font-mono">{jobs?.total_active || 0}</p>
            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-1">
              <span className="text-zinc-300 font-medium">{jobs?.applied || 0} {t('overview_stat_applied', 'Dilamar')}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">{jobs?.interview || 0} {t('overview_stat_interview', 'Interview')}</span>
            </div>
          </div>
        </div>

        {/* Second Brain Card */}
        <div
          onClick={() => onNavigate('brain')}
          className="cursor-pointer rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{t('overview_stat_brain', 'Second Brain')}</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-zinc-100 font-mono">{second_brain?.total_notes || 0}</p>
            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-1">
              <span className="text-zinc-300 font-medium">{second_brain?.graph_entities || 0} {t('overview_stat_entities', 'Entitas')}</span>
              <span>•</span>
              <span className="text-zinc-400">{second_brain?.graph_relations || 0} {t('overview_stat_relations', 'Relasi')}</span>
            </div>
          </div>
        </div>

        {/* Surabaya Weather & AQI Card */}
        <div
          onClick={() => onNavigate('weather')}
          className="cursor-pointer rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] p-5 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{t('overview_stat_weather', 'Cuaca Surabaya')}</span>
            <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 flex items-center justify-center">
              <CloudSun className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-zinc-100 flex items-center gap-1.5 font-mono">
              <span>{weather?.temp_c ? `${weather.temp_c}°C` : '--°C'}</span>
              <span className="text-lg">{weather?.icon || '🌤️'}</span>
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-1">
              <span className="text-emerald-400 font-medium">{t('overview_stat_aqi', 'AQI')} {weather?.aqi || '--'}</span>
              <span>•</span>
              <span>{weather?.condition || 'Surabaya'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Resource Metrics & Fitness Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Vitals (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-zinc-100 text-sm">{t('overview_server_title', 'Status & Kesehatan Server')}</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">{t('overview_server_uptime', 'Uptime')}: {system?.uptime || '--'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* CPU */}
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-zinc-400" /> {t('overview_cpu_load', 'Beban CPU')}
                </span>
                <span className="font-bold text-zinc-100 font-mono">{system?.cpu_percent || 0}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-300 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(system?.cpu_percent || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> {t('overview_ram_usage', 'Memori (RAM)')}
                </span>
                <span className="font-bold text-zinc-100 font-mono">{system?.ram_percent || 0}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(system?.ram_percent || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Disk */}
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-zinc-400" /> {t('overview_disk_usage', 'Kapasitas Disk')}
                </span>
                <span className="font-bold text-zinc-100 font-mono">{system?.disk_percent || 0}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(system?.disk_percent || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fail2ban & Security */}
          <div className="flex flex-wrap items-center justify-between p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 gap-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>{t('overview_fail2ban_title', 'Proteksi Fail2ban SSH')}:</span>
              <strong className="text-emerald-400 font-mono">
                {system?.fail2ban?.sshd_banned || 0} {t('overview_fail2ban_active', 'Blokir Aktif')}
              </strong>
            </div>
            <div className="flex items-center space-x-2">
              <span>{t('overview_fail2ban_perm', 'Permanen Ban')}:</span>
              <strong className="text-zinc-300 font-mono">
                {system?.fail2ban?.recidive_banned || 0} IP
              </strong>
            </div>
          </div>
        </div>

        {/* Zepp Life Fitness Mini-Widget (1 col) */}
        <div
          onClick={() => onNavigate('zepp')}
          className="cursor-pointer rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] p-6 flex flex-col justify-between space-y-4 transition-all"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-zinc-300" />
              <h3 className="font-semibold text-zinc-100 text-sm">{t('overview_fitness_title', 'Kebugaran & Aktivitas')}</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
              {t('overview_fitness_sync', 'Zepp Sync')}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-2xl font-bold text-zinc-100 font-mono">
                  {zepp?.today?.steps?.toLocaleString() || 0}
                </p>
                <p className="text-[11px] text-zinc-400">{t('overview_today_steps', 'Langkah Hari Ini')}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-emerald-400 font-mono">
                  {zepp?.today?.calorie || 0} {t('overview_today_calorie', 'kcal')}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {zepp?.today?.distance_km || 0} km
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
              <span className="text-zinc-400">{t('overview_last_sleep', 'Tidur Semalam')}:</span>
              <span className="font-medium text-zinc-200 font-mono">
                {zepp?.last_sleep?.sleep_hours || '--'}
              </span>
            </div>
          </div>

          <div className="text-right pt-2">
            <span className="text-xs font-medium text-zinc-300 flex items-center justify-end gap-1 hover:text-white transition-colors">
              {t('overview_view_fitness', 'Lihat Rincian Kebugaran')} <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
