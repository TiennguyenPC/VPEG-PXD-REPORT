import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Loader2, Landmark, Zap, Shield, Leaf, Building, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import ModuleDateHeader from './ModuleDateHeader';

const defaultPermits = [
  'Sở công thương',
  'EVN (Pmax, Scada)',
  'PCCC (Thông báo)',
  'Đăng ký môi trường',
  'Sở xây dựng/BQL'
];

export default function PermitModule({ project, initialData, onProgressChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const mergePermitData = (data) => {
    const getVal = (row, keys) => {
      if (!row) return null;
      const rowKeys = Object.keys(row);
      for (const key of keys) {
        const cleanKey = key.toLowerCase().replace(/[\s_]/g, '');
        const match = rowKeys.find(k => k.toLowerCase().replace(/[\s_]/g, '') === cleanKey);
        if (match && row[match] !== undefined && row[match] !== null && row[match] !== '') {
          return row[match];
        }
      }
      return null;
    };

    return defaultPermits.map((name, index) => {
      const nameLower = name.toLowerCase().replace(/\s+/g, '');
      const row = data ? data.find(r => {
        const hm = getVal(r, ['HẠNG_MỤC', 'HANG_MUC', 'hangmuc']);
        return hm && hm.toLowerCase().replace(/\s+/g, '') === nameLower;
      }) : null;

      if (row) {
        return {
          id: `permit_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC: name,
          TÌNH_TRẠNG: getVal(row, ['TÌNH_TRẠNG', 'tinhtrang']) || 'Chưa làm',
          KẾT_QUẢ_PHẢN_HỒI: getVal(row, ['KẾT_QUẢ_PHẢN_HỒI', 'KẾ_QUẢ_PHẢN_HỒI', 'phanhoi', 'ketquaphanhoi']) || 'Chưa có phản hồi',
          BƯỚC_TIẾP_THEO: getVal(row, ['BƯỚC_TIẾP_THEO', 'buoctieptheo', 'buoctiep']) || 'Nộp hồ sơ',
          KẾT_QUẢ_CUỐI: getVal(row, ['KẾT_QUẢ_CUỐI', 'KẾ_QUẢ_CUỐI', 'ketquacuoi', 'ket_qua_cuoi', 'kequacuoi']) || 'N/A'
        };
      }
      return {
        id: `permit_${index}`,
        _rowIndex: undefined,
        HẠNG_MỤC: name,
        TÌNH_TRẠNG: 'Chưa làm',
        KẾT_QUẢ_PHẢN_HỒI: 'Chưa có phản hồi',
        BƯỚC_TIẾP_THEO: 'Nộp hồ sơ',
        KẾT_QUẢ_CUỐI: 'N/A'
      };
    });
  };

  const STORAGE_KEY = `permits_${project?.PROJECT_ID || project?.id}`;

  const [permits, setPermits] = useState(() => {
    if (Array.isArray(initialData)) return mergePermitData(initialData);
    try {
      const cached = localStorage.getItem(`permits_${project?.PROJECT_ID || project?.id}`);
      if (cached) return mergePermitData(JSON.parse(cached));
    } catch (_) { }
    return mergePermitData([]);
  });
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialData)) {
      const merged = mergePermitData(initialData);
      setPermits(merged);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPermits(project?.PROJECT_ID || project?.id);
        const fetchedData = Array.isArray(data) ? data : [];
        setPermits(mergePermitData(fetchedData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedData));
        setSyncError(false);
      } catch (error) {
        console.error("Fetch permit error:", error);
        setSyncError(true); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 3000);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) setPermits(mergePermitData(JSON.parse(cached)));
        } catch (_) { }
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id, initialData]);

  useEffect(() => {
    const completedCount = permits.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && p.KẾT_QUẢ_CUỐI.trim() !== '').length;
    const progressPercent = permits.length > 0 ? Math.round((completedCount / permits.length) * 100) : 0;
    if (onProgressChange) onProgressChange(progressPercent);
  }, [permits, onProgressChange]);

  const handleUpdate = async (id, field, value) => {
    let updatedItem = null;
    const nextItems = permits.map(p => {
      if (p.id === id) {
        updatedItem = { ...p, [field]: value };
        return updatedItem;
      }
      return p;
    });
    setPermits(nextItems);

    if (nextItems.length > 0) {
      const rawData = nextItems.map(p => ({
        _rowIndex: p._rowIndex,
        PROJECT_ID: project?.PROJECT_ID || project?.id,
        HẠNG_MỤC: p.HẠNG_MỤC,
        TÌNH_TRẠNG: p.TÌNH_TRẠNG,
        KẾT_QUẢ_PHẢN_HỒI: p.KẾT_QUẢ_PHẢN_HỒI,
        BƯỚC_TIẾP_THEO: p.BƯỚC_TIẾP_THEO,
        KẾT_QUẢ_CUỐI: p.KẾT_QUẢ_CUỐI
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    }

    if (updatedItem) {
      try {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          NGÀY_BẮT_ĐẦU_MODULE: JSON.parse(localStorage.getItem(`dates_permit_${project?.PROJECT_ID || project?.id}`) || '{}').start || '',
          SỐ_NGÀY_MODULE: JSON.parse(localStorage.getItem(`dates_permit_${project?.PROJECT_ID || project?.id}`) || '{}').days || '',
          TÊN_DỰ_ÁN: project?.name || project?.TÊN_DỰ_ÁN || '-',
          HẠNG_MỤC: updatedItem.HẠNG_MỤC,
          
          TÌNH_TRẠNG: updatedItem.TÌNH_TRẠNG,
          tinhtrang: updatedItem.TÌNH_TRẠNG,
          
          KẾT_QUẢ_PHẢN_HỒI: updatedItem.KẾT_QUẢ_PHẢN_HỒI,
          phanhoi: updatedItem.KẾT_QUẢ_PHẢN_HỒI,
          ketquaphanhoi: updatedItem.KẾT_QUẢ_PHẢN_HỒI,
          
          BƯỚC_TIẾP_THEO: updatedItem.BƯỚC_TIẾP_THEO,
          buoctieptheo: updatedItem.BƯỚC_TIẾP_THEO,
          buoctiep: updatedItem.BƯỚC_TIẾP_THEO,
          
          KẾT_QUẢ_CUỐI: updatedItem.KẾT_QUẢ_CUỐI,
          ketquacuoi: updatedItem.KẾT_QUẢ_CUỐI,
          ket_qua_cuoi: updatedItem.KẾT_QUẢ_CUỐI
        };
        const response = await api.updatePermit(payload);
        if (response && response.data && response.data.length > 0) {
          // Extract only the row index to avoid overwriting user's fast inputs
          setPermits(prev => {
            const next = prev.map(p => {
              const serverRow = response.data.find(r => 
                (r.HẠNG_MỤC || '').toLowerCase().replace(/\s+/g, '') === p.HẠNG_MỤC.toLowerCase().replace(/\s+/g, '')
              );
              if (serverRow && serverRow._rowIndex) {
                return { ...p, _rowIndex: serverRow._rowIndex };
              }
              return p;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
          setSyncError(false);
        }
      } catch (error) {
        console.warn("GAS sync failed (data saved locally):", error);
        setSyncError(true); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 3000);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa làm': return 'text-slate-400';
      case 'Đang chuẩn bị hồ sơ': return 'text-[#f59e0b]';
      case 'Đã nộp hồ sơ': return 'text-[#3b82f6]';
      case 'Đang xử lý': return 'text-[#f97316]';
      case 'Chờ phản hồi': return 'text-[#f59e0b]';
      case 'Đang bổ sung': return 'text-[#ef4444]';
      case 'Tạm dừng': return 'text-rose-500';
      default: return 'text-slate-300';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Chưa có phản hồi': return 'text-slate-400';
      case 'Đã tiếp nhận': return 'text-[#3b82f6]';
      case 'Đã có biên nhận': return 'text-[#3b82f6]';
      case 'Đang xử lý': return 'text-[#f97316]';
      case 'Yêu cầu bổ sung': return 'text-red-400';
      case 'Đã duyệt': return 'text-[#10b981]';
      case 'Bị từ chối': return 'text-rose-500';
      default: return 'text-slate-300';
    }
  };

  const getNextStepColor = (step) => {
    switch (step) {
      case 'Nộp hồ sơ': return 'text-[#3b82f6]';
      case 'Bổ sung hồ sơ': return 'text-[#f59e0b]';
      case 'Theo dõi': return 'text-[#eab308]';
      case 'Lấy kết quả': return 'text-[#10b981] font-semibold';
      case 'Mời nghiệm thu': return 'text-[#10b981] font-semibold';
      default: return 'text-slate-300';
    }
  };

  const getFinalResultColor = (res) => {
    if (res && res !== '-' && res !== 'N/A') return 'text-[#10b981] font-semibold';
    return 'text-slate-500';
  };

  const getPermitIcon = (name) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('công thương')) return <Landmark className="w-3.5 h-3.5 text-[#3b82f6]" />;
    if (lowercase.includes('evn')) return <Zap className="w-3.5 h-3.5 text-[#eab308]" />;
    if (lowercase.includes('pccc')) return <Shield className="w-3.5 h-3.5 text-[#ef4444]" />;
    if (lowercase.includes('môi trường')) return <Leaf className="w-3.5 h-3.5 text-[#10b981]" />;
    return <Building className="w-3.5 h-3.5 text-[#a855f7]" />;
  };

  const completedCount = permits.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && p.KẾT_QUẢ_CUỐI.trim() !== '').length;
  const progressPercent = permits.length > 0 ? Math.round((completedCount / permits.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[var(--border-main)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">GIẤY PHÉP / HỒ SƠ PHÁP LÝ DỰ ÁN</h3>
        </div>

        <div className="flex items-center gap-4">
          <ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="permit" syncStatus={syncStatus}  />
          <div className="hidden sm:flex items-center justify-end w-[200px] gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center justify-end gap-2 text-[var(--text-muted)] w-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end w-full">
                {syncError && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full text-xs text-amber-400">
                    <CloudOff className="w-3 h-3" />
                    <span className="hidden xl:inline">Lưu cục bộ</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 bg-[var(--border-main)]/50 border border-[var(--border-light)] px-3 py-1 rounded-full text-xs min-w-[140px]">
                  <span className="text-[#8ca0c3] whitespace-nowrap">{completedCount}/{permits.length} hoàn thành</span>
                  <span className="w-1 h-1 bg-[#10b981] rounded-full shrink-0"></span>
                  <span className="text-[#10b981] font-bold shrink-0">{progressPercent}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-[1px] h-6 bg-[var(--border-main)] mx-2"></div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)]">
              <div className="overflow-x-auto rounded-lg border border-[var(--border-main)]">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-main)]">
                      <th className="p-3">Hạng mục</th>
                      <th className="p-3">Tình trạng</th>
                      <th className="p-3">Phản hồi</th>
                      <th className="p-3">Bước tiếp</th>
                      <th className="p-3">Kết quả cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]">
                    {permits.map(p => {
                      const standardStatuses = ['Chưa làm', 'Đang chuẩn bị hồ sơ', 'Đã nộp hồ sơ', 'Đang xử lý', 'Chờ phản hồi', 'Đang bổ sung', 'Tạm dừng'];
                      const standardResponses = ['Chưa có phản hồi', 'Đã tiếp nhận', 'Đã có biên nhận', 'Đang xử lý', 'Yêu cầu bổ sung', 'Đã duyệt', 'Bị từ chối'];
                      const standardSteps = ['Nộp hồ sơ', 'Liên hệ cán bộ', 'Bổ sung hồ sơ', 'Theo dõi', 'Gọi thúc', 'Lấy kết quả', 'Mời nghiệm thu'];
                      const standardResults = ['-', 'Đã có GCN', 'Đã có biên nhận', 'Đã nghiệm thu', 'Đã có công văn', 'Đã hoàn tất', 'N/A'];

                      return (
                        <tr key={p.id} className="hover:bg-[var(--bg-panel)]/50 transition-colors">
                          <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                            {getPermitIcon(p.HẠNG_MỤC)}
                            <span>{p.HẠNG_MỤC}</span>
                          </td>
                          <td className="p-3">
                            <select
                              className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(p.TÌNH_TRẠNG)}`}
                              value={p.TÌNH_TRẠNG || ''}
                              onChange={(e) => handleUpdate(p.id, 'TÌNH_TRẠNG', e.target.value)}
                            >
                              {!standardStatuses.includes(p.TÌNH_TRẠNG) && p.TÌNH_TRẠNG && (
                                <option className="bg-[var(--bg-panel)] text-slate-200" value={p.TÌNH_TRẠNG}>{p.TÌNH_TRẠNG}</option>
                              )}
                              {standardStatuses.map(status => (
                                <option key={status} className="bg-[var(--bg-panel)] text-slate-200" value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getResultColor(p.KẾT_QUẢ_PHẢN_HỒI)}`}
                              value={p.KẾT_QUẢ_PHẢN_HỒI || ''}
                              onChange={(e) => handleUpdate(p.id, 'KẾT_QUẢ_PHẢN_HỒI', e.target.value)}
                            >
                              {!standardResponses.includes(p.KẾT_QUẢ_PHẢN_HỒI) && p.KẾT_QUẢ_PHẢN_HỒI && (
                                <option className="bg-[var(--bg-panel)] text-slate-200" value={p.KẾT_QUẢ_PHẢN_HỒI}>{p.KẾT_QUẢ_PHẢN_HỒI}</option>
                              )}
                              {standardResponses.map(resp => (
                                <option key={resp} className="bg-[var(--bg-panel)] text-slate-200" value={resp}>{resp}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getNextStepColor(p.BƯỚC_TIẾP_THEO)}`}
                              value={p.BƯỚC_TIẾP_THEO || ''}
                              onChange={(e) => handleUpdate(p.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                            >
                              {!standardSteps.includes(p.BƯỚC_TIẾP_THEO) && p.BƯỚC_TIẾP_THEO && (
                                <option className="bg-[var(--bg-panel)] text-slate-200" value={p.BƯỚC_TIẾP_THEO}>{p.BƯỚC_TIẾP_THEO}</option>
                              )}
                              {standardSteps.map(step => (
                                <option key={step} className="bg-[var(--bg-panel)] text-slate-200" value={step}>{step}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              className={`bg-transparent focus:outline-none appearance-none cursor-pointer ${getFinalResultColor(p.KẾT_QUẢ_CUỐI)}`}
                              value={p.KẾT_QUẢ_CUỐI || ''}
                              onChange={(e) => handleUpdate(p.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
                            >
                              {!standardResults.includes(p.KẾT_QUẢ_CUỐI) && p.KẾT_QUẢ_CUỐI && (
                                <option className="bg-[var(--bg-panel)] text-slate-200" value={p.KẾT_QUẢ_CUỐI}>{p.KẾT_QUẢ_CUỐI}</option>
                              )}
                              {standardResults.map(res => (
                                <option key={res} className="bg-[var(--bg-panel)] text-slate-200" value={res}>{res === '-' ? '-' : res}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}