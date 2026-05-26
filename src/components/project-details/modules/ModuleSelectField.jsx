import React from 'react';
import { ChevronDown } from 'lucide-react';
import { hasModuleFieldData } from '../../../utils/moduleDisplay';

/** Dropdown hạng mục — ô trống hiện "Chọn…" + viền + mũi tên để biết chỗ click */
export default function ModuleSelectField({
  value,
  onChange,
  disabled = false,
  children,
  colorClass = '',
  placeholder = 'Chọn…',
}) {
  const isEmpty = !hasModuleFieldData(value);

  return (
    <div className={`relative w-full min-w-[6.5rem] group ${disabled ? 'opacity-70 pointer-events-none' : ''}`}>
      <select
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        title={placeholder}
        className={[
          'module-field-select w-full appearance-none rounded-md border px-2.5 py-1.5 pr-8',
          'text-[11px] font-bold focus:outline-none focus:border-[#5252ff] cursor-pointer transition-colors',
          isEmpty
            ? 'border-dashed border-[var(--border-main)] text-[var(--text-muted)] bg-[var(--bg-main)]/40 hover:border-[#5252ff]/45 hover:bg-[#5252ff]/5'
            : `border border-[var(--border-main)]/70 bg-[var(--bg-main)]/25 ${colorClass}`,
        ].join(' ')}
      >
        <option value="" className="bg-[var(--bg-panel)] text-[var(--text-muted)]">
          {placeholder}
        </option>
        {children}
      </select>
      {!disabled && (
        <ChevronDown
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)] opacity-80 group-hover:text-[#5252ff]"
          aria-hidden
        />
      )}
    </div>
  );
}
