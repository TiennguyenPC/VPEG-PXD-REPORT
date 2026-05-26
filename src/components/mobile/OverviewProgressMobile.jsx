import React from 'react';
import MobileProgressBar from './MobileProgressBar';

export default function OverviewProgressMobile({ projects, onOpenProject, emptyMessage = 'Chưa có dự án thi công' }) {
  if (!projects?.length) {
    return (
      <p className="py-8 text-center text-slate-500 text-sm">{emptyMessage}</p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--border-main)]/40">
      {projects.map((p) => {
        const plan = Math.round(Number(p.planProgress) || 0);
        const actual = Math.round(Number(p.actualProgress) || 0);
        const isDelayed = plan > actual;

        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpenProject(p.id)}
              className="w-full text-left p-3.5 active:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-strong)] truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500 tabular-nums mt-0.5">{p.capacity} kWp</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isDelayed
                      ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25'
                      : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25'
                  }`}
                >
                  {isDelayed ? 'Chậm' : 'Đạt'}
                </span>
              </div>
              <div className="space-y-2.5">
                <MobileProgressBar label="Kế hoạch" value={plan} />
                <MobileProgressBar label="Thực tế" value={actual} barClassName="bg-emerald-500" />
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
