/** Read-only share view: show translated text instead of disabled Vietnamese selects */
export function ModuleCell({ canEdit, value, colorClass = '', children, ts }) {
  if (!canEdit) {
    return (
      <span className={`font-bold ${colorClass}`}>
        {ts(value || '-')}
      </span>
    );
  }
  return children;
}
