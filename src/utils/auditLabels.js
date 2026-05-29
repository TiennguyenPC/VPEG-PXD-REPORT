/** Nhãn hiển thị cho ACTION trong audit log */
export const AUDIT_ACTION_LABELS = {
  login: 'Đăng nhập',
  logout: 'Đăng xuất',
  'account-locked': 'Khóa tài khoản',
  'add-user': 'Tạo user',
  'update-user': 'Sửa user',
  'deactivate-user': 'Vô hiệu user',
  'delete-user': 'Xóa user',
  'change-password': 'Đổi mật khẩu',
  'add-project': 'Tạo dự án',
  'update-project': 'Sửa dự án',
  'delete-project': 'Xóa dự án',
  'add-task': 'Tạo task',
  'update-task': 'Sửa task',
  'delete-task': 'Xóa task',
  'update-risk': 'Sửa risk',
  'delete-risk': 'Xóa risk',
  'update-permit': 'Sửa permit',
  'update-design': 'Sửa design',
  'update-procurement': 'Sửa procurement',
  'update-construction': 'Sửa thi công',
  'update-handover': 'Sửa handover',
  'update-site-log': 'Sửa site log',
  'update-module-dates': 'Sửa ngày module',
  'upload-site-image': 'Upload ảnh',
  'upload-task-file': 'Upload tệp task',
  'remove-task-attachment': 'Xóa tệp task',
  'enable-project-share': 'Bật link chia sẻ khách',
  'disable-project-share': 'Tắt link chia sẻ khách',
  'update-notification-email-config': 'Cấu hình email thông báo',
};

export function getAuditActionLabel(action) {
  return AUDIT_ACTION_LABELS[action] || action || '—';
}

export function formatAuditTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function getAuditActionColor(action) {
  const a = String(action || '').toLowerCase();
  if (a === 'login') return 'text-emerald-400 bg-emerald-500/10';
  if (a === 'account-locked') return 'text-red-400 bg-red-500/10';
  if (a === 'logout') return 'text-slate-400 bg-slate-500/10';
  if (a.indexOf('delete') >= 0) return 'text-red-400 bg-red-500/10';
  if (a.indexOf('add') >= 0) return 'text-blue-400 bg-blue-500/10';
  return 'text-amber-400 bg-amber-500/10';
}
