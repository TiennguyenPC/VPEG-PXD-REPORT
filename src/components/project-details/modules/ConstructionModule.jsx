import React, { useState, useEffect } from 'react';
import { HardHat, ChevronDown, ChevronUp, Activity, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

const initialGroups = [
  {
    id: 'A',
    name: '[A] CÔNG TÁC TẠM BAN ĐẦU',
    weight: 15,
    tasks: [
      { id: 'A1', code: 'A.01', item: 'Nhận bàn giao mặt bằng thi công', start: '01/04/2026', endPlan: '02/04/2026', endActual: '02/04/2026', progress: 100 },
      { id: 'A2', code: 'A.02', item: 'Lắp đặt văn phòng BCH công trường', start: '02/04/2026', endPlan: '05/04/2026', endActual: '05/04/2026', progress: 100 },
      { id: 'A3', code: 'A.03', item: 'Lắp đặt kho chứa vật tư', start: '03/04/2026', endPlan: '06/04/2026', endActual: '06/04/2026', progress: 100 },
    ]
  },
  {
    id: 'B',
    name: '[B] KHU VỰC LẮP ĐẶT TRÊN MÁI',
    weight: 40,
    tasks: [
      { id: 'B1', code: 'B.01', item: 'Lắp đặt lan can an toàn mái', start: '10/04/2026', endPlan: '20/04/2026', endActual: '19/04/2026', progress: 100 },
      { id: 'B2', code: 'B.02', item: 'Định vị chân rail theo layout', start: '20/04/2026', endPlan: '25/04/2026', endActual: '26/04/2026', progress: 100 },
      { id: 'B3', code: 'B.03', item: 'Lắp đặt thanh rail nhôm', start: '25/04/2026', endPlan: '10/05/2026', endActual: '12/05/2026', progress: 100 },
      { id: 'B4', code: 'B.04', item: 'Lắp đặt tấm pin PV module', start: '10/05/2026', endPlan: '10/06/2026', endActual: '', progress: 45.2 },
    ]
  },
  {
    id: 'C',
    name: '[C] KHU VỰC NHÀ BIẾN TẦN & TRẠM ĐIỆN',
    weight: 30,
    tasks: [
      { id: 'C1', code: 'C.01', item: 'Gia công bệ inverter', start: '01/05/2026', endPlan: '10/05/2026', endActual: '10/05/2026', progress: 100 },
      { id: 'C2', code: 'C.02', item: 'Lắp đặt inverter', start: '10/05/2026', endPlan: '20/05/2026', endActual: '', progress: 60 },
    ]
  },
  {
    id: 'D',
    name: '[D] T&C — ĐÓNG ĐIỆN — COD',
    weight: 15,
    tasks: [
      { id: 'D1', code: 'D.01', item: 'Kiểm tra siết lực toàn bộ connection', start: '15/06/2026', endPlan: '18/06/2026', endActual: '', progress: 0 },
      { id: 'D2', code: 'D.02', item: 'Đóng điện COD', start: '29/06/2026', endPlan: '29/06/2026', endActual: '', progress: 0 },
    ]
  }
];

export default function ConstructionModule({ project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ 'A': false, 'B': true, 'C': true, 'D': false });
  const [groups, setGroups] = useState(() => initialGroups.map(g => ({
    ...g,
    tasks: g.tasks.map(t => ({
      ...t,
      NGÀY_BẮT_ĐẦU: t.start,
      NGÀY_KẾT_THÚC: t.endPlan,
      NGÀY_HT_THỰC_TẾ: t.endActual,
      TIẾN_ĐỘ_THỰC_TẾ: t.progress
    }))
  })));
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getConstructions(project?.PROJECT_ID || project?.id);
        if (data && data.length > 0) {
          const updatedGroups = initialGroups.map(g => ({
            ...g,
            tasks: g.tasks.map(t => {
              const row = data.find(r => r.MÃ_CV === t.code || r.id === t.id);
              if (row) {
                return { 
                  ...t, 
                  _rowIndex: row._rowIndex,
                  MÃ_CV: row.MÃ_CV || t.code,
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
          setGroups(updatedGroups);
        }
      } catch (error) {
        console.error("Fetch construction error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id]);

  const handleUpdate = async (groupId, taskId, field, value) => {
    try {
      setIsUpdating(true);
      
      let updatedTask = null;
      setGroups(prev => prev.map(g => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          tasks: g.tasks.map(t => {
            if (t.id === taskId) {
              updatedTask = { ...t, [field]: value };
              return updatedTask;
            }
            return t;
          })
        };
      }));

      if (updatedTask) {
        // Build payload with clean Google Sheet keys for construction
        const payload = {
          _rowIndex: updatedTask._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          NHÓM_THI_CÔNG: updatedTask.NHÓM_THI_CÔNG || initialGroups.find(g => g.id === groupId)?.name,
          MÃ_CV: updatedTask.MÃ_CV || updatedTask.code,
          HẠNG_MỤC_CÔNG_VIỆC: updatedTask.HẠNG_MỤC_CÔNG_VIỆC || updatedTask.item,
          NGÀY_BẮT_ĐẦU: updatedTask.NGÀY_BẮT_ĐẦU,
          NGÀY_KẾT_THÚC: updatedTask.NGÀY_KẾT_THÚC,
          NGÀY_HT_THỰC_TẾ: updatedTask.NGÀY_HT_THỰC_TẾ,
          TIẾN_ĐỘ_THỰC_TẾ: updatedTask.TIẾN_ĐỘ_THỰC_TẾ,
          TRỌNG_SỐ: updatedTask.TRỌNG_SỐ || updatedTask.weight
        };
        await api.updateConstruction(payload);
      }
    } catch (error) {
      console.error("Update construction error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calculate overall progress based on weights
  const calculateGroupProgress = (tasks) => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((sum, task) => sum + (task.TIẾN_ĐỘ_THỰC_TẾ || 0), 0);
    return total / tasks.length;
  };

  let totalProgress = 0;
  groups.forEach(g => {
    const groupProg = calculateGroupProgress(g.tasks);
    totalProgress += groupProg * (g.weight / 100);
  });

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#eab308]/10 text-[#eab308] flex items-center justify-center">
            <HardHat className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">THI CÔNG HIỆN TRƯỜNG / LẮP ĐẶT DỰ ÁN</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[#6b7d9b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <span className="text-white text-lg font-black tracking-tight">{totalProgress.toFixed(2)}%</span>
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
            <div className="p-4 border-t border-[#182135] bg-[#060a13] space-y-4">
              
              {groups.map(group => {
                const groupProg = calculateGroupProgress(group.tasks);
                const isGroupOpen = expandedGroups[group.id];

                return (
                  <div key={group.id} className="border border-[#182135] rounded-lg overflow-hidden bg-[#0b0f19]">
                    <button 
                      onClick={() => toggleGroup(group.id)}
                      className="w-full flex items-center justify-between p-3 bg-[#0d1322] hover:bg-[#141c2f] transition-colors border-b border-[#182135]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white tracking-wider">{group.name}</span>
                        <span className="text-[10px] font-bold text-[#6b7d9b] bg-[#060a13] px-2 py-0.5 rounded border border-[#182135]">
                          Trọng số: {group.weight}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#3b82f6]">{groupProg.toFixed(1)}%</span>
                          <div className="w-24 h-1.5 bg-[#060a13] rounded-full overflow-hidden border border-[#182135]">
                            <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${groupProg}%` }}></div>
                          </div>
                        </div>
                        {isGroupOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#6b7d9b]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#6b7d9b]" />}
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
                                <tr className="bg-[#060a13] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                                  <th className="p-3 w-16">Mã CV</th>
                                  <th className="p-3">Hạng mục công việc</th>
                                  <th className="p-3 w-28">Ngày BĐ</th>
                                  <th className="p-3 w-28">Kết thúc KH</th>
                                  <th className="p-3 w-28">Hoàn thành TT</th>
                                  <th className="p-3 w-48">Tiến độ thực tế %</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#182135]">
                                {group.tasks.map(task => (
                                  <tr key={task.id} className="hover:bg-[#141c2f]/40 transition-colors">
                                    <td className="p-3 font-semibold text-[#6b7d9b]">{task.code}</td>
                                    <td className="p-3 font-semibold text-slate-200">{task.item}</td>
                                    <td className="p-3 text-slate-400">{task.NGÀY_BẮT_ĐẦU}</td>
                                    <td className="p-3 text-slate-400">{task.NGÀY_KẾT_THÚC}</td>
                                    <td className="p-3">
                                      <input 
                                        type="text" 
                                        className={`bg-transparent text-emerald-400 font-semibold focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
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
                                    <td className="p-3">
                                      <div className="flex items-center gap-3">
                                        <input 
                                          type="number"
                                          min={0}
                                          max={100}
                                          className={`bg-transparent font-bold focus:outline-none w-14 border-b border-transparent focus:border-[#5252ff] ${task.TIẾN_ĐỘ_THỰC_TẾ === 100 ? 'text-emerald-400' : 'text-[#3b82f6]'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                                          value={task.TIẾN_ĐỘ_THỰC_TẾ || 0}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            setGroups(prev => prev.map(g => g.id === group.id ? {
                                              ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, TIẾN_ĐỘ_THỰC_TẾ: Number(v) } : t)
                                            } : g));
                                          }}
                                          onBlur={(e) => handleUpdate(group.id, task.id, 'TIẾN_ĐỘ_THỰC_TẾ', Number(e.target.value))}
                                        />
                                        <div className="flex-1 h-1.5 bg-[#060a13] rounded-full overflow-hidden border border-[#182135]">
                                          <div 
                                            className={`h-full rounded-full ${task.TIẾN_ĐỘ_THỰC_TẾ === 100 ? 'bg-emerald-500' : 'bg-[#3b82f6]'}`}
                                            style={{ width: `${task.TIẾN_ĐỘ_THỰC_TẾ}%` }}
                                          ></div>
                                        </div>
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
