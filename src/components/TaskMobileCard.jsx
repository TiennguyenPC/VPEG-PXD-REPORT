import React from 'react';
import { CheckCircle2, Circle, Clock, PlayCircle, Star } from 'lucide-react';
import AssigneeDisplay from './AssigneeDisplay';
import PriorityBadge from './PriorityBadge';

export default function TaskMobileCard({
  task,
  taskEditable,
  taskFullyEditable = false,
  canOpenTask,
  onOpen,
  onTogglePin,
  onToggleComplete,
}) {
  const status = task.computedStatus || 'Chưa bắt đầu';
  const isDone = status === 'Đã hoàn thành';

  return (
    <article
      role={canOpenTask ? 'button' : undefined}
      tabIndex={canOpenTask ? 0 : undefined}
      onClick={canOpenTask ? onOpen : undefined}
      onKeyDown={canOpenTask ? (e) => e.key === 'Enter' && onOpen() : undefined}
      className={`rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-3 shadow-sm transition-colors ${
        canOpenTask ? 'active:bg-[var(--bg-hover)] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start gap-2 mb-2">
        <button
          type="button"
          className={`shrink-0 mt-0.5 ${!taskEditable ? 'opacity-40 pointer-events-none' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Circle className="w-5 h-5 text-slate-500" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-bold leading-snug ${
              isDone ? 'text-slate-500 line-through' : 'text-slate-100'
            }`}
          >
            {task.TÁC_VỤ || '—'}
          </h3>
          {task.TÊN_DỰ_ÁN ? (
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{task.TÊN_DỰ_ÁN}</p>
          ) : null}
        </div>
        <button
          type="button"
          className={`shrink-0 ${task.PINNED ? 'text-yellow-400' : 'text-slate-500'} ${!taskFullyEditable ? 'opacity-40 pointer-events-none' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
        >
          <Star className={`w-4 h-4 ${task.PINNED ? 'fill-current' : ''}`} />
        </button>
      </div>

      {task.taskDescription ? (
        <p className="text-[11px] text-slate-400 leading-snug break-words whitespace-pre-wrap mb-2 pl-7">
          {task.taskDescription}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pl-7 mb-2">
        <AssigneeDisplay assignees={task.NHÂN_SỰ} variant="dark" className="text-[11px]" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pl-7 pt-2 border-t border-[var(--border-main)]/50">
        <div className="flex items-center gap-2 text-[10px] tabular-nums text-slate-400">
          <span>{task.NGÀY_BẮT_ĐẦU_LOCAL || '—'}</span>
          <span>→</span>
          <span className={status === 'Trễ' ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {task.NGÀY_KẾT_THÚC_LOCAL || '—'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
              isDone
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : status === 'Đang diễn ra'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : status === 'Trễ'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
            }`}
          >
            {status === 'Đang diễn ra' ? <PlayCircle className="w-2.5 h-2.5" /> : null}
            {status === 'Trễ' ? <Clock className="w-2.5 h-2.5" /> : null}
            {status}
          </span>
          <PriorityBadge priority={task.ƯU_TIÊN} />
        </div>
      </div>
    </article>
  );
}
