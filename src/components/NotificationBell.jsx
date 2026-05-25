import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Briefcase, FolderKanban, CheckCheck, Loader2, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications, formatNotifTime, requestBrowserNotificationPermission } from '../hooks/useNotifications';

const PANEL_WIDTH = 320;
const PANEL_HEADER_H = 48;
const PANEL_MAX_BODY_H = 360;
const PANEL_GAP = 8;

function computePanelLayout(btnRect, sidebarPlacement) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = PANEL_GAP;

  let left;
  let top;
  let maxTotalH;
  let maxBodyH;

  if (sidebarPlacement) {
    left = btnRect.right + gap;
    if (left + PANEL_WIDTH > vw - gap) {
      left = btnRect.left - PANEL_WIDTH - gap;
    }
    // Chỉ chiếm không gian phía trên nút chuông — không phủ lên nội dung trang
    const spaceAbove = Math.max(0, btnRect.top - gap * 2);
    maxTotalH = Math.min(PANEL_HEADER_H + PANEL_MAX_BODY_H, spaceAbove, 300);
    maxTotalH = Math.max(PANEL_HEADER_H + 80, maxTotalH);
    maxBodyH = maxTotalH - PANEL_HEADER_H;
    top = btnRect.top - maxTotalH - gap;
  } else {
    maxTotalH = Math.min(PANEL_HEADER_H + PANEL_MAX_BODY_H, Math.floor(vh * 0.55));
    maxBodyH = maxTotalH - PANEL_HEADER_H;
    left = btnRect.right - PANEL_WIDTH;
    top = btnRect.bottom + gap;
    if (top + maxTotalH > vh - gap) {
      top = btnRect.top - maxTotalH - gap;
    }
  }

  left = Math.max(gap, Math.min(left, vw - PANEL_WIDTH - gap));
  top = Math.max(gap, Math.min(top, vh - maxTotalH - gap));

  return { top, left, maxBodyH };
}

function NotifIcon({ type }) {
  if (type === 'task_assigned') {
    return <Briefcase className="w-3.5 h-3.5 text-[#7373ff] shrink-0 mt-0.5" />;
  }
  if (type === 'project_assigned' || type === 'project_unassigned') {
    return <FolderKanban className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  }
  if (type === 'task_due_soon') {
    return <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
  }
  if (type === 'task_overdue' || type === 'risk_overdue') {
    return <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
  }
  if (type === 'project_completed') {
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
  }
  return <Bell className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />;
}

export default function NotificationBell({ compact = false, sidebarPlacement = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, unreadCount, loading, markRead, markAllRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState({ top: 0, left: 0, maxBodyH: PANEL_MAX_BODY_H });
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  const updateLayout = useCallback(() => {
    if (!btnRef.current) return;
    setLayout(computePanelLayout(btnRef.current.getBoundingClientRect(), sidebarPlacement));
  }, [sidebarPlacement]);

  useEffect(() => () => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    updateLayout();
    const handler = (e) => {
      if (btnRef.current?.contains(e.target) || panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onReflow = () => updateLayout();
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, updateLayout]);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      setLayout(computePanelLayout(btnRef.current.getBoundingClientRect(), sidebarPlacement));
      refresh();
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        requestBrowserNotificationPermission();
      }
    }
    setOpen((v) => !v);
  };

  const navigateLink = (rawLink) => {
    if (!rawLink) return;
    const link = rawLink.split('#n:')[0];
    setOpen(false);
    navigate(link);
  };

  const handleItemClick = async (item) => {
    if (!item.read) {
      try {
        await markRead(item.notifId);
      } catch {
        /* ignore */
      }
    }
    navigateLink(item.link);
  };

  const badge = unreadCount > 0 ? (unreadCount > 9 ? '9+' : String(unreadCount)) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleOpen}
        className={`relative rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors ${
          compact ? 'p-1.5' : 'p-2'
        }`}
        title="Thông báo"
      >
        <Bell className="w-4 h-4" />
        {badge && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {badge}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[9999] w-80 rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-2xl overflow-hidden flex flex-col"
          style={{ top: layout.top, left: layout.left, maxHeight: layout.maxBodyH + PANEL_HEADER_H }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-main)] bg-[var(--bg-hover)]/40 shrink-0">
            <span className="text-xs font-bold text-[var(--text-strong)] uppercase tracking-wider">Thông báo</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[10px] font-semibold text-[#7373ff] hover:text-[#5252ff] flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="overflow-y-auto min-h-0 flex-1" style={{ maxHeight: layout.maxBodyH }}>
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-[var(--text-muted)]">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-center text-xs text-[var(--text-muted)] py-10 px-4">Chưa có thông báo nào</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.notifId}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border-main)]/50 hover:bg-[var(--bg-hover)] transition-colors ${
                    !item.read ? 'bg-[#5252ff]/5' : ''
                  }`}
                >
                  <div className="flex gap-2.5">
                    <NotifIcon type={item.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-semibold leading-snug ${!item.read ? 'text-[var(--text-strong)]' : 'text-[var(--text-main)]'}`}>
                          {item.title}
                        </p>
                        {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-[#5252ff] shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{item.body}</p>
                      <p className="text-[9px] text-[var(--text-muted)]/70 mt-1">{formatNotifTime(item.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
