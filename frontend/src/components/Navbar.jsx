/**
 * @file Navbar.jsx
 * @description Ultra-sleek floating glass header island.
 * Seamlessly integrates the Paul Rand Isometric FR Core logo, live telemetry pulse, clock, language switcher, and profile controls.
 */

import React, { useState, useEffect } from "react";
import { RefreshCw, KeyRound, LogOut, ExternalLink, Activity, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useLanguage } from "../context/LanguageContext";
import { BrandLogoBadge } from "./BrandLogo";

/**
 * Top floating navigation component.
 * @param {{ onRefresh: () => void, refreshing: boolean, onOpenChangePassword: () => void, onOpenLogoutConfirm?: () => void }} props
 */
export function Navbar({ onRefresh, refreshing, onOpenChangePassword, onOpenLogoutConfirm }) {
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
      <div className="pointer-events-auto glass-panel rounded-2xl sm:rounded-3xl px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/[0.08] backdrop-blur-2xl">
        {/* Left: Brand Identity with Paul Rand FR Core Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <a
            href="https://arusuka.my.id"
            target="_blank"
            rel="noopener noreferrer"
            title={t("btn_back_main", "Buka Web Utama (arusuka.my.id)")}
            className="group flex items-center gap-2.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/25 hover:border-emerald-400/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)] transition-all duration-300"
          >
            <BrandLogoBadge size="sm" />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight flex items-center leading-normal">Arusuka</span>
              <span className="badge-capsule px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <span className="badge-text">COMMAND</span>
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-400 opacity-60 group-hover:opacity-100 group-hover:text-emerald-300 transition-opacity hidden xs:block" />
          </a>
        </div>

        {/* Center: Live Telemetry Pulse & Digital Clock */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Realtime WS Indicator */}
          <div
            title={wsStatus === "connected" ? "WebSocket Realtime Connected" : "Connecting WebSocket..."}
            className={`badge-capsule gap-2 px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
              wsStatus === "connected"
                ? "bg-emerald-500/[0.1] text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : wsStatus === "connecting"
                ? "bg-amber-500/[0.1] text-amber-300 border-amber-500/30 animate-pulse"
                : "bg-zinc-800/60 text-zinc-400 border-zinc-700/60"
            }`}
          >
            <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
              {wsStatus === "connected" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  wsStatus === "connected" ? "bg-emerald-400" : wsStatus === "connecting" ? "bg-amber-400" : "bg-rose-400"
                }`}
              ></span>
            </span>
            <span className="badge-text font-mono text-[10px] tracking-wide">
              {wsStatus === "connected" ? "LIVE SYNC" : wsStatus === "connecting" ? "CONNECTING" : "OFFLINE"}
            </span>
          </div>

          {/* Clock Pill */}
          <div className="badge-capsule gap-2 px-3.5 py-1 rounded-full bg-zinc-900/60 border border-white/[0.08] text-xs font-mono text-zinc-300 shadow-inner">
            <span className="badge-text text-zinc-500 text-[10px]">{dateStr}</span>
            <span className="text-zinc-600 leading-none">•</span>
            <span className="badge-text text-emerald-400 font-semibold">{timeStr}</span>
          </div>
        </div>

        {/* Right: Actions & User Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title={t("btn_refresh", "Perbarui Data")}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.08] hover:border-emerald-500/30 text-zinc-300 hover:text-white flex items-center gap-1.5 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">{refreshing ? t("state_syncing", "Menyelaraskan...") : t("btn_refresh", "Segarkan")}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative group">
            <button
              title="Ganti Bahasa / Switch Language"
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.08] text-zinc-300 hover:text-white flex items-center gap-1 text-xs font-medium transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
              <span className="font-mono text-[11px] uppercase font-bold">{language}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col bg-zinc-900/95 backdrop-blur-xl border border-white/[0.1] rounded-xl shadow-2xl p-1 z-50 min-w-[120px] animate-fadeIn">
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    language === lang.code
                      ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                      : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span>{lang.name}</span>
                  {language === lang.code && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Security Action */}
          <button
            onClick={onOpenChangePassword}
            title={t("btn_change_password", "Ganti Kata Sandi")}
            className="p-2 rounded-xl sm:rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/[0.08] hover:border-amber-500/30 text-zinc-400 hover:text-amber-300 transition-all hidden sm:flex items-center justify-center"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>

          {/* Logout Action */}
          <button
            onClick={onOpenLogoutConfirm || logout}
            title={t("btn_logout", "Keluar dari Sesi")}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-300 flex items-center gap-1.5 text-xs font-medium transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t("btn_logout", "Keluar")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
