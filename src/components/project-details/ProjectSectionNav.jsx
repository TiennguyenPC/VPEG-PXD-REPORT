import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useI18n } from '../../context/I18nContext';

const SECTION_KEYS = [
  { id: 'section-kpi', labelKey: 'nav.kpi' },
  { id: 'section-timeline', labelKey: 'nav.milestone' },
  { id: 'section-site-log', labelKey: 'nav.siteLog' },
  { id: 'section-scurve', labelKey: 'nav.scurve' },
  { id: 'section-modules', labelKey: 'nav.modules' },
];

export default function ProjectSectionNav({ scrollContainerId = null }) {
  const { t } = useI18n();
  const [active, setActive] = useState('section-kpi');
  const navRef = useRef(null);

  useEffect(() => {
    const root = scrollContainerId ? document.getElementById(scrollContainerId) : null;

    const observers = SECTION_KEYS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        {
          root: root || null,
          rootMargin: root ? '-56px 0px -55% 0px' : '-20% 0px -65% 0px',
          threshold: 0,
        }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, [scrollContainerId]);

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const scroller = scrollContainerId ? document.getElementById(scrollContainerId) : null;
    const navHeight = navRef.current?.offsetHeight ?? 44;
    const gap = 8;

    if (scroller) {
      const elTop = el.getBoundingClientRect().top;
      const scrollerTop = scroller.getBoundingClientRect().top;
      const target = scroller.scrollTop + (elTop - scrollerTop) - navHeight - gap;
      scroller.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      return;
    }

    const y = el.getBoundingClientRect().top + window.scrollY - navHeight - gap;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  }, [scrollContainerId]);

  return (
    <nav
      ref={navRef}
      data-section-nav
      className="sticky top-0 z-30 px-4 md:px-5 py-2 bg-[var(--bg-main)]/95 backdrop-blur-md border-b border-[var(--border-main)]/60 print:hidden"
    >
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-7xl mx-auto">
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
