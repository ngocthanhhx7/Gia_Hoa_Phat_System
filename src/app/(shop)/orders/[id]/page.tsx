"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Loader2, ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle,
  MapPin, Phone as PhoneIcon, CreditCard, User
} from "lucide-react";
import { MESSAGES } from "@/lib/constants";

interface OrderDetail {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  discount: number;
  address: string;
  phone: string;
  note: string | null;
  voucherCode: string | null;
  createdAt: string;
  updatedAt: string;
  user: { fullName: string | null; email: string; phone: string | null };
  details: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: { id: string; name: string; slug: string; images: string | null; unit: string | null };
  }[];
  payment: { method: string; amount: number; status: string; paidAt: string | null } | null;
  delivery: { status: string; trackingCode: string | null; deliveredAt: string | null } | null;
}

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function getFirstImage(images: string | null) {
  if (!images) return "/placeholder-product.png";
  try {
    const arr = JSON.parse(images);
    return arr[0] || "/placeholder-product.png";
  } catch {
    return "/placeholder-product.png";
  }
}

const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-4 h-4" /> },
  CONFIRMED: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-4 h-4" /> },
  PROCESSING: { label: "Đang chuẩn bị", color: "bg-indigo-100 text-indigo-700", icon: <Package className="w-4 h-4" /> },
  SHIPPING: { label: "Đang giao hàng", color: "bg-purple-100 text-purple-700", icon: <Truck className="w-4 h-4" /> },
  DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-700", icon: <CheckCircle className="w-4 h-4" /> },
  CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" /> },
};

const paymentMethods: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  VNPAY: "VNPay",
  MOMO: "MoMo",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (session) fetchOrder();
    else setLoading(false);
  }, [session, fetchOrder]);

  async function cancelOrder() {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        toast.success(MESSAGES.MSG14);
        await fetchOrder();
      } else {
        const data = await res.json();
        toast.error(data.error || MESSAGES.MSG15);
      }
    } finally {
      setCancelling(false);
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Không tìm thấy đơn hàng</p>
        <Link href="/orders" className="text-amber-600 hover:text-amber-700">← Quay lại</Link>
      </div>
    );
  }

  const st = statusMap[order.status] || statusMap.PENDING;
  const subtotal = order.details.reduce((s, d) => s + d.unitPrice * d.quantity, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/orders" className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Quay lại đơn hàng
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đơn hàng {order.code}</h1>
          <p className="text-sm text-slate-400 mt-1">Đặt lúc {formatDate(order.createdAt)}</p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full ${st.color}`}>
          {st.icon} {st.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: items + totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Sản phẩm</h2>
            <div className="space-y-4">
              {order.details.map((d) => (
                <div key={d.id} className="flex gap-4">
                  <img
                    src={getFirstImage(d.product.images)}
                    alt={d.product.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${d.product.slug}`}
                      className="text-sm font-semibold text-slate-800 hover:text-amber-700 line-clamp-1"
                    >
                      {d.product.name}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatVND(d.unitPrice)} × {d.quantity}
                      {d.product.unit && ` (${d.product.unit})`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{formatVND(d.unitPrice * d.quantity)}</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-6 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatVND(subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá {order.voucherCode && `(${order.voucherCode})`}</span>
                  <span>-{formatVND(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Vận chuyển</span>
                <span>{order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-base text-slate-800">
                <span>Tổng cộng</span>
                <span className="text-amber-700">{formatVND(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: info + actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Shipping info */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800">Giao hàng</h3>
            <div className="text-sm text-slate-600 space-y-2">
              <p className="flex items-start gap-2">
                <User className="w-4 h-4 mt-0.5 text-slate-400" />
                {order.user.fullName || order.user.email}
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                {order.address}
              </p>
              <p className="flex items-start gap-2">
                <PhoneIcon className="w-4 h-4 mt-0.5 text-slate-400" />
                {order.phone}
              </p>
              {order.note && (
                <p className="text-xs text-slate-400 italic">Ghi chú: {order.note}</p>
              )}
            </div>
          </div>

          {/* Payment info */}
          {order.payment && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                Thanh toán
              </h3>
              <p className="text-sm text-slate-600">
                {paymentMethods[order.payment.method] || order.payment.method}
              </p>
              <p className="text-sm text-slate-600">
                Trạng thái: <span className={
                  order.payment.status === "SUCCESS" ? "text-green-600 font-medium" :
                  order.payment.status === "FAILED" ? "text-red-600 font-medium" :
                  "text-yellow-600 font-medium"
                }>
                  {order.payment.status === "SUCCESS" ? "Đã thanh toán" :
                   order.payment.status === "FAILED" ? "Đã hủy" : "Chờ thanh toán"}
                </span>
              </p>
              {order.payment.paidAt && (
                <p className="text-xs text-slate-400">Thanh toán lúc {formatDate(order.payment.paidAt)}</p>
              )}
            </div>
          )}

          {/* Delivery info */}
          {order.delivery && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-2">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                Vận chuyển
              </h3>
              <p className="text-sm text-slate-600">
                {order.delivery.status === "PREPARING" ? "Đang chuẩn bị" :
                 order.delivery.status === "IN_TRANSIT" ? "Đang vận chuyển" :
                 order.delivery.status === "DELIVERED" ? "Đã giao" : order.delivery.status}
              </p>
              {order.delivery.trackingCode && (
                <p className="text-xs text-slate-400">Mã vận đơn: {order.delivery.trackingCode}</p>
              )}
              {order.delivery.deliveredAt && (
                <p className="text-xs text-slate-400">Giao lúc {formatDate(order.delivery.deliveredAt)}</p>
              )}
            </div>
          )}

          {/* Cancel button */}
          {order.status === "PENDING" && (
            <button
              onClick={cancelOrder}
              disabled={cancelling}
              className="w-full py-2.5 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition disabled:opacity-50"
            >
              {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
