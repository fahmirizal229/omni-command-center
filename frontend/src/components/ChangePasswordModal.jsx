import React, { useState } from 'react';
import { X, KeyRound, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

export function ChangePasswordModal({ isOpen, onClose }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password baru minimal harus 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setSuccess(true);
      showToast('Password master dashboard berhasil diperbarui!', 'success', 'Password Diubah');
      setTimeout(() => {
        onClose();
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Gagal mengubah password. Pastikan password lama benar.');
      showToast(err.message || 'Password lama salah.', 'error', 'Gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-zinc-300" />
            <h3 className="font-semibold text-zinc-100 text-base">Ganti Password Dashboard</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Password berhasil diperbarui! Menutup jendela...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">Password Lama</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">Password Baru (Min. 6 Karakter)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">Konfirmasi Password Baru</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>Simpan Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
