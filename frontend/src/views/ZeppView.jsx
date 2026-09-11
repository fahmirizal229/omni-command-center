import React from 'react';
import { Activity, Flame, Moon, Footprints, Clock, Heart, Award } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function ZeppView({ zeppData }) {
  const { t } = useLanguage();

  if (!zeppData) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-xs">
        {t('loading', 'Memuat analitik kebugaran Zepp Life...')}
      </div>
    );
  }

  const { today, last_sleep, history_7days } = zeppData;
  const maxSteps = Math.max(8000, ...(history_7days || []).map((d) => d.steps || 0));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-100 font-mono">{today?.steps?.toLocaleString() || 0}</p>
            <p className="text-xs text-zinc-400">{t('zepp_today_metrics', 'Total Langkah Hari Ini')}</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-100 font-mono">{today?.calorie || 0} kcal</p>
            <p className="text-xs text-zinc-400">{t('zepp_calories', 'Kalori')} ({today?.distance_km || 0} km)</p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800 flex items-center space-x-4">
          <div className="w-11 h-11 rounded-lg bg-zinc-800 text-zinc-200 flex items-center justify-center">
            <Moon className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-100 font-mono">{last_sleep?.sleep_hours || '--'}</p>
            <p className="text-xs text-zinc-400">{t('overview_last_sleep', 'Durasi Tidur Semalam')}</p>
          </div>
        </div>
      </div>

      {/* Sleep Breakdown */}
      {last_sleep && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              <Moon className="w-4 h-4 text-zinc-400" />
              <span>{t('zepp_sleep_analysis', 'Tahapan Tidur Semalam')}</span>
            </h4>
            <span className="text-xs font-mono text-zinc-300 font-medium">{last_sleep.sleep_hours}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono">{t('zepp_sleep_deep', 'Deep Sleep (Nyenyak)')}</span>
              <p className="text-lg font-bold text-zinc-200 font-mono">{last_sleep.deep_sleep_mins || 0} m</p>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono">{t('zepp_sleep_light', 'Light Sleep (Ringan)')}</span>
              <p className="text-lg font-bold text-zinc-200 font-mono">{last_sleep.light_sleep_mins || 0} m</p>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono">{t('zepp_sleep_rem', 'REM (Mimpi)')}</span>
              <p className="text-lg font-bold text-zinc-200 font-mono">{last_sleep.rem_mins || 0} m</p>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 font-mono">{t('zepp_sleep_awake', 'Terbangun (Awake)')}</span>
              <p className="text-lg font-bold text-zinc-400 font-mono">{last_sleep.awake_mins || 0} m</p>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Step History Mini Bar Chart */}
      {Array.isArray(history_7days) && history_7days.length > 0 && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-400" />
              <span>{t('zepp_7day_history', 'Aktivitas Langkah 7 Hari Terakhir')}</span>
            </h4>
            <span className="text-xs text-zinc-400 font-mono">Target: 8.000 / day</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6">
            {history_7days.map((item, idx) => {
              const heightPct = Math.max(10, Math.min(100, Math.round((item.steps / maxSteps) * 100)));
              const isToday = idx === history_7days.length - 1;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-zinc-800 text-[10px] font-mono text-zinc-200 pointer-events-none whitespace-nowrap border border-zinc-700 z-10">
                    {item.steps} ({item.distance_km} km)
                  </div>

                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday ? 'bg-zinc-100' : item.steps >= 8000 ? 'bg-emerald-500/80' : 'bg-zinc-800'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-mono text-zinc-500 mt-2 truncate max-w-full">
                    {item.date?.slice(5) || ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
