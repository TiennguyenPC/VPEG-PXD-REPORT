import { getEmployeeName, normalizePersonName } from './permissions';
import { parseAssignees, getAssigneeGivenName } from './taskFields';

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

const STATUS_KEYS = ['Chưa bắt đầu', 'Đang diễn ra', 'Trễ', 'Đã hoàn thành'];

/** Gom task theo nhân sự để vẽ biểu đồ cột stacked trên trang Công việc */
export function buildAssigneeStatusChartData(tasks = []) {
  const memberMap = new Map();

  tasks.forEach((task) => {
    const people = parseAssignees(task.NHÂN_SỰ);
    const list = people.length ? people : ['Chưa chỉ định'];

    list.forEach((person) => {
      const key = person === 'Chưa chỉ định'
        ? '__unassigned__'
        : (normalizePersonName(person) || person.toLowerCase());

      if (!memberMap.has(key)) {
        memberMap.set(key, {
          name: person === 'Chưa chỉ định' ? person : getAssigneeGivenName(person),
          fullName: person,
          'Chưa bắt đầu': 0,
          'Đang diễn ra': 0,
          'Trễ': 0,
          'Đã hoàn thành': 0,
        });
      }

      const entry = memberMap.get(key);
      const status = task.computedStatus;
      if (STATUS_KEYS.includes(status)) {
        entry[status] += 1;
      }
    });
  });

  return [...memberMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}
