/** Role hiển thị trên UI */
export const ROLE_LABELS = {
  admin: 'Admin',
  pm: 'PM',
  sm: 'SM',
  gs: 'GS',
  sa: 'SA',
  tk: 'TK',
  psc: 'P.SC',
  employee: 'Nhân viên',
  manager: 'Quản lý',
};

/** Role có thể tạo qua UI (không gồm Admin) */
export const CREATABLE_ROLES = [
  { value: 'pm', label: 'PM' },
  { value: 'sm', label: 'SM' },
  { value: 'gs', label: 'GS' },
  { value: 'sa', label: 'SA' },
  { value: 'tk', label: 'TK' },
  { value: 'psc', label: 'P.SC' },
  { value: 'employee', label: 'Nhân viên' },
];

/** PM/SM — gán dự án, sửa dự án được gán */
export const PROJECT_EDITOR_ROLES = ['pm', 'sm'];

/** Chuẩn hóa tên để so khớp NHÂN_SỰ ↔ DISPLAY_NAME */
export function normalizePersonName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim();
}

export function namesMatch(a, b) {
  const na = normalizePersonName(a);
  const nb = normalizePersonName(b);
  if (!na || !nb) return false;
  return na === nb;
}

export function isAssignedToProject(user, projectId) {
  if (!projectId) return false;
  const pid = String(projectId).trim();
  const assigned = user?.assignedProjects || [];
  return assigned.some((id) => String(id).trim() === pid);
}

export function canEditProject(user, projectId) {
  if (isAdmin(user)) return true;
  return isAssignedToProject(user, projectId);
}

/** Chỉ người được phân công (NHÂN_SỰ) hoặc Admin mới sửa task */
export function canEditTask(user, task) {
  if (isAdmin(user)) return true;
  if (!task) return false;
  return namesMatch(user?.displayName, task.NHÂN_SỰ);
}

export function canCreateTask(user) {
  if (isAdmin(user)) return true;
  return isProjectEditorRole(user?.role);
}

export function canDeleteTask(user, task) {
  return canEditTask(user, task);
}

export function getRoleLabel(role) {
  const key = String(role || '').toLowerCase().replace(/\./g, '');
  return ROLE_LABELS[key] || String(role || '').toUpperCase();
}

export function isAdmin(user) {
  return String(user?.role || '').toLowerCase() === 'admin';
}

/** Chỉ admin chủ (tien.nguyen) được bật/copy link chia sẻ khách */
const PROJECT_SHARE_ADMIN_USERNAMES = ['tien.nguyen'];

export function canShareProjectWithClient(user) {
  if (!isAdmin(user)) return false;
  const username = String(user?.username || '').trim().toLowerCase();
  return PROJECT_SHARE_ADMIN_USERNAMES.includes(username);
}

export function isProjectEditorRole(role) {
  return PROJECT_EDITOR_ROLES.includes(String(role || '').toLowerCase());
}

/** Mọi role (trừ Admin) đều có thể được gán dự án */
export function canAssignProjects(role) {
  return String(role || '').toLowerCase() !== 'admin';
}

/** Chữ cái đầu avatar từ họ tên */
export function getUserInitials(displayName) {
  const parts = String(displayName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return String(displayName || 'NV').slice(0, 2).toUpperCase();
}

export function getEmployeeId(emp) {
  if (!emp) return '';
  return String(emp.EMPLOYEE_ID || emp.ID || emp.id || emp._rowIndex || '');
}

export function getEmployeeName(emp) {
  if (!emp) return '';
  return String(emp.NAME || emp.name || emp['HỌ TÊN'] || emp['Họ tên'] || '').trim();
}
