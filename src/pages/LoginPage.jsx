import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VuPhongLogo from '../components/VuPhongLogo';
import {
  readRememberedLogin,
  saveRememberedLogin,
  clearRememberedLogin,
} from '../utils/loginCredentials';

const savedLogin = readRememberedLogin();

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [username, setUsername] = useState(savedLogin?.username ?? '');
  const [password, setPassword] = useState(savedLogin?.password ?? '');
  const [rememberMe, setRememberMe] = useState(Boolean(savedLogin));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const trimmedUsername = username.trim();
      await login(trimmedUsername, password);
      if (rememberMe) {
        saveRememberedLogin(trimmedUsername, password);
      } else {
        clearRememberedLogin();
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] px-4 pb-mobile-nav">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-5">
            <VuPhongLogo responsive />
          </div>
          <p className="text-sm text-[var(--text-muted)]">Đăng nhập để truy cập dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-6 shadow-xl space-y-5"
        >
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Input ẩn chặn trình duyệt tự điền username cũ */}
          <input type="text" name="fake_user" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />

          <div>
            <input
              type="text"
              name="vuphong_login_id"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-[#5252ff] transition-colors placeholder:text-[var(--text-muted)]/50"
              placeholder="Tên đăng nhập"
              required
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="vuphong_login_secret"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--bg-main)] border border-[var(--border-main)] text-[var(--text-main)] px-3 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:border-[#5252ff] transition-colors placeholder:text-[var(--text-muted)]/50"
                placeholder="Mật khẩu"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[var(--border-main)] accent-[#5252ff]"
            />
            <span className="text-xs text-[var(--text-muted)]">Ghi nhớ đăng nhập</span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-[#5252ff] hover:bg-[#4343ee] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-6">
          Chỉ dành cho nhân viên @vuphong.com
        </p>
      </div>
    </div>
  );
}
