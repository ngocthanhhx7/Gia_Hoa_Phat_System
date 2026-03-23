"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Package, Truck, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/constants";

type DeliveryOrder = {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  address: string;
  phone: string;
  user: { fullName: string | null; email: string };
  delivery: {
    status: string;
    carrier: string | null;
    trackingCode: string | null;
  } | null;
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

export default function DeliveryDashboardPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders?limit=100");
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const activeOrders = useMemo(
    () => orders.filter((order) => ["PROCESSING", "SHIPPING"].includes(order.status)),
    [orders]
  );

  const deliveredCount = useMemo(
    () => orders.filter((order) => order.status === "DELIVERED").length,
    [orders]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đơn giao được phân công</h1>
        <p className="text-sm text-slate-500 mt-1">Danh sách đơn bạn đang phụ trách giao cho khách.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Đang xử lý</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{activeOrders.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Đã giao</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{deliveredCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Tổng đã nhận</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{orders.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Chưa có đơn nào được phân công</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeOrders.map((order) => (
              <div key={order.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{order.code}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {order.user.fullName || order.user.email} • {order.phone}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{order.address}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="text-sm text-slate-600">
                    <p>{order.delivery?.carrier || "Chưa có hãng vận chuyển"}</p>
                    <p className="text-xs text-slate-400 mt-1">{order.delivery?.trackingCode || "Chưa có mã vận đơn"}</p>
                    <p className="font-semibold text-amber-700 mt-2">{formatVND(order.totalAmount)}</p>
                  </div>
                  <Link
                    href={`/delivery/${order.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
                  >
                    {order.status === "PROCESSING" ? <Truck className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    Xử lý đơn
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
