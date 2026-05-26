import React, { useState, useEffect } from 'react';
import { ChevronLeft, Share2, Download, Menu, Link2Off, Building2, Zap, Pencil } from 'lucide-react';
import { api } from '../../services/api';
import { useProjectCanEdit } from '../../context/ProjectEditContext';

export default function ProjectHeader({ project, onBack, onToggleSidebar, isSidebarCollapsed, shareMode = 'internal', onUpdateProject }) {
  const canEdit = useProjectCanEdit();
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', client: '', capacity: '' });
  const [saving, setSaving] = useState(false);

  const projectId = project?.PROJECT_ID || project?.id;
  const progress = Math.min(100, Math.max(0, project?.actualProgress || 0));
  const isDelayed = (project?.delay || 0) < 0;
  const progressColor = isDelayed ? 'from-red-500 to-red-400' : 'from-emerald-500 to-emerald-400';

  const startEdit = () => {
    setDraft({
      name: project?.name || '',
      client: project?.client || '',
      capacity: String(project?.capacity ?? ''),
    });
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const parseCapacity = (val) => {
    let v = String(val || '').trim();
    if (v.includes(',') && v.includes('.')) {
      v = v.replace(/\./g, '').replace(',', '.');
    } else {
      v = v.replace(',', '.');
    }
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };

  const saveEdit = async () => {
    if (!onUpdateProject || saving) return;
    setSaving(true);
    try {
      await onUpdateProject({
        name: draft.name.trim(),
        client: draft.client.trim(),
        capacity: parseCapacity(draft.capacity),
      });
      setEditing(false);
    } catch (e) {
      window.alert(e?.message || 'Không lưu được');
    } finally {
      setSaving(false);
    }
  };

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
    if (sharing) return '...';
    if (copied) return 'Đã copy';
    return shareStatus?.enabled ? 'Copy link' : 'Bật link';
  };

  const showClientShare = shareMode === 'public';

  return (
    <div className="glass-panel rounded-xl border border-[var(--border-main)] shadow-md overflow-hidden print:break-inside-avoid">
      {/* Top bar: back + actions */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-main)]/60 bg-[var(--bg-hover)]/40 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[#5252ff] transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
          Quay lại
        </button>

        <div className="flex items-center gap-1">
          {showClientShare && shareStatus !== null && (
            <span
              className={`hidden sm:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                shareStatus.enabled
                  ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10 dark:text-emerald-400'
                  : 'text-[var(--text-muted)] border-[var(--border-main)] bg-[var(--bg-panel)]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${shareStatus.enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              Link khách
            </span>
          )}

          {showClientShare && (
            <>
              <button
                type="button"
                onClick={handleShare}
                disabled={sharing}
                title={shareStatus?.enabled ? 'Copy link khách' : 'Bật & copy link khách'}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all disabled:opacity-60 ${
                  copied
                    ? 'text-emerald-600 bg-emerald-500/10'
                    : 'text-[var(--text-main)] hover:bg-[var(--bg-panel)]'
                }`}
              >
                <Share2 className="w-3 h-3 text-[#7373ff]" />
                <span className="hidden sm:inline">{shareButtonLabel()}</span>
              </button>
              {shareStatus?.enabled && (
                <button
                  type="button"
                  onClick={handleDisableShare}
                  disabled={sharing}
                  title="Tắt link chia sẻ"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-60"
                >
                  <Link2Off className="w-3 h-3" />
                  <span className="hidden sm:inline">Tắt</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            title="Export PDF"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-[var(--text-main)] hover:bg-[var(--bg-panel)] transition-all"
          >
            <Download className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Main: title + meta + progress */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="mt-0.5 shrink-0 text-[var(--text-muted)] hover:text-[var(--text-strong)] bg-[var(--bg-hover)] hover:bg-[var(--bg-panel)] p-1 rounded-md transition-all border border-[var(--border-main)] print:hidden"
            title={isSidebarCollapsed ? 'Mở sidebar' : 'Thu sidebar'}
          >
            {isSidebarCollapsed ? <Menu className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="flex-1 min-w-[160px] text-base font-bold uppercase bg-[var(--bg-main)] border border-[#5252ff]/40 rounded-md px-2 py-1 text-[var(--text-strong)] focus:outline-none focus:border-[#5252ff]"
                  placeholder="Tên dự án"
                />
              ) : (
                <h1 className="text-base sm:text-lg font-bold text-[var(--text-strong)] tracking-tight leading-snug">
                  <span className="hidden print:inline text-xs uppercase tracking-widest text-[#7373ff] mr-2">Báo cáo</span>
                  {(project.name || '').toUpperCase()}
                </h1>
              )}
              {(project.status === 'completed' || project.status === 'COMPLETED') && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
                  Hoàn thành
                </span>
              )}
              {canEdit && onUpdateProject && !editing && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="p-1.5 rounded-md border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[#5252ff] hover:border-[#5252ff]/40 transition-colors print:hidden"
                  title="Sửa thông tin dự án"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {editing && (
                <div className="flex items-center gap-1 print:hidden">
                  <button type="button" onClick={saveEdit} disabled={saving} className="px-2 py-1 text-[10px] font-bold rounded bg-[#5252ff] text-white disabled:opacity-60">
                    {saving ? '...' : 'Lưu'}
                  </button>
                  <button type="button" onClick={cancelEdit} className="px-2 py-1 text-[10px] font-bold rounded border border-[var(--border-main)] text-[var(--text-muted)]">
                    Hủy
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {editing ? (
                <>
                  <input
                    type="text"
                    value={draft.client}
                    onChange={(e) => setDraft((d) => ({ ...d, client: e.target.value }))}
                    className="flex-1 min-w-[140px] text-[11px] bg-[var(--bg-main)] border border-[var(--border-main)] rounded-md px-2 py-1 text-[var(--text-strong)] focus:outline-none focus:border-[#5252ff]"
                    placeholder="Khách hàng"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={draft.capacity}
                    onChange={(e) => {
                      let v = e.target.value.trim().replace(',', '.');
                      setDraft((d) => ({ ...d, capacity: v }));
                    }}
                    className="w-28 text-[11px] bg-[var(--bg-main)] border border-[var(--border-main)] rounded-md px-2 py-1 text-[var(--text-strong)] focus:outline-none focus:border-[#5252ff]"
                    placeholder="kWp"
                  />
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 max-w-full text-[11px] text-[var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-md px-2 py-0.5">
                    <Building2 className="w-3 h-3 shrink-0 opacity-60" />
                    <span className="truncate font-medium text-[var(--text-strong)]">{project.client}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border-main)] rounded-md px-2 py-0.5">
                    <Zap className="w-3 h-3 shrink-0 opacity-60" />
                    <span className="font-medium text-[var(--text-strong)] tabular-nums">
                      {Number(project.capacity || 0).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} kWp
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Compact progress card */}
        <div className="shrink-0 flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border-main)] bg-[var(--bg-hover)]/50 sm:min-w-[140px]">
          <div className="text-right">
            <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none">Tiến độ TT</p>
            <p className="text-xl font-black text-[var(--text-strong)] tabular-nums leading-tight mt-0.5">
              {progress}%
            </p>
          </div>
          <div className="w-16 sm:w-20 h-1.5 bg-[var(--bg-panel)] rounded-full overflow-hidden border border-[var(--border-main)]/50">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${progressColor} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
