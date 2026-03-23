"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, History as HistoryIcon, Search } from "lucide-react";

type HistoryOrder = {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  address: string;
  user: { fullName: string | null; email: string };
  delivery: { carrier: string | null; trackingCode: string | null } | null;
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

export default function DeliveryHistoryPage() {
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchedStatus = filter ? order.status === filter : true;
      const keyword = search.trim().toLowerCase();
      const matchedKeyword = keyword
        ? [order.code, order.user.fullName || "", order.user.email, order.address]
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        : true;
      return matchedStatus && matchedKeyword;
    });
  }, [filter, orders, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Lịch sử giao hàng</h1>
        <p className="text-sm text-slate-500 mt-1">Tra cứu tất cả đơn bạn từng được phân công xử lý.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã đơn, khách hàng, địa chỉ"
            className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          />
        </div>
        <select
          title="Lọc trạng thái giao hàng"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PROCESSING">Đang chuẩn bị</option>
          <option value="SHIPPING">Đang giao</option>
          <option value="DELIVERED">Đã giao</option>
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <HistoryIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Chưa có đơn phù hợp</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => (
              <Link
                key={order.id}
                href={`/delivery/${order.id}`}
                className="block p-4 sm:p-5 hover:bg-slate-50 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-800">{order.code}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {order.user.fullName || order.user.email} • {order.address}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{order.delivery?.carrier || "Chưa cập nhật đơn vị vận chuyển"}</p>
                    <p className="text-xs text-slate-400 mt-1">{order.delivery?.trackingCode || "Chưa có mã vận đơn"}</p>
                    <p className="mt-2 font-medium text-slate-700">{order.status}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
