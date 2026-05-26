/** Giá trị mặc định khi chưa nhập — hiển thị trắng thay vì text placeholder */
const PLACEHOLDER_VALUES = new Set([
  'Chưa làm',
  'Chưa có phản hồi',
  'Chưa phản hồi',
  'Nộp hồ sơ',
  'Vẽ mới',
  'Chuẩn bị HS',
  'N/A',
  '-',
  '---',
  '0',
  '0%',
]);

export function normalizeModuleField(val) {
  if (val == null) return '';
  const s = String(val).trim();
  if (!s || PLACEHOLDER_VALUES.has(s)) return '';
  return s;
}

export function hasModuleFieldData(val) {
  return Boolean(normalizeModuleField(val));
}

export function displayModuleField(val, ts = (x) => x) {
  const normalized = normalizeModuleField(val);
  return normalized ? ts(normalized) : '';
}

export function formatModuleProgress(val) {
  const n = Number(val);
  if (!Number.isFinite(n) || n <= 0) return '';
  return `${n}%`;
}
