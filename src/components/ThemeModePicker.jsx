import React from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const OPTIONS = [
  { value: 'light', label: 'Sáng', Icon: Sun },
  { value: 'dark', label: 'Tối', Icon: Moon },
  { value: 'system', label: 'Hệ thống', Icon: Monitor },
];

export default function ThemeModePicker() {
  const { theme, setThemeMode } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2 py-2">
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setThemeMode(value)}
            className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-semibold transition-all ${
              active
                ? 'border-[#5252ff]/50 bg-[#5252ff]/10 text-[#7373ff]'
                : 'border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-muted)] hover:border-[var(--border-light)] hover:text-[var(--text-main)]'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-[#5252ff]' : 'text-[var(--text-muted)]'}`} />
            <span>{label}</span>
            {active ? <Check className="w-3 h-3 text-[#5252ff]" /> : <span className="h-3" />}
          </button>
        );
      })}
    </div>
  );
}
