"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Loader2, MapPin, Phone, Truck, CheckCircle2, User } from "lucide-react";
import { formatVND } from "@/lib/constants";

type DeliveryOrder = {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  address: string;
  phone: string;
  createdAt: string;
  user: { fullName: string | null; email: string };
  delivery: {
    status: string;
    carrier: string | null;
    trackingCode: string | null;
    assignee?: { fullName: string | null; email: string } | null;
  } | null;
  details: {
    id: string;
    quantity: number;
    unitPrice: number;
    product: { name: string; unit: string | null };
  }[];
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

export default function DeliveryOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) {
        setOrder(null);
        return;
      }
      const data = await res.json();
      setOrder(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function updateStatus(status: "SHIPPING" | "DELIVERED") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể cập nhật trạng thái");
        return;
      }

      toast.success(status === "SHIPPING" ? "Đã bắt đầu giao hàng" : "Đã xác nhận giao thành công");
      await fetchOrder();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Không tìm thấy đơn được phân công</p>
        <Link href="/delivery" className="text-amber-600 hover:text-amber-700">
          ← Quay lại dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/delivery" className="inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800">
        <ArrowLeft className="w-4 h-4" />
        Quay lại dashboard giao hàng
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Đơn {order.code}</h1>
          <p className="text-sm text-slate-400 mt-1">Tạo lúc {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {order.status === "PROCESSING" && (
            <button
              onClick={() => updateStatus("SHIPPING")}
              data-testid="delivery-start"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              <Truck className="w-4 h-4" />
              Bắt đầu giao
            </button>
          )}
          {order.status === "SHIPPING" && (
            <button
              onClick={() => updateStatus("DELIVERED")}
              data-testid="delivery-complete"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận đã giao
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Sản phẩm</h2>
          {order.details.map((detail) => (
            <div key={detail.id} className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
              <div>
                <p className="font-medium text-slate-800">{detail.product.name}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {detail.quantity} x {formatVND(detail.unitPrice)}
                  {detail.product.unit ? ` / ${detail.product.unit}` : ""}
                </p>
              </div>
              <p className="font-semibold text-slate-700">{formatVND(detail.quantity * detail.unitPrice)}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="font-semibold text-slate-800">Thông tin khách nhận</h3>
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <User className="w-4 h-4 mt-0.5 text-slate-400" />
              {order.user.fullName || order.user.email}
            </p>
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
              {order.address}
            </p>
            <p className="flex items-start gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
              {order.phone}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
            <h3 className="font-semibold text-slate-800">Vận chuyển</h3>
            <p className="text-sm text-slate-600">Trạng thái: {order.delivery?.status || "Chưa tạo"}</p>
            <p className="text-sm text-slate-600">Đơn vị: {order.delivery?.carrier || "Chưa cập nhật"}</p>
            <p className="text-sm text-slate-600">Mã vận đơn: {order.delivery?.trackingCode || "Chưa cập nhật"}</p>
            <p className="pt-2 text-base font-bold text-amber-700">{formatVND(order.totalAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
