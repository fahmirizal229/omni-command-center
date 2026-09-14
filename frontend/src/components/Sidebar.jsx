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
      { id: "uptime", labelKey: "nav_uptime", defaultLabel: "Uptime Monitor", icon: Activity, color: "text-emerald-400", href: "https://status.arusuka.my.id", external: true },
      { id: "profile", labelKey: "nav_profile", defaultLabel: "Editor CV & Profil", icon: UserCheck, color: "text-pink-400" },
    ]
  }
];

export function Sidebar({ activeTab, onTabChange, onRefresh, refreshing, onOpenChangePassword, onOpenLogoutConfirm }) {
  const { username, logout } = useAuth();
  const { wsStatus } = useWebSocket();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);

  const menuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileAvatarRef = useRef(null);

  // Close user menu on outside click/touch
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Sidebar footer popover
      if (
        userMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }

      // Mobile top header popover
      if (
        mobileUserMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        mobileAvatarRef.current &&
        !mobileAvatarRef.current.contains(event.target)
      ) {
        setMobileUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [userMenuOpen, mobileUserMenuOpen]);

  // Handle logout trigger
  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    setMobileUserMenuOpen(false);
    setMobileOpen(false);
    if (onOpenLogoutConfirm) {
      onOpenLogoutConfirm();
    } else if (confirm(t("logout_confirm", "Apakah kamu yakin ingin keluar?"))) {
      logout();
    }
  };

  // Close mobile drawer on route change
  const handleNavClick = (id) => {
    onTabChange(id);
    setMobileOpen(false);
    setMobileUserMenuOpen(false);
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

                if (item.external && item.href) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-transparent font-medium transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${item.color} opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-transform`} />
                        <span className="truncate">{label}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                    </a>
                  );
                }

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
            className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl bg-[#121215] border border-zinc-800 p-2.5 shadow-2xl z-50 animate-fadeIn text-xs space-y-1"
          >
            <div className="px-2.5 py-1.5 border-b border-zinc-800/80 mb-1">
              <p className="font-bold text-zinc-100 truncate">{username || "Arusuka"}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Arusuka Workspace</p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                handleNavClick("profile");
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                <span>{t("nav_profile", "Editor CV & Profil")}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                setMobileOpen(false);
                onOpenChangePassword();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("btn_change_password", "Ganti Password")}</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
            </button>

            <a
              href="https://status.arusuka.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Uptime Monitor</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
            </a>

            <a
              href="https://arusuka.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Web Utama</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">arusuka.my.id</span>
            </a>

            <div className="pt-1 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t("btn_logout", "Keluar")}</span>
              </button>
            </div>
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
          ref={profileButtonRef}
          type="button"
          onClick={() => setUserMenuOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between p-2 rounded-xl border transition-all active:scale-[0.98] ${
            userMenuOpen
              ? "bg-zinc-900 border-indigo-500/50 shadow-sm"
              : "bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700"
          }`}
          aria-label="Pengaturan Akun"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
              {username ? username.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="text-left truncate">
              <p className="text-xs font-semibold text-zinc-200 truncate">{username || "Akun"}</p>
              <p className="text-[10px] text-zinc-400 font-mono truncate font-medium">Pengaturan & Akun</p>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${userMenuOpen ? "rotate-90 text-indigo-400" : ""}`} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Mobile Top Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0c0d12]/95 backdrop-blur-md border-b border-zinc-800 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors active:scale-95"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-100">{getActiveTabLabel()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
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

          {/* Mobile Interactive Avatar Button */}
          <button
            ref={mobileAvatarRef}
            type="button"
            onClick={() => setMobileUserMenuOpen((prev) => !prev)}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-1 ring-white/10 active:scale-95 transition-all hover:ring-indigo-400/50"
            title="Buka Pengaturan & Akun"
            aria-label="Buka Pengaturan & Akun"
          >
            {username ? username.charAt(0).toUpperCase() : "A"}
          </button>

          {/* Mobile Top Header Dropdown Menu */}
          {mobileUserMenuOpen && (
            <div
              ref={mobileMenuRef}
              className="absolute top-full right-0 mt-2 w-64 rounded-2xl bg-[#121215] border border-zinc-800 p-2.5 shadow-2xl z-50 animate-fadeIn text-xs text-zinc-100 space-y-1.5"
            >
              <div className="px-2.5 py-1.5 border-b border-zinc-800/80">
                <p className="font-bold text-zinc-100 truncate">{username || "Arusuka"}</p>
                <p className="text-[10px] text-zinc-500 font-mono">Arusuka Workspace</p>
              </div>

              {/* Language Switcher in Mobile Header Menu */}
              <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                <span className="text-[10px] font-mono text-zinc-500">Bahasa:</span>
                <div className="flex items-center gap-1">
                  {supportedLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
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

              <button
                type="button"
                onClick={() => {
                  setMobileUserMenuOpen(false);
                  handleNavClick("profile");
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                  <span>{t("nav_profile", "Editor CV & Profil")}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileUserMenuOpen(false);
                  onOpenChangePassword();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t("btn_change_password", "Ganti Password")}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              </button>

              <a
                href="https://status.arusuka.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Uptime Monitor</span>
                </span>
                <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">LIVE</span>
              </a>

              <a
                href="https://arusuka.my.id"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Web Utama</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">arusuka.my.id</span>
              </a>

              <div className="pt-1 border-t border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t("btn_logout", "Keluar")}</span>
                </button>
              </div>
            </div>
          )}
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
