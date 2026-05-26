import { readModuleDates, calcModulePlannedProgress } from './moduleScheduleStatus';
import { parseFlexibleDate } from './timelineDates';

const DAY_MS = 86400000;

/** Trọng số hạng mục — đồng bộ với ProjectDetailPage */
export const MODULE_WEIGHTS = {
  permit: 0.10,
  design: 0.15,
  procurement: 0.25,
  construction: 0.40,
  handover: 0.10,
};

const MODULE_BUNDLE_KEYS = {
  permit: 'permits',
  design: 'designs',
  procurement: 'procurements',
  construction: 'constructions',
  handover: 'handovers',
};

export function collectModuleSchedules(projectId, bundles = {}) {
  const schedules = {};
  for (const [moduleKey, bundleKey] of Object.entries(MODULE_BUNDLE_KEYS)) {
    schedules[moduleKey] = readModuleDates(projectId, moduleKey, bundles[bundleKey]);
  }
  return schedules;
}

export function hasAnyModuleSchedule(schedules) {
  return Object.values(schedules || {}).some(
    (s) => s?.start && s?.days !== '' && s?.days != null && Number(s.days) > 0
  );
}

/**
 * Tiến độ kế hoạch tổng dự án tại một ngày:
 * Σ (trọng số hạng mục × % hoàn thành kế hoạch của hạng mục đó).
 * Hạng mục chồng lấn → ngày cao điểm có thể +8–10%, ngày ít việc +2–3%.
 */
export function calcOverallPlannedPercent(refDate, schedules) {
  if (!schedules) return null;

  let total = 0;
  let hasAny = false;

  for (const [key, weight] of Object.entries(MODULE_WEIGHTS)) {
    const sched = schedules[key];
    if (!sched?.start || sched.days === '' || sched.days == null) continue;

    const modulePct = calcModulePlannedProgress(sched.start, sched.days, refDate);
    if (modulePct == null) continue;

    hasAny = true;
    total += weight * (modulePct / 100);
  }

  if (!hasAny) return null;
  return Math.min(100, Math.round(total * 1000) / 10);
}

/** Fallback khi chưa nhập lịch hạng mục: tuyến tính kickoff → COD */
export function calcLinearPlanPercent(refDate, startDate, endDate) {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const current = new Date(refDate);
  current.setHours(0, 0, 0, 0);

  if (current <= start) return 0;
  if (current >= end) return 100;

  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;

  return Math.min(100, Math.round(((current.getTime() - start.getTime()) / total) * 1000) / 10);
}

export function calcPlanPercentForDate(refDate, schedules, fallbackStart, fallbackEnd) {
  const fromModules = calcOverallPlannedPercent(refDate, schedules);
  if (fromModules != null) return fromModules;
  return calcLinearPlanPercent(refDate, fallbackStart, fallbackEnd);
}

/** % tăng kế hoạch trong ngày (dùng tooltip / biểu đồ cột tuần) */
export function calcDailyPlanIncrement(dayIndex, dailyPlans) {
  if (dayIndex <= 0 || !dailyPlans?.length) return 0;
  const prev = dailyPlans[dayIndex - 1] ?? 0;
  const curr = dailyPlans[dayIndex] ?? 0;
  return Math.max(0, Math.round((curr - prev) * 10) / 10);
}

export function parseChartDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return parseFlexibleDate(dateStr);
}

/** Khoảng cách nhãn trục X theo độ dài dự án */
export function getChartTickInterval(numDays) {
  if (numDays <= 45) return 5;
  if (numDays <= 75) return 7;
  return 10;
}

export function buildDailyPlanSeries(globalStart, globalEnd, schedules) {
  const start = new Date(globalStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(globalEnd);
  end.setHours(0, 0, 0, 0);

  const totalTime = end.getTime() - start.getTime();
  if (totalTime <= 0) return [];

  const numDays = Math.ceil(totalTime / DAY_MS);
  const series = [];

  for (let i = 0; i <= numDays; i++) {
    const currentDate = new Date(start.getTime() + DAY_MS * i);
    series.push(calcPlanPercentForDate(currentDate, schedules, start, end));
  }

  return series;
}
