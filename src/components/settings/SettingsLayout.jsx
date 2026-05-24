import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, ScrollText, ShieldCheck } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useSidebar } from '../../hooks/useSidebar';

const TABS = [
  { to: '/settings/users', label: 'Tài khoản', Icon: Users, end: true },
  { to: '/settings/audit', label: 'Nhật ký hoạt động', Icon: ScrollText, end: true },
];

export default function SettingsLayout({ activeTab, title, subtitle, children, headerAction }) {
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <Sidebar activeItem="settings" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-20 bg-[var(--bg-panel)]/95 backdrop-blur border-b border-[var(--border-main)] px-6 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#5252ff]/10 text-[#7373ff]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[var(--text-strong)]">{title}</h1>
                  {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
                </div>
              </div>
              {headerAction}
            </div>
            <nav className="flex gap-1 p-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] w-fit">
              {TABS.map(({ to, label, Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#5252ff]/15 text-[#7373ff]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--bg-hover)]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
