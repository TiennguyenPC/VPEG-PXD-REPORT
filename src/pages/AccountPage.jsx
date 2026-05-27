import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  User,
  Mail,
  FolderKanban,
  Shield,
  LogOut,
  Palette,
  BookOpen,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ThemeModePicker from '../components/ThemeModePicker';
import { useSidebar } from '../hooks/useSidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getRoleLabel, getUserInitials } from '../utils/permissions';

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[var(--border-main)]/50 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-[var(--text-muted)] font-medium">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-strong)] truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange, show, onToggleShow, placeholder, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3.5 py-2.5 pr-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5252ff]/25 focus:border-[#5252ff] placeholder:text-[var(--text-muted)]/60 transition-shadow"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)] overflow-hidden shadow-lg shadow-black/5">
      <div className="px-6 py-4 border-b border-[var(--border-main)]/50 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-[#5252ff]/10 text-[#7373ff] shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--text-strong)]">{title}</h2>
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

export default function AccountPage() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const displayName = user?.displayName || '—';
  const roleLabel = getRoleLabel(user?.role);
  const initials = getUserInitials(displayName);
  const projectCount = user?.assignedProjects?.length || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.changePassword({ currentPassword, newPassword });
      setSuccess(result.message || 'Đã đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Không thể đổi mật khẩu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)]">
      <Sidebar activeItem="account" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="flex-1 min-w-0 overflow-y-auto pb-mobile-nav">
        <header className="sticky top-0 z-20 bg-[var(--bg-panel)]/95 backdrop-blur border-b border-[var(--border-main)] px-4 md:px-6 py-3 md:py-4 max-md:mobile-header-offset">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5252ff]/10 text-[#7373ff]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-strong)]">Tài khoản của tôi</h1>
              <p className="text-xs text-[var(--text-muted)]">Quản lý thông tin cá nhân và bảo mật</p>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 max-md:pb-8 mobile-content-compact">
          {/* Hướng dẫn vận hành — mobile (sidebar ẩn) */}
          <a
            href="/huong-dan"
            className="md:hidden flex items-center gap-4 p-4 rounded-2xl border border-[#5252ff]/30 bg-[#5252ff]/5 hover:bg-[#5252ff]/10 transition-colors"
          >
            <div className="p-2.5 rounded-xl bg-[#5252ff]/15 text-[#7373ff] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text-strong)]">Hướng dẫn vận hành</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Đọc tài liệu A–Z: dự án, nhật ký, task, phân quyền…</p>
            </div>
          </a>

          {/* Profile hero */}
          <div className="rounded-2xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)] overflow-hidden shadow-lg shadow-black/5">
            <div className="h-28 bg-gradient-to-r from-[#5252ff]/25 via-[#3b82f6]/15 to-transparent" />
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
                <div className="w-20 h-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#5252ff] to-[#6366f1] flex items-center justify-center text-2xl font-bold text-white shadow-xl ring-4 ring-[var(--bg-panel)]">
                  {initials}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--text-strong)] truncate">{displayName}</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#5252ff]/10 text-[#7373ff] border border-[#5252ff]/20">
                      <Shield className="w-3 h-3" />
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account info */}
            <SectionCard
              title="Thông tin tài khoản"
              description="Thông tin cơ bản của bạn trên hệ thống"
              icon={User}
            >
              <InfoRow icon={Mail} label="Email" value={user?.email || 'Chưa cập nhật'} />
              <InfoRow
                icon={FolderKanban}
                label="Dự án được gán"
                value={`${projectCount} dự án`}
              />
            </SectionCard>

            {/* Change password */}
            <SectionCard
              title="Bảo mật"
              description="Cập nhật mật khẩu để bảo vệ tài khoản"
              icon={KeyRound}
            >
              {error && (
                <div className="mb-4 mt-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 mt-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <PasswordInput
                  label="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  show={showCurrent}
                  onToggleShow={() => setShowCurrent((v) => !v)}
                  placeholder="Nhập mật khẩu đang dùng"
                  autoComplete="current-password"
                />
                <PasswordInput
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  show={showNew}
                  onToggleShow={() => setShowNew((v) => !v)}
                  placeholder="Tối thiểu 6 ký tự"
                  autoComplete="new-password"
                />
                <PasswordInput
                  label="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  show={showConfirm}
                  onToggleShow={() => setShowConfirm((v) => !v)}
                  placeholder="Nhập lại mật khẩu mới"
                  autoComplete="new-password"
                />

                <div className="pt-2 pb-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 bg-[#5252ff] hover:bg-[#4343ee] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    {submitting ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </form>
            </SectionCard>
          </div>

          <SectionCard
            title="Giao diện & phiên đăng nhập"
            description="Chế độ sáng/tối và đăng xuất khỏi hệ thống"
            icon={Palette}
          >
            <ThemeModePicker />
            <button
              type="button"
              onClick={handleLogout}
              className="w-full mt-2 mb-2 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/45 transition-colors text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
