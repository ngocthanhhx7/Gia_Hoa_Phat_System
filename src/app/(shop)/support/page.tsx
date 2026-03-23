"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Headset, Loader2, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: string;
  updatedAt: string;
  replies: { id: string }[];
  assignee?: { fullName: string | null; email: string } | null;
};

const categories = [
  { value: "ORDER", label: "Đơn hàng" },
  { value: "PAYMENT", label: "Thanh toán" },
  { value: "DELIVERY", label: "Giao hàng" },
  { value: "PRODUCT", label: "Sản phẩm" },
  { value: "ACCOUNT", label: "Tài khoản" },
  { value: "OTHER", label: "Khác" },
];

export default function SupportPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "ORDER",
    message: "",
  });

  const loadTickets = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tải danh sách ticket");
        return;
      }
      setTickets(data.tickets || []);
    } catch {
      toast.error("Không thể tải danh sách ticket");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tạo ticket hỗ trợ");
        return;
      }
      toast.success("Đã gửi ticket hỗ trợ");
      setForm({ subject: "", category: "ORDER", message: "" });
      await loadTickets();
    } catch {
      toast.error("Không thể tạo ticket hỗ trợ");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Vui lòng đăng nhập để sử dụng contact support.</p>
        <Link href="/login" className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-medium text-white">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contact Support</h1>
          <p className="mt-1 text-sm text-slate-500">Tạo ticket mới và theo dõi phản hồi từ staff/admin.</p>
        </div>
        <Link
          href="/support/assistant"
          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
        >
          <Headset className="h-4 w-4" />
          Trợ lý hỗ trợ
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <PlusCircle className="h-5 w-5 text-amber-600" />
            Tạo ticket mới
          </h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Chủ đề cần hỗ trợ"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            />
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              rows={6}
              placeholder="Mô tả chi tiết vấn đề bạn đang gặp"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Gửi yêu cầu hỗ trợ"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">Ticket của bạn</h2>
          {loading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Bạn chưa có ticket hỗ trợ nào.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/${ticket.id}`}
                  className="block rounded-2xl border border-slate-100 p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{ticket.subject}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {ticket.category} • Cập nhật {new Date(ticket.updatedAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {ticket.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">
                    {ticket.replies.length} phản hồi • {ticket.assignee?.fullName || "Chưa phân công người xử lý"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
