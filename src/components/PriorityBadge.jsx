import { Flag } from 'lucide-react';

const PRIORITY_MAP = {
  'KHẨN CẤP': { label: 'Khẩn cấp', tone: 'urgent' },
  URGENT: { label: 'Khẩn cấp', tone: 'urgent' },
  IMPORTANT: { label: 'Important', tone: 'important' },
  'QUAN TRỌNG': { label: 'Important', tone: 'important' },
  CAO: { label: 'Important', tone: 'important' },
  MEDIUM: { label: 'Medium', tone: 'medium' },
  'TRUNG BÌNH': { label: 'Medium', tone: 'medium' },
  TB: { label: 'Medium', tone: 'medium' },
  LOW: { label: 'Low', tone: 'low' },
  THẤP: { label: 'Low', tone: 'low' },
};

const TONE_CLASS = {
  urgent: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25',
  important: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25',
  medium: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
  low: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/40 dark:text-slate-400 dark:border-slate-600/40',
};

export function resolvePriority(raw) {
  const key = String(raw || '').trim().toUpperCase();
  if (!key) return { label: 'Medium', tone: 'medium' };
  if (PRIORITY_MAP[key]) return PRIORITY_MAP[key];
  if (key.includes('KHẨN') || key.includes('URGENT')) return PRIORITY_MAP['KHẨN CẤP'];
  if (key.includes('IMPORTANT') || key.includes('QUAN TRỌNG') || key === 'CAO') return PRIORITY_MAP.IMPORTANT;
  if (key.includes('LOW') || key.includes('THẤP')) return PRIORITY_MAP.LOW;
  return { label: raw, tone: 'medium' };
}

export default function PriorityBadge({ priority, className = '' }) {
  const { label, tone } = resolvePriority(priority);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${TONE_CLASS[tone]} ${className}`}
    >
      <Flag className="w-3 h-3 shrink-0" strokeWidth={2.25} />
      <span className="truncate">{label}</span>
    </span>
  );
}
