"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CreditCard, Loader2, MapPin, Phone, Truck, User } from "lucide-react";
import toast from "react-hot-toast";
import FeedbackForm from "@/components/FeedbackForm";
import OrderTimeline from "@/components/OrderTimeline";

type TimelineItem = {
  key: string;
  label: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "cancelled";
  time: string | null;
};

type OrderDetail = {
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
  user: { fullName: string | null; email: string; phone: string | null };
  details: {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    product: { id: string; name: string; slug: string; images: string | null; unit: string | null };
  }[];
  payment: { method: string; amount: number; status: string; paidAt: string | null } | null;
  delivery: {
    status: string;
    carrier: string | null;
    trackingCode: string | null;
    deliveredAt: string | null;
    assignee?: { fullName: string | null; email: string; phone: string | null } | null;
  } | null;
  trackingTimeline: TimelineItem[];
  feedbackEligibleItems: {
    productId: string;
    orderId: string;
    productName: string;
    canReview: boolean;
  }[];
  canCancel: boolean;
};

function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(value: string | null) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: "Chờ xử lý",
    CONFIRMED: "Đã xác nhận",
    PROCESSING: "Đang chuẩn bị",
    SHIPPING: "Đang giao hàng",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy",
  };
  return labels[status] || status;
}

function getFirstImage(images: string | null) {
  if (!images) return "/placeholder-product.svg";
  try {
    const parsed = JSON.parse(images) as string[];
    return parsed[0] || "/placeholder-product.svg";
  } catch {
    return "/placeholder-product.svg";
  }
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "tracking" ? "tracking" : "summary";

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "tracking" | "feedback">(initialTab);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tải chi tiết đơn hàng");
      }
      setOrder(data);
    } catch (error) {
      console.error(error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleCancel() {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể hủy đơn hàng");
        return;
      }
      toast.success("Đơn hàng đã được hủy");
      await loadOrder();
    } catch {
      toast.error("Không thể hủy đơn hàng");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Không tìm thấy đơn hàng.</p>
        <Link href="/orders" className="text-amber-700 hover:text-amber-800">
          Quay lại đơn hàng
        </Link>
      </div>
    );
  }

  const subtotal = order.details.reduce((total, item) => total + item.unitPrice * item.quantity, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800">
        <ArrowLeft className="h-4 w-4" />
        Quay lại đơn hàng
      </Link>

      <div className="mt-4 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{order.code}</h1>
          <p className="mt-1 text-sm text-slate-500">Đặt lúc {formatDate(order.createdAt)}</p>
          <span
            data-testid="order-status"
            className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {getStatusLabel(order.status)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["summary", "tracking", "feedback"].map((tab) => (
            <button
              key={tab}
              data-testid={`order-tab-${tab}`}
              onClick={() => setActiveTab(tab as "summary" | "tracking" | "feedback")}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                activeTab === tab ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab === "summary" ? "Chi tiết" : tab === "tracking" ? "Tracking" : "Feedback"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          {(activeTab === "summary" || activeTab === "feedback") && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Sản phẩm trong đơn</h2>
              <div className="mt-4 space-y-4">
                {order.details.map((detail) => (
                  <div key={detail.id} className="flex gap-4 rounded-2xl border border-slate-100 p-4">
                    <img
                      src={getFirstImage(detail.product.images)}
                      alt={detail.product.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <Link href={`/products/${detail.product.id}`} className="font-semibold text-slate-800 hover:text-amber-700">
                        {detail.product.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatVND(detail.unitPrice)} x {detail.quantity}
                        {detail.product.unit ? ` (${detail.product.unit})` : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-amber-700">{formatVND(detail.unitPrice * detail.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span>{formatVND(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span>{order.shippingFee === 0 ? "Miễn phí" : formatVND(order.shippingFee)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ""}</span>
                    <span>-{formatVND(order.discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-800">
                  <span>Tổng cộng</span>
                  <span className="text-amber-700">{formatVND(order.totalAmount)}</span>
                </div>
              </div>
            </section>
          )}

          {activeTab === "tracking" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Timeline đơn hàng</h2>
              <p className="mt-1 text-sm text-slate-500">Theo dõi các bước xử lý, thanh toán và giao hàng.</p>
              <div className="mt-6">
                <OrderTimeline items={order.trackingTimeline} />
              </div>
            </section>
          )}

          {activeTab === "feedback" && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800">Gửi feedback sau khi nhận hàng</h2>
              <p className="mt-1 text-sm text-slate-500">
                Bạn có thể đánh giá từng sản phẩm trong đơn đã giao. Mỗi sản phẩm chỉ được đánh giá một lần cho đơn này.
              </p>
              <div className="mt-6 space-y-4">
                {order.feedbackEligibleItems.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Đơn hàng này hiện chưa đủ điều kiện hoặc bạn đã gửi feedback cho tất cả sản phẩm.
                  </p>
                ) : (
                  order.feedbackEligibleItems
                    .filter((item) => item.canReview)
                    .map((item) => (
                      <FeedbackForm
                        key={item.productId}
                        productId={item.productId}
                        orderId={item.orderId}
                        productName={item.productName}
                        onSubmitted={loadOrder}
                      />
                    ))
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800">Thông tin giao hàng</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{order.user.fullName || order.user.email}</span>
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{order.address}</span>
              </p>
              <p className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{order.phone}</span>
              </p>
              {order.note && <p className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Ghi chú: {order.note}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <CreditCard className="h-4 w-4 text-amber-600" />
              Thanh toán
            </h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Phương thức: {order.payment?.method || "N/A"}</p>
              <p>Trạng thái: {order.payment?.status || "Chưa cập nhật"}</p>
              <p>Số tiền: {formatVND(order.payment?.amount || order.totalAmount)}</p>
              {order.payment?.paidAt && <p>Thanh toán lúc: {formatDate(order.payment.paidAt)}</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Truck className="h-4 w-4 text-amber-600" />
              Tracking
            </h3>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>Trạng thái giao hàng: {order.delivery?.status || "Chưa cập nhật"}</p>
              <p>Đơn vị vận chuyển: {order.delivery?.carrier || "Đang cập nhật"}</p>
              <p>Mã vận đơn: {order.delivery?.trackingCode || "Đang cập nhật"}</p>
              <p>Nhân viên giao: {order.delivery?.assignee?.fullName || "Chưa phân công"}</p>
              {order.delivery?.deliveredAt && <p>Đã giao lúc: {formatDate(order.delivery.deliveredAt)}</p>}
            </div>
          </section>

          {order.canCancel && (
            <button
              onClick={() => void handleCancel()}
              disabled={cancelling}
              className="w-full rounded-2xl border border-red-200 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              {cancelling ? "Đang hủy đơn..." : "Hủy đơn hàng"}
            </button>
          )}

          {order.feedbackEligibleItems.some((item) => item.canReview) && activeTab !== "feedback" && (
            <button
              onClick={() => setActiveTab("feedback")}
              className="w-full rounded-2xl bg-amber-600 px-4 py-3 text-sm font-medium text-white hover:bg-amber-700"
            >
              Gửi feedback cho sản phẩm đã nhận
            </button>
          )}

          {activeTab !== "tracking" && (
            <button
              onClick={() => setActiveTab("tracking")}
              className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Xem timeline và tracking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
