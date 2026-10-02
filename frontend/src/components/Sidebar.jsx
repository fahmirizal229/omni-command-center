import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Database,
  HardDrive,
  Terminal,
  Command,
  Sun,
  Moon,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  User,
  X,
  Menu,
  Sparkles,
  HeartPulse,
  CloudSun,
  Bot,
  UserCheck,
  Globe,
  Swords,
  Feather,
  Flame,
  Utensils,
  Palette,
  Brain,
  Activity,
  Briefcase,
  Kanban,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { playSwitchSound } from '../utils/soundEffects';
import { motion, AnimatePresence } from 'motion/react';

export function Sidebar({
  activeTab,
  onTabChange,
  onOpenCommandPalette,
  onToggleTheme,
  isDark,
  onOpenChangePassword,
  onOpenLogoutConfirm,
  isExpanded,
  setIsExpanded,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const menuRef = useRef(null);

  // Detect OS for dynamic shortcut keys
  useEffect(() => {
    setIsMac(
      typeof window !== 'undefined' &&
      /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '')
    );
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Grouped Navigation Structure with Dynamic Localization
  const navGroups = [
    {
      id: 'system',
      title: t('group_system', 'SYSTEM CORE'),
      items: [
        { id: 'overview', label: t('nav_overview', 'Overview'), icon: LayoutDashboard },
        { id: 'storage', label: t('nav_storage', 'Storage'), icon: HardDrive },
        { id: 'database', label: t('nav_database', 'Database Studio'), icon: Database },
        { id: 'terminal', label: t('nav_terminal', 'Terminal'), icon: Terminal },
        { id: 'security', label: 'Security Radar', icon: ShieldAlert },
      ],
    },
    {
      id: 'knowledge',
      title: 'KNOWLEDGE & VAULT',
      items: [
        { id: 'secondbrain', label: 'Obsidian Second Brain', icon: Brain },
        { id: 'techradar', label: 'Engineering Tech Radar', icon: Globe },
      ],
    },
    {
      id: 'apps',
      title: t('group_apps', 'APPS & PORTFOLIO'),
      items: [
        { id: 'jobs', label: 'Job & Career Radar', icon: Briefcase },
        { id: 'kanban', label: 'Career Kanban Board', icon: Kanban },
        { id: 'profile', label: t('nav_profile', 'Profile & CV'), icon: UserCheck },
        { id: 'playground', label: 'Design Playground', icon: Palette },
      ],
    },
    {
      id: 'personal',
      title: t('group_personal', 'PERSONAL & LIFE'),
      items: [
        { id: 'fitness', label: t('nav_fitness', 'Health & Fitness'), icon: HeartPulse },
        { id: 'diet', label: 'OMAD Nutrition', icon: Utensils },
        { id: 'weather', label: t('nav_weather', 'Weather & Radar'), icon: CloudSun },
      ],
    },
    {
      id: 'ai',
      title: t('group_ai', 'AI & AUTOMATION'),
      items: [
        { id: 'sentinel', label: 'Arusuka Sentinel', icon: Activity },
        { id: 'warroom', label: 'Agent War Room', icon: Flame },
        { id: 'kuro', label: t('nav_kuro', 'Kuro Team Swarm'), icon: Swords },
        { id: 'shiro', label: t('nav_shiro', 'Shiro Team Swarm'), icon: Feather },
        { id: 'whatsapp', label: t('nav_whatsapp', 'WhatsApp Secretary'), icon: Bot },
      ],
    },
  ];

  const handleNavSelect = (tabId) => {
    playSwitchSound();
    onTabChange(tabId);
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR (Large Screens >= 1024px)              */}
      {/* ========================================================= */}
      <aside
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 z-40 flex-col justify-between transition-all duration-300 select-none print:hidden ${
          isExpanded ? 'w-60' : 'w-[68px]'
        } ${
          isDark
            ? 'bg-[#080b12]/95 border-r border-slate-800/80 shadow-[4px_0_24px_rgba(0,0,0,0.6)] backdrop-blur-xl'
            : 'bg-white border-r border-slate-200/90 shadow-xs'
        }`}
      >
        {/* Top Scrollable Section: Brand, Commands & Navigation Links */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 flex flex-col gap-3">
          {/* Brand Header */}
          <div
            className={`flex items-center ${
              isExpanded ? 'justify-between px-1.5' : 'justify-center'
            } py-1 shrink-0`}
          >
            <button
              type="button"
              onClick={() => handleNavSelect('overview')}
              className="flex items-center gap-3 cursor-pointer group text-left"
              title="OMNI Personal Home Server"
            >
              <BrandLogo className="w-8 h-8 rounded-xl shrink-0 transition-transform group-hover:scale-105" />
              {isExpanded && (
                <div className="min-w-0 flex flex-col justify-center">
                  <span
                    className={`font-mono font-bold text-sm tracking-tight block truncate leading-tight ${
                      isDark ? 'text-slate-100' : 'text-slate-800'
                    }`}
                  >
                    OMNI
                  </span>
                  <span className={`text-[11px] block truncate leading-tight mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {t('brand_subtitle', 'Personal Home Server')}
                  </span>
                </div>
              )}
            </button>

            {/* Collapse / Expand Toggle Button */}
            {isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isDark
                    ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Collapse Sidebar"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!isExpanded && (
            <div className="flex justify-center pt-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className={`p-1.5 rounded-lg border transition-all ${
                  isDark
                    ? 'border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Expand Sidebar"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Search / Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center rounded-xl border font-mono text-xs cursor-pointer transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] shrink-0 ${
              isExpanded ? 'px-3 py-2 justify-between' : 'p-2.5 justify-center'
            } ${
              isDark
                ? 'bg-white/[0.02] border-slate-800/90 text-slate-400 hover:border-indigo-500/50 hover:bg-white/[0.05] hover:text-slate-200 hover:shadow-[0_0_12px_rgba(99,102,241,0.12)]'
                : 'bg-slate-50/80 border-slate-200 text-slate-600 font-medium hover:border-indigo-300 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
            }`}
            title="Search Menu & Commands (⌘K)"
          >
            <div className="flex items-center space-x-2">
              <Command className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:rotate-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              {isExpanded && <span>{t('quick_search', 'Commands')}</span>}
            </div>
            {isExpanded && (
              <kbd
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700/80 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                {isMac ? '⌘K' : 'Ctrl+K'}
              </kbd>
            )}
          </button>

          {/* Grouped Navigation Links */}
          <nav className="flex flex-col gap-2.5 pt-1">
            {navGroups.map((group, groupIdx) => (
              <div key={group.id} className="flex flex-col gap-1">
                {/* Group Section Header or Collapsed Divider */}
                {isExpanded ? (
                  <div className={`px-2.5 pb-0.5 flex items-center justify-between ${
                    groupIdx > 0 ? 'mt-1 pt-2 border-t ' + (isDark ? 'border-slate-800/60' : 'border-slate-100') : 'pt-1'
                  }`}>
                    <span className={`text-[10px] font-mono font-bold tracking-wider uppercase select-none ${
                      isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {group.title}
                    </span>
                  </div>
                ) : (
                  groupIdx > 0 && (
                    <div className="my-1 flex justify-center">
                      <div className={`w-6 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`} />
                    </div>
                  )
                )}

                {/* Nav Items in Group */}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavSelect(item.id)}
                      className={`relative flex items-center h-[38px] rounded-xl font-mono text-xs transition-colors duration-150 active:scale-[0.98] cursor-pointer group ${
                        isExpanded ? 'px-3 space-x-3' : 'px-0 justify-center'
                      } ${
                        isActive
                          ? isDark
                            ? 'text-indigo-300 font-semibold'
                            : 'text-indigo-700 font-semibold'
                          : isDark
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title={item.label}
                    >
                      {/* Fluid Active Pill with Motion layoutId */}
                      {isActive && (
                        <motion.div
                          layoutId="activeSidebarIndicator"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          className={`absolute inset-0 rounded-xl pointer-events-none ${
                            isDark
                              ? 'bg-indigo-600/15 border border-indigo-500/35 shadow-[0_0_14px_rgba(99,102,241,0.2)]'
                              : 'bg-indigo-50 border border-indigo-200 shadow-2xs'
                          }`}
                        />
                      )}

                      {isActive && isExpanded && (
                        <motion.span
                          layoutId="activeSidebarIndicatorBar"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full z-10 ${
                            isDark ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.9)]' : 'bg-indigo-600 shadow-xs'
                          }`}
                        />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 relative z-10 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isActive
                            ? isDark
                              ? 'text-indigo-400 scale-110'
                              : 'text-indigo-600 scale-110'
                            : isDark
                            ? 'text-slate-400 group-hover:scale-105 group-hover:text-slate-200'
                            : 'text-slate-500 group-hover:scale-105 group-hover:text-slate-800'
                        }`}
                      />
                      {isExpanded && <span className="truncate relative z-10">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Section: User Profile & Actions (Pinned at bottom) */}
        <div className={`p-3.5 border-t shrink-0 flex flex-col gap-2 relative ${
          isDark ? 'border-slate-800/80 bg-[#080b12]' : 'border-slate-200 bg-white'
        }`} ref={menuRef}>
          {/* Language Switcher Pill */}
          {isExpanded ? (
            <div className={`flex items-center justify-between p-1.5 rounded-xl border font-mono text-[11px] ${
              isDark ? 'bg-white/[0.02] border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center space-x-1.5 pl-1">
                <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span className="font-semibold text-[10px] uppercase tracking-wider">{t('language_label', 'Lang')}</span>
              </div>
              <div className={`relative flex items-center p-0.5 rounded-lg ${isDark ? 'bg-slate-900/90 border border-slate-800' : 'bg-slate-200/80 border border-slate-300/60'}`}>
                {/* Sliding highlight indicator with Motion layoutId */}
                <motion.div
                  layoutId="activeLangIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className={`absolute top-0.5 bottom-0.5 rounded-md pointer-events-none ${
                    language === 'id' ? 'left-0.5 w-[calc(50%-2px)]' : 'left-[calc(50%+1px)] w-[calc(50%-2px)]'
                  } ${
                    isDark
                      ? 'bg-indigo-600/30 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.25)]'
                      : 'bg-white border border-slate-200 shadow-xs'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  className={`relative z-10 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-colors duration-200 cursor-pointer ${
                    language === 'id'
                      ? isDark ? 'text-indigo-300 font-extrabold' : 'text-indigo-700 font-extrabold'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Bahasa Indonesia"
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`relative z-10 px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-colors duration-200 cursor-pointer ${
                    language === 'en'
                      ? isDark ? 'text-indigo-300 font-extrabold' : 'text-indigo-700 font-extrabold'
                      : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="English"
                >
                  EN
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className={`w-full flex items-center justify-center p-2 rounded-xl border font-mono text-[11px] font-bold transition-all cursor-pointer ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-indigo-300 hover:bg-white/[0.04]'
                  : 'border-slate-200 text-slate-600 hover:text-indigo-700 hover:bg-slate-100'
              }`}
              title={language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
            >
              <span className="uppercase text-[10px]">{language}</span>
            </button>
          )}

          {/* User Popover Trigger */}
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            className={`w-full flex items-center rounded-xl p-2 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:scale-[0.97] cursor-pointer ${
              isExpanded ? 'space-x-3 justify-between' : 'justify-center'
            } ${
              isDark
                ? 'hover:bg-white/[0.05] text-slate-300'
                : 'hover:bg-slate-100 text-slate-800'
            }`}
            title="Account Settings"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-all duration-200 group-hover:scale-105 ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-indigo-300 shadow-xs'
                    : 'bg-slate-100 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                {user?.display_name ? user.display_name.charAt(0).toUpperCase() : (user?.username ? user.username.charAt(0).toUpperCase() : 'F')}
              </div>
              {isExpanded && (
                <div className="min-w-0 text-left">
                  <span className={`font-mono text-xs font-semibold block truncate ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {user?.display_name || user?.username || 'Fahmi'}
                  </span>
                </div>
              )}
            </div>
          </button>

          {/* User Dropdown Menu Popover with AnimatePresence */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute bottom-full left-3.5 mb-2 w-56 rounded-2xl border p-2 shadow-xl backdrop-blur-xl z-50 origin-bottom-left ${
                  isDark
                    ? 'bg-[#0f1422]/95 border-slate-800 text-slate-200 shadow-[0_16px_36px_rgba(0,0,0,0.8)]'
                    : 'bg-white border-slate-200 text-slate-800 shadow-xl'
                }`}
              >
                <div className={`px-2.5 py-1.5 border-b mb-1 ${
                  isDark ? 'border-slate-800/60' : 'border-slate-100'
                }`}>
                  <span className={`font-mono text-xs font-semibold block truncate ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {user?.display_name || user?.username || 'Fahmi'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onOpenChangePassword();
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                    isDark ? 'hover:bg-white/[0.05] text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <KeyRound className={`w-3.5 h-3.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span>{t('btn_change_password', 'Change Password')}</span>
                </button>

                <div className={`pt-1 border-t mt-1 ${isDark ? 'border-slate-800/60' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenLogoutConfirm();
                    }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                      isDark ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('btn_logout', 'Sign Out')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE SLIDE-OVER DRAWER (Screens < 1024px)             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setIsMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className={`w-72 h-full border-r p-4 flex flex-col justify-between shadow-2xl ${
                isDark
                  ? 'bg-[#080b12] border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Header */}
                <div className={`flex items-center justify-between pb-3 border-b ${
                  isDark ? 'border-slate-800/80' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <BrandLogo className="w-7 h-7 rounded-lg shrink-0" />
                    <div className="flex flex-col justify-center min-w-0">
                      <span className={`font-mono font-bold text-sm block leading-tight ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>OMNI</span>
                      <span className={`text-[10px] block leading-tight mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Personal Home Server</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileOpen(false)}
                    className={`p-1.5 rounded-lg border ${
                      isDark
                        ? 'border-slate-800 text-slate-400 hover:text-white'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Grouped Nav Links */}
                <nav className="flex flex-col gap-2.5">
                  {navGroups.map((group, groupIdx) => (
                    <div key={group.id} className="flex flex-col gap-1">
                      <div className={`px-2.5 pb-0.5 flex items-center justify-between ${
                        groupIdx > 0 ? 'mt-1 pt-2 border-t ' + (isDark ? 'border-slate-800/50' : 'border-slate-100') : 'pt-0.5'
                      }`}>
                        <span className={`text-[10px] font-mono font-bold tracking-wider uppercase select-none ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {group.title}
                        </span>
                      </div>

                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavSelect(item.id)}
                            className={`relative flex items-center h-[40px] space-x-3 px-3 rounded-xl font-mono text-xs transition-colors duration-150 cursor-pointer ${
                              isActive
                                ? isDark
                                  ? 'text-indigo-300 font-semibold'
                                  : 'text-indigo-700 font-semibold'
                                : isDark
                                ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="activeMobileSidebarIndicator"
                                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                className={`absolute inset-0 rounded-xl pointer-events-none ${
                                  isDark
                                    ? 'bg-indigo-600/20 border border-indigo-500/40 shadow-[0_0_14px_rgba(99,102,241,0.2)]'
                                    : 'bg-indigo-50 border border-indigo-200 shadow-xs'
                                }`}
                              />
                            )}
                            {isActive && (
                              <motion.span
                                layoutId="activeMobileSidebarBar"
                                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                                className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-full z-10 ${
                                  isDark ? 'bg-indigo-400' : 'bg-indigo-600'
                                }`}
                              />
                            )}
                            <Icon
                              className={`w-4 h-4 relative z-10 transition-all duration-200 ${
                                isActive
                                  ? isDark ? 'text-indigo-400 scale-105' : 'text-indigo-600 scale-105'
                                  : isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            />
                            <span className="relative z-10">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Mobile Footer Actions */}
              <div className={`pt-4 border-t space-y-2 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                {/* Mobile Language Switcher */}
                <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono font-medium ${
                  isDark ? 'border-slate-800 text-slate-300 bg-white/[0.02]' : 'border-slate-200 text-slate-700 bg-slate-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Globe className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    <span>{t('language_label', 'Language')}</span>
                  </div>
                  <div className={`relative flex items-center p-0.5 rounded-lg ${isDark ? 'bg-slate-900/90 border border-slate-800' : 'bg-slate-200/80 border border-slate-300/60'}`}>
                    <button
                      type="button"
                      onClick={() => setLanguage('id')}
                      className={`relative z-10 px-3 py-1 rounded-md text-xs font-bold transition-colors duration-200 cursor-pointer ${
                        language === 'id'
                          ? isDark ? 'text-indigo-300 font-extrabold' : 'text-indigo-700 font-extrabold'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`relative z-10 px-3 py-1 rounded-md text-xs font-bold transition-colors duration-200 cursor-pointer ${
                        language === 'en'
                          ? isDark ? 'text-indigo-300 font-extrabold' : 'text-indigo-700 font-extrabold'
                          : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    setIsMobileOpen(false);
                    onToggleTheme(e);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono font-medium transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span>{t('theme_mode', 'Theme Mode')}</span>
                  <div className={`transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] ${isDark ? 'rotate-0' : 'rotate-180'}`}>
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    onOpenChangePassword();
                  }}
                  className={`w-full flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-mono font-medium cursor-pointer ${
                    isDark
                      ? 'border-slate-800 text-slate-300 hover:bg-slate-900/60'
                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <KeyRound className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <span>{t('btn_change_password', 'Change Password')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileOpen(false);
                    onOpenLogoutConfirm();
                  }}
                  className={`w-full flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-mono font-medium cursor-pointer ${
                    isDark
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('btn_logout', 'Sign Out')}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
