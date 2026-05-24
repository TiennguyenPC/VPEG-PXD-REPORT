import { useState, useEffect } from 'react';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved) {
  document.documentElement.setAttribute('data-theme', resolved);
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState(
    () => localStorage.getItem('themeMode') || 'dark'
  );

  const resolved = themeMode === 'system' ? getSystemTheme() : themeMode;

  useEffect(() => {
    applyTheme(resolved);
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode, resolved]);

  // Watch system preference change when mode = 'system'
  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemTheme());
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [themeMode]);

  const setThemeMode = (mode) => setThemeModeState(mode);

  // backward-compat: simple toggle
  const toggleTheme = () => {
    setThemeModeState((prev) => {
      const cur = prev === 'system' ? getSystemTheme() : prev;
      return cur === 'dark' ? 'light' : 'dark';
    });
  };

  return { theme: themeMode, resolvedTheme: resolved, toggleTheme, setThemeMode };
}
