"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Package, Eye, XCircle, Clock, CheckCircle, Truck } from "lucide-react";
import { MESSAGES } from "@/lib/constants";

interface OrderItem {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  details: { quantity: number; unitPrice: number; product: { name: string } }[];
}

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  PROCESSING: { label: "Đang chuẩn bị", color: "bg-indigo-100 text-indigo-700", icon: <Package className="w-3.5 h-3.5" /> },
  SHIPPING: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-700", icon: <Truck className="w-3.5 h-3.5" /> },
  DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

export default function OrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const url = filter ? `/api/orders?status=${filter}` : "/api/orders";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (session) fetchOrders();
    else setLoading(false);
  }, [session, fetchOrders]);

  async function cancelOrder(id: string) {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancelling(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        toast.success(MESSAGES.MSG14);
        await fetchOrders();
      } else {
        const data = await res.json();
        toast.error(data.error || MESSAGES.MSG15);
      }
    } finally {
      setCancelling(null);
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Vui lòng đăng nhập để xem đơn hàng</p>
        <Link href="/login" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Đơn hàng của tôi</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "", label: "Tất cả" },
          { value: "PENDING", label: "Chờ xử lý" },
          { value: "CONFIRMED", label: "Đã xác nhận" },
          { value: "SHIPPING", label: "Đang giao" },
          { value: "DELIVERED", label: "Đã giao" },
          { value: "CANCELLED", label: "Đã hủy" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setLoading(true); }}
            className={`px-3 py-1.5 text-sm rounded-full transition ${
              filter === f.value
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const st = statusMap[order.status] || statusMap.PENDING;
            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-mono font-bold text-slate-700">{order.code}</span>
                    <span className="ml-3 text-xs text-slate-400">{formatDate(order.createdAt)}</span>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${st.color}`}
                  >
                    {st.icon} {st.label}
                  </span>
                </div>

                <div className="text-sm text-slate-600 space-y-1 mb-3">
                  {order.details.slice(0, 3).map((d, i) => (
                    <p key={i}>
                      {d.product.name} × {d.quantity} — {formatVND(d.unitPrice * d.quantity)}
                    </p>
                  ))}
                  {order.details.length > 3 && (
                    <p className="text-slate-400">... và {order.details.length - 3} sản phẩm khác</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-sm font-bold text-amber-700">{formatVND(order.totalAmount)}</span>
                  <div className="flex gap-2">
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancelling === order.id}
                        className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Hủy đơn
                      </button>
                    )}
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> Chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
