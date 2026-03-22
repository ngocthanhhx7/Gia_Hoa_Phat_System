"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  stock: number;
  images: string | null;
  unit: string | null;
  active: boolean;
}

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

function formatVND(n: number) {
  return n.toLocaleString("vi-VN") + " đ";
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

export default function CartPage() {
  const { data: session, status: authStatus } = useSession();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

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
    if (session) fetchCart();
    else setLoading(false);
  }, [session, fetchCart]);

  async function updateQuantity(itemId: string, quantity: number) {
    setUpdating(itemId);
    try {
      if (quantity <= 0) {
        await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      } else {
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, quantity }),
        });
      }
      await fetchCart();
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdating(itemId);
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
      await fetchCart();
    } finally {
      setUpdating(null);
    }
  }

  async function clearCart() {
    setUpdating("all");
    try {
      await fetch("/api/cart", { method: "DELETE" });
      await fetchCart();
    } finally {
      setUpdating(null);
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
        <ShoppingBag className="w-16 h-16 text-slate-300" />
        <p className="text-slate-500">Vui lòng đăng nhập để xem giỏ hàng</p>
        <Link href="/login" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
          Đăng nhập
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="w-16 h-16 text-slate-300" />
        <p className="text-lg font-medium text-slate-500">Giỏ hàng trống</p>
        <p className="text-sm text-slate-400">Hãy thêm sản phẩm vào giỏ để mua sắm nào!</p>
        <Link href="/products" className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  const shippingFee = totalAmount >= 500000 ? 0 : 30000;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price;
            const isUpdating = updating === item.id;

            return (
              <div
                key={item.id}
                className={`flex gap-4 bg-white rounded-xl border border-slate-100 p-4 shadow-sm transition ${
                  isUpdating ? "opacity-50" : ""
                }`}
              >
                <img
                  src={getFirstImage(item.product.images)}
                  alt={item.product.name}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-sm font-semibold text-slate-800 hover:text-amber-700 transition line-clamp-2"
                  >
                    {item.product.name}
                  </Link>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-amber-700 font-bold text-sm">{formatVND(price)}</span>
                    {item.product.salePrice && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatVND(item.product.price)}
                      </span>
                    )}
                    {item.product.unit && (
                      <span className="text-xs text-slate-400">/ {item.product.unit}</span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating}
                        className="p-1 rounded-md hover:bg-slate-100 transition disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating || item.quantity >= item.product.stock}
                        className="p-1 rounded-md hover:bg-slate-100 transition disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">
                        {formatVND(price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={isUpdating}
                        className="p-1.5 rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={clearCart}
            disabled={updating === "all"}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            Xóa toàn bộ giỏ hàng
          </button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính ({items.length} sản phẩm)</span>
                <span>{formatVND(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? "Miễn phí" : formatVND(shippingFee)}</span>
              </div>
              {shippingFee > 0 && (
                <p className="text-xs text-amber-600">
                  Mua thêm {formatVND(500000 - totalAmount)} để được miễn phí vận chuyển
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-slate-800">
                <span>Tổng cộng</span>
                <span className="text-amber-700 text-lg">{formatVND(totalAmount + shippingFee)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition shadow-sm"
            >
              Tiến hành thanh toán
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/products"
              className="mt-3 block text-center text-sm text-amber-700 hover:text-amber-800 transition"
            >
              ← Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
