const PAGE_LABELS = {
  '/': 'Tổng quan',
  '/projects': 'Danh sách dự án',
  '/tasks': 'Danh sách công việc',
};

export function getPageLabel(pathname) {
  if (pathname.startsWith('/projects/') && pathname !== '/projects') {
    return 'Chi tiết dự án';
  }
  return PAGE_LABELS[pathname] || pathname;
}

export function updateDashboardContext(patch) {
  if (typeof window === 'undefined') return;
  window.__DASHBOARD_DATA__ = {
    ...(window.__DASHBOARD_DATA__ || {}),
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}
