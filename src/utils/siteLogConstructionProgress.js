import { getLogNoteText, parseDailyNote } from './sitePhotoCache';
import { normalizeToDMY, parseFlexibleDate } from './timelineDates';

export const PROGRESS_SECTION_HEADING = 'TIẾN ĐỘ HẠNG MỤC';

export function taskProgressKey(entry) {
  const code = String(entry?.taskCode ?? entry?.MÃ_CV ?? '').trim();
  const name = String(entry?.taskName ?? entry?.HẠNG_MỤC_CÔNG_VIỆC ?? '').trim();
  return `${code}::${name}`;
}

export function parseProgressEntries(noteText) {
  if (!noteText) return [];
  const parsed = parseDailyNote(noteText);
  const raw = String(parsed.progressEntries || '').trim();
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function serializeProgressEntries(entries) {
  const cleaned = (entries || [])
    .map((entry) => ({
      taskCode: String(entry.taskCode || '').trim(),
      taskName: String(entry.taskName || '').trim(),
      deltaPercent: Number(entry.deltaPercent || 0),
      note: String(entry.note || '').trim(),
    }))
    .filter((entry) => entry.taskCode && entry.taskName && entry.deltaPercent > 0);
  return cleaned.length ? JSON.stringify(cleaned) : '';
}

export function buildConstructionOptions(constructionRows) {
  if (!constructionRows?.length) return [];
  return constructionRows
    .map((row) => {
      const taskCode = String(row.MÃ_CV ?? row.code ?? '').trim();
      const taskName = String(row.HẠNG_MỤC_CÔNG_VIỆC ?? row.item ?? '').trim();
      if (!taskName) return null;
      return {
        taskCode,
        taskName,
        currentPercent: Number(row.TIẾN_ĐỘ_THỰC_TẾ ?? row.progress ?? 0) || 0,
        _rowIndex: row._rowIndex,
      };
    })
    .filter(Boolean);
}

export function sumProgressDeltasFromLogs(logs, { excludeDate } = {}) {
  const sums = {};
  const excluded = excludeDate ? normalizeToDMY(excludeDate) : null;

  for (const log of logs || []) {
    const date = normalizeToDMY(log.LOG_DATE || log.NGÀY);
    if (excluded && date === excluded) continue;
    const entries = parseProgressEntries(getLogNoteText(log));
    for (const entry of entries) {
      const delta = Number(entry.deltaPercent || 0);
      if (!delta) continue;
      const key = taskProgressKey(entry);
      sums[key] = (sums[key] || 0) + delta;
    }
  }
  return sums;
}

/** Tổng % đã ghi nhận qua nhật ký đến hết ngày throughDateStr (bao gồm ngày đó) */
export function sumProgressThroughDate(logs, throughDateStr) {
  const through = parseFlexibleDate(normalizeToDMY(throughDateStr));
  if (!through) return {};

  const filtered = (logs || []).filter((log) => {
    const d = parseFlexibleDate(normalizeToDMY(log.LOG_DATE || log.NGÀY));
    return d && d <= through;
  });

  return sumProgressDeltasFromLogs(filtered);
}

export function validateProgressEntries(entries, logs, currentDate) {
  const errors = [];
  const otherSums = sumProgressDeltasFromLogs(logs, { excludeDate: currentDate });
  const currentByKey = {};

  for (const entry of entries || []) {
    const delta = Number(entry.deltaPercent || 0);
    if (delta <= 0) continue;
    const key = taskProgressKey(entry);
    currentByKey[key] = (currentByKey[key] || 0) + delta;
  }

  for (const [key, attempted] of Object.entries(currentByKey)) {
    const prior = otherSums[key] || 0;
    const total = prior + attempted;
    if (total > 100) {
      const [, taskName] = key.split('::');
      errors.push({
        key,
        taskName: taskName || key,
        maxAllowed: Math.max(0, 100 - prior),
        attempted,
        prior,
        total,
      });
    }
  }

  return errors;
}

export function parseProgressEntriesFromSummary(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\[([^\]]*)\]\s*(.+?):\s*\+?\s*([\d.]+)\s*%?\s*$/);
      if (!match) return null;
      const deltaPercent = Number(match[3]);
      if (!Number.isFinite(deltaPercent) || deltaPercent <= 0) return null;
      return {
        taskCode: String(match[1] || '').trim(),
        taskName: String(match[2] || '').trim(),
        deltaPercent,
        note: '',
      };
    })
    .filter(Boolean);
}

/** Gộp JSON tiến độ + dòng tóm tắt CÔNG VIỆC CHÍNH (fallback khi Sheet thiếu JSON) */
export function resolveMainTaskEntries(noteText) {
  const parsed = parseDailyNote(noteText || '');
  const fromJson = parseProgressEntries(noteText).filter((entry) => Number(entry.deltaPercent) > 0);
  if (fromJson.length) return fromJson;

  const fromSummary = parseProgressEntriesFromSummary(parsed.congViecChinh);
  if (fromSummary.length) return fromSummary;

  return [];
}

export function formatMainTaskLabel(entry) {
  return `[${entry.taskCode}] ${entry.taskName}: +${Number(entry.deltaPercent)}%`;
}

export function formatEntriesAsSummaryLines(entries) {
  return (entries || [])
    .filter((entry) => Number(entry.deltaPercent) > 0)
    .map((entry) => `[${entry.taskCode}] ${entry.taskName}: +${Number(entry.deltaPercent)}%`)
    .join('\n');
}

export function getRemainingPercentForTask(task, logs, currentDate, draftEntries = [], excludeIndex = -1) {
  const key = taskProgressKey(task);
  const otherSums = sumProgressDeltasFromLogs(logs, { excludeDate: currentDate });
  const draftSum = (draftEntries || [])
    .filter((entry, index) => index !== excludeIndex && taskProgressKey(entry) === key)
    .reduce((sum, entry) => sum + Number(entry.deltaPercent || 0), 0);
  const prior = otherSums[key] || 0;
  return Math.max(0, 100 - prior - draftSum);
}
