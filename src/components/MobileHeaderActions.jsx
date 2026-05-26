import React from 'react';
import NotificationBell from './NotificationBell';
import ThemeToggleInline from './ThemeToggleInline';

export default function MobileHeaderActions() {
  return (
    <div
      className="md:hidden fixed top-0 right-0 z-[55] flex items-center gap-0.5 pl-2 pr-3 pb-1 print:hidden"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 0px))' }}
      aria-label="Thông báo và giao diện"
    >
      <NotificationBell compact />
      <ThemeToggleInline />
    </div>
  );
}
