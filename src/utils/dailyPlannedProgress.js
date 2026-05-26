import { parseFlexibleDate, normalizeToDMY } from './timelineDates';
import { MODULE_WEIGHTS, collectModuleSchedules } from './plannedProgressCurve';
import { CONSTRUCTION_GROUP_WEIGHTS } from './moduleProgress';
import { taskProgressKey } from './siteLogConstructionProgress';

const DAY_MS = 86400000;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function startOfDay(input) {
  const d = input instanceof Date ? new Date(input) : parseFlexibleDate(input);
  if (!d) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function inclusiveDays(startStr, endStr) {
  const s = startOfDay(startStr);
  const e = startOfDay(endStr);
  if (!s || !e || e < s) return 0;
  return Math.floor((e - s) / DAY_MS) + 1;
}

function isDayInRange(refDate, startStr, endStr) {
  const d = startOfDay(refDate);
  const s = startOfDay(startStr);
  const e = startOfDay(endStr);
  if (!d || !s || !e) return false;
  return d >= s && d <= e;
}

function moduleEndDate(startStr, days) {
  const s = parseFlexibleDate(startStr);
  if (!s) return null;
  const end = new Date(s);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() + parseInt(days, 10) - 1);
  return end;
}

function getConstructionGroupKey(row) {
  const group = String(row?.NHÓM_THI_CÔNG || '');
  if (group.includes('[A]')) return 'A';
  if (group.includes('[B]')) return 'B';
  if (group.includes('[C]')) return 'C';
  if (group.includes('[D]')) return 'D';
  const code = String(row?.MÃ_CV || '')[0];
  if (code === '1') return 'A';
  if (code === '2') return 'B';
  if (code === '3') return 'C';
  if (code === '4') return 'D';
  return null;
}

/** % dự án khi hoàn thành 100% một công việc thi công */
export function buildConstructionTaskWeights(constructions = []) {
  const groupTasks = { A: [], B: [], C: [], D: [] };
  constructions.forEach((row) => {
    const key = getConstructionGroupKey(row);
    if (key) groupTasks[key].push(row);
  });

  const weightMap = {};
  for (const [group, rows] of Object.entries(groupTasks)) {
    const groupShare = CONSTRUCTION_GROUP_WEIGHTS[group] / 100;
    const moduleShare = MODULE_WEIGHTS.construction;
    const perTaskAt100 = rows.length ? ((moduleShare * groupShare) / rows.length) * 100 : 0;

    for (const row of rows) {
      const code = String(row.MÃ_CV ?? row.code ?? '').trim();
      const name = String(row.HẠNG_MỤC_CÔNG_VIỆC ?? row.item ?? '').trim();
      if (!name) continue;
      weightMap[taskProgressKey({ taskCode: code, taskName: name })] = {
        projectSharePct: perTaskAt100,
        start: normalizeToDMY(row.NGÀY_BẮT_ĐẦU || row.start),
        end: normalizeToDMY(row.NGÀY_KẾT_THÚC || row.endPlan),
        taskCode: code,
        taskName: name,
        module: 'construction',
      };
    }
  }
  return weightMap;
}

function calcModuleDailyIncrement(moduleKey, refDate, schedules) {
  const sched = schedules?.[moduleKey];
  if (!sched?.start || sched.days === '' || sched.days == null) return 0;

  const days = parseInt(sched.days, 10);
  if (!Number.isFinite(days) || days <= 0) return 0;

  const end = moduleEndDate(sched.start, days);
  if (!end || !isDayInRange(refDate, sched.start, end)) return 0;

  return (MODULE_WEIGHTS[moduleKey] * 100) / days;
}

function calcProcurementDailyIncrement(refDate, procurements, schedules) {
  const items = procurements || [];
  if (!items.length) return 0;

  const perItemAt100 = (MODULE_WEIGHTS.procurement * 100) / items.length;
  const moduleStart = schedules?.procurement?.start;
  let total = 0;

  for (const item of items) {
    const expected = normalizeToDMY(item.NGÀY_VỀ_DỰ_KIẾN);
    if (!expected) continue;

    if (moduleStart) {
      if (isDayInRange(refDate, moduleStart, expected)) {
        const dur = inclusiveDays(moduleStart, expected);
        if (dur > 0) total += perItemAt100 / dur;
      }
    } else if (startOfDay(refDate)?.getTime() === startOfDay(expected)?.getTime()) {
      total += perItemAt100;
    }
  }

  return total;
}

function calcConstructionDailyIncrement(refDate, constructions) {
  const weightMap = buildConstructionTaskWeights(constructions);
  let total = 0;

  for (const meta of Object.values(weightMap)) {
    if (!meta.start || !meta.end) continue;
    if (!isDayInRange(refDate, meta.start, meta.end)) continue;
    const dur = inclusiveDays(meta.start, meta.end);
    if (dur <= 0) continue;
    total += meta.projectSharePct / dur;
  }

  return total;
}

/**
 * % kế hoạch dự án cần đạt TRONG NGÀY — chia đều theo ngày bắt đầu/kết thúc từng việc.
 * VD: VP BCH 2 ngày → mỗi ngày 50% công việc × trọng số nhóm.
 */
export function calcDailyPlannedProjectPercent(refDate, projectId, bundles = {}) {
  if (!refDate || !projectId) return 0;

  const schedules = collectModuleSchedules(projectId, bundles);
  let total = 0;

  for (const key of ['permit', 'design', 'handover']) {
    total += calcModuleDailyIncrement(key, refDate, schedules);
  }
  total += calcProcurementDailyIncrement(refDate, bundles.procurements, schedules);
  total += calcConstructionDailyIncrement(refDate, bundles.constructions || []);

  return round2(total);
}

/** % thực tế dự án ghi nhận TRONG NGÀY từ nhật ký thi công */
export function calcDailyActualProjectPercent(progressEntries, constructions = []) {
  const weightMap = buildConstructionTaskWeights(constructions);
  let total = 0;

  for (const entry of progressEntries || []) {
    const delta = Number(entry.deltaPercent || 0);
    if (delta <= 0) continue;
    const meta = weightMap[taskProgressKey(entry)];
    if (!meta) continue;
    total += (delta / 100) * meta.projectSharePct;
  }

  return round2(total);
}

/** Danh sách việc KH active trong ngày (hiển thị gợi ý) */
export function getPlannedWorkLabelsForDay(refDate, projectId, bundles = {}) {
  const labels = [];
  const schedules = collectModuleSchedules(projectId, bundles);

  for (const key of ['permit', 'design', 'handover']) {
    const sched = schedules?.[key];
    if (!sched?.start || !sched?.days) continue;
    const end = moduleEndDate(sched.start, sched.days);
    if (end && isDayInRange(refDate, sched.start, end)) {
      labels.push(key);
    }
  }

  for (const item of bundles.procurements || []) {
    const expected = normalizeToDMY(item.NGÀY_VỀ_DỰ_KIẾN);
    const moduleStart = schedules?.procurement?.start;
    if (expected) {
      if (moduleStart && isDayInRange(refDate, moduleStart, expected)) {
        labels.push(item.HẠNG_MỤC_MUA_HÀNG || 'VT');
      } else if (!moduleStart && startOfDay(refDate)?.getTime() === startOfDay(expected)?.getTime()) {
        labels.push(item.HẠNG_MỤC_MUA_HÀNG || 'VT');
      }
    }
  }

  const weightMap = buildConstructionTaskWeights(bundles.constructions || []);
  for (const meta of Object.values(weightMap)) {
    if (meta.start && meta.end && isDayInRange(refDate, meta.start, meta.end)) {
      labels.push(meta.taskName);
    }
  }

  return labels;
}
