import React from 'react';

export default function MobileProgressBar({ label, value, barClassName = 'bg-[#5252ff]' }) {
  const pct = Math.round(Number(value) || 0);
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] mb-1">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="tabular-nums text-slate-400 font-semibold">{pct}%</span>
      </div>
      <div className="h-2 bg-[var(--border-main)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barClassName}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}
