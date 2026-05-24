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
