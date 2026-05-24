export function formatPercent3(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0%';
  return `${Math.round(Math.max(-100, Math.min(100, n)))}%`;
}
