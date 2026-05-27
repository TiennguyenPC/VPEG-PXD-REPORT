import React from 'react';
import { Activity, Briefcase, Folder, PanelLeftClose, PanelLeftOpen, LogOut, Settings, UserCircle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, getUserInitials, isAdmin } from '../utils/permissions';
import NotificationBell from './NotificationBell';
import ThemeToggleInline from './ThemeToggleInline';
import VuPhongLogo from './VuPhongLogo';
import MobileBottomNav from './MobileBottomNav';
import MobileHeaderActions from './MobileHeaderActions';

export default function Sidebar({ activeItem, isCollapsed, toggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.displayName || 'Nhân viên';
  const roleLabel = getRoleLabel(user?.role);
  const initials = getUserInitials(displayName);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
    <aside className={`bg-[var(--bg-panel)] flex flex-col shrink-0 app-height-screen sticky top-0 hidden md:flex transition-all duration-300 print:hidden ${isCollapsed ? 'w-16 border-r border-[var(--border-main)]' : 'w-56 border-r border-[var(--border-main)]'}`}>
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Logo */}
        <div className={`h-[72px] flex items-center justify-center border-b border-[var(--border-main)]/40 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="cursor-pointer min-w-0 flex items-center justify-center w-full rounded-lg hover:opacity-90 transition-opacity"
            title="VUPHONG — Tổng quan"
          >
            <VuPhongLogo collapsed={isCollapsed} />
          </button>
        </div>

        {/* Nav */}
        <nav className={`p-3 space-y-1 ${isCollapsed ? 'px-2' : ''}`}>
          {[
            { key: 'overview',  label: 'TỔNG QUAN', Icon: Activity,  href: '/',        onClick: (e) => { e.preventDefault(); navigate('/'); } },
            { key: 'tasks',     label: 'CÔNG VIỆC',  Icon: Briefcase, href: '/tasks',   onClick: (e) => { e.preventDefault(); navigate('/tasks'); } },
            { key: 'projects',  label: 'DỰ ÁN',      Icon: Folder,    href: '/projects',onClick: (e) => { e.preventDefault(); navigate('/projects'); } },
            { key: 'account',   label: 'TÀI KHOẢN',  Icon: UserCircle, href: '/account', onClick: (e) => { e.preventDefault(); navigate('/account'); } },
            { key: 'guide',     label: 'HƯỚNG DẪN SỬ DỤNG', Icon: BookOpen, href: '/huong-dan', external: true },
            ...(isAdmin(user) ? [{ key: 'settings', label: 'CÀI ĐẶT', Icon: Settings, href: '/settings/users', onClick: (e) => { e.preventDefault(); navigate('/settings/users'); } }] : []),
          ].map(({ key, label, Icon, href, onClick, external }) => {
            const className = `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-xs font-semibold
                ${activeItem === key
                  ? 'bg-[#5252ff]/10 text-[#7373ff] border-l-2 border-[#5252ff]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-hover)]'}
                ${isCollapsed ? 'justify-center' : ''}`;
            const iconEl = (
              <>
                <Icon className={`w-4 h-4 shrink-0 ${activeItem === key ? 'text-[#5252ff]' : 'text-[var(--text-muted)]'}`} />
                {!isCollapsed && <span className="truncate [font-variant-ligatures:normal] leading-snug">{label}</span>}
              </>
            );
            if (external) {
              return (
                <a key={key} href={href} title={label} className={className}>
                  {iconEl}
                </a>
              );
            }
            return (
            <a
              key={key}
              href={href}
              onClick={onClick}
              title={label}
              className={className}
            >
              {iconEl}
            </a>
            );
          })}
          {activeItem === 'project-detail' && (
            <a href="#" onClick={e => e.preventDefault()} title="CHI TIẾT DỰ ÁN"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#5252ff]/10 text-[#7373ff] border-l-2 border-[#5252ff] text-xs font-semibold ${isCollapsed ? 'justify-center' : ''}`}>
              <Folder className="w-4 h-4 shrink-0 text-[#5252ff]" />
              {!isCollapsed && <span className="truncate">CHI TIẾT DỰ ÁN</span>}
            </a>
          )}
        </nav>
      </div>

      {/* Bottom: user profile card */}
      <div className="shrink-0 p-2 safe-area-bottom">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-9 h-9 shrink-0 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-bold text-[var(--text-main)] border border-[var(--border-main)] cursor-pointer hover:border-[#5252ff]/50 transition-colors"
              title={`${displayName} — Tài khoản`}
              onClick={() => navigate('/account')}
            >
              {initials}
            </div>
            <NotificationBell compact sidebarPlacement />
            <ThemeToggleInline />
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div className="w-8 h-px bg-[var(--border-main)]/80 my-0.5" />
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg bg-[#5252ff]/10 text-[#7373ff] hover:bg-[#5252ff]/20 border border-[#5252ff]/20 transition-colors"
              title="Mở rộng menu"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-main)]/60 bg-[var(--bg-hover)]/40">
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <button
                type="button"
                onClick={() => navigate('/account')}
                className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90 transition-opacity text-left"
                title="Tài khoản & đổi mật khẩu"
              >
                <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--bg-panel)] flex items-center justify-center text-xs font-bold text-[var(--text-main)] border border-[var(--border-main)]">
                  {initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[var(--text-strong)] leading-snug line-clamp-2" title={displayName}>
                    {displayName}
                  </span>
                  <span className="text-[10px] text-[#3b82f6] font-bold tracking-wide mt-0.5">{roleLabel}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="shrink-0 p-1.5 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="flex border-t border-[var(--border-main)]/50">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSidebar();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold text-[#7373ff] hover:text-[#7373ff] hover:bg-[#5252ff]/10 transition-colors"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
                Thu gọn
              </button>
              <div className="w-px bg-[var(--border-main)]/50" />
              <div className="flex items-center justify-center px-2 py-1 hover:bg-[var(--bg-panel)]/50 transition-colors">
                <NotificationBell compact sidebarPlacement />
              </div>
              <div className="w-px bg-[var(--border-main)]/50" />
              <div className="flex items-center justify-center px-3 py-1 hover:bg-[var(--bg-panel)]/50 transition-colors">
                <ThemeToggleInline />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
    <MobileHeaderActions />
    <MobileBottomNav activeItem={activeItem} />
    </>
  );
}
