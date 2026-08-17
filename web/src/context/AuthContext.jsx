import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, refreshAccessToken, setAccessToken, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'authenticated' | 'unauthenticated'

  const applyToken = useCallback((token) => {
    setAccessToken(token ?? null);
    if (!token) {
      setUser(null);
      setStatus('unauthenticated');
      return;
    }
    const payload = decodeJwtPayload(token);
    setUser(payload ? { id: payload.sub, email: payload.email } : null);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => applyToken(null));
    refreshAccessToken().then(applyToken);
  }, [applyToken]);

  const register = useCallback(
    async (email, password) => {
      const res = await api.post('/api/auth/register', { email, password });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Registration failed');
      applyToken(data.accessToken);
    },
    [applyToken],
  );

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/api/auth/login', { email, password });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');
      applyToken(data.accessToken);
    },
    [applyToken],
  );

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout');
    applyToken(null);
  }, [applyToken]);

  return (
    <AuthContext.Provider value={{ user, status, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
