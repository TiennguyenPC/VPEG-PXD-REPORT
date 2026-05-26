import { useRef } from 'react';
import { Calendar } from 'lucide-react';
import { normalizeToDMY, toDisplayDM, completePartialDMY, toInputDateValue, fromInputDateValue } from '../utils/timelineDates';

/** Ô nhập ngày — chuẩn hóa khi blur; có thể bật lịch chọn nhanh */
export default function DateInputDMY({
  value,
  onChange,
  onBlur,
  className = '',
  disabled,
  placeholder = 'dd/mm/yyyy',
  showCalendar = true,
  calendarTitle = 'Chọn ngày',
  compact = false,
  displayMode = 'dmy',
}) {
  const pickerRef = useRef(null);
  const justCommittedRef = useRef(false);
  const isDm = displayMode === 'dm';

  const sanitizeTyping = (raw) => {
    const cleaned = String(raw || '').replace(/[^\d/]/g, '');
    const parts = cleaned.split('/');
    if (isDm) {
      if (parts.length >= 1 && parts[0].length > 2) parts[0] = parts[0].slice(0, 2);
      if (parts.length >= 2 && parts[1].length > 2) parts[1] = parts[1].slice(0, 2);
      if (parts.length > 2) return `${parts[0]}/${parts[1]}`;
      return parts.join('/');
    }
    if (parts.length >= 3 && parts[2].length > 4) {
      parts[2] = parts[2].slice(0, 4);
    }
    return parts.join('/');
  };

  const fullValue =
    value == null || value === '' || value === '-'
      ? (value === '-' ? '-' : '')
      : normalizeToDMY(value);

  const display = isDm
    ? (fullValue && fullValue !== '-' ? toDisplayDM(fullValue) : (value === '-' ? '-' : ''))
    : fullValue;

  const resolvedPlaceholder = placeholder || (isDm ? 'dd/mm' : 'dd/mm/yyyy');

  const normalizeOnBlur = (raw) => {
    if (!raw) return '';
    if (isDm) return completePartialDMY(raw, value);
    return normalizeToDMY(raw) || '';
  };

  const applyDate = (dmy, e) => {
    onChange?.(dmy);
    justCommittedRef.current = true;
    onBlur?.(e, dmy);
    requestAnimationFrame(() => {
      justCommittedRef.current = false;
    });
  };

  const openPicker = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (pickerRef.current?.showPicker) {
      pickerRef.current.showPicker();
    } else {
      pickerRef.current?.click();
    }
  };

  const isEmpty = !display;
  const showEmptyHint = !disabled && isEmpty && !compact && !isDm;

  const calendarPad = showCalendar && !disabled && !compact ? (isDm ? 'pr-8' : 'pr-9') : '';

  const inputClass = [
    className,
    calendarPad,
    showEmptyHint ? 'rounded-md border border-dashed border-[var(--border-main)] px-1.5 py-0.5 bg-[var(--bg-main)]/40 hover:border-[#5252ff]/40' : '',
  ].filter(Boolean).join(' ');

  const calendarBtnClass = compact
    ? 'p-0.5 rounded-md text-slate-400 hover:text-[#5252ff] hover:bg-[#5252ff]/10 transition-colors shrink-0'
    : 'absolute top-1/2 -translate-y-1/2 right-1.5 p-0.5 rounded-md text-slate-400 hover:text-[#5252ff] hover:bg-[#5252ff]/10 transition-colors shrink-0';

  const calendarIconClass = compact || isDm ? 'w-3 h-3' : 'w-4 h-4';

  const handleBlur = (e) => {
    if (justCommittedRef.current) return;
    const raw = e.target.value.trim();
    let finalVal = '';
    if (raw) {
      finalVal = normalizeOnBlur(raw) || '';
      onChange?.(finalVal);
    } else {
      onChange?.('');
    }
    onBlur?.(e, finalVal);
  };

  const useInlineCalendar = showCalendar && !disabled && (compact || isDm);

  if (useInlineCalendar) {
    const inlineInputClass = [
      className,
      isDm ? 'w-[3rem] shrink-0 px-0 text-center text-[11px]' : '',
      showEmptyHint ? 'rounded-md border border-dashed border-[var(--border-main)] px-1.5 py-0.5 bg-[var(--bg-main)]/40 hover:border-[#5252ff]/40' : '',
    ].filter(Boolean).join(' ');

    return (
      <div className={`inline-flex items-center gap-0.5 ${isDm ? 'w-fit' : 'w-full max-w-full'}`}>
        <input
          type="text"
          inputMode="numeric"
          placeholder={disabled ? '' : resolvedPlaceholder}
          value={display || ''}
          disabled={disabled}
          onChange={(e) => onChange?.(sanitizeTyping(e.target.value))}
          onBlur={handleBlur}
          className={inlineInputClass}
          title={isDm && fullValue && fullValue !== '-' ? fullValue : undefined}
        />
        <input
          ref={pickerRef}
          type="date"
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only absolute w-0 h-0 opacity-0 pointer-events-none"
          value={toInputDateValue(fullValue) || ''}
          onChange={(e) => {
            const dmy = fromInputDateValue(e.target.value);
            applyDate(dmy, e);
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={openPicker}
          className={calendarBtnClass}
          title={calendarTitle}
          aria-label={calendarTitle}
        >
          <Calendar className={calendarIconClass} />
        </button>
      </div>
    );
  }

  return (
    <div className={showCalendar ? 'relative w-full min-w-0' : 'inline-flex items-center gap-0.5 min-w-0 w-full'}>
      <input
        type="text"
        inputMode="numeric"
        placeholder={disabled ? '' : (showEmptyHint ? 'Chọn ngày…' : resolvedPlaceholder)}
        value={display || ''}
        disabled={disabled}
        onChange={(e) => onChange?.(sanitizeTyping(e.target.value))}
        onBlur={handleBlur}
        className={inputClass}
        title={isDm && fullValue && fullValue !== '-' ? fullValue : undefined}
      />
      {showCalendar && !disabled && (
        <>
          <input
            ref={pickerRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only absolute w-0 h-0 opacity-0 pointer-events-none"
            value={toInputDateValue(fullValue) || ''}
            onChange={(e) => {
              const dmy = fromInputDateValue(e.target.value);
              applyDate(dmy, e);
            }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={openPicker}
            className={calendarBtnClass}
            title={calendarTitle}
            aria-label={calendarTitle}
          >
            <Calendar className={calendarIconClass} />
          </button>
        </>
      )}
    </div>
  );
}
