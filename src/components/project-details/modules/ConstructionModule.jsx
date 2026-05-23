import React, { useState, useEffect } from 'react';
import { HardHat, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import ModuleDateHeader from './ModuleDateHeader';

const initialGroups = [
  {
    id: 'A',
    name: '[A] CÔNG TÁC TẠM BAN ĐẦU',
    weight: 15,
    tasks: [
      { id: 'A1', code: '1', item: 'Đặt văn phòng BCH', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'A2', code: '1', item: 'Khu vực tập kết vật tư', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'A3', code: '1', item: 'Lắp đặt lối truy cập mái', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'A4', code: '1', item: 'Lắp đặt các công tác tạm', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'A5', code: '1', item: 'Nhận bàn giao mặt bằng thi công (Nhà biến tần, mặt bằng mái...)', start: '', endPlan: '', endActual: '', progress: 0 },
    ]
  },
  {
    id: 'B',
    name: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI',
    weight: 40,
    tasks: [
      { id: 'B1', code: '2', item: 'Lắp đặt lan can cứng', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B2', code: '2', item: 'Lắp đặt lối đi bộ', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B3', code: '2', item: 'Định vị & lắp đặt kẹp', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B4', code: '2', item: 'Lắp đặt thanh rail', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B5', code: '2', item: 'Lắp đặt giá đỡ máng cáp DC/AC', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B6', code: '2', item: 'Lắp đặt máng cáp DC/AC', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B7', code: '2', item: 'Kéo cáp DC từ chuỗi PV đến Inverter', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B8', code: '2', item: 'Lắp đặt tấm pin mặt trời (PV Module)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B9', code: '2', item: 'Lắp đặt hệ thống nối đất DC trên mái (Kẹp tiếp địa, cáp nối đất DC)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B10', code: '2', item: 'Lắp đặt trạm thời tiết (cảm biến, kéo cáp)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B11', code: '2', item: 'Lắp đặt hệ thống rửa nước', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'B12', code: '2', item: 'Lắp đặt thang truy cập mái', start: '', endPlan: '', endActual: '', progress: 0 },
    ]
  },
  {
    id: 'C',
    name: '[C] KHU VỰC PHÒNG INVERTER & TRẠM ĐIỆN',
    weight: 30,
    tasks: [
      { id: 'C1', code: '3', item: 'Lắp đặt khung inverter (Đổ bê tông nếu cần)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C2', code: '3', item: 'Lắp đặt biến tần', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C3', code: '3', item: 'Lắp đặt tủ ACDB và tủ trung gian, đấu nối', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C4', code: '3', item: 'Lắp đặt máng cáp DC/AC tại trạm inverter/ Tủ MSB của nhà máy', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C5', code: '3', item: 'Kéo cáp AC từ Inverter đến tủ ACDB Solar', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C6', code: '3', item: 'Kéo cáp AC từ tủ ACDB solar đến tủ MSB hiện hữu của nhà máy', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C7', code: '3', item: 'Lắp đặt hệ thống giám sát (lắp datalogger, UPS, nguồn điện, router và cài đặt)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C8', code: '3', item: 'Lắp đặt tủ Zero export', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C9', code: '3', item: 'Lắp đặt hệ thống tiếp địa AC/DC', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C10', code: '3', item: 'Lắp đặt hệ thống PCCC (Bảng tiêu lệnh, quả cầu PCCC, bình PCCC)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C11', code: '3', item: 'Lắp đặt hệ thống chiếu sáng', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'C12', code: '3', item: 'Ngắt điện để đấu nối và chỉnh sửa tủ MSB (Nếu cần)', start: '', endPlan: '', endActual: '', progress: 0 },
    ]
  },
  {
    id: 'D',
    name: '[D] CÔNG TÁC NGHIỆM THU T&C ĐÓNG ĐIỆN',
    weight: 15,
    tasks: [
      { id: 'D1', code: '4', item: 'Đóng điện cho T&C (Thử nghiệm & Nghiệm thu)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'D2', code: '4', item: 'T&C (Thử nghiệm & Nghiệm thu)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'D3', code: '4', item: 'Phân tích chất lượng điện của Inverter', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'D4', code: '4', item: 'Ngày vận hành thương mại (COD)', start: '', endPlan: '', endActual: '', progress: 0 },
      { id: 'D5', code: '4', item: 'Kiểm tra hiệu suất PR', start: '', endPlan: '', endActual: '', progress: 0 },
    ]
  }
];



export default function ConstructionModule({ project, initialData, onProgressChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ 'A': true, 'B': true, 'C': true, 'D': true });

  const mergeConstructionData = (data) => {
    if (!data || data.length === 0) return initialGroups.map(g => ({
      ...g,
      tasks: g.tasks.map(t => ({
        ...t,
        NGÀY_BẮT_ĐẦU: t.start,
        SỐ_NGÀY: '',
        NGÀY_KẾT_THÚC: t.endPlan,
        NGÀY_HT_THỰC_TẾ: t.endActual,
      }))
    }));
    return initialGroups.map(g => ({
      ...g,
      tasks: g.tasks.map(t => {
        const row = data.find(r => r.MÃ_CV === t.code || r.HẠNG_MỤC_CÔNG_VIỆC === t.item || r.id === t.id);
        if (row) {
          return {
            ...t,
            _rowIndex: row._rowIndex,
            NGÀY_BẮT_ĐẦU: row.NGÀY_BẮT_ĐẦU !== undefined ? row.NGÀY_BẮT_ĐẦU : t.start,
            NGÀY_KẾT_THÚC: row.NGÀY_KẾT_THÚC !== undefined ? row.NGÀY_KẾT_THÚC : t.endPlan,
            NGÀY_HT_THỰC_TẾ: row.NGÀY_HT_THỰC_TẾ !== undefined ? row.NGÀY_HT_THỰC_TẾ : t.endActual,
            TIẾN_ĐỘ_THỰC_TẾ: row.TIẾN_ĐỘ_THỰC_TẾ !== undefined ? Number(row.TIẾN_ĐỘ_THỰC_TẾ) : t.progress
          };
        }
        return {
          ...t,
          NGÀY_BẮT_ĐẦU: t.start,
          NGÀY_KẾT_THÚC: t.endPlan,
          NGÀY_HT_THỰC_TẾ: t.endActual,
          TIẾN_ĐỘ_THỰC_TẾ: t.progress
        };
      })
    }));
  };

  const [groups, setGroups] = useState(() => mergeConstructionData(initialData));
  const [rawData, setRawData] = useState(() => initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    if (initialData) {
      setGroups(mergeConstructionData(initialData));
      setRawData(initialData);
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getConstructions(project?.PROJECT_ID || project?.id);
        if (data && data.length > 0) {
          setGroups(mergeConstructionData(data));
          setRawData(data);
        }
      } catch (error) {
        console.error("Fetch construction error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id, initialData]);

  const calculateGroupProgress = (tasks) => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, task) => sum + (task.TIẾN_ĐỘ_THỰC_TẾ || 0), 0);
    return total / tasks.length;
  };

  useEffect(() => {
    let totalProg = 0;
    groups.forEach(g => {
      const groupProg = calculateGroupProgress(g.tasks);
      totalProg += groupProg * (g.weight / 100);
    });
    if (onProgressChange) onProgressChange(totalProg);
  }, [groups, onProgressChange]);

  const handleUpdate = async (groupId, taskId, field, value) => {
    try {
      setIsUpdating(true); setSyncStatus("saving");

      let updatedTask = null;
      const nextGroups = groups.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
              let temp = { ...t, [field]: value };
              updatedTask = temp;
              return updatedTask;
            }
            return t;
          })
        };
      }); setGroups(nextGroups);

      if (updatedTask) {
        const payload = {
          _rowIndex: updatedTask._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          NHÓM_THI_CÔNG: updatedTask.NHÓM_THI_CÔNG || initialGroups.find(g => g.id === groupId)?.name,
          MÃ_CV: updatedTask.code,
          HẠNG_MỤC_CÔNG_VIỆC: updatedTask.item,
          NGÀY_BẮT_ĐẦU: updatedTask.NGÀY_BẮT_ĐẦU,
          NGÀY_KẾT_THÚC: updatedTask.NGÀY_KẾT_THÚC,
          NGÀY_HT_THỰC_TẾ: updatedTask.NGÀY_HT_THỰC_TẾ,
          TIẾN_ĐỘ_THỰC_TẾ: updatedTask.TIẾN_ĐỘ_THỰC_TẾ,
          TRỌNG_SỐ: updatedTask.TRỌNG_SỐ || initialGroups.find(g => g.id === groupId)?.weight
        };
        const response = await api.updateConstruction(payload);
        if (response && response.data) {
          setGroups(mergeConstructionData(response.data));
        }
      }
    } catch (error) {
      console.error("Update construction error:", error);
    } finally {
      setIsUpdating(false); setSyncStatus("success"); setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  let totalProgress = 0;
  groups.forEach(g => {
    const groupProg = calculateGroupProgress(g.tasks);
    totalProgress += groupProg * (g.weight / 100);
  });

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[var(--border-main)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#eab308]/10 text-[#eab308] flex items-center justify-center">
            <HardHat className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">THI CÔNG HIỆN TRƯỜNG / LẮP ĐẶT DỰ ÁN</h3>
        </div>

        <div className="flex items-center gap-4">
          <ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="construction" syncStatus={syncStatus} initialData={rawData} />
          <div className="hidden sm:flex items-center justify-end w-[200px] gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center justify-end gap-2 text-[var(--text-muted)] w-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 bg-[var(--border-main)]/50 border border-[var(--border-main)] px-3 py-1 rounded-full text-xs text-[var(--text-main)] min-w-[140px]">
                <span className="whitespace-nowrap">Progress:</span> <span className="text-brand-green font-bold shrink-0">{Math.round(totalProgress)}%</span>
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
            <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)] space-y-4">

              {groups.map(group => {
                const groupProg = calculateGroupProgress(group.tasks);
                const isGroupOpen = expandedGroups[group.id];

                return (
                  <div key={group.id} className="border border-[var(--border-main)] rounded-lg overflow-hidden bg-[var(--bg-panel)]">
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between p-3 bg-[var(--bg-hover)] hover:bg-[#141c2f] transition-colors border-b border-[var(--border-main)]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white tracking-wider">{group.name}</span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border-main)]">
                          Trọng số: {group.weight}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3b82f6]">{Math.round(groupProg)}%</span>
                          <div className="w-24 h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-main)]">
                            <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${groupProg}%` }}></div>
                          </div>
                        </div>
                        {isGroupOpen ? <ChevronUp className="w-3.5 h-3.5 text-[var(--text-muted)]" /> : <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isGroupOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs min-w-[800px]">
                              <thead>
                                <tr className="bg-[var(--bg-main)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-main)]">
                                  <th className="p-3 w-16">Mã CV</th>
                                  <th className="p-3">Hạng mục công việc hiện trường</th>
                                  <th className="p-3 w-28">Ngày bắt đầu</th>
                                  <th className="p-3 w-28">Ngày kết thúc</th>
                                  <th className="p-3 w-28">Ngày HT thực tế</th>
                                  <th className="p-3 w-48 text-right pr-6">Tiến độ thực tế</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-main)]">
                                {group.tasks.map(task => (
                                  <tr key={task.id} className="hover:bg-[#141c2f]/40 transition-colors">
                                    <td className="p-3 font-semibold text-[var(--text-muted)]">{task.code}</td>
                                    <td className="p-3 font-semibold text-slate-200">{task.item}</td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        className={`bg-transparent font-semibold focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-slate-300 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={task.NGÀY_BẮT_ĐẦU || ''}
                                        placeholder="-"
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, NGÀY_BẮT_ĐẦU: v } : t)
                                          } : g));
                                        }}
                                        onBlur={(e) => handleUpdate(group.id, task.id, 'NGÀY_BẮT_ĐẦU', e.target.value)}
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        className={`bg-transparent font-semibold focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-slate-300 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={task.NGÀY_KẾT_THÚC || ''}
                                        placeholder="-"
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, NGÀY_KẾT_THÚC: v } : t)
                                          } : g));
                                        }}
                                        onBlur={(e) => handleUpdate(group.id, task.id, 'NGÀY_KẾT_THÚC', e.target.value)}
                                      />
                                    </td>
                                    <td className="p-3">
                                      <input
                                        type="text"
                                        className={`bg-transparent font-semibold focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${task.NGÀY_HT_THỰC_TẾ && task.NGÀY_HT_THỰC_TẾ !== '-' ? 'text-emerald-400' : 'text-slate-400'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={task.NGÀY_HT_THỰC_TẾ || ''}
                                        placeholder="-"
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, NGÀY_HT_THỰC_TẾ: v } : t)
                                          } : g));
                                        }}
                                        onBlur={(e) => handleUpdate(group.id, task.id, 'NGÀY_HT_THỰC_TẾ', e.target.value)}
                                      />
                                    </td>
                                    <td className="p-3 text-right pr-6">
                                      <div className="flex items-center justify-end gap-3">
                                        <input
                                          type="text"
                                          className={`bg-transparent font-bold focus:outline-none w-12 text-right border-b border-transparent focus:border-[#5252ff] ${task.TIẾN_ĐỘ_THỰC_TẾ === 100 ? 'text-emerald-400' : 'text-slate-300'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                          value={task.TIẾN_ĐỘ_THỰC_TẾ !== undefined ? `${task.TIẾN_ĐỘ_THỰC_TẾ}%` : '0%'}
                                          onChange={(e) => {
                                            const rawVal = e.target.value.replace('%', '');
                                            const numVal = isNaN(Number(rawVal)) ? 0 : Number(rawVal);
                                            setGroups(prev => prev.map(g => g.id === group.id ? {
                                              ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, TIẾN_ĐỘ_THỰC_TẾ: numVal } : t)
                                            } : g));
                                          }}
                                          onBlur={(e) => {
                                            const rawVal = e.target.value.replace('%', '');
                                            const numVal = isNaN(Number(rawVal)) ? 0 : Number(rawVal);
                                            handleUpdate(group.id, task.id, 'TIẾN_ĐỘ_THỰC_TẾ', numVal);
                                          }}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
