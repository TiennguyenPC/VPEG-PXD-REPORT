import { getLogNoteText, parseDailyNote } from './sitePhotoCache';
import { getPlannedWorkItemsForDay } from './dailyPlannedProgress';
import { parseProgressEntries, taskProgressKey } from './siteLogConstructionProgress';
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
  if (lower.includes('giấy phép') || lower.includes('giay phep')) return 'module:permit';
  if (lower.includes('thiết kế') || lower.includes('thiet ke')) return 'module:design';
  if (lower.includes('bàn giao') || lower.includes('ban giao')) return 'module:handover';

  return lineToFallbackKey(text);
}

function isConstructionLineCompletedOnDay(line, logs, dateStr, constructions) {
  const key = matchLineToTaskKey(line, constructions);
  if (!key.startsWith('construction:')) return false;

  const progressKey = key.replace(/^construction:/, '');
  const log = findLogByDate(logs, dateStr);
  if (!log) return false;

  const entries = parseProgressEntries(getLogNoteText(log));
  return entries.some(
    (entry) => taskProgressKey(entry) === progressKey && Number(entry.deltaPercent || 0) > 0
  );
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

  getPlannedWorkItemsForDay(tomorrow, projectId, bundles).forEach(addItem);
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
