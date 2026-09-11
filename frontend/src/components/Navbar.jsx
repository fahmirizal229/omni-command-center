/**
 * @file Navbar.jsx
 * @description Header navigation component displaying brand logo, real-time WebSocket connection
 * health indicator, dynamic clock, language localization switch (ID/EN), and user profile actions.
 */

import React, { useState, useEffect } from "react";
import { RefreshCw, KeyRound, LogOut, User, Globe, ExternalLink, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useLanguage } from "../context/LanguageContext";

/**
 * Top navigation bar component.
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
    <header className="sticky top-0 z-30 bg-[#0c0d11]/90 backdrop-blur-md border-b border-zinc-800 px-4 lg:px-8 py-3 flex items-center justify-between transition-all">
      {/* Brand Identity */}
      <div className="flex items-center space-x-3">
        <a
          href="https://arusuka.my.id"
          title={t("btn_back_main", "Kembali ke Web Utama (arusuka.my.id)")}
          className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/70 hover:border-emerald-500/60 flex items-center justify-center text-zinc-100 font-bold text-sm tracking-wide transition-all group shadow-sm"
        >
          <span className="group-hover:hidden font-mono">AR</span>
          <ArrowLeft className="w-4 h-4 text-emerald-400 hidden group-hover:block" />
        </a>
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5">
            Arusuka <span className="text-zinc-400 font-normal">Dashboard</span>
          </h1>
          <p className="text-[11px] text-zinc-400">{t("app_subtitle", "Personal Workspace & Server Hub")}</p>
        </div>
      </div>

      {/* Center Live Telemetry Status & Clock */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Realtime WS Indicator */}
        <div
          title={wsStatus === "connected" ? "WebSocket Realtime Connected" : "Connecting WebSocket..."}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
            wsStatus === "connected"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : wsStatus === "connecting"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          <span className="relative flex h-2 w-2">
            {wsStatus === "connected" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                wsStatus === "connected"
                  ? "bg-emerald-500"
                  : wsStatus === "connecting"
                  ? "bg-amber-500"
                  : "bg-zinc-500"
              }`}
            ></span>
          </span>
          <span>
            {wsStatus === "connected"
              ? t("ws_live", "Live Realtime")
              : wsStatus === "connecting"
              ? t("ws_connecting", "Connecting...")
              : t("ws_offline", "Offline")}
          </span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
          <span className="font-medium text-zinc-200">{timeStr}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">{dateStr}</span>
        </div>
      </div>

      {/* Right User Actions & Language Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Back to Main Site Button */}
        <a
          href="https://arusuka.my.id"
          title={t("btn_back_main", "Kembali ke Web Utama (arusuka.my.id)")}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all text-xs font-medium flex items-center space-x-1.5 active:scale-95 group shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline font-mono text-[11px]">{t("btn_back_main", "Main Site")}</span>
        </a>
        {/* Language Switcher Button */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all flex items-center space-x-1 ${
                language === lang.code
                  ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              title={lang.label}
            >
              <span>{lang.flag}</span>
              <span className="font-mono text-[10px]">{lang.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          title={t("btn_refresh", "Refresh")}
          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-all text-xs font-medium flex items-center space-x-1.5 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{t("btn_refresh", "Refresh")}</span>
        </button>

        {/* User Account Menu */}
        <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <User className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-medium hidden xs:inline">{username}</span>
          </div>

          <button
            type="button"
            onClick={onOpenChangePassword}
            title={t("btn_change_password", "Change Password")}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-all text-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm(t("logout_confirm", "Are you sure you want to log out?"))) {
                logout();
              }
            }}
            title={t("btn_logout", "Logout")}
            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition-all text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
