import { normalizeToDMY, parseFlexibleDate } from './timelineDates';

/** Tách chuỗi NHÂN_SỰ thành danh sách (hỗ trợ phân cách , ; | /) */
export function parseAssignees(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Lấy tên (từ cuối) từ họ tên đầy đủ — VD: NGUYỄN ĐỨC TIẾN → Tiến */
export function getAssigneeGivenName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const given = parts[parts.length - 1];
  return given.charAt(0).toUpperCase() + given.slice(1).toLowerCase();
}

/** 1 người → họ tên đủ; từ 2 người → chỉ tên, cách nhau dấu phẩy */
export function formatAssigneeDisplay(raw, fallback = 'Chưa chỉ định') {
  const list = parseAssignees(raw);
  if (list.length === 0) return fallback;
  if (list.length === 1) return list[0];
  return list.map(getAssigneeGivenName).join(', ');
}

/** Bổ sung PROJECT_ID từ tên dự án khi sheet thiếu mã */
export function enrichTaskProjectIds(task, projects = []) {
  if (!task) return task;
  if (String(task.PROJECT_ID || '').trim()) return task;
  const name = String(task.TÊN_DỰ_ÁN || '').trim();
  if (!name || !Array.isArray(projects) || !projects.length) return task;
  const proj = projects.find(
    (p) =>
      String(p.name || p.TÊN_DỰ_ÁN || '').trim() === name ||
      String(p.id || p.PROJECT_ID || '').trim() === name
  );
  if (!proj) return task;
  return { ...task, PROJECT_ID: String(proj.id || proj.PROJECT_ID || '') };
}

/** Mô tả công việc — đồng bộ tên cột Sheet (GHI_CHÚ) và alias UI (MÔ_TẢ) */
export function getTaskDescription(task) {
  if (!task) return '';
  return String(task.MÔ_TẢ || task.GHI_CHÚ || task.MO_TA || '').trim();
}

function formatDateLocal(val) {
  return normalizeToDMY(val);
}

/** Bổ sung field hiển thị UI (ngày local, trạng thái tính toán) */
export function enrichTaskForUI(task) {
  if (!task) return null;

  const start = formatDateLocal(task.NGÀY_BẮT_ĐẦU);
  const end = formatDateLocal(task.NGÀY_KẾT_THÚC);
  const storedStatus = String(task.TRẠNG_THÁI || '').trim();
  const isCompleted = storedStatus === 'Đã hoàn thành' || storedStatus === 'Hoàn thành';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = parseFlexibleDate(start);
  const endDate = parseFlexibleDate(end);

  let status;
  if (isCompleted) {
    status = 'Đã hoàn thành';
  } else if (endDate && today > endDate) {
    status = 'Trễ';
  } else if (startDate && today >= startDate) {
    status = 'Đang diễn ra';
  } else {
    status = 'Chưa bắt đầu';
  }

  return {
    ...task,
    computedStatus: status,
    NGÀY_BẮT_ĐẦU_LOCAL: start,
    NGÀY_KẾT_THÚC_LOCAL: end,
    taskDescription: getTaskDescription(task),
  };
}

/** Nhận diện cùng một tác vụ — dùng cho cập nhật/xóa trên UI */
export function isSameTask(a, b) {
  if (!a || !b) return false;
  if (a._rowIndex != null && b._rowIndex != null && a._rowIndex === b._rowIndex) return true;

  const taskA = String(a.TÁC_VỤ || '').trim();
  const taskB = String(b.TÁC_VỤ || '').trim();
  if (!taskA || taskA !== taskB) return false;

  const pidA = String(a.PROJECT_ID || '').trim();
  const pidB = String(b.PROJECT_ID || '').trim();
  if (pidA && pidB && pidA !== pidB) return false;

  if (a.NGÀY_BẮT_ĐẦU && b.NGÀY_BẮT_ĐẦU && String(a.NGÀY_BẮT_ĐẦU) !== String(b.NGÀY_BẮT_ĐẦU)) return false;
  if (a.NGÀY_KẾT_THÚC && b.NGÀY_KẾT_THÚC && String(a.NGÀY_KẾT_THÚC) !== String(b.NGÀY_KẾT_THÚC)) return false;
  return true;
}

/** Cập nhật một field trên task và giữ các field UI đồng bộ */
export function applyTaskFieldUpdate(task, field, value) {
  const normalizedValue =
    field === 'NGÀY_BẮT_ĐẦU' || field === 'NGÀY_KẾT_THÚC'
      ? (value ? normalizeToDMY(value) || value : value)
      : value;
  const next = { ...task, [field]: normalizedValue };
  if (field === 'GHI_CHÚ') next.taskDescription = value;
  return enrichTaskForUI(next);
}

/** Payload gửi lên Google Sheet — kèm khóa đối chiếu khi đổi tên tác vụ */
export function buildTaskPayload(task, originalTask = null) {
  const match = originalTask || task;
  const description = getTaskDescription(task);

  return {
    _rowIndex: task._rowIndex,
    _matchTask: match.TÁC_VỤ,
    _matchProjectId: match.PROJECT_ID,
    _matchStart: match.NGÀY_BẮT_ĐẦU,
    _matchEnd: match.NGÀY_KẾT_THÚC,
    _matchAssignee: match.NHÂN_SỰ,
    PROJECT_ID: task.PROJECT_ID,
    TÊN_DỰ_ÁN: task.TÊN_DỰ_ÁN,
    TÁC_VỤ: task.TÁC_VỤ,
    NHÂN_SỰ: task.NHÂN_SỰ,
    NGÀY_BẮT_ĐẦU: task.NGÀY_BẮT_ĐẦU,
    NGÀY_KẾT_THÚC: task.NGÀY_KẾT_THÚC,
    BỘ_CHỨA: task.BỘ_CHỨA,
    TRẠNG_THÁI: task.TRẠNG_THÁI,
    ƯU_TIÊN: task.ƯU_TIÊN,
    GHI_CHÚ: description,
    NGƯỜI_TẠO: task.NGƯỜI_TẠO,
  };
}

/** Trường chỉ dùng trên UI, không ghi xuống Sheet */
export const UI_ONLY_TASK_FIELDS = new Set(['PINNED', 'computedStatus', 'MÔ_TẢ', 'MO_TA', 'taskDescription', 'NGÀY_BẮT_ĐẦU_LOCAL', 'NGÀY_KẾT_THÚC_LOCAL']);
