"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

type TicketDetail = {
  id: string;
  subject: string;
  category: string;
  status: string;
  user: { id: string; fullName: string | null; email: string };
  assignee?: { id: string; fullName: string | null; email: string } | null;
  replies: {
    id: string;
    message: string;
    createdAt: string;
    sender: { id: string; fullName: string | null; email: string; role: string };
  }[];
};

export default function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải ticket");
      }
      setTicket(data.ticket);
    } catch (error) {
      console.error(error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  async function handleReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/support/tickets/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể gửi phản hồi");
        return;
      }
      toast.success("Đã gửi phản hồi");
      setMessage("");
      await loadTicket();
    } catch {
      toast.error("Không thể gửi phản hồi");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Không tìm thấy ticket hỗ trợ.</p>
        <Link href="/support" className="text-amber-700 hover:text-amber-800">
          Quay lại hỗ trợ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/support" className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800">
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách ticket
      </Link>

      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{ticket.subject}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {ticket.category} • Trạng thái {ticket.status} • Người xử lý {ticket.assignee?.fullName || "chưa phân công"}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{ticket.status}</span>
        </div>

        <div className="mt-6 space-y-4">
          {ticket.replies.map((reply) => (
            <div key={reply.id} className="rounded-2xl border border-slate-100 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-semibold text-slate-800">
                  {reply.sender.fullName || reply.sender.email} <span className="text-xs text-slate-400">({reply.sender.role})</span>
                </p>
                <span className="text-xs text-slate-400">{new Date(reply.createdAt).toLocaleString("vi-VN")}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{reply.message}</p>
            </div>
          ))}
        </div>

        {ticket.status !== "CLOSED" && (
          <form onSubmit={handleReply} className="mt-6 space-y-3">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Nhập phản hồi của bạn..."
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
