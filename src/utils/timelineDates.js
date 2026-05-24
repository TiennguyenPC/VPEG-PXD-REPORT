/** Parse dd/mm/yyyy, yyyy-mm-dd, hoặc ISO date */
export function parseDateDMY(dStr) {
  return parseFlexibleDate(dStr);
}

export function parseFlexibleDate(dStr) {
  if (!dStr || dStr === '-') return null;
  const s = String(dStr).trim();
  const slash = s.split('/');
  if (slash.length === 3 && slash[0].length <= 2) {
    const d = new Date(Number(slash[2]), Number(slash[1]) - 1, Number(slash[0]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s.split('T')[0] + 'T12:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateDMY(date) {
  if (!date || Number.isNaN(date.getTime())) return '-';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Alias — đồng bộ tên gọi trong các panel nhật ký / KPI */
export const formatDateStr = formatDateDMY;

/** Chuẩn hóa mọi chuỗi ngày về dd/mm/yyyy để hiển thị & lưu Sheet */
export function normalizeToDMY(val) {
  if (val == null || val === '' || val === '-' || val === '---') return '';
  const s = String(val).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${day}/${month}/${year}`;
    }
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return formatDateDMY(d);
  return s;
}

/** yyyy-mm-dd cho input[type=date] ẩn */
export function toInputDateValue(dmyStr) {
  const d = parseFlexibleDate(dmyStr);
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Chuyển yyyy-mm-dd → dd/mm/yyyy */
export function fromInputDateValue(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getTodayDMY() {
  return formatDateDMY(new Date());
}

export function getMondayOfDate(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function compareDateStrings(a, b) {
  const da = parseFlexibleDate(a);
  const db = parseFlexibleDate(b);
  if (!da && !db) return 0;
  if (!da) return -1;
  if (!db) return 1;
  return da.getTime() - db.getTime();
}

export function diffDaysInclusive(start, end) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000));
}

/** % vị trí HÔM NAY trên trục Kickoff → End (ngày 23/31 → 23/31*100) */
export function calcTodayAxisPercent(startDate, endDate, today = new Date()) {
  if (!startDate || !endDate) return null;
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const totalDays = diffDaysInclusive(start, end) + 1;
  if (totalDays <= 0) return null;
  if (t < start) return 0;
  if (t > end) return 100;

  const elapsedDays = diffDaysInclusive(start, t) + 1;
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
}

export function calcEndFromModuleStorage(projectId, moduleKey) {
  if (!projectId) return null;
  try {
    const raw = localStorage.getItem(`dates_${moduleKey}_${projectId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.start || !parsed.days) return null;
    const start = parseFlexibleDate(parsed.start);
    if (!start) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + parseInt(parsed.days, 10));
    return end;
  } catch {
    return null;
  }
}

/** Xác định ngày bắt đầu / kết thúc trục timeline (Kickoff → Bàn giao, fallback COD) */
export function resolveTimelineBounds(project, milestones = [], milestonesData = []) {
  const projectId = project?.PROJECT_ID || project?.id;

  const kickoffM = milestones.find((m) => m.title === 'KICKOFF');
  const handoverM = milestones.find((m) => m.title === 'BÀN GIAO HỒ SƠ');
  const codM = milestones.find((m) => m.title === 'COD');

  const kickoffRow = milestonesData.find((m) => String(m.MILESTONE || '').toUpperCase() === 'KICKOFF');
  const handoverRow = milestonesData.find((m) => String(m.MILESTONE || '').toUpperCase().includes('BÀN GIAO'));

  let startDate =
    parseFlexibleDate(kickoffM?.date) ||
    parseFlexibleDate(kickoffRow?.NGÀY_KẾ_HOẠCH) ||
    parseFlexibleDate(project?.kickoffDate) ||
    parseFlexibleDate(project?.KICKOFF_DATE) ||
    parseFlexibleDate(project?.startDate) ||
    parseFlexibleDate(project?.NGÀY_BẮT_ĐẦU);

  let endDate =
    parseFlexibleDate(handoverM?.date) ||
    parseFlexibleDate(handoverRow?.NGÀY_KẾ_HOẠCH) ||
    calcEndFromModuleStorage(projectId, 'handover') ||
    parseFlexibleDate(project?.forecastCod) ||
    parseFlexibleDate(project?.DỰ_BÁO_COD) ||
    parseFlexibleDate(codM?.date) ||
    parseFlexibleDate(project?.cod) ||
    parseFlexibleDate(project?.KẾ_HOẠCH_COD) ||
    parseFlexibleDate(project?.COD);

  return { startDate, endDate };
}
