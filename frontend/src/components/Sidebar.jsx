import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Brain,
  CloudSun,
  Activity,
  CalendarClock,
  HardDrive
} from 'lucide-react';

export const TABS = [
  { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'storage', label: 'File & Foto', icon: HardDrive },
  { id: 'tasks', label: 'Tugas Pribadi', icon: CheckSquare },
  { id: 'jobs', label: 'Pelacak Karir', icon: Briefcase },
  { id: 'brain', label: 'Second Brain', icon: Brain },
  { id: 'weather', label: 'Cuaca & Gempa', icon: CloudSun },
  { id: 'zepp', label: 'Kebugaran', icon: Activity },
  { id: 'schedules', label: 'Jadwal Otomasi', icon: CalendarClock },
];

export function Sidebar({ activeTab, onTabChange }) {
  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="bg-[#0c0d11]/80 border-b border-zinc-800 px-4 lg:px-8 py-2 overflow-x-auto custom-scrollbar flex items-center space-x-1 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 shrink-0 ${
                isActive
                  ? 'text-zinc-100 bg-zinc-800 border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-xl">
        {TABS.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-zinc-100' : 'text-zinc-500'}`} />
              <span className="text-[10px] leading-tight truncate max-w-[60px]">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
