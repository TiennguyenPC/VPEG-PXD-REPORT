import { formatDateDMY, parseFlexibleDate } from './timelineDates';

export const CONSTRUCTION_GROUP_WEIGHTS = { A: 15, B: 40, C: 30, D: 15 };

export function getConstructionGroupKey(row) {
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

export function computeConstructionProgress(rows) {
  if (!rows?.length) return 0;
  const groupTasks = { A: [], B: [], C: [], D: [] };
  rows.forEach((row) => {
    const key = getConstructionGroupKey(row);
    if (key) groupTasks[key].push(Number(row.TIẾN_ĐỘ_THỰC_TẾ || 0));
  });
  let total = 0;
  Object.entries(CONSTRUCTION_GROUP_WEIGHTS).forEach(([key, weight]) => {
    const tasks = groupTasks[key];
    const avg = tasks.length ? tasks.reduce((sum, val) => sum + val, 0) / tasks.length : 0;
    total += avg * (weight / 100);
  });
  return total;
}

function isResultComplete(val) {
  const s = String(val ?? '').trim();
  return s && s !== '-' && s !== 'N/A' && s !== '---';
}

export function computePermitProgress(rows) {
  if (!rows?.length) return 0;
  const done = rows.filter((row) => isResultComplete(row.KẾT_QUẢ_CUỐI)).length;
  return (done / rows.length) * 100;
}

export function computeDesignProgress(rows) {
  if (!rows?.length) return 0;
  const done = rows.filter((row) => isResultComplete(row.KẾT_QUẢ_CUỐI)).length;
  return (done / rows.length) * 100;
}

export function computeProcurementProgress(rows) {
  if (!rows?.length) return 0;
  const done = rows.filter((row) => row.TÌNH_TRẠNG_VẬT_TƯ === 'Đã tới site').length;
  return Math.round((done / rows.length) * 100);
}

export function computeHandoverProgress(rows) {
  if (!rows?.length) return 0;
  const done = rows.filter((row) => isResultComplete(row.KẾT_QUẢ_CUỐI)).length;
  return Math.round((done / rows.length) * 100);
}

/** Vật tư chính (pin, inverter) — điều kiện TT đợt 2 / B8 */
const MAIN_PROCUREMENT_RE = [/tấm pin|pin pv/i, /biến tần|inverter/i];

function procurementItemName(row) {
  return String(row?.HẠNG_MỤC_MUA_HÀNG || row?.HẠNG_MỤC || '').trim();
}

export function evaluateMainMaterialDelivery(rows) {
  if (!rows?.length) {
    return { achieved: false, note: 'Chưa có dữ liệu module Vật tư' };
  }
  const mainRows = rows.filter((r) => MAIN_PROCUREMENT_RE.some((re) => re.test(procurementItemName(r))));
  if (!mainRows.length) {
    return { achieved: false, note: 'Chưa có pin / inverter trong module Vật tư' };
  }
  const pending = mainRows.filter((r) => r.TÌNH_TRẠNG_VẬT_TƯ !== 'Đã tới site');
  if (pending.length) {
    const names = pending.map((r) => procurementItemName(r)).slice(0, 2).join(', ');
    return {
      achieved: false,
      note: `Chưa về site: ${names}${pending.length > 2 ? '…' : ''}`,
    };
  }
  return { achieved: true, note: null };
}

function pickConstructionCompletionDate(row) {
  const raw = row?.NGÀY_HT_THỰC_TẾ || row?.NGÀY_KẾT_THÚC || '';
  const s = String(raw || '').trim();
  if (!s || s === '-') return null;
  return parseFlexibleDate(s);
}

/** Hoàn thành hạng mục C — tất cả CV nhóm C đạt 100%; ngày = HT thực tế muộn nhất */
export function evaluateConstructionGroupCComplete(rows) {
  if (!rows?.length) {
    return { achieved: false, completionDate: '', note: 'Chưa có dữ liệu module Thi công' };
  }
  const groupRows = rows.filter((r) => getConstructionGroupKey(r) === 'C');
  if (!groupRows.length) {
    return { achieved: false, completionDate: '', note: 'Chưa có công việc hạng mục C' };
  }
  const incomplete = groupRows.filter((r) => Number(r.TIẾN_ĐỘ_THỰC_TẾ || 0) < 100);
  if (incomplete.length) {
    return {
      achieved: false,
      completionDate: '',
      note: `Còn ${incomplete.length}/${groupRows.length} công việc hạng mục C`,
    };
  }
  const dates = groupRows.map(pickConstructionCompletionDate).filter(Boolean);
  const completionDate = dates.length
    ? formatDateDMY(new Date(Math.max(...dates.map((d) => d.getTime()))))
    : '';
  return { achieved: true, completionDate, note: null };
}

/** Bàn giao / nghiệm thu — tất cả hạng mục con phải có kết quả cuối */
export function evaluateHandoverAcceptance(rows) {
  if (!rows?.length) {
    return { achieved: false, note: 'Chưa có dữ liệu module Bàn giao', incompleteCount: 0 };
  }
  const incomplete = rows.filter((row) => !isResultComplete(row.KẾT_QUẢ_CUỐI));
  if (incomplete.length) {
    return {
      achieved: false,
      incompleteCount: incomplete.length,
      note: `Còn ${incomplete.length}/${rows.length} hạng mục chưa hoàn thành`,
    };
  }
  return { achieved: true, note: null, incompleteCount: 0 };
}

export function computeModuleProgressFromBundle(bundle) {
  if (!bundle) return null;
  return {
    permit: computePermitProgress(bundle.permits),
    design: computeDesignProgress(bundle.designs),
    procurement: computeProcurementProgress(bundle.procurements),
    construction: computeConstructionProgress(bundle.constructions),
    handover: computeHandoverProgress(bundle.handovers),
  };
}
