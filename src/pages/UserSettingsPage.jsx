import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Pencil, UserX, Loader2, Users, LockOpen, Lock, Trash2 } from 'lucide-react';
import SettingsLayout from '../components/settings/SettingsLayout';
import UserFormModal from '../components/settings/UserFormModal';
import { api } from '../services/api';
import { getRoleLabel } from '../utils/permissions';

const thCell = 'py-3 px-4 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider text-left';
const tdCell = 'py-3 px-4 text-xs text-[var(--text-main)] align-middle';

export default function UserSettingsPage() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, empData, projData] = await Promise.all([
        api.getUsers(),
        api.getEmployees(true).catch(() => []),
        api.getProjects(true).catch(() => []),
      ]);
      setUsers(userData || []);
      setEmployees(empData || []);
      setProjects(projData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        getRoleLabel(u.role).toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleOpenCreate = () => {
    setEditUser(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    if (user.role === 'admin') return;
    setEditUser(user);
    setModalOpen(true);
  };

  const handleSaved = async (payload, isEdit) => {
    if (isEdit) {
      await api.updateUser(payload);
    } else {
      await api.createUser(payload);
    }
    await loadData();
  };

  const handleDeactivate = async (user) => {
    if (user.role === 'admin') return;
    if (!window.confirm(`Vô hiệu hóa tài khoản "${user.displayName}" (${user.username})?`)) return;
    setActionLoading(user.userId);
    try {
      await api.deactivateUser(user.userId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (user) => {
    setActionLoading(user.userId);
    try {
      await api.updateUser({ userId: user.userId, active: true });
      await loadData();
    } catch (err) {
      alert(err.message || 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlock = async (user) => {
    if (!window.confirm(`Mở khóa tài khoản "${user.displayName}" (${user.username})?`)) return;
    setActionLoading(user.userId);
    try {
      await api.unlockUser(user.userId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Mở khóa thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLock = async (user) => {
    if (!window.confirm(`Tạm khóa tài khoản "${user.displayName}" (${user.username})?\n\nUser sẽ không đăng nhập được cho đến khi admin mở khóa.`)) return;
    setActionLoading(user.userId);
    try {
      await api.lockUser(user.userId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Khóa tài khoản thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản "${user.displayName}" (${user.username})?\n\nHành động này không thể hoàn tác.`)) return;
    setActionLoading(user.userId);
    try {
      await api.deleteUser(user.userId);
      await loadData();
    } catch (err) {
      alert(err.message || 'Xóa tài khoản thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <SettingsLayout
      title="Quản lý tài khoản"
      subtitle="Tạo và phân quyền nhân viên"
      headerAction={
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5252ff] hover:bg-[#4343ee] text-white text-sm font-semibold rounded-lg transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Tạo user mới
        </button>
      }
    >
      <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, username..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg focus:outline-none focus:border-[#5252ff]"
            />
          </div>

          <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-panel)] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Đang tải...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--border-main)]">
                    <tr>
                      <th className={thCell}>Họ tên</th>
                      <th className={thCell}>Email</th>
                      <th className={thCell}>Username</th>
                      <th className={thCell}>Role</th>
                      <th className={thCell}>Dự án gán</th>
                      <th className={thCell}>Trạng thái</th>
                      <th className={`${thCell} text-right`}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isAdminUser = user.role === 'admin';
                      const projectCount = user.role === 'admin'
                        ? 'Tất cả'
                        : (user.assignedProjects?.length || 0);
                      return (
                        <tr
                          key={user.userId}
                          className="border-b border-[var(--border-main)]/40 hover:bg-[var(--bg-hover)]/50 transition-colors"
                        >
                          <td className={tdCell}>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[10px] font-bold border border-[var(--border-main)]">
                                <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              </div>
                              <span className="font-medium">{user.displayName}</span>
                            </div>
                          </td>
                          <td className={`${tdCell} text-[var(--text-muted)]`}>{user.email}</td>
                          <td className={tdCell}>{user.username}</td>
                          <td className={tdCell}>
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#5252ff]/10 text-[#7373ff]">
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className={tdCell}>
                            {typeof projectCount === 'number' ? `${projectCount} dự án` : projectCount}
                          </td>
                          <td className={tdCell}>
                            {user.locked ? (
                              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400">
                                Bị khóa
                              </span>
                            ) : (
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  user.active !== false
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-red-500/10 text-red-400'
                                }`}
                              >
                                {user.active !== false ? 'Hoạt động' : 'Vô hiệu'}
                              </span>
                            )}
                          </td>
                          <td className={`${tdCell} text-right`}>
                            <div className="flex items-center justify-end gap-1">
                              {!isAdminUser && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEdit(user)}
                                    disabled={actionLoading === user.userId}
                                    className="p-2 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[#5252ff] disabled:opacity-50"
                                    title="Sửa"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  {user.locked ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUnlock(user)}
                                      disabled={actionLoading === user.userId}
                                      className="p-2 rounded hover:bg-[var(--bg-hover)] text-amber-400 hover:text-amber-300 disabled:opacity-50"
                                      title="Mở khóa"
                                    >
                                      {actionLoading === user.userId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <LockOpen className="w-4 h-4" />
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleLock(user)}
                                      disabled={actionLoading === user.userId}
                                      className="p-2 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-amber-400 disabled:opacity-50"
                                      title="Tạm khóa"
                                    >
                                      {actionLoading === user.userId ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Lock className="w-4 h-4" />
                                      )}
                                    </button>
                                  )}
                                  {user.active !== false ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeactivate(user)}
                                      disabled={actionLoading === user.userId}
                                      className="p-2 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-orange-400 disabled:opacity-50"
                                      title="Vô hiệu hóa"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleReactivate(user)}
                                      disabled={actionLoading === user.userId}
                                      className="px-2 py-1 text-[10px] font-bold rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                                    >
                                      Bật lại
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(user)}
                                    disabled={actionLoading === user.userId}
                                    className="p-2 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-red-400 disabled:opacity-50"
                                    title="Xóa tài khoản"
                                  >
                                    {actionLoading === user.userId ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </>
                              )}
                              {isAdminUser && (
                                <span className="text-[10px] text-[var(--text-muted)] px-2">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-sm text-[var(--text-muted)]">
                          Không có tài khoản nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-[10px] text-[var(--text-muted)]">
            {filteredUsers.length} tài khoản · Tạm khóa / Vô hiệu / Xóa tại cột Thao tác · Sai mật khẩu 3 lần tự khóa
          </p>
      </div>

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editUser={editUser}
        employees={employees}
        projects={projects}
      />
    </SettingsLayout>
  );
}
