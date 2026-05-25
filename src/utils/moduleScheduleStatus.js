import { parseFlexibleDate, normalizeToDMY } from './timelineDates';

const DAY_MS = 86400000;

export function readModuleDates(projectId, moduleKey, initialData) {
  const storageKey = `dates_${moduleKey}_${projectId}`;
  if (Array.isArray(initialData) && initialData.length > 0) {
    const rowWithDate = initialData.find((r) => r.NGÀY_BẮT_ĐẦU_MODULE || r.SỐ_NGÀY_MODULE);
    if (rowWithDate) {
      const startRaw = rowWithDate.NGÀY_BẮT_ĐẦU_MODULE || '';
      return {
        start: normalizeToDMY(startRaw) || startRaw.split('T')[0] || '',
        days: rowWithDate.SỐ_NGÀY_MODULE ?? '',
      };
    }
  }
  try {
    const cached = localStorage.getItem(storageKey);
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore */
  }
  return { start: '', days: '' };
}

/** Tiến độ kế hoạch tuyến tính theo timeline module (0–100%) */
export function calcModulePlannedProgress(start, days, refDate = new Date()) {
  if (!start || days === '' || days == null) return null;
  const totalDays = parseInt(days, 10);
  if (!Number.isFinite(totalDays) || totalDays <= 0) return null;

  const startDate = parseFlexibleDate(start);
  if (!startDate) return null;

  const startDay = new Date(startDate);
  startDay.setHours(0, 0, 0, 0);
  const endDay = new Date(startDay);
  endDay.setDate(endDay.getDate() + totalDays);

  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);

  if (today < startDay) return 0;
  if (today >= endDay) return 100;

  const elapsed = Math.floor((today - startDay) / DAY_MS);
  return Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
}

/**
 * Xanh: đúng/đủ tiến độ · Cam: chậm so kế hoạch · Đỏ: quá hạn mà chưa xong
 */
export function getModuleScheduleTone({ actualPercent, start, days, refDate = new Date() }) {
  const actual = Number(actualPercent) || 0;

  if (actual >= 100) {
    return {
      tone: 'ok',
      dotClass: 'bg-[#10b981]',
      textClass: 'text-[#10b981]',
      borderClass: 'border-[var(--border-light)]',
    };
  }

  const planned = calcModulePlannedProgress(start, days, refDate);
  if (planned == null) {
    return {
      tone: 'ok',
      dotClass: 'bg-[#10b981]',
      textClass: 'text-[#10b981]',
      borderClass: 'border-[var(--border-light)]',
    };
  }

  const totalDays = parseInt(days, 10);
  const startDate = parseFlexibleDate(start);
  const endDay = new Date(startDate);
  endDay.setHours(0, 0, 0, 0);
  endDay.setDate(endDay.getDate() + totalDays);

  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);

  if (today > endDay) {
    return {
      tone: 'late',
      dotClass: 'bg-[#ef4444]',
      textClass: 'text-[#ef4444]',
      borderClass: 'border-[#ef4444]/30',
    };
  }

  const gap = actual - planned;
  const daysLeft = Math.ceil((endDay - today) / DAY_MS);
  const nearDeadline = daysLeft <= Math.max(3, Math.round(totalDays * 0.2));
  const behindPlan = gap < -10;
  const laggingMidway = planned >= 40 && gap < -5;
  const nearEndNotDone = nearDeadline && actual < Math.max(planned, 85);

  if (behindPlan || laggingMidway || nearEndNotDone) {
    return {
      tone: 'slow',
      dotClass: 'bg-[#f59e0b]',
      textClass: 'text-[#f59e0b]',
      borderClass: 'border-[#f59e0b]/30',
    };
  }

  return {
    tone: 'ok',
    dotClass: 'bg-[#10b981]',
    textClass: 'text-[#10b981]',
    borderClass: 'border-[var(--border-light)]',
  };
}
