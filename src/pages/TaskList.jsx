import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Clock, LayoutGrid, Calendar, 
  BarChart3, Columns, Plus, Search, Filter, Download, 
  ChevronDown, AlertTriangle, MoreHorizontal, Calendar as CalendarIcon,
  PlayCircle, Flag, Star, MoreVertical, Bell, Sun, Moon, User, ClipboardList, X, Menu, ChevronLeft
} from 'lucide-react';
import { api } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTheme } from '../hooks/useTheme';
import { useSidebar } from '../hooks/useSidebar';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { updateDashboardContext } from '../utils/dashboardContext';

export default function TaskList() {
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
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
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const formatDateLocal = (val) => {
      if (!val) return null;
      const strVal = String(val);
      if (strVal.includes('/')) {
        const parts = strVal.split('/');
        if (parts.length === 3) {
          // Check if format is DD/MM/YYYY
          if (parts[2].length === 4) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
      
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      return strVal;
    };

    let filtered = tasks.map(t => {
      let status = t.TRẠNG_THÁI || 'Chưa bắt đầu';
      const start = formatDateLocal(t.NGÀY_BẮT_ĐẦU);
      const end = formatDateLocal(t.NGÀY_KẾT_THÚC);

      if (status !== 'Đã hoàn thành') {
        if (end && todayStr > end) {
          status = 'Trễ';
        } else if (start && todayStr >= start) {
          status = 'Đang diễn ra';
        }
      }
      return { 
        ...t, 
        computedStatus: status,
        NGÀY_BẮT_ĐẦU_LOCAL: start,
        NGÀY_KẾT_THÚC_LOCAL: end
      };
    });

    if (searchQuery) {
      filtered = filtered.filter(t => (t.TÁC_VỤ || '').toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'PINNED') {
           valA = a.PINNED ? 1 : 0;
           valB = b.PINNED ? 1 : 0;
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
  }, [tasks, searchQuery, sortConfig]);

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
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const [taskType, setTaskType] = useState('project'); // 'project' or 'office'
  const [newTask, setNewTask] = useState({
    TÊN_DỰ_ÁN: '',
    TÁC_VỤ: '',
    NHÂN_SỰ: '',
    NGÀY_BẮT_ĐẦU: '',
    NGÀY_KẾT_THÚC: '',
    BỘ_CHỨA: 'DỰ ÁN',
    TRẠNG_THÁI: 'Chưa bắt đầu',
    ƯU_TIÊN: 'Medium'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.TÁC_VỤ) return;
    
    let projectId = '';
    let projectName = '';
    let container = newTask.BỘ_CHỨA;

    if (taskType === 'project') {
      const project = projects.find(p => p.name === newTask.TÊN_DỰ_ÁN);
      projectId = project ? (project.id || project.PROJECT_ID) : '';
      projectName = newTask.TÊN_DỰ_ÁN;
    } else {
      projectName = 'VĂN PHÒNG';
      container = newTask.BỘ_CHỨA === 'DỰ ÁN' ? 'VĂN PHÒNG' : newTask.BỘ_CHỨA; // default to VĂN PHÒNG if user didn't change it
    }

    const taskToAdd = { ...newTask, PROJECT_ID: projectId, TÊN_DỰ_ÁN: projectName, BỘ_CHỨA: container };
    
    try {
      await api.createTask(taskToAdd);
      setTasks([...tasks, taskToAdd]);
      setNewTaskOpen(false);
      setNewTask({ ...newTask, TÁC_VỤ: '' });
    } catch (err) {
      console.error(err);
      alert('Lỗi khi thêm công việc');
    }
  };

  const handleTaskUpdate = async (task, field, value) => {
    const updatedTask = { ...task, [field]: value };
    setTasks(tasks.map(t => t._rowIndex === task._rowIndex && t.TÁC_VỤ === task.TÁC_VỤ ? updatedTask : t));
    if (selectedTask && selectedTask._rowIndex === task._rowIndex) {
      setSelectedTask(updatedTask);
    }
    try {
      await api.updateTask(updatedTask);
    } catch (err) {
      console.error(err);
      // rollback
      setTasks(tasks.map(t => t._rowIndex === task._rowIndex && t.TÁC_VỤ === task.TÁC_VỤ ? task : t));
      if (selectedTask && selectedTask._rowIndex === task._rowIndex) {
        setSelectedTask(task);
      }
    }
  };

  const updateTaskStatus = async (task, newStatus) => {
    return handleTaskUpdate(task, 'TRẠNG_THÁI', newStatus);
  };

  const handleTaskDelete = async (task) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tác vụ này?")) return;
    
    setTasks(tasks.filter(t => t._rowIndex !== task._rowIndex));
    setSelectedTask(null);
    setIsTaskMenuOpen(false);
    try {
      await api.deleteTask(task);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi xóa tác vụ");
      const data = await api.getTasks();
      setTasks(data || []);
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
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="px-8 pt-6 pb-4 border-b border-[var(--border-main)]/30 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight uppercase">CÔNG VIỆC</h1>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">Quản lý và theo dõi tiến độ các tác vụ</p>
            </div>
          </div>
        </header>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-main)] p-8 pt-6">
        
        {/* CONTROLS (Row 2) */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-[var(--bg-panel)] p-1 rounded-md border border-[var(--border-main)] shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'grid' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Lưới
            </button>
            <button 
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'board' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <Columns className="w-4 h-4" /> Bảng
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <CalendarIcon className="w-4 h-4" /> Lịch
            </button>
            <button 
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'chart' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'}`}
            >
              <BarChart3 className="w-4 h-4" /> Biểu đồ
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Tìm kiếm tác vụ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2.5 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-md text-sm text-slate-200 focus:border-[#5252ff] outline-none w-64 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <button className="bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] text-slate-200 border border-[var(--border-main)] px-4 py-2.5 rounded-md flex items-center gap-2 transition-all shadow-sm">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-semibold">Lọc</span>
            </button>
            <div className="flex rounded-md shadow-[0_0_15px_rgba(82,82,255,0.3)]">
              <button 
                onClick={() => setNewTaskOpen(true)}
                className="bg-[#5252ff] hover:bg-[#4141d6] text-white text-sm font-medium px-4 py-2.5 rounded-l-md flex items-center gap-2 transition-all border-r border-[#4141d6]"
              >
                <Plus className="w-4 h-4" />
                Thêm tác vụ
              </button>
              <button className="bg-[#5252ff] hover:bg-[#4141d6] text-white px-2 py-2.5 rounded-r-md flex items-center justify-center transition-all">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* STAT CARDS (Row 3) */}
        <div className="grid grid-cols-5 gap-0 rounded-xl overflow-hidden border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-sm mb-6">
          <div className="p-5 border-r border-[var(--border-main)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[#5252ff] shrink-0">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Tổng công việc</div>
              <div className="text-2xl font-bold text-white leading-none">{processedTasks.length}</div>
            </div>
          </div>
          <div className="p-5 border-r border-[var(--border-main)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[#3b82f6] shrink-0">
              <PlayCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Đang diễn ra</div>
              <div className="text-2xl font-bold text-white leading-none">{processedTasks.filter(t => t.computedStatus === 'Đang diễn ra').length}</div>
              <div className="text-[10px] text-[#3b82f6] font-semibold mt-1.5">{Math.round((processedTasks.filter(t => t.computedStatus === 'Đang diễn ra').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
          <div className="p-5 border-r border-[var(--border-main)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-red-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Trễ hạn</div>
              <div className="text-2xl font-bold text-white leading-none">{processedTasks.filter(t => t.computedStatus === 'Trễ').length}</div>
              <div className="text-[10px] text-red-400 font-semibold mt-1.5">{Math.round((processedTasks.filter(t => t.computedStatus === 'Trễ').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
          <div className="p-5 border-r border-[var(--border-main)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-[#10b981] shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Hoàn thành</div>
              <div className="text-2xl font-bold text-white leading-none">{processedTasks.filter(t => t.computedStatus === 'Đã hoàn thành').length}</div>
              <div className="text-[10px] text-[#10b981] font-semibold mt-1.5">{Math.round((processedTasks.filter(t => t.computedStatus === 'Đã hoàn thành').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1e293b] border border-slate-700 flex items-center justify-center text-yellow-500 shrink-0">
              <Flag className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium mb-1">Ưu tiên cao</div>
              <div className="text-2xl font-bold text-white leading-none">{processedTasks.filter(t => t.ƯU_TIÊN === 'Important' || t.ƯU_TIÊN === 'Khẩn cấp' || t.ƯU_TIÊN === 'Cao').length}</div>
              <div className="text-[10px] text-yellow-500 font-semibold mt-1.5">{Math.round((processedTasks.filter(t => t.ƯU_TIÊN === 'Important' || t.ƯU_TIÊN === 'Khẩn cấp' || t.ƯU_TIÊN === 'Cao').length / (processedTasks.length || 1)) * 100)}% tổng công việc</div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20 text-slate-400 text-sm">Đang tải công việc...</div>
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-panel)] border-b border-[var(--border-main)] text-slate-300 text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('TÁC_VỤ')}>Tên tác vụ <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'TÁC_VỤ' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'TÁC_VỤ' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('TÊN_DỰ_ÁN')}>Tên dự án <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'TÊN_DỰ_ÁN' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'TÊN_DỰ_ÁN' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('NHÂN_SỰ')}>Đã chỉ định cho <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'NHÂN_SỰ' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'NHÂN_SỰ' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('NGÀY_BẮT_ĐẦU_LOCAL')}>Bắt đầu <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'NGÀY_BẮT_ĐẦU_LOCAL' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'NGÀY_BẮT_ĐẦU_LOCAL' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('NGÀY_KẾT_THÚC_LOCAL')}>Đến hạn <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'NGÀY_KẾT_THÚC_LOCAL' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'NGÀY_KẾT_THÚC_LOCAL' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('BỘ_CHỨA')}>Bộ chứa <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'BỘ_CHỨA' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'BỘ_CHỨA' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('computedStatus')}>Trạng thái <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'computedStatus' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'computedStatus' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('ƯU_TIÊN')}>Ưu tiên <ChevronDown className={`w-3 h-3 inline-block ml-1 transition-transform ${sortConfig.key === 'ƯU_TIÊN' ? 'opacity-100' : 'opacity-50'} ${sortConfig.key === 'ƯU_TIÊN' && sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} /></th>
                      <th className="py-4 px-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]/50">
                    {processedTasks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((task, idx) => (
                      <tr key={idx} className="hover:bg-[#141c2f] transition-all text-xs border-b border-[var(--border-main)]/50 group cursor-pointer bg-[#0e1628]" onClick={() => setSelectedTask(task)}>
                        <td className="py-4 px-4">
                          <div className="flex items-start gap-2">
                            <button 
                              className={`mt-0.5 shrink-0 transition-colors ${task.PINNED ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-400'}`}
                              onClick={e => { e.stopPropagation(); handleTaskUpdate(task, 'PINNED', !task.PINNED); }}
                            >
                              <Star className={`w-3.5 h-3.5 ${task.PINNED ? 'fill-current' : ''}`} />
                            </button>
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${task.computedStatus === 'Đã hoàn thành' ? 'bg-[#10b981]' : task.computedStatus === 'Trễ' ? 'bg-red-500' : task.computedStatus === 'Đang diễn ra' ? 'bg-[#3b82f6]' : 'bg-slate-500'}`}></span>
                            <div>
                              <div className={`font-bold text-sm ${task.computedStatus === 'Đã hoàn thành' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {task.TÁC_VỤ}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 font-medium">
                          {task.TÊN_DỰ_ÁN}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[9px] font-bold shadow-sm">
                              {task.NHÂN_SỰ ? task.NHÂN_SỰ.substring(0,2).toUpperCase() : 'NV'}
                            </div>
                            <span className="text-slate-300 font-medium">{task.NHÂN_SỰ || 'Chưa chỉ định'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-400">{task.NGÀY_BẮT_ĐẦU || '-'}</td>
                        <td className={`py-4 px-4 font-semibold ${task.computedStatus === 'Trễ' ? 'text-red-400' : 'text-[#10b981]'}`}>
                          {task.NGÀY_KẾT_THÚC || '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-300 uppercase tracking-wide text-[11px] font-medium">{task.BỘ_CHỨA}</td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                            task.computedStatus === 'Đã hoàn thành' ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30' :
                            task.computedStatus === 'Đang diễn ra' ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30' : 
                            task.computedStatus === 'Trễ' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}>
                            {task.computedStatus === 'Đã hoàn thành' ? <CheckCircle2 className="w-3 h-3" /> : 
                             task.computedStatus === 'Đang diễn ra' ? <PlayCircle className="w-3 h-3" /> : 
                             task.computedStatus === 'Trễ' ? <Clock className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                            {task.computedStatus}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold border ${
                            task.ƯU_TIÊN === 'Khẩn cấp' ? 'bg-red-900/40 text-red-400 border-red-500/30' :
                            task.ƯU_TIÊN === 'Important' || task.ƯU_TIÊN === 'Cao' ? 'bg-red-500/10 text-red-500 border-red-500/30' : 
                            task.ƯU_TIÊN === 'Thấp' || task.ƯU_TIÊN === 'Low' ? 'bg-slate-800 text-slate-400 border-slate-700' : 
                            'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30'
                          }`}>
                            <Flag className="w-3 h-3" />
                            {task.ƯU_TIÊN || 'Trung bình'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {processedTasks.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-slate-400 text-sm font-medium bg-[#0e1628]">Chưa có tác vụ nào phù hợp</td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
            )}

            {/* BOARD VIEW */}
            {viewMode === 'board' && (
              <div className="flex gap-6 overflow-x-auto h-full pb-4 items-start">
                {containers.length > 0 ? containers.map(container => (
                  <div key={container} className="min-w-[320px] max-w-[320px] bg-[#0c1221] rounded-xl border border-[var(--border-main)] flex flex-col h-fit max-h-full shrink-0">
                    <div className="p-4 border-b border-[var(--border-main)]/50 flex justify-between items-center bg-[#111827]/50 rounded-t-xl">
                      <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                        {container}
                        <span className="bg-[#18183c] text-[#a0a0ff] px-2 py-0.5 rounded text-[10px]">{processedTasks.filter(t => t.BỘ_CHỨA === container).length}</span>
                      </h3>
                      <button className="text-slate-400 hover:text-white"><Plus className="w-4 h-4" /></button>
                    </div>
                    <div className="p-3 space-y-3 overflow-y-auto">
                      {processedTasks.filter(t => t.BỘ_CHỨA === container).map((task, idx) => (
                        <div key={idx} className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border-main)] shadow-sm hover:border-[#5252ff]/50 transition-all group cursor-pointer" onClick={() => setSelectedTask(task)}>
                          <div className="flex items-start gap-2 mb-2">
                            <button onClick={(e) => { e.stopPropagation(); updateTaskStatus(task, task.computedStatus === 'Đã hoàn thành' ? 'Chưa bắt đầu' : 'Đã hoàn thành'); }}>
                              {task.computedStatus === 'Đã hoàn thành' ? <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                            </button>
                            <h4 className={`text-xs font-semibold leading-relaxed ${task.computedStatus === 'Đã hoàn thành' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                              {task.TÁC_VỤ}
                            </h4>
                          </div>
                          
                          {task.ƯU_TIÊN === 'Important' || task.ƯU_TIÊN === 'Khẩn cấp' ? (
                            <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded ml-6 mb-2 inline-block">! Important</span>
                          ) : null}

                          <div className="flex items-center justify-between mt-3 ml-6">
                            <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded bg-[var(--bg-main)] font-medium ${
                              task.computedStatus === 'Trễ' ? 'text-red-400 border border-red-500/30 bg-red-500/5' : 
                              task.computedStatus === 'Đang diễn ra' ? 'text-[#3b82f6] border border-[#3b82f6]/30' : 
                              task.computedStatus === 'Đã hoàn thành' ? 'text-[#10b981] border border-[#10b981]/30' : 'text-slate-400 border border-[var(--border-main)]'
                            }`}>
                              <Calendar className="w-3 h-3" />
                              {task.NGÀY_KẾT_THÚC ? task.NGÀY_KẾT_THÚC.substring(0, 5) : 'N/A'}
                            </div>
                            <div className="w-5 h-5 rounded-full bg-[#18183c] text-[#a0a0ff] flex items-center justify-center text-[8px] font-bold border border-[#2d2db3]/20" title={task.NHÂN_SỰ}>
                              {task.NHÂN_SỰ ? task.NHÂN_SỰ.substring(0,2).toUpperCase() : 'NV'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="w-full text-center py-20 text-slate-400">Chưa có dữ liệu. Hãy thêm tác vụ và gắn "Bộ chứa" (VĂN PHÒNG, DỰ ÁN...)</div>
                )}
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
                <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] h-full flex flex-col shadow-2xl overflow-y-auto relative">
                  <div className="p-4 border-b border-[var(--border-main)]/50 flex justify-between items-center bg-[#111827]/50 sticky top-0 z-30">
                    <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                      Tháng {currentMonth + 1} / {currentYear}
                    </h2>
                  </div>
                  
                  {/* Header */}
                  <div className="grid grid-cols-7 bg-[#0c1221] sticky top-[61px] z-30 border-b border-[var(--border-main)]/50 shadow-md">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                      <div key={d} className="p-2 text-center text-xs font-bold text-slate-400 border-r border-[var(--border-main)]/30 uppercase">
                        {d}
                      </div>
                    ))}
                  </div>

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

                      weekTasks.sort((a, b) => a.NGÀY_BẮT_ĐẦU_LOCAL.localeCompare(b.NGÀY_BẮT_ĐẦU_LOCAL));

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
                        <div key={wIdx} className="relative border-b border-[var(--border-main)]/30 min-h-[140px] flex">
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
                          <div className="relative w-full pt-10 pb-4 z-10">
                            {slots.map((rowTasks, rIdx) => (
                              <div key={rIdx} className="relative h-6 mb-1.5">
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

                                  return (
                                    <div 
                                      key={tIdx} 
                                      className={`absolute h-full border ${bgClass} ${borderClass} rounded-md px-2 flex items-center cursor-pointer hover:opacity-80 transition-all shadow-sm hover:shadow-md hover:z-20`}
                                      style={{ left: `calc(${leftPercent}% + 4px)`, width: `calc(${widthPercent}% - 8px)` }}
                                      title={`${t.TÁC_VỤ}\nBắt đầu: ${tStart}\nKết thúc: ${tEnd}`}
                                      onClick={() => setSelectedTask(t)}
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

              const containerData = containers.map(c => {
                const pts = processedTasks.filter(t => t.BỘ_CHỨA === c);
                return {
                  name: c,
                  'Chưa bắt đầu': pts.filter(t => t.computedStatus === 'Chưa bắt đầu').length,
                  'Đang diễn ra': pts.filter(t => t.computedStatus === 'Đang diễn ra').length,
                  'Trễ': pts.filter(t => t.computedStatus === 'Trễ').length,
                  'Đã hoàn thành': pts.filter(t => t.computedStatus === 'Đã hoàn thành').length
                };
              });

              const assignees = Array.from(new Set(processedTasks.map(t => t.NHÂN_SỰ || 'Chưa chỉ định')));
              const assigneeData = assignees.map(a => {
                const pts = processedTasks.filter(t => (t.NHÂN_SỰ || 'Chưa chỉ định') === a);
                return {
                  name: a,
                  'Chưa bắt đầu': pts.filter(t => t.computedStatus === 'Chưa bắt đầu').length,
                  'Đang diễn ra': pts.filter(t => t.computedStatus === 'Đang diễn ra').length,
                  'Trễ': pts.filter(t => t.computedStatus === 'Trễ').length,
                  'Đã hoàn thành': pts.filter(t => t.computedStatus === 'Đã hoàn thành').length
                };
              });

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto pb-8 pr-2">
                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-6 col-span-1 shadow-lg">
                    <h3 className="text-white font-bold mb-6 uppercase text-sm border-b border-[var(--border-main)] pb-3">Trạng thái</h3>
                    <div className="h-64 relative">
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                        <span className="text-3xl font-bold text-white">{processedTasks.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase">Tác vụ</span>
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
                            contentStyle={{ backgroundColor: '#141c2f', borderColor: '#263554', color: '#fff', fontSize: '12px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-6 col-span-1 lg:col-span-2 shadow-lg">
                    <h3 className="text-white font-bold mb-6 uppercase text-sm border-b border-[var(--border-main)] pb-3">Ưu tiên</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#263554" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip 
                            cursor={{ fill: '#141c2f' }}
                            contentStyle={{ backgroundColor: '#070b14', borderColor: '#263554', color: '#fff', fontSize: '12px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
                          <Bar dataKey="Chưa bắt đầu" stackId="a" fill="#a0a0ff" radius={[0, 0, 4, 4]} maxBarSize={40} />
                          <Bar dataKey="Đang diễn ra" stackId="a" fill="#3b82f6" maxBarSize={40} />
                          <Bar dataKey="Trễ" stackId="a" fill="#ef4444" maxBarSize={40} />
                          <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-6 col-span-1 shadow-lg">
                    <h3 className="text-white font-bold mb-6 uppercase text-sm border-b border-[var(--border-main)] pb-3">Bộ chứa</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={containerData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#263554" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip cursor={{ fill: '#141c2f' }} contentStyle={{ backgroundColor: '#070b14', borderColor: '#263554', color: '#fff', fontSize: '12px' }} />
                          <Bar dataKey="Chưa bắt đầu" stackId="a" fill="#a0a0ff" radius={[0, 0, 4, 4]} maxBarSize={30} />
                          <Bar dataKey="Đang diễn ra" stackId="a" fill="#3b82f6" maxBarSize={30} />
                          <Bar dataKey="Trễ" stackId="a" fill="#ef4444" maxBarSize={30} />
                          <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-6 col-span-1 lg:col-span-2 shadow-lg">
                    <h3 className="text-white font-bold mb-6 uppercase text-sm border-b border-[var(--border-main)] pb-3">Thành viên</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={assigneeData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#263554" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip cursor={{ fill: '#141c2f' }} contentStyle={{ backgroundColor: '#070b14', borderColor: '#263554', color: '#fff', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '11px' }} />
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
                      setNewTask({ ...newTask, BỘ_CHỨA: 'DỰ ÁN' });
                    }}
                    className="accent-[#5252ff]"
                  />
                  Công việc Dự án
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                  <input 
                    type="radio" 
                    name="taskType" 
                    checked={taskType === 'office'} 
                    onChange={() => {
                      setTaskType('office');
                      setNewTask({ ...newTask, BỘ_CHỨA: 'VĂN PHÒNG' });
                    }}
                    className="accent-[#5252ff]"
                  />
                  Công việc Văn phòng / Nội bộ
                </label>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Tên tác vụ *</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                  value={newTask.TÁC_VỤ}
                  onChange={e => setNewTask({ ...newTask, TÁC_VỤ: e.target.value })}
                  placeholder="Nhập nội dung công việc..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {taskType === 'project' ? (
                  <div>
                    <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Dự án</label>
                    <select 
                      className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                      value={newTask.TÊN_DỰ_ÁN}
                      onChange={e => setNewTask({ ...newTask, TÊN_DỰ_ÁN: e.target.value })}
                    >
                      <option value="">-- Chọn dự án --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
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
                  <select 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                    value={newTask.NHÂN_SỰ}
                    onChange={e => setNewTask({ ...newTask, NHÂN_SỰ: e.target.value })}
                  >
                    <option value="">-- Chọn --</option>
                    {employees.map((emp, i) => (
                      <option key={i} value={emp.NAME || emp.name}>{emp.NAME || emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Bắt đầu</label>
                  <input 
                    type="date" 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none [color-scheme:dark]"
                    value={newTask.NGÀY_BẮT_ĐẦU}
                    onChange={e => setNewTask({ ...newTask, NGÀY_BẮT_ĐẦU: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Đến hạn</label>
                  <input 
                    type="date" 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none [color-scheme:dark]"
                    value={newTask.NGÀY_KẾT_THÚC}
                    onChange={e => setNewTask({ ...newTask, NGÀY_KẾT_THÚC: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold uppercase mb-1 block">Bộ chứa</label>
                  <input 
                    type="text" 
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] rounded p-2 text-white text-xs focus:border-[#5252ff] outline-none"
                    value={newTask.BỘ_CHỨA}
                    onChange={e => setNewTask({ ...newTask, BỘ_CHỨA: e.target.value })}
                    placeholder="VD: DỰ ÁN"
                  />
                </div>
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
      {selectedTask && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 overflow-y-auto backdrop-blur-sm" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mb-10 overflow-hidden flex flex-col mt-8 relative" onClick={e => e.stopPropagation()}>
            
            {/* Header Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <div className="relative">
                <button 
                  onClick={() => setIsTaskMenuOpen(!isTaskMenuOpen)}
                  className={`p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors ${isTaskMenuOpen ? 'bg-slate-200' : ''}`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {/* Menu Popup */}
                {isTaskMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-50">
                    <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2" onClick={() => { setIsTaskMenuOpen(false); handleTaskUpdate(selectedTask, 'PINNED', true); }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Ghim yêu thích
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-2" onClick={() => handleTaskDelete(selectedTask)}>
                      <AlertTriangle className="w-4 h-4 text-red-400" /> Xóa tác vụ
                    </button>
                  </div>
                )}
              </div>
              <button className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors" onClick={() => setSelectedTask(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Details */}
            <div className="flex-1 p-8 pb-10">
              <div className="flex items-start gap-3 mb-6">
                <button 
                  onClick={() => updateTaskStatus(selectedTask, selectedTask.computedStatus === 'Đã hoàn thành' ? 'Chưa bắt đầu' : 'Đã hoàn thành')}
                  className="mt-1 flex-shrink-0"
                >
                  {selectedTask.computedStatus === 'Đã hoàn thành' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400 hover:text-blue-500" />
                  )}
                </button>
                <div className="flex-1">
                  <input 
                    type="text" 
                    defaultValue={selectedTask.TÁC_VỤ}
                    onBlur={(e) => {
                      if (e.target.value !== selectedTask.TÁC_VỤ) {
                        handleTaskUpdate(selectedTask, 'TÁC_VỤ', e.target.value);
                      }
                    }}
                    className="text-2xl font-semibold text-slate-800 w-full outline-none hover:bg-slate-50 focus:bg-slate-50 rounded px-1 -ml-1 transition-colors"
                    placeholder="Nhập tên tác vụ"
                  />
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>{selectedTask.TÊN_DỰ_ÁN ? `Dự án: ${selectedTask.TÊN_DỰ_ÁN}` : 'Nhiệm vụ chung'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 ml-9">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400"><Columns className="w-4 h-4" /></span>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    {selectedTask.BỘ_CHỨA || 'VĂN PHÒNG'} <button className="hover:text-blue-900">×</button>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400"><LayoutGrid className="w-4 h-4" /></span>
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white" title={selectedTask.NHÂN_SỰ}>
                    {selectedTask.NHÂN_SỰ ? selectedTask.NHÂN_SỰ.substring(0, 2).toUpperCase() : 'NV'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8 ml-9">
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded shadow-md transition-colors flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> Chi tiết tác vụ
                </button>
                <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-4 py-2 rounded shadow-sm transition-colors flex items-center gap-2">
                  <Download className="w-4 h-4" /> Tệp đính kèm
                </button>
              </div>

              <div className="ml-9 grid grid-cols-2 gap-x-6 gap-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Trạng thái</label>
                  <div className="relative">
                    <select 
                      value={selectedTask.TRẠNG_THÁI || 'Chưa bắt đầu'}
                      onChange={(e) => handleTaskUpdate(selectedTask, 'TRẠNG_THÁI', e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                      <option value="Đang diễn ra">Đang diễn ra</option>
                      <option value="Đã hoàn thành">Đã hoàn thành</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ưu tiên</label>
                  <div className="relative">
                    <select 
                      value={selectedTask.ƯU_TIÊN || 'Medium'}
                      onChange={(e) => handleTaskUpdate(selectedTask, 'ƯU_TIÊN', e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  <input 
                    type="date" 
                    value={selectedTask.NGÀY_BẮT_ĐẦU_LOCAL || ''}
                    onChange={(e) => handleTaskUpdate(selectedTask, 'NGÀY_BẮT_ĐẦU', e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ngày đến hạn</label>
                  <input 
                    type="date" 
                    value={selectedTask.NGÀY_KẾT_THÚC_LOCAL || ''}
                    onChange={(e) => handleTaskUpdate(selectedTask, 'NGÀY_KẾT_THÚC', e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-700 py-2 px-3 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">Lặp lại <AlertTriangle className="w-3 h-3 text-slate-400" /></label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option>Không lặp lại</option>
                      <option>Hàng ngày</option>
                      <option>Hàng tuần</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">Bộ chứa <AlertTriangle className="w-3 h-3 text-slate-400" /></label>
                  <div className="relative">
                    <select 
                      value={selectedTask.BỘ_CHỨA || 'VĂN PHÒNG'}
                      onChange={(e) => handleTaskUpdate(selectedTask, 'BỘ_CHỨA', e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-2 pl-3 pr-8 rounded text-sm hover:border-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      {containers.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="ml-9">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-slate-800">Ghi chú</label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4" defaultChecked />
                    Hiển thị trong chế độ xem bảng
                  </label>
                </div>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-md text-sm hover:border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all min-h-[120px]"
                  placeholder="Thêm ghi chú..."
                  defaultValue={selectedTask.GHI_CHÚ || ""}
                  onBlur={(e) => {
                    if (e.target.value !== selectedTask.GHI_CHÚ) {
                      handleTaskUpdate(selectedTask, 'GHI_CHÚ', e.target.value);
                    }
                  }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
