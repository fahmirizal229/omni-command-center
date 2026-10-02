import React, { useState, useEffect, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';
import { useWebSocket } from './context/WebSocketContext';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { SpotlightDotMatrixBackground } from './components/SpotlightDotMatrixBackground';
import { CommandPalette } from './components/CommandPalette';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import { LoginView } from './views/LoginView';
import {
  Loader2,
  Menu,
  Sun,
  Moon,
  Command,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playSwitchSound, playClickSound } from './utils/soundEffects';
import { motion, AnimatePresence } from 'motion/react';

// Core Modules
const OverviewView = lazy(() => import('./views/OverviewView').then((m) => ({ default: m.OverviewView })));
const FitnessView = lazy(() => import('./views/FitnessView').then((m) => ({ default: m.FitnessView })));
const WeatherView = lazy(() => import('./views/WeatherView').then((m) => ({ default: m.WeatherView })));
const StorageView = lazy(() => import('./views/StorageView').then((m) => ({ default: m.StorageView })));
const TerminalView = lazy(() => import('./views/TerminalView').then((m) => ({ default: m.TerminalView })));
const WhatsAppView = lazy(() => import('./views/WhatsAppView').then((m) => ({ default: m.WhatsAppView })));
const ProfileView = lazy(() => import('./views/ProfileView').then((m) => ({ default: m.ProfileView })));
const KuroTeamView = lazy(() => import('./views/KuroTeamView').then((m) => ({ default: m.KuroTeamView })));
const DatabaseView = lazy(() => import('./views/DatabaseView').then((m) => ({ default: m.DatabaseView })));
const ShiroTeamView = lazy(() => import('./views/ShiroTeamView').then((m) => ({ default: m.ShiroTeamView })));
const WarRoomView = lazy(() => import('./views/WarRoomView').then((m) => ({ default: m.WarRoomView })));
const DietView = lazy(() => import('./views/DietView').then((m) => ({ default: m.DietView })));
const SecurityView = lazy(() => import('./views/SecurityView').then((m) => ({ default: m.SecurityView })));
const PlaygroundView = lazy(() => import('./views/PlaygroundView').then((m) => ({ default: m.PlaygroundView })));
const SecondBrainView = lazy(() => import('./views/SecondBrainView').then((m) => ({ default: m.SecondBrainView })));
const SentinelView = lazy(() => import('./views/SentinelView').then((m) => ({ default: m.SentinelView })));
const JobsView = lazy(() => import('./views/JobsView').then((m) => ({ default: m.JobsView })));
const CareerKanbanView = lazy(() => import('./views/CareerKanbanView').then((m) => ({ default: m.CareerKanbanView })));
const TechRadarView = lazy(() => import('./views/TechRadarView').then((m) => ({ default: m.TechRadarView })));

function TabLoader({ isDark = true }) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center p-8 animate-fadeIn select-none">
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] bg-transparent overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-amber-400 to-indigo-500 animate-top-bar shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
      </div>
      <div className={`p-4 sm:p-5 rounded-2xl border flex items-center space-x-3 text-xs font-mono backdrop-blur-md shadow-lg ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'
      }`}>
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span className="font-medium">Connecting module...</span>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, loading: authLoading, logout, user } = useAuth();
  const { showToast } = useToast();
  const { addListener, wsStatus } = useWebSocket();

  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname.replace(/^\//, '').toLowerCase();
    if (path && ['overview', 'sentinel', 'jobs', 'kanban', 'fitness', 'weather', 'storage', 'terminal', 'kuro', 'shiro', 'whatsapp', 'database', 'profile', 'warroom', 'diet', 'security', 'playground', 'secondbrain', 'obsidian', 'techradar'].includes(path)) {
      return path;
    }
    return window.location.hash.replace('#', '') || 'overview';
  });

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('omni_theme') || localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [overviewData, setOverviewData] = useState(() => {
    try {
      const cached = localStorage.getItem('omni_overview_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const toggleTheme = (event) => {
    const updateThemeState = () => {
      flushSync(() => {
        setIsDark((prev) => {
          const next = !prev;
          localStorage.setItem('theme', next ? 'dark' : 'light');
          localStorage.setItem('omni_theme', next ? 'dark' : 'light');
          if (next) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return next;
        });
      });
    };

    // 1. Fallback if View Transitions API is not supported
    if (!document.startViewTransition) {
      document.documentElement.classList.add('theme-transitioning');
      updateThemeState();
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 450);
      return;
    }

    // 2. Hardware-accelerated Circular Reveal Wave with DOM Transition Lock
    document.documentElement.classList.add('theme-wave-active');

    if (event && event.clientX && event.clientY) {
      const x = event.clientX;
      const y = event.clientY;
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        updateThemeState();
      });

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ];
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }).catch(() => {});

      transition.finished.finally(() => {
        document.documentElement.classList.remove('theme-wave-active');
      });
    } else {
      const transition = document.startViewTransition(() => {
        updateThemeState();
      });
      transition.finished.finally(() => {
        document.documentElement.classList.remove('theme-wave-active');
      });
    }
  };

  useEffect(() => {
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (isDark) {
      document.documentElement.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#08090d');
    } else {
      document.documentElement.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#f8fafc');
    }
  }, [isDark]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.getOverview().then((res) => {
        if (res) {
          setOverviewData(res);
          try {
            localStorage.setItem('omni_overview_cache', JSON.stringify(res));
          } catch {}
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubTelemetry = addListener('telemetry', (msg) => {
      if (msg.system) {
        setOverviewData((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            system: {
              ...prev.system,
              ...msg.system,
            },
          };
          try {
            localStorage.setItem('omni_overview_cache', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    });

    const unsubOverview = addListener('overview_data', (msg) => {
      if (msg.data) {
        setOverviewData(msg.data);
        try {
          localStorage.setItem('omni_overview_cache', JSON.stringify(msg.data));
        } catch {}
      }
    });

    return () => {
      unsubTelemetry();
      unsubOverview();
    };
  }, [isAuthenticated, addListener]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080e] text-slate-400 font-mono text-xs">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 antialiased font-sans select-none relative overflow-x-hidden ${
        isDark ? 'bg-[#08090d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* 0. Ambient Background Spotlight Dot-Matrix & Dynamic View-Aware Aura */}
      <SpotlightDotMatrixBackground isDark={isDark} activeTab={activeTab} />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dynamic Primary Aura shifting based on active tab & theme */}
        <div
          className={`absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] blur-[150px] transition-all duration-700 ease-in-out pointer-events-none ${
            activeTab === 'terminal' || activeTab === 'fitness'
              ? isDark
                ? 'bg-gradient-to-b from-emerald-500/15 via-teal-500/10 to-transparent'
                : 'bg-gradient-to-b from-emerald-500/8 via-slate-200/30 to-transparent'
              : activeTab === 'weather'
              ? isDark
                ? 'bg-gradient-to-b from-sky-500/15 via-cyan-500/10 to-transparent'
                : 'bg-gradient-to-b from-sky-500/8 via-slate-200/30 to-transparent'
              : activeTab === 'storage'
              ? isDark
                ? 'bg-gradient-to-b from-sky-500/15 via-indigo-500/10 to-transparent'
                : 'bg-gradient-to-b from-sky-500/8 via-slate-200/30 to-transparent'
              : isDark
              ? 'bg-gradient-to-b from-indigo-500/15 via-violet-500/10 to-transparent'
              : 'bg-gradient-to-b from-indigo-500/8 via-slate-200/30 to-transparent'
          }`}
        />
        <div
          className={`absolute -bottom-32 right-10 w-[500px] h-[350px] blur-[160px] transition-all duration-700 ease-in-out pointer-events-none ${
            activeTab === 'terminal' || activeTab === 'fitness'
              ? isDark ? 'bg-emerald-500/[0.04]' : 'bg-emerald-500/[0.02]'
              : activeTab === 'weather'
              ? isDark ? 'bg-sky-500/[0.04]' : 'bg-sky-500/[0.02]'
              : activeTab === 'storage'
              ? isDark ? 'bg-sky-500/[0.04]' : 'bg-sky-500/[0.02]'
              : isDark ? 'bg-amber-500/[0.03]' : 'bg-amber-500/[0.015]'
          }`}
        />
        <div
          className={`absolute inset-0 [background-size:24px_24px] transition-all duration-500 ${
            isDark
              ? 'bg-[radial-gradient(#334155_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)] opacity-100'
              : 'bg-[radial-gradient(#64748b_1.2px,transparent_1.2px)] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_90%)] opacity-35'
          }`}
        />
      </div>

      {/* 1. Desktop Sidebar & Mobile Slide-over Drawer */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onOpenChangePassword={() => setIsPasswordModalOpen(true)}
        onOpenLogoutConfirm={() => setIsLogoutModalOpen(true)}
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        isMobileOpen={isMobileDrawerOpen}
        setIsMobileOpen={setIsMobileDrawerOpen}
      />

      {/* 2. Main Content Canvas */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative w-full min-w-0 pb-6 sm:pb-8 print:p-0 print:m-0 print:pb-0 print:pl-0 ${
          isSidebarExpanded ? 'lg:pl-60' : 'lg:pl-[68px]'
        }`}
      >
        {/* Top Minimal Responsive Header */}
        <header
          className={`h-14 px-4 sm:px-6 border-b sticky top-0 z-30 flex items-center justify-between backdrop-blur-xl transition-colors duration-200 print:hidden ${
            isDark
              ? 'bg-[#08090d]/85 border-slate-800/80 shadow-xs'
              : 'bg-white/85 border-slate-200/90 shadow-xs'
          }`}
        >
          {/* Left: Mobile Drawer Trigger + View Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`lg:hidden p-2 rounded-xl border flex items-center justify-center transition-colors ${
                isDark
                  ? 'bg-[#0f1422] border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
              }`}
              title="Open Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex items-center">
              <h1
                className={`text-xs sm:text-sm font-bold font-mono uppercase tracking-wider truncate flex items-center leading-normal ${
                  isDark ? 'text-slate-100' : 'text-slate-800'
                }`}
              >
                {activeTab === 'sentinel'
                  ? 'Arusuka Sentinel & Advisory'
                  : activeTab === 'fitness'
                  ? 'Biometrics & Fitness'
                  : activeTab === 'weather'
                  ? 'Climate & Radar'
                  : activeTab === 'storage'
                  ? 'Storage Vault'
                  : activeTab === 'terminal'
                  ? 'Web Terminal'
                  : activeTab === 'kuro'
                  ? 'Kuro Team Swarm'
                  : activeTab === 'shiro'
                  ? 'Shiro Team Swarm'
                  : activeTab === 'whatsapp'
                  ? 'WhatsApp Secretary'
                  : activeTab === 'database'
                  ? 'Database Studio'
                  : activeTab === 'warroom'
                  ? 'Agent War Room'
                  : activeTab === 'diet'
                  ? 'OMAD Nutrition & Fasting'
                  : activeTab === 'security'
                  ? 'SysGuard Security Radar'
                  : activeTab === 'techradar'
                  ? 'Engineering Tech Radar & Curated Reads'
                  : activeTab === 'secondbrain' || activeTab === 'obsidian'
                  ? 'Second Brain & Obsidian Vault'
                  : activeTab === 'profile'
                  ? 'Profile & CV'
                  : 'Server Overview'}
              </h1>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Quick Command Palette Button (Cmd+K) */}
            <button
              type="button"
              onClick={() => setIsCommandPaletteOpen(true)}
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#0e121c] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              title="Open Command Palette (Cmd+K / Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Search...</span>
              <kbd className={`text-[10px] px-1.5 py-0.2 rounded border font-mono ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}>
                {typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent || '') ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>

            {/* Arusuka Status Indicator */}
            <div
              className={`badge-capsule gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all ${
                isDark
                  ? 'border border-indigo-500/30 bg-indigo-950/40 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                  : 'border border-indigo-200 bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs'
              }`}
            >
              <span
                className={`badge-dot w-1.5 h-1.5 rounded-full animate-pulse ${
                  isDark
                    ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                    : 'bg-indigo-600'
                }`}
              />
              <span className="badge-text text-[11px] font-semibold">Arusuka</span>
            </div>

            {/* Theme Toggle Button with Micro-Interaction */}
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              className={`p-1.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer group relative overflow-hidden ${
                isDark
                  ? 'bg-[#0e121c] border-slate-800 text-amber-400 hover:text-amber-300 hover:border-slate-700'
                  : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200 hover:border-slate-300'
              }`}
              title="Toggle Theme"
            >
              <div className={`transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] flex items-center justify-center ${isDark ? 'rotate-0 scale-100' : 'rotate-180 scale-100'}`}>
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </div>
            </button>
          </div>
        </header>

        {/* Live WebSocket Status Banner */}
        <AnimatePresence>
          {wsStatus && wsStatus !== 'connected' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-mono backdrop-blur-md shadow-lg bg-amber-950/90 border-amber-500/50 text-amber-200"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>{wsStatus === 'connecting' ? 'Reconnecting live telemetry...' : 'Live telemetry offline'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Body Canvas with Fluid Responsive Padding */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto flex flex-col relative print:p-0 print:m-0 print:max-w-full">
          <Suspense fallback={<TabLoader isDark={isDark} />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex-1 flex flex-col"
              >
                {activeTab === 'overview' && (
                  <OverviewView
                    overview={overviewData}
                    isDark={isDark}
                    onNavigate={handleTabChange}
                  />
                )}
                {activeTab === 'sentinel' && (
                  <SentinelView isDark={isDark} />
                )}
                {activeTab === 'jobs' && (
                  <JobsView isDark={isDark} onNavigate={handleTabChange} />
                )}
                {activeTab === 'kanban' && (
                  <CareerKanbanView isDark={isDark} onNavigate={handleTabChange} />
                )}
                {activeTab === 'fitness' && (
                  <FitnessView isDark={isDark} />
                )}
                {activeTab === 'weather' && (
                  <WeatherView isDark={isDark} />
                )}
                {activeTab === 'storage' && (
                  <StorageView isDark={isDark} />
                )}
                {activeTab === 'terminal' && (
                  <TerminalView isDark={isDark} />
                )}
                {activeTab === 'kuro' && (
                  <KuroTeamView isDark={isDark} />
                )}
                {activeTab === 'shiro' && (
                  <ShiroTeamView isDark={isDark} />
                )}
                {activeTab === 'whatsapp' && (
                  <WhatsAppView isDark={isDark} />
                )}
                {activeTab === 'database' && (
                  <DatabaseView isDark={isDark} />
                )}
                {activeTab === 'warroom' && (
                  <WarRoomView isDark={isDark} />
                )}
                {activeTab === 'diet' && (
                  <DietView isDark={isDark} />
                )}
                {activeTab === 'security' && (
                  <SecurityView isDark={isDark} />
                )}
                {activeTab === 'profile' && (
                  <ProfileView isDark={isDark} />
                )}
                {activeTab === 'playground' && (
                  <PlaygroundView isDark={isDark} />
                )}
                {(activeTab === 'secondbrain' || activeTab === 'obsidian') && (
                  <SecondBrainView isDark={isDark} />
                )}
                {activeTab === 'techradar' && (
                  <TechRadarView isDark={isDark} />
                )}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>

      {/* 3. Global Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleTheme={toggleTheme}
        isDark={isDark}
        onOpenChangePassword={() => setIsPasswordModalOpen(true)}
        onOpenLogoutConfirm={() => setIsLogoutModalOpen(true)}
      />

      {/* 5. Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* 6. Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}
