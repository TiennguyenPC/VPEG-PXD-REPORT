import React, { useEffect, useState } from 'react';
import { useI18n } from '../../../context/I18nContext';
import { formatPercent3 } from '../../../utils/formatPercent';
import { getModuleScheduleTone, readModuleDates } from '../../../utils/moduleScheduleStatus';

export default function ModuleProgressPill({
  projectId,
  moduleKey,
  initialData,
  done,
  total,
  percent,
}) {
  const { tf } = useI18n();
  const [datesTick, setDatesTick] = useState(0);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.projectId === projectId && e.detail?.moduleKey === moduleKey) {
        setDatesTick((t) => t + 1);
      }
    };
    window.addEventListener('module-dates-updated', handler);
    return () => window.removeEventListener('module-dates-updated', handler);
  }, [projectId, moduleKey]);

  const dates = readModuleDates(projectId, moduleKey, initialData);
  void datesTick;
  const tone = getModuleScheduleTone({
    actualPercent: percent,
    start: dates.start,
    days: dates.days,
  });

  return (
    <div className={`flex items-center justify-center gap-2 bg-[var(--border-main)]/50 border px-3 py-1 rounded-full text-xs min-w-[140px] ${tone.borderClass}`}>
      <span className="text-[var(--text-main)] whitespace-nowrap">
        {tf('modules.completed', { done, total })}
      </span>
      <span className={`w-1 h-1 rounded-full shrink-0 ${tone.dotClass}`} />
      <span className={`font-bold shrink-0 ${tone.textClass}`}>
        {formatPercent3(percent)}
      </span>
    </div>
  );
}
