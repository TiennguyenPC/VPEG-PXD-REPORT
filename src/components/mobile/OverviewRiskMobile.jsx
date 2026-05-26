import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import AssigneeDisplay from '../AssigneeDisplay';

function riskLevelStyle(levelLabel) {
  if (levelLabel === 'Cao') {
    return { color: 'text-rose-400', ring: 'ring-rose-500/25', bg: 'bg-rose-500/10', label: 'Cao' };
  }
  if (levelLabel === 'Trung bình') {
    return { color: 'text-amber-400', ring: 'ring-amber-500/25', bg: 'bg-amber-500/10', label: 'TB' };
  }
  return {
    color: 'text-slate-400',
    ring: 'ring-slate-500/25',
    bg: 'bg-slate-500/10',
    label: levelLabel || '-',
  };
}

export default function OverviewRiskMobile({ risks, onOpenProject }) {
  if (!risks?.length) {
    return (
      <div className="py-10 flex flex-col items-center gap-2 text-slate-500">
        <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
        <span className="text-sm">Không có rủi ro nghiêm trọng</span>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border-main)]/40 p-1">
      {risks.map((r, idx) => {
        const s = riskLevelStyle(r.level || '-');
        return (
          <li key={idx}>
            <button
              type="button"
              disabled={!r.id}
              onClick={() => r.id && onOpenProject(r.id)}
              className="w-full text-left p-3.5 active:bg-[var(--bg-hover)] transition-colors disabled:cursor-default"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-bold text-[var(--text-strong)] truncate">{r.project}</p>
                <span
                  className={`shrink-0 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 ${s.bg} ${s.color} ${s.ring}`}
                >
                  {s.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-3 mb-2">{r.issue}</p>
              <AssigneeDisplay assignees={r.assignee} variant="overview" fallback="Chưa rõ" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
