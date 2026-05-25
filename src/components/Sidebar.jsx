import React from 'react';
import { createPortal } from 'react-dom';
import { Activity, Briefcase, Folder, PanelLeftClose, PanelLeftOpen, Sun, Moon, Monitor, Check, LogOut, Settings, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel, getUserInitials, isAdmin } from '../utils/permissions';
import NotificationBell from './NotificationBell';
import VuPhongLogo from './VuPhongLogo';

const THEME_MENU_WIDTH = 176;
const THEME_MENU_HEIGHT = 132;
const THEME_MENU_GAP = 8;

function computeThemeMenuLayout(btnRect, sidebarPlacement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = THEME_MENU_GAP;

  if (sidebarPlacement) {
    let left = btnRect.right - THEME_MENU_WIDTH;
    if (left < gap) left = gap;
    if (left + THEME_MENU_WIDTH > vw - gap) {
      left = Math.max(gap, btnRect.left - THEME_MENU_WIDTH - gap);
    }
    let top = btnRect.top - THEME_MENU_HEIGHT - gap;
    if (top < gap) {
      top = btnRect.bottom + gap;
    }
    top = Math.max(gap, Math.min(top, vh - THEME_MENU_HEIGHT - gap));
    left = Math.max(gap, Math.min(left, vw - THEME_MENU_WIDTH - gap));
    return { top, left };
  }

  return {
    top: Math.min(btnRect.bottom + gap, vh - THEME_MENU_HEIGHT - gap),
    left: Math.max(gap, Math.min(btnRect.left, vw - THEME_MENU_WIDTH - gap)),
  };
}

function ThemeToggleInline({ placement = 'sidebar' }) {
  const { theme, setThemeMode } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState({ top: 0, left: 0 });
  const ref = React.useRef(null);
  const btnRef = React.useRef(null);

  const updateMenuPos = React.useCallback(() => {
    if (!btnRef.current) return;
    setMenuPos(computeThemeMenuLayout(btnRef.current.getBoundingClientRect(), placement === 'sidebar'));
  }, [placement]);

  React.useEffect(() => () => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return undefined;
    updateMenuPos();
    const handler = (e) => {
      if (ref.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onReflow = () => updateMenuPos();
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, updateMenuPos]);

  const openMenu = () => {
    if (!open && btnRef.current) {
      setMenuPos(computeThemeMenuLayout(btnRef.current.getBoundingClientRect(), placement === 'sidebar'));
    }
    setOpen((v) => !v);
  };

  const Icon = theme === 'light' ? Sun : theme === 'system' ? Monitor : Moon;

  const menu = open ? createPortal(
    <div
      ref={ref}
      className="fixed z-[9999] w-44 rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-2xl py-1"
      style={{ top: menuPos.top, left: menuPos.left }}
    >
      {[
        { value: 'light', label: 'Sáng', Icon: Sun },
        { value: 'dark', label: 'Tối', Icon: Moon },
        { value: 'system', label: 'Hệ thống', Icon: Monitor },
      ].map(({ value, label, Icon: Ic }) => (
        <button
          key={value}
          type="button"
          onClick={() => { setThemeMode(value); setOpen(false); }}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Ic className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
            <span className="whitespace-nowrap">{label}</span>
          </div>
          {theme === value && <Check className="w-3 h-3 shrink-0 text-[#5252ff]" />}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openMenu}
        className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
        title="Chế độ giao diện"
      >
        <Icon className="w-4 h-4" />
      </button>
      {menu}
    </>
  );
}

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
    <aside className={`bg-[var(--bg-panel)] flex flex-col shrink-0 h-screen sticky top-0 hidden md:flex transition-all duration-300 print:hidden ${isCollapsed ? 'w-16 border-r border-[var(--border-main)]' : 'w-56 border-r border-[var(--border-main)]'}`}>
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
            ...(isAdmin(user) ? [{ key: 'settings', label: 'CÀI ĐẶT', Icon: Settings, href: '/settings/users', onClick: (e) => { e.preventDefault(); navigate('/settings/users'); } }] : []),
          ].map(({ key, label, Icon, href, onClick }) => (
            <a
              key={key}
              href={href}
              onClick={onClick}
              title={label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-xs font-semibold
                ${activeItem === key
                  ? 'bg-[#5252ff]/10 text-[#7373ff] border-l-2 border-[#5252ff]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-hover)]'}
                ${isCollapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activeItem === key ? 'text-[#5252ff]' : 'text-[var(--text-muted)]'}`} />
              {!isCollapsed && <span className="truncate [font-variant-ligatures:normal]">{label}</span>}
            </a>
          ))}
          {activeItem === 'project-detail' && (
            <a href="#" onClick={e => e.preventDefault()} title="CHI TIẾT DỰ ÁN"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#5252ff]/10 text-[#7373ff] border-l-2 border-[#5252ff] text-xs font-semibold ${isCollapsed ? 'justify-center' : ''}`}>
              <Folder className="w-4 h-4 shrink-0 text-[#5252ff]" />
              {!isCollapsed && <span className="truncate">CHI TIẾT DỰ ÁN</span>}
            </a>
          )}
        </nav>
      </div>

      {/* Bottom: user profile card — overflow visible for theme menu portal */}
      <div className="shrink-0 p-2">
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
            <ThemeToggleInline placement="sidebar" />
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
                <ThemeToggleInline placement="sidebar" />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
