import { formatDateDMY, normalizeToDMY, parseFlexibleDate } from './timelineDates';
import {
  evaluateHandoverAcceptance,
  evaluateMainMaterialDelivery,
  evaluateConstructionGroupCComplete,
} from './moduleProgress';

/** Các mốc theo dõi HĐ EPC — nhập ẩn, không hiển thị trên timeline chính */
export const CONTRACT_TRACKING_GROUPS = [
  {
    id: 'launch',
    title: 'Triển khai & Kickoff',
    fields: [
      { key: 'contractSigned', label: 'Ký hợp đồng' },
      { key: 'advancePayment', label: 'Tạm ứng đợt 1' },
      { key: 'projectStart', label: 'Triển khai dự án (email PXD)' },
      { key: 'kickoff', label: 'Kickoff', sync: 'kickoffDate' },
    ],
  },
  {
    id: 'permit',
    title: 'Giấy phép',
    fields: [
      {
        key: 'legalDocsComplete',
        label: 'NM cung cấp đủ hồ sơ',
        hint: 'Chỉ tính GP khi đủ hồ sơ (và đã tạm ứng)',
      },
      {
        key: 'permitCompleted',
        label: 'Hoàn thành giấy phép',
        linkedModule: 'permit',
        linkedDate: 'end',
        linkedLabel: 'Module Giấy phép',
      },
    ],
  },
  {
    id: 'construction',
    title: 'Thi công',
    fields: [
      {
        key: 'constructionStart',
        label: 'Bắt đầu thi công',
        linkedModule: 'construction',
        linkedDate: 'start',
        linkedLabel: 'Module Thi công',
      },
      { key: 'paymentPhase2', label: 'Thanh toán đợt 2' },
      {
        key: 'constructionComplete',
        label: 'Hoàn thành lắp đặt (xong hạng mục C)',
        linkedConstructionGroup: 'C',
        linkedLabel: 'Module Thi công · Hạng mục C',
      },
    ],
  },
  {
    id: 'procurement',
    title: 'Mua hàng',
    fields: [
      {
        key: 'materialDelivery',
        label: 'Giao vật tư chính (pin, inverter…)',
        hint: 'Sau khi bắt đầu thi công',
      },
    ],
  },
  {
    id: 'handover',
    title: 'Bàn giao & thanh toán cuối',
    fields: [
      { key: 'paymentPhase3', label: 'Thanh toán đợt 3' },
      {
        key: 'handoverComplete',
        label: 'Bàn giao / Nghiệm thu',
        linkedModule: 'handover',
        linkedDate: 'end',
        linkedLabel: 'Module Bàn giao hồ sơ',
      },
      { key: 'paymentPhase4', label: 'Thanh toán đợt 4 (sau handover)' },
      { key: 'cod', label: 'COD / Đóng điện', sync: 'codDate' },
    ],
  },
];

export const EMPTY_CONTRACT_TRACKING = Object.fromEntries(
  CONTRACT_TRACKING_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, '']))
);

const LINKED_FIELD_KEYS = new Set(
  CONTRACT_TRACKING_GROUPS.flatMap((g) =>
    g.fields.filter((f) => f.linkedModule || f.linkedConstructionGroup).map((f) => f.key)
  )
);

export function isAutoContractTrackingField(field) {
  return !!(field?.linkedModule || field?.linkedConstructionGroup);
}

/** Ngày kế hoạch từ module — chỉ tham chiếu, không tích xanh */
function getLinkedPlanDate(data, key) {
  if (!LINKED_FIELD_KEYS.has(key) || !data?.[key]) return null;
  return data[key];
}

/** Hoàn thành thực tế: có ngày xác nhận (nhập tay) và không ở tương lai */
export function isTrackingDateAchieved(data, key) {
  const dateStr = data?.[key];
  if (!dateStr || LINKED_FIELD_KEYS.has(key)) return false;
  const d = parseFlexibleDate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
}

function handoverDelayNote(planEnd, achieved, baseNote) {
  if (achieved || !planEnd) return baseNote || null;
  const plan = parseFlexibleDate(planEnd);
  if (!plan) return baseNote || null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  plan.setHours(0, 0, 0, 0);
  if (today.getTime() <= plan.getTime()) return baseNote || null;
  const days = Math.floor((today.getTime() - plan.getTime()) / (86400000));
  const delay = `Chậm ${days} ngày so với KH bàn giao (${planEnd})`;
  return baseNote ? `${baseNote} · ${delay}` : delay;
}

/** B8 vật tư chính & B12 bàn giao — kiểm tra dữ liệu module; còn lại giữ logic ngày xác nhận */
export function resolveTrackingStep(data, key, moduleContext = null) {
  const ctx = moduleContext || {};

  if (key === 'materialDelivery') {
    const ev = evaluateMainMaterialDelivery(ctx.procurements);
    return {
      achieved: ev.achieved,
      moduleNote: ev.achieved ? null : ev.note,
      planDate: null,
      displayDate: '',
    };
  }

  if (key === 'handoverComplete') {
    const ev = evaluateHandoverAcceptance(ctx.handovers);
    const planEnd = ctx.projectId
      ? getModuleScheduleDate(ctx.projectId, 'handover', 'end')
      : (getLinkedPlanDate(data, key) || '');
    const moduleNote = handoverDelayNote(planEnd, ev.achieved, ev.note);
    return {
      achieved: ev.achieved,
      moduleNote: ev.achieved ? null : moduleNote,
      planDate: !ev.achieved && planEnd ? planEnd : null,
      displayDate: '',
    };
  }

  if (key === 'constructionComplete') {
    const ev = evaluateConstructionGroupCComplete(ctx.constructions);
    return {
      achieved: ev.achieved,
      moduleNote: ev.achieved ? null : ev.note,
      planDate: null,
      displayDate: ev.achieved ? (ev.completionDate || '') : '',
    };
  }

  const achieved = isTrackingDateAchieved(data, key);
  return {
    achieved,
    moduleNote: null,
    planDate: getLinkedPlanDate(data, key),
    displayDate: achieved ? (data[key] || '') : '',
  };
}

function isStepAchieved(data, key, moduleContext) {
  return resolveTrackingStep(data, key, moduleContext).achieved;
}

/** Ngày bắt đầu / kết thúc từ header module (localStorage hoặc sheet) */
export function getModuleScheduleDate(projectId, moduleKey, kind = 'end', sheetRows = null) {
  if (!projectId) return '';

  const calcEnd = (start, days) => {
    if (!start || days === '' || days == null) return '';
    const d = parseFlexibleDate(start);
    if (!d) return '';
    d.setDate(d.getDate() + parseInt(days, 10));
    return formatDateDMY(d);
  };

  if (Array.isArray(sheetRows) && sheetRows.length) {
    const row = sheetRows.find((r) => r.NGÀY_BẮT_ĐẦU_MODULE || r.SỐ_NGÀY_MODULE);
    if (row) {
      const start = normalizeToDMY(row.NGÀY_BẮT_ĐẦU_MODULE) || '';
      const days = row.SỐ_NGÀY_MODULE;
      if (kind === 'start') return start;
      return calcEnd(start, days);
    }
  }

  try {
    const raw = localStorage.getItem(`dates_${moduleKey}_${projectId}`);
    if (!raw) return '';
    const { start, days } = JSON.parse(raw);
    const startD = normalizeToDMY(start) || '';
    if (kind === 'start') return startD;
    return calcEnd(startD, days);
  } catch {
    return '';
  }
}

/** Gắn ngày từ module — không nhập trùng trong Theo dõi HĐ */
export function enrichContractTrackingWithModuleDates(tracking, projectId, moduleContext = null) {
  const out = { ...tracking };
  CONTRACT_TRACKING_GROUPS.forEach((group) => {
    group.fields.forEach((field) => {
      if (!field.linkedModule) return;
      const linked = getModuleScheduleDate(
        projectId,
        field.linkedModule,
        field.linkedDate || 'end'
      );
      out[field.key] = linked || '';
    });
  });
  const constructions = moduleContext?.constructions;
  if (Array.isArray(constructions)) {
    const ev = evaluateConstructionGroupCComplete(constructions);
    out.constructionComplete = ev.achieved ? (ev.completionDate || '') : '';
  }
  return out;
}

/** Thứ tự quy trình HĐ EPC — dùng cho sơ đồ & gợi ý bước tiếp theo */
export const CONTRACT_FLOW_STEPS = [
  {
    step: 1,
    key: 'contractSigned',
    label: 'Ký hợp đồng',
    action: 'Ký HĐ với khách hàng',
    nextHint: 'Thu tạm ứng đợt 1',
  },
  {
    step: 2,
    key: 'advancePayment',
    label: 'Tạm ứng đợt 1',
    requires: ['contractSigned'],
    action: 'Xác nhận CĐT đã tạm ứng',
    nextHint: 'Sale Admin email PXD → triển khai dự án',
  },
  {
    step: 3,
    key: 'projectStart',
    label: 'Triển khai dự án',
    requires: ['advancePayment'],
    action: 'PXD nhận email triển khai (ngày bắt đầu dự án)',
    nextHint: 'Tổ chức họp Kickoff',
  },
  {
    step: 4,
    key: 'kickoff',
    label: 'Kickoff',
    requires: ['projectStart'],
    action: 'Họp kickoff dự án',
    nextHint: 'Song song: xin GP + mobilize công trường',
  },
  {
    step: 5,
    key: 'legalDocsComplete',
    label: 'NM đủ hồ sơ',
    requires: ['kickoff'],
    parallelTrack: 'permit',
    action: 'NM cung cấp đủ hồ sơ pháp lý',
    nextHint: 'Mở song song: B6 xin GP · B7 bắt đầu thi công',
  },
  {
    step: 6,
    key: 'permitCompleted',
    label: 'Hoàn thành GP',
    requires: ['legalDocsComplete'],
    parallelTrack: 'permit',
    action: 'Hoàn tất giấy phép (song song thi công B7–10)',
    nextHint: 'Bắt buộc trước COD (B14)',
  },
  {
    step: 7,
    key: 'constructionStart',
    label: 'Bắt đầu thi công',
    requires: ['legalDocsComplete'],
    parallelTrack: 'construction',
    action: 'Mobilize khi đủ hồ sơ — không cần chờ xong GP (B6)',
    nextHint: 'Giao vật tư chính (pin, inverter…)',
  },
  {
    step: 8,
    key: 'materialDelivery',
    label: 'Giao vật tư chính',
    requires: ['constructionStart'],
    parallelTrack: 'construction',
    action: 'Giao pin, inverter, khung, cáp…',
    nextHint: 'Chờ CĐT thanh toán đợt 2',
  },
  {
    step: 9,
    key: 'paymentPhase2',
    label: 'Thanh toán đợt 2',
    requires: ['materialDelivery'],
    parallelTrack: 'construction',
    action: 'Xác nhận TT đợt 2',
    nextHint: 'Tiếp tục thi công lắp đặt',
  },
  {
    step: 10,
    key: 'constructionComplete',
    label: 'Hoàn thành lắp đặt',
    requires: ['paymentPhase2'],
    parallelTrack: 'construction',
    softRequires: ['permitCompleted'],
    action: 'Xong hạng mục thi công / lắp đặt',
    nextHint: 'Thanh toán đợt 3',
  },
  {
    step: 11,
    key: 'paymentPhase3',
    label: 'Thanh toán đợt 3',
    requires: ['constructionComplete'],
    action: 'Xác nhận TT đợt 3',
    nextHint: 'Bàn giao / nghiệm thu',
  },
  {
    step: 12,
    key: 'handoverComplete',
    label: 'Bàn giao / Nghiệm thu',
    requires: ['paymentPhase3'],
    action: 'Hoàn tất bàn giao hồ sơ & nghiệm thu',
    nextHint: 'Thanh toán đợt 4 + COD',
  },
  {
    step: 13,
    key: 'paymentPhase4',
    label: 'Thanh toán đợt 4',
    requires: ['handoverComplete'],
    action: 'Xác nhận TT đợt 4 (sau handover)',
    nextHint: 'Đóng điện COD',
  },
  {
    step: 14,
    key: 'cod',
    label: 'COD / Đóng điện',
    requires: ['paymentPhase4', 'permitCompleted'],
    action: 'Hoàn tất COD',
    nextHint: 'Kết thúc quy trình HĐ',
  },
];

/** Bố cục sơ đồ — B5 là mốc mở nhánh; B6 GP ∥ B7–10 TC */
export const CONTRACT_FLOW_DIAGRAM = {
  title: '14 bước quy trình HĐ EPC',
  prelude: {
    label: 'B1 → B4 · Khởi động',
    keys: ['contractSigned', 'advancePayment', 'projectStart', 'kickoff'],
  },
  gate: {
    key: 'legalDocsComplete',
    caption: 'B5 · Đủ hồ sơ → mở xin GP (B6) + bắt TC (B7) song song',
  },
  parallel: {
    label: 'Không cần xong GP mới thi công — B6 và B7–10 chạy song song sau B5',
    permit: {
      label: 'B6 · Xin / hoàn thành GP',
      keys: ['permitCompleted'],
    },
    tc: {
      label: 'B7 → B10 · Thi công & TT2',
      keys: ['constructionStart', 'materialDelivery', 'paymentPhase2', 'constructionComplete'],
    },
  },
  finale: {
    label: 'B11 → B14 · Bàn giao & COD',
    keys: ['paymentPhase3', 'handoverComplete', 'paymentPhase4', 'cod'],
  },
  sequenceHint:
    'B1→B4 → B5 đủ HS → [B6 xin GP ∥ B7 bắt TC→B8 giao VT→B9 TT2→B10 HT] → B11→B14 COD (COD bắt buộc B6 xong GP)',
};

const STEP_LABEL_BY_KEY = Object.fromEntries(CONTRACT_FLOW_STEPS.map((s) => [s.key, s.label]));
const STEP_NUM_BY_KEY = Object.fromEntries(CONTRACT_FLOW_STEPS.map((s) => [s.key, s.step]));

/** Điều kiện từng đợt thanh toán — hiển thị tab TT */
export const CONTRACT_PAYMENT_PHASES = [
  {
    phase: 1,
    key: 'advancePayment',
    label: 'Tạm ứng đợt 1',
    flowStep: 2,
    requires: ['contractSigned'],
    checkpoints: [
      { key: 'contractSigned', label: 'Ký hợp đồng' },
    ],
    unlocks: 'Mở B3 Triển khai, B4 Kickoff, B5 NM đủ hồ sơ',
  },
  {
    phase: 2,
    key: 'paymentPhase2',
    label: 'Thanh toán đợt 2',
    flowStep: 9,
    requires: ['materialDelivery'],
    checkpoints: [
      { key: 'legalDocsComplete', label: 'NM đủ hồ sơ' },
      { key: 'constructionStart', label: 'Bắt đầu thi công' },
      { key: 'materialDelivery', label: 'Giao vật tư chính' },
    ],
    note: 'B6 xin GP chạy song song — không chặn TT đợt 2',
  },
  {
    phase: 3,
    key: 'paymentPhase3',
    label: 'Thanh toán đợt 3',
    flowStep: 11,
    requires: ['constructionComplete'],
    checkpoints: [
      { key: 'paymentPhase2', label: 'TT đợt 2' },
      { key: 'constructionComplete', label: 'Hoàn thành lắp đặt' },
    ],
    note: 'Nên xong GP (B6) trước nghiệm thu',
  },
  {
    phase: 4,
    key: 'paymentPhase4',
    label: 'Thanh toán đợt 4',
    flowStep: 13,
    requires: ['handoverComplete'],
    checkpoints: [
      { key: 'paymentPhase3', label: 'TT đợt 3' },
      { key: 'handoverComplete', label: 'Bàn giao / Nghiệm thu' },
    ],
  },
];

export const CONTRACT_COD_GATE = {
  key: 'cod',
  label: 'COD / Đóng điện',
  flowStep: 14,
  requires: ['paymentPhase4', 'permitCompleted'],
  checkpoints: [
    { key: 'paymentPhase4', label: 'TT đợt 4' },
    { key: 'permitCompleted', label: 'Hoàn thành GP' },
  ],
};

const PARALLEL_TRACK_LABELS = {
  permit: 'GP',
  construction: 'TC',
};

export function buildContractFlowState(data, moduleContext = null) {
  const d = data || {};
  const trackCurrentAssigned = {};

  return CONTRACT_FLOW_STEPS.map((def) => {
    const step = resolveTrackingStep(d, def.key, moduleContext);
    const rawDate = d[def.key] || '';
    let date = step.displayDate || '';
    let done = step.achieved;
    let planDate = step.planDate;

    if (def.key === 'cod' && rawDate && !isStepAchieved(d, 'paymentPhase4', moduleContext)) {
      if (!planDate) planDate = rawDate;
      date = '';
      done = false;
    } else if (!['materialDelivery', 'handoverComplete'].includes(def.key) && step.achieved) {
      date = rawDate;
    }

    const requires = def.requires || [];
    const unmet = requires.filter((k) => !isStepAchieved(d, k, moduleContext));
    const requiresMet = unmet.length === 0;
    const softUnmet = (def.softRequires || []).filter((k) => !isStepAchieved(d, k, moduleContext));
    const track = def.parallelTrack || 'main';

    let status;
    if (done) {
      status = 'done';
    } else if (!requiresMet) {
      status = 'blocked';
    } else if (!trackCurrentAssigned[track]) {
      status = 'current';
      trackCurrentAssigned[track] = true;
    } else {
      status = 'waiting';
    }

    const blockedReason = unmet.length
      ? `Cần hoàn thành: ${unmet.map((k) => `B${STEP_NUM_BY_KEY[k] || '?'} ${STEP_LABEL_BY_KEY[k] || k}`).join(', ')}`
      : null;

    const softWarning = softUnmet.length && status !== 'blocked'
      ? `Gợi ý: ${softUnmet.map((k) => STEP_LABEL_BY_KEY[k] || k).join(', ')} (có thể song song GP/TC)`
      : null;

    return {
      ...def,
      date,
      planDate,
      status,
      blockedReason,
      softWarning,
      trackLabel: PARALLEL_TRACK_LABELS[track] || null,
    };
  });
}

/** Bước đang làm chính + các nhánh song song */
export function resolveFlowPosition(steps) {
  if (!steps?.length) return null;

  if (steps.every((s) => s.status === 'done')) {
    return { kind: 'complete', headline: 'Đã hoàn tất B14 · COD' };
  }

  const current = steps.filter((s) => s.status === 'current').sort((a, b) => a.step - b.step);
  if (current.length) {
    const primary = current[0];
    return {
      kind: 'current',
      headline: `Đang ở B${primary.step} · ${primary.label}`,
      action: primary.action,
      primary,
      parallel: current.slice(1),
    };
  }

  const next = steps.find((s) => s.status === 'blocked' || s.status === 'waiting');
  if (next) {
    return {
      kind: 'waiting',
      headline: `Tiếp theo: B${next.step} · ${next.label}`,
      action: next.blockedReason || next.action,
      primary: next,
    };
  }

  return null;
}

export function buildPaymentPhaseState(data, steps, moduleContext = null) {
  const d = data || {};

  const buildGate = (gate, isPayment = false) => {
    const checkpoints = gate.checkpoints.map((cp) => {
      const step = resolveTrackingStep(d, cp.key, moduleContext);
      return {
        ...cp,
        step: STEP_NUM_BY_KEY[cp.key],
        done: step.achieved,
        planDate: step.planDate,
        moduleNote: step.moduleNote,
        label: cp.label,
        fullLabel: `B${STEP_NUM_BY_KEY[cp.key] || '?'} · ${cp.label}`,
      };
    });
    const unmet = gate.requires.filter((k) => !isStepAchieved(d, k, moduleContext));
    const gateStep = resolveTrackingStep(d, gate.key, moduleContext);
    const achieved = gateStep.achieved;
    let date = achieved ? (d[gate.key] || gateStep.displayDate || '') : '';
    let planDate = null;
    let paid = achieved;

    if (gate.key === 'cod') {
      const codPlan = d.cod && !achieved ? d.cod : null;
      if (codPlan && unmet.length > 0) planDate = codPlan;
    }

    let status = 'blocked';
    if (paid && unmet.length === 0) status = 'done';
    else if (!paid && unmet.length === 0) status = 'ready';

    return {
      ...gate,
      isPayment,
      paid: status === 'done',
      date: status === 'done' ? date : '',
      planDate,
      status,
      checkpoints,
      missing: unmet.map((k) => `B${STEP_NUM_BY_KEY[k]} · ${STEP_LABEL_BY_KEY[k]}`),
    };
  };

  return {
    payments: CONTRACT_PAYMENT_PHASES.map((p) => buildGate(p, true)),
    cod: buildGate(CONTRACT_COD_GATE, false),
  };
}

export function countFlowProgress(steps) {
  const done = steps.filter((s) => s.status === 'done').length;
  return { done, total: steps.length, percent: Math.round((done / steps.length) * 100) };
}

export function parseContractTracking(raw, project = null) {
  const base = { ...EMPTY_CONTRACT_TRACKING };
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    Object.assign(base, raw);
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      Object.assign(base, JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }
  if (project) {
    const start = project.startDate || project.NGÀY_BẮT_ĐẦU;
    const kickoff = project.kickoffDate || project.KICKOFF_DATE;
    const cod = project.cod || project.codDate || project.KẾ_HOẠCH_COD;
    if (start && start !== '-') base.projectStart = normalizeToDMY(start) || start;
    if (kickoff && kickoff !== '-') base.kickoff = normalizeToDMY(kickoff) || kickoff;
    if (cod && cod !== '-') base.cod = normalizeToDMY(cod) || cod;
  }
  return base;
}

export function serializeContractTracking(data) {
  const out = {};
  for (const key of Object.keys(EMPTY_CONTRACT_TRACKING)) {
    if (LINKED_FIELD_KEYS.has(key)) continue;
    const v = data?.[key];
    if (v) out[key] = normalizeToDMY(v) || v;
  }
  return out;
}

/** Cộng n ngày làm việc (T2–T6) */
export function addWorkingDays(startDate, days) {
  const start = parseFlexibleDate(startDate);
  if (!start || !days) return null;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return d;
}

function laterDate(a, b) {
  const da = parseFlexibleDate(a);
  const db = parseFlexibleDate(b);
  if (!da && !db) return null;
  if (!da) return b;
  if (!db) return a;
  return da.getTime() >= db.getTime() ? a : b;
}

/** Hạn kế hoạch theo mẫu HĐ 60 ngày làm việc (hình OSAKA / AFOTECH loại 1&3) */
export function calcContractDeadlines(data, moduleContext = null) {
  const d = data || {};
  const achieved = (key) => (isStepAchieved(d, key, moduleContext) ? (d[key] || '✓') : '');
  const permitBase = laterDate(d.legalDocsComplete, d.advancePayment);
  const permitDeadline = permitBase ? addWorkingDays(permitBase, 60) : null;
  const constructionStartBase = laterDate(d.kickoff, d.permitCompleted);
  const constructionStartDeadline = constructionStartBase
    ? addWorkingDays(constructionStartBase, 60)
    : null;
  const completionFromP2 = d.paymentPhase2 ? addWorkingDays(d.paymentPhase2, 60) : null;
  const completionFromAdvance = d.advancePayment ? addWorkingDays(d.advancePayment, 85) : null;

  return [
    {
      key: 'permit',
      label: 'Hạn GP (≤60 ngày LV từ đủ HS + tạm ứng)',
      date: permitDeadline,
      actual: achieved('permitCompleted'),
    },
    {
      key: 'constructionStart',
      label: 'Hạn bắt đầu TC (≤60 ngày LV từ Kickoff / xong GP)',
      date: constructionStartDeadline,
      actual: achieved('constructionStart'),
    },
    {
      key: 'delivery',
      label: 'Hạn giao VT (≤60 ngày LV từ bắt đầu TC)',
      date: d.constructionStart ? addWorkingDays(d.constructionStart, 60) : null,
      actual: achieved('materialDelivery'),
    },
    {
      key: 'completionP2',
      label: 'Hạn HT (≤60 ngày LV từ TT đợt 2)',
      date: completionFromP2,
      actual: achieved('constructionComplete'),
    },
    {
      key: 'completionAdvance',
      label: 'Hạn HT (≤85 ngày LV từ tạm ứng — mẫu AFOTECH)',
      date: completionFromAdvance,
      actual: achieved('constructionComplete'),
    },
  ].filter((row) => row.date);
}

export function deadlineStatus(deadline, actual) {
  const dl = parseFlexibleDate(deadline);
  const ac = parseFlexibleDate(actual);
  if (!dl) return 'pending';
  if (ac) {
    const a = new Date(ac);
    a.setHours(0, 0, 0, 0);
    const d = new Date(dl);
    d.setHours(0, 0, 0, 0);
    return a.getTime() <= d.getTime() ? 'ok' : 'late';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime() > dl.getTime() ? 'overdue' : 'pending';
}

/** Ngày Kickoff trên trục milestone — chỉ từ Theo dõi HĐ, không fallback project/sheet */
export function getContractKickoffDate(project) {
  const projectId = project?.PROJECT_ID || project?.id;
  const tracking = enrichContractTrackingWithModuleDates(
    parseContractTracking(project?.THEO_DÕI_HĐ || project?.contractTracking, null),
    projectId
  );
  const raw = tracking.kickoff || '';
  if (!raw || raw === '-') return '';
  return normalizeToDMY(raw) || raw;
}

/** COD chỉ hiện khi đã nhập — không fallback ngày mặc định hay milestone sheet ảo */
export function resolveExplicitCodDate(project, contractDates = null) {
  const dates = contractDates ?? getContractMilestoneDates(project);
  const fromTracking = dates?.cod;
  if (fromTracking && fromTracking !== '-') {
    return normalizeToDMY(fromTracking) || fromTracking;
  }
  const raw = project?.KẾ_HOẠCH_COD || project?.cod || project?.codDate || project?.COD || '';
  if (!raw || raw === '-' || raw === '—') return '';
  return normalizeToDMY(raw) || raw;
}

/** Ngày KICKOFF / COD / bàn giao cho trục milestone */
export function getContractMilestoneDates(project) {
  const projectId = project?.PROJECT_ID || project?.id;
  const tracking = enrichContractTrackingWithModuleDates(
    parseContractTracking(project?.THEO_DÕI_HĐ || project?.contractTracking, null),
    projectId
  );
  return {
    kickoff: tracking.kickoff || '',
    cod: tracking.cod || '',
    handover: tracking.handoverComplete || '',
  };
}

/** Chỉ đẩy KICKOFF + COD ra dự án / trục milestone — không sync triển khai dự án */
export function buildSyncFieldsFromTracking(data) {
  const sync = {};
  if (data.kickoff) {
    sync.kickoffDate = data.kickoff;
    sync.KICKOFF_DATE = data.kickoff;
  }
  if (data.cod) {
    sync.codDate = data.cod;
    sync.cod = data.cod;
    sync.KẾ_HOẠCH_COD = data.cod;
  }
  return sync;
}

export function formatDeadlineLabel(date) {
  if (!date) return '—';
  return formatDateDMY(date instanceof Date ? date : parseFlexibleDate(date));
}
