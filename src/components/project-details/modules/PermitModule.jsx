import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Loader2, Landmark, Zap, Shield, Leaf, Building, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

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
    return defaultPermits.map((name, index) => {
      const nameLower = name.toLowerCase().replace(/\s+/g, '');
      const row = data ? data.find(r => r.HẠNG_MỤC && r.HẠNG_MỤC.toLowerCase().replace(/\s+/g, '') === nameLower) : null;
      if (row) {
        return {
          id: `permit_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC: name,
          TÌNH_TRẠNG: row.TÌNH_TRẠNG || 'Chưa làm',
          KẾT_QUẢ_PHẢN_HỒI: row.KẾT_QUẢ_PHẢN_HỒI || row.PHẢN_HỒI || 'Chưa có phản hồi',
          BƯỚC_TIẾP_THEO: row.BƯỚC_TIẾP_THEO || row.BƯỚC_TIẾP || 'Nộp hồ sơ',
          KẾT_QUẢ_CUỐI: row.KẾT_QUẢ_CUỐI || 'N/A'
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
    } catch (_) {}
    return mergePermitData([]);
  });
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
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
        setSyncError(true);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) setPermits(mergePermitData(JSON.parse(cached)));
        } catch (_) {}
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
    let updatedItems = [];
    let updatedItem = null;

    // 1. Update state immediately (optimistic)
    setPermits(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          updatedItem = { ...p, [field]: value };
          return updatedItem;
        }
        return p;
      });
      updatedItems = next;
      return next;
    });

    // 2. Persist to localStorage immediately (so reload doesn't lose data)
    if (updatedItems.length > 0) {
      const rawData = updatedItems.map(p => ({
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

    // 3. Try to sync to GAS (best-effort)
    if (updatedItem) {
      setIsUpdating(true);
      try {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          HẠNG_MỤC: updatedItem.HẠNG_MỤC,
          TÌNH_TRẠNG: updatedItem.TÌNH_TRẠNG,
          KẾT_QUẢ_PHẢN_HỒI: updatedItem.KẾT_QUẢ_PHẢN_HỒI,
          BƯỚC_TIẾP_THEO: updatedItem.BƯỚC_TIẾP_THEO,
          KẾT_QUẢ_CUỐI: updatedItem.KẾT_QUẢ_CUỐI
        };
        const response = await api.updatePermit(payload);
        if (response && response.data && response.data.length > 0) {
          const merged = mergePermitData(response.data);
          setPermits(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
          setSyncError(false);
        }
      } catch (error) {
        console.warn("GAS sync failed (data saved locally):", error);
        setSyncError(true);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa làm': return 'text-slate-400';
      case 'Đang chuẩn bị hồ sơ': return 'text-[#f59e0b]'; // orange/yellow
      case 'Đã nộp hồ sơ': return 'text-[#3b82f6]';
      case 'Đang xử lý': return 'text-[#f97316]';
      case 'Chờ phản hồi': return 'text-[#f59e0b]';
      case 'Đang bổ sung': return 'text-[#ef4444]'; // red
      case 'Tạm dừng': return 'text-rose-500';
      default: return 'text-slate-400';
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
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">GIẤY PHÉP / HỒ SƠ PHÁP LÝ DỰ ÁN</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[#6b7d9b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {syncError && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full text-xs text-amber-400">
                    <CloudOff className="w-3 h-3" />
                    <span>Lưu cục bộ</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-[#182135]/50 border border-[#1e293b] px-3 py-1 rounded-full text-xs">
                  <span className="text-[#8ca0c3]">{completedCount}/{permits.length} hoàn thành</span>
                  <span className="w-1 h-1 bg-[#10b981] rounded-full"></span>
                  <span className="text-[#10b981] font-bold">{progressPercent}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-[1px] h-6 bg-[#182135] mx-2"></div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#6b7d9b]" /> : <ChevronDown className="w-4 h-4 text-[#6b7d9b]" />}
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
            <div className="p-4 border-t border-[#182135] bg-[#060a13]">
              <div className="overflow-x-auto rounded-lg border border-[#182135]">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-[#0b0f19] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                      <th className="p-3">Hạng mục</th>
                      <th className="p-3">Tình trạng</th>
                      <th className="p-3">Phản hồi</th>
                      <th className="p-3">Bước tiếp</th>
                      <th className="p-3">Kết quả cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {permits.map(p => (
                      <tr key={p.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                          {getPermitIcon(p.HẠNG_MỤC)}
                          <span>{p.HẠNG_MỤC}</span>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(p.TÌNH_TRẠNG)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.TÌNH_TRẠNG || ''}
                            onChange={(e) => handleUpdate(p.id, 'TÌNH_TRẠNG', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa làm</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang chuẩn bị hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã nộp hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chờ phản hồi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang bổ sung</option>
                            <option className="bg-[#0b0f19] text-slate-200">Tạm dừng</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getResultColor(p.KẾT_QUẢ_PHẢN_HỒI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.KẾT_QUẢ_PHẢN_HỒI || ''}
                            onChange={(e) => handleUpdate(p.id, 'KẾT_QUẢ_PHẢN_HỒI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa có phản hồi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã tiếp nhận</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã có biên nhận</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Yêu cầu bổ sung</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Bị từ chối</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getNextStepColor(p.BƯỚC_TIẾP_THEO)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.BƯỚC_TIẾP_THEO || ''}
                            onChange={(e) => handleUpdate(p.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Nộp hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Liên hệ cán bộ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Bổ sung hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Theo dõi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Gọi thúc</option>
                            <option className="bg-[#0b0f19] text-slate-200">Lấy kết quả</option>
                            <option className="bg-[#0b0f19] text-slate-200">Mời nghiệm thu</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent focus:outline-none appearance-none cursor-pointer ${getFinalResultColor(p.KẾT_QUẢ_CUỐI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.KẾT_QUẢ_CUỐI || ''}
                            onChange={(e) => handleUpdate(p.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200" value="-">-</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã có GCN</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã có biên nhận</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã nghiệm thu</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã có công văn</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã hoàn tất</option>
                            <option className="bg-[#0b0f19] text-slate-200">N/A</option>
                          </select>
                        </td>
                      </tr>
                    ))}
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
