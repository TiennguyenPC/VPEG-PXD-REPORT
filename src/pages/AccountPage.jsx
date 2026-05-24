import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getRoleLabel, getUserInitials } from '../utils/permissions';

export default function AccountPage() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
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

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)]">
      <Sidebar activeItem="account" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="px-8 pt-6 pb-4 border-b border-[var(--border-main)]/30 bg-[var(--bg-panel)]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#5252ff]/10 text-[#7373ff]">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-strong)] tracking-tight">TÀI KHOẢN CỦA TÔI</h1>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">Quản lý thông tin và bảo mật tài khoản</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-2xl">
          {/* Profile summary */}
          <div className="glass-panel rounded-xl border border-[var(--border-main)] p-5 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 shrink-0 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-lg font-bold text-[var(--text-main)] border border-[var(--border-main)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[var(--text-strong)] truncate">{displayName}</p>
              <p className="text-xs text-[#3b82f6] font-bold mt-0.5">{roleLabel}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-[var(--text-muted)]">
                <span>Tên đăng nhập: <strong className="text-[var(--text-main)]">{user?.username || '—'}</strong></span>
                {user?.email && (
                  <span>Email: <strong className="text-[var(--text-main)]">{user.email}</strong></span>
                )}
                <span>Dự án được gán: <strong className="text-[var(--text-main)]">{projectCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Change password */}
          <div className="glass-panel rounded-xl border border-[var(--border-main)] p-6">
            <div className="flex items-center gap-2 mb-5">
              <KeyRound className="w-4 h-4 text-[#5252ff]" />
              <h2 className="text-sm font-bold text-[var(--text-strong)] uppercase tracking-wider">Đổi mật khẩu</h2>
            </div>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-slate-200 px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                    placeholder="Nhập mật khẩu đang dùng"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                    tabIndex={-1}
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-slate-200 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-slate-200 px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff] placeholder-[#4d5e7a]"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5252ff] hover:bg-[#4141d6] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-all mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {submitting ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
