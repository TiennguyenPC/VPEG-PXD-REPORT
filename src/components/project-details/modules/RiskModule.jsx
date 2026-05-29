import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import DateInputDMY from '../../DateInputDMY';
import { getTodayDMY } from '../../../utils/timelineDates';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import { getEmployeeName } from '../../../utils/permissions';
import {
  normalizeRiskSeverity,
  normalizeRiskStatus,
  getRiskSeverityStyle,
  getRiskStatusStyle,
  getRiskLateStyle,
  isRiskOverdue,
  getRiskDueDate,
} from '../../../utils/riskHelpers';

const SEVERITY_OPTIONS = ['Cao', 'Trung bình', 'Thấp'];
const STATUS_OPTIONS = ['Open', 'Đang xử lý', 'Theo dõi', 'Đã đóng'];

const TH = 'p-2.5 text-center text-[10px] font-bold uppercase tracking-wider align-middle';
const TD = 'p-2.5 align-top';

function RiskTextCell({ value, placeholder, onChange, disabled, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 36)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      disabled={disabled}
      className={`w-full min-w-0 resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent focus:outline-none border-b border-transparent focus:border-[#5252ff] text-[var(--text-main)] placeholder:text-[var(--text-muted)] leading-snug ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
    />
  );
}

export default function RiskModule({ project, initialData }) {
  const canEdit = useProjectCanEdit();
  const [isOpen, setIsOpen] = useState(false);
  const [risks, setRisks] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [saveHint, setSaveHint] = useState('');
  const [employees, setEmployees] = useState(() => {
    try {
      const cached = localStorage.getItem('epc_employees_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const pendingSaveRef = useRef(new Map());
  const saveTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const flushSaves = useCallback(async () => {
    if (!canEdit || isSavingRef.current) return;
    const entries = [...pendingSaveRef.current.entries()];
    if (!entries.length) {
      setSaveHint('');
      return;
    }

    isSavingRef.current = true;
    setSaveHint('saving');

    try {
      for (const [, row] of entries) {
        const key = String(row._rowIndex || row.id);
        pendingSaveRef.current.delete(key);
        await api.updateRisk(row);
      }
      setSaveHint('saved');
      setTimeout(() => setSaveHint(''), 1800);
    } catch (error) {
      console.error('Update risk error:', error);
      setSaveHint('error');
      setTimeout(() => setSaveHint(''), 3000);
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current.size > 0) {
        saveTimerRef.current = setTimeout(flushSaves, 300);
      }
    }
  }, [canEdit]);

  const scheduleSave = useCallback((id, field, value) => {
    if (!canEdit) return;
    const rowKey = String(id);

    setRisks((prev) => {
      const next = prev.map((r) => {
        if (String(r._rowIndex || r.id) !== rowKey) return r;
        return { ...r, [field]: value };
      });
      const row = next.find((r) => String(r._rowIndex || r.id) === rowKey);
      if (row) pendingSaveRef.current.set(rowKey, row);
      return next;
    });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(flushSaves, 450);
  }, [canEdit, flushSaves]);

  const handleDeleteRisk = useCallback(async (risk) => {
    if (!canEdit) return;
    const rowId = risk._rowIndex || risk.id;
    const label = risk.NỘI_DUNG || 'Rủi ro này';
    if (!window.confirm(`Xóa "${label}"?\nThao tác sẽ đồng bộ lên Google Sheet.`)) return;

    pendingSaveRef.current.delete(String(rowId));
    try {
      setSaveHint('saving');
      const response = await api.deleteRisk({
        ...risk,
        PROJECT_ID: risk.PROJECT_ID || project?.PROJECT_ID || project?.id,
      });
      if (response?.data) {
        setRisks(response.data);
      } else {
        setRisks((prev) => prev.filter((r) => String(r._rowIndex || r.id) !== String(rowId)));
      }
      setSaveHint('saved');
      setTimeout(() => setSaveHint(''), 1800);
    } catch (error) {
      console.error('Delete risk error:', error);
      setSaveHint('error');
      setTimeout(() => setSaveHint(''), 3000);
    }
  }, [canEdit, project?.PROJECT_ID, project?.id]);

  useEffect(() => {
    api.getEmployees()
      .then((data) => {
        if (data?.length) setEmployees(data);
      })
      .catch(() => {});
  }, []);

  const employeeNames = useMemo(() => {
    const names = employees.map(getEmployeeName).filter(Boolean);
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [employees]);

  useEffect(() => {
    if (initialData) {
      setRisks(initialData);
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getRisks(project?.PROJECT_ID || project?.id);
        if (data) setRisks(data);
      } catch (error) {
        console.error('Fetch risk error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) {
      fetchData();
    }
  }, [project?.PROJECT_ID, project?.id, initialData]);

  const openCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Open').length;
  const activeCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Đang xử lý').length;
  const watchCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Theo dõi').length;
  const closedCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Đã đóng').length;
  const highCount = risks.filter((r) => normalizeRiskSeverity(r.MỨC_ĐỘ) === 'Cao').length;
  const overdueCount = risks.filter((r) => isRiskOverdue(r)).length;

  const inputClass = `bg-transparent focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-[var(--text-main)] placeholder:text-[var(--text-muted)] ${!canEdit ? 'opacity-50 pointer-events-none' : ''}`;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[var(--border-main)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-strong)] uppercase tracking-wider">RỦI RO DỰ ÁN</h3>
          {highCount > 0 && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30">
              {highCount} cao
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-hover)] border border-[var(--border-main)]">
                  <span className="text-[var(--text-muted)]">Tổng</span>
                  <span className="text-[var(--text-strong)]">{risks.length}</span>
                </span>
                {overdueCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25">
                    Trễ {overdueCount}
                  </span>
                )}
                {openCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25">
                    Open {openCount}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25">
                  Xử lý {activeCount}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/25">
                  Theo dõi {watchCount}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25">
                  Đóng {closedCount}
                </span>
              </>
            )}
          </div>
          <div className="w-[1px] h-6 bg-[var(--border-main)] mx-2" />
          {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)]">
              {canEdit && (
                <div className="flex items-center justify-end gap-3 mb-3">
                  {saveHint === 'saving' && (
                    <span className="text-[10px] text-blue-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
                    </span>
                  )}
                  {saveHint === 'saved' && (
                    <span className="text-[10px] text-emerald-600">Đã lưu</span>
                  )}
                  {saveHint === 'error' && (
                    <span className="text-[10px] text-red-500">Lỗi lưu — thử lại</span>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!canEdit) return;
                      const newRisk = {
                        PROJECT_ID: project?.PROJECT_ID || project?.id || '',
                        MỨC_ĐỘ: 'Trung bình',
                        NỘI_DUNG: 'Rủi ro mới',
                        ẢNH_HƯỞNG: '',
                        TRẠNG_THÁI: 'Open',
                        PHỤ_TRÁCH: '',
                        NGÀY: getTodayDMY(),
                        NGÀY_HOÀN_THÀNH: '',
                        GHI_CHÚ: '',
                      };
                      const tempId = `new-${Date.now()}`;
                      setRisks((prev) => [...prev, { ...newRisk, _rowIndex: tempId }]);
                      try {
                        const response = await api.addRisk(newRisk);
                        if (response && response.data) {
                          setRisks(response.data);
                        } else {
                          const data = await api.getRisks(project?.PROJECT_ID || project?.id);
                          if (data) setRisks(data);
                        }
                      } catch (e) {
                        console.error('Add risk error:', e);
                      }
                    }}
                    className="bg-[#5252ff] hover:bg-[#4040ee] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm rủi ro
                  </button>
                </div>
              )}

              {risks.length === 0 && !isLoading ? (
                <div className="text-center py-10 text-[var(--text-muted)] text-sm border border-dashed border-[var(--border-main)] rounded-lg">
                  Chưa có rủi ro nào. {canEdit ? 'Bấm "Thêm rủi ro" để ghi nhận.' : ''}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--border-main)]">
                  <table className="w-full text-xs table-fixed min-w-[960px]">
                    <thead>
                      <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)] border-b border-[var(--border-main)]">
                        <th className={`${TH} w-[9%]`}>Mức độ</th>
                        <th className={`${TH} w-[24%]`}>Nội dung</th>
                        <th className={`${TH} w-[18%]`}>Ảnh hưởng</th>
                        <th className={`${TH} w-[11%]`}>Trạng thái</th>
                        <th className={`${TH} w-[13%]`}>Phụ trách</th>
                        <th className={`${TH} w-[10%]`}>Ngày</th>
                        <th className={`${TH} w-[9%]`}>Ngày HT</th>
                        {canEdit && <th className={`${TH} w-[5%]`}>Xóa</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)]">
                      {risks.map((r) => {
                        const severity = normalizeRiskSeverity(r.MỨC_ĐỘ) || 'Trung bình';
                        const status = normalizeRiskStatus(r.TRẠNG_THÁI);
                        const overdue = isRiskOverdue(r);
                        const isClosed = status === 'Đã đóng';
                        const selectDisabled = !canEdit;
                        const rowId = r._rowIndex || r.id;

                        return (
                          <tr
                            key={rowId}
                            className={`hover:bg-[var(--bg-panel)]/60 transition-colors ${isClosed ? 'opacity-70' : ''} ${overdue ? 'bg-red-50/40 dark:bg-red-500/5' : ''}`}
                          >
                            <td className={`${TD} text-center`}>
                              <div className="flex justify-center">
                                <div className={`relative inline-flex w-full max-w-[7rem] items-center rounded-full border ${getRiskSeverityStyle(severity)}`}>
                                  <select
                                    className={`risk-field-select relative z-10 w-full min-w-0 appearance-none bg-transparent text-inherit text-[10px] font-semibold px-2.5 py-1 pr-7 focus:outline-none cursor-pointer border-0 text-center ${selectDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                                    value={severity}
                                    onChange={(e) => scheduleSave(rowId, 'MỨC_ĐỘ', e.target.value)}
                                  >
                                    {SEVERITY_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt} className="bg-[var(--bg-panel)] text-[var(--text-main)]">
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                </div>
                              </div>
                            </td>
                            <td className={TD}>
                              <RiskTextCell
                                className="font-semibold text-left"
                                value={r.NỘI_DUNG || ''}
                                placeholder="Nhập nội dung..."
                                disabled={!canEdit}
                                onChange={(e) => scheduleSave(rowId, 'NỘI_DUNG', e.target.value)}
                              />
                            </td>
                            <td className={TD}>
                              <RiskTextCell
                                className="text-[var(--text-muted)] text-left"
                                value={r.ẢNH_HƯỞNG || ''}
                                placeholder="Nhập ảnh hưởng..."
                                disabled={!canEdit}
                                onChange={(e) => scheduleSave(rowId, 'ẢNH_HƯỞNG', e.target.value)}
                              />
                            </td>
                            <td className={`${TD} text-center`}>
                              <div className="flex flex-col items-center gap-1">
                                {overdue && (
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${getRiskLateStyle()}`}
                                    title={`Quá hạn xử lý (Hạn HT: ${getRiskDueDate(r) || '—'})`}
                                  >
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    Trễ
                                  </span>
                                )}
                                <div className={`relative inline-flex w-full max-w-[7.5rem] items-center rounded-full border ${getRiskStatusStyle(status)}`}>
                                  <select
                                    className={`risk-field-select relative z-10 w-full min-w-0 appearance-none bg-transparent text-inherit text-[10px] font-semibold px-2.5 py-1 pr-7 focus:outline-none cursor-pointer border-0 text-center ${selectDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                                    value={status}
                                    onChange={(e) => scheduleSave(rowId, 'TRẠNG_THÁI', e.target.value)}
                                  >
                                    {STATUS_OPTIONS.map((opt) => (
                                      <option key={opt} value={opt} className="bg-[var(--bg-panel)] text-[var(--text-main)]">
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                  <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                                </div>
                              </div>
                            </td>
                            <td className={`${TD} text-center`}>
                              {(() => {
                                const current = r.PHỤ_TRÁCH || '';
                                const options = current && !employeeNames.includes(current)
                                  ? [current, ...employeeNames]
                                  : employeeNames;
                                return (
                                  <select
                                    className={`w-full font-medium cursor-pointer rounded-md border border-[var(--border-main)] bg-[var(--bg-panel)] px-1.5 py-1 text-center text-[10px] focus:outline-none focus:border-[#5252ff] ${selectDisabled ? 'opacity-50 pointer-events-none' : ''}`}
                                    value={current}
                                    onChange={(e) => scheduleSave(rowId, 'PHỤ_TRÁCH', e.target.value)}
                                  >
                                    <option value="">-- Chọn --</option>
                                    {options.map((name) => (
                                      <option key={name} value={name}>{name}</option>
                                    ))}
                                  </select>
                                );
                              })()}
                            </td>
                            <td className={`${TD} text-center`}>
                              <DateInputDMY
                                className={`${inputClass} tabular-nums text-center`}
                                value={r.NGÀY || ''}
                                disabled={!canEdit}
                                showCalendar={canEdit}
                                calendarTitle="Ngày ghi nhận"
                                onChange={(val) => scheduleSave(rowId, 'NGÀY', val)}
                              />
                            </td>
                            <td className={`${TD} text-center`}>
                              <DateInputDMY
                                className={`${inputClass} tabular-nums text-center ${overdue ? 'text-red-600 font-semibold' : ''}`}
                                value={getRiskDueDate(r)}
                                disabled={!canEdit}
                                showCalendar={canEdit}
                                calendarTitle="Ngày hoàn thành xử lý"
                                onChange={(val) => scheduleSave(rowId, 'NGÀY_HOÀN_THÀNH', val)}
                              />
                            </td>
                            {canEdit && (
                              <td className={`${TD} text-center`}>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRisk(r)}
                                  className="inline-flex items-center justify-center p-1.5 rounded-md text-red-500 hover:bg-red-500/10 transition-colors"
                                  title="Xóa rủi ro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
