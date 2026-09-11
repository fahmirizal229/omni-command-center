/**
 * @file Sidebar.jsx
 * @description Sub-navigation bar component for switching dashboard module views.
 * Supports both desktop horizontal bar and mobile bottom navigation with i18n support.
 */

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Briefcase,
  Brain,
  CloudSun,
  Activity,
  CalendarClock,
  HardDrive
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const TAB_DEFINITIONS = [
  { id: "overview", labelKey: "nav_overview", defaultLabel: "Ringkasan", icon: LayoutDashboard },
  { id: "storage", labelKey: "nav_storage", defaultLabel: "File & Foto", icon: HardDrive },
  { id: "tasks", labelKey: "nav_tasks", defaultLabel: "Tugas Pribadi", icon: CheckSquare },
  { id: "jobs", labelKey: "nav_jobs", defaultLabel: "Pelacak Karir", icon: Briefcase },
  { id: "brain", labelKey: "nav_brain", defaultLabel: "Second Brain", icon: Brain },
  { id: "weather", labelKey: "nav_weather", defaultLabel: "Cuaca & Gempa", icon: CloudSun },
  { id: "zepp", labelKey: "nav_zepp", defaultLabel: "Kebugaran", icon: Activity },
  { id: "schedules", labelKey: "nav_schedules", defaultLabel: "Jadwal Otomasi", icon: CalendarClock },
];

/**
 * Secondary navigation bar component.
 * @param {{ activeTab: string, onTabChange: (tabId: string) => void }} props
 */
export function Sidebar({ activeTab, onTabChange }) {
  const { t } = useLanguage();

  return (
    <>
      {/* Desktop Navigation Bar */}
      <nav className="bg-[#0c0d11]/80 border-b border-zinc-800 px-4 lg:px-8 py-2 overflow-x-auto custom-scrollbar flex items-center space-x-1 shrink-0">
        {TAB_DEFINITIONS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const label = t(tab.labelKey, tab.defaultLabel);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 shrink-0 ${
                isActive
                  ? "text-zinc-100 bg-zinc-800 border border-zinc-700/80 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-zinc-200" : "text-zinc-500"}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121215]/95 backdrop-blur-md border-t border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-xl">
        {TAB_DEFINITIONS.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const label = t(tab.labelKey, tab.defaultLabel);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive ? "text-zinc-100 font-semibold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? "text-zinc-100" : "text-zinc-500"}`} />
              <span className="text-[10px] leading-tight truncate max-w-[60px]">{label.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
