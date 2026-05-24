import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Download, Menu, Link2Off } from 'lucide-react';
import { api } from '../../services/api';

export default function ProjectHeader({ project, onBack, onToggleSidebar, isSidebarCollapsed, shareMode = 'internal' }) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);

  const projectId = project?.PROJECT_ID || project?.id;

  useEffect(() => {
    if (shareMode !== 'public' || !projectId) return;
    let cancelled = false;
    (async () => {
      try {
        const status = await api.getProjectShareStatus(projectId);
        if (!cancelled) setShareStatus(status);
      } catch {
        if (!cancelled) setShareStatus({ enabled: false, token: '' });
      }
    })();
    return () => { cancelled = true; };
  }, [shareMode, projectId]);

  const buildShareUrl = (token) => `${window.location.origin}/share/${token}`;

  const handleShare = async () => {
    if (shareMode === 'public') {
      try {
        setSharing(true);
        let token = shareStatus?.token;
        if (!shareStatus?.enabled || !token) {
          const data = await api.enableProjectShare(projectId);
          token = data?.token;
          setShareStatus({ projectId, enabled: true, token });
        }
        if (!token) throw new Error('Không nhận được token chia sẻ');
        await navigator.clipboard.writeText(buildShareUrl(token));
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (e) {
        window.alert(e.message || 'Không tạo được link chia sẻ');
      } finally {
        setSharing(false);
      }
      return;
    }
  };

  const handleDisableShare = async () => {
    if (!window.confirm('Tắt link chia sẻ khách? Khách sẽ không truy cập được link hiện tại.')) return;
    try {
      setSharing(true);
      await api.disableProjectShare(projectId);
      setShareStatus((prev) => ({ ...prev, enabled: false }));
    } catch (e) {
      window.alert(e.message || 'Không tắt được link chia sẻ');
    } finally {
      setSharing(false);
    }
  };

  const shareButtonLabel = () => {
    if (sharing) return 'Đang xử lý...';
    if (copied) return 'Đã copy link!';
    return shareStatus?.enabled ? 'Copy link khách' : 'Bật & copy link';
  };

  const showClientShare = shareMode === 'public';

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0b0f19] p-6 rounded-xl border border-[#182135] shadow-lg relative overflow-hidden group print:break-inside-avoid">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#5252ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#5252ff]/10 transition-all duration-500 pointer-events-none print:hidden"></div>
      
      <div className="flex flex-col gap-3 relative z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#6b7d9b] hover:text-[#5252ff] transition-colors w-fit print:pointer-events-none print:text-[#7373ff]"
        >
          <ChevronLeft className="w-3.5 h-3.5 print:hidden" />
          <span className="font-semibold uppercase tracking-wider print:hidden">Quay lại tổng quan</span>
          <span className="font-bold uppercase tracking-widest hidden print:block text-sm">BÁO CÁO DỰ ÁN</span>
        </button>
        
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <button 
              onClick={onToggleSidebar} 
              className="text-slate-400 hover:text-white bg-[#141c2f] hover:bg-[#1a243a] p-1.5 rounded-lg transition-all border border-[#263554] print:hidden shrink-0"
              title={isSidebarCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
            >
              {isSidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            DỰ ÁN ĐIỆN MẶT TRỜI {(project.name || "").toUpperCase()}
            {(project.status === 'completed' || project.status === 'COMPLETED') && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Đã hoàn thành
              </span>
            )}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#8ca0c3] font-medium">
            <span className="flex items-center gap-1.5">
              Khách hàng: <span className="text-white font-semibold">{project.client}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-[#182135]"></span>
            <span className="flex items-center gap-1.5">
              Công suất: <span className="text-white font-semibold">{Number(project.capacity || 0).toLocaleString()} kWp</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 relative z-10 w-full md:w-auto mt-4 md:mt-0">
        <div className="flex items-center gap-2 w-full md:w-auto justify-end print:hidden">
          {showClientShare && shareStatus !== null && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
              shareStatus.enabled
                ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                : 'text-slate-400 border-slate-600/40 bg-slate-800/40'
            }`}>
              {shareStatus.enabled ? 'Link khách: đang bật' : 'Link khách: đã tắt'}
            </span>
          )}
          {showClientShare && (
            <>
              <button 
                type="button"
                onClick={handleShare}
                disabled={sharing}
                className={`flex items-center gap-2 bg-[#141c2f] hover:bg-[#1a243a] border border-[#263554] px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 ${copied ? 'text-[#10b981] border-[#10b981]/50' : 'text-slate-200'}`}
              >
                <Share2 className={`w-3.5 h-3.5 ${copied ? 'text-[#10b981]' : 'text-[#7373ff]'}`} />
                {shareButtonLabel()}
              </button>
              {shareStatus?.enabled && (
                <button
                  type="button"
                  onClick={handleDisableShare}
                  disabled={sharing}
                  className="flex items-center gap-2 bg-[#141c2f] hover:bg-red-950/40 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
                  title="Tắt link chia sẻ công khai"
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  Tắt link
                </button>
              )}
            </>
          )}
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#141c2f] hover:bg-[#1a243a] border border-[#263554] text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#10b981]" />
            Export
          </button>
        </div>
        
        <div className="text-right w-full md:w-auto">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-1">Tiến độ thực tế tổng thể</p>
          <div className="flex items-end justify-end gap-3">
            <span className="text-4xl font-black text-white leading-none tracking-tighter">
              {project.actualProgress || 0}%
            </span>
          </div>
          <div className="w-full md:w-48 h-1.5 bg-[#182135] rounded-full mt-3 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 relative ${
                (project.delay || 0) < 0 ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-emerald-500 to-emerald-400"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, project.actualProgress || 0))}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
