import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, RefreshCw, ChevronDown, ChevronUp, Bell, Clock, Mail } from 'lucide-react';
import SettingsLayout from '../components/settings/SettingsLayout';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getAuditActionLabel, formatAuditTime, getAuditActionColor } from '../utils/auditLabels';

const GAS_SCRIPT_EDITOR_URL = 'https://script.google.com/home/projects/1w-CZ9Dsq2BNelMochInJ6Kt2oCOWKtwckcMl1NVdrSNZAx9bd2PFDsNY/edit';
const PRODUCTION_APP_URL = 'https://vpeg-pxd-dashboard.vercel.app';
const thCell = 'py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left';
const tdCell = 'py-3 px-4 text-xs text-[var(--text-main)] align-top';

const ACTION_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'login', label: 'Đăng nhập' },
  { value: 'logout', label: 'Đăng xuất' },
  { value: 'delete', label: 'Xóa dữ liệu' },
  { value: 'task', label: 'Task' },
  { value: 'project', label: 'Dự án' },
  { value: 'user', label: 'Tài khoản' },
  { value: 'site', label: 'Site log / ảnh' },
];

function DetailRow({ log }) {
  const [open, setOpen] = useState(false);
  if (!log.details) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(log.details);
  } catch {
    parsed = null;
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] text-[#5252ff] hover:underline flex items-center gap-0.5"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Chi tiết
      </button>
      {open && (
        <pre className="mt-1 p-2 rounded bg-[var(--bg-main)] border border-[var(--border-main)] text-[10px] text-[var(--text-muted)] overflow-x-auto max-w-md whitespace-pre-wrap break-all">
          {parsed ? JSON.stringify(parsed, null, 2) : log.details}
        </pre>
      )}
    </div>
  );
}

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 100;
  const [notifBusy, setNotifBusy] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [emailCfg, setEmailCfg] = useState({ appUrl: '', enabled: false });
  const [emailUrl, setEmailUrl] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailBusy, setEmailBusy] = useState('');
  const [emailMsg, setEmailMsg] = useState('');

  const loadEmailConfig = useCallback(async () => {
    try {
      const cfg = await api.getNotificationEmailConfig();
      setEmailCfg(cfg || { appUrl: '', enabled: false });
      const fallback = window.location.hostname === 'localhost'
        ? PRODUCTION_APP_URL
        : window.location.origin;
      setEmailUrl(cfg?.appUrl || fallback);
      setEmailEnabled(!!cfg?.enabled);
    } catch {
      setEmailUrl(window.location.hostname === 'localhost' ? PRODUCTION_APP_URL : window.location.origin);
    }
  }, []);

  useEffect(() => {
    loadEmailConfig();
  }, [loadEmailConfig]);

  const loadLogs = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs({
        limit,
        offset: off,
        actionFilter: actionFilter || undefined,
      });
      setLogs(data?.logs || []);
      setTotal(data?.total || 0);
      setOffset(off);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    loadLogs(0);
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        (l.displayName || '').toLowerCase().includes(q) ||
        (l.username || '').toLowerCase().includes(q) ||
        (l.summary || '').toLowerCase().includes(q) ||
        (l.projectId || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q)
    );
  }, [logs, search]);

  const handleSetupNotifTrigger = async () => {
    setNotifBusy('setup');
    setNotifMsg('');
    try {
      const res = await api.setupNotificationTrigger();
      setNotifMsg(res?.message || 'Đã cài trigger thông báo 8:00 sáng (ICT)');
    } catch (e) {
      setNotifMsg(e.message || 'Lỗi cài trigger');
    } finally {
      setNotifBusy('');
    }
  };

  const handleRunDailyNotifs = async () => {
    setNotifBusy('run');
    setNotifMsg('');
    try {
      const res = await api.runDailyNotificationChecks();
      setNotifMsg(`Đã quét deadline & dự án hoàn thành (${res?.ranAt ? new Date(res.ranAt).toLocaleString('vi-VN') : 'OK'})`);
    } catch (e) {
      setNotifMsg(e.message || 'Lỗi chạy kiểm tra');
    } finally {
      setNotifBusy('');
    }
  };

  const handleSaveEmailConfig = async () => {
    setEmailBusy('save');
    setEmailMsg('');
    try {
      const cfg = await api.updateNotificationEmailConfig({
        appUrl: emailUrl.trim(),
        enabled: emailEnabled,
      });
      setEmailCfg(cfg || { appUrl: emailUrl, enabled: emailEnabled });
      setEmailMsg(emailEnabled ? 'Đã bật gửi email thông báo' : 'Đã lưu — email đang tắt');
    } catch (e) {
      setEmailMsg(e.message || 'Lỗi lưu cấu hình email');
    } finally {
      setEmailBusy('');
    }
  };

  const handleTestEmail = async () => {
    if (!emailUrl.trim()) {
      setEmailMsg('Nhập URL dashboard trước');
      return;
    }
    if (!emailEnabled) {
      setEmailMsg('Bật checkbox "Bật gửi email" trước');
      return;
    }
    setEmailBusy('test');
    setEmailMsg('');
    const inbox = user?.email || 'hộp thư @vuphong.com của bạn';
    try {
      await api.updateNotificationEmailConfig({
        appUrl: emailUrl.trim(),
        enabled: true,
      });
      setEmailCfg({ appUrl: emailUrl.trim(), enabled: true });
      try {
        await api.authorizeMailApp();
      } catch (authErr) {
        setEmailMsg(authErr.message || 'Chưa cấp quyền MailApp — thử lại sau khi deploy @83');
        return;
      }
      const res = await api.sendTestNotificationEmail();
      setEmailMsg(res?.message ? `${res.message} — kiểm tra ${inbox} (cả Spam)` : `Đã gửi — kiểm tra ${inbox}`);
    } catch (e) {
      setEmailMsg(e.message || 'Lỗi gửi email thử');
    } finally {
      setEmailBusy('');
    }
  };

  const emailDirty = emailEnabled !== !!emailCfg.enabled || emailUrl.trim() !== (emailCfg.appUrl || '');

  return (
    <SettingsLayout
      title="Nhật ký hoạt động"
      subtitle="Theo dõi ai đăng nhập, sửa hoặc xóa dữ liệu"
      headerAction={
        <button
          type="button"
          onClick={() => loadLogs(offset)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[var(--text-strong)] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7373ff]" />
              Thông báo chuông (Admin)
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Trigger hàng ngày 8:00 — task sắp hạn, quá hạn, dự án hoàn thành
            </p>
            {notifMsg && <p className="text-[11px] text-emerald-500 mt-2">{notifMsg}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!notifBusy}
              onClick={handleSetupNotifTrigger}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              {notifBusy === 'setup' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
              Cài trigger 8h
            </button>
            <button
              type="button"
              disabled={!!notifBusy}
              onClick={handleRunDailyNotifs}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#5252ff]/15 text-[#7373ff] border border-[#5252ff]/30 rounded-lg hover:bg-[#5252ff]/25 disabled:opacity-50"
            >
              {notifBusy === 'run' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Chạy kiểm tra ngay
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-4 space-y-3 relative z-0">
          <div>
            <p className="text-xs font-bold text-[var(--text-strong)] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#7373ff]" />
              Email thông báo
            </p>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">
              Email gửi tới hộp thư <strong className="text-[var(--text-main)]">@vuphong.com</strong> (không hiện trong app).
              Song song với chuông: task giao, deadline, dự án hoàn thành…
            </p>
            {user?.email && (
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Email thử sẽ gửi tới: <strong className="text-[#7373ff]">{user.email}</strong>
              </p>
            )}
            {emailCfg.enabled && !emailDirty && (
              <p className="text-[11px] text-emerald-500 mt-1">Đang bật · {emailCfg.appUrl || '—'}</p>
            )}
            {emailDirty && (
              <p className="text-[11px] text-amber-400 mt-1">Chưa lưu — bấm &quot;Lưu cấu hình&quot; hoặc &quot;Gửi email thử&quot; (tự lưu trước khi gửi)</p>
            )}
            {emailMsg && (
              <p className={`text-[11px] mt-2 ${emailMsg.includes('Lỗi') || emailMsg.includes('lỗi') || emailMsg.includes('Nhập') || emailMsg.includes('Bật') || emailMsg.includes('quyền') || emailMsg.includes('Permission') ? 'text-red-400' : 'text-emerald-500'}`}>
                {emailMsg}
                {(emailMsg.includes('quyền') || emailMsg.includes('Permission') || emailMsg.includes('MailApp') || emailMsg.includes('GmailApp')) && (
                  <>
                    {' '}
                    <a href={GAS_SCRIPT_EDITOR_URL} target="_blank" rel="noreferrer" className="underline text-[#7373ff]">
                      Mở Apps Script → chọn authorizeMailApp → Run → Allow
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">URL dashboard</span>
              <input
                type="url"
                value={emailUrl}
                onChange={(e) => setEmailUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full px-3 py-2 text-sm bg-[var(--bg-main)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[#5252ff]"
              />
            </label>
            <label className="flex items-center gap-2 shrink-0 pb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={(e) => setEmailEnabled(e.target.checked)}
                className="rounded border-[var(--border-main)]"
              />
              <span className="text-xs font-semibold text-[var(--text-main)]">Bật gửi email</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!!emailBusy}
              onClick={handleSaveEmailConfig}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#5252ff]/15 text-[#7373ff] border border-[#5252ff]/30 rounded-lg hover:bg-[#5252ff]/25 disabled:opacity-50"
            >
              {emailBusy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Lưu cấu hình
            </button>
            <button
              type="button"
              disabled={!!emailBusy || !emailEnabled}
              onClick={handleTestEmail}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[var(--border-main)] rounded-lg hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              {emailBusy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              Gửi email thử
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, dự án, mô tả..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[#5252ff]"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[#5252ff]"
          >
            {ACTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Đang tải nhật ký...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--border-main)]">
                  <tr>
                    <th className={thCell}>Thời gian</th>
                    <th className={thCell}>Người thực hiện</th>
                    <th className={thCell}>Hành động</th>
                    <th className={thCell}>Mô tả</th>
                    <th className={thCell}>Dự án</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.logId}
                      className="border-b border-[var(--border-main)]/40 hover:bg-[var(--bg-hover)]/40"
                    >
                      <td className={`${tdCell} whitespace-nowrap text-[var(--text-muted)] font-mono text-[11px]`}>
                        {formatAuditTime(log.timestamp)}
                      </td>
                      <td className={tdCell}>
                        <div className="font-medium">{log.displayName || '—'}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">@{log.username || '?'}</div>
                      </td>
                      <td className={tdCell}>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${getAuditActionColor(log.action)}`}>
                          {getAuditActionLabel(log.action)}
                        </span>
                      </td>
                      <td className={tdCell}>
                        <div>{log.summary}</div>
                        <DetailRow log={log} />
                      </td>
                      <td className={`${tdCell} text-[var(--text-muted)]`}>
                        {log.projectId || '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-[var(--text-muted)]">
                        Chưa có nhật ký hoạt động
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
          <span>
            Hiển thị {filteredLogs.length} / {total} bản ghi gần nhất
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={offset <= 0 || loading}
              onClick={() => loadLogs(Math.max(0, offset - limit))}
              className="px-3 py-1.5 rounded border border-[var(--border-main)] disabled:opacity-40 hover:bg-[var(--bg-hover)]"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={offset + limit >= total || loading}
              onClick={() => loadLogs(offset + limit)}
              className="px-3 py-1.5 rounded border border-[var(--border-main)] disabled:opacity-40 hover:bg-[var(--bg-hover)]"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
