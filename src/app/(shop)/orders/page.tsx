"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Eye, Loader2, Package, Search, Truck, XCircle } from "lucide-react";
import toast from "react-hot-toast";

type OrderItem = {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  canCancel: boolean;
  details: {
    id: string;
    quantity: number;
    product: { id: string; name: string };
  }[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const statusMap: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/orders/my?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể tải lịch sử mua hàng");
        setOrders([]);
        return;
      }

      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch {
      toast.error("Không thể tải lịch sử mua hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, page, search, session, statusFilter]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  async function handleCancel(orderId: string) {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể hủy đơn hàng");
        return;
      }
      toast.success("Đơn hàng đã được hủy thành công");
      await fetchOrders();
    } catch {
      toast.error("Không thể hủy đơn hàng");
    } finally {
      setCancellingId(null);
    }
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Vui lòng đăng nhập để xem lịch sử mua hàng.</p>
        <Link href="/login" className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-medium text-white">
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch sử mua hàng</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi đơn hàng, trạng thái xử lý và giao hàng của bạn.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã đơn hàng"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
            />
          </div>

          <select
            title="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-slate-500">Chưa có đơn hàng phù hợp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-mono text-sm font-bold text-slate-800">{order.code}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${statusColor[order.status] || "bg-slate-100 text-slate-600"}`}>
                  {statusMap[order.status] || order.status}
                </span>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="space-y-2 text-sm text-slate-600">
                  {order.details.slice(0, 3).map((detail) => (
                    <p key={detail.id}>
                      {detail.product.name} x {detail.quantity}
                    </p>
                  ))}
                  {order.details.length > 3 && (
                    <p className="text-slate-400">... và {order.details.length - 3} sản phẩm khác</p>
                  )}
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-sm text-slate-400">Tổng thanh toán</p>
                  <p className="text-lg font-bold text-amber-700">{formatVND(order.totalAmount)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <Link
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  Xem chi tiết
                </Link>
                <Link
                  href={`/orders/${order.id}?tab=tracking`}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100"
                >
                  <Truck className="h-4 w-4" />
                  Theo dõi đơn
                </Link>
                {order.canCancel && (
                  <button
                    onClick={() => void handleCancel(order.id)}
                    disabled={cancellingId === order.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((item) => (
            <button
              key={item}
              onClick={() => setPage(item)}
              className={`h-10 min-w-10 rounded-xl px-3 text-sm font-medium ${
                item === page ? "bg-amber-600 text-white" : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
