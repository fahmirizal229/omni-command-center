/**
 * @file Sidebar.jsx
 * @description Sleek, unified Left Sidebar Navigation for Arusuka Command Center.
 * Perfectly styled to match the dark Obsidian/Zinc dashboard aesthetic.
 */

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  CloudSun,
  Brain,
  Briefcase,
  HardDrive,
  CalendarClock,
  UserCheck,
  RefreshCw,
  KeyRound,
  LogOut,
  ExternalLink,
  Sparkles,
  ChevronRight,
  MessageSquareCode,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useLanguage } from "../context/LanguageContext";

export const NAVIGATION_GROUPS = [
  {
    titleKey: "group_core",
    defaultTitle: "Utama & AI",
    items: [
      { id: "overview", labelKey: "nav_overview", defaultLabel: "Ringkasan", icon: LayoutDashboard, color: "text-indigo-400" },
      { id: "sessions", labelKey: "nav_sessions", defaultLabel: "AI Logs & Chat", icon: MessageSquareCode, color: "text-sky-400" },
      { id: "brain", labelKey: "nav_brain", defaultLabel: "Second Brain", icon: Brain, color: "text-purple-400" },
    ]
  },
  {
    titleKey: "group_productivity",
    defaultTitle: "Produktivitas & Karir",
    items: [
      { id: "tasks", labelKey: "nav_tasks", defaultLabel: "Tugas & Kanban", icon: CheckSquare, color: "text-amber-400" },
      { id: "jobs", labelKey: "nav_jobs", defaultLabel: "Karir & Radar", icon: Briefcase, color: "text-emerald-400" },
      { id: "zepp", labelKey: "nav_zepp", defaultLabel: "Kebugaran & Tidur", icon: Activity, color: "text-rose-400" },
      { id: "weather", labelKey: "nav_weather", defaultLabel: "Radar Cuaca BMKG", icon: CloudSun, color: "text-cyan-400" },
    ]
  },
  {
    titleKey: "group_system",
    defaultTitle: "Sistem & Vault",
    items: [
      { id: "storage", labelKey: "nav_storage", defaultLabel: "Storage Vault", icon: HardDrive, color: "text-blue-400" },
      { id: "schedules", labelKey: "nav_schedules", defaultLabel: "Otomasi & Cron", icon: CalendarClock, color: "text-yellow-400" },
      { id: "profile", labelKey: "nav_profile", defaultLabel: "Editor CV & Profil", icon: UserCheck, color: "text-pink-400" },
    ]
  }
];

export function Sidebar({ activeTab, onTabChange, onRefresh, refreshing, onOpenChangePassword }) {
  const { username, logout } = useAuth();
  const { wsStatus } = useWebSocket();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // Close mobile drawer on route change
  const handleNavClick = (id) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  // Find active label for mobile header
  const getActiveTabLabel = () => {
    for (const group of NAVIGATION_GROUPS) {
      const match = group.items.find((item) => item.id === activeTab);
      if (match) return t(match.labelKey, match.defaultLabel);
    }
    return "Dashboard";
  };

  const SidebarContent = (
    <div className="flex flex-col h-full select-none bg-[#0c0d12] text-zinc-100">
      {/* 1. Header / Brand Identity */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <a
          href="https://arusuka.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 group"
          title="Buka Web Utama (arusuka.my.id)"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-zinc-100 tracking-tight group-hover:text-indigo-400 transition-colors">
                Arusuka
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-zinc-800 text-indigo-400 border border-zinc-700">
                OMNI
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Command Center</p>
          </div>
        </a>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Live Telemetry & Status Banner */}
      <div className="px-4 py-2.5 bg-zinc-950/70 border-b border-zinc-800/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {wsStatus === "connected" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === "connected" ? "bg-emerald-400" : wsStatus === "connecting" ? "bg-amber-400" : "bg-zinc-600"
              }`}
            />
          </span>
          <span className="text-[11px] font-mono font-semibold tracking-wider uppercase text-zinc-400">
            {wsStatus === "connected" ? "Telemetry LIVE" : wsStatus === "connecting" ? "Connecting..." : "Offline"}
          </span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          title="Segarkan Data"
          className="p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      {/* 3. Grouped Navigation Links (Scrollable) */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
        {NAVIGATION_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <h4 className="px-2.5 text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
              {t(group.titleKey, group.defaultTitle)}
            </h4>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const label = t(item.labelKey, item.defaultLabel);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group ${
                      isActive
                        ? "bg-zinc-800 text-zinc-100 border border-zinc-700/80 font-bold shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? "text-indigo-400 scale-105" : `${item.color} opacity-80 group-hover:opacity-100 group-hover:scale-105`
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </div>

                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 4. Footer Controls & User Account */}
      <div className="p-3 border-t border-zinc-800 space-y-2 bg-[#0c0d12] relative">
        {/* Account Menu Popover */}
        {userMenuOpen && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-3 right-3 mb-2 rounded-xl bg-[#121215] border border-zinc-800 p-2 shadow-2xl z-50 animate-fadeIn text-xs"
          >
            <div className="px-2.5 py-1.5 border-b border-zinc-800 mb-1">
              <p className="font-bold text-zinc-100 truncate">{username}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Arusuka Workspace</p>
            </div>

            <a
              href="https://arusuka.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Web Utama</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">arusuka.my.id</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                onOpenChangePassword();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("btn_change_password", "Ganti Password")}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                if (confirm(t("logout_confirm", "Apakah kamu yakin ingin keluar?"))) {
                  logout();
                }
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t("btn_logout", "Keluar")}</span>
            </button>
          </div>
        )}

        {/* Language Switcher */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800">
          <span className="text-[11px] font-mono text-zinc-500">Bahasa:</span>
          <div className="flex items-center gap-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-colors ${
                  language === lang.code
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {lang.shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Pill Button */}
        <button
          type="button"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {username ? username.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="text-left truncate">
              <p className="text-xs font-semibold text-zinc-200 truncate">{username || "Akun"}</p>
              <p className="text-[10px] text-zinc-500 font-mono truncate">Pengaturan</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${userMenuOpen ? "rotate-90" : ""}`} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0c0d12] border-b border-zinc-800 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-100">{getActiveTabLabel()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {wsStatus === "connected" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === "connected" ? "bg-emerald-400" : "bg-zinc-600"
              }`}
            />
          </span>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-white">
            {username ? username.charAt(0).toUpperCase() : "A"}
          </div>
        </div>
      </header>

      {/* 2. Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-72 h-full bg-[#0c0d12] border-r border-zinc-800 shadow-2xl animate-slideRight"
            onClick={(e) => e.stopPropagation()}
          >
            {SidebarContent}
          </div>
        </div>
      )}

      {/* 3. Desktop Static Left Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 lg:w-72 bg-[#0c0d12] border-r border-zinc-800 z-40 flex-col shadow-2xl">
        {SidebarContent}
      </aside>
    </>
  );
}
