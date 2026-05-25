import React from 'react';
import { getUserInitials } from '../utils/permissions';
import { formatAssigneeDisplay, parseAssignees } from '../utils/taskFields';

const AVATAR_VARIANTS = {
  dark: 'w-6 h-6 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[8px] font-bold shrink-0',
  board: 'w-5 h-5 rounded-full bg-[#18183c] text-[#a0a0ff] flex items-center justify-center text-[8px] font-bold border border-[#2d2db3]/20 shrink-0',
  light: 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white shrink-0',
  overview: 'w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold shrink-0',
};

const TEXT_VARIANTS = {
  dark: 'text-slate-300 text-xs leading-tight truncate min-w-0',
  board: 'sr-only',
  light: 'text-sm text-slate-600 font-medium truncate min-w-0',
  overview: 'font-medium text-[var(--text-main)] truncate min-w-0 text-xs leading-tight',
};

export default function AssigneeDisplay({
  assignees,
  variant = 'dark',
  showAvatar = true,
  showLabel = true,
  fallback = 'Chưa chỉ định',
  className = '',
}) {
  const raw = String(assignees || '').trim();
  const list = parseAssignees(raw);
  const display = formatAssigneeDisplay(raw, fallback);
  const fullTitle = raw || fallback;
  const initials = list.length > 0 ? getUserInitials(list[0]) : '?';

  return (
    <div className={`flex items-center gap-1.5 min-w-0 ${className}`} title={fullTitle}>
      {showAvatar && (
        <div className={AVATAR_VARIANTS[variant] || AVATAR_VARIANTS.dark}>
          {initials}
        </div>
      )}
      {showLabel && (
        <span className={TEXT_VARIANTS[variant] || TEXT_VARIANTS.dark}>
          {display}
        </span>
      )}
    </div>
  );
}
