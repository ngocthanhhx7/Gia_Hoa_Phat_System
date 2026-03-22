"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  sentAt: string;
  isRead: boolean;
};

function formatTime(date: string) {
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=6");
      if (!res.ok) return;

      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
      setNotifications(data.notifications || []);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id);
    if (unreadIds.length === 0) return;

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAll: true }),
    });

    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition"
        title="Thông báo"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[20rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-800">Thông báo</p>
              <p className="text-xs text-slate-400">{unreadCount} chưa đọc</p>
            </div>
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Đánh dấu đã đọc
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-sm text-slate-400 text-center">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-400 text-center">Chưa có thông báo</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 border-b border-slate-100 last:border-b-0 ${
                    item.isRead ? "bg-white" : "bg-amber-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-800">{item.title}</p>
                    {!item.isRead && <span className="mt-1 w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{item.message}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{formatTime(item.sentAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
