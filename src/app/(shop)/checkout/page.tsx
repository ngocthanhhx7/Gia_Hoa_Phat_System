"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Phone, CreditCard, Ticket, CheckCircle2 } from "lucide-react";
import { MESSAGES, formatSystemMessage } from "@/lib/constants";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  salePrice: number | null;
  images: string | null;
  unit: string | null;
}
interface CartItemData {
  id: string;
  quantity: number;
  product: CartProduct;
}

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
}

export default function CheckoutPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [items, setItems] = useState<CartItemData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState<string | null>(null);
  const [voucherValid, setVoucherValid] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotalAmount(data.totalAmount);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    if (session) {
      fetchCart();
      // Pre-fill from profile
      if (session.user?.address) setAddress(session.user.address);
      if (session.user?.phone) setPhone(session.user.phone);
    }
  }, [session, authStatus, fetchCart, router]);

  async function validateVoucher() {
    setVoucherMsg(null);
    if (!voucherCode.trim()) return;

    const res = await fetch("/api/vouchers/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: voucherCode.trim(), subtotal: totalAmount }),
    });
    const data = await res.json();

    if (res.ok) {
      setVoucherDiscount(data.discount);
      setVoucherValid(true);
      setVoucherMsg(`Giảm ${formatVND(data.discount)} — ${data.description || data.code}`);
    } else {
      setVoucherDiscount(0);
      setVoucherValid(false);
      setVoucherMsg(data.error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!address.trim() || !phone.trim()) {
      setError("Vui lòng nhập đầy đủ địa chỉ và số điện thoại");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim() || undefined,
          paymentMethod,
          voucherCode: voucherValid ? voucherCode.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setOrderId(data.order.id);
        setVoucherMsg(formatSystemMessage(MESSAGES.MSG08, { orderCode: data.order.code }));
      } else {
        setError(data.error || "Có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Đặt hàng thành công!</h1>
        <p className="text-slate-500 text-center max-w-md">
          Cảm ơn bạn đã mua hàng tại Gia Hòa Phát. Chúng tôi sẽ xử lý đơn hàng và thông báo cho bạn.
        </p>
        {voucherMsg && (
          <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-xl">
            {voucherMsg}
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => router.push(`/orders/${orderId}`)}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            Xem đơn hàng
          </button>
          <button
            onClick={() => router.push("/products")}
            className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition"
          >
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Giỏ hàng trống — không thể thanh toán.</p>
        <button
          onClick={() => router.push("/products")}
          className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          Xem sản phẩm
        </button>
      </div>
    );
  }

  const shippingFee = totalAmount >= 500000 ? 0 : 30000;
  const grandTotal = totalAmount - voucherDiscount + shippingFee;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Thanh toán</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: shipping + payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Info */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <MapPin className="w-5 h-5 text-amber-600" />
              Thông tin giao hàng
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Địa chỉ giao hàng *</label>
                <input
                  type="text"
                  data-testid="checkout-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-slate-600 mb-1">
                  <Phone className="w-4 h-4" /> Số điện thoại *
                </label>
                <input
                  type="tel"
                  data-testid="checkout-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <CreditCard className="w-5 h-5 text-amber-600" />
              Phương thức thanh toán
            </h2>
            <div className="space-y-2">
              {[
                { value: "COD", label: "Thanh toán khi nhận hàng (COD)", desc: "Trả tiền mặt cho nhân viên giao hàng" },
                { value: "VNPAY", label: "VNPay", desc: "Thanh toán qua cổng VNPay (demo)" },
                { value: "MOMO", label: "MoMo", desc: "Thanh toán qua ví MoMo (demo)" },
                { value: "BANK_TRANSFER", label: "Chuyển khoản ngân hàng", desc: "Chuyển khoản theo thông tin đơn hàng" },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    paymentMethod === method.value
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-0.5 accent-amber-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-slate-800">{method.label}</div>
                    <div className="text-xs text-slate-500">{method.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Voucher */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
              <Ticket className="w-5 h-5 text-amber-600" />
              Mã giảm giá
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                data-testid="voucher-code"
                value={voucherCode}
                onChange={(e) => {
                  setVoucherCode(e.target.value.toUpperCase());
                  setVoucherValid(false);
                  setVoucherMsg(null);
                  setVoucherDiscount(0);
                }}
                placeholder="Nhập mã giảm giá"
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-sm uppercase"
              />
              <button
                type="button"
                data-testid="apply-voucher"
                onClick={validateVoucher}
                className="px-4 py-2.5 bg-slate-800 text-white text-sm rounded-lg hover:bg-slate-900 transition"
              >
                Áp dụng
              </button>
            </div>
            {voucherMsg && (
              <p className={`mt-2 text-sm ${voucherValid ? "text-green-600" : "text-red-500"}`}>
                {voucherMsg}
              </p>
            )}
          </div>
        </div>

        {/* Right column: order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Đơn hàng</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const price = item.product.salePrice ?? item.product.price;
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-600 line-clamp-1 flex-1 mr-2">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-slate-800 font-medium whitespace-nowrap">
                      {formatVND(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span>{formatVND(totalAmount)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatVND(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Vận chuyển</span>
                <span>{shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</span>
              </div>
              <div className="pt-2 border-t flex justify-between font-bold text-slate-800 text-base">
                <span>Tổng cộng</span>
                <span className="text-amber-700">{formatVND(grandTotal)}</span>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>
            )}

            <button
              type="submit"
              data-testid="place-order"
              disabled={submitting}
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                `Đặt hàng — ${formatVND(grandTotal)}`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
