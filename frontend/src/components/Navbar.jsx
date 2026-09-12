/**
 * @file Navbar.jsx
 * @description Ultra-sleek floating glass header island.
 * Seamlessly integrates live telemetry pulse, clock, language switcher, and profile controls.
 */

import React, { useState, useEffect } from "react";
import { RefreshCw, KeyRound, LogOut, ExternalLink, Activity, Sparkles, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useLanguage } from "../context/LanguageContext";

/**
 * Top floating navigation component.
 * @param {{ onRefresh: () => void, refreshing: boolean, onOpenChangePassword: () => void }} props
 */
export function Navbar({ onRefresh, refreshing, onOpenChangePassword }) {
  const { username, logout } = useAuth();
  const { wsStatus } = useWebSocket();
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const locale = language === "en" ? "en-US" : "id-ID";
      setTimeStr(now.toLocaleTimeString(locale, { hour12: false }) + " WIB");
      setDateStr(now.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  return (
    <header className="sticky top-2.5 z-40 px-3 sm:px-6 lg:px-8 max-w-[1920px] w-full mx-auto transition-all pointer-events-none">
      <div className="pointer-events-auto glass-panel rounded-2xl sm:rounded-3xl px-3.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-[0_12px_36px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.08] backdrop-blur-2xl">
        {/* Left: Brand Identity & Portal Jump */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          <a
            href="https://arusuka.my.id"
            target="_blank"
            rel="noopener noreferrer"
            title={t("btn_back_main", "Buka Web Utama (arusuka.my.id)")}
            className="group flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent border border-indigo-500/25 hover:border-indigo-400/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-300"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight">Arusuka</span>
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-white/[0.1] text-indigo-300 border border-white/[0.12]">
                OMNI
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:text-indigo-300 transition-opacity hidden xs:block" />
          </a>
        </div>

        {/* Center: Live Telemetry Pulse & Digital Clock */}
        <div className="hidden md:flex items-center space-x-2">
          {/* Realtime WS Indicator */}
          <div
            title={wsStatus === "connected" ? "WebSocket Realtime Connected" : "Connecting WebSocket..."}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
              wsStatus === "connected"
                ? "bg-emerald-500/[0.1] text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : wsStatus === "connecting"
                ? "bg-amber-500/[0.1] text-amber-300 border-amber-500/30 animate-pulse"
                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {wsStatus === "connected" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  wsStatus === "connected"
                    ? "bg-emerald-400"
                    : wsStatus === "connecting"
                    ? "bg-amber-400"
                    : "bg-zinc-500"
                }`}
              ></span>
            </span>
            <span className="tracking-wide text-[10px] font-mono uppercase font-semibold">
              {wsStatus === "connected"
                ? t("ws_live", "Live Realtime")
                : wsStatus === "connecting"
                ? t("ws_connecting", "Connecting...")
                : t("ws_offline", "Offline")}
            </span>
          </div>

          {/* Live Clock Pill */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-zinc-100">{timeStr}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 text-[11px]">{dateStr}</span>
          </div>
        </div>

        {/* Right: Actions, Language & Profile Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-0.5">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center space-x-1 ${
                  language === lang.code
                    ? "bg-white/[0.12] text-white shadow-sm border border-white/[0.15]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title={lang.label}
              >
                <span>{lang.flag}</span>
                <span className="font-mono">{lang.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            title={t("btn_refresh", "Refresh Data")}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] text-zinc-300 hover:text-white transition-all text-xs font-medium flex items-center space-x-1.5 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden lg:inline text-[11px] font-mono">{t("btn_refresh", "Refresh")}</span>
          </button>

          {/* User Account Controls */}
          <div className="flex items-center space-x-1 pl-1.5 border-l border-white/[0.08]">
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {username ? username.charAt(0).toUpperCase() : "A"}
              </div>
              <span className="font-medium hidden sm:inline text-xs">{username}</span>
            </div>

            <button
              type="button"
              onClick={onOpenChangePassword}
              title={t("btn_change_password", "Change Password")}
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.08] hover:border-white/[0.15] transition-all active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(t("logout_confirm", "Apakah kamu yakin ingin keluar?"))) {
                  logout();
                }
              }}
              title={t("btn_logout", "Logout")}
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/30 transition-all active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
