import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  CheckCircle2, Circle, Clock, LayoutGrid, Calendar, 
  BarChart3, Columns, Plus, Search, Filter, Download, 
  ChevronDown, AlertTriangle, MoreHorizontal, Calendar as CalendarIcon,
  PlayCircle, Flag, Star, MoreVertical, Bell, Sun, Moon, User, ClipboardList, X, Menu, ChevronLeft, Loader2
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import { api } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useSidebar } from '../hooks/useSidebar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DateInputDMY from '../components/DateInputDMY';
import { updateDashboardContext } from '../utils/dashboardContext';
import { getTaskDescription, isSameTask, UI_ONLY_TASK_FIELDS, enrichTaskForUI, applyTaskFieldUpdate, enrichTaskProjectIds, parseAssignees, getAssigneeGivenName } from '../utils/taskFields';
import { buildAssigneeOptionList } from '../utils/assigneeHelpers';
import AssigneeDisplay from '../components/AssigneeDisplay';
import AssigneeMultiSelect from '../components/AssigneeMultiSelect';
import TaskMobileCard from '../components/TaskMobileCard';
import { compareDateStrings, normalizeToDMY } from '../utils/timelineDates';
import { useAuth } from '../context/AuthContext';
import { canEditTask, canEditTaskField, canCreateTask, canDeleteTask, canViewTaskDetail, canToggleTaskComplete, hasFullTaskEditRights, canViewOfficeTasks, filterTasksForUser } from '../utils/permissions';

const NEW_TASK_PROJECT_CUSTOM = '__custom__';

const thCell = 'py-2 px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider align-middle';
const tdCell = 'py-2 px-2.5 text-xs align-middle overflow-hidden';
const tdClip = `${tdCell} max-w-0`;
const tdWrap = 'py-2 px-2.5 text-xs align-top';
const textClip = 'block truncate';
const textWrapCell = 'block text-[11px] leading-snug break-words whitespace-pre-wrap';

export default function TaskList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme, toggleTheme, resolvedTheme } = useTheme();
  const isLightChart = resolvedTheme === 'light';
  const chartStyles = useMemo(() => ({
    tooltip: {
      backgroundColor: isLightChart ? '#ffffff' : '#070b14',
      borderColor: isLightChart ? '#e2e8f0' : '#263554',
      color: isLightChart ? '#273449' : '#ffffff',
      fontSize: '12px',
      borderRadius: '8px',
      boxShadow: isLightChart ? '0 4px 12px rgba(15, 23, 42, 0.1)' : 'none',
    },
    tooltipItem: { color: isLightChart ? '#273449' : '#ffffff' },
    cursor: { fill: isLightChart ? 'rgba(82, 82, 255, 0.08)' : '#141c2f' },
    grid: isLightChart ? '#e2e8f0' : '#263554',
    axis: isLightChart ? '#64748b' : '#64748b',
    tick: { fill: isLightChart ? '#334155' : '#94a3b8' },
    legend: { fontSize: '11px', color: isLightChart ? '#475569' : '#94a3b8' },
    margin: { top: 16, right: 16, left: 0, bottom: 8 },
    marginRotated: { top: 16, right: 16, left: 0, bottom: 52 },
  }), [isLightChart]);
  const [projects, setProjects] = useState(() => {
    try {
      const cached = localStorage.getItem('epc_projects_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [employees, setEmployees] = useState(() => {
    try {
      const cached = localStorage.getItem('epc_employees_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [tasks, setTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('epc_tasks_cache');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isLoading, setIsLoading] = useState(() => tasks.length === 0);
  const [viewMode, setViewMode] = useState('grid'); // grid, board, calendar, chart
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  // Expose to AI Assistant
  useEffect(() => {
    updateDashboardContext({ tasks });
  }, [tasks]);
  
  // Process tasks dynamically for status
  const processedTasks = useMemo(() => {
    let filtered = filterTasksForUser(tasks, user, projects).map(enrichTaskForUI);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const projectFilter = (searchParams.get('project') || '').toLowerCase();
      filtered = filtered.filter(
        (t) => {
          const matchQ =
            (t.TÁC_VỤ || '').toLowerCase().includes(q) ||
            (t.taskDescription || '').toLowerCase().includes(q) ||
            (t.TÊN_DỰ_ÁN || '').toLowerCase().includes(q);
          if (!matchQ) return false;
          if (!projectFilter) return true;
          return String(t.PROJECT_ID || '').toLowerCase() === projectFilter ||
            (t.TÊN_DỰ_ÁN || '').toLowerCase().includes(projectFilter);
        }
      );
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'PINNED') {
           valA = a.PINNED ? 1 : 0;
           valB = b.PINNED ? 1 : 0;
        } else if (sortConfig.key === 'NGÀY_BẮT_ĐẦU_LOCAL' || sortConfig.key === 'NGÀY_KẾT_THÚC_LOCAL') {
           const cmp = compareDateStrings(valA, valB);
           return sortConfig.direction === 'asc' ? cmp : -cmp;
        } else if (sortConfig.key === 'computedStatus') {
           // Custom sort for status maybe, but string is fine
        } else {
           valA = String(valA || '').toLowerCase();
           valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [tasks, user, projects, searchQuery, sortConfig, searchParams]);

  // Fetch tasks, projects, employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (tasks.length === 0) setIsLoading(true);
        const [tasksData, projData, empData] = await Promise.all([
          api.getTasks().catch(() => []),
          api.getProjects().catch(() => []),
          api.getEmployees().catch(() => [])
        ]);
        if (tasksData && tasksData.length > 0) setTasks(tasksData);
        if (projData && projData.length > 0) setProjects(projData);
        if (empData && empData.length > 0) setEmployees(empData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [draftTask, setDraftTask] = useState(null);
  const [draftDirty, setDraftDirty] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [taskSaveError, setTaskSaveError] = useState(null);
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const taskMatchRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pendingSaveRef = useRef(null);
  const modalClosingRef = useRef(false);

  useEffect(() => () => clearTimeout(saveTimerRef.current), []);

  const [taskType, setTaskType] = useState('project'); // 'project' or 'office'
  const [newTaskProjectPicker, setNewTaskProjectPicker] = useState('');
  const [newTaskCustomProject, setNewTaskCustomProject] = useState('');
  const [newTask, setNewTask] = useState({
    TÊN_DỰ_ÁN: '',
    TÁC_VỤ: '',
    GHI_CHÚ: '',
    NHÂN_SỰ: '',
    NGÀY_BẮT_ĐẦU: '',
    NGÀY_KẾT_THÚC: '',
    BỘ_CHỨA: 'DỰ ÁN',
    TRẠNG_THÁI: 'Chưa bắt đầu',
    ƯU_TIÊN: 'Medium'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const taskContext = useMemo(() => ({ projects }), [projects]);

  const getActiveTask = useCallback(
    () => taskMatchRef.current || draftTask,
    [draftTask]
  );

  const canEditTaskRow = useCallback(
    (task) => canEditTask(user, task, taskContext),
    [user, taskContext]
  );

  const canFullyEditTaskRow = useCallback(
    (task) => hasFullTaskEditRights(user, task, taskContext),
    [user, taskContext]
  );

  const canEditDraftField = useCallback(
    (field) => {
      const task = getActiveTask();
      return task ? canEditTaskField(user, task, field, taskContext) : false;
    },
    [user, taskContext, getActiveTask]
  );

  const canFullyEditDraft = useCallback(
    () => {
      const task = getActiveTask();
      return task ? hasFullTaskEditRights(user, task, taskContext) : false;
    },
    [user, taskContext, getActiveTask]
  );

  const canToggleCompleteDraft = useCallback(
    () => {
      const task = getActiveTask();
      return task ? canToggleTaskComplete(user, task, taskContext) : false;
    },
    [user, taskContext, getActiveTask]
  );

  const canDeleteDraft = useCallback(
    () => {
      const task = getActiveTask();
      return task ? canDeleteTask(user, task, taskContext) : false;
    },
    [user, taskContext, getActiveTask]
  );

  const assigneeOptions = useMemo(
    () => buildAssigneeOptionList(employees, tasks, [user?.displayName]),
    [employees, tasks, user?.displayName]
  );

  const commitTasksLocal = useCallback((nextTasks) => {
    setTasks(nextTasks);
    try {
      localStorage.setItem('epc_tasks_cache', JSON.stringify(nextTasks));
    } catch {
      /* quota / private mode */
    }
  }, []);

  const resetNewTaskForm = useCallback(() => {
    setNewTaskOpen(false);
    setNewTaskProjectPicker('');
    setNewTaskCustomProject('');
    setNewTask({
      TÊN_DỰ_ÁN: '',
      TÁC_VỤ: '',
      GHI_CHÚ: '',
      NHÂN_SỰ: '',
      NGÀY_BẮT_ĐẦU: '',
      NGÀY_KẾT_THÚC: '',
      BỘ_CHỨA: 'DỰ ÁN',
      TRẠNG_THÁI: 'Chưa bắt đầu',
      ƯU_TIÊN: 'Medium',
    });
  }, []);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTask.TÁC_VỤ) return;

    let projectId = '';
    let projectName = '';
    let container = newTask.BỘ_CHỨA;

    if (taskType === 'project') {
      projectName = newTaskProjectPicker === NEW_TASK_PROJECT_CUSTOM
        ? newTaskCustomProject.trim()
        : (newTaskProjectPicker || newTask.TÊN_DỰ_ÁN || '').trim();
      if (!projectName) {
        alert('Vui lòng chọn dự án hoặc nhập tên dự án (khác / defect / bảo hành…)');
        return;
      }
      const project = projects.find(p => p.name === projectName);
      projectId = project ? (project.id || project.PROJECT_ID) : '';
    } else {
      if (!canViewOfficeTasks(user)) {
        alert('Bạn không có quyền tạo công việc Văn phòng / nội bộ');
        return;
      }
      projectName = 'VĂN PHÒNG';
      container = newTask.BỘ_CHỨA === 'DỰ ÁN' ? 'VĂN PHÒNG' : newTask.BỘ_CHỨA;
    }

    const taskToAdd = {
      ...newTask,
      PROJECT_ID: projectId,
      TÊN_DỰ_ÁN: projectName,
      BỘ_CHỨA: container,
      NGƯỜI_TẠO: user?.displayName || '',
    };
    const pendingKey = `_pending_${Date.now()}`;
    const optimisticTask = { ...taskToAdd, _rowIndex: pendingKey, _pendingSync: true };

    commitTasksLocal([...tasks, optimisticTask]);
    resetNewTaskForm();

    api.createTask(taskToAdd)
      .then((data) => commitTasksLocal(data || []))
      .catch((err) => {
        console.error(err);
        setTasks((prev) => {
          const next = prev.filter((t) => t._rowIndex !== pendingKey);
          try {
            localStorage.setItem('epc_tasks_cache', JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
        alert('Không đồng bộ được lên Google Sheet. Công việc đã được gỡ khỏi danh sách.');
      });
  };

  const openTaskDetail = useCallback((task) => {
    if (modalClosingRef.current || !canViewTaskDetail(user, task, taskContext)) return;
    const enriched = enrichTaskForUI(task);
    setDraftTask(enriched);
    taskMatchRef.current = { ...enriched };
    setDraftDirty(false);
    setTaskSaveError(null);
    setIsTaskMenuOpen(false);
  }, [user, taskContext]);

  const persistTaskUpdate = useCallback(async (originalTask, updatedTask) => {
    try {
      setTaskSaveError(null);
      const withProject = enrichTaskProjectIds(updatedTask, projects);
      const originalWithProject = enrichTaskProjectIds(originalTask, projects);
      const data = await api.updateTask(withProject, originalWithProject);
      setTasks(data || []);
      const synced = (data || []).find(t => t._rowIndex === updatedTask._rowIndex)
        || (data || []).find(t => isSameTask(t, updatedTask));
      taskMatchRef.current = synced ? { ...synced } : { ...updatedTask };
      if (synced) {
        setDraftTask(prev => {
          if (!prev || !isSameTask(prev, updatedTask)) return prev;
          return enrichTaskForUI({ ...synced });
        });
      }
      setDraftDirty(false);
      return true;
    } catch (err) {
      console.error(err);
      setTaskSaveError(err.message || 'Không lưu được lên Google Sheet');
      return false;
    }
  }, [projects]);

  const requestCloseTaskDetail = useCallback(() => {
    if (draftDirty) {
      if (!window.confirm('Thay đổi chưa được lưu. Bỏ và thoát?')) return;
    }
    clearTimeout(saveTimerRef.current);
    pendingSaveRef.current = null;
    modalClosingRef.current = true;
    setDraftTask(null);
    setDraftDirty(false);
    taskMatchRef.current = null;
    setTaskSaveError(null);
    setIsTaskMenuOpen(false);
    window.setTimeout(() => {
      modalClosingRef.current = false;
    }, 400);
  }, [draftDirty]);

  const saveDraftTask = useCallback(async () => {
    if (!draftTask || !taskMatchRef.current) return;
    if (!draftDirty) {
      requestCloseTaskDetail();
      return;
    }
    setIsSavingDraft(true);
    try {
      await persistTaskUpdate(taskMatchRef.current, draftTask);
    } finally {
      setIsSavingDraft(false);
    }
  }, [draftTask, draftDirty, persistTaskUpdate, requestCloseTaskDetail]);

  const updateDraftField = useCallback((field, value) => {
    if (!draftTask) return;
    const activeTask = taskMatchRef.current || draftTask;
    if (field === 'TRẠNG_THÁI') {
      if (!canToggleTaskComplete(user, activeTask, taskContext)) return;
    } else if (field === 'PINNED') {
      if (!hasFullTaskEditRights(user, activeTask, taskContext)) return;
    } else if (!canEditTaskField(user, activeTask, field, taskContext)) {
      return;
    }
    const updatedTask = enrichTaskForUI(applyTaskFieldUpdate(draftTask, field, value));
    setDraftTask(updatedTask);
    if (!UI_ONLY_TASK_FIELDS.has(field)) {
      setDraftDirty(true);
    }
  }, [draftTask, user, taskContext]);

  const updateDraftProject = useCallback((projectName) => {
    if (!draftTask) return;
    const activeTask = taskMatchRef.current || draftTask;
    if (!canEditTaskField(user, activeTask, 'TÊN_DỰ_ÁN', taskContext)) return;
    const project = projects.find((p) => p.name === projectName);
    const projectId = project ? (project.id || project.PROJECT_ID) : '';
    let updatedTask = enrichTaskForUI(applyTaskFieldUpdate(draftTask, 'TÊN_DỰ_ÁN', projectName));
    updatedTask = enrichTaskForUI(applyTaskFieldUpdate(updatedTask, 'PROJECT_ID', projectId));
    setDraftTask(updatedTask);
    setDraftDirty(true);
  }, [draftTask, user, taskContext, projects]);

  useEffect(() => {
    if (!draftTask) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') requestCloseTaskDetail();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [draftTask, requestCloseTaskDetail]);

  const queueTaskSave = useCallback((originalTask, updatedTask) => {
    pendingSaveRef.current = { original: originalTask, updated: updatedTask };
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const pending = pendingSaveRef.current;
      if (pending) persistTaskUpdate(pending.original, pending.updated);
    }, 800);
  }, [persistTaskUpdate]);

  const handleTaskUpdate = (task, field, value) => {
    const activeTask = taskMatchRef.current || task;
    if (field === 'TRẠNG_THÁI') {
      if (!canToggleTaskComplete(user, activeTask, taskContext)) return;
    } else if (field === 'PINNED') {
      if (!hasFullTaskEditRights(user, activeTask, taskContext)) return;
    } else if (!canEditTaskField(user, activeTask, field, taskContext)) {
      return;
    }

    const updatedTask = applyTaskFieldUpdate(task, field, value);

    if (UI_ONLY_TASK_FIELDS.has(field)) {
      setTasks(tasks.map(t => isSameTask(t, task) ? updatedTask : t));
      if (draftTask && isSameTask(draftTask, task)) setDraftTask(updatedTask);
      return;
    }

    setTasks(tasks.map(t => isSameTask(t, task) ? { ...updatedTask } : t));
    if (draftTask && isSameTask(draftTask, task)) setDraftTask(updatedTask);

    const originalForApi = taskMatchRef.current || task;
    queueTaskSave(originalForApi, updatedTask);
  };

  const updateTaskStatus = (task, newStatus) => handleTaskUpdate(task, 'TRẠNG_THÁI', newStatus);

  const handleTaskDelete = async (task) => {
    if (!canDeleteTask(user, taskMatchRef.current || task, taskContext)) {
      alert('Chỉ người tạo task mới được xóa (Admin có toàn quyền)');
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa tác vụ này?")) return;

    const previousTasks = tasks;
    setTasks(tasks.filter(t => !isSameTask(t, task)));
    requestCloseTaskDetail();
    try {
      const data = await api.deleteTask(task);
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa tác vụ: " + (err.message || ''));
      setTasks(previousTasks);
    }
  };

  // Grouping for Board
  const containers = useMemo(() => {
    const conts = new Set(processedTasks.map(t => t.BỘ_CHỨA || 'Khác'));
    return Array.from(conts);
  }, [processedTasks]);

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-100 font-sans">
      <Sidebar activeItem="tasks" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden pb-mobile-nav">
        <header className="px-4 md:px-6 pt-2 md:pt-3 pb-2 border-b border-[var(--border-main)]/30 flex justify-between items-center shrink-0 max-md:mobile-header-offset">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight uppercase">CÔNG VIỆC</h1>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5 font-medium">Quản lý và theo dõi tiến độ các tác vụ</p>
            </div>
          </div>
        </header>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-4 md:p-6 pt-0 max-md:pb-28 mobile-content-compact">
        
        {/* CONTROLS — mobile: chỉ cố định tab + tìm kiếm */}
        <div className="max-md:sticky max-md:top-0 z-40 -mx-4 md:-mx-6 mb-3 space-y-2 bg-[var(--bg-main)] px-4 md:px-6 pt-2 pb-1.5 border-b border-[var(--border-main)]/60 max-md:shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center">
          <div className="flex bg-[var(--bg-panel)] p-1 rounded-md border border-[var(--border-main)] shadow-sm overflow-x-auto max-w-full">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${viewMode === 'grid' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Lưới
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${viewMode === 'board' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <Columns className="w-4 h-4" /> Bảng
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${viewMode === 'calendar' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <CalendarIcon className="w-4 h-4" /> Lịch
            </button>
            <button 
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 md:px-5 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${viewMode === 'chart' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <BarChart3 className="w-4 h-4" /> Biểu đồ
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tìm kiếm tác vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-md text-xs text-slate-200 focus:border-[#5252ff] outline-none w-64 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <button className="bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] text-slate-200 border border-[var(--border-main)] px-4 py-2 rounded-md flex items-center gap-2 transition-all shadow-sm">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold">Lọc</span>
            </button>
            {canCreateTask(user) && (
            <div className="flex rounded-md shadow-[0_0_15px_rgba(82,82,255,0.3)]">
              <button 
                onClick={() => {
                  setNewTaskProjectPicker('');
                  setNewTaskCustomProject('');
                  setNewTaskOpen(true);
                }}
                className="bg-[#5252ff] hover:bg-[#4141d6] text-white text-xs font-medium px-4 py-2 rounded-l-md flex items-center gap-2 transition-all border-r border-[#4141d6]"
              >
                <Plus className="w-4 h-4" />
                Thêm tác vụ
              </button>
              <button className="bg-[#5252ff] hover:bg-[#4141d6] text-white px-2 py-2 rounded-r-md flex items-center justify-center transition-all">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            )}
          </div>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-md text-xs text-slate-200 focus:border-[#5252ff] outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
          {canCreateTask(user) && (
            <button
              type="button"
              onClick={() => {
                setNewTaskProjectPicker('');
                setNewTaskCustomProject('');
                setNewTaskOpen(true);
              }}
              className="shrink-0 bg-[#5252ff] hover:bg-[#4141d6] text-white p-2.5 rounded-md shadow-md"
              title="Thêm tác vụ"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>
        </div>

        {/* STAT CARDS — scroll cùng nội dung, không sticky */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 rounded-xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-sm mb-3 max-md:scale-[0.97] max-md:origin-top">
          <div className="p-2 md:p-2.5 border-r border-[var(--border-main)] flex items-center gap-2 max-md:gap-1.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[#5252ff] shrink-0">
              <ClipboardList className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-0.5">Tổng công việc</div>
              <div className="text-base md:text-lg font-bold text-white leading-none">{processedTasks.length}</div>
            </div>
          </div>
          <div className="p-2 md:p-2.5 border-r border-[var(--border-main)] flex items-center gap-2 max-md:gap-1.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[#3b82f6] shrink-0">
              <PlayCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-0.5">Đang diễn ra</div>
              <div className="text-base md:text-lg font-bold text-white leading-none">{processedTasks.filter(t => t.computedStatus === 'Đang diễn ra').length}</div>
              <div className="text-[8px] md:text-[9px] text-[#3b82f6] font-semibold mt-0.5 md:mt-1">{Math.round((processedTasks.filter(t => t.computedStatus === 'Đang diễn ra').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
          <div className="p-2 md:p-2.5 border-r border-[var(--border-main)] flex items-center gap-2 max-md:gap-1.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-red-400 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-0.5">Trễ hạn</div>
              <div className="text-base md:text-lg font-bold text-white leading-none">{processedTasks.filter(t => t.computedStatus === 'Trễ').length}</div>
              <div className="text-[8px] md:text-[9px] text-red-400 font-semibold mt-0.5 md:mt-1">{Math.round((processedTasks.filter(t => t.computedStatus === 'Trễ').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
          <div className="p-2 md:p-2.5 border-r border-[var(--border-main)] flex items-center gap-2 max-md:gap-1.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[#10b981] shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-0.5">Hoàn thành</div>
              <div className="text-base md:text-lg font-bold text-white leading-none">{processedTasks.filter(t => t.computedStatus === 'Đã hoàn thành').length}</div>
              <div className="text-[8px] md:text-[9px] text-[#10b981] font-semibold mt-0.5 md:mt-1">{Math.round((processedTasks.filter(t => t.computedStatus === 'Đã hoàn thành').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
          <div className="p-2 md:p-2.5 flex items-center gap-2 max-md:gap-1.5 col-span-2 md:col-span-1">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-yellow-500 shrink-0">
              <Flag className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] md:text-[10px] text-slate-400 font-medium mb-0.5">Ưu tiên cao</div>
              <div className="text-base md:text-lg font-bold text-white leading-none">{processedTasks.filter(t => t.ƯU_TIÊN === 'Important' || t.ƯU_TIÊN === 'Khẩn cấp' || t.ƯU_TIÊN === 'Cao').length}</div>
              <div className="text-[8px] md:text-[9px] text-yellow-500 font-semibold mt-0.5 md:mt-1">{Math.round((processedTasks.filter(t => t.ƯU_TIÊN === 'Important' || t.ƯU_TIÊN === 'Khẩn cấp' || t.ƯU_TIÊN === 'Cao').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
        </div>
        {viewMode === 'board' && containers.length > 0 && (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${Math.max(containers.length, 1)}, minmax(280px, 1fr))` }}
          >
            {containers.map(container => (
              <div key={container} className="p-2.5 border border-[var(--border-main)] rounded-xl bg-[var(--bg-panel)]/95 shadow-sm flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-strong)] text-sm uppercase tracking-wide flex items-center gap-2">
                  {container}
                  <span className="bg-[#5252ff]/10 text-[#5252ff] px-2 py-0.5 rounded text-[10px]">
                    {processedTasks.filter(t => t.BỘ_CHỨA === container).length}
                  </span>
                </h3>
                <button className="text-slate-400 hover:text-[#5252ff]">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        {viewMode === 'calendar' && (
          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)]/95 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--border-main)]/60">
              <h2 className="text-sm font-bold text-[var(--text-strong)] uppercase tracking-wider">
                Tháng {new Date().getMonth() + 1} / {new Date().getFullYear()}
              </h2>
            </div>
            <div className="grid grid-cols-7">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                <div key={d} className="p-1.5 text-center text-[11px] font-bold text-slate-400 border-r border-[var(--border-main)]/30 uppercase last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="flex justify-center py-12 text-slate-400 text-sm">Đang tải công việc...</div>
        ) : (
          <>
            {/* GRID VIEW — mobile: cards; desktop: table */}
            {viewMode === 'grid' && (
              <>
              <div className="md:hidden space-y-2.5">
                {processedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((task) => {
                  const taskEditable = canEditTaskRow(task);
                  const taskFullyEditable = canFullyEditTaskRow(task);
                  const canOpenTask = canViewTaskDetail(user, task);
                  return (
                    <TaskMobileCard
                      key={task._rowIndex ?? `${task.TÁC_VỤ}-${task.PROJECT_ID}`}
                      task={task}
                      taskEditable={taskEditable}
                      taskFullyEditable={taskFullyEditable}
                      canOpenTask={canOpenTask}
                      onOpen={() => openTaskDetail(task)}
                      onTogglePin={() => handleTaskUpdate(task, 'PINNED', !task.PINNED)}
                      onToggleComplete={() =>
                        updateTaskStatus(
                          task,
                          task.computedStatus === 'Đã hoàn thành' ? '' : 'Đã hoàn thành'
                        )
                      }
                    />
                  );
                })}
                {processedTasks.length === 0 && (
                  <div className="py-10 text-center text-slate-400 text-sm">Chưa có công việc</div>
                )}
              </div>
              <div className="hidden md:block border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] shadow-xl overflow-hidden min-w-0">
                <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '5%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#0c1221] border-b border-[var(--border-main)] text-slate-300">
                      <th className={`${thCell} text-left cursor-pointer hover:text-white`} onClick={() => handleSort('TÁC_VỤ')}>Tên tác vụ <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'TÁC_VỤ' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'TÁC_VỤ' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-left cursor-pointer hover:text-white`} onClick={() => handleSort('taskDescription')}>Mô tả <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'taskDescription' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'taskDescription' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-left cursor-pointer hover:text-white`} onClick={() => handleSort('TÊN_DỰ_ÁN')}>Dự án <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'TÊN_DỰ_ÁN' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'TÊN_DỰ_ÁN' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-left cursor-pointer hover:text-white`} onClick={() => handleSort('NHÂN_SỰ')}>Phân công <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'NHÂN_SỰ' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'NHÂN_SỰ' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-center cursor-pointer hover:text-white`} onClick={() => handleSort('NGÀY_BẮT_ĐẦU_LOCAL')}>Bắt đầu <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'NGÀY_BẮT_ĐẦU_LOCAL' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'NGÀY_BẮT_ĐẦU_LOCAL' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-center cursor-pointer hover:text-white`} onClick={() => handleSort('NGÀY_KẾT_THÚC_LOCAL')}>Đến hạn <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'NGÀY_KẾT_THÚC_LOCAL' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'NGÀY_KẾT_THÚC_LOCAL' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-center cursor-pointer hover:text-white`} onClick={() => handleSort('computedStatus')}>Trạng thái <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'computedStatus' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'computedStatus' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={`${thCell} text-center cursor-pointer hover:text-white`} onClick={() => handleSort('ƯU_TIÊN')}>Ưu tiên <ChevronDown className={`w-3 h-3 inline-block ml-0.5 transition-transform ${sortConfig.key === 'ƯU_TIÊN' ? 'opacity-100' : 'opacity-40'} ${sortConfig.key === 'ƯU_TIÊN' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className={thCell} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]/50 bg-[#0e1628]">
                    {processedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((task) => {
                      const taskEditable = canEditTaskRow(task);
                      const taskFullyEditable = canFullyEditTaskRow(task);
                      const canOpenTask = canViewTaskDetail(user, task);
                      return (
                      <tr key={task._rowIndex ?? `${task.TÁC_VỤ}-${task.PROJECT_ID}`} className={`hover:bg-[#141c2f] transition-colors group ${canOpenTask ? 'cursor-pointer' : ''}`} onClick={canOpenTask ? () => openTaskDetail(task) : undefined}>
                        <td className={tdClip}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button 
                              className={`shrink-0 transition-colors ${task.PINNED ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'} ${!taskFullyEditable ? 'opacity-40 pointer-events-none' : ''}`}
                              onClick={e => { e.stopPropagation(); handleTaskUpdate(task, 'PINNED', !task.PINNED); }}
                            >
                              <Star className={`w-3.5 h-3.5 ${task.PINNED ? 'fill-current' : ''}`} />
                            </button>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.computedStatus === 'Đã hoàn thành' ? 'bg-[#10b981]' : task.computedStatus === 'Trễ' ? 'bg-red-500' : task.computedStatus === 'Đang diễn ra' ? 'bg-[#3b82f6]' : 'bg-slate-500'}`} />
                            <span className={`${textClip} font-semibold text-slate-200 ${task.computedStatus === 'Đã hoàn thành' ? 'line-through text-slate-500' : ''}`} title={task.TÁC_VỤ}>
                              {task.TÁC_VỤ}
                            </span>
                          </div>
                        </td>
                        <td className={tdWrap}>
                          <span className={`${textWrapCell} text-slate-400`}>
                            {task.taskDescription || '—'}
                          </span>
                        </td>
                        <td className={tdClip}>
                          <span className={`${textClip} text-slate-300 font-medium`} title={task.TÊN_DỰ_ÁN}>
                            {task.TÊN_DỰ_ÁN || '—'}
                          </span>
                        </td>
                        <td className={tdClip}>
                          <AssigneeDisplay assignees={task.NHÂN_SỰ} variant="dark" className="max-w-full" />
                        </td>
                        <td className={`${tdCell} text-center text-slate-400 tabular-nums whitespace-nowrap`}>{task.NGÀY_BẮT_ĐẦU_LOCAL || normalizeToDMY(task.NGÀY_BẮT_ĐẦU) || '—'}</td>
                        <td className={`${tdCell} text-center font-semibold tabular-nums whitespace-nowrap ${task.computedStatus === 'Trễ' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {task.NGÀY_KẾT_THÚC_LOCAL || normalizeToDMY(task.NGÀY_KẾT_THÚC) || '—'}
                        </td>
                        <td className={`${tdCell} text-center`}>
                          <span className={`inline-flex items-center justify-center gap-0.5 max-w-full px-1.5 py-0.5 rounded-md text-[9px] font-bold border whitespace-nowrap ${
                            task.computedStatus === 'Đã hoàn thành' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' :
                            task.computedStatus === 'Đang diễn ra' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30' : 
                            task.computedStatus === 'Trễ' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}>
                            {task.computedStatus === 'Đã hoàn thành' ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> : 
                             task.computedStatus === 'Đang diễn ra' ? <PlayCircle className="w-2.5 h-2.5 shrink-0" /> : 
                             task.computedStatus === 'Trễ' ? <Clock className="w-2.5 h-2.5 shrink-0" /> : <Circle className="w-2.5 h-2.5 shrink-0" />}
                            <span className="truncate">{task.computedStatus}</span>
                          </span>
                        </td>
                        <td className={`${tdCell} text-center`}>
                          <PriorityBadge priority={task.ƯU_TIÊN} />
                        </td>
                        <td className={`${tdCell} text-center`}>
                          <button type="button" className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );})}
                    {processedTasks.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-slate-400 text-sm font-medium">Chưa có tác vụ nào phù hợp</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
                <div className="py-2 px-3 bg-[#0e1628] border-t border-[var(--border-main)] flex items-center justify-between text-xs text-slate-400 rounded-b-lg">
                  <div className="flex items-center gap-2">
                    <span>Hiển thị</span>
                    <select 
                      className="bg-[var(--bg-main)] border border-[var(--border-main)] text-slate-200 px-2 py-1 rounded"
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>trên mỗi trang</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>{Math.min((currentPage - 1) * itemsPerPage + 1, processedTasks.length)}-{Math.min(currentPage * itemsPerPage, processedTasks.length)} trên {processedTasks.length}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        className={`p-1 rounded ${currentPage === 1 ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white'}`}
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        &lt;
                      </button>
                      <span className="text-slate-300 font-medium px-2">Trang {currentPage} / {Math.ceil(processedTasks.length / itemsPerPage) || 1}</span>
                      <button 
                        className={`p-1 rounded ${currentPage >= Math.ceil(processedTasks.length / itemsPerPage) ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-700 hover:text-white'}`}
                        onClick={() => setCurrentPage(Math.min(Math.ceil(processedTasks.length / itemsPerPage), currentPage + 1))}
                        disabled={currentPage >= Math.ceil(processedTasks.length / itemsPerPage)}
                      >
                        &gt;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:hidden flex items-center justify-between text-xs text-slate-400 py-3 px-1">
                <span>
                  {Math.min((currentPage - 1) * itemsPerPage + 1, processedTasks.length)}-
                  {Math.min(currentPage * itemsPerPage, processedTasks.length)} / {processedTasks.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`px-2 py-1 rounded ${currentPage === 1 ? 'opacity-40' : 'bg-[var(--bg-panel)] border border-[var(--border-main)]'}`}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-1 rounded ${currentPage >= Math.ceil(processedTasks.length / itemsPerPage) ? 'opacity-40' : 'bg-[var(--bg-panel)] border border-[var(--border-main)]'}`}
                    disabled={currentPage >= Math.ceil(processedTasks.length / itemsPerPage)}
                    onClick={() => setCurrentPage(Math.min(Math.ceil(processedTasks.length / itemsPerPage), currentPage + 1))}
                  >
                    Sau
                  </button>
                </div>
              </div>
              </>
            )}

            {/* BOARD VIEW */}
            {viewMode === 'board' && (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible pb-2">
              <div
                className="flex md:grid gap-3 min-h-0 md:min-h-[calc(100vh-190px)] pb-3 items-start"
                style={{ gridTemplateColumns: `repeat(${Math.max(containers.length, 1)}, minmax(280px, 1fr))` }}
              >
                {containers.length > 0 ? containers.map(container => (
                  <div key={container} className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-main)] flex flex-col min-h-[200px] md:min-h-[calc(100vh-200px)] shadow-sm min-w-[280px] shrink-0 md:min-w-0 md:shrink">
                    <div className="p-2.5 space-y-2">
                      {processedTasks.filter(t => t.BỘ_CHỨA === container).map((task, idx) => {
                        const taskEditable = canEditTaskRow(task);
                        const canOpenTask = canViewTaskDetail(user, task);
                        return (
                        <div key={idx} className={`bg-[var(--bg-panel)] p-2.5 rounded-lg border border-[var(--border-main)] shadow-sm transition-all group ${canOpenTask ? 'hover:border-[#5252ff]/50 cursor-pointer' : ''}`} onClick={canOpenTask ? () => openTaskDetail(task) : undefined}>
                          <div className="flex items-start gap-2 mb-2">
                            <button
                              className={!taskEditable ? 'opacity-40 pointer-events-none' : ''}
                              onClick={(e) => { e.stopPropagation(); updateTaskStatus(task, task.computedStatus === 'Đã hoàn thành' ? '' : 'Đã hoàn thành'); }}
                            >
                              {task.computedStatus === 'Đã hoàn thành' ? <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                            </button>
                            <div className="min-w-0 flex-1">
                              <h4 className={`text-xs font-semibold leading-relaxed truncate ${task.computedStatus === 'Đã hoàn thành' ? 'text-slate-500 line-through' : 'text-slate-200'}`} title={task.TÁC_VỤ}>
                                {task.TÁC_VỤ}
                              </h4>
                              {task.taskDescription ? (
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug break-words whitespace-pre-wrap">{task.taskDescription}</p>
                              ) : null}
                            </div>
                          </div>
                          
                          {(task.ƯU_TIÊN === 'Important' || task.ƯU_TIÊN === 'Khẩn cấp' || task.ƯU_TIÊN === 'Cao') && (
                            <div className="ml-6 mb-2">
                              <PriorityBadge priority={task.ƯU_TIÊN} />
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-3 ml-6">
                            <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-[var(--bg-main)] font-medium ${
                              task.computedStatus === 'Trễ' ? 'text-red-400 border border-red-500/30 bg-red-500/5' : 
                              task.computedStatus === 'Đang diễn ra' ? 'text-[#3b82f6] border border-[#3b82f6]/30' : 
                              task.computedStatus === 'Đã hoàn thành' ? 'text-[#10b981] border border-[#10b981]/30' : 'text-slate-400 border border-[var(--border-main)]'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {task.NGÀY_KẾT_THÚC ? task.NGÀY_KẾT_THÚC.substring(0, 5) : 'N/A'}
                            </div>
                            <AssigneeDisplay assignees={task.NHÂN_SỰ} variant="board" showLabel={false} />
                          </div>
                        </div>
                      );})}
                    </div>
                  </div>
                )) : (
                  <div className="w-full text-center py-10 text-slate-400">Chưa có dữ liệu. Hãy thêm tác vụ và gắn "Bộ chứa" (VĂN PHÒNG, DỰ ÁN...)</div>
                )}
              </div>
              </div>
            )}

            {/* CALENDAR VIEW */}
            {viewMode === 'calendar' && (() => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const firstDayObj = new Date(currentYear, currentMonth, 1);
              const offset = (firstDayObj.getDay() + 6) % 7; // Monday = 0
              
              const days = Array.from({ length: 42 }, (_, i) => {
                const d = new Date(currentYear, currentMonth, 1);
                d.setDate(d.getDate() - offset + i);
                return d;
              });

              const weeks = [];
              for (let i = 0; i < 42; i += 7) {
                weeks.push(days.slice(i, i + 7));
              }
              
              const getDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

              return (
                <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] h-full flex flex-col shadow-2xl overflow-visible relative">
                  <div className="flex flex-col flex-1 bg-[#0c1221]">
                    {weeks.map((week, wIdx) => {
                      const wStart = getDateStr(week[0]);
                      const wEnd = getDateStr(week[6]);
                      
                      const weekTasks = processedTasks.filter(t => {
                        if (!t.NGÀY_BẮT_ĐẦU_LOCAL) return false;
                        const tStart = t.NGÀY_BẮT_ĐẦU_LOCAL;
                        const tEnd = t.NGÀY_KẾT_THÚC_LOCAL || tStart;
                        return tStart <= wEnd && tEnd >= wStart;
                      });

                      weekTasks.sort((a, b) => compareDateStrings(a.NGÀY_BẮT_ĐẦU_LOCAL, b.NGÀY_BẮT_ĐẦU_LOCAL));

                      const slots = [];
                      weekTasks.forEach(t => {
                        let placed = false;
                        for (let i = 0; i < slots.length; i++) {
                          const overlap = slots[i].some(existing => {
                            const eStart = existing.NGÀY_BẮT_ĐẦU_LOCAL;
                            const eEnd = existing.NGÀY_KẾT_THÚC_LOCAL || eStart;
                            const tStart = t.NGÀY_BẮT_ĐẦU_LOCAL;
                            const tEnd = t.NGÀY_KẾT_THÚC_LOCAL || tStart;
                            return tStart <= eEnd && tEnd >= eStart;
                          });
                          if (!overlap) {
                            slots[i].push(t);
                            placed = true;
                            break;
                          }
                        }
                        if (!placed) {
                          slots.push([t]);
                        }
                      });

                      return (
                        <div key={wIdx} className="relative border-b border-[var(--border-main)]/30 min-h-[108px] flex">
                          {/* Background grid */}
                          <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                            {week.map((d, i) => {
                              const isToday = getDateStr(d) === getDateStr(today);
                              const isCurrentMonth = d.getMonth() === currentMonth;
                              return (
                                <div key={i} className={`border-r border-[var(--border-main)]/30 ${isCurrentMonth ? 'bg-[var(--bg-panel)]' : 'bg-[#0c1221]/80'} ${isToday ? 'bg-[#1e293b]/40' : ''}`}>
                                  <div className="p-2 flex justify-end">
                                    <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#5252ff] text-white' : (isCurrentMonth ? 'text-slate-300' : 'text-slate-600')}`}>
                                      {d.getDate()}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Foreground tasks */}
                          <div className="relative w-full pt-8 pb-2 z-10">
                            {slots.map((rowTasks, rIdx) => (
                              <div key={rIdx} className="relative h-5 mb-1">
                                {rowTasks.map((t, tIdx) => {
                                  const tStart = t.NGÀY_BẮT_ĐẦU_LOCAL;
                                  const tEnd = t.NGÀY_KẾT_THÚC_LOCAL || tStart;
                                  
                                  let startCol = week.findIndex(d => getDateStr(d) >= tStart);
                                  if (startCol === -1 && tStart < wStart) startCol = 0; // Starts before this week
                                  
                                  let endCol = week.findIndex(d => getDateStr(d) === tEnd);
                                  if (endCol === -1) {
                                    if (tEnd > wEnd) endCol = 6;
                                    else {
                                      // Find last day that is <= tEnd
                                      for(let i=6; i>=0; i--) {
                                        if (getDateStr(week[i]) <= tEnd) { endCol = i; break; }
                                      }
                                    }
                                  }

                                  if (startCol === -1 || endCol === -1) return null;

                                  const colSpan = endCol - startCol + 1;
                                  const leftPercent = (startCol / 7) * 100;
                                  const widthPercent = (colSpan / 7) * 100;

                                  let bgClass = '';
                                  let borderClass = '';
                                  let textClass = '';
                                  if (t.computedStatus === 'Đã hoàn thành') { bgClass='bg-[#10b981]/10'; borderClass='border-[#10b981]/30'; textClass='text-[#10b981] line-through'; }
                                  else if (t.computedStatus === 'Trễ') { bgClass='bg-red-500/10'; borderClass='border-red-500/30'; textClass='text-red-400'; }
                                  else if (t.computedStatus === 'Đang diễn ra') { bgClass='bg-[#3b82f6]/10'; borderClass='border-[#3b82f6]/30'; textClass='text-[#3b82f6]'; }
                                  else { bgClass='bg-[#1e293b]/50'; borderClass='border-[#263554]'; textClass='text-slate-300'; }

                                  const taskEditable = canEditTaskRow(t);
                                  const canOpenTask = canViewTaskDetail(user, t);

                                  return (
                                    <div 
                                      key={tIdx} 
                                      className={`absolute h-full border ${bgClass} ${borderClass} rounded-md px-2 flex items-center transition-all shadow-sm ${canOpenTask ? 'cursor-pointer hover:opacity-80 hover:shadow-md hover:z-20' : ''}`}
                                      style={{ left: `calc(${leftPercent}% + 4px)`, width: `calc(${widthPercent}% - 8px)` }}
                                      title={`${t.TÁC_VỤ}\nBắt đầu: ${tStart}\nKết thúc: ${tEnd}`}
                                      onClick={canOpenTask ? () => openTaskDetail(t) : undefined}
                                    >
                                      <div className={`text-[10px] font-semibold truncate ${textClass} flex items-center gap-1.5`}>
                                        {t.computedStatus === 'Đã hoàn thành' ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <Circle className="w-3 h-3 shrink-0" />}
                                        {t.TÁC_VỤ}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* CHART VIEW */}
            {viewMode === 'chart' && (() => {
              const statusData = [
                { name: 'Chưa bắt đầu', value: processedTasks.filter(t => t.computedStatus === 'Chưa bắt đầu').length, color: '#a0a0ff' },
                { name: 'Đang diễn ra', value: processedTasks.filter(t => t.computedStatus === 'Đang diễn ra').length, color: '#3b82f6' },
                { name: 'Trễ', value: processedTasks.filter(t => t.computedStatus === 'Trễ').length, color: '#ef4444' },
                { name: 'Đã hoàn thành', value: processedTasks.filter(t => t.computedStatus === 'Đã hoàn thành').length, color: '#10b981' }
              ].filter(d => d.value > 0);

              const priorityData = ['Khẩn cấp', 'Important', 'Medium', 'Low'].map(p => {
                const pts = processedTasks.filter(t => t.ƯU_TIÊN === p || (p === 'Khẩn cấp' && t.ƯU_TIÊN === 'Important'));
                return {
                  name: p,
                  'Chưa bắt đầu': pts.filter(t => t.computedStatus === 'Chưa bắt đầu').length,
                  'Đang diễn ra': pts.filter(t => t.computedStatus === 'Đang diễn ra').length,
                  'Trễ': pts.filter(t => t.computedStatus === 'Trễ').length,
                  'Đã hoàn thành': pts.filter(t => t.computedStatus === 'Đã hoàn thành').length
                };
              });

              const memberMap = new Map();
              processedTasks.forEach((task) => {
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
                  if (Object.prototype.hasOwnProperty.call(entry, status)) {
                    entry[status] += 1;
                  }
                });
              });
              const assigneeData = [...memberMap.values()].sort((a, b) =>
                a.name.localeCompare(b.name, 'vi')
              );

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto pb-4 pr-2">
                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-4 col-span-1 shadow-lg">
                    <h3 className="text-[var(--text-strong)] font-bold mb-4 uppercase text-sm border-b border-[var(--border-main)] pb-2">Trạng thái</h3>
                    <div className="h-64 relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                        <span className="text-3xl font-bold text-[var(--text-strong)]">{processedTasks.length}</span>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase">Tác vụ</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={chartStyles.tooltip}
                            itemStyle={chartStyles.tooltipItem}
                          />
                          <Legend wrapperStyle={{ ...chartStyles.legend, paddingTop: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-4 col-span-1 lg:col-span-2 shadow-lg">
                    <h3 className="text-[var(--text-strong)] font-bold mb-4 uppercase text-sm border-b border-[var(--border-main)] pb-2">Ưu tiên</h3>
                    <div className="h-64 overflow-visible">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityData} margin={chartStyles.margin}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
                          <XAxis dataKey="name" stroke={chartStyles.axis} tick={{ ...chartStyles.tick, fontSize: 11 }} tickLine={false} />
                          <YAxis stroke={chartStyles.axis} tick={{ ...chartStyles.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                          <RechartsTooltip
                            cursor={chartStyles.cursor}
                            contentStyle={chartStyles.tooltip}
                            itemStyle={chartStyles.tooltipItem}
                          />
                          <Legend wrapperStyle={chartStyles.legend} />
                          <Bar dataKey="Chưa bắt đầu" stackId="a" fill="#a0a0ff" radius={[0, 0, 4, 4]} maxBarSize={40} />
                          <Bar dataKey="Đang diễn ra" stackId="a" fill="#3b82f6" maxBarSize={40} />
                          <Bar dataKey="Trễ" stackId="a" fill="#ef4444" maxBarSize={40} />
                          <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-4 col-span-1 lg:col-span-3 shadow-lg">
                    <h3 className="text-[var(--text-strong)] font-bold mb-4 uppercase text-sm border-b border-[var(--border-main)] pb-2">Thành viên</h3>
                    <div className="h-72 overflow-visible">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assigneeData} margin={chartStyles.margin}>
                          <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke={chartStyles.axis}
                            tick={{ ...chartStyles.tick, fontSize: 11 }}
                            tickLine={false}
                            interval={0}
                          />
                          <YAxis stroke={chartStyles.axis} tick={{ ...chartStyles.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
                          <RechartsTooltip
                            cursor={chartStyles.cursor}
                            contentStyle={chartStyles.tooltip}
                            itemStyle={chartStyles.tooltipItem}
                            labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || _label}
                          />
                          <Legend wrapperStyle={chartStyles.legend} />
                          <Bar dataKey="Chưa bắt đầu" stackId="a" fill="#a0a0ff" radius={[0, 0, 4, 4]} maxBarSize={40} />
                          <Bar dataKey="Đang diễn ra" stackId="a" fill="#3b82f6" maxBarSize={40} />
                          <Bar dataKey="Trễ" stackId="a" fill="#ef4444" maxBarSize={40} />
                          <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* ADD TASK MODAL */}
      {newTaskOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl w-[500px] shadow-2xl p-6 glow-purple">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Thêm công việc mới</h3>
              <button onClick={() => setNewTaskOpen(false)} className="text-slate-400 hover:text-white"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="flex gap-4 mb-4 border-b border-[var(--border-main)] pb-4">
                <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                  <input 
                    type="radio" 
                    name="taskType" 
                    checked={taskType === 'project'} 
                    onChange={() => {
                      setTaskType('project');
                      setNewTaskProjectPicker('');
                      setNewTaskCustomProject('');
                      setNewTask({ ...newTask, BỘ_CHỨA: 'DỰ ÁN', TÊN_DỰ_ÁN: '' });
                    }}
                    className="accent-[#5252ff]"
                  />
                  Công việc Dự án
                </label>
                {canViewOfficeTasks(user) && (
                <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                  <input 
                    type="radio" 
                    name="taskType" 
                    checked={taskType === 'office'} 
                    onChange={() => {
                      setTaskType('office');
                      setNewTaskProjectPicker('');
                      setNewTaskCustomProject('');
                      setNewTask({ ...newTask, BỘ_CHỨA: 'VĂN PHÒNG', TÊN_DỰ_ÁN: '' });
                    }}
                    className="accent-[#5252ff]"
                  />
                  Văn phòng / Nội bộ
                </label>
                )}
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Tên tác vụ *</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                  value={newTask.TÁC_VỤ}
                  onChange={e => setNewTask({ ...newTask, TÁC_VỤ: e.target.value })}
                  placeholder="Nhập tên công việc..."
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Mô tả</label>
                <textarea
                  rows={2}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none resize-none"
                  value={newTask.GHI_CHÚ}
                  onChange={e => setNewTask({ ...newTask, GHI_CHÚ: e.target.value })}
                  placeholder="Mô tả chi tiết, ghi chú thực hiện..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {taskType === 'project' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Dự án</label>
                    <select
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                      value={newTaskProjectPicker}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewTaskProjectPicker(v);
                        if (v === NEW_TASK_PROJECT_CUSTOM) {
                          setNewTask({ ...newTask, TÊN_DỰ_ÁN: newTaskCustomProject.trim() });
                        } else {
                          setNewTaskCustomProject('');
                          setNewTask({ ...newTask, TÊN_DỰ_ÁN: v });
                        }
                      }}
                    >
                      <option value="">-- Chọn dự án --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                      <option value={NEW_TASK_PROJECT_CUSTOM}>Khác — tự nhập tên dự án</option>
                    </select>
                    {newTaskProjectPicker === NEW_TASK_PROJECT_CUSTOM && (
                      <input
                        type="text"
                        className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                        value={newTaskCustomProject}
                        onChange={(e) => {
                          const v = e.target.value;
                          setNewTaskCustomProject(v);
                          setNewTask({ ...newTask, TÊN_DỰ_ÁN: v.trim() });
                        }}
                        placeholder="VD: SOLAR HOME A — defect / bảo hành sau COD"
                      />
                    )}
                    <p className="text-[10px] text-slate-500 leading-snug">
                      Dự án đã xong hoặc không còn trên danh sách: chọn &quot;Khác&quot; và gõ tên.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Loại công việc</label>
                    <input 
                      disabled
                      type="text" 
                      className="w-full bg-[#0c1221] border border-[var(--border-main)] rounded p-2 text-slate-400 text-xs cursor-not-allowed"
                      value="VĂN PHÒNG NỘI BỘ"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Nhân sự</label>
                  <AssigneeMultiSelect
                    value={newTask.NHÂN_SỰ}
                    onChange={(val) => setNewTask({ ...newTask, NHÂN_SỰ: val })}
                    options={assigneeOptions}
                    variant="dark"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Bắt đầu</label>
                  <DateInputDMY
                    showCalendar
                    calendarTitle="Chọn ngày bắt đầu"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                    value={newTask.NGÀY_BẮT_ĐẦU}
                    onChange={(val) => setNewTask({ ...newTask, NGÀY_BẮT_ĐẦU: val })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Đến hạn</label>
                  <DateInputDMY
                    showCalendar
                    calendarTitle="Chọn ngày đến hạn"
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                    value={newTask.NGÀY_KẾT_THÚC}
                    onChange={(val) => setNewTask({ ...newTask, NGÀY_KẾT_THÚC: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Trạng thái</label>
                  <select 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                    value={newTask.TRẠNG_THÁI}
                    onChange={e => setNewTask({ ...newTask, TRẠNG_THÁI: e.target.value })}
                  >
                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                    <option value="Đang diễn ra">Đang diễn ra</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Ưu tiên</label>
                  <select 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                    value={newTask.ƯU_TIÊN}
                    onChange={e => setNewTask({ ...newTask, ƯU_TIÊN: e.target.value })}
                  >
                    <option value="Medium">Medium</option>
                    <option value="Important">Important</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-[var(--border-main)]">
                <button type="button" onClick={() => setNewTaskOpen(false)} className="px-4 py-2 rounded text-xs font-bold text-slate-300 hover:bg-[#141c2f]">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded text-xs font-bold bg-[#5252ff] text-white hover:bg-[#4141d6]">Lưu công việc</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL (PLANNER STYLE) */}
      {draftTask && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 overflow-y-auto backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation();
              requestCloseTaskDetail();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mb-10 overflow-hidden flex flex-col mt-8 relative" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            
            {/* Header Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {(canFullyEditDraft() || canDeleteDraft()) && (
              <div className="relative">
                <button 
                  onClick={() => setIsTaskMenuOpen(!isTaskMenuOpen)}
                  className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${isTaskMenuOpen ? 'bg-slate-200' : ''}`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {isTaskMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                    {canFullyEditDraft() && (
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setIsTaskMenuOpen(false); updateDraftField('PINNED', true); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Ghim yêu thích
                    </button>
                    )}
                    {canDeleteDraft() && (
                    <button className={`w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 ${canFullyEditDraft() ? 'border-t border-slate-100 mt-1 pt-2' : ''}`} onClick={() => handleTaskDelete(draftTask)}>
                      <AlertTriangle className="w-4 h-4 text-red-400" /> Xóa tác vụ
                    </button>
                    )}
                  </div>
                )}
              </div>
              )}
              <button
                type="button"
                className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  requestCloseTaskDetail();
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {taskSaveError && (
              <div className="mx-8 mt-6 mb-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {taskSaveError}
              </div>
            )}

            <div className="flex-1 p-8 pb-10">
              <div className="flex items-start gap-3 mb-6">
                <button 
                  onClick={() => canToggleCompleteDraft() && updateDraftField('TRẠNG_THÁI', draftTask.computedStatus === 'Đã hoàn thành' ? '' : 'Đã hoàn thành')}
                  className={`mt-1 flex-shrink-0 ${!canToggleCompleteDraft() ? 'cursor-default opacity-60' : ''}`}
                  disabled={!canToggleCompleteDraft()}
                >
                  {draftTask.computedStatus === 'Đã hoàn thành' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400 hover:text-blue-500" />
                  )}
                </button>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={draftTask.TÁC_VỤ || ''}
                    onChange={(e) => updateDraftField('TÁC_VỤ', e.target.value)}
                    readOnly={!canEditDraftField('TÁC_VỤ')}
                    className={`text-2xl font-semibold text-slate-800 w-full outline-none rounded px-1 -ml-1 transition-colors ${canEditDraftField('TÁC_VỤ') ? 'hover:bg-slate-50 focus:bg-slate-50' : 'cursor-default'}`}
                    placeholder="Nhập tên tác vụ"
                  />
                  <div className="text-xs text-slate-500 mt-1">
                    {canEditDraftField('TÊN_DỰ_ÁN') ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="shrink-0">Dự án:</span>
                        <select
                          value={draftTask.TÊN_DỰ_ÁN || ''}
                          onChange={(e) => updateDraftProject(e.target.value)}
                          className="bg-white border border-slate-300 text-slate-700 py-1 pl-2 pr-7 rounded text-xs hover:border-slate-400 focus:outline-none focus:border-blue-500 max-w-full"
                        >
                          <option value="">Nhiệm vụ chung</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                          {draftTask.TÊN_DỰ_ÁN && !projects.some((p) => p.name === draftTask.TÊN_DỰ_ÁN) ? (
                            <option value={draftTask.TÊN_DỰ_ÁN}>{draftTask.TÊN_DỰ_ÁN}</option>
                          ) : null}
                        </select>
                      </div>
                    ) : (
                      <span>{draftTask.TÊN_DỰ_ÁN ? `Dự án: ${draftTask.TÊN_DỰ_ÁN}` : 'Nhiệm vụ chung'}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 ml-9">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-slate-400 shrink-0"><LayoutGrid className="w-4 h-4" /></span>
                  <AssigneeDisplay assignees={draftTask.NHÂN_SỰ} variant="light" />
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8 ml-9">
                <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded shadow-md transition-colors flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> Chi tiết tác vụ
                </button>
                <button type="button" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-4 py-2 rounded shadow-sm transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" /> Tệp đính kèm
                </button>
              </div>

              <div className="ml-9 grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trạng thái</label>
                  <div className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded text-sm flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${
                      draftTask.computedStatus === 'Đã hoàn thành' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      draftTask.computedStatus === 'Đang diễn ra' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      draftTask.computedStatus === 'Trễ' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {draftTask.computedStatus || 'Chưa bắt đầu'}
                    </span>
                    <span className="text-[10px] text-slate-400">Tự động theo ngày — bấm vòng tròn để hoàn thành</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ưu tiên</label>
                  <div className="relative">
                    <select 
                      value={draftTask.ƯU_TIÊN || 'Medium'}
                      onChange={(e) => updateDraftField('ƯU_TIÊN', e.target.value)}
                      disabled={!canEditDraftField('ƯU_TIÊN')}
                      className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="Khẩn cấp">🚨 Khẩn cấp</option>
                      <option value="Important">❗ Quan trọng</option>
                      <option value="Medium">• Trung bình</option>
                      <option value="Low">↓ Thấp</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày bắt đầu</label>
                  <DateInputDMY
                    showCalendar
                    calendarTitle="Chọn ngày bắt đầu"
                    className="w-full bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    value={draftTask.NGÀY_BẮT_ĐẦU_LOCAL || draftTask.NGÀY_BẮT_ĐẦU || ''}
                    onChange={(val) => updateDraftField('NGÀY_BẮT_ĐẦU', val)}
                    disabled={!canEditDraftField('NGÀY_BẮT_ĐẦU')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày đến hạn</label>
                  <DateInputDMY
                    showCalendar
                    calendarTitle="Chọn ngày đến hạn"
                    className="w-full bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    value={draftTask.NGÀY_KẾT_THÚC_LOCAL || draftTask.NGÀY_KẾT_THÚC || ''}
                    onChange={(val) => updateDraftField('NGÀY_KẾT_THÚC', val)}
                    disabled={!canEditDraftField('NGÀY_KẾT_THÚC')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">Lặp lại <AlertTriangle className="w-3 h-3 text-slate-400" /></label>
                  <div className="relative">
                    <select 
                      disabled={!canFullyEditDraft()}
                      className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option>Không lặp lại</option>
                      <option>Hàng ngày</option>
                      <option>Hàng tuần</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phân công</label>
                  {canEditDraftField('NHÂN_SỰ') ? (
                    <AssigneeMultiSelect
                      value={draftTask.NHÂN_SỰ}
                      onChange={(val) => updateDraftField('NHÂN_SỰ', val)}
                      options={assigneeOptions}
                      variant="light"
                    />
                  ) : (
                    <div className="py-2 px-3 rounded border border-slate-200 bg-slate-50">
                      <AssigneeDisplay assignees={draftTask.NHÂN_SỰ} variant="light" />
                    </div>
                  )}
                </div>
              </div>

              <div className="ml-9">
                <label className="block text-sm font-bold text-slate-800 mb-2">Mô tả</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-md text-sm hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all min-h-[100px] resize-y disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="Mô tả chi tiết công việc..."
                  value={getTaskDescription(draftTask)}
                  onChange={(e) => updateDraftField('GHI_CHÚ', e.target.value)}
                  readOnly={!canEditDraftField('GHI_CHÚ')}
                />
                <p className="text-[10px] text-slate-400 mt-1">Bấm <strong>Lưu thay đổi</strong> để áp dụng. Thoát không lưu sẽ hỏi xác nhận.</p>
              </div>
            </div>

            <div className="shrink-0 px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                {draftDirty ? 'Có thay đổi chưa lưu' : 'Đã đồng bộ với server'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={requestCloseTaskDetail}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveDraftTask}
                  disabled={isSavingDraft || !draftDirty}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-[#5252ff] text-white hover:bg-[#4141d6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSavingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
