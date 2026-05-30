import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { parseAssignees } from '../utils/taskFields';
import { getUserInitials, normalizePersonName } from '../utils/permissions';

const TRIGGER_CLASS = {
  dark: 'bg-[var(--bg-main)] border border-[var(--border-main)] text-slate-200 text-xs py-1.5 px-2 rounded focus:border-[#5252ff] outline-none w-full min-w-0',
  light: 'w-full bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed',
};

const CHIP_CLASS = {
  dark: 'inline-flex items-center gap-1 bg-[#5252ff]/15 text-slate-200 text-[10px] font-medium px-1.5 py-0.5 rounded',
  light: 'inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100',
};

const AVATAR_CLASS = {
  dark: 'w-5 h-5 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[8px] font-bold shrink-0',
  light: 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shrink-0',
};

const MENU_CLASS = {
  dark: 'absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-lg py-1',
  light: 'absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg py-1',
};

function isSelected(name, selected) {
  const key = normalizePersonName(name);
  return selected.some((s) => normalizePersonName(s) === key);
}

export default function AssigneeMultiSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  variant = 'dark',
  className = '',
  placeholder = 'Chọn nhân sự...',
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef(null);

  const selected = useMemo(() => parseAssignees(value), [value]);

  const allOptions = useMemo(() => {
    const seen = new Map();
    const add = (name) => {
      const n = String(name || '').trim();
      if (!n) return;
      const k = normalizePersonName(n);
      if (!seen.has(k)) seen.set(k, n);
    };
    options.forEach(add);
    selected.forEach(add);
    return [...seen.values()].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [options, selected]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return allOptions;
    const lowerQ = searchQuery.toLowerCase();
    return allOptions.filter(name => name.toLowerCase().includes(lowerQ));
  }, [allOptions, searchQuery]);

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return undefined;
    }
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const togglePerson = (name) => {
    if (disabled) return;
    const key = normalizePersonName(name);
    const next = isSelected(name, selected)
      ? selected.filter((s) => normalizePersonName(s) !== key)
      : [...selected, name];
    onChange?.(next.join(', '));
  };

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`${TRIGGER_CLASS[variant] || TRIGGER_CLASS.dark} flex items-center justify-between gap-2 text-left`}
      >
        <span className="flex flex-wrap items-center gap-1 min-w-0 flex-1">
          {selected.length === 0 ? (
            <span className={variant === 'light' ? 'text-slate-400' : 'text-slate-500'}>{placeholder}</span>
          ) : (
            selected.map((name) => (
              <span key={name} className={CHIP_CLASS[variant] || CHIP_CLASS.dark}>
                <span className={AVATAR_CLASS[variant] || AVATAR_CLASS.dark}>{getUserInitials(name)}</span>
                <span className="truncate max-w-[120px]">{name}</span>
              </span>
            ))
          )}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div
          className={MENU_CLASS[variant] || MENU_CLASS.dark}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className={`px-2 pb-2 pt-1 sticky top-0 z-10 ${variant === 'light' ? 'bg-white' : 'bg-[var(--bg-panel)]'}`}>
            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 ${variant === 'light' ? 'text-slate-400' : 'text-slate-500'}`} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-2 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 ${
                  variant === 'light' 
                    ? 'bg-slate-50 border-slate-200 text-slate-700 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-400' 
                    : 'bg-[var(--bg-main)] border-[var(--border-main)] text-slate-200 focus:border-[#5252ff] focus:ring-[#5252ff] placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">Không có nhân sự phù hợp</p>
          ) : (
            filteredOptions.map((name) => {
              const active = isSelected(name, selected);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => togglePerson(name)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    variant === 'light'
                      ? active ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                      : active ? 'bg-[#5252ff]/15 text-slate-100' : 'hover:bg-[var(--bg-hover)] text-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : variant === 'light' ? 'border-slate-300 bg-white' : 'border-[var(--border-main)] bg-[var(--bg-main)]'
                  }`}>
                    {active ? <Check className="w-3 h-3" /> : null}
                  </span>
                  <span className={AVATAR_CLASS[variant] || AVATAR_CLASS.dark}>{getUserInitials(name)}</span>
                  <span className="truncate">{name}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
