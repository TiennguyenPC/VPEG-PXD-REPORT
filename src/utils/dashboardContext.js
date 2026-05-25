const PAGE_LABELS = {
  '/': 'Tổng quan',
  '/projects': 'Danh sách dự án',
  '/tasks': 'Danh sách công việc',
};

export function getPageLabel(pathname) {
  if (pathname.startsWith('/share/')) {
    return 'Chia sẻ dự án (chế độ xem)';
  }
  if (pathname.startsWith('/projects/') && pathname !== '/projects') {
    return 'Chi tiết dự án';
  }
  return PAGE_LABELS[pathname] || pathname;
}

export function resolveProjectFromPath(pathname, projects = []) {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (!match) return { projectId: null, project: null };
  const projectId = decodeURIComponent(match[1]);
  const list = Array.isArray(projects) ? projects : [];
  const project = list.find(
    (p) => String(p.id) === projectId || String(p.PROJECT_ID) === projectId
  ) || null;
  return { projectId, project };
}

export function updateDashboardContext(patch) {
  if (typeof window === 'undefined') return;
  window.__DASHBOARD_DATA__ = {
    ...(window.__DASHBOARD_DATA__ || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
