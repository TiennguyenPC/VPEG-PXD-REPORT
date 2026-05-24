import { normalizeToDMY } from '../utils/timelineDates';

/** Ô nhập ngày dd/mm/yyyy — chuẩn hóa khi blur */
export default function DateInputDMY({
  value,
  onChange,
  onBlur,
  className = '',
  disabled,
  placeholder = 'dd/mm/yyyy',
}) {
  const display =
    value == null || value === '' || value === '-'
      ? (value === '-' ? '-' : '')
      : normalizeToDMY(value);

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={display || ''}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={(e) => {
        const raw = e.target.value.trim();
        let finalVal = '';
        if (raw) {
          finalVal = normalizeToDMY(raw) || raw;
          if (finalVal !== display) onChange?.(finalVal);
        } else {
          onChange?.('');
        }
        onBlur?.(e, finalVal);
      }}
      className={className}
    />
  );
}
