import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Eye, EyeOff, Loader2, Sun, Moon, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BrandLogo } from '../components/BrandLogo';

export function LoginView() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('omni_theme') || localStorage.getItem('theme') || 'dark';
  });

  const passwordInputRef = useRef(null);
  const { login } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const root = document.documentElement;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (theme === 'dark') {
      root.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#08090d');
    } else {
      root.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#f8fafc');
    }
    localStorage.setItem('omni_theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  const toggleTheme = (event) => {
    const updateThemeState = () => {
      flushSync(() => {
        setTheme((prev) => {
          const next = prev === 'dark' ? 'light' : 'dark';
          const root = document.documentElement;
          const metaTheme = document.querySelector('meta[name="theme-color"]');
          if (next === 'dark') {
            root.classList.add('dark');
            if (metaTheme) metaTheme.setAttribute('content', '#08090d');
          } else {
            root.classList.remove('dark');
            if (metaTheme) metaTheme.setAttribute('content', '#f8fafc');
          }
          localStorage.setItem('omni_theme', next);
          localStorage.setItem('theme', next);
          return next;
        });
      });
    };

    if (!document.startViewTransition) {
      document.documentElement.classList.add('theme-transitioning');
      updateThemeState();
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 450);
      return;
    }

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

  const triggerShake = () => {
    setShake(false);
    requestAnimationFrame(() => {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    });
  };

  const handleLoginSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setError('');

    if (!password) {
      const msg = 'Please enter your password.';
      setError(msg);
      triggerShake();
      if (passwordInputRef.current) passwordInputRef.current.focus();
      return;
    }

    setLoading(true);
    try {
      await login('arusuka', password);
    } catch (err) {
      let displayMsg = 'Wrong password — try again.';
      if (
        err.message &&
        (err.message.toLowerCase().includes('locked') ||
          err.message.toLowerCase().includes('terkunci') ||
          err.message.includes('429'))
      ) {
        displayMsg = 'Locked for 5 minutes — too many tries.';
      }
      setError(displayMsg);
      triggerShake();
      setPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen w-full flex flex-col lg:flex-row transition-colors duration-500 font-sans select-none relative overflow-x-hidden ${
        isDark ? 'bg-[#08090d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* MOBILE BACKGROUND ARTWORK (< lg screens)                  */}
      {/* ========================================================= */}
      <div className="lg:hidden absolute inset-0 pointer-events-none overflow-hidden z-0">
        <img
          src="/smart_home_network.png"
          alt="Smart Home Network Architecture"
          className={`w-full h-96 object-cover object-top transition-all duration-700 ${
            isDark
              ? 'opacity-35 brightness-[0.70] contrast-125 saturate-100'
              : 'opacity-20 brightness-105 contrast-110 saturate-100'
          }`}
        />
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            isDark
              ? 'bg-gradient-to-b from-[#08090d]/60 via-[#08090d]/90 to-[#08090d]'
              : 'bg-gradient-to-b from-[#f8fafc]/50 via-[#f8fafc]/90 to-[#f8fafc]'
          }`}
        />
      </div>

      {/* ========================================================= */}
      {/* LEFT PANE (Desktop >= lg): Spatial Network Architecture   */}
      {/* ========================================================= */}
      <section className="hidden lg:flex lg:w-7/12 xl:w-2/3 flex-col justify-between p-12 xl:p-16 relative border-r border-slate-300 dark:border-slate-800/60 overflow-hidden bg-slate-100 dark:bg-[#08090d] animate-viewEnter">
        {/* Smart Home Network Diagram Background on Left Pane */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/smart_home_network.png"
            alt="Smart Home Network Architecture"
            className={`w-full h-full object-cover object-center transition-all duration-700 ${
              isDark
                ? 'opacity-70 brightness-[0.80] contrast-125 saturate-100 scale-100'
                : 'opacity-80 brightness-95 contrast-125 saturate-100 scale-100'
            }`}
          />
          {/* Balanced Overlay for Optimal Diagram Visibility + Crisp Text Contrast */}
          <div
            className={`absolute inset-0 transition-colors duration-700 ${
              isDark
                ? 'bg-gradient-to-r from-[#08090d]/80 via-[#08090d]/55 to-[#08090d]/85'
                : 'bg-gradient-to-r from-slate-100/70 via-slate-100/40 to-slate-100/80 backdrop-blur-[0.5px]'
            }`}
          />
        </div>

        {/* Top Left: Clean Brand Wordmark */}
        <div className="relative z-10 flex items-center space-x-3 animate-stagger-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isDark
                ? 'bg-white/[0.05] border border-white/[0.1] text-white shadow-sm'
                : 'bg-white/90 border border-slate-300 text-slate-900 shadow-sm backdrop-blur-md'
            }`}
          >
            <BrandLogo className="w-6 h-6" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-widest uppercase font-mono text-slate-950 dark:text-slate-100">
              OMNI
            </span>
            <span className="block text-[10px] text-slate-700 dark:text-slate-400 font-semibold uppercase tracking-widest font-mono">
              Personal Home Server
            </span>
          </div>
        </div>

        {/* Center Spatial Monument: Personalized Wording */}
        <div className="relative z-10 my-auto max-w-xl py-12 animate-stagger-2">
          <div className="transition-all duration-500 bg-transparent">
            <div className="mb-6 inline-flex items-center space-x-4">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isDark
                    ? 'bg-gradient-to-br from-[#161a26] to-[#0d0f16] border border-slate-700/80 text-slate-100 shadow-[0_0_30px_rgba(203,213,225,0.1)]'
                    : 'bg-white border border-slate-300 text-slate-950 shadow-md'
                }`}
              >
                <BrandLogo className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="h-12 w-[1px] bg-slate-400/80 dark:bg-slate-800" />
              <div className="space-y-0.5">
                <span className="text-xs font-mono font-extrabold tracking-wider text-slate-950 dark:text-slate-400 uppercase">
                  Architecture
                </span>
                <p className="text-sm font-bold text-slate-950 dark:text-slate-200">
                  Your home server
                </p>
              </div>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight mb-3 text-slate-950 dark:text-white">
              Your files. Your server. Nobody else's.
            </h1>
            <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed max-w-md font-medium">
              Everything stays on your own hardware. Nothing leaves this room unless you send it.
            </p>
          </div>
        </div>

        {/* Bottom Left Telemetry Status */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-slate-300/80 dark:border-slate-800/40 text-xs font-mono text-slate-950 dark:text-slate-400 font-bold animate-stagger-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-950 dark:text-slate-300">Arusuka is watching over things</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-slate-950 dark:text-slate-400">Last sync: just now</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* RIGHT PANE (Desktop 40% / Mobile 100%): Auth Surface      */}
      {/* ========================================================= */}
      <section
        className={`w-full lg:w-5/12 xl:w-1/3 min-h-screen flex flex-col justify-between p-5 sm:p-8 lg:p-10 transition-colors duration-500 relative z-10 animate-viewEnter ${
          isDark ? 'bg-[#08090d] lg:bg-[#080b12]' : 'bg-[#f8fafc] lg:bg-white'
        }`}
      >
        {/* Subtle Ambient Radial Lighting on Desktop */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
              isDark
                ? 'bg-gradient-to-tr from-slate-800/30 via-slate-700/10 to-indigo-950/20 opacity-60'
                : 'bg-gradient-to-tr from-slate-200/40 via-sky-100/30 to-slate-100/40 opacity-50'
            }`}
          />
        </div>

        {/* Top Bar: Brand Logo & Theme Toggle */}
        <div className="relative z-10 flex items-center justify-between w-full mb-6 lg:mb-0 animate-stagger-1">
          {/* Mobile Brand Identity */}
          <div className="flex lg:hidden items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isDark
                  ? 'bg-white/[0.08] border border-white/[0.12] text-white shadow-sm'
                  : 'bg-white border border-slate-300 text-slate-900 shadow-sm'
              }`}
            >
              <BrandLogo className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-widest uppercase font-mono text-slate-950 dark:text-slate-100">
                OMNI
              </span>
              <span className="block text-[9px] text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider font-mono">
                Personal Home Server
              </span>
            </div>
          </div>

          {/* Theme Toggle Button with Circular Wave and Morphing Sun/Moon Icon */}
          <div className="ml-auto">
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              aria-label="Toggle theme"
              className={`p-2.5 rounded-xl transition-all duration-300 backdrop-blur-md cursor-pointer active:scale-90 hover:scale-105 ${
                isDark
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 shadow-md'
                  : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-950 border border-slate-300 shadow-sm'
              }`}
              title="Toggle theme (Circular Wave)"
            >
              <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
                <Sun
                  className={`w-4 h-4 text-amber-400 absolute transition-all duration-300 transform ${
                    isDark ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                  }`}
                />
                <Moon
                  className={`w-4 h-4 text-indigo-500 absolute transition-all duration-300 transform ${
                    isDark ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Center Container: Mobile Hero + Docked Auth Box */}
        <div className="relative z-10 my-auto w-full max-w-sm mx-auto space-y-4 py-4 animate-stagger-2">
          {/* Mobile Hero Tagline (Visible only on < lg) */}
          <div className="lg:hidden text-center space-y-2 mb-2">
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-mono font-semibold transition-colors ${
              isDark
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
              <span>Arusuka is watching over things</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Your files. Your server.
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Everything stays on your own hardware.
            </p>
          </div>

          {/* Auth Card */}
          <div
            className={`p-6 sm:p-8 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
              isDark
                ? 'bg-[#0e121c]/95 border-slate-700/70 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)]'
                : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50 text-slate-900'
            }`}
          >
            <div className="mb-5 space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                Authentication
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                Just you and Arusuka in here. Enter your password to get back in.
              </p>
            </div>

            {/* Inline Error Message with Anti-Layout Shift Spatial Transition */}
            <div
              className={`transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
                error ? 'max-h-24 opacity-100 mb-5 translate-y-0' : 'max-h-0 opacity-0 mb-0 -translate-y-2 pointer-events-none'
              }`}
            >
              <div
                className={`p-3 rounded-xl text-xs flex items-center space-x-3 shadow-sm ${
                  isDark
                    ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                    : 'bg-rose-50 border border-rose-200 text-rose-700'
                }`}
              >
                <div className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="font-medium text-[12px] leading-snug">{error}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} autoComplete="on" className="space-y-5">
              {/* Hidden Username for Password Manager Autofill Compliance (Bitwarden, Keychain, 1Password) */}
              <input
                type="text"
                name="username"
                defaultValue="arusuka"
                autoComplete="username"
                tabIndex={-1}
                aria-hidden="true"
                className="sr-only opacity-0 absolute -z-10 w-0 h-0 pointer-events-none"
                readOnly
              />

              <div className={shake ? 'animate-shake' : ''}>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="docked-password"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                  >
                    Master Password
                  </label>
                  {capsLockActive && (
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 animate-fadeIn">
                      Caps Lock ON
                    </span>
                  )}
                </div>

                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-slate-900 dark:group-focus-within:text-slate-200 transition-colors duration-200">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="docked-password"
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    autoFocus
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    onKeyDown={(e) => {
                      setCapsLockActive(e.getModifierState('CapsLock'));
                    }}
                    onKeyUp={(e) => {
                      setCapsLockActive(e.getModifierState('CapsLock'));
                    }}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className={`w-full pl-10 pr-11 py-3.5 rounded-xl text-sm font-mono tracking-wider focus:outline-none transition-all duration-200 ${
                      isDark
                        ? 'bg-[#06080e]/95 border border-slate-700/80 text-white placeholder-slate-600 focus:border-slate-200 focus:ring-2 focus:ring-white/20 focus:shadow-[0_0_20px_rgba(255,255,255,0.12)]'
                        : 'bg-white border-2 border-slate-200 text-slate-950 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10 shadow-sm'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-150 active:scale-75 hover:scale-110 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <EyeOff
                        className={`w-4 h-4 absolute transition-all duration-200 transform ${
                          showPassword ? 'scale-100 opacity-100 rotate-0' : 'scale-75 opacity-0 -rotate-12'
                        }`}
                      />
                      <Eye
                        className={`w-4 h-4 absolute transition-all duration-200 transform ${
                          showPassword ? 'scale-75 opacity-0 rotate-12' : 'scale-100 opacity-100 rotate-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              {/* High-Contrast Action Button with Tactile Press Spring & Cross-fade Transition */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 px-5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-150 ease-out flex items-center justify-center active:scale-[0.98] cursor-pointer ${
                  isDark
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:via-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-950/50 hover:shadow-[0_0_24px_rgba(99,102,241,0.4)] border border-indigo-400/30 hover:border-indigo-300/60 hover:scale-[1.008]'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:via-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/25 hover:shadow-[0_0_20px_rgba(79,70,229,0.35)] border border-indigo-500/30 hover:scale-[1.008]'
                }`}
              >
                <div className="relative flex items-center justify-center min-h-[1.25rem]">
                  {loading ? (
                    <div className="flex items-center space-x-2 transition-all duration-200 animate-fadeIn">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Authorizing...</span>
                    </div>
                  ) : (
                    <span className="transition-all duration-200 animate-fadeIn">Come on in</span>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Docked Footer (High Contrast Metadata) */}
        <div className="relative z-10 pt-4 lg:pt-6 border-t border-slate-300 dark:border-slate-800/40 flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium animate-stagger-3">
          <span>OMNI {new Date().getFullYear()}</span>
          <span>Protected by Arusuka</span>
        </div>
      </section>
    </div>
  );
}
