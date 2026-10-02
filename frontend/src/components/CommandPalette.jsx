import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  HeartPulse,
  CloudSun,
  LayoutDashboard,
  Database,
  HardDrive,
  Terminal,
  KeyRound,
  LogOut,
  Sun,
  Moon,
  Search,
  ArrowRight,
  Command,
  Bot,
  UserCheck,
  Globe,
  Swords,
  Feather,
  ShieldAlert,
  Flame,
  Utensils,
  Volume2,
  VolumeX,
  Brain,
  Briefcase,
  Kanban,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isSoundEnabled, setSoundEnabled, playSwitchSound, playSuccessSound } from '../utils/soundEffects';
import { motion, AnimatePresence } from 'motion/react';

export function CommandPalette({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  onToggleTheme,
  isDark,
  onOpenChangePassword,
  onOpenLogoutConfirm,
}) {
  const { language, setLanguage, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Detect client OS
  useEffect(() => {
    setIsMac(
      typeof window !== 'undefined' &&
      /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || navigator.platform || '')
    );
  }, []);

  // Commands & Navigation items with Safe Non-Conflicting Web Shortcuts
  const commands = [
    {
      id: 'nav-overview',
      category: t('cmd_category_system', 'System Core'),
      label: t('nav_overview', 'Server Overview'),
      description: t('nav_overview_desc', 'Server health status, processor load, memory, and weather'),
      icon: LayoutDashboard,
      action: () => {
        playSwitchSound();
        onTabChange('overview');
        onClose();
      },
    },
    {
      id: 'nav-secondbrain',
      category: 'Knowledge & Memory',
      label: 'Obsidian Second Brain & Knowledge Vault',
      description: 'Explore 75+ markdown notes, 400+ interlinked wikilinks, interactive 2D graph, and daily journal',
      icon: Brain,
      action: () => {
        playSwitchSound();
        onTabChange('secondbrain');
        onClose();
      },
    },
    {
      id: 'nav-database',
      category: t('cmd_category_system', 'System Core'),
      label: t('nav_database', 'Database Studio'),
      description: t('nav_database_desc', 'Inspect, query, and manage system SQLite databases & tables'),
      icon: Database,
      action: () => {
        playSwitchSound();
        onTabChange('database');
        onClose();
      },
    },
    {
      id: 'nav-storage',
      category: t('cmd_category_system', 'System Core'),
      label: t('nav_storage', 'Storage'),
      description: t('nav_storage_desc', 'View server drive storage and cloud capacity'),
      icon: HardDrive,
      action: () => {
        playSwitchSound();
        onTabChange('storage');
        onClose();
      },
    },
    {
      id: 'nav-terminal',
      category: t('cmd_category_system', 'System Core'),
      label: t('nav_terminal', 'Terminal'),
      description: t('nav_terminal_desc', 'Run system commands in web terminal'),
      icon: Terminal,
      action: () => {
        playSwitchSound();
        onTabChange('terminal');
        onClose();
      },
    },
    {
      id: 'nav-security',
      category: t('cmd_category_system', 'System Core'),
      label: 'Security & SysGuard Radar',
      description: 'Inspect Fail2ban jails, UFW firewall, and active threat defense',
      icon: ShieldAlert,
      action: () => {
        playSwitchSound();
        onTabChange('security');
        onClose();
      },
    },
    {
      id: 'nav-jobs',
      category: 'Apps & Portfolio',
      label: 'Job & Career Radar',
      description: 'Curated job opportunities from Sentinel and live scout search',
      icon: Briefcase,
      action: () => {
        playSwitchSound();
        onTabChange('jobs');
        onClose();
      },
    },
    {
      id: 'nav-kanban',
      category: 'Apps & Portfolio',
      label: 'Career Kanban Board',
      description: 'Track application pipeline, tech tests, interviews, and job offers',
      icon: Kanban,
      action: () => {
        playSwitchSound();
        onTabChange('kanban');
        onClose();
      },
    },
    {
      id: 'nav-profile',
      category: t('cmd_category_personal', 'Personal & Life'),
      label: t('nav_profile', 'Profile & CV'),
      description: t('nav_profile_desc', 'Professional engineering background, enterprise track record, and skills'),
      icon: UserCheck,
      action: () => {
        playSwitchSound();
        onTabChange('profile');
        onClose();
      },
    },
    {
      id: 'nav-fitness',
      category: t('cmd_category_personal', 'Personal & Life'),
      label: t('nav_fitness', 'Health & Fitness'),
      description: t('nav_fitness_desc', 'Daily steps, sleep tracker, and personal nutrition goals'),
      icon: HeartPulse,
      action: () => {
        playSwitchSound();
        onTabChange('fitness');
        onClose();
      },
    },
    {
      id: 'nav-diet',
      category: t('cmd_category_personal', 'Personal & Life'),
      label: 'OMAD Nutrition & Fasting',
      description: '23:1 fasting timer, 140g protein daily tracker, and meal logging',
      icon: Utensils,
      action: () => {
        playSwitchSound();
        onTabChange('diet');
        onClose();
      },
    },
    {
      id: 'nav-weather',
      category: t('cmd_category_personal', 'Personal & Life'),
      label: t('nav_weather', 'Weather & Radar'),
      description: t('nav_weather_desc', 'Live Surabaya weather, air quality, and earthquake monitor'),
      icon: CloudSun,
      action: () => {
        playSwitchSound();
        onTabChange('weather');
        onClose();
      },
    },
    {
      id: 'nav-warroom',
      category: t('cmd_category_ai', 'AI & Automation'),
      label: 'Agent War Room',
      description: 'Unified swarm telemetry, live timeline event flow, and prompt dispatch',
      icon: Flame,
      action: () => {
        playSwitchSound();
        onTabChange('warroom');
        onClose();
      },
    },
    {
      id: 'nav-kuro',
      category: t('cmd_category_ai', 'AI & Automation'),
      label: t('nav_kuro', 'Kuro Team Swarm'),
      description: t('nav_kuro_desc', '4-Node multi-agent swarm command center, token telemetry & sprint orchestrator'),
      icon: Swords,
      action: () => {
        playSwitchSound();
        onTabChange('kuro');
        onClose();
      },
    },
    {
      id: 'nav-shiro',
      category: t('cmd_category_ai', 'AI & Automation'),
      label: t('nav_shiro', 'Shiro Team Swarm'),
      description: t('nav_shiro_desc', 'Lightweight & repetitive swarm: DeepSeek curhat, Qwen micro-text & Hermes zero-token'),
      icon: Feather,
      action: () => {
        playSwitchSound();
        onTabChange('shiro');
        onClose();
      },
    },
    {
      id: 'nav-whatsapp',
      category: t('cmd_category_ai', 'AI & Automation'),
      label: t('nav_whatsapp', 'WhatsApp Secretary'),
      description: t('nav_whatsapp_desc', 'AI executive assistant, incoming messages, and anti-delete radar'),
      icon: Bot,
      action: () => {
        onTabChange('whatsapp');
        onClose();
      },
    },
    {
      id: 'act-language',
      category: t('cmd_category_settings', 'Settings & Actions'),
      label: language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English',
      description: t('switch_language_desc', 'Toggle interface language between English and Indonesian'),
      icon: Globe,
      keys: ['Shift', 'L'],
      action: () => {
        setLanguage(language === 'en' ? 'id' : 'en');
        onClose();
      },
    },
    {
      id: 'act-theme',
      category: t('cmd_category_settings', 'Settings & Actions'),
      label: isDark ? t('switch_to_light', 'Switch to Light Mode') : t('switch_to_dark', 'Switch to Dark Mode'),
      description: t('theme_desc', 'Toggle display theme between Dark Obsidian and Light Platinum'),
      icon: isDark ? Sun : Moon,
      keys: ['Shift', 'T'],
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'act-password',
      category: t('cmd_category_settings', 'Settings & Actions'),
      label: t('btn_change_password', 'Change Password'),
      description: t('pwd_desc', 'Update OMNI dashboard account access password'),
      icon: KeyRound,
      keys: ['Shift', 'P'],
      action: () => {
        onClose();
        if (onOpenChangePassword) onOpenChangePassword();
      },
    },
    {
      id: 'act-lock',
      category: t('cmd_category_settings', 'Settings & Actions'),
      label: t('btn_logout', 'Sign Out'),
      description: t('logout_desc', 'Clear active session token and return to login page'),
      icon: LogOut,
      keys: ['Shift', 'Q'],
      danger: true,
      action: () => {
        onClose();
        if (onOpenLogoutConfirm) onOpenLogoutConfirm();
      },
    },
  ];

  // Filter commands by query
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  });

  // Reset index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view smoothly on keyboard selection
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [selectedIndex]);

  // Focus input on open & lock scroll
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-start justify-center pt-12 sm:pt-28 px-3 sm:px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`max-w-lg w-full rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
              isDark
                ? 'bg-[#0e121c] border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)]'
                : 'bg-white border-slate-300 shadow-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Header */}
            <div
              className={`relative flex items-center px-4 py-3.5 border-b focus-within:border-indigo-500 transition-colors ${
                isDark
                  ? 'border-slate-800 bg-[#080b12]'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <Search
                className={`w-4 h-4 shrink-0 ml-1 transition-colors ${
                  isDark ? 'text-slate-400' : 'text-slate-600'
                }`}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_cmd_placeholder', 'Search menus, tools, or run commands...')}
                className={`w-full bg-transparent pl-3 pr-8 py-1 text-xs font-semibold focus:outline-none ${
                  isDark
                    ? 'text-slate-100 placeholder-slate-500'
                    : 'text-slate-950 placeholder-slate-400'
                }`}
              />
              <div
                className={`hidden sm:flex items-center text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  isDark
                    ? 'text-slate-400 bg-white/[0.05] border-slate-700/50'
                    : 'text-slate-600 bg-white border-slate-300 shadow-2xs'
                }`}
              >
                ESC
              </div>
            </div>

            {/* Command List */}
            <div
              ref={listRef}
              className="max-h-[320px] overflow-y-auto p-2 space-y-1"
            >
              {filteredCommands.length === 0 ? (
                <div
                  className={`py-8 text-center text-xs font-mono font-medium ${
                    isDark ? 'text-slate-500' : 'text-slate-600'
                  }`}
                >
                  <p>No commands found</p>
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <div
                      key={cmd.id}
                      ref={(el) => (itemRefs.current[idx] = el)}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`group px-3 py-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all duration-150 active:scale-[0.985] ${
                        isSelected
                          ? isDark
                            ? 'bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm'
                            : 'bg-indigo-50 text-indigo-950 border border-indigo-200 shadow-xs font-bold'
                          : isDark
                            ? 'text-slate-400 hover:bg-white/[0.04] border border-transparent'
                            : 'text-slate-700 hover:bg-slate-100 border border-transparent font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                            isSelected
                              ? isDark
                                ? 'bg-indigo-500 text-white shadow-xs scale-105'
                                : 'bg-indigo-600 text-white shadow-xs scale-105'
                              : isDark
                                ? 'bg-white/[0.04] text-slate-400 border border-slate-800'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span
                            className={`truncate block transition-colors ${
                              isSelected
                                ? isDark
                                  ? 'font-semibold text-white'
                                  : 'font-bold text-indigo-950'
                                : isDark
                                  ? 'font-medium text-slate-200'
                                  : 'font-semibold text-slate-900'
                            }`}
                          >
                            {cmd.label}
                          </span>
                          <p
                            className={`text-[10.5px] truncate font-medium ${
                              isDark ? 'text-slate-500' : 'text-slate-600'
                            }`}
                          >
                            {cmd.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        {cmd.keys && (
                          <div className="hidden sm:flex items-center gap-1">
                            {cmd.keys.map((k) => (
                              <kbd
                                key={k}
                                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border min-w-[18px] text-center ${
                                  isDark
                                    ? 'text-slate-400 bg-black/30 border-slate-800'
                                    : 'text-slate-700 bg-slate-100 border-slate-300 shadow-2xs'
                                }`}
                              >
                                {k}
                              </kbd>
                            ))}
                          </div>
                        )}
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-all duration-200 ${
                            isSelected
                              ? isDark
                                ? 'text-indigo-400 opacity-100 translate-x-0'
                                : 'text-indigo-600 opacity-100 translate-x-0'
                              : 'opacity-0 -translate-x-1'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div
              className={`px-3.5 py-2.5 border-t flex items-center justify-between text-[10.5px] font-mono ${
                isDark
                  ? 'bg-[#08090d] border-slate-800 text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-600 font-semibold'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span>
                  <kbd
                    className={`px-1 py-0.5 rounded ${
                      isDark
                        ? 'bg-white/[0.06] border border-slate-700/50'
                        : 'bg-white border border-slate-300 shadow-2xs'
                    }`}
                  >
                    ↑↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span>
                  <kbd
                    className={`px-1 py-0.5 rounded ${
                      isDark
                        ? 'bg-white/[0.06] border border-slate-700/50'
                        : 'bg-white border border-slate-300 shadow-2xs'
                    }`}
                  >
                    ↵
                  </kbd>{' '}
                  Select
                </span>
              </div>
              <span
                className={`text-[10px] uppercase font-mono ${
                  isDark ? 'text-slate-500' : 'text-slate-700'
                }`}
              >
                Homelab Gateway
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
