import React from 'react';
import { displayModuleField, hasModuleFieldData } from '../utils/moduleDisplay';
export function ModuleCell({ canEdit, value, colorClass = '', children, ts }) {
  if (!canEdit) {
    const text = displayModuleField(value, ts);
    return (
      <span className={`font-bold ${text ? colorClass : 'text-[var(--text-muted)]/30'}`}>
        {text}
      </span>
    );
  }

  const enhanced = React.isValidElement(children)
    ? React.cloneElement(children, {
        className: `${children.props.className || ''}`.trim(),
        colorClass: children.props.colorClass || colorClass,
      })
    : children;

  return (
    <span className={`inline-flex items-center font-bold w-full min-w-[6.5rem] ${hasModuleFieldData(value) ? colorClass : ''}`}>
      {enhanced}
    </span>
  );
}
