import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Activity, Briefcase, Folder, ChevronLeft
} from "lucide-react";
import ProjectHeader from "../components/project-details/ProjectHeader";
import KPIOverview from "../components/project-details/KPIOverview";
import MilestoneTimeline from "../components/project-details/MilestoneTimeline";
import SCurveChart from "../components/project-details/SCurveChart";
import SiteLogPanel from "../components/project-details/SiteLogPanel";
import WeeklyKPI from "../components/project-details/WeeklyKPI";
import RiskModule from "../components/project-details/modules/RiskModule";
import PermitModule from "../components/project-details/modules/PermitModule";
import DesignModule from "../components/project-details/modules/DesignModule";
import ProcurementModule from "../components/project-details/modules/ProcurementModule";
import ConstructionModule from "../components/project-details/modules/ConstructionModule";
import { api } from "../services/api";

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProject(id);
        if (data) {
          setProject(data);
        }
      } catch (error) {
        console.error("Failed to fetch project detail:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (isLoading || !project) {
    return (
      <div className="min-h-screen flex bg-[#060a13] text-slate-100 font-sans relative">
        <div className="absolute inset-0 z-50 bg-[#060a13]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin"></div>
            <span className="text-white font-medium text-sm tracking-wide">Đang tải chi tiết dự án...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#060a13] text-slate-100 font-sans">
      
      {/* LEFT SIDEBAR (Duplicated from App.jsx as requested) */}
      <aside className="w-64 border-r border-[#182135] bg-[#070b14] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto hidden md:flex">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-[#182135]/40 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-[#5252ff] to-[#8080ff] shadow-[0_0_12px_rgba(82,82,255,0.7)]"></div>
            <span className="text-sm font-bold tracking-wider text-white">VPEG-PXD-REPORT</span>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#6b7d9b] hover:text-white hover:bg-[#141c2f]/50 transition-all text-xs font-medium"
            >
              <Activity className="w-4 h-4 text-[#6b7d9b]" />
              <span>TỔNG QUAN</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#6b7d9b] hover:text-white hover:bg-[#141c2f]/50 transition-all text-xs font-medium"
            >
              <Briefcase className="w-4 h-4 text-[#6b7d9b]" />
              <span>DANH SÁCH CÔNG VIỆC</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5252ff]/10 text-[#7373ff] border-l-2 border-[#5252ff] shadow-[0_0_15px_rgba(82,82,255,0.08)] transition-all text-xs font-semibold"
            >
              <Folder className="w-4 h-4 text-[#5252ff]" />
              <span>CHI TIẾT DỰ ÁN</span>
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
        <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
          
          {/* SECTION 1 - HEADER */}
          <ProjectHeader project={project} onBack={() => navigate('/')} />
          
          {/* SECTION 2 - KPI OVERVIEW */}
          <KPIOverview project={project} />
          
          {/* SECTION 3 - MILESTONE TIMELINE */}
          <MilestoneTimeline project={project} />
          
          {/* SECTION 4 & 5 - S-CURVE & SITE LOG */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SCurveChart project={project} />
            </div>
            <div className="flex flex-col gap-6">
              <SiteLogPanel project={project} />
              <WeeklyKPI project={project} />
            </div>
          </div>
          
          {/* SECTION 7 - MAIN ACCORDION MODULES */}
          <div className="space-y-4 pt-4">
            <RiskModule project={project} />
            <PermitModule project={project} />
            <DesignModule project={project} />
            <ProcurementModule project={project} />
            <ConstructionModule project={project} />
          </div>
          
        </div>
      </main>
    </div>
  );
}
