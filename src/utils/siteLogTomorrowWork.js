import { getLogNoteText, parseDailyNote } from './sitePhotoCache';
import { getPlannedWorkItemsForDay } from './dailyPlannedProgress';
import { parseProgressEntries, taskProgressKey, sumProgressThroughDate } from './siteLogConstructionProgress';
import { parseFlexibleDate, formatDateStr, normalizeToDMY } from './timelineDates';

const TABLE_DETAIL_SUFFIX = '(chi tiết theo bảng)';

export function addDaysDMY(dateStr, days) {
  const d = parseFlexibleDate(dateStr);
  if (!d) return null;
  d.setDate(d.getDate() + days);
  return formatDateStr(d);
}

export function findLogByDate(logs, dateStr) {
  const target = normalizeToDMY(dateStr);
  if (!target) return null;
  return (logs || []).find((log) => normalizeToDMY(log.LOG_DATE || log.NGÀY) === target) || null;
}

export function parseDismissedTomorrowKeys(noteText) {
  const parsed = parseDailyNote(noteText);
  const raw = String(parsed.boQuaNgayMai || '').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(String) : [];
  } catch {
    return raw.split('\n').map((line) => line.trim()).filter(Boolean);
  }
}

export function serializeDismissedTomorrowKeys(keys) {
  const cleaned = [...new Set((keys || []).map(String).filter(Boolean))];
  return cleaned.length ? JSON.stringify(cleaned) : '';
}

function normalizeLine(line) {
  return String(line || '').replace(/^-\s*/, '').trim();
}

function lineToFallbackKey(line) {
  return `text:${normalizeLine(line).toLowerCase()}`;
}

/** Khớp dòng nhật ký với hạng mục thi công */
export function matchLineToTaskKey(line, constructions = []) {
  const text = normalizeLine(line);
  if (!text) return lineToFallbackKey(line);

  const codeMatch = text.match(/^\[([^\]]+)\]/);
  const codeFromLine = codeMatch?.[1]?.trim();
  const nameFromLine = codeMatch ? text.replace(/^\[[^\]]+\]\s*/, '').trim() : text;

  for (const row of constructions || []) {
    const taskCode = String(row.MÃ_CV ?? row.code ?? '').trim();
    const taskName = String(row.HẠNG_MỤC_CÔNG_VIỆC ?? row.item ?? '').trim();
    if (!taskName) continue;
    if (codeFromLine && taskCode && codeFromLine === taskCode) {
      return `construction:${taskProgressKey({ taskCode, taskName })}`;
    }
    if (nameFromLine === taskName || text.includes(taskName)) {
      return `construction:${taskProgressKey({ taskCode, taskName })}`;
    }
  }

  const lower = text.toLowerCase();
  // Dòng có mã [1], [2]… là hạng mục thi công — không suy ra GP/TK/BGHS theo từ khóa
  if (!codeFromLine) {
    if (lower.includes('giấy phép') || lower.includes('giay phep')) return 'module:permit';
    if (lower.includes('thiết kế') || lower.includes('thiet ke')) return 'module:design';
    if (lower.includes('bàn giao') || lower.includes('ban giao')) return 'module:handover';
  }

  return lineToFallbackKey(text);
}

function formatRemainingPercent(total) {
  const remaining = Math.round((100 - total) * 100) / 100;
  if (Number.isInteger(remaining)) return String(remaining);
  return String(remaining).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

function isConstructionLineCompletedOnDay(line, logs, dateStr, constructions) {
  const key = matchLineToTaskKey(line, constructions);
  if (!key.startsWith('construction:')) return false;

  const progressKey = key.replace(/^construction:/, '');
  const cumulative = sumProgressThroughDate(logs, dateStr);
  return (cumulative[progressKey] || 0) >= 100;
}

/** Việc thi công đã ghi % nhưng chưa đủ 100% → carry sang ngày mai (còn X%) */
function getIncompleteProgressCarryOver(logDate, logs, constructions, dismissedKeys) {
  const cumulative = sumProgressThroughDate(logs, logDate);
  const metaByKey = {};

  for (const row of constructions || []) {
    const taskCode = String(row.MÃ_CV ?? row.code ?? '').trim();
    const taskName = String(row.HẠNG_MỤC_CÔNG_VIỆC ?? row.item ?? '').trim();
    if (!taskName) continue;
    metaByKey[taskProgressKey({ taskCode, taskName })] = { taskCode, taskName };
  }

  for (const log of logs || []) {
    const logDateNorm = normalizeToDMY(log.LOG_DATE || log.NGÀY);
    const through = parseFlexibleDate(normalizeToDMY(logDate));
    const d = parseFlexibleDate(logDateNorm);
    if (!through || !d || d > through) continue;

    for (const entry of parseProgressEntries(getLogNoteText(log))) {
      const pk = taskProgressKey(entry);
      if (metaByKey[pk]) continue;
      const taskCode = String(entry.taskCode || '').trim();
      const taskName = String(entry.taskName || '').trim();
      if (taskName) metaByKey[pk] = { taskCode, taskName };
    }
  }

  const dismissed = new Set(dismissedKeys || []);
  const items = [];

  for (const [pk, total] of Object.entries(cumulative)) {
    if (total <= 0 || total >= 100) continue;
    const meta = metaByKey[pk];
    if (!meta?.taskName) continue;

    const key = `construction:${pk}`;
    if (dismissed.has(key)) continue;

    const remainingLabel = formatRemainingPercent(total);
    const label = meta.taskCode
      ? `[${meta.taskCode}] ${meta.taskName} (còn ${remainingLabel}%)`
      : `${meta.taskName} (còn ${remainingLabel}%)`;

    items.push({
      key,
      label,
      source: 'incomplete_progress',
      module: 'construction',
    });
  }

  return items;
}

function getCarryOverItems(logDate, logs, constructions, dismissedKeys) {
  const prevDate = addDaysDMY(logDate, -1);
  if (!prevDate) return [];

  const prevLog = findLogByDate(logs, prevDate);
  if (!prevLog) return [];

  const prevNote = parseDailyNote(getLogNoteText(prevLog));
  const lines = String(prevNote.congViecNgayMai || '')
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  const dismissed = new Set(dismissedKeys || []);
  const items = [];

  for (const line of lines) {
    const key = matchLineToTaskKey(line, constructions);
    if (dismissed.has(key)) continue;
    if (isConstructionLineCompletedOnDay(line, logs, logDate, constructions)) continue;

    items.push({
      key,
      label: line,
      source: 'carryover',
    });
  }

  return items;
}

function getManualExtraLines(savedText, autoLabels) {
  const autoSet = new Set(autoLabels.map((l) => normalizeLine(l).toLowerCase()));
  return String(savedText || '')
    .split('\n')
    .map(normalizeLine)
    .filter((line) => line && !autoSet.has(line.toLowerCase()));
}

/**
 * Tự động gợi ý công việc ngày mai:
 * - Lịch KH ngày D+1 (thi công: tên việc; GP/TK/BGHS: chi tiết theo bảng)
 * - Việc thi công chưa đủ 100% tính đến hết ngày D (còn X%)
 * - Việc từ nhật ký hôm qua chưa hoàn thành hôm nay
 * - Trừ các dòng đã bấm X (bỏ qua)
 */
export function computeTomorrowWork({
  logDate,
  projectId,
  bundles = {},
  logs = [],
  constructions = [],
  dismissedKeys = [],
  savedTomorrowText = '',
}) {
  const tomorrow = addDaysDMY(logDate, 1);
  if (!tomorrow) return { items: [], lines: [], text: '' };

  const dismissed = new Set(dismissedKeys || []);
  const items = [];
  const seen = new Set();

  const addItem = (item) => {
    if (!item?.key || !item?.label) return;
    if (dismissed.has(item.key) || seen.has(item.key)) return;
    seen.add(item.key);
    items.push(item);
  };

  const incompleteCarry = getIncompleteProgressCarryOver(logDate, logs, constructions, dismissedKeys);
  const incompleteKeys = new Set(incompleteCarry.map((item) => item.key));

  incompleteCarry.forEach(addItem);

  getPlannedWorkItemsForDay(tomorrow, projectId, bundles).forEach((item) => {
    if (incompleteKeys.has(item.key)) return;
    addItem(item);
  });

  getCarryOverItems(logDate, logs, constructions, dismissedKeys).forEach(addItem);

  const autoLabels = items.map((item) => item.label);
  const manualLines = getManualExtraLines(savedTomorrowText, autoLabels);

  for (const line of manualLines) {
    addItem({ key: lineToFallbackKey(line), label: line, source: 'manual' });
  }

  const lines = items.map((item) => item.label);
  return {
    items,
    lines,
    text: lines.join('\n'),
    tomorrowDate: tomorrow,
    tableDetailSuffix: TABLE_DETAIL_SUFFIX,
  };
}
