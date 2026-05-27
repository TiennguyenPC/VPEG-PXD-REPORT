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

export function canEditProject(user, projectId, project = null) {
  if (isAdmin(user)) return true;
  if (project && isProjectCreator(user, project)) return true;
  return isAssignedToProject(user, projectId);
}

export function getProjectCreator(project) {
  return String(project?.NGƯỜI_TẠO || project?.NGUOI_TAO || project?.CREATED_BY || project?.creator || '').trim();
}

export function isProjectCreator(user, project) {
  const creator = getProjectCreator(project);
  if (!creator || !user?.displayName) return false;
  return namesMatch(user.displayName, creator);
}

/** Mọi user đăng nhập đều được tạo dự án mới */
export function canCreateProject(user) {
  return Boolean(user?.username || user?.displayName);
}

/** Admin toàn quyền, còn lại chỉ người tạo dự án */
export function canDeleteProject(user, project) {
  if (!project || !user) return false;
  if (isAdmin(user)) return true;
  return isProjectCreator(user, project);
}

function parseAssigneeNames(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeContainer(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toUpperCase();
}

export function resolveTaskProjectId(task, projects = []) {
  const pid = String(task?.PROJECT_ID || '').trim();
  if (pid) return pid;
  const name = String(task?.TÊN_DỰ_ÁN || '').trim();
  if (!name || !Array.isArray(projects)) return '';
  const proj = projects.find(
    (p) =>
      String(p.name || p.TÊN_DỰ_ÁN || '').trim() === name ||
      String(p.id || p.PROJECT_ID || '').trim() === name
  );
  return proj ? String(proj.id || proj.PROJECT_ID || '').trim() : '';
}

/** PM/SM được gán dự án theo mã hoặc tên (VAL, OSAKA...) */
export function isUserAssignedToTaskProject(user, task, projects = []) {
  const assigned = user?.assignedProjects || [];
  if (!assigned.length || !task) return false;

  const projectId = resolveTaskProjectId(task, projects);
  const taskName = String(task.TÊN_DỰ_ÁN || '').trim();

  for (const ref of assigned) {
    const token = String(ref || '').trim();
    if (!token) continue;
    if (projectId && token === projectId) return true;
    if (taskName && (token === taskName || namesMatch(token, taskName))) return true;

    const proj = projects.find(
      (p) =>
        String(p.id || p.PROJECT_ID || '').trim() === token ||
        String(p.name || p.TÊN_DỰ_ÁN || '').trim() === token
    );
    if (!proj) continue;
    const pid = String(proj.id || proj.PROJECT_ID || '').trim();
    const pname = String(proj.name || proj.TÊN_DỰ_ÁN || '').trim();
    if (projectId && pid === projectId) return true;
    if (taskName && pname === taskName) return true;
  }
  return false;
}

function isOfficeTask(task, projects = []) {
  const container = normalizeContainer(task?.BỘ_CHỨA);
  const projectName = normalizeContainer(task?.TÊN_DỰ_ÁN);
  const projectId = resolveTaskProjectId(task, projects);
  const hasProject = Boolean(String(task?.PROJECT_ID || '').trim() || projectId);
  return container.includes('VAN PHONG') || projectName.includes('VAN PHONG') || !hasProject;
}

/** Nội bộ PXD — chỉ nhóm core được xem/sửa task Văn phòng / Nhiệm vụ chung */
const OFFICE_TASK_PXD_NAME_TOKENS = ['thieu', 'doan', 'sang', 'quang', 'thuan', 'cuong', 'duy', 'tien'];

export function canViewOfficeTasks(user) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const username = String(user.username || '').trim().toLowerCase();
  if (username === 'tien.nguyen') return true;
  const norm = normalizePersonName(user.displayName || '');
  if (!norm) return false;
  return OFFICE_TASK_PXD_NAME_TOKENS.some((token) => norm.includes(token));
}

export function filterTasksForUser(tasks, user, projects = []) {
  const list = Array.isArray(tasks) ? tasks : [];
  if (!user) return list.filter((t) => !isOfficeTask(t, projects));
  if (canViewOfficeTasks(user)) return list;
  return list.filter((t) => !isOfficeTask(t, projects));
}

/** Mọi user đăng nhập xem task dự án; task Văn phòng/nội bộ chỉ nhóm PXD core */
export function canViewTaskDetail(user, task, context = {}) {
  if (!user || !task) return false;
  const { projects = [] } = context;
  if (isOfficeTask(task, projects) && !canViewOfficeTasks(user)) return false;
  return true;
}

/** Cột người nhận việc được sửa (tên, mô tả, dự án) */
export const ASSIGNEE_EDITABLE_TASK_FIELDS = new Set([
  'TÁC_VỤ',
  'GHI_CHÚ',
  'MÔ_TẢ',
  'MO_TA',
  'TÊN_DỰ_ÁN',
  'PROJECT_ID',
]);

export function getTaskCreator(task) {
  return String(task?.NGƯỜI_TẠO || task?.NGUOI_TAO || task?.CREATED_BY || '').trim();
}

export function isTaskCreator(user, task) {
  const creator = getTaskCreator(task);
  if (!creator || !user?.displayName) return false;
  return namesMatch(user.displayName, creator);
}

export function isTaskAssignee(user, task) {
  if (!task || !user?.displayName) return false;
  const assignees = parseAssigneeNames(task.NHÂN_SỰ);
  if (assignees.some((name) => namesMatch(user.displayName, name))) return true;
  return namesMatch(user.displayName, task.NHÂN_SỰ);
}

/** Admin, người tạo task, hoặc PM/SM quản lý dự án / văn phòng */
export function hasFullTaskEditRights(user, task, context = {}) {
  if (isAdmin(user)) return true;
  if (!task) return false;
  if (isTaskCreator(user, task)) return true;

  if (isProjectEditorRole(user?.role)) {
    const { projects = [] } = context;
    if (isOfficeTask(task, projects)) return canViewOfficeTasks(user);
    if (isUserAssignedToTaskProject(user, task, projects)) return true;
  }

  return false;
}

/** Admin, người tạo, PM/SM dự án, hoặc người được phân công (task VP/nội bộ: chỉ nhóm PXD core) */
export function canEditTask(user, task, context = {}) {
  if (!task || !user) return false;
  const { projects = [] } = context;
  if (isOfficeTask(task, projects) && !canViewOfficeTasks(user)) return false;
  if (hasFullTaskEditRights(user, task, context)) return true;
  return isTaskAssignee(user, task);
}

export function canEditTaskField(user, task, field, context = {}) {
  if (!canEditTask(user, task, context)) return false;
  if (hasFullTaskEditRights(user, task, context)) return true;
  return ASSIGNEE_EDITABLE_TASK_FIELDS.has(field);
}

/** Chỉ bấm hoàn thành / bỏ hoàn thành — người nhận việc cũng được */
export function canToggleTaskComplete(user, task, context = {}) {
  return canEditTask(user, task, context);
}

export function canCreateTask(user) {
  if (isAdmin(user)) return true;
  return isProjectEditorRole(user?.role);
}

/** Admin toàn quyền, còn lại chỉ người tạo task */
export function canDeleteTask(user, task, context = {}) {
  if (!task || !user) return false;
  if (isAdmin(user)) return true;
  return isTaskCreator(user, task);
}

export function getRoleLabel(role) {
  const key = String(role || '').toLowerCase().replace(/\./g, '');
  return ROLE_LABELS[key] || String(role || '').toUpperCase();
}

export function isAdmin(user) {
  return String(user?.role || '').toLowerCase() === 'admin';
}

/** Admin hoặc PM/SM được gán dự án được bật/copy/tắt link chia sẻ khách */
export function canShareProjectWithClient(user, projectId = null, project = null) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const role = String(user?.role || '').toLowerCase();
  if (role !== 'pm' && role !== 'sm') return false;
  const pid = projectId || project?.id || project?.PROJECT_ID;
  if (!pid) return false;
  return isAssignedToProject(user, pid);
}

export function isProjectEditorRole(role) {
  return PROJECT_EDITOR_ROLES.includes(String(role || '').toLowerCase());
}

/** Theo dõi HĐ & sơ đồ quy trình — nội bộ, không chia sẻ khách; chỉ SM/PM/Admin được gán dự án */
export function canViewContractTracking(user, projectId, project = null) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const role = String(user?.role || '').toLowerCase();
  if (role !== 'pm' && role !== 'sm') return false;
  return isAssignedToProject(user, projectId || project?.id || project?.PROJECT_ID);
}

export function canEditContractTracking(user, projectId, project = null) {
  if (!canViewContractTracking(user, projectId, project)) return false;
  return canEditProject(user, projectId, project);
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
