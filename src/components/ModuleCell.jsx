import React from 'react';

/** Share: text màu. Nội bộ: select kế thừa màu từ wrapper (giống giao diện khách). */
export function ModuleCell({ canEdit, value, colorClass = '', children, ts }) {
  if (!canEdit) {
    return (
      <span className={`font-bold ${colorClass}`}>
        {ts(value || '-')}
      </span>
    );
  }

  const enhanced = React.isValidElement(children)
    ? React.cloneElement(children, {
        className: `${children.props.className || ''} module-field-select`.trim(),
      })
    : children;

  return (
    <span className={`inline-flex items-center font-bold ${colorClass}`}>
      {enhanced}
    </span>
  );
}
