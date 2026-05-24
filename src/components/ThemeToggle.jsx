import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../context/I18nContext';

const OPTIONS = [
  { value: 'light', labelKey: 'theme.light', Icon: Sun },
  { value: 'dark',  labelKey: 'theme.dark',  Icon: Moon },
  { value: 'system',labelKey: 'theme.system', Icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, setThemeMode } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = OPTIONS.find((o) => o.value === theme) || OPTIONS[1];
  const CurrentIcon = current.Icon;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border border-[var(--border-main)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] transition-all shadow-sm"
        title={t('theme.title')}
      >
        <CurrentIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="hidden sm:inline">{t(current.labelKey)}</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-xl z-50 overflow-hidden py-1">
          {OPTIONS.map(({ value, labelKey, Icon }) => (
            <button
              key={value}
              onClick={() => { setThemeMode(value); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{t(labelKey)}</span>
              </div>
              {theme === value && <Check className="w-3 h-3 text-[#5252ff]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
