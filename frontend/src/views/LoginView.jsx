import React, { useState, useRef } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export function LoginView() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const passwordInputRef = useRef(null);
  const { login } = useAuth();
  const { showToast } = useToast();

  const handleLoginSubmit = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setError('');
    setShake(false);

    if (!username.trim()) {
      setError(t('login_failed', 'Harap masukkan username.'));
      showToast(t('login_failed', 'Username tidak boleh kosong.'), 'error', 'Login Error');
      return;
    }
    if (!password) {
      setError(t('login_failed', 'Harap masukkan password.'));
      showToast(t('login_failed', 'Password tidak boleh kosong.'), 'error', 'Login Error');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const msg = err.message || t('login_failed', 'Username atau password salah.');
      setError(msg);
      setShake(true);
      setPassword('');
      showToast(msg, 'error', 'Login Error');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0d11]">
      <div
        className={`max-w-md w-full bg-[#121215] border border-zinc-800 rounded-xl p-7 shadow-2xl space-y-6 transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700/70 items-center justify-center text-zinc-100 font-bold text-lg mb-1 tracking-wide">
            OC
          </div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            {t('login_title', 'Masuk ke Omni Command Center')}
          </h2>
          <p className="text-xs text-zinc-400">
            {t('login_subtitle', 'Masukkan password master admin untuk mengakses workspace pribadi.')}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">{t('login_username', 'Username')}</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="off"
                placeholder={t('login_username', 'Username')}
                className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                  error ? 'border-rose-500 focus:border-rose-500' : 'border-zinc-800 focus:border-zinc-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">{t('login_password', 'Password')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={passwordInputRef}
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="off"
                placeholder="••••••••"
                className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                  error ? 'border-rose-500 focus:border-rose-500' : 'border-zinc-800 focus:border-zinc-500'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
                <span>{t('loading', 'Memverifikasi...')}</span>
              </>
            ) : (
              <>
                <span>{t('login_btn', 'Masuk')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Badge */}
        <div className="pt-2 text-center text-[11px] text-zinc-500 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>PBKDF2 SHA-256 + Sliding Window Rate Limiting</span>
        </div>
      </div>
    </div>
  );
}
