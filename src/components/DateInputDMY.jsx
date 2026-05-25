import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { normalizeToDMY, toInputDateValue, fromInputDateValue } from '../utils/timelineDates';

/** Ô nhập ngày dd/mm/yyyy — chuẩn hóa khi blur; có thể bật lịch chọn nhanh */
export default function DateInputDMY({
  value,
  onChange,
  onBlur,
  className = '',
  disabled,
  placeholder = 'dd/mm/yyyy',
  showCalendar = false,
  calendarTitle = 'Chọn ngày',
}) {
  const pickerRef = useRef(null);
  const display =
    value == null || value === '' || value === '-'
      ? (value === '-' ? '-' : '')
      : normalizeToDMY(value);

  const applyDate = (dmy, e) => {
    onChange?.(dmy);
    onBlur?.(e, dmy);
  };

  return (
    <div className="inline-flex items-center gap-0.5 min-w-0">
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
      {showCalendar && !disabled && (
        <>
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only absolute w-0 h-0 opacity-0"
            value={toInputDateValue(display) || ''}
            onChange={(e) => {
              const dmy = fromInputDateValue(e.target.value);
              applyDate(dmy, e);
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (pickerRef.current?.showPicker) {
                pickerRef.current.showPicker();
              } else {
                pickerRef.current?.click();
              }
            }}
            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[#5252ff] hover:bg-[#5252ff]/10 transition-colors shrink-0"
            title={calendarTitle}
          >
            <Calendar className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}
