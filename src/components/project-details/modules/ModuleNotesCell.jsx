import React from 'react';

function AutoGrowingTextarea({ value, onChange, onBlur, disabled, placeholder, className = '' }) {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
      rows={1}
      className={`bg-transparent focus:outline-none w-full text-slate-300 resize-none overflow-hidden min-h-[24px] py-1 leading-normal transition-all ${className}`}
    />
  );
}

export default function ModuleNotesCell({
  value = '',
  canEdit = false,
  onChange,
  onBlur,
  placeholder = 'Nhập ghi chú...',
  readDisplay,
}) {
  if (canEdit) {
    return (
      <AutoGrowingTextarea
        value={value}
        placeholder={placeholder}
        disabled={!canEdit}
        onChange={onChange}
        onBlur={onBlur}
        className={
          !value?.trim()
            ? 'border border-dashed border-[var(--border-main)] rounded-md px-2 py-1 bg-[var(--bg-main)]/40 hover:border-[#5252ff]/40 focus:border-[#5252ff]'
            : 'border border-transparent focus:border-[#5252ff]'
        }
      />
    );
  }

  const display = readDisplay ?? (value ? String(value) : '');
  return <span className="text-slate-300">{display}</span>;
}
