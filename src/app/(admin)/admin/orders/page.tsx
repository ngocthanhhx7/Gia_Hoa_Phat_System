"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Eye, Package, ArrowRight, Search } from "lucide-react";
import { formatVND } from "@/lib/constants";

type OrderRow = {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  user: { fullName: string | null; email: string };
  delivery: { status: string } | null;
  payment: { method: string; status: string } | null;
  details: { quantity: number }[];
};

const statusLabel: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const nextStatusOptions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filter) params.set("status", filter);

      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) {
        toast.error("Không thể tải danh sách đơn hàng");
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  async function updateStatus(orderId: string, status: string) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể cập nhật trạng thái");
        return;
      }

      toast.success(`Đơn hàng đã chuyển sang "${statusLabel[status] || status}"`);
      await fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;

    return orders.filter((order) =>
      [order.code, order.user.fullName || "", order.user.email]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [orders, search]);

  return (
    <div>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Xử lý đơn hàng</h1>
          <p className="text-sm text-slate-500">Theo dõi trạng thái, thanh toán và vận chuyển của từng đơn.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative min-w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã đơn, tên, email"
              className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Không có đơn hàng phù hợp</p>
          </div>
        ) : (
          <>
          <div className="md:hidden divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{order.code}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[order.status] || "bg-slate-100 text-slate-600"}`}>
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>{order.user.fullName || "Khách hàng"}</p>
                  <p className="break-all">{order.user.email}</p>
                  <p>Thanh toán: {order.payment?.method || "N/A"} / {order.payment?.status || "Chưa có"}</p>
                  <p>Vận chuyển: {order.delivery?.status || "Chưa tạo"}</p>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-amber-700">{formatVND(order.totalAmount)}</p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Xem
                    </Link>
                    {nextStatusOptions[order.status]?.length > 0 && (
                      <select
                        defaultValue=""
                        disabled={updatingId === order.id}
                        onChange={(event) => {
                          if (!event.target.value) return;
                          void updateStatus(order.id, event.target.value);
                          event.target.value = "";
                        }}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                      >
                        <option value="">Trạng thái</option>
                        {nextStatusOptions[order.status].map((nextStatus) => (
                          <option key={nextStatus} value={nextStatus}>
                            {statusLabel[nextStatus]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
                  <th className="px-4 py-3 text-left">Đơn hàng</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Thanh toán</th>
                  <th className="px-4 py-3 text-left">Vận chuyển</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-800">{order.code}</p>
                      <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.details.length} dòng sản phẩm</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-700">{order.user.fullName || "Khách hàng"}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{order.payment?.method || "N/A"}</p>
                      <p className="text-xs text-slate-400 mt-1">{order.payment?.status || "Chưa có"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-slate-700">{order.delivery?.status || "Chưa tạo"}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-amber-700">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[order.status] || "bg-slate-100 text-slate-600"}`}>
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem
                        </Link>

                        {nextStatusOptions[order.status]?.length > 0 && (
                          <select
                            defaultValue=""
                            disabled={updatingId === order.id}
                            onChange={(event) => {
                              if (!event.target.value) return;
                              void updateStatus(order.id, event.target.value);
                              event.target.value = "";
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                          >
                            <option value="">Chuyển trạng thái</option>
                            {nextStatusOptions[order.status].map((nextStatus) => (
                              <option key={nextStatus} value={nextStatus}>
                                {statusLabel[nextStatus]}
                              </option>
                            ))}
                          </select>
                        )}

                        {updatingId === order.id && (
                          <span className="inline-flex items-center text-amber-600">
                            <ArrowRight className="w-4 h-4 animate-pulse" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
