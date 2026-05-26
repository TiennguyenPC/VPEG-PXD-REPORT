import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, Briefcase, Folder, UserCircle, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/permissions';

const NAV_ITEMS = [
  { key: 'overview', label: 'Tổng quan', Icon: Activity, path: '/' },
  { key: 'tasks', label: 'Công việc', Icon: Briefcase, path: '/tasks' },
  { key: 'projects', label: 'Dự án', Icon: Folder, path: '/projects' },
  { key: 'account', label: 'Tài khoản', Icon: UserCircle, path: '/account' },
];

function resolveActiveItem(pathname, activeItem) {
  if (activeItem) return activeItem;
  if (pathname.startsWith('/tasks')) return 'tasks';
  if (pathname.startsWith('/projects/')) return 'project-detail';
  if (pathname.startsWith('/projects')) return 'projects';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/account')) return 'account';
  if (pathname === '/') return 'overview';
  return '';
}

export default function MobileBottomNav({ activeItem: activeItemProp }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const activeItem = resolveActiveItem(pathname, activeItemProp);

  const items = [
    ...NAV_ITEMS,
    ...(isAdmin(user)
      ? [{ key: 'settings', label: 'Cài đặt', Icon: Settings, path: '/settings/users' }]
      : []),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border-main)] bg-[var(--bg-panel)]/95 backdrop-blur-md print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Điều hướng chính"
    >
      <div className="flex items-stretch justify-around h-14 px-1">
        {items.map(({ key, label, Icon, path }) => {
          const isActive =
            activeItem === key ||
            (key === 'projects' && activeItem === 'project-detail');
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 px-1 transition-colors ${
                isActive ? 'text-[#7373ff]' : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#5252ff]' : ''}`} />
              <span className="text-[9px] font-semibold truncate max-w-full">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
