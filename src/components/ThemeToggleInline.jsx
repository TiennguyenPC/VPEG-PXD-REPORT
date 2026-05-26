import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggleInline({ className = '' }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? 'Chuyển sáng' : 'Chuyển tối';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors ${className}`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
