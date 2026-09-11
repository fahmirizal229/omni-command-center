import React from 'react';
import { CalendarClock, Shield, CheckCircle2, AlertOctagon, Terminal, Bot, Sun, Moon, ShieldCheck, Archive, Clock } from 'lucide-react';

const ICON_MAP = {
  'shield-alert': Shield,
  'bot': Bot,
  'sun': Sun,
  'moon': Moon,
  'shield-check': ShieldCheck,
  'archive': Archive,
};

const COLOR_BADGES = {
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  indigo: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  purple: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  slate: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export function SchedulesView({ schedulesData }) {
  if (!schedulesData) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-xs">
        Memuat jadwal cron sistem...
      </div>
    );
  }

  const schedules = schedulesData.schedules || [];
  const rawHermes = schedulesData.raw_hermes || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Card */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Jadwal Cron & Otomasi</h3>
          <span className="text-xs font-mono text-zinc-400">{schedules.length} Jadwal Aktif</span>
        </div>
        <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
          Daftar background daemon, cron job Linux, dan proses terjadwal yang berjalan di server.
        </p>
      </div>

      {/* Schedules Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {schedules.map((job) => {
          const IconComp = ICON_MAP[job.icon] || CalendarClock;
          const badgeClass = COLOR_BADGES[job.badge_color] || COLOR_BADGES.slate;

          return (
            <div
              key={job.id}
              className="p-5 rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm">{job.name}</h4>
                      <p className="text-[11px] text-zinc-500 font-mono">{job.type}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wider border ${badgeClass}`}>
                    {job.category}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{job.description}</p>
              </div>

              <div className="pt-3 border-t border-zinc-900 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Jadwal:</span>
                  <span className="text-zinc-200 font-medium">{job.schedule}</span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Target:</span>
                  <span className="text-zinc-300 font-medium truncate block">{job.target}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
