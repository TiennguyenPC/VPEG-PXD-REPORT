import React, { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { getEmployeeName, getUserInitials, normalizePersonName } from '../utils/permissions';
import { formatAssigneeDisplay } from '../utils/taskFields';

const SELECT_CLASS = {
  dark: 'bg-[var(--bg-main)] border border-[var(--border-main)] text-slate-200 text-xs py-1 pl-7 pr-6 rounded focus:border-[#5252ff] outline-none w-full min-w-0',
  light: 'w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-9 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed',
};

const AVATAR_CLASS = {
  dark: 'w-6 h-6 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[8px] font-bold shrink-0 pointer-events-none',
  light: 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 pointer-events-none',
};

function findMatchingOption(value, options) {
  const target = normalizePersonName(value);
  if (!target) return '';
  const exact = options.find((name) => normalizePersonName(name) === target);
  return exact || String(value || '').trim();
}

export default function AssigneeSelect({
  value,
  onChange,
  employees = [],
  options: optionsProp,
  disabled = false,
  variant = 'dark',
  className = '',
  placeholder = 'Chưa chỉ định',
}) {
  const raw = String(value || '').trim();
  const primary = raw.split(/[,;|/]+/)[0]?.trim() || '';

  const optionList = useMemo(() => {
    if (Array.isArray(optionsProp) && optionsProp.length > 0) {
      return [...new Set(optionsProp.map((n) => String(n || '').trim()).filter(Boolean))];
    }
    return [...new Set(
      employees
        .map((emp) => getEmployeeName(emp) || emp.NAME || emp.name || emp.DISPLAY_NAME)
        .filter(Boolean)
    )];
  }, [optionsProp, employees]);

  const selectedValue = findMatchingOption(primary, optionList);
  const display = formatAssigneeDisplay(raw, placeholder);
  const initials = primary ? getUserInitials(primary) : '?';
  const inList = optionList.some((name) => normalizePersonName(name) === normalizePersonName(primary));

  return (
    <div className={`relative flex items-center min-w-0 ${className}`}>
      <div className={`absolute left-0 top-1/2 -translate-y-1/2 z-[1] ${variant === 'light' ? 'left-2' : 'left-0'}`}>
        <div className={AVATAR_CLASS[variant] || AVATAR_CLASS.dark}>{initials}</div>
      </div>
      <select
        value={selectedValue}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        title={raw || placeholder}
        className={SELECT_CLASS[variant] || SELECT_CLASS.dark}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <option value="">{placeholder}</option>
        {primary && !inList ? <option value={primary}>{display}</option> : null}
        {optionList.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
      <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none ${variant === 'light' ? 'right-2' : 'right-1'}`} />
    </div>
  );
}
