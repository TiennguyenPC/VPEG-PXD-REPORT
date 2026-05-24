import React, { useEffect, useState } from 'react';
import { useI18n } from '../../context/I18nContext';

const SECTION_KEYS = [
  { id: 'section-kpi', labelKey: 'nav.kpi' },
  { id: 'section-timeline', labelKey: 'nav.milestone' },
  { id: 'section-site-log', labelKey: 'nav.siteLog' },
  { id: 'section-scurve', labelKey: 'nav.scurve' },
  { id: 'section-modules', labelKey: 'nav.modules' },
];

export default function ProjectSectionNav() {
  const { t } = useI18n();
  const [active, setActive] = useState('section-kpi');

  useEffect(() => {
    const observers = SECTION_KEYS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sticky top-0 z-20 -mx-2 px-2 py-2 mb-2 bg-[var(--bg-main)]/90 backdrop-blur-md border-b border-[var(--border-main)]/50 print:hidden">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
        {SECTION_KEYS.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
              active === id
                ? 'bg-[#5252ff]/15 text-[#7373ff] ring-1 ring-[#5252ff]/30'
                : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>
    </nav>
  );
}
