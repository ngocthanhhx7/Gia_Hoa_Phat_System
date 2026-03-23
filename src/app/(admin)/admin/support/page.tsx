"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";

type UserOption = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  updatedAt: string;
  user: { fullName: string | null; email: string };
  assignee?: { id: string; fullName: string | null; email: string } | null;
  replies: { id: string }[];
};

const statuses = ["", "OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [staffUsers, setStaffUsers] = useState<UserOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { status: string; assignedToId: string }>>({});

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/support/tickets?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tải ticket hỗ trợ");
        return;
      }
      const nextTickets = data.tickets || [];
      setTickets(nextTickets);
      setDrafts((current) => {
        const next = { ...current };
        for (const ticket of nextTickets) {
          next[ticket.id] = {
            status: ticket.status,
            assignedToId: ticket.assignee?.id || "",
          };
        }
        return next;
      });
    } catch {
      toast.error("Không thể tải ticket hỗ trợ");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadStaff = useCallback(async () => {
    const res = await fetch("/api/admin/users?limit=100");
    const data = await res.json();
    if (res.ok) {
      setStaffUsers((data.users || []).filter((user: UserOption) => ["ADMIN", "STAFF"].includes(user.role)));
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  async function saveTicket(ticketId: string) {
    const draft = drafts[ticketId];
    if (!draft) return;
    setSavingId(ticketId);
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: draft.status,
          assignedToId: draft.assignedToId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể cập nhật ticket");
        return;
      }
      toast.success("Đã cập nhật ticket");
      await loadTickets();
    } catch {
      toast.error("Không thể cập nhật ticket");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý hỗ trợ</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi ticket, phân công staff và cập nhật trạng thái xử lý.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative min-w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo subject hoặc mã ticket"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          >
            {statuses.map((status) => (
              <option key={status || "all"} value={status}>
                {status || "Tất cả trạng thái"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">Không có ticket phù hợp.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="grid gap-4 px-6 py-5 xl:grid-cols-[1.3fr_0.9fr_0.9fr_auto] xl:items-start">
                <div>
                  <Link href={`/admin/support/${ticket.id}`} className="text-lg font-semibold text-slate-800 hover:text-amber-700">
                    {ticket.subject}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {ticket.user.fullName || ticket.user.email} • {ticket.category} • {ticket.replies.length} phản hồi
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Cập nhật {new Date(ticket.updatedAt).toLocaleString("vi-VN")}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Trạng thái</label>
                  <select
                    value={drafts[ticket.id]?.status || ticket.status}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [ticket.id]: {
                          ...current[ticket.id],
                          status: event.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {statuses.filter(Boolean).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">Phân công</label>
                  <select
                    value={drafts[ticket.id]?.assignedToId || ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [ticket.id]: {
                          ...current[ticket.id],
                          assignedToId: event.target.value,
                        },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Chưa phân công</option>
                    {staffUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} - {user.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 xl:items-end">
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Xem chi tiết
                  </Link>
                  <button
                    onClick={() => void saveTicket(ticket.id)}
                    disabled={savingId === ticket.id}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingId === ticket.id ? "Đang lưu..." : "Lưu cập nhật"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
