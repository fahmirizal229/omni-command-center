import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  Server,
  Globe,
  Radio,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Terminal,
  Activity,
  Zap,
  Key,
  Flame,
  Search,
  Check,
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/soundEffects';
import { motion } from 'motion/react';

function SecuritySkeleton({ isDark = true }) {
  const shimmer = isDark ? 'bg-slate-800/60 animate-pulse' : 'bg-slate-200/80 animate-pulse';
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      {/* Banner Skeleton */}
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl ${shimmer}`} />
              <div className="space-y-1.5">
                <div className={`h-6 w-60 rounded-xl ${shimmer}`} />
                <div className={`h-4 w-40 rounded-md ${shimmer}`} />
              </div>
            </div>
          </div>
          <div className={`h-10 w-32 rounded-xl ${shimmer}`} />
        </div>
      </section>

      {/* 4 Cards Skeleton */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`h-4 w-28 rounded ${shimmer}`} />
              <div className={`w-6 h-6 rounded-lg ${shimmer}`} />
            </div>
            <div className={`h-7 w-20 rounded ${shimmer}`} />
            <div className={`h-3 w-32 rounded ${shimmer}`} />
          </div>
        ))}
      </section>
    </div>
  );
}

export function SecurityView({ isDark = true }) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [securityData, setSecurityData] = useState(null);
  const [unbanningIp, setUnbanningIp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, sshd, recidive

  const fetchSecurityData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await api.getSecurityStatus();
      if (res) {
        setSecurityData(res);
        if (manual) {
          playSuccessSound();
          showToast(language === 'id' ? 'Status pertahanan server diperbarui.' : 'Security telemetry refreshed.', 'success');
        }
      }
    } catch (err) {
      console.error('Error fetching security status:', err);
      showToast(err.message || (language === 'id' ? 'Gagal memuat status keamanan.' : 'Failed to load security status.'), 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [language, showToast]);

  useEffect(() => {
    fetchSecurityData();
    const interval = setInterval(() => fetchSecurityData(false), 15000);
    return () => clearInterval(interval);
  }, [fetchSecurityData]);

  const handleUnban = async (ip, jail = 'all') => {
    try {
      playClickSound();
      setUnbanningIp(ip);
      const res = await api.unbanSecurityIp(ip, jail);
      playSuccessSound();
      showToast(res.message || `IP ${ip} berhasil di-unban!`, 'success');
      fetchSecurityData(false);
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal unban IP', 'error');
    } finally {
      setUnbanningIp(null);
    }
  };

  if (loading && !securityData) {
    return <SecuritySkeleton isDark={isDark} />;
  }

  const fail2ban = securityData?.fail2ban || {};
  const sshdJail = fail2ban.sshd_jail || {};
  const recidiveJail = fail2ban.recidive_permanent_jail || {};
  const firewall = securityData?.firewall || {};
  const sshSentinel = securityData?.ssh_sentinel || {};

  const allBannedIps = fail2ban.all_banned_ips || [
    ...(sshdJail.banned_ips || []).map((ip) => ({
      ip,
      jail: 'sshd',
      category: 'ssh',
      jailLabel: 'SSHD Jail',
      type: 'SSH Bruteforce Ban',
      badgeColor: 'amber',
    })),
    ...(recidiveJail.banned_ips || []).map((ip) => ({
      ip,
      jail: 'recidive',
      category: 'recidive',
      jailLabel: 'Recidive Jail',
      type: 'Permanent Ban (Repeat Offender)',
      badgeColor: 'rose',
    })),
  ];

  const webBannedCount = allBannedIps.filter((i) => i.category === 'web' || i.jail.startsWith('nginx-')).length;
  const recidiveBannedCount = allBannedIps.filter((i) => i.category === 'recidive' || i.jail === 'recidive').length;
  const sshdBannedCount = allBannedIps.filter((i) => i.category === 'ssh' || i.jail === 'sshd').length;

  const filteredBannedIps = allBannedIps.filter((item) => {
    const matchesSearch = item.ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.jail.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.jailLabel && item.jailLabel.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === 'all'
      ? true
      : activeTab === 'web'
      ? item.category === 'web' || item.jail.startsWith('nginx-')
      : activeTab === 'recidive'
      ? item.category === 'recidive' || item.jail === 'recidive'
      : activeTab === 'sshd'
      ? item.category === 'ssh' || item.jail === 'sshd'
      : item.jail === activeTab;
    return matchesSearch && matchesTab;
  });

  const getBadgeClasses = (color) => {
    switch (color) {
      case 'rose':
        return {
          icon: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          chip: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
        };
      case 'cyan':
        return {
          icon: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          chip: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'blue':
        return {
          icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          chip: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        };
      case 'purple':
        return {
          icon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          chip: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      case 'amber':
        return {
          icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          chip: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        };
      case 'indigo':
        return {
          icon: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          chip: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        };
      default:
        return {
          icon: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          chip: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        };
    }
  };

  const recentSessions = sshSentinel.recent_sessions || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* 1. HERO DEFENSE RADAR BANNER                              */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? 'bg-[#0b0f19] border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-500/15 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-rose-600 flex items-center justify-center text-white shadow-[0_0_24px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/20 shrink-0">
              <ShieldCheck className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  SYSGUARD DEFENSE RADAR
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  SHIELD ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                  UFW HARDENED
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {language === 'id'
                  ? 'Sentral pertahanan server: Fail2ban Anti-Bruteforce & Web Shield, UFW Firewall Port 25248, dan Realtime PAM Alert Telegram.'
                  : 'Server defense center: Fail2ban Anti-Bruteforce & Web Shield, UFW Firewall Port 25248, and Realtime PAM Telegram Alerts.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                playClickSound();
                fetchSecurityData(true);
              }}
              disabled={isRefreshing}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/90 hover:border-slate-600'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{language === 'id' ? 'Pindai Ulang' : 'Rescan Radar'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. 4 TELEMETRY DEFENSE CARDS                              */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Defense Level Score */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Defense Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {securityData?.security_score || 100}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-500/90 uppercase tracking-wide">
              HARDENED
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {fail2ban.today_banned !== undefined
              ? (language === 'id' ? `${fail2ban.today_banned} IP dicekal hari ini` : `${fail2ban.today_banned} IPs banned today`)
              : (language === 'id' ? 'PoLP & Fail2ban Recidive Aktif' : 'PoLP & Fail2ban Recidive Active')}
          </p>
        </div>

        {/* Card 2: UFW Firewall */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              UFW Firewall
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400">
              {firewall.status || 'ACTIVE'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 font-mono truncate">
            {firewall.ssh_port || 'Port 25248/tcp'}
          </p>
        </div>

        {/* Card 3: Nginx Web Shield */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Web Shield (Nginx)
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-cyan-400">
              {fail2ban.web_active_bans ?? webBannedCount}
            </span>
            <span className="text-xs text-slate-400">IPs Active</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {language === 'id' ? `Total Dicekal: ${fail2ban.web_total_bans || webBannedCount}` : `Total Quarantined: ${fail2ban.web_total_bans || webBannedCount}`}
          </p>
        </div>

        {/* Card 4: Recidive & Host Sentinel */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Recidive & Host
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
              {recidiveJail.currently_banned || 0}
            </span>
            <span className="text-xs text-slate-400">IPs Perm Ban</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-mono">
            {language === 'id' ? `SSH Bans: ${sshdJail.currently_banned || 0} · Total: ${recidiveJail.total_banned || 0}` : `SSH Bans: ${sshdJail.currently_banned || 0} · Lifetime: ${recidiveJail.total_banned || 0}`}
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DEFENSE MATRIX & BANNED IP MANAGEMENT                   */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Banned IP List */}
        <div
          className={`lg:col-span-2 p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {language === 'id' ? 'Daftar IP Terblokir (Blocklist)' : 'Fail2ban Blocked IP List'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {allBannedIps.length} {language === 'id' ? 'ancaman terisolir di firewall' : 'threats quarantined'}
                  </p>
                </div>
              </div>

              {/* Tabs filter */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/50 border border-slate-800 relative">
                {[
                  { id: 'all', label: `All (${allBannedIps.length})`, activeBg: 'bg-indigo-600' },
                  { id: 'web', label: `Web Shield (${webBannedCount})`, activeBg: 'bg-cyan-600' },
                  { id: 'recidive', label: `Recidive (${recidiveBannedCount})`, activeBg: 'bg-rose-600' },
                  { id: 'sshd', label: `SSHD (${sshdBannedCount})`, activeBg: 'bg-amber-600' },
                ].map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer z-10 ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeSecurityTab"
                          className={`absolute inset-0 rounded-lg ${tab.activeBg} shadow-xs -z-10`}
                          transition={{ type: "spring", stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'id' ? 'Cari IP address atau filter jail...' : 'Search banned IP or jail...'}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs font-mono outline-hidden transition-all ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-200 focus:border-indigo-500 focus:bg-slate-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>

            {/* IP Table / Cards */}
            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredBannedIps.length === 0 ? (
                <div className="p-10 text-center space-y-2">
                  <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-400/60" />
                  <p className="text-xs font-medium text-slate-400">
                    {searchQuery
                      ? language === 'id'
                        ? 'Tidak ada IP yang cocok dengan kata kunci pencarian.'
                        : 'No IP matches search query.'
                      : language === 'id'
                      ? 'Tidak ada IP yang sedang diblokir di kategori ini.'
                      : 'No banned IPs found in this category.'}
                  </p>
                </div>
              ) : (
                filteredBannedIps.map((item, idx) => {
                  const style = getBadgeClasses(item.badgeColor);
                  return (
                    <div
                      key={`${item.jail}-${item.ip}-${idx}`}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        isDark
                          ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${style.icon}`}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-sm text-rose-400 tracking-wide">
                              {item.ip}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${style.chip}`}
                            >
                              {item.jailLabel || item.jail}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.type}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnban(item.ip, item.jail)}
                        disabled={unbanningIp === item.ip}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-700 hover:border-slate-600 shrink-0"
                      >
                        <Unlock className={`w-3.5 h-3.5 ${unbanningIp === item.ip ? 'animate-spin text-amber-400' : ''}`} />
                        <span>{unbanningIp === item.ip ? 'Unbanning...' : 'Unban IP'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between text-xs text-slate-500">
            <span>Fail2ban Dynamic Multi-Jail</span>
            <span>UFW Port 25248 Strict</span>
          </div>
        </div>

        {/* Right 1 Col: Recent Authorized Logins */}
        <div
          className={`p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center space-x-3 pb-4 border-b border-inherit">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'id' ? 'Sesi Login SSH Sah' : 'Recent SSH Logins'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'id' ? 'Autentikasi SSH Port 25248' : 'Verified SSH access log'}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
              {recentSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  {language === 'id' ? 'Belum ada sesi baru tercatat.' : 'No recent login logs.'}
                </div>
              ) : (
                recentSessions.map((session, idx) => (
                  <div
                    key={`${session.pid || idx}-${session.time}`}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                      session.is_active
                        ? isDark
                          ? 'bg-emerald-950/25 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.08)]'
                          : 'bg-emerald-50 border-emerald-300'
                        : isDark
                        ? 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100'
                        : 'bg-slate-50 border-slate-200 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold flex items-center gap-1.5">
                        <Key className={`w-3 h-3 ${session.is_active ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className={session.is_active ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-400'}>
                          {session.user}
                        </span>
                        <span className="text-slate-500">@</span>
                        <span className={session.is_active ? 'text-indigo-400' : 'text-slate-400'}>
                          {session.ip}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono flex items-center gap-2">
                        <span>{session.time}</span>
                        {session.port && (
                          <span className="text-[10px] text-slate-600 font-mono">:{session.port}</span>
                        )}
                      </div>
                    </div>

                    {session.is_active ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold shrink-0 border bg-emerald-500/20 text-emerald-400 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.25)] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        {language === 'id' ? 'AKTIF' : 'ACTIVE'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium shrink-0 border bg-slate-800/80 text-slate-400 border-slate-700/80">
                        {language === 'id' ? 'SELESAI' : 'CLOSED'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-inherit text-[11px] text-slate-500 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Real-time Telegram Alert Hook Active</span>
          </div>
        </div>
      </section>
    </div>
  );
}
