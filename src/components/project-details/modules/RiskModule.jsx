import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import DateInputDMY from '../../DateInputDMY';
import { getTodayDMY } from '../../../utils/timelineDates';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import {
  normalizeRiskSeverity,
  normalizeRiskStatus,
  getRiskSeverityStyle,
  getRiskSeverityRowAccent,
  getRiskStatusStyle,
} from '../../../utils/riskHelpers';

const SEVERITY_OPTIONS = ['Cao', 'Trung bình', 'Thấp'];
const STATUS_OPTIONS = ['Open', 'Đang xử lý', 'Theo dõi', 'Đã đóng'];

export default function RiskModule({ project, initialData }) {
  const canEdit = useProjectCanEdit();
  const [isOpen, setIsOpen] = useState(false);
  const [risks, setRisks] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const handleUpdate = async (id, field, value) => {
    if (!canEdit) return;
    try {
      setIsUpdating(true);
      const original = risks.find((r) => (r._rowIndex || r.id) === id);
      if (!original) return;
      const updated = { ...original, [field]: value };

      setRisks((prev) => prev.map((r) => ((r._rowIndex || r.id) === id ? updated : r)));

      const response = await api.updateRisk(updated);
      if (response && response.data) {
        setRisks(response.data);
      }
    } catch (error) {
      console.error('Update risk error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const openCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Open').length;
  const activeCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Đang xử lý').length;
  const watchCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Theo dõi').length;
  const closedCount = risks.filter((r) => normalizeRiskStatus(r.TRẠNG_THÁI) === 'Đã đóng').length;
  const highCount = risks.filter((r) => normalizeRiskSeverity(r.MỨC_ĐỘ) === 'Cao').length;

  const inputClass = `bg-transparent focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-[var(--text-main)] placeholder:text-[var(--text-muted)] ${(!canEdit || isUpdating) ? 'opacity-50 pointer-events-none' : ''}`;

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
                <div className="flex justify-end mb-3">
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
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead>
                      <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-main)]">
                        <th className="p-3 w-36">Mức độ</th>
                        <th className="p-3 min-w-[160px]">Nội dung</th>
                        <th className="p-3 min-w-[120px]">Ảnh hưởng</th>
                        <th className="p-3 w-36">Trạng thái</th>
                        <th className="p-3 min-w-[100px]">Phụ trách</th>
                        <th className="p-3 w-32">Ngày</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-main)]">
                      {risks.map((r) => {
                        const severity = normalizeRiskSeverity(r.MỨC_ĐỘ) || 'Trung bình';
                        const status = normalizeRiskStatus(r.TRẠNG_THÁI);
                        const rowAccent = getRiskSeverityRowAccent(severity);
                        const isClosed = status === 'Đã đóng';

                        return (
                          <tr
                            key={r._rowIndex || r.id}
                            className={`border-l-4 ${rowAccent} hover:bg-[var(--bg-panel)]/60 transition-colors ${isClosed ? 'opacity-70' : ''}`}
                          >
                            <td className="p-3">
                              <select
                                className={`w-full min-w-[6.5rem] text-xs font-bold focus:outline-none appearance-none cursor-pointer px-2.5 py-1 rounded-md border ${getRiskSeverityStyle(severity)} ${(!canEdit || isUpdating) ? 'opacity-50 pointer-events-none' : ''}`}
                                value={severity}
                                onChange={(e) => handleUpdate(r._rowIndex || r.id, 'MỨC_ĐỘ', e.target.value)}
                              >
                                {SEVERITY_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt} className="bg-[var(--bg-panel)] text-[var(--text-main)]">
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                className={`${inputClass} font-semibold`}
                                value={r.NỘI_DUNG || ''}
                                placeholder="Nhập nội dung..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRisks((prev) => prev.map((item) => ((item._rowIndex === r._rowIndex || item.id === r.id) ? { ...item, NỘI_DUNG: val } : item)));
                                }}
                                onBlur={(e) => handleUpdate(r._rowIndex || r.id, 'NỘI_DUNG', e.target.value)}
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                className={`${inputClass} text-[var(--text-muted)]`}
                                value={r.ẢNH_HƯỞNG || ''}
                                placeholder="Nhập ảnh hưởng..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRisks((prev) => prev.map((item) => ((item._rowIndex === r._rowIndex || item.id === r.id) ? { ...item, ẢNH_HƯỞNG: val } : item)));
                                }}
                                onBlur={(e) => handleUpdate(r._rowIndex || r.id, 'ẢNH_HƯỞNG', e.target.value)}
                              />
                            </td>
                            <td className="p-3">
                              <select
                                className={`w-full min-w-[6.5rem] text-xs font-bold focus:outline-none appearance-none cursor-pointer px-2.5 py-1 rounded-md border ${getRiskStatusStyle(status)} ${(!canEdit || isUpdating) ? 'opacity-50 pointer-events-none' : ''}`}
                                value={status}
                                onChange={(e) => handleUpdate(r._rowIndex || r.id, 'TRẠNG_THÁI', e.target.value)}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt} className="bg-[var(--bg-panel)] text-[var(--text-main)]">
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                className={`${inputClass} font-medium`}
                                value={r.PHỤ_TRÁCH || ''}
                                placeholder="Nhập người phụ trách..."
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRisks((prev) => prev.map((item) => ((item._rowIndex === r._rowIndex || item.id === r.id) ? { ...item, PHỤ_TRÁCH: val } : item)));
                                }}
                                onBlur={(e) => handleUpdate(r._rowIndex || r.id, 'PHỤ_TRÁCH', e.target.value)}
                              />
                            </td>
                            <td className="p-3">
                              <DateInputDMY
                                className={`${inputClass} tabular-nums`}
                                value={r.NGÀY || ''}
                                disabled={!canEdit || isUpdating}
                                showCalendar={canEdit && !isUpdating}
                                calendarTitle="Chọn ngày ghi nhận"
                                onChange={(val) => {
                                  setRisks((prev) => prev.map((item) => ((item._rowIndex === r._rowIndex || item.id === r.id) ? { ...item, NGÀY: val } : item)));
                                }}
                                onBlur={(_e, val) => handleUpdate(r._rowIndex || r.id, 'NGÀY', val)}
                              />
                            </td>
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
