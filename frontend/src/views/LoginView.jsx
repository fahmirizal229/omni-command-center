import React, { useState, useRef } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function LoginView() {
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
      setError('Harap masukkan username.');
      showToast('Username tidak boleh kosong.', 'error', 'Login Gagal');
      return;
    }
    if (!password) {
      setError('Harap masukkan password.');
      showToast('Password tidak boleh kosong.', 'error', 'Login Gagal');
      return;
    }

    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const msg = err.message || 'Username atau password yang kamu masukkan salah.';
      setError(msg);
      setShake(true);
      setPassword('');
      showToast(msg, 'error', 'Login Gagal');
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
            AR
          </div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
            Masuk ke Workspace
          </h2>
          <p className="text-xs text-zinc-400">Masukkan kredensial akun untuk mengakses dashboard.</p>
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
            <label className="block font-medium text-zinc-300 mb-1.5">Username</label>
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
                placeholder="Username"
                className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950 border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all ${
                  error ? 'border-rose-500 focus:border-rose-500' : 'border-zinc-800 focus:border-zinc-500'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">Password</label>
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
                autoComplete="new-password"
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
            className="w-full py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 text-xs cursor-pointer disabled:opacity-60 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-zinc-800/80">
          <p className="text-[11px] text-zinc-500 flex items-center justify-center space-x-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sesi Terenkripsi & Aman</span>
          </p>
        </div>
      </div>
    </div>
  );
}
