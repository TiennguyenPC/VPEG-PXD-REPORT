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

function normalizeFieldKey(key) {
  return String(key || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

function pickFieldValue(obj, { exact = [], includes = [] } = {}) {
  if (!obj) return '';
  for (const key of exact) {
    const val = obj[key];
    if (val != null && String(val).trim()) return String(val).trim();
  }
  for (const [key, val] of Object.entries(obj)) {
    if (key === '_rowIndex') continue;
    if (val == null || !String(val).trim()) continue;
    const norm = normalizeFieldKey(key);
    for (const pattern of includes) {
      if (norm === pattern || norm.includes(pattern)) {
        return String(val).trim();
      }
    }
  }
  return '';
}

export function getEmployeeName(emp) {
  if (!emp) return '';
  const name = pickFieldValue(emp, {
    exact: ['NAME', 'name', 'HỌ TÊN', 'Họ tên', 'HO_TEN', 'HOTEN'],
    includes: ['hoten', 'hovaten', 'name'],
  });
  return name.trim();
}

export function getEmployeeEmail(emp) {
  if (!emp) return '';
  return pickFieldValue(emp, {
    exact: ['EMAIL', 'email', 'Email', 'E-MAIL', 'MAIL', 'Mail'],
    includes: ['email', 'mail', 'thudientu'],
  }).toLowerCase();
}

export function getEmployeePosition(emp) {
  if (!emp) return '';
  return pickFieldValue(emp, {
    exact: [
      'CHUC_VU', 'CHỨC_VỤ', 'Chức vụ', 'POSITION', 'position',
      'VAI_TRO', 'VAI TRÒ', 'ROLE', 'role', 'CHUC_DANH', 'Chức danh',
    ],
    includes: ['chucvu', 'chucdanh', 'position', 'vaitro'],
  });
}

/** Map chức vụ trong sheet EMPLOYEE → role tài khoản */
export function mapPositionToRole(position) {
  const raw = String(position || '').trim().toLowerCase();
  if (!raw) return 'employee';

  const normalized = raw.replace(/\./g, '').replace(/\s+/g, ' ');

  if (normalized === 'nhanvien' || normalized === 'nv' || normalized.includes('nhân viên')) {
    return 'employee';
  }

  const direct = ['pm', 'sm', 'gs', 'sa', 'tk', 'psc'];
  if (direct.includes(normalized)) return normalized;

  if (normalized.includes('giám sát') || normalized.includes('giam sat') || normalized === 'gs') {
    return 'gs';
  }
  if (normalized.includes('project manager') || normalized.startsWith('pm ')) return 'pm';
  if (normalized.includes('site manager') || normalized.startsWith('sm ')) return 'sm';
  if (normalized.includes('p sc') || normalized.includes('phong sc') || normalized.includes('phòng sc')) {
    return 'psc';
  }

  const first = normalized.split(/[\s/-]+/)[0];
  if (direct.includes(first)) return first;

  return 'employee';
}
