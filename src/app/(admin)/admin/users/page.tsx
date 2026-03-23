"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Unlock, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface UserRow {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  createdAt: string;
  failedLogins: number;
  lockedUntil: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ROLE_MAP: Record<string, string> = {
  ADMIN: "Quản trị",
  VENDOR: "Nhà cung cấp",
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên",
  DELIVERY: "Giao hàng",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700",
  VENDOR: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-green-100 text-green-700",
  STAFF: "bg-purple-100 text-purple-700",
  DELIVERY: "bg-orange-100 text-orange-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
    });
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);

    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(id: string, newRole: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success("Đã cập nhật vai trò.");
      fetchUsers();
    } else {
      const data = await res.json();
      toast.error(data.error);
    }
  }

  async function handleUnlock(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unlock: true }),
    });
    if (res.ok) {
      toast.success("Đã mở khóa tài khoản.");
      fetchUsers();
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`Xóa người dùng ${email}?`)) return;
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success(data.message);
      fetchUsers();
    } else {
      toast.error(data.error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Quản lý người dùng
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo email hoặc tên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition"
          />
        </div>
        <select
          title="Lọc theo vai trò"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        >
          <option value="">Tất cả vai trò</option>
          {Object.entries(ROLE_MAP).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400">
            Không tìm thấy người dùng nào.
          </div>
        ) : (
          <>
          <div className="md:hidden divide-y divide-slate-100">
            {users.map((u) => {
              const isLocked =
                u.lockedUntil && new Date(u.lockedUntil) > new Date();
              return (
                <div key={u.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{u.fullName}</p>
                      <p className="text-sm text-slate-500 mt-1 break-all">{u.email}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"}`}>
                      {ROLE_MAP[u.role] || u.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className={`text-xs font-medium ${isLocked ? "text-red-600" : "text-green-600"}`}>
                      {isLocked ? "Đã khóa" : "Hoạt động"}
                    </span>
                    <select
                      title="Đổi vai trò người dùng"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="text-xs rounded-lg border border-slate-200 px-2 py-1"
                    >
                      {Object.entries(ROLE_MAP).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {isLocked && (
                      <button
                        onClick={() => handleUnlock(u.id)}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="Mở khóa"
                      >
                        <Unlock className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(u.id, u.email)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left">
                  <th className="px-4 py-3 font-medium">Họ tên</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isLocked =
                    u.lockedUntil && new Date(u.lockedUntil) > new Date();
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {u.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <select
                          title="Đổi vai trò người dùng"
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value)
                          }
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 ${
                            ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {Object.entries(ROLE_MAP).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {isLocked ? (
                          <span className="text-xs text-red-600 font-medium">
                            🔒 Đã khóa
                          </span>
                        ) : (
                          <span className="text-xs text-green-600">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {isLocked && (
                            <button
                              onClick={() => handleUnlock(u.id)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                              title="Mở khóa"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(u.id, u.email)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total}{" "}
              người dùng)
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
