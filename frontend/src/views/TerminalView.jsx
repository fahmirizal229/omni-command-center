import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal as TerminalIcon,
  RefreshCw,
  Maximize2,
  Minimize2,
  Trash2,
  X,
  Sparkles,
  Zap,
  Shield,
  ShieldAlert,
  Server,
  Activity,
  User,
  Users,
  ChevronDown,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Copy,
  Check,
  Smartphone,
  Keyboard,
  Sliders,
  Cpu,
  HardDrive,
  Clock,
  Radio,
  Lock,
} from 'lucide-react';
import { api, getAuthToken } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_ACCOUNTS = [
  {
    username: 'arusuka',
    label: 'arusuka',
    uid: 1000,
    home: '/home/arusuka',
    role: 'Primary Operator',
    badge: 'primary',
    color: 'emerald',
    description: 'Default non-root interactive shell for primary operations & services.',
  },
  {
    username: 'root',
    label: 'root',
    uid: 0,
    home: '/root',
    role: 'Superuser Admin',
    badge: 'danger',
    color: 'rose',
    description: 'Full system administrator shell with root privileges.',
  },
  {
    username: 'arusuka2',
    label: 'arusuka2',
    uid: 1001,
    home: '/home/arusuka2',
    role: 'AGY Cluster #2',
    badge: 'info',
    color: 'indigo',
    description: 'Antigravity AI cluster worker #2 workspace.',
  },
  {
    username: 'arusuka3',
    label: 'arusuka3',
    uid: 1002,
    home: '/home/arusuka3',
    role: 'AGY Cluster #3',
    badge: 'info',
    color: 'cyan',
    description: 'Antigravity AI cluster worker #3 workspace.',
  },
  {
    username: 'arusuka4',
    label: 'arusuka4',
    uid: 1003,
    home: '/home/arusuka4',
    role: 'AGY Cluster #4',
    badge: 'info',
    color: 'amber',
    description: 'Antigravity AI cluster worker #4 workspace.',
  },
];

const QUICK_COMMANDS = [
  { label: 'htop', cmd: 'htop\n', icon: Cpu },
  { label: 'df -h', cmd: 'df -h\n', icon: HardDrive },
  { label: 'free -h', cmd: 'free -h\n', icon: Activity },
  { label: 'docker ps', cmd: 'docker ps 2>/dev/null || podman ps\n', icon: Server },
  { label: 'uptime', cmd: 'uptime\n', icon: Clock },
  { label: 'whoami', cmd: 'whoami && id\n', icon: User },
];

export function TerminalView({ isDark = true }) {
  const terminalContainerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const userMenuRef = useRef(null);

  const { showToast } = useToast();
  const { t, language } = useLanguage();

  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState(null);
  const [systemUsers, setSystemUsers] = useState(DEFAULT_ACCOUNTS);
  const [activeUser, setActiveUser] = useState('arusuka');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [copied, setCopied] = useState(false);
  const [showTouchKeypad, setShowTouchKeypad] = useState(true);

  // Fetch verified system users from backend
  useEffect(() => {
    let isMounted = true;
    api.getTerminalUsers?.()
      .then((res) => {
        if (isMounted && res?.users && res.users.length > 0) {
          setSystemUsers(res.users);
        }
      })
      .catch(() => {
        // Fallback to default accounts
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeUserMeta = useMemo(() => {
    return (
      systemUsers.find((u) => u.username === activeUser) || {
        username: activeUser,
        role: activeUser === 'root' ? 'Superuser Admin' : 'User Account',
        color: activeUser === 'root' ? 'rose' : 'emerald',
      }
    );
  }, [systemUsers, activeUser]);

  // Dynamic Theme definition for xterm.js (Dark Obsidian vs Clean Light)
  const xtermTheme = useMemo(() => {
    if (isDark) {
      return {
        background: '#06080e',
        foreground: '#f8fafc',
        cursor: '#6366f1',
        cursorAccent: '#06080e',
        selectionBackground: 'rgba(99, 102, 241, 0.35)',
        black: '#0f172a',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      };
    } else {
      // Clean Light Terminal Theme (JetBrains Light / VSCode Light style)
      return {
        background: '#ffffff',
        foreground: '#0f172a',
        cursor: '#4f46e5',
        cursorAccent: '#ffffff',
        selectionBackground: 'rgba(99, 102, 241, 0.22)',
        black: '#0f172a',
        red: '#dc2626',
        green: '#16a34a',
        yellow: '#b45309',
        blue: '#2563eb',
        magenta: '#9333ea',
        cyan: '#0891b2',
        white: '#64748b',
        brightBlack: '#475569',
        brightRed: '#ef4444',
        brightGreen: '#22c55e',
        brightYellow: '#d97706',
        brightBlue: '#3b82f6',
        brightMagenta: '#a855f7',
        brightCyan: '#06b6d4',
        brightWhite: '#0f172a',
      };
    }
  }, [isDark]);

  // Terminal Initialization
  const initTerminal = useCallback(() => {
    if (!terminalContainerRef.current) return;

    if (termRef.current) {
      termRef.current.dispose();
      termRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnecting(true);
    setError(null);

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
      theme: xtermTheme,
      lineHeight: 1.25,
      scrollback: 10000,
      convertEol: true,
      allowTransparency: false,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    
    // Initial fit with small timeout to allow container render
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // ignore initial layout tick
      }
    }, 50);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const token = getAuthToken();
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/terminal/pty?user=${encodeURIComponent(activeUser)}&token=${encodeURIComponent(token || '')}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      term.focus();

      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims && dims.cols && dims.rows) {
          ws.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
        }
      } catch (e) {
        // ignore
      }
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output' && msg.data) {
            term.write(msg.data);
            return;
          }
        } catch (e) {
          // not json, write as raw
        }
        term.write(event.data);
      } else if (event.data instanceof Blob) {
        event.data.text().then((text) => term.write(text));
      } else {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setError('Connection failed. Retrying...');
      setConnecting(false);
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Resize handling using ResizeObserver
    if (terminalContainerRef.current && window.ResizeObserver) {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      resizeObserverRef.current = new ResizeObserver(() => {
        if (fitAddonRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            fitAddonRef.current.fit();
            const dims = fitAddonRef.current.proposeDimensions();
            if (dims && dims.cols && dims.rows) {
              wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }));
            }
          } catch (e) {
            // ignore
          }
        }
      });
      resizeObserverRef.current.observe(terminalContainerRef.current);
    }
  }, [fontSize, activeUser, isDark, xtermTheme]);

  useEffect(() => {
    initTerminal();
    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (termRef.current) termRef.current.dispose();
      if (wsRef.current) wsRef.current.close();
    };
  }, [initTerminal]);

  // Handle switching user account
  const handleSwitchUser = (user) => {
    if (user.username === activeUser) {
      setIsUserMenuOpen(false);
      return;
    }
    setActiveUser(user.username);
    setIsUserMenuOpen(false);
    showToast(`Switched terminal session to user "${user.username}".`, 'info');
  };

  // Quick Command Execution
  const handleQuickCmd = (cmd) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd);
      if (termRef.current) termRef.current.focus();
    }
  };

  // Virtual Key Press Handler for Mobile Touch Keypad
  const sendKey = (keySeq) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(keySeq);
      if (termRef.current) termRef.current.focus();
    }
  };

  const handleClear = () => {
    if (termRef.current) {
      termRef.current.clear();
      termRef.current.focus();
    }
  };

  const handleCopySelection = () => {
    if (termRef.current && termRef.current.hasSelection()) {
      const selected = termRef.current.getSelection();
      navigator.clipboard.writeText(selected).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        showToast('Selected terminal text copied to clipboard.', 'success');
      });
    } else {
      showToast('Highlight text in terminal first to copy.', 'info');
    }
  };

  const handleAdjustFontSize = (delta) => {
    setFontSize((prev) => {
      const next = Math.max(10, Math.min(22, prev + delta));
      return next;
    });
  };

  return (
    <div
      className={`w-full max-w-[1600px] mx-auto flex flex-col space-y-3 font-sans select-none transition-all ${
        isFullscreen
          ? `fixed inset-0 z-[99999] p-2 sm:p-4 ${isDark ? 'bg-[#08090d]' : 'bg-[#f8fafc]'}`
          : 'h-[calc(100vh-140px)] min-h-[580px]'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP RESPONSIVE CONSOLE TOOLBAR                         */}
      {/* ========================================================= */}
      <div
        className={`px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs transition-colors ${
          isDark
            ? 'bg-[#0e121d] border-slate-800/90 text-slate-100'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
        }`}
      >
        {/* Left: Terminal Node Info & Status Pill */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-bold font-mono tracking-tight truncate">
                {t("terminal_banner_title") || "PTY Console"}
              </h2>
              <span
                className={`hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                  isDark ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                {language === 'id' ? 'Node Surabaya' : 'Surabaya Node'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[10px] sm:text-[11px] font-mono mt-0.5">
              <div className="relative flex items-center justify-center shrink-0 w-2.5 h-2.5">
                {connected && (
                  <span className="animate-beacon absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 pointer-events-none" />
                )}
                <span
                  className={`relative inline-flex rounded-full w-2 h-2 transition-colors ${
                    connected
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                      : connecting
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
              </div>
              <span
                className={
                  connected
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : connecting
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }
              >
                {connected ? (t("terminal_status_connected") || 'Interactive Session') : connecting ? (t("terminal_status_connecting") || 'Spawning PTY...') : (t("terminal_status_disconnected") || 'Disconnected')}
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right Controls: User Switcher, Quick Commands, & Actions */}
        <div className="flex items-center flex-wrap gap-2 font-mono text-xs ml-auto">
          {/* USER ACCOUNT SWITCHER DROPDOWN */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium ${
                activeUser === 'root'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                  : isDark
                  ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-indigo-300'
                  : 'bg-indigo-50/80 border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold'
              }`}
              title={t("terminal_switch_user") || "Switch user account session"}
            >
              {activeUser === 'root' ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              ) : (
                <User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              )}
              <span className="font-bold">{activeUser}</span>
              <span className="hidden sm:inline text-[10px] opacity-75">
                ({activeUser === 'root' ? 'UID 0' : activeUserMeta?.role?.split(' ')[0] || 'User'})
              </span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Dropdown / Mobile Adaptive Action Sheet Modal */}
            {isUserMenuOpen && createPortal(
              <div
                className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn select-none"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <div
                  className={`w-full sm:max-w-md border-t sm:border rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 animate-scaleUp relative ${
                    isDark
                      ? 'bg-[#0e121d] border-slate-800 text-slate-100'
                      : 'bg-white border-slate-200 text-slate-900'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Subtle Top Indicator for Mobile Sheet */}
                  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4 sm:hidden" />

                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{t("terminal_switch_user") || "Select Shell Account"}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">{language === 'id' ? 'Buka sesi login PTY khusus' : 'Spawns dedicated login PTY session'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* User Accounts List */}
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-0.5">
                    {systemUsers.map((user) => {
                      const isSelected = user.username === activeUser;
                      const isRoot = user.username === 'root';
                      return (
                        <button
                          key={user.username}
                          type="button"
                          onClick={() => handleSwitchUser(user)}
                          className={`w-full text-left p-3 rounded-2xl transition-all flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? isRoot
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 shadow-xs'
                                : 'bg-indigo-600/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                              : isDark
                              ? 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0 pr-2">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                isRoot
                                  ? 'bg-rose-500/10 border-rose-500/25 text-rose-500 dark:text-rose-400'
                                  : isSelected
                                  ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                                  : isDark
                                  ? 'bg-slate-800/60 border-slate-700/60 text-slate-400'
                                  : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
                              }`}
                            >
                              {isRoot ? <ShieldAlert className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-sm truncate">{user.username}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                                  isRoot
                                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-600 dark:text-rose-400'
                                    : isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                                    : 'bg-slate-200 border-slate-300 text-slate-700'
                                }`}>
                                  UID {user.uid}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {user.description || user.role}
                              </p>
                            </div>
                          </div>
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">{language === 'id' ? 'Pilih' : 'Select'}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* QUICK COMMAND PILLS (Hidden on very narrow mobile) */}
          <div className="hidden lg:flex items-center space-x-1.5">
            {QUICK_COMMANDS.slice(0, 3).map((qc) => {
              const IconComp = qc.icon;
              return (
                <button
                  key={qc.label}
                  type="button"
                  onClick={() => handleQuickCmd(qc.cmd)}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-all flex items-center space-x-1 cursor-pointer ${
                    isDark
                      ? 'bg-slate-800/60 border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white'
                      : 'bg-slate-100/90 border-slate-200 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950 font-medium'
                  }`}
                  title={`Run "${qc.label}"`}
                >
                  <IconComp className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                  <span>{qc.label}</span>
                </button>
              );
            })}
          </div>

          {/* FONT SIZE ADJUSTER */}
          <div
            className={`hidden sm:flex items-center rounded-xl border p-0.5 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => handleAdjustFontSize(-1)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={language === 'id' ? 'Perkecil Ukuran Font' : 'Decrease Font Size'}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{fontSize}px</span>
            <button
              type="button"
              onClick={() => handleAdjustFontSize(1)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title={language === 'id' ? 'Perbesar Ukuran Font' : 'Increase Font Size'}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TOUCH KEYPAD TOGGLE (MOBILE / TOUCH HELPER) */}
          <button
            type="button"
            onClick={() => setShowTouchKeypad((prev) => !prev)}
            title={t("terminal_touch_keypad") || "Toggle Mobile Keypad Helper"}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showTouchKeypad
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 font-bold'
                : isDark
                ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-black'
            }`}
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* COPY SELECTION */}
          <button
            type="button"
            onClick={handleCopySelection}
            title={language === 'id' ? 'Salin teks tersorot' : 'Copy highlighted text'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : isDark
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-950'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* CLEAR BUFFER */}
          <button
            type="button"
            onClick={handleClear}
            title={t("terminal_btn_clear") || "Clear Console Screen"}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-950'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* FULLSCREEN TOGGLE */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title={isFullscreen ? (t("terminal_btn_exit_fs") || 'Exit Fullscreen') : (t("terminal_btn_fullscreen") || 'Fullscreen (F11)')}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : isDark
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-950'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* RECONNECT / RELOAD */}
          <button
            type="button"
            onClick={initTerminal}
            title={t("terminal_btn_reconnect") || "Reconnect Terminal Session"}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600 hover:text-slate-950'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${connecting ? 'animate-spin text-indigo-500 dark:text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TERMINAL VIEWPORT CANVAS                               */}
      {/* ========================================================= */}
      <div
        className={`flex-1 rounded-2xl sm:rounded-3xl border overflow-hidden p-2.5 sm:p-4 relative flex flex-col min-h-0 transition-colors ${
          isDark
            ? 'bg-[#06080e] border-slate-800/90 shadow-2xl'
            : 'bg-white border-slate-300/80 shadow-sm ring-1 ring-slate-900/5'
        }`}
        onClick={() => {
          if (termRef.current) termRef.current.focus();
        }}
      >
        <div ref={terminalContainerRef} className="w-full h-full flex-1" />
      </div>

      {/* ========================================================= */}
      {/* 3. MOBILE TOUCH KEYPAD / VIRTUAL SHORTCUT DOCK            */}
      {/* ========================================================= */}
      {showTouchKeypad && (
        <div
          className={`p-2 rounded-2xl border flex flex-col gap-2 shrink-0 transition-all ${
            isDark
              ? 'bg-[#0e121d] border-slate-800/90 text-slate-100 shadow-xl'
              : 'bg-white border-slate-200/90 text-slate-900 shadow-xs ring-1 ring-slate-900/5'
          }`}
        >
          {/* Row 1: Modifier & Essential Control Keys */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none font-mono text-xs">
            {/* ESC Key */}
            <button
              type="button"
              onClick={() => sendKey('\x1b')}
              className={`px-2.5 py-1.5 rounded-xl font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
              }`}
            >
              ESC
            </button>

            {/* TAB Key */}
            <button
              type="button"
              onClick={() => sendKey('\t')}
              className={`px-3 py-1.5 rounded-xl font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
              }`}
            >
              TAB ⇥
            </button>

            {/* CTRL + C */}
            <button
              type="button"
              onClick={() => sendKey('\x03')}
              className={`px-2.5 py-1.5 rounded-xl font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-2xs'
              }`}
              title="SIGINT (Ctrl+C)"
            >
              ^C
            </button>

            {/* CTRL + D */}
            <button
              type="button"
              onClick={() => sendKey('\x04')}
              className={`px-2.5 py-1.5 rounded-xl font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
                  : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 shadow-2xs'
              }`}
              title="EOF (Ctrl+D)"
            >
              ^D
            </button>

            {/* CTRL + Z */}
            <button
              type="button"
              onClick={() => sendKey('\x1a')}
              className={`px-2.5 py-1.5 rounded-xl font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 border ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
              }`}
              title="SIGTSTP (Ctrl+Z)"
            >
              ^Z
            </button>

            {/* Arrow Keys Navigation */}
            <div className={`flex items-center gap-1 shrink-0 px-1.5 border-x ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <button
                type="button"
                onClick={() => sendKey('\x1b[A')}
                className={`p-1.5 rounded-lg active:scale-90 transition-transform duration-75 cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
                }`}
                title="Arrow Up (History Prev)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => sendKey('\x1b[B')}
                className={`p-1.5 rounded-lg active:scale-90 transition-transform duration-75 cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
                }`}
                title="Arrow Down (History Next)"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => sendKey('\x1b[D')}
                className={`p-1.5 rounded-lg active:scale-90 transition-transform duration-75 cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
                }`}
                title="Arrow Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => sendKey('\x1b[C')}
                className={`p-1.5 rounded-lg active:scale-90 transition-transform duration-75 cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800 shadow-2xs'
                }`}
                title="Arrow Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Common Shell Symbols */}
            {['|', '~', '/', '-', '_', '$', '&'].map((sym) => (
              <button
                key={sym}
                type="button"
                onClick={() => sendKey(sym)}
                className={`w-8 h-8 rounded-xl font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 flex items-center justify-center border ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-700 border-slate-700/80 text-indigo-300'
                    : 'bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200/90 text-indigo-700 shadow-2xs'
                }`}
              >
                {sym}
              </button>
            ))}

            {/* Enter Key */}
            <button
              type="button"
              onClick={() => sendKey('\r')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold active:scale-90 transition-transform duration-75 cursor-pointer shrink-0 flex items-center space-x-1 shadow-xs"
            >
              <span>ENTER</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>

          {/* Row 2: One-tap Quick Presets */}
          <div className={`flex items-center gap-1.5 overflow-x-auto scrollbar-none font-mono text-[11px] pt-1 border-t ${
            isDark ? 'border-slate-800/40' : 'border-slate-200/80'
          }`}>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
              Presets:
            </span>
            {QUICK_COMMANDS.map((qc) => (
              <button
                key={qc.label}
                type="button"
                onClick={() => handleQuickCmd(qc.cmd)}
                className={`px-2.5 py-1 rounded-lg border transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 font-medium ${
                  isDark
                    ? 'bg-slate-800/40 hover:bg-slate-700/80 border-slate-800 text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-950 shadow-2xs'
                }`}
              >
                {qc.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleQuickCmd('clear\n')}
              className={`px-2.5 py-1 rounded-lg border transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 font-medium ${
                isDark
                  ? 'bg-slate-800/40 hover:bg-slate-700/80 border-slate-800 text-slate-300 hover:text-white'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-950 shadow-2xs'
              }`}
            >
              clear
            </button>
            <button
              type="button"
              onClick={() => handleQuickCmd('exit\n')}
              className={`px-2.5 py-1 rounded-lg border transition-transform duration-75 active:scale-90 cursor-pointer shrink-0 font-medium ${
                isDark
                  ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-2xs'
              }`}
            >
              exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
