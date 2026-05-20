import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Folder,
  Zap,
  HardHat,
  CheckCircle2,
  Search,
  Filter,
  Download,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  FileText,
  MessageSquare,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  PlusCircle,
  HelpCircle,
  Briefcase,
  Calendar,
  AlertTriangle,
  User,
  Activity,
  DollarSign,
  TrendingDown,
  TrendingUp,
  MapPin,
  Clock,
  Send
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "./services/api";

export default function App() {
  const navigate = useNavigate();
  // Projects state
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch from GAS
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProjects();
        if (data && data.length > 0) {
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  // Advanced Excel Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("pm"); // pm, sm, region, client, status, risk
  
  // Filter settings - initially empty meaning "select all"
  const [filters, setFilters] = useState({
    pm: [],
    sm: [],
    region: [],
    client: [],
    status: [],
    risk: []
  });

  // Temporary filters state for the popover (applied only on "Apply")
  const [tempFilters, setTempFilters] = useState({
    pm: [],
    sm: [],
    region: [],
    client: [],
    status: [],
    risk: []
  });

  // Populate temp filters when opening the panel
  const handleOpenFilter = () => {
    setTempFilters({ ...filters });
    setIsFilterOpen(!isFilterOpen);
  };

  // Close filter panel if click outside
  const filterRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options derived from current project pool
  const filterOptions = useMemo(() => {
    const options = {
      pm: new Set(),
      sm: new Set(),
      region: new Set(),
      client: new Set(),
      status: new Set(),
      risk: new Set()
    };
    projects.forEach(p => {
      if (p.pm) options.pm.add(p.pm);
      if (p.sm) options.sm.add(p.sm);
      if (p.region) options.region.add(p.region);
      if (p.client) options.client.add(p.client);
      if (p.status) options.status.add(p.status);
      if (p.risk) options.risk.add(p.risk);
    });
    return {
      pm: Array.from(options.pm).sort(),
      sm: Array.from(options.sm).sort(),
      region: Array.from(options.region).sort(),
      client: Array.from(options.client).sort(),
      status: Array.from(options.status).sort(),
      risk: Array.from(options.risk).sort()
    };
  }, [projects]);

  // Handle temporary check/uncheck
  const toggleTempFilter = (category, value) => {
    setTempFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  // Select all inside a category
  const toggleTempFilterAll = (category) => {
    const options = filterOptions[category] || [];
    const current = tempFilters[category] || [];
    const isAllSelected = current.length === options.length;

    setTempFilters(prev => ({
      ...prev,
      [category]: isAllSelected ? [] : [...options]
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setFilters({ ...tempFilters });
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  // Clear filters
  const resetFilters = () => {
    const empty = { pm: [], sm: [], region: [], client: [], status: [], risk: [] };
    setFilters(empty);
    setTempFilters(empty);
    setIsFilterOpen(false);
    setCurrentPage(1);
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).reduce((acc, curr) => acc + curr.length, 0);
  }, [filters]);

  // Sort State
  const [sortField, setSortField] = useState("deviation"); // default: deviation (% kế hoạch)
  const [sortDirection, setSortDirection] = useState("desc"); // desc (Giảm dần), asc (Tăng dần)

  // Sort field display name translator
  const sortFieldName = (field) => {
    switch (field) {
      case "progress": return "% thực tế";
      case "deviation": return "% kế hoạch";
      case "risk": return "Risk";
      case "codDays": return "COD";
      case "capacity": return "Công suất";
      case "lastUpdated": return "Cập nhật cuối";
      default: return field;
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8); // Default 8 to match mockup layout on Page 1

  // Drawers and Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Comments for details view
  const [commentText, setCommentText] = useState("");
  const [projectComments, setProjectComments] = useState(() => {
    const saved = localStorage.getItem("epc_comments");
    return saved ? JSON.parse(saved) : {};
  });

  // Save comments
  useEffect(() => {
    localStorage.setItem("epc_comments", JSON.stringify(projectComments));
  }, [projectComments]);

  // Add Project Form State
  const [newProject, setNewProject] = useState({
    name: "",
    client: "",
    pm: "Lê Văn C.",
    sm: "Bùi M. T.",
    capacity: 1000,
    progress: 0,
    deviation: 0.0,
    codDays: 90,
    codDate: "20/08/2026",
    risk: "LOW",
    issue: "Không có",
    region: "Miền Nam",
    priority: 5,
    status: "in_progress"
  });

  // Add project handler
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProject.name || !newProject.client) return;

    let priorityColor = "green";
    if (newProject.priority <= 3) priorityColor = "red";
    else if (newProject.priority <= 5) priorityColor = "orange";
    else if (newProject.priority <= 7) priorityColor = "yellow";

    const projectToAdd = {
      ...newProject,
      id: `NEW-${Date.now()}`,
      name: newProject.name,
      client: newProject.client,
      pm: newProject.pm,
      sm: newProject.sm,
      capacity: Number(newProject.capacity),
      actualProgress: Number(newProject.progress),
      delay: Number(newProject.deviation),
      cod: newProject.codDate,
      risk: newProject.risk,
      status: newProject.status,
      updatedAt: "Vừa xong",
      priorityColor,
      priority: newProject.priority,
      issue: newProject.issue
    };

    try {
      setIsSubmitting(true);
      await api.createProject(projectToAdd);
      
      setProjects([projectToAdd, ...projects]);
      setIsAddDrawerOpen(false);
      // Reset form
      setNewProject({
        name: "",
        client: "",
        pm: "Lê Văn C.",
        sm: "Bùi M. T.",
        capacity: 1000,
        progress: 0,
        deviation: 0.0,
        codDays: 90,
        codDate: "20/08/2026",
        risk: "LOW",
        issue: "Không có",
        region: "Miền Nam",
        priority: 5,
        status: "in_progress"
      });
    } catch (error) {
      console.error("Failed to add project:", error);
      alert("Lỗi khi thêm dự án: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply search, filters and sort
  const processedProjects = useMemo(() => {
    let result = [...projects];

    // 1. Search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          (p.name && p.name.toLowerCase().includes(term)) ||
          (p.client && p.client.toLowerCase().includes(term)) ||
          (p.pm && p.pm.toLowerCase().includes(term)) ||
          (p.sm && p.sm.toLowerCase().includes(term))
      );
    }

    // 2. Advanced Multi-select filters
    Object.keys(filters).forEach(category => {
      const selectedVals = filters[category];
      if (selectedVals && selectedVals.length > 0) {
        result = result.filter(p => {
          let val = p[category];
          return selectedVals.includes(val);
        });
      }
    });

    // Helper to compute hours for relative updates
    const getHoursFromRelativeTime = (timeStr) => {
      if (!timeStr) return 9999;
      if (timeStr === "Vừa xong") return 0;
      const match = timeStr.match(/^(\d+)\s+(giờ|ngày|tuần)\s+trước$/);
      if (!match) return 9999;
      const val = parseInt(match[1], 10);
      const unit = match[2];
      if (unit === "giờ") return val;
      if (unit === "ngày") return val * 24;
      if (unit === "tuần") return val * 24 * 7;
      return 9999;
    };

    // 3. Sorting
    result.sort((a, b) => {
      // Priority sorting logic: severity weight
      if (sortField === "priority") {
        const colorWeight = { red: 4, orange: 3, yellow: 2, green: 1 };
        const weightA = colorWeight[a.priorityColor] || 0;
        const weightB = colorWeight[b.priorityColor] || 0;
        if (weightA !== weightB) {
          // If asc, critical (Red=4) appears first, so weightB - weightA
          return sortDirection === "asc" ? weightB - weightA : weightA - weightB;
        }
        // Sub-sort by priority number: smaller priority number first
        return sortDirection === "asc" ? a.priority - b.priority : b.priority - a.priority;
      }

      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "capacity") { valA = a.capacity; valB = b.capacity; }
      if (sortField === "progress") { valA = a.actualProgress; valB = b.actualProgress; }
      if (sortField === "deviation") { valA = a.delay; valB = b.delay; }
      if (sortField === "codDays") { valA = a.cod; valB = b.cod; }
      if (sortField === "name") { valA = a.name; valB = b.name; }
      if (sortField === "client") { valA = a.client; valB = b.client; }
      if (sortField === "pm") { valA = a.pm; valB = b.pm; }
      if (sortField === "sm") { valA = a.sm; valB = b.sm; }

      if (sortField === "risk") {
        const riskWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        valA = riskWeight[a.risk] || 0;
        valB = riskWeight[b.risk] || 0;
      } else if (sortField === "lastUpdated") {
        valA = getHoursFromRelativeTime(a.updatedAt);
        valB = getHoursFromRelativeTime(b.updatedAt);
        return sortDirection === "desc" ? valA - valB : valB - valA;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "desc" ? valB - valA : valA - valB;
      }

      // Case-insensitive Vietnamese character comparison
      const strA = String(valA || "");
      const strB = String(valB || "");
      const comp = strA.localeCompare(strB, "vi", { sensitivity: "base" });
      return sortDirection === "desc" ? -comp : comp;
    });

    return result;
  }, [projects, searchTerm, filters, sortField, sortDirection]);

  // KPI calculations based on current active list
  const kpiStats = useMemo(() => {
    // Total projects matching filter
    const totalCount = processedProjects.length;

    // Total Capacity
    const totalCapacity = processedProjects.reduce((acc, curr) => acc + (Number(curr.capacity) || 0), 0);

    // Projects In-Construction / Active
    const inConstructionCount = processedProjects.filter(p => p.status === "ACTIVE" || p.status === "in_progress" || !p.status || p.status === "-").length;

    // Projects Completed
    const completedCount = processedProjects.filter(p => p.status === "COMPLETED" || p.status === "completed").length;

    return {
      total: totalCount,
      capacity: totalCapacity,
      active: inConstructionCount,
      completed: completedCount
    };
  }, [processedProjects]);

  // Pagination calculation
  const totalPages = Math.ceil(processedProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return processedProjects.slice(startIdx, startIdx + pageSize);
  }, [processedProjects, currentPage, pageSize]);

  // Export to Excel CSV
  const handleExportCSV = () => {
    const headers = [
      "Ưu tiên",
      "Dự án",
      "Khách hàng",
      "PM",
      "SM",
      "Công suất (kWp)",
      "% Thực tế",
      "Δ Kế hoạch",
      "COD còn lại (ngày)",
      "COD ngày",
      "Risk",
      "Vướng mắc chính",
      "Cập nhật cuối"
    ];

    const rows = processedProjects.map(p => [
      p.priority || '',
      p.TÊN_DỰ_ÁN || '',
      p.KHÁCH_HÀNG || '',
      p.PM || '',
      p.SM || '',
      p.CÔNG_SUẤT_KWP || 0,
      `${p.TIẾN_ĐỘ_THỰC_TẾ || 0}%`,
      `${(p.DELAY || 0) >= 0 ? "+" : ""}${p.DELAY || 0}%`,
      p.KẾ_HOẠCH_COD || '',
      p.DỰ_BÁO_COD || '',
      p.RISK_LEVEL || '',
      p.issue || '',
      p.LAST_UPDATE || ''
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Danh_sach_du_an_VPEG_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Comment
  const handleAddComment = (projectId) => {
    if (!commentText.trim()) return;
    const comment = {
      id: Date.now(),
      user: "Giám Sát Viên",
      role: "GIÁM SÁT",
      avatar: "NV",
      text: commentText,
      time: "Vừa xong"
    };

    setProjectComments(prev => {
      const projectCommentsList = prev[projectId] || [];
      return {
        ...prev,
        [projectId]: [comment, ...projectCommentsList]
      };
    });
    setCommentText("");
  };

  // Render sorting-enabled headers with pointers, transitions, and indicators
  const renderSortableHeader = (field, label, align = "left") => {
    const isSorted = sortField === field;
    let indicator = "↕";
    if (isSorted) {
      indicator = sortDirection === "asc" ? "↑" : "↓";
    }

    const handleClick = () => {
      if (isSorted) {
        setSortDirection(prev => prev === "desc" ? "asc" : "desc");
      } else {
        setSortField(field);
        // Default priority to asc so critical projects show up first, others to desc
        setSortDirection(field === "priority" ? "asc" : "desc");
      }
      setCurrentPage(1);
    };

    return (
      <th
        onClick={handleClick}
        className={`py-2.5 px-4 font-semibold select-none cursor-pointer hover:bg-[#141c2f] hover:text-white transition-all duration-200 border-b border-[#182135] relative group ${
          align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
        } ${isSorted ? "text-white bg-[#0e1628]" : "text-[#6b7d9b] bg-[#0d1322]"}`}
      >
        <div className={`flex items-center gap-1.5 ${align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""}`}>
          <span className="font-bold tracking-wider uppercase text-[10px]">{label}</span>
          <span 
            className={`text-[10px] select-none font-bold transition-all duration-200 ${
              isSorted 
                ? "text-[#7373ff] opacity-100 scale-110 drop-shadow-[0_0_4px_rgba(82,82,255,0.4)]" 
                : "opacity-40 text-slate-400 group-hover:opacity-85"
            }`}
          >
            {indicator}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#060a13] text-slate-100 font-sans relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-[#060a13]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin"></div>
            <span className="text-white font-medium text-sm tracking-wide">Đang đồng bộ dữ liệu...</span>
          </div>
        </div>
      )}
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 border-r border-[#182135] bg-[#070b14] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-[#182135]/40">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-[#5252ff] to-[#8080ff] shadow-[0_0_12px_rgba(82,82,255,0.7)]"></div>
            <span className="text-sm font-bold tracking-wider text-white">VPEG-PXD-REPORT</span>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1">
            <a
              href="#overview"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#6b7d9b] hover:text-white hover:bg-[#141c2f]/50 transition-all text-xs font-medium"
            >
              <Activity className="w-4 h-4 text-[#6b7d9b]" />
              <span>TỔNG QUAN</span>
            </a>
            <a
              href="#tasks"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#6b7d9b] hover:text-white hover:bg-[#141c2f]/50 transition-all text-xs font-medium"
            >
              <Briefcase className="w-4 h-4 text-[#6b7d9b]" />
              <span>DANH SÁCH CÔNG VIỆC</span>
            </a>
            <a
              href="#projects"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-brand-purpleBg/25 text-[#7373ff] border-l-2 border-[#5252ff] shadow-[0_0_15px_rgba(82,82,255,0.08)] transition-all text-xs font-semibold"
            >
              <Folder className="w-4 h-4 text-[#5252ff]" />
              <span>DANH SÁCH DỰ ÁN</span>
            </a>
          </nav>
        </div>

        {/* User Profile Bottom */}
        <div className="p-4 border-t border-[#182135]/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#182135] flex items-center justify-center text-xs font-bold text-slate-300 border border-[#263554]">
            NV
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">Nhân viên</span>
            <span className="text-[10px] text-[#3b82f6] font-bold tracking-wider mt-0.5">GIÁM SÁT</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* 2. TOP HEADER */}
        <header className="px-8 pt-6 pb-4 border-b border-[#182135]/30 flex justify-between items-center bg-[#070b14]/30 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">DANH SÁCH DỰ ÁN</h1>
            <p className="text-[11px] text-[#6b7d9b] mt-1 font-medium">Theo dõi và điều phối toàn bộ dự án đang triển khai</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCSV}
              className="border border-[#182135] bg-[#0b0f19] hover:bg-[#141c2f] hover:border-[#263554] text-slate-200 text-xs px-3.5 py-2 rounded flex items-center gap-2 border shadow-sm transition-all cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Xuất Excel</span>
            </button>
            <button 
              onClick={() => setIsAddDrawerOpen(true)}
              className="bg-[#5252ff] hover:bg-[#4141d6] text-white text-xs font-medium px-3.5 py-2 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(82,82,255,0.3)] hover:shadow-[0_0_20px_rgba(82,82,255,0.5)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dự án</span>
            </button>
          </div>
        </header>

        {/* 3. SEARCH + FILTER BAR */}
        <section className="px-8 py-3 flex justify-between items-center bg-[#060a13] relative z-20 border-b border-[#182135]/20">
          
          {/* Left: Search input + Filter button */}
          <div className="flex items-center gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm kiếm dự án, khách hàng..."
                className="bg-[#0b0f19] border border-[#182135] text-slate-200 pl-4 pr-10 py-1.5 rounded text-xs focus:outline-none focus:border-[#5252ff] w-72 placeholder-[#4d5e7a] transition-all"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#4d5e7a] pointer-events-none" />
            </div>

            {/* Compact Filter Button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={handleOpenFilter}
                className={`bg-[#0b0f19] border text-xs px-3 py-1.5 rounded flex items-center gap-2 transition-all cursor-pointer font-medium ${
                  isFilterOpen || activeFiltersCount > 0 
                    ? "border-[#5252ff] text-[#7373ff] bg-brand-purpleBg/10" 
                    : "border-[#182135] text-slate-200 hover:bg-[#141c2f] hover:border-[#263554]"
                }`}
              >
                <Filter className="w-3.5 h-3.5 text-inherit" />
                <span>Bộ lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 w-4 h-4 bg-[#5252ff] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className={`w-3 h-3 text-inherit transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Excel-Style Advanced Filter Popover */}
              {isFilterOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-[#0b0f19] border border-[#182135] shadow-[0_10px_30px_-5px_rgba(0,0,0,0.8)] rounded-lg overflow-hidden flex flex-col z-50 text-xs text-slate-200 glow-purple">
                  {/* Popover Header */}
                  <div className="p-3 border-b border-[#182135] bg-[#0c1221] flex justify-between items-center">
                    <span className="font-semibold text-slate-200">Bộ lọc nâng cao</span>
                    <button 
                      onClick={() => setIsFilterOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Popover Body (Split layout) */}
                  <div className="flex h-56">
                    {/* Left: Tab selectors */}
                    <div className="w-1/3 border-r border-[#182135] bg-[#080d17] flex flex-col">
                      {[
                        { id: "pm", label: "PM" },
                        { id: "sm", label: "SM" },
                        { id: "region", label: "Khu vực" },
                        { id: "client", label: "Khách hàng" },
                        { id: "status", label: "Trạng thái" },
                        { id: "risk", label: "Risk" }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveFilterTab(tab.id)}
                          className={`w-full text-left px-3 py-2 border-b border-[#182135]/50 transition-all font-medium ${
                            activeFilterTab === tab.id
                              ? "bg-[#0b0f19] text-[#7373ff] border-l-2 border-[#5252ff]"
                              : "text-slate-400 hover:bg-[#0c1322] hover:text-slate-200"
                          }`}
                        >
                          {tab.label}
                          {tempFilters[tab.id]?.length > 0 && (
                            <span className="ml-1 text-[9px] text-[#5252ff] font-bold">({tempFilters[tab.id].length})</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Right: Multi-select Checkboxes */}
                    <div className="w-2/3 p-3 overflow-y-auto flex flex-col bg-[#0b0f19]">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#182135]/40">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={tempFilters[activeFilterTab]?.length === filterOptions[activeFilterTab]?.length && filterOptions[activeFilterTab]?.length > 0}
                          onChange={() => toggleTempFilterAll(activeFilterTab)}
                          className="rounded border-[#182135] bg-[#060a13] text-[#5252ff] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-[#5252ff]"
                        />
                        <label htmlFor="select-all" className="font-semibold text-slate-300 cursor-pointer select-none">
                          Chọn tất cả ({filterOptions[activeFilterTab]?.length || 0})
                        </label>
                      </div>

                      <div className="space-y-1.5">
                        {filterOptions[activeFilterTab]?.map(option => (
                          <div key={option} className="flex items-center gap-2 hover:bg-[#141c2f]/40 p-0.5 rounded transition-all">
                            <input
                              type="checkbox"
                              id={`opt-${option}`}
                              checked={tempFilters[activeFilterTab]?.includes(option)}
                              onChange={() => toggleTempFilter(activeFilterTab, option)}
                              className="rounded border-[#182135] bg-[#060a13] text-[#5252ff] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-[#5252ff]"
                            />
                            <label htmlFor={`opt-${option}`} className="text-slate-400 hover:text-slate-200 cursor-pointer select-none truncate">
                              {option === "in_progress" ? "Đang thi công" : option === "completed" ? "Hoàn thành" : option}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Popover Footer */}
                  <div className="p-2 border-t border-[#182135] bg-[#0c1221] flex justify-between items-center gap-2">
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1.5 rounded hover:bg-[#141c2f] hover:text-white text-slate-400 font-medium cursor-pointer transition-all"
                    >
                      Xóa bộ lọc
                    </button>
                    <button
                      onClick={applyFilters}
                      className="bg-[#5252ff] hover:bg-[#4141d6] text-white font-medium px-4 py-1.5 rounded transition-all cursor-pointer shadow-md"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Results Count Indicator */}
          <div className="text-xs text-[#6b7d9b] font-medium hidden sm:block">
            Hiển thị <span className="text-white font-semibold">{processedProjects.length}</span> dự án phù hợp
          </div>
        </section>

        {/* 4. KPI SUMMARY CARDS */}
        <section className="px-8 py-2 grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#060a13]">
          
          {/* Card 1: Total projects */}
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4 relative overflow-hidden transition-all shadow-md hover:border-[#263554] group">
            <div className="w-11 h-11 rounded-lg bg-[rgba(82,82,255,0.1)] text-[#5252ff] flex items-center justify-center transition-all group-hover:scale-105 border border-[rgba(82,82,255,0.2)]">
              <Folder className="w-5 h-5 text-[#5252ff]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider font-bold text-[#6b7d9b] uppercase">TỔNG DỰ ÁN</span>
              <span className="text-xl font-bold text-white mt-0.5 tracking-tight">{kpiStats.total}</span>
              <span className="text-[10px] text-[#4d5e7a] font-medium mt-0.5">Dự án</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#5252ff]"></div>
          </div>

          {/* Card 2: Total capacity */}
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4 relative overflow-hidden transition-all shadow-md hover:border-[#263554] group">
            <div className="w-11 h-11 rounded-lg bg-[rgba(59,130,246,0.1)] text-[#3b82f6] flex items-center justify-center transition-all group-hover:scale-105 border border-[rgba(59,130,246,0.2)]">
              <Zap className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider font-bold text-[#6b7d9b] uppercase">TỔNG CÔNG SUẤT</span>
              <span className="text-xl font-bold text-white mt-0.5 tracking-tight">
                {kpiStats.capacity.toLocaleString()} kWp
              </span>
              <span className="text-[10px] text-[#4d5e7a] font-medium mt-0.5">kWp</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#3b82f6]"></div>
          </div>

          {/* Card 3: In construction */}
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4 relative overflow-hidden transition-all shadow-md hover:border-[#263554] group">
            <div className="w-11 h-11 rounded-lg bg-[rgba(249,115,22,0.1)] text-[#f97316] flex items-center justify-center transition-all group-hover:scale-105 border border-[rgba(249,115,22,0.2)]">
              <HardHat className="w-5 h-5 text-[#f97316]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider font-bold text-[#6b7d9b] uppercase">TỔNG DỰ ÁN ĐANG THI CÔNG</span>
              <span className="text-xl font-bold text-white mt-0.5 tracking-tight">{kpiStats.active}</span>
              <span className="text-[10px] text-[#4d5e7a] font-medium mt-0.5">Dự án</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#f97316]"></div>
          </div>

          {/* Card 4: Completed */}
          <div className="glass-panel rounded-lg p-4 flex items-center gap-4 relative overflow-hidden transition-all shadow-md hover:border-[#263554] group">
            <div className="w-11 h-11 rounded-lg bg-[rgba(16,185,129,0.1)] text-[#10b981] flex items-center justify-center transition-all group-hover:scale-105 border border-[rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider font-bold text-[#6b7d9b] uppercase">TỔNG DỰ ÁN HOÀN THÀNH</span>
              <span className="text-xl font-bold text-white mt-0.5 tracking-tight">{kpiStats.completed}</span>
              <span className="text-[10px] text-[#4d5e7a] font-medium mt-0.5">Dự án</span>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-[4px] bg-[#10b981]"></div>
          </div>
        </section>

        {/* 5. PROJECT TABLE SECTION */}
        <section className="px-8 py-6 bg-[#060a13] flex-1">
          {/* Table Header Section */}
          <div className="mb-3.5 flex justify-between items-center">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              DANH SÁCH DỰ ÁN 
              <span className="bg-[#182135] text-slate-300 font-semibold px-2 py-0.5 rounded text-[10px] tracking-normal normal-case">
                {processedProjects.length} kết quả
              </span>
            </h2>
          </div>

          {/* Main Table Card */}
          <div className="border border-[#182135] rounded-lg bg-[#0b0f19] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                
                {/* Table Header */}
                <thead>
                  <tr className="bg-[#0d1322] border-b border-[#182135] text-[#6b7d9b] text-[10px] font-bold uppercase tracking-wider">
                    {renderSortableHeader("priority", "Ưu tiên")}
                    {renderSortableHeader("name", "Dự án")}
                    {renderSortableHeader("client", "Khách hàng")}
                    {renderSortableHeader("pm", "PM")}
                    {renderSortableHeader("sm", "SM")}
                    {renderSortableHeader("capacity", "Công suất (kWp)")}
                    {renderSortableHeader("progress", "% Thực tế")}
                    {renderSortableHeader("deviation", "Δ Kế hoạch")}
                    {renderSortableHeader("codDays", "COD còn lại")}
                    {renderSortableHeader("risk", "Risk")}
                    {renderSortableHeader("issue", "Vướng mắc chính")}
                    {renderSortableHeader("lastUpdated", "Cập nhật cuối")}
                    <th className="py-2.5 px-4 font-semibold text-center bg-[#0d1322] select-none text-[#6b7d9b]">Action</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-[#182135]/50">
                  {paginatedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-10 text-slate-400 text-xs font-medium bg-[#0b0f19]">
                        Không tìm thấy dự án nào khớp với điều kiện lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((p) => {
                      // Map Priority circle styling
                      let priorityClass = "";
                      switch (p.priorityColor) {
                        case "red":
                          priorityClass = "text-brand-red border-[#ef4444]/30 bg-[#ef4444]/5";
                          break;
                        case "orange":
                          priorityClass = "text-brand-orange border-[#f97316]/30 bg-[#f97316]/5";
                          break;
                        case "yellow":
                          priorityClass = "text-brand-yellow border-[#eab308]/30 bg-[#eab308]/5";
                          break;
                        default:
                          priorityClass = "text-brand-green border-[#10b981]/30 bg-[#10b981]/5";
                      }

                      // Map Risk badges with stronger contrast and subtle glow
                      let riskBadgeClass = "";
                      switch (p.risk) {
                        case "HIGH":
                          riskBadgeClass = "text-red-400 bg-red-950/45 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)] font-semibold";
                          break;
                        case "MEDIUM":
                          riskBadgeClass = "text-orange-400 bg-orange-950/45 border border-orange-500/40 shadow-[0_0_8px_rgba(249,115,22,0.2)] font-semibold";
                          break;
                        default:
                          riskBadgeClass = "text-emerald-400 bg-emerald-950/45 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)] font-semibold";
                      }

                      // Map issue color dots
                      let issueDotClass = "";
                      switch (p.issueType) {
                        case "danger":
                          issueDotClass = "bg-[#ef4444]";
                          break;
                        case "orange":
                          issueDotClass = "bg-[#f97316]";
                          break;
                        case "medium":
                          issueDotClass = "bg-[#eab308]";
                          break;
                        default:
                          issueDotClass = "bg-[#10b981]";
                      }

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-[#111827]/70 transition-all text-xs border-b border-[#182135]/40"
                        >
                          {/* Priority Column */}
                          <td className={`py-2.5 px-4 ${
                            sortField === "priority" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${priorityClass}`}>
                              {p.priority || '-'}
                            </div>
                          </td>

                          {/* Project Name */}
                          <td 
                            className={`py-2.5 px-4 font-bold text-white cursor-pointer hover:underline truncate max-w-[200px] ${
                              sortField === "name" ? "text-slate-100 bg-[#0e1628]/30 font-extrabold" : "bg-inherit"
                            }`}
                            onClick={() => {
                              navigate('/projects/' + p.id);
                            }}
                          >
                            {p.name}
                          </td>

                          {/* Client */}
                          <td className={`py-2.5 px-4 text-slate-300 font-medium ${
                            sortField === "client" ? "text-slate-100 bg-[#0e1628]/30 font-bold" : "bg-inherit"
                          }`}>{p.client}</td>

                          {/* PM */}
                          <td className={`py-2.5 px-4 ${
                            sortField === "pm" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <span className="bg-[#18183c] text-[#a0a0ff] px-2 py-0.5 rounded text-[10px] font-medium border border-[#2d2db3]/20 whitespace-nowrap">
                              {p.pm}
                            </span>
                          </td>

                          {/* SM */}
                          <td className={`py-2.5 px-4 ${
                            sortField === "sm" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <span className="bg-[#0e2440] text-[#70b0ff] px-2 py-0.5 rounded text-[10px] font-medium border border-[#103d73]/20 whitespace-nowrap">
                              {p.sm}
                            </span>
                          </td>

                          {/* Capacity */}
                          <td className={`py-2.5 px-4 font-bold text-slate-200 ${
                            sortField === "capacity" ? "text-white bg-[#0e1628]/30 font-extrabold" : "bg-inherit"
                          }`}>
                            {Number(p.capacity || 0).toLocaleString()}
                          </td>

                          {/* Progress */}
                          <td className={`py-2.5 px-4 min-w-[90px] ${
                            sortField === "progress" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <div className="flex flex-col">
                              <span className={`font-bold ${sortField === "progress" ? "text-[#8a8aff]" : "text-[#5252ff]"}`}>{p.actualProgress || 0}%</span>
                              <div className="w-16 h-1 bg-[#182135] rounded-full overflow-hidden mt-1.5">
                                <div
                                  className="bg-[#5252ff] h-full rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, p.actualProgress || 0))}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>

                          {/* Delta Plan Deviation */}
                          <td className={`py-2.5 px-4 font-bold ${
                            sortField === "deviation" ? "bg-[#0e1628]/30 font-extrabold" : "bg-inherit"
                          }`}>
                            <span className={(p.delay || 0) >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                              {(p.delay || 0) >= 0 ? "+" : ""}
                              {Number(p.delay || 0).toFixed(2)}%
                            </span>
                          </td>

                          {/* COD Remaining */}
                          <td className={`py-2.5 px-4 ${
                            sortField === "codDays" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200">
                                {(p.status === "COMPLETED" || p.status === "completed") ? "Completed" : (p.cod || '-')}
                              </span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{p.forecastCod || ''}</span>
                            </div>
                          </td>

                          {/* Risk Badge */}
                          <td className={`py-2.5 px-4 ${
                            sortField === "risk" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${riskBadgeClass}`}>
                              {p.risk}
                            </span>
                          </td>

                          {/* Key Issue */}
                          <td className={`py-2.5 px-4 max-w-[200px] truncate ${
                            sortField === "issue" ? "bg-[#0e1628]/30" : "bg-inherit"
                          }`}>
                            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                              <span className={`w-1.5 h-1.5 rounded-full ${issueDotClass} inline-block`}></span>
                              <span className="truncate">{p.issue || '-'}</span>
                            </div>
                          </td>

                          {/* Last Updated */}
                          <td className={`py-2.5 px-4 font-medium whitespace-nowrap ${
                            sortField === "lastUpdated" ? "text-slate-100 bg-[#0e1628]/30 font-bold" : "text-[#6b7d9b] bg-inherit"
                          }`}>{p.updatedAt}</td>

                          {/* Action icons */}
                          <td className="py-2.5 px-4 bg-inherit">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  navigate('/projects/' + p.id);
                                }}
                                title="Xem chi tiết"
                                className="p-1.5 hover:text-white text-slate-400 hover:bg-[#182135] hover:shadow-[0_0_8px_rgba(82,82,255,0.2)] border border-transparent hover:border-[#263554]/30 rounded transition-all duration-200 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleExportCSV}
                                title="Xuất báo cáo"
                                className="p-1.5 hover:text-white text-slate-400 hover:bg-[#182135] hover:shadow-[0_0_8px_rgba(82,82,255,0.2)] border border-transparent hover:border-[#263554]/30 rounded transition-all duration-200 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  navigate('/projects/' + p.id);
                                }}
                                title="Bình luận"
                                className="p-1.5 hover:text-white text-slate-400 hover:bg-[#182135] hover:shadow-[0_0_8px_rgba(82,82,255,0.2)] border border-transparent hover:border-[#263554]/30 rounded transition-all duration-200 cursor-pointer relative"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                {projectComments[p.id]?.length > 0 && (
                                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#5252ff] rounded-full"></span>
                                )}
                              </button>
                              <button
                                title="Khác"
                                className="p-1.5 hover:text-white text-slate-400 hover:bg-[#182135] hover:shadow-[0_0_8px_rgba(82,82,255,0.2)] border border-transparent hover:border-[#263554]/30 rounded transition-all duration-200 cursor-pointer"
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 6. PAGINATION */}
            <div className="flex justify-between items-center p-3.5 border-t border-[#182135] bg-[#0b0f19] text-xs text-[#6b7d9b] font-medium">
              {/* Left page sizing */}
              <div className="flex items-center gap-2">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#0b0f19] border border-[#182135] text-slate-200 px-2 py-0.5 rounded text-xs focus:outline-none focus:border-[#5252ff] cursor-pointer"
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
                <span>dự án trên {processedProjects.length} kết quả</span>
              </div>

              {/* Right page items navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-1 rounded border border-[#182135] flex items-center justify-center transition-all ${
                    currentPage === 1 
                      ? "opacity-40 cursor-not-allowed" 
                      : "hover:bg-[#141c2f] hover:border-[#263554] text-slate-200 cursor-pointer"
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-[#5252ff] border-[#5252ff] text-white"
                        : "border-[#182135] text-slate-400 hover:bg-[#141c2f] hover:border-[#263554] hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded border border-[#182135] flex items-center justify-center transition-all ${
                    currentPage === totalPages 
                      ? "opacity-40 cursor-not-allowed" 
                      : "hover:bg-[#141c2f] hover:border-[#263554] text-slate-200 cursor-pointer"
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* DRAWERS CONTAINER (Portal-like floating components overlay) */}

      {/* A. SLIDING DETAIL DRAWER (Project Detailed Summary & Comments Log) */}
      {isDetailDrawerOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
          {/* Backdrop Dismiss */}
          <div className="flex-1" onClick={() => setIsDetailDrawerOpen(false)}></div>
          
          {/* Drawer Body */}
          <div className="w-[500px] h-full bg-[#0b0f19] border-l border-[#182135] flex flex-col z-50 animate-slide-in shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#182135] bg-[#0c1221] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${
                  selectedProject.priorityColor === "red" ? "text-brand-red border-[#ef4444]/30" :
                  selectedProject.priorityColor === "orange" ? "text-brand-orange border-[#f97316]/30" :
                  selectedProject.priorityColor === "yellow" ? "text-brand-yellow border-[#eab308]/30" :
                  "text-brand-green border-[#10b981]/30"
                }`}>
                  {selectedProject.priority}
                </div>
                <h3 className="font-bold text-white text-sm truncate max-w-[340px] tracking-tight">{selectedProject.name}</h3>
              </div>
              <button 
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-[#182135] rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Status Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#060a13] p-3 rounded-lg border border-[#182135]">
                  <span className="text-[10px] text-[#6b7d9b] block uppercase font-bold">KHÁCH HÀNG</span>
                  <span className="text-xs font-semibold text-white mt-1 block">{selectedProject.client}</span>
                </div>
                <div className="bg-[#060a13] p-3 rounded-lg border border-[#182135]">
                  <span className="text-[10px] text-[#6b7d9b] block uppercase font-bold">KHU VỰC</span>
                  <span className="text-xs font-semibold text-white mt-1 block">{selectedProject.region}</span>
                </div>
              </div>

              {/* PM & SM Contacts */}
              <div className="bg-[#060a13] p-4 rounded-lg border border-[#182135] space-y-3">
                <h4 className="text-[10px] text-[#6b7d9b] font-bold uppercase tracking-wider">Đội ngũ phụ trách</h4>
                <div className="flex justify-between items-center border-b border-[#182135]/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#18183c] text-[#a0a0ff] flex items-center justify-center text-[10px] font-bold border border-[#2d2db3]/20">PM</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedProject.pm}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Project Manager</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#0e2440] text-[#70b0ff] flex items-center justify-center text-[10px] font-bold border border-[#103d73]/20">SM</span>
                    <span className="text-xs font-semibold text-slate-200">{selectedProject.sm}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">Site Manager</span>
                </div>
              </div>

              {/* Progress Summary Card */}
              <div className="bg-[#060a13] p-4 rounded-lg border border-[#182135] space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] text-[#6b7d9b] font-bold uppercase tracking-wider">Tiến độ thi công</h4>
                  <span className="text-xs font-bold text-[#5252ff]">{selectedProject.progress}%</span>
                </div>
                
                {/* Horizontal Progress bar */}
                <div className="w-full h-2 bg-[#182135] rounded-full overflow-hidden">
                  <div 
                    className="bg-[#5252ff] h-full rounded-full shadow-[0_0_8px_rgba(82,82,255,0.6)]" 
                    style={{ width: `${selectedProject.progress}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] text-[#6b7d9b] block font-medium">Công suất</span>
                    <span className="text-sm font-bold text-white mt-0.5 block">{selectedProject.capacity.toLocaleString()} kWp</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6b7d9b] block font-medium">Độ lệch kế hoạch</span>
                    <span className={`text-sm font-bold mt-0.5 block ${selectedProject.deviation >= 0 ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      {selectedProject.deviation >= 0 ? "+" : ""}{selectedProject.deviation.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* COD & Risk logs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#060a13] p-3 rounded-lg border border-[#182135]">
                  <span className="text-[10px] text-[#6b7d9b] block uppercase font-bold">COD còn lại</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block">
                    {selectedProject.status === "completed" ? "Đã đóng điện" : `${selectedProject.codDays} ngày`}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">{selectedProject.codDate}</span>
                </div>

                <div className="bg-[#060a13] p-3 rounded-lg border border-[#182135]">
                  <span className="text-[10px] text-[#6b7d9b] block uppercase font-bold">Mức độ rủi ro (Risk)</span>
                  <span className={`text-xs font-bold mt-1 block uppercase ${
                    selectedProject.risk === "HIGH" ? "text-[#ef4444]" :
                    selectedProject.risk === "MEDIUM" ? "text-[#f97316]" : "text-[#10b981]"
                  }`}>{selectedProject.risk}</span>
                </div>
              </div>

              {/* Key Issue / Vướng mắc */}
              <div className="bg-[#060a13] p-4 rounded-lg border border-[#182135] space-y-2">
                <h4 className="text-[10px] text-[#6b7d9b] font-bold uppercase tracking-wider">Vướng mắc chính</h4>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`w-2 h-2 rounded-full ${
                    selectedProject.issueType === "danger" ? "bg-[#ef4444]" :
                    selectedProject.issueType === "orange" ? "bg-[#f97316]" :
                    selectedProject.issueType === "medium" ? "bg-[#eab308]" : "bg-[#10b981]"
                  }`}></span>
                  <p className="text-xs font-medium text-slate-200">{selectedProject.issue}</p>
                </div>
              </div>

              {/* Financial metrics placeholder */}
              <div className="bg-[#060a13] p-4 rounded-lg border border-[#182135] space-y-3">
                <h4 className="text-[10px] text-[#6b7d9b] font-bold uppercase tracking-wider">Ngân sách dự án (BOD Metric)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Tổng mức đầu tư</span>
                    <span className="text-xs font-bold text-slate-300 block mt-0.5">{(selectedProject.capacity * 12.5).toLocaleString()} triệu VNĐ</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-medium">Chi phí đã giải ngân</span>
                    <span className="text-xs font-bold text-slate-300 block mt-0.5">{(selectedProject.capacity * 12.5 * (selectedProject.progress / 100)).toLocaleString()} triệu VNĐ</span>
                  </div>
                </div>
              </div>

              {/* CẬP NHẬT LẦN CUỐI */}
              <div className="flex items-center gap-2 text-[10px] text-[#6b7d9b] font-medium justify-center pt-2">
                <Clock className="w-3 h-3 text-[#6b7d9b]" />
                <span>Hoạt động cuối cùng được ghi nhận: {selectedProject.lastUpdated}</span>
              </div>

              {/* ----------------- COMMENTS SYSTEM ----------------- */}
              <div className="border-t border-[#182135] pt-6 space-y-4">
                <h4 className="text-[11px] text-slate-200 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>Nhật ký trao đổi & Phản hồi</span>
                  <span className="bg-[#182135] text-slate-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                    {(projectComments[selectedProject.id] || []).length}
                  </span>
                </h4>

                {/* Comment Form */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddComment(selectedProject.id);
                    }}
                    placeholder="Viết ý kiến phản hồi dự án..."
                    className="flex-1 bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded text-xs focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                  />
                  <button
                    onClick={() => handleAddComment(selectedProject.id)}
                    className="bg-[#5252ff] hover:bg-[#4141d6] text-white rounded px-3 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Comment Logs */}
                <div className="space-y-3.5 pt-2">
                  {(!projectComments[selectedProject.id] || projectComments[selectedProject.id].length === 0) ? (
                    <div className="text-center py-6 text-[#6b7d9b] text-xs font-medium bg-[#060a13]/30 rounded border border-[#182135]/40 border-dashed">
                      Chưa có trao đổi nào. Hãy để lại nhận xét đầu tiên.
                    </div>
                  ) : (
                    projectComments[selectedProject.id].map((c) => (
                      <div key={c.id} className="bg-[#060a13] p-3 rounded-lg border border-[#182135]/70 space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#182135] flex items-center justify-center text-[9px] font-bold text-slate-300 border border-[#263554]">
                              {c.avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-white">{c.user}</span>
                              <span className="text-[9px] text-[#3b82f6] font-bold tracking-wider">{c.role}</span>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500 font-medium">{c.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-1 font-medium">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* B. SLIDING ADD PROJECT DRAWER */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
          {/* Backdrop Dismiss */}
          <div className="flex-1" onClick={() => setIsAddDrawerOpen(false)}></div>
          
          {/* Drawer Body */}
          <form 
            onSubmit={handleAddProject}
            className="w-[450px] h-full bg-[#0b0f19] border-l border-[#182135] flex flex-col z-50 animate-slide-in shadow-[0_0_50px_rgba(0,0,0,0.8)]"
          >
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#182135] bg-[#0c1221] flex justify-between items-center shrink-0">
              <h3 className="font-bold text-white text-sm tracking-tight flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#5252ff]" />
                Khai báo dự án EPC Solar mới
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-[#182135] rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              
              {/* Project Name */}
              <div className="space-y-1">
                <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Tên dự án EPC *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: AEON LONG BIÊN GD2"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                />
              </div>

              {/* Client */}
              <div className="space-y-1">
                <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Khách hàng / Chủ đầu tư *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: AEON"
                  value={newProject.client}
                  onChange={(e) => setNewProject(prev => ({ ...prev, client: e.target.value }))}
                  className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                />
              </div>

              {/* Region Select */}
              <div className="space-y-1">
                <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Khu vực địa lý</label>
                <select
                  value={newProject.region}
                  onChange={(e) => setNewProject(prev => ({ ...prev, region: e.target.value }))}
                  className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] cursor-pointer"
                >
                  <option value="Miền Bắc">Miền Bắc</option>
                  <option value="Miền Trung">Miền Trung</option>
                  <option value="Miền Nam">Miền Nam</option>
                </select>
              </div>

              {/* PM & SM inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Project Manager (PM)</label>
                  <select
                    value={newProject.pm}
                    onChange={(e) => setNewProject(prev => ({ ...prev, pm: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] cursor-pointer"
                  >
                    <option value="Lê Văn C.">Lê Văn C.</option>
                    <option value="Trần Văn A.">Trần Văn A.</option>
                    <option value="Phạm Văn B.">Phạm Văn B.</option>
                    <option value="Nguyễn H.">Nguyễn H.</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Site Manager (SM)</label>
                  <select
                    value={newProject.sm}
                    onChange={(e) => setNewProject(prev => ({ ...prev, sm: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] cursor-pointer"
                  >
                    <option value="Bùi M. T.">Bùi M. T.</option>
                    <option value="Nguyễn V. K.">Nguyễn V. K.</option>
                    <option value="Nguyễn T. D.">Nguyễn T. D.</option>
                    <option value="Đỗ Văn C.">Đỗ Văn C.</option>
                    <option value="Hoàng A.">Hoàng A.</option>
                    <option value="Võ Minh Q.">Võ Minh Q.</option>
                    <option value="Nguyễn Đ. T.">Nguyễn Đ. T.</option>
                    <option value="Lê Xuân H.">Lê Xuân H.</option>
                  </select>
                </div>
              </div>

              {/* Capacity & Progress */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Công suất (kWp)</label>
                  <input
                    type="number"
                    min={0}
                    value={newProject.capacity}
                    onChange={(e) => setNewProject(prev => ({ ...prev, capacity: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Tiến độ thực tế (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newProject.progress}
                    onChange={(e) => setNewProject(prev => ({ ...prev, progress: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
              </div>

              {/* Deviation & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Độ lệch KH (Δ %)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProject.deviation}
                    onChange={(e) => setNewProject(prev => ({ ...prev, deviation: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Độ ưu tiên (1 - 15)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={newProject.priority}
                    onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
              </div>

              {/* COD Days & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Số ngày còn lại (COD)</label>
                  <input
                    type="number"
                    value={newProject.codDays}
                    onChange={(e) => setNewProject(prev => ({ ...prev, codDays: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Ngày đóng điện (COD)</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={newProject.codDate}
                    onChange={(e) => setNewProject(prev => ({ ...prev, codDate: e.target.value }))}
                    className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff]"
                  />
                </div>
              </div>

              {/* Risk select */}
              <div className="space-y-1">
                <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Mức độ rủi ro (Risk)</label>
                <select
                  value={newProject.risk}
                  onChange={(e) => setNewProject(prev => ({ ...prev, risk: e.target.value }))}
                  className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] cursor-pointer"
                >
                  <option value="LOW">LOW (Thấp)</option>
                  <option value="MEDIUM">MEDIUM (Trung bình)</option>
                  <option value="HIGH">HIGH (Cao)</option>
                </select>
              </div>

              {/* Status select */}
              <div className="space-y-1">
                <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Trạng thái triển khai</label>
                <select
                  value={newProject.status}
                  onChange={(e) => setNewProject(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] cursor-pointer"
                >
                  <option value="in_progress">Đang thi công</option>
                  <option value="completed">Đã hoàn thành</option>
                </select>
              </div>

              {/* Key Issue */}
              <div className="space-y-1">
                <label className="text-[#6b7d9b] font-bold uppercase tracking-wider block">Vướng mắc chính tồn đọng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thiếu vật tư rail, Thời tiết xấu..."
                  value={newProject.issue}
                  onChange={(e) => {
                    const val = e.target.value;
                    let type = "none";
                    if (val.toLowerCase().includes("thiếu") || val.toLowerCase().includes("chậm")) type = "danger";
                    else if (val.toLowerCase().includes("thời tiết") || val.toLowerCase().includes("mưa")) type = "medium";
                    else if (val.trim() !== "" && !val.toLowerCase().includes("không")) type = "orange";
                    
                    setNewProject(prev => ({ ...prev, issue: val, issueType: type }));
                  }}
                  className="w-full bg-[#060a13] border border-[#182135] text-slate-200 px-3 py-2 rounded focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                />
              </div>

            </div>

            {/* Form Footer Action */}
            <div className="p-4 border-t border-[#182135] bg-[#0c1221] flex justify-between items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(false)}
                className="px-4 py-2 rounded hover:bg-[#141c2f] hover:text-white text-slate-400 font-semibold cursor-pointer transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`bg-[#5252ff] hover:bg-[#4141d6] text-white font-semibold px-6 py-2 rounded transition-all cursor-pointer shadow-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu dự án'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
