import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const OPTIONS = [
  { value: 'vi', labelKey: 'lang.vi' },
  { value: 'en', labelKey: 'lang.en' },
];

export default function LanguageToggle({ compact = false }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border border-[var(--border-main)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] transition-all shadow-sm"
        title={t('lang.title')}
      >
        <Languages className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        {!compact && <span className="hidden sm:inline">{locale === 'en' ? 'EN' : 'VI'}</span>}
        {compact && <span>{locale === 'en' ? 'EN' : 'VI'}</span>}
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-xl z-50 overflow-hidden py-1">
          {OPTIONS.map(({ value, labelKey }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setLocale(value); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span>{t(labelKey)}</span>
              {locale === value && <Check className="w-3 h-3 text-[#5252ff]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
