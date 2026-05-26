import React from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';

function riskBadgeClass(risk) {
  switch (risk) {
    case 'HIGH':
      return 'text-red-500 bg-red-500/10 border border-red-500/25';
    case 'MEDIUM':
      return 'text-amber-600 bg-amber-500/10 border border-amber-500/25';
    default:
      return 'text-emerald-600 bg-emerald-500/10 border border-emerald-500/25';
  }
}

function issueDotClass(issueType) {
  switch (issueType) {
    case 'danger':
      return 'bg-[#ef4444]';
    case 'orange':
      return 'bg-[#f97316]';
    case 'medium':
      return 'bg-[#eab308]';
    default:
      return 'bg-[#10b981]';
  }
}

export default function ProjectListMobileCard({ project: p, onOpen, canDelete = false, onDelete }) {
  const progress = Math.min(100, Math.max(0, p.actualProgress || 0));
  const delay = Math.round(Number(p.delay || 0));

  return (
    <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left p-3.5 active:bg-[var(--bg-hover)] transition-colors"
      >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-[var(--text-strong)] truncate">{p.name}</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{p.client}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="bg-[#5252ff]/10 text-[#5252ff] px-2 py-0.5 rounded text-[10px] font-medium border border-[#5252ff]/20">
          {p.pm}
        </span>
        <span className="text-[10px] font-bold text-slate-300 tabular-nums">
          {Number(p.capacity || 0).toLocaleString()} kWp
        </span>
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${riskBadgeClass(p.risk)}`}>{p.risk}</span>
      </div>

      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500">Thực tế</span>
            <span className="font-bold text-[var(--text-main)] tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[var(--border-main)] rounded-full overflow-hidden">
            <div className="h-full bg-[#5252ff] rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[9px] text-slate-500">Δ KH</p>
          <p className={`text-xs font-bold tabular-nums ${delay >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
            {delay >= 0 ? '+' : ''}
            {delay}%
          </p>
        </div>
      </div>

      {p.issue && p.issue !== 'Không có' && p.issue !== '-' ? (
        <div className="flex items-start gap-1.5 text-[11px] text-slate-400 pt-2 border-t border-[var(--border-main)]/50">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${issueDotClass(p.issueType)}`} />
          <span className="line-clamp-2 leading-snug">{p.issue}</span>
        </div>
      ) : null}
      </button>
      {canDelete && (
        <div className="border-t border-[var(--border-main)]/50 px-3 py-2">
          <button
            type="button"
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-red-400 py-1.5 rounded hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa dự án
          </button>
        </div>
      )}
    </div>
  );
}
