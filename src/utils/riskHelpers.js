/** Chuẩn hóa mức độ rủi ro từ sheet / module chi tiết dự án */
export function normalizeRiskSeverity(level) {
  const raw = String(level || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (['CAO', 'HIGH', 'CRITICAL'].includes(raw)) return 'Cao';
  if (['TRUNG BINH', 'MEDIUM', 'TB'].includes(raw)) return 'Trung bình';
  if (['THAP', 'LOW'].includes(raw)) return 'Thấp';
  return String(level || '').trim();
}

export function isRiskSeverityMediumOrHigher(level) {
  const n = normalizeRiskSeverity(level);
  return n === 'Cao' || n === 'Trung bình';
}

export function isRiskActive(status) {
  const s = String(status || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return s !== 'DA DONG' && s !== 'CLOSED' && s !== 'ĐÃ ĐÓNG';
}

/** Badge mức độ — đủ tương phản trên light + dark */
export function getRiskSeverityStyle(level) {
  const n = normalizeRiskSeverity(level);
  switch (n) {
    case 'Cao':
      return 'text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-500/15 dark:border-red-500/40';
    case 'Trung bình':
      return 'text-amber-800 bg-amber-100 border-amber-300 dark:text-orange-300 dark:bg-orange-500/15 dark:border-orange-500/40';
    case 'Thấp':
      return 'text-emerald-800 bg-emerald-100 border-emerald-300 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/40';
    default:
      return 'text-slate-600 bg-slate-100 border-slate-300 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/25';
  }
}

export function getRiskSeverityRowAccent(level) {
  const n = normalizeRiskSeverity(level);
  switch (n) {
    case 'Cao': return 'border-l-red-500';
    case 'Trung bình': return 'border-l-amber-500';
    case 'Thấp': return 'border-l-emerald-500';
    default: return 'border-l-slate-300';
  }
}

export function normalizeRiskStatus(status) {
  const raw = String(status || '').trim();
  const upper = raw.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (upper === 'OPEN') return 'Open';
  if (upper === 'DANG XU LY' || upper === 'IN PROGRESS') return 'Đang xử lý';
  if (upper === 'THEO DOI' || upper === 'WATCH') return 'Theo dõi';
  if (upper === 'DA DONG' || upper === 'CLOSED') return 'Đã đóng';
  return raw || 'Open';
}

export function getRiskStatusStyle(status) {
  const n = normalizeRiskStatus(status);
  switch (n) {
    case 'Open':
      return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/25';
    case 'Đang xử lý':
      return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/25';
    case 'Theo dõi':
      return 'text-amber-800 bg-amber-50 border-amber-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/25';
    case 'Đã đóng':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/25';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/25';
  }
}

export function buildOverviewRiskRows(allRisks, projects = []) {
  const projectById = new Map();
  (projects || []).forEach((p) => {
    const id = String(p.id || p.PROJECT_ID || '');
    if (id) projectById.set(id, p);
  });

  const fromRiskSheet = (allRisks || [])
    .filter((r) => isRiskSeverityMediumOrHigher(r.MỨC_ĐỘ) && isRiskActive(r.TRẠNG_THÁI))
    .map((r) => {
      const pId = String(r.PROJECT_ID || r.projectId || '');
      const proj = projectById.get(pId);
      return {
        project: proj?.name || r.TÊN_DỰ_ÁN || 'Dự án',
        id: pId,
        issue: r.NỘI_DUNG || r.ẢNH_HƯỞNG || 'Chưa cập nhật chi tiết',
        assignee: r.PHỤ_TRÁCH || proj?.pm || 'Chưa rõ',
        level: normalizeRiskSeverity(r.MỨC_ĐỘ) || r.MỨC_ĐỘ,
        status: r.TRẠNG_THÁI,
      };
    });

  if (fromRiskSheet.length > 0) {
    return fromRiskSheet.sort((a, b) => {
      const weight = { Cao: 2, 'Trung bình': 1 };
      return (weight[b.level] || 0) - (weight[a.level] || 0);
    });
  }

  // Fallback: cột RISK_LEVEL trên bảng dự án (khi API risks chưa có)
  return (projects || [])
    .filter((p) => isRiskSeverityMediumOrHigher(p.risk))
    .map((p) => ({
      project: p.name,
      id: p.id || p.PROJECT_ID,
      issue: p.issue && p.issue !== 'Không có' ? p.issue : 'Chưa cập nhật chi tiết',
      assignee: p.pm || 'Chưa rõ',
      level: normalizeRiskSeverity(p.risk) || p.risk,
      status: 'Open',
    }))
    .sort((a, b) => {
      const weight = { Cao: 2, 'Trung bình': 1 };
      return (weight[b.level] || 0) - (weight[a.level] || 0);
    });
}
