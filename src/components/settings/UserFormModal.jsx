import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Save, Search, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  CREATABLE_ROLES,
  getEmployeeId,
  getEmployeeName,
  getEmployeeEmail,
  getEmployeePosition,
  mapPositionToRole,
} from '../../utils/permissions';
import {
  VUPHONG_EMAIL_DOMAIN,
  parseEmailLocal,
  buildVuphongEmail,
  isValidEmailLocal,
  formatApiError,
} from '../../utils/emailDomain';

const DEFAULT_PASSWORD = '123123';

const EMPTY_FORM = {
  employeeId: '',
  displayName: '',
  emailLocal: '',
  username: '',
  password: DEFAULT_PASSWORD,
  passwordConfirm: DEFAULT_PASSWORD,
  role: 'employee',
  assignedProjects: [],
};

export default function UserFormModal({ open, onClose, onSaved, editUser, employees, projects }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [projectSearch, setProjectSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(editUser?.userId);
  const totalSteps = 3;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError('');
    setProjectSearch('');
    setShowPassword(false);

    if (editUser) {
      setForm({
        employeeId: editUser.employeeId || '',
        displayName: editUser.displayName || '',
        emailLocal: parseEmailLocal(editUser.email),
        username: editUser.username || '',
        password: '',
        passwordConfirm: '',
        role: editUser.role || 'employee',
        assignedProjects: Array.isArray(editUser.assignedProjects) ? [...editUser.assignedProjects] : [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editUser]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.id || '').toLowerCase().includes(q) ||
        (p.client || '').toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  const selectedCount = form.assignedProjects.length;

  const findEmployee = useCallback(
    (employeeId) => employees.find((e) => String(getEmployeeId(e)) === String(employeeId)),
    [employees]
  );

  const buildFormFromEmployee = useCallback(
    (emp, base) => {
      if (!emp) return base;
      const emailLocal = parseEmailLocal(getEmployeeEmail(emp));
      const role = mapPositionToRole(getEmployeePosition(emp));
      return {
        ...base,
        employeeId: getEmployeeId(emp),
        displayName: getEmployeeName(emp),
        emailLocal,
        role,
        ...(!isEdit && {
          username: emailLocal,
          password: DEFAULT_PASSWORD,
          passwordConfirm: DEFAULT_PASSWORD,
        }),
      };
    },
    [isEdit]
  );

  const applyEmployeeToForm = useCallback(
    (emp) => {
      if (!emp) return;
      setForm((prev) => buildFormFromEmployee(emp, prev));
    },
    [buildFormFromEmployee]
  );

  useEffect(() => {
    if (!open || !form.employeeId || employees.length === 0) return;
    const emp = findEmployee(form.employeeId);
    if (!emp) return;
    setForm((prev) => {
      const next = buildFormFromEmployee(emp, prev);
      if (
        prev.emailLocal === next.emailLocal &&
        prev.username === next.username &&
        prev.role === next.role &&
        prev.password === next.password
      ) {
        return prev;
      }
      return next;
    });
  }, [open, form.employeeId, employees, findEmployee, buildFormFromEmployee]);

  const handleEmployeeChange = (employeeId) => {
    applyEmployeeToForm(findEmployee(employeeId));
  };

  const toggleProject = (projectId) => {
    const id = String(projectId);
    setForm((prev) => {
      const has = prev.assignedProjects.includes(id);
      return {
        ...prev,
        assignedProjects: has
          ? prev.assignedProjects.filter((x) => x !== id)
          : [...prev.assignedProjects, id],
      };
    });
  };

  const validateStep = (s, data = form) => {
    if (s === 1) {
      if (!data.employeeId) return 'Vui lòng chọn nhân viên';
      if (!data.emailLocal.trim()) {
        return 'Không tìm thấy email trong sheet EMPLOYEE — kiểm tra cột Email của nhân viên';
      }
      if (!isValidEmailLocal(data.emailLocal)) {
        return 'Phần tên email chỉ gồm chữ, số, dấu chấm, gạch ngang';
      }
    }
    if (s === 2) {
      if (!isEdit && (!data.username.trim() || data.username.trim().length < 3)) {
        return 'Username phải có ít nhất 3 ký tự';
      }
      if (!isEdit && data.password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
      if (!isEdit && data.password !== data.passwordConfirm) return 'Mật khẩu xác nhận không khớp';
      if (isEdit && data.password && data.password.length < 6) return 'Mật khẩu mới phải có ít nhất 6 ký tự';
      if (isEdit && data.password && data.password !== data.passwordConfirm) {
        return 'Mật khẩu xác nhận không khớp';
      }
      if (!data.role) return 'Vui lòng chọn role';
    }
    return '';
  };

  const handleNext = () => {
    let nextForm = form;
    if (step === 1 && form.employeeId) {
      const emp = findEmployee(form.employeeId);
      if (emp) {
        nextForm = buildFormFromEmployee(emp, form);
        setForm(nextForm);
      }
    }

    const err = validateStep(step, nextForm);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    for (let s = 1; s <= Math.min(step, 2); s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const payload = {
        employeeId: form.employeeId,
        displayName: form.displayName.trim(),
        email: buildVuphongEmail(form.emailLocal),
        role: form.role,
        assignedProjects: form.assignedProjects,
      };

      if (!isEdit) {
        payload.username = form.username.trim().toLowerCase();
        payload.password = form.password;
      } else {
        payload.userId = editUser.userId;
        if (form.password) payload.password = form.password;
      }

      await onSaved(payload, isEdit);
      onClose();
    } catch (err) {
      setError(formatApiError(err.message) || 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3 border-b border-[var(--border-main)] shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-strong)]">
                {isEdit ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Bước {step}/{totalSteps}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-3 h-0.5 bg-[var(--border-main)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5252ff] transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Nhân viên <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.employeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff]"
                >
                  <option value="">-- Chọn từ danh sách EMPLOYEE --</option>
                  {employees.map((emp) => {
                    const id = getEmployeeId(emp);
                    const name = getEmployeeName(emp);
                    return (
                      <option key={id} value={id}>
                        {name || id}
                      </option>
                    );
                  })}
                </select>
              </div>
              {form.displayName && (
                <p className="text-xs text-[var(--text-muted)]">
                  Họ tên: <span className="text-[var(--text-main)] font-medium">{form.displayName}</span>
                </p>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="flex rounded-lg border border-[var(--border-main)] overflow-hidden focus-within:border-[#5252ff] transition-colors">
                  <input
                    type="text"
                    value={form.emailLocal}
                    onChange={(e) => {
                      const v = e.target.value.toLowerCase().replace(/@.*$/, '');
                      setForm((p) => ({ ...p, emailLocal: v }));
                    }}
                    placeholder="vd: thuan.nguyen"
                    autoComplete="off"
                    className="flex-1 min-w-0 bg-[var(--bg-main)] text-[var(--text-main)] px-3 py-2.5 text-sm focus:outline-none"
                  />
                  <span className="shrink-0 flex items-center px-3 py-2.5 text-sm text-[var(--text-muted)] bg-[var(--bg-hover)] border-l border-[var(--border-main)] select-none">
                    {VUPHONG_EMAIL_DOMAIN}
                  </span>
                </div>
                {form.emailLocal && (
                  <p className="text-[10px] text-[var(--text-muted)]">
                    → <span className="text-[var(--text-main)]">{buildVuphongEmail(form.emailLocal)}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Username {!isEdit && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                  disabled={isEdit}
                  placeholder="Tự điền theo email nhân viên"
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff] disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'} {!isEdit && <span className="text-red-400">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:border-[#5252ff]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Xác nhận mật khẩu {!isEdit && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.passwordConfirm}
                  onChange={(e) => setForm((p) => ({ ...p, passwordConfirm: e.target.value }))}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Role <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff]"
                >
                  {CREATABLE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Ai được gán dự án ở bước tiếp theo sẽ có quyền sửa module/nhật ký. Công việc vẫn chỉ sửa khi được phân công tên.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--text-main)]">
                  Gán dự án ({selectedCount}/{projects.length})
                </p>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    placeholder="Tìm dự án..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
              </div>
              <div className="border border-[var(--border-main)] rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[var(--bg-main)] sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10" />
                      <th className="py-2 px-3 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase">Dự án</th>
                      <th className="py-2 px-3 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase hidden sm:table-cell">Khách hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => {
                      const pid = String(p.id);
                      const checked = form.assignedProjects.includes(pid);
                      return (
                        <tr
                          key={pid}
                          className={`border-t border-[var(--border-main)]/50 cursor-pointer hover:bg-[var(--bg-hover)] ${checked ? 'bg-[#5252ff]/5' : ''}`}
                          onClick={() => toggleProject(pid)}
                        >
                          <td className="py-2 px-3 text-center">
                            <input type="checkbox" readOnly checked={checked} className="accent-[#5252ff]" />
                          </td>
                          <td className="py-2 px-3 text-[var(--text-main)] font-medium truncate max-w-[200px]">{p.name}</td>
                          <td className="py-2 px-3 text-[var(--text-muted)] hidden sm:table-cell truncate">{p.client}</td>
                        </tr>
                      );
                    })}
                    {filteredProjects.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-[var(--text-muted)]">Không tìm thấy dự án</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-main)] flex items-center justify-between shrink-0">
          <p className="text-[10px] text-[var(--text-muted)] hidden sm:block">* Trường bắt buộc</p>
          <div className="flex items-center gap-2 ml-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[var(--border-main)] rounded-lg text-[var(--text-main)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#5252ff] hover:bg-[#4343ee] text-white rounded-lg disabled:opacity-50"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#5252ff] hover:bg-[#4343ee] text-white rounded-lg disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
