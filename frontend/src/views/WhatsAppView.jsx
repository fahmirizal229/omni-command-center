import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  Bot,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Briefcase,
  Zap,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  Radio,
  UserCheck,
  QrCode,
  Sparkles,
  Smartphone,
  Lock,
  EyeOff,
  Filter,
} from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

function WhatsAppSkeleton({ isDark = true }) {
  const shimmer = isDark ? "bg-slate-800/60 animate-pulse" : "bg-slate-200/80 animate-pulse";
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      {/* Banner Skeleton */}
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? "bg-[#0b0f19] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
              <div className={`h-7 w-60 rounded-xl ${shimmer}`} />
              <div className={`h-5 w-36 rounded-md ${shimmer}`} />
            </div>
            <div className={`h-4 w-96 max-w-full rounded-lg ${shimmer}`} />
          </div>
          <div className={`h-9 w-28 rounded-xl ${shimmer}`} />
        </div>
      </section>

      {/* 3 Metric Cards Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
                <div className={`h-4 w-28 rounded ${shimmer}`} />
              </div>
              <div className={`h-4 w-12 rounded ${shimmer}`} />
            </div>
            <div className="space-y-2 pt-2">
              <div className={`h-7 w-36 rounded-xl ${shimmer}`} />
              <div className={`h-3 w-48 rounded ${shimmer}`} />
            </div>
          </div>
        ))}
      </section>

      {/* Inbox Table Skeleton */}
      <section className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="p-4 sm:p-5 border-b border-inherit flex items-center justify-between">
          <div className={`h-4 w-44 rounded ${shimmer}`} />
          <div className={`h-8 w-48 rounded-xl ${shimmer}`} />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-inherit last:border-0">
              <div className={`h-4 w-32 rounded ${shimmer}`} />
              <div className={`h-4 w-24 rounded ${shimmer}`} />
              <div className={`h-4 w-72 max-w-[40%] rounded ${shimmer}`} />
              <div className={`h-4 w-20 rounded ${shimmer}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function WhatsAppView({ isDark = true }) {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // QR Code State
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBlobUrl, setQrBlobUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);

  const fetchOverview = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getWhatsAppOverview();
      if (res) {
        setOverviewData(res);
      }
      if (isManual) {
        showToast("Secretary status updated.", "success");
      }
    } catch (err) {
      showToast(err.message || "Could not check WhatsApp status.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  const loadQrCode = useCallback(async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const blob = await api.getWhatsAppQrBlob();
      const url = URL.createObjectURL(blob);
      setQrBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      setQrError(err.message || "Your account is already connected.");
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => fetchOverview(false), 20000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  // If QR modal is opened, lock body scroll, listen for ESC key, and periodically refresh QR
  useEffect(() => {
    let qrTimer = null;
    if (showQrModal) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e) => {
        if (e.key === "Escape") setShowQrModal(false);
      };
      window.addEventListener("keydown", handleKeyDown);

      loadQrCode();
      qrTimer = setInterval(() => {
        loadQrCode();
        fetchOverview(false);
      }, 8000);

      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
        if (qrTimer) clearInterval(qrTimer);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [showQrModal, loadQrCode, fetchOverview]);

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Message copied to clipboard.", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const daemon = overviewData?.daemon || {
    service: "active",
    status: "connected",
    connected_user: { name: "Fahmi Rizal", id: "6282134715478@s.whatsapp.net" },
    cached_messages: 97,
    cooldown: "1_day (Reset 00:00 WIB)",
    pause_mins: 15,
    anti_delete_enabled: true,
  };

  const stats = overviewData?.stats || {
    total_logged: 9,
    recruiters_detected: 4,
    pokemon_orders: 0,
    general_messages: 5,
    anti_delete_active: true,
    cooldown_policy: "1 Reply / Contact / Day (Reset 00:00 WIB)",
  };

  const assistant = overviewData?.assistant || {
    name: "Arusuka",
    role: "Executive Personal Assistant to Mas Fahmi",
    auto_reply_strategy: "Warm, polite, and professional notification when Mas Fahmi is offline",
    manual_pause_window: "15 minutes automatic silence when Mas Fahmi chats manually",
    vip_alert_channel: "Telegram VIP Alert Forwarding",
  };

  const rawMessages = overviewData?.messages || [];

  const isConnected = daemon.status === "connected" && daemon.connected_user;
  const userName = daemon.connected_user?.name || "Fahmi Rizal";
  const userPhone = daemon.connected_user?.id?.replace(/[^0-9]/g, "") || "6282134715478";
  const formattedPhone = userPhone.startsWith("62")
    ? `+62 ${userPhone.slice(2, 5)}-${userPhone.slice(5, 9)}-${userPhone.slice(9)}`
    : `+${userPhone}`;

  // Filter messages by search & category
  const filteredMessages = useMemo(() => {
    return rawMessages.filter((msg) => {
      const matchQuery =
        !searchQuery.trim() ||
        msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.phone.includes(searchQuery);

      if (!matchQuery) return false;

      if (selectedFilter === "career") return msg.is_recruiter;
      if (selectedFilter === "pokemon") return msg.is_pokemon;
      if (selectedFilter === "general") return !msg.is_recruiter && !msg.is_pokemon;
      return true;
    });
  }, [rawMessages, searchQuery, selectedFilter]);

  if (loading && !overviewData) {
    return <WhatsAppSkeleton isDark={isDark} />;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* QR CODE LINKING MODAL (PORTALED TO DOCUMENT.BODY)         */}
      {/* ========================================================= */}
      {showQrModal && createPortal(
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn select-none"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 shadow-2xl relative space-y-5 animate-scaleUp my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto ${
              isDark
                ? "bg-[#0e121d] border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] text-slate-100"
                : "bg-white border-slate-300 shadow-2xl text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-inherit pb-3.5 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Link Your WhatsApp</h3>
                  <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Connect your phone to Arusuka
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all active:scale-95 ${
                  isDark ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                }`}
                title="Close (ESC)"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {isConnected ? (
              <div className="space-y-4">
                <div className={`p-5 rounded-xl border text-center space-y-3 ${
                  isDark ? "bg-slate-900/70 border-slate-800" : "bg-emerald-50/50 border-emerald-200"
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Account Connected & Active</span>
                    </span>
                    <h4 className="text-base font-bold text-slate-100 mt-2">{userName}</h4>
                    <p className="text-xs font-mono text-slate-400">{formattedPhone}</p>
                  </div>
                  <div className={`p-3.5 rounded-xl border text-left text-xs font-sans leading-relaxed ${
                    isDark ? "bg-black/30 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-700"
                  }`}>
                    <p className="font-semibold text-emerald-400 mb-1">Why isn't a QR code showing?</p>
                    <p>
                      Your WhatsApp is <strong>already connected and running smoothly</strong>. A QR code is only needed if your phone gets disconnected or logged out.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchOverview(true)}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-mono cursor-pointer active:scale-95 ${
                      isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-400" : ""}`} />
                    <span>Check Connection</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQrModal(false)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer hover:bg-emerald-500 active:scale-95"
                  >
                    Got It
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Box */}
                <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-white border border-slate-300 min-h-[260px]">
                  {qrLoading && !qrBlobUrl ? (
                    <div className="flex flex-col items-center space-y-3 text-slate-600">
                      <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="text-xs font-mono font-medium">Preparing your QR code...</span>
                    </div>
                  ) : qrError ? (
                    <div className="text-center space-y-2 text-slate-700">
                      <ShieldAlert className="w-10 h-10 mx-auto text-amber-500" />
                      <p className="text-xs font-bold text-slate-900">{qrError}</p>
                      <button
                        type="button"
                        onClick={loadQrCode}
                        className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer active:scale-95"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    qrBlobUrl && (
                      <div className="space-y-3 text-center">
                        <img
                          src={qrBlobUrl}
                          alt="WhatsApp Linking QR Code"
                          className="w-56 h-56 object-contain rounded-lg border border-slate-200 shadow-sm"
                        />
                        <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-600 font-mono">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Live QR Code • Auto-refreshing</span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Steps & Guidance */}
                <div className={`p-3.5 rounded-xl border text-[11px] space-y-1.5 font-mono ${
                  isDark ? "bg-slate-950/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                }`}>
                  <p className="font-bold text-slate-200">How to link your phone:</p>
                  <p>1. Open WhatsApp on your phone.</p>
                  <p>2. Tap Menu (<span className="text-slate-200">⋮</span>) or Settings (<span className="text-slate-200">⚙</span>) → <span className="text-slate-200">Linked Devices</span>.</p>
                  <p>3. Tap <span className="text-emerald-400 font-semibold">Link a Device</span> and point your camera here.</p>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-between pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={loadQrCode}
                    disabled={qrLoading}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-mono cursor-pointer active:scale-95 ${
                      isDark ? "bg-slate-900 border-slate-800 text-slate-300 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? "animate-spin text-emerald-400" : ""}`} />
                    <span>Refresh Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQrModal(false);
                      fetchOverview(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer hover:bg-emerald-500 active:scale-95"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* 1. HERO HEADER BANNER: WHATSAPP SECRETARY RADAR           */}
      {/* ========================================================= */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all animate-stagger-1 ${
          isDark
            ? "bg-[#0b0f19] border-slate-800/80 shadow-xl text-slate-100"
            : "bg-white/95 border-slate-200/90 shadow-sm text-slate-900"
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {t("wa_banner_title") || "WhatsApp Secretary"}
              </h1>
              <span
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium border ${
                  isConnected
                    ? isDark
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                <span>{isConnected ? (t("wa_status_online") || "Secretary Online") : (language === "id" ? "Perlu Dihubungkan" : "Needs Reconnection")}</span>
              </span>
            </div>

            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {t("wa_banner_sub") || "I'm keeping an eye on your incoming chats, filtering recruiter inquiries, and saving deleted messages while you're offline."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 text-xs font-mono font-semibold ${
                !isConnected
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-md animate-pulse"
                  : isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  : "bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isConnected ? (language === "id" ? "Info Koneksi" : "Connection Info") : (language === "id" ? "Tautkan HP (QR Code)" : "Pair Phone (QR Code)")}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchOverview(true)}
              disabled={refreshing}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 text-xs font-mono font-medium ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  : "bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-500" : "text-slate-400"}`} />
              <span>{language === "id" ? "Segarkan" : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Offline / Reconnect Warning Banner if disconnected */}
        {!isConnected && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{language === "id" ? "Sesi WhatsApp kamu saat ini terputus. Klik Tautkan HP (QR Code) untuk menghubungkan kembali." : "Your WhatsApp session is currently disconnected. Click Pair Phone (QR Code) to reconnect."}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg shrink-0 cursor-pointer active:scale-95 text-[11px]"
            >
              {language === "id" ? "Hubungkan Sekarang" : "Pair Now"}
            </button>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* 2. THREE-CARD SECRETARY STATUS & METRICS RADAR            */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-stagger-2">
        {/* Card 1: Linked Device Profile */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-[border-color,background-color] duration-200 ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700/80"
              : "bg-white/95 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-semibold block ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {language === "id" ? "Ponsel Tertaut" : "Your Linked Phone"}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {language === "id" ? "Aktif & Beroperasi" : "Active & Listening"}
                </span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isConnected
                ? isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
            }`}>
              {isConnected ? (language === "id" ? "Tertaut" : "Linked") : "Offline"}
            </span>
          </div>

          <div>
            <p className={`text-lg font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
              {userName}
            </p>
            <p className={`text-xs font-mono mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {formattedPhone}
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
            isDark ? "bg-slate-950/40 border-slate-800/80 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span>{language === "id" ? "Disiplin Balas" : "Reply Discipline"}</span>
            <span className="text-emerald-400 font-semibold">{language === "id" ? "1 balasan/orang per hari" : "1 reply/person daily"}</span>
          </div>
        </div>

        {/* Card 2: Career & Recruiter Radar */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-[border-color,background-color] duration-200 ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700/80"
              : "bg-white/95 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-semibold block ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {language === "id" ? "Radar Karir & Loker" : "Career Radar"}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {language === "id" ? "Pesan Rekruter & Tawaran Kerja" : "Recruiters & Job Inquiries"}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400 tabular-nums">
              {stats.recruiters_detected} {language === "id" ? "Terdeteksi" : "Identified"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1 font-mono">
              <span className={`text-2xl font-bold tracking-tight tabular-nums text-sky-400`}>
                {stats.recruiters_detected} <span className="text-xs font-normal text-slate-400">{language === "id" ? "kontak" : "leads"}</span>
              </span>
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Terorganisir Otomatis" : "Auto-Organized"}</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {language === "id" ? "Arusuka mendeteksi undangan interview dan pesan rekruter agar Mas Fahmi bisa meninjau dengan mudah." : "I automatically spot interview invites and company outreach so you can review them easily."}
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
            isDark ? "bg-slate-950/40 border-slate-800/80 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span>{language === "id" ? "Total Dikelola" : "Total Handled"}</span>
            <span className="text-sky-400 font-semibold">{stats.total_logged} {language === "id" ? "Obrolan" : "Chats"}</span>
          </div>
        </div>

        {/* Card 3: Anti-Delete & Security Shield */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-[border-color,background-color] duration-200 ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700/80"
              : "bg-white/95 border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-semibold block ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                  {t("wa_card_deleted") || "Anti-Delete Shield"}
                </span>
                <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {language === "id" ? "Notifikasi Telegram" : "Telegram Alerts"}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-purple-400">
              {language === "id" ? "Aktif" : "Active"}
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1 font-mono">
              <span className={`text-2xl font-bold tracking-tight tabular-nums text-purple-400`}>
                {daemon.cached_messages || 0} <span className="text-xs font-normal text-slate-400">{language === "id" ? "dalam cache aman" : "in safe cache"}</span>
              </span>
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Tersimpan" : "Saved"}</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {language === "id" ? "Jika ada yang menarik pesan atau kirim foto sekali lihat, Arusuka simpan dan teruskan salinannya ke Telegram Mas Fahmi." : "If someone deletes a text or sends a view-once photo, I save it and forward a copy to your Telegram."}
            </p>
          </div>

          <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
            isDark ? "bg-slate-950/40 border-slate-800/80 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            <span>{language === "id" ? "Jeda Pintar" : "Smart Silence"}</span>
            <span className="text-purple-400 font-semibold">{daemon.pause_mins || 15} {language === "id" ? "menit jeda saat Mas Fahmi membalas" : "min pause when you reply"}</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. ASSISTANT PERSONA GUIDELINES & PROTOCOL CARD           */}
      {/* ========================================================= */}
      <section
        className={`p-5 sm:p-6 rounded-2xl border transition-all animate-stagger-2 ${
          isDark
            ? "bg-[#0e1322] border-slate-800/90 text-slate-200"
            : "bg-white border-slate-200 text-slate-800 shadow-xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{language === "id" ? "Pedoman Asisten Pribadi: Arusuka" : "Personal Assistant Guidelines: Arusuka"}</h3>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {language === "id" ? "Sahabat & asisten yang ramah, hangat, dan perhatian untuk Mas Fahmi" : "Warm, polite, and attentive helper for Mas Fahmi"}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-mono border ${
            isDark ? "bg-purple-500/10 text-purple-300 border-purple-500/20" : "bg-purple-50 text-purple-700 border-purple-200"
          }`}>
            {language === "id" ? "Mode Sekretaris Aktif" : "Secretary Mode Active"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs font-mono">
          <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Panggilan ke Pengguna" : "How I Address You"}</span>
            <p className="font-semibold text-emerald-400 mt-1">Mas Fahmi</p>
            <span className={`text-[10px] block mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {language === "id" ? "Nada bicara akrab & santun" : "Friendly & respectful tone"}
            </span>
          </div>
          <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Disiplin Auto-Reply" : "Thoughtful Auto-Replies"}</span>
            <p className="font-semibold text-sky-400 mt-1">{language === "id" ? "1 Balasan / Kontak / Hari" : "1 Reply / Person / Day"}</p>
            <span className={`text-[10px] block mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {language === "id" ? "Reset tiap tengah malam (00:00 WIB)" : "Resets every midnight (00:00 WIB)"}
            </span>
          </div>
          <div className={`p-3.5 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
            <span className={`text-[10px] block ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Arsip Catatan Privat" : "Private Memory Log"}</span>
            <p className="font-semibold text-purple-400 mt-1">secretary_inbox.md</p>
            <span className={`text-[10px] block mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {language === "id" ? "Tersimpan rapi di Second Brain" : "Quietly archived to Second Brain"}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SECRETARY INBOX RADAR: FILTERABLE MESSAGE LOG          */}
      {/* ========================================================= */}
      <section
        className={`rounded-2xl border overflow-hidden shadow-sm transition-colors animate-stagger-3 ${
          isDark ? "bg-[#0e121d] border-slate-800/90 text-slate-200" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        {/* Header & Controls */}
        <div className="p-4 sm:p-5 border-b border-inherit space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs sm:text-sm font-bold font-mono tracking-tight uppercase">
                {language === "id" ? "RIWAYAT PESAN & AKTIVITAS" : "Inbox & Activity History"}
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {language === "id" ? "Tersimpan di catatan pribadi Second Brain" : "Saved to your personal notes"}
            </span>
          </div>

          {/* Filter Chips & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "all", label: `${language === "id" ? "Semua" : "All"} (${rawMessages.length})` },
                { id: "career", label: `${language === "id" ? "Karir & Rekruter" : "Career & Recruiters"} (${stats.recruiters_detected})` },
                { id: "general", label: `${language === "id" ? "Umum" : "General"} (${stats.general_messages})` },
                { id: "pokemon", label: `Pokémon (${stats.pokemon_orders})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer active:scale-95 ${
                    selectedFilter === tab.id
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : isDark
                      ? "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("wa_search_placeholder") || "Search contact, note, or number..."}
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-mono transition-all outline-none ${
                  isDark
                    ? "bg-slate-950/70 border-slate-800 text-slate-200 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20"
                    : "bg-white border-slate-200 text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Message Table */}
        <div className="overflow-x-auto">
          {filteredMessages.length === 0 ? (
            <div className={`py-12 text-center text-xs font-mono space-y-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              <p className="font-semibold text-slate-400">{t("wa_empty_title") || "No incoming messages found"}</p>
              <p className="text-[11px]">{t("wa_empty_desc") || "Everything is quiet and all caught up!"}</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b font-semibold ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                <tr>
                  <th className="py-3 px-4">{language === "id" ? "Waktu" : "Received"}</th>
                  <th className="py-3 px-4">{language === "id" ? "Kontak" : "Contact"}</th>
                  <th className="py-3 px-4">{language === "id" ? "Label" : "Tag"}</th>
                  <th className="py-3 px-4">{language === "id" ? "Ringkasan Pesan" : "Message Summary"}</th>
                  <th className="py-3 px-4 text-right">{language === "id" ? "Aksi" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                {filteredMessages.map((msg) => {
                  const isRecruiter = msg.is_recruiter;
                  const isPokemon = msg.is_pokemon;
                  const waLink = msg.phone ? `https://wa.me/${msg.phone}` : null;

                  return (
                    <tr
                      key={msg.id || msg.time}
                      className={`transition-colors ${
                        isRecruiter
                          ? isDark ? "bg-sky-500/[0.04] hover:bg-sky-500/[0.08]" : "bg-sky-50/40 hover:bg-sky-50/70"
                          : isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-400">
                        {msg.time}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-200">
                          {msg.sender}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {msg.phone || "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isRecruiter
                              ? isDark ? "bg-sky-500/15 border-sky-500/30 text-sky-400" : "bg-sky-50 border-sky-200 text-sky-700 font-semibold"
                              : isPokemon
                              ? isDark ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700 font-semibold"
                              : isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {msg.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p
                          className={`text-xs font-sans line-clamp-2 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}
                          title={msg.summary}
                        >
                          {msg.summary}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.summary, msg.id)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer active:scale-95 ${
                              isDark
                                ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700"
                                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                            title="Copy message summary"
                          >
                            {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                          </button>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
                                isDark
                                  ? "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40"
                                  : "bg-white border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-300"
                              }`}
                              title="Open chat in WhatsApp Web"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
