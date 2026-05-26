import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  api,
  getAuthToken,
  setAuthToken,
  readSessionUserCache,
  writeSessionUserCache,
  clearSessionUserCache,
  clearCache,
  prefetchOverviewRoute,
} from '../services/api';

const AuthContext = createContext(null);

function getInitialAuthState() {
  const token = getAuthToken();
  if (!token) return { user: null, loading: false };
  const cachedUser = readSessionUserCache();
  if (cachedUser) return { user: cachedUser, loading: false };
  return { user: null, loading: true };
}

export function AuthProvider({ children }) {
  const initial = getInitialAuthState();
  const [user, setUser] = useState(initial.user);
  const [loading, setLoading] = useState(initial.loading);

  const warmAppAfterAuth = useCallback(() => {
    prefetchOverviewRoute();
    api.getOverviewData().catch(() => {});
  }, []);

  const invalidateSession = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    clearSessionUserCache();
    clearCache();
  }, []);

  const validateSession = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cachedUser = readSessionUserCache();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
      warmAppAfterAuth();

      try {
        const sessionUser = await api.authMe();
        setUser(sessionUser);
        writeSessionUserCache(sessionUser);
      } catch {
        invalidateSession();
      }
      return;
    }

    try {
      const sessionUser = await api.authMe();
      setUser(sessionUser);
      writeSessionUserCache(sessionUser);
      warmAppAfterAuth();
    } catch {
      invalidateSession();
    } finally {
      setLoading(false);
    }
  }, [warmAppAfterAuth, invalidateSession]);

  useEffect(() => {
    validateSession();
  }, [validateSession]);

  const login = useCallback(async (username, password) => {
    const { token, user: sessionUser } = await api.login(username, password);
    setAuthToken(token);
    setUser(sessionUser);
    writeSessionUserCache(sessionUser);

    await Promise.all([
      api.getOverviewData().catch(() => {}),
      prefetchOverviewRoute(),
    ]);

    return sessionUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore network errors on logout */
    } finally {
      invalidateSession();
    }
  }, [invalidateSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshSession: validateSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
