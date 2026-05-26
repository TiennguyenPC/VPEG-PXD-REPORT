import { getEmployeeName } from './permissions';
import { parseAssignees } from './taskFields';

/** Danh sách tên cho dropdown phân công — gộp EMPLOYEE + người đang có trên task */
export function buildAssigneeOptionList(employees = [], tasks = [], extraNames = []) {
  const seen = new Map();
  const add = (name) => {
    const value = String(name || '').trim();
    if (!value) return;
    const key = value.toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  };

  employees.forEach((emp) => add(getEmployeeName(emp) || emp.NAME || emp.name || emp.DISPLAY_NAME));
  (tasks || []).forEach((task) => parseAssignees(task?.NHÂN_SỰ).forEach(add));
  (extraNames || []).forEach(add);

  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'vi'));
}
