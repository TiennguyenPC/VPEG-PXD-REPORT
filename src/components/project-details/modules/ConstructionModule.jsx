import React, { useState, useEffect, useRef } from 'react';
import { HardHat, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import { formatPercent3 } from '../../../utils/formatPercent';
import ModuleDateHeader from './ModuleDateHeader';
import ModuleProgressPill from './ModuleProgressPill';
import DateInputDMY from '../../DateInputDMY';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import { useI18n } from '../../../context/I18nContext';
import ModuleNotesCell from './ModuleNotesCell';
import { normalizeModuleField, formatModuleProgress } from '../../../utils/moduleDisplay';
import useModuleOpenListener from '../../../hooks/useModuleOpenListener';

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
  const canEdit = useProjectCanEdit();
  const { t, tf, ts } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  useModuleOpenListener('construction', setIsOpen);
  const [expandedGroups, setExpandedGroups] = useState({ 'A': true, 'B': true, 'C': true, 'D': true });

  const normalizeItemKey = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');

  const findConstructionRow = (data, task) => {
    if (!data || !data.length) return null;
    const taskKey = normalizeItemKey(task.item);
    return data.find((r) => {
      const item = r.HẠNG_MỤC_CÔNG_VIỆC || r.hang_muc_cong_viec || '';
      if (item && normalizeItemKey(item) === taskKey) return true;
      return r.id === task.id;
    }) || null;
  };

  const mergeConstructionData = (data) => {
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
        const row = findConstructionRow(data, t);
        if (row) {
          const progressRaw = row.TIẾN_ĐỘ_THỰC_TẾ;
          const progressNum = Number(progressRaw);
          return {
            ...t,
            _rowIndex: row._rowIndex,
            NGÀY_BẮT_ĐẦU: normalizeModuleField(row.NGÀY_BẮT_ĐẦU !== undefined ? row.NGÀY_BẮT_ĐẦU : t.start),
            NGÀY_KẾT_THÚC: normalizeModuleField(row.NGÀY_KẾT_THÚC !== undefined ? row.NGÀY_KẾT_THÚC : t.endPlan),
            NGÀY_HT_THỰC_TẾ: normalizeModuleField(row.NGÀY_HT_THỰC_TẾ !== undefined ? row.NGÀY_HT_THỰC_TẾ : t.endActual),
            TIẾN_ĐỘ_THỰC_TẾ: Number.isFinite(progressNum) ? progressNum : t.progress,
            GHI_CHÚ: normalizeModuleField(getVal(row, ['GHI_CHÚ', 'ghichu']))
          };
        }
        return {
          ...t,
          NGÀY_BẮT_ĐẦU: t.start,
          NGÀY_KẾT_THÚC: t.endPlan,
          NGÀY_HT_THỰC_TẾ: t.endActual,
          TIẾN_ĐỘ_THỰC_TẾ: t.progress,
          GHI_CHÚ: ''
        };
      })
    }));
  };

  const [groups, setGroups] = useState(() => mergeConstructionData(initialData));
  const [rawData, setRawData] = useState(() => initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const saveInFlightRef = useRef(false);

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
    if (!canEdit || saveInFlightRef.current) return;

    const currentGroup = groups.find(g => g.id === groupId);
    const currentTask = currentGroup?.tasks.find(t => t.id === taskId);
    if (!currentTask) return;

    const normalizedValue = field === 'GHI_CHÚ'
      ? String(value ?? '')
      : normalizeModuleField(value);
    const currentValue = field === 'GHI_CHÚ'
      ? String(currentTask[field] ?? '')
      : normalizeModuleField(currentTask[field]);
    if (normalizedValue === currentValue) return;

    let updatedTask = null;
    const nextGroups = groups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        tasks: g.tasks.map(t => {
          if (t.id === taskId) {
            updatedTask = { ...t, [field]: normalizedValue };
            return updatedTask;
          }
          return t;
        })
      };
    });
    setGroups(nextGroups);

    if (!updatedTask) return;

    saveInFlightRef.current = true;
    setIsUpdating(true);
    setSyncStatus('saving');

    try {
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
        TRỌNG_SỐ: updatedTask.TRỌNG_SỐ || initialGroups.find(g => g.id === groupId)?.weight,
        GHI_CHÚ: updatedTask.GHI_CHÚ,
        ghichu: updatedTask.GHI_CHÚ
      };
      const response = await api.updateConstruction(payload);
      if (response?.data?.length) {
        setGroups(prev => prev.map(g => ({
          ...g,
          tasks: g.tasks.map(t => {
            const serverRow = findConstructionRow(response.data, t);
            if (serverRow?._rowIndex) {
              return { ...t, _rowIndex: serverRow._rowIndex };
            }
            return t;
          })
        })));
        setRawData(response.data);
      }
      setSyncStatus('success');
    } catch (error) {
      console.error('Update construction error:', error);
      setSyncStatus('error');
    } finally {
      saveInFlightRef.current = false;
      setIsUpdating(false);
      setTimeout(() => setSyncStatus(null), 3000);
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

  const allTasks = groups.flatMap(g => g.tasks);
  const totalTaskCount = allTasks.length;
  const completedCount = allTasks.filter(t => Number(t.TIẾN_ĐỘ_THỰC_TẾ || 0) >= 100).length;

  const TH = 'p-3 align-middle text-[10px] leading-snug font-bold uppercase tracking-wider text-[var(--text-muted)]';
  const TD = 'p-3 align-middle';
  const TH_CENTER = `${TH} text-center`;
  const TH_LEFT = `${TH} text-left`;
  const TD_CENTER = `${TD} text-center`;
  const TD_LEFT = `${TD} text-left`;
  const TH_DATE = `${TH_CENTER} whitespace-nowrap w-[5.75rem]`;
  const TD_DATE = `${TD_CENTER} whitespace-nowrap w-[5.75rem]`;
  const TH_PROGRESS = `${TH_CENTER} w-[7.25rem] min-w-[7.25rem]`;
  const TD_PROGRESS = `${TD_CENTER} whitespace-nowrap w-[7.25rem] min-w-[7.25rem]`;

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
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t('modules.construction')}</h3>
        </div>

        <div className="flex items-center gap-4">
          <ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="construction" syncStatus={syncStatus} initialData={rawData} />
          <div className="hidden sm:flex items-center justify-end w-[200px] gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center justify-end gap-2 text-[var(--text-muted)] w-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              <ModuleProgressPill
                projectId={project?.PROJECT_ID || project?.id}
                moduleKey="construction"
                initialData={rawData}
                done={completedCount}
                total={totalTaskCount}
                percent={totalProgress}
              />
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
                      className="w-full flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between p-3 bg-[var(--bg-hover)] hover:bg-[#141c2f] transition-colors border-b border-[var(--border-main)]"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-wrap">
                        <span className="text-xs font-bold text-white tracking-wider leading-snug">{ts(group.name)}</span>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-main)] px-2 py-0.5 rounded border border-[var(--border-main)] shrink-0">
                          {tf('modules.weight', { n: group.weight })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                        <div className="flex items-center gap-2 flex-1 md:flex-none min-w-0">
                          <span className="text-xs font-bold text-[#3b82f6] shrink-0">{Math.round(groupProg)}%</span>
                          <div className="flex-1 md:w-24 h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden border border-[var(--border-main)]">
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
                          <div className="overflow-x-auto custom-scrollbar touch-pan-x">
                            <table className="w-full text-xs min-w-[950px] table-fixed [&_th]:align-middle [&_td]:align-middle">
                              <colgroup>
                                <col className="w-12" />
                                <col />
                                <col className="w-[5.75rem]" />
                                <col className="w-[5.75rem]" />
                                <col className="w-[5.75rem]" />
                                <col className="w-[7.25rem]" />
                                <col className="w-[140px]" />
                              </colgroup>
                              <thead>
                                <tr className="bg-[var(--bg-main)] border-b border-[var(--border-main)]">
                                  <th className={`${TH_CENTER} w-12`}>{t('table.taskCode')}</th>
                                  <th className={`${TH_LEFT} min-w-[220px]`}>{t('table.taskItem')}</th>
                                  <th className={TH_DATE}>{t('table.startDate')}</th>
                                  <th className={TH_DATE}>{t('table.endDate')}</th>
                                  <th className={TH_DATE}>{t('table.actualEnd')}</th>
                                  <th className={TH_PROGRESS}>
                                    {(() => {
                                      const parts = String(t('table.actualProgress')).trim().split(/\s+/);
                                      if (parts.length < 2) return t('table.actualProgress');
                                      const mid = Math.ceil(parts.length / 2);
                                      return (
                                        <>
                                          {parts.slice(0, mid).join(' ')}
                                          <br />
                                          {parts.slice(mid).join(' ')}
                                        </>
                                      );
                                    })()}
                                  </th>
                                  <th className={`${TH_LEFT} min-w-[140px]`}>{t('table.notes')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-main)]">
                                {group.tasks.map(task => (
                                  <tr key={task.id} className="hover:bg-[#141c2f]/40 transition-colors">
                                    <td className={`${TD_CENTER} w-12 font-semibold text-[var(--text-muted)]`}>{task.code}</td>
                                    <td className={`${TD_LEFT} font-semibold text-slate-200`}>{ts(task.item)}</td>
                                    <td className={TD_DATE}>
                                      <DateInputDMY
                                        displayMode="dm"
                                        className={`bg-transparent font-semibold tabular-nums text-center focus:outline-none border-b border-transparent focus:border-[#5252ff] text-slate-300 ${(!canEdit || isUpdating) ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={task.NGÀY_BẮT_ĐẦU || ''}
                                        placeholder={canEdit ? 'dd/mm' : ''}
                                        disabled={!canEdit || isUpdating}
                                        onChange={(val) => {
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, NGÀY_BẮT_ĐẦU: val } : t)
                                          } : g));
                                        }}
                                        onBlur={(_e, val) => handleUpdate(group.id, task.id, 'NGÀY_BẮT_ĐẦU', val)}
                                      />
                                    </td>
                                    <td className={TD_DATE}>
                                      <DateInputDMY
                                        displayMode="dm"
                                        className={`bg-transparent font-semibold tabular-nums text-center focus:outline-none border-b border-transparent focus:border-[#5252ff] text-slate-300 ${(!canEdit || isUpdating) ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={task.NGÀY_KẾT_THÚC || ''}
                                        placeholder={canEdit ? 'dd/mm' : ''}
                                        disabled={!canEdit || isUpdating}
                                        onChange={(val) => {
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, NGÀY_KẾT_THÚC: val } : t)
                                          } : g));
                                        }}
                                        onBlur={(_e, val) => handleUpdate(group.id, task.id, 'NGÀY_KẾT_THÚC', val)}
                                      />
                                    </td>
                                    <td className={TD_DATE}>
                                      <DateInputDMY
                                        displayMode="dm"
                                        className={`bg-transparent font-semibold tabular-nums text-center focus:outline-none border-b border-transparent focus:border-[#5252ff] ${task.NGÀY_HT_THỰC_TẾ && task.NGÀY_HT_THỰC_TẾ !== '-' ? 'text-emerald-400' : 'text-slate-400'} ${(!canEdit || isUpdating) ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={task.NGÀY_HT_THỰC_TẾ || ''}
                                        placeholder={canEdit ? 'dd/mm' : ''}
                                        disabled={!canEdit || isUpdating}
                                        onChange={(val) => {
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, NGÀY_HT_THỰC_TẾ: val } : t)
                                          } : g));
                                        }}
                                        onBlur={(_e, val) => handleUpdate(group.id, task.id, 'NGÀY_HT_THỰC_TẾ', val)}
                                      />
                                    </td>
                                    <td className={TD_PROGRESS}>
                                      <span
                                        className={`inline-block font-bold tabular-nums ${task.TIẾN_ĐỘ_THỰC_TẾ === 100 ? 'text-emerald-400' : 'text-slate-300'}`}
                                        title="Cập nhật qua Nhật ký hiện trường"
                                      >
                                        {formatModuleProgress(task.TIẾN_ĐỘ_THỰC_TẾ)}
                                      </span>
                                    </td>
                                    <td className={`${TD_LEFT} min-w-[140px]`}>
                                      <ModuleNotesCell
                                        value={task.GHI_CHÚ || ''}
                                        canEdit={canEdit && !isUpdating}
                                        readDisplay={task.GHI_CHÚ ? ts(task.GHI_CHÚ) : ''}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setGroups(prev => prev.map(g => g.id === group.id ? {
                                            ...g, tasks: g.tasks.map(t => t.id === task.id ? { ...t, GHI_CHÚ: v } : t)
                                          } : g));
                                        }}
                                        onBlur={(e) => handleUpdate(group.id, task.id, 'GHI_CHÚ', e.target.value)}
                                      />
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
