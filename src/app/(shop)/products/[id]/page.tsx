"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Minus,
  Plus,
  Package,
  Truck,
  Shield,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatVND, BUSINESS_RULES, MESSAGES } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  images: string | null;
  stock: number;
  unit: string | null;
  type: string | null;
  category: { id: string; name: string; slug: string } | null;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) {
        router.push("/products");
        return;
      }
      const data = await res.json();
      setProduct(data.product);
      setRelated(data.related || []);
      setLoading(false);
    }
    load();
  }, [id, router]);

  function getImages(images: string | null): string[] {
    if (!images) return ["/placeholder-product.svg"];
    try {
      const arr = JSON.parse(images);
      return arr.length > 0 ? arr : ["/placeholder-product.svg"];
    } catch {
      return [images || "/placeholder-product.svg"];
    }
  }

  async function handleAddToCart() {
    if (!session) {
      router.push("/login");
      return;
    }
    if (!product || product.stock === 0) return;

    setAddingToCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      if (res.ok) {
        toast.success(MESSAGES.MSG06);
      } else {
        const data = await res.json();
        toast.error(data.error || MESSAGES.MSG07);
      }
    } catch {
      toast.error("Lỗi kết nối");
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!product) return null;

  const images = getImages(product.images);
  const effectivePrice = product.salePrice || product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/products" className="hover:text-amber-700 transition flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Sản phẩm
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/products?categoryId=${product.category.id}`}
              className="hover:text-amber-700 transition"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-slate-800 font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
            <img
              src={images[activeImage]}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-product.svg";
              }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                    i === activeImage
                      ? "border-amber-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              {product.category.name}
            </span>
          )}

          <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-800">
            {product.name}
          </h1>

          {/* Price */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-amber-700">
              {formatVND(effectivePrice)}
            </span>
            {product.salePrice && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatVND(product.price)}
                </span>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  -{Math.round((1 - product.salePrice / product.price) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <div className="mt-4">
            {product.stock > 0 ? (
              <span className="text-sm text-emerald-600 font-medium">
                ✓ Còn hàng ({product.stock} {product.unit || "sản phẩm"})
              </span>
            ) : (
              <span className="text-sm text-red-500 font-medium">
                ✕ Hết hàng
              </span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2.5 hover:bg-slate-50 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={Math.min(product.stock, BUSINESS_RULES.MAX_CART_QUANTITY)}
                value={quantity}
                onChange={(e) =>
                  setQuantity(
                    Math.min(
                      Math.max(1, parseInt(e.target.value) || 1),
                      Math.min(product.stock, BUSINESS_RULES.MAX_CART_QUANTITY)
                    )
                  )
                }
                className="w-16 text-center py-2.5 text-sm font-medium border-x border-slate-200 outline-none"
              />
              <button
                onClick={() =>
                  setQuantity(
                    Math.min(
                      quantity + 1,
                      Math.min(product.stock, BUSINESS_RULES.MAX_CART_QUANTITY)
                    )
                  )
                }
                className="px-3 py-2.5 hover:bg-slate-50 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
              className="flex items-center gap-2 px-8 py-3 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {addingToCart ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
              {product.stock === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </button>
          </div>

          {/* Benefits */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Package, text: "Đóng gói cẩn thận" },
              { icon: Truck, text: "Giao hàng toàn quốc" },
              { icon: Shield, text: "Đảm bảo chất lượng" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600"
              >
                <Icon className="w-4 h-4 text-amber-600 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">
                Mô tả sản phẩm
              </h2>
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="whitespace-pre-line text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.id}`}
                className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="aspect-square bg-slate-50">
                  <img
                    src={getImages(item.images)[0]}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                    }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-slate-700 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-amber-700">
                    {formatVND(item.salePrice || item.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
