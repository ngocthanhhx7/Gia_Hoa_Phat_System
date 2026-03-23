"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, CircleCheckBig, CalendarDays } from "lucide-react";

type CompletedOrder = {
  id: string;
  code: string;
  totalAmount: number;
  createdAt: string;
  delivery: { deliveredAt: string | null } | null;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DeliveryCompletedPage() {
  const [orders, setOrders] = useState<CompletedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?status=DELIVERED&limit=100");
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const summary = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    return { totalRevenue, count: orders.length };
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Báo cáo đơn hoàn tất</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng hợp các đơn bạn đã giao thành công.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Số đơn hoàn tất</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{summary.count}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Giá trị đơn đã giao</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {summary.totalRevenue.toLocaleString("vi-VN")} đ
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <CircleCheckBig className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Chưa có đơn hoàn tất</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => (
              <div key={order.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{order.code}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(order.delivery?.deliveredAt || order.createdAt)}
                  </p>
                </div>
                <p className="font-semibold text-amber-700">{order.totalAmount.toLocaleString("vi-VN")} đ</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
