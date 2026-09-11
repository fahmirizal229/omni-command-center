import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken, getAuthToken } from '../api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.getAuthStatus();
      if (res.authenticated) {
        setIsAuthenticated(true);
        setUsername(res.username || 'arusuka');
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
    } catch {
      setIsAuthenticated(false);
      setUsername('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUsername('');
      showToast('Sesi otentikasi kamu telah berakhir. Silakan login kembali.', 'warning', 'Sesi Berakhir');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [checkAuth, showToast]);

  const login = async (user, password) => {
    const res = await api.login(user, password);
    if (res.token) {
      setAuthToken(res.token);
    }
    setIsAuthenticated(true);
    setUsername(res.username || user);
    showToast('Login berhasil! Selamat datang kembali.', 'success', 'Selamat Datang');
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setAuthToken('');
    setIsAuthenticated(false);
    setUsername('');
    showToast('Kamu telah berhasil logout.', 'info', 'Logout Berhasil');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
