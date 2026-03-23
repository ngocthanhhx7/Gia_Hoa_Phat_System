"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Package, Loader2 } from "lucide-react";
import { formatVND } from "@/lib/constants";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  images: string | null;
  stock: number;
  type: string | null;
  category: { id: string; name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const sort = searchParams.get("sort") || "newest";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");
      if (search) params.set("search", search);
      if (type) params.set("type", type);
      if (categoryId) params.set("categoryId", categoryId);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) {
        throw new Error(`API /api/products failed with status ${res.status}`);
      }

      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (err) {
      console.error("Products fetch failed:", err);
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
      setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [page, search, type, categoryId, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch((err) => {
        console.error("Categories fetch failed:", err);
      });
  }, []);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/products?${params}`);
  }

  function getImageUrl(images: string | null): string {
    if (!images) return "/placeholder-product.svg";
    try {
      const arr = JSON.parse(images);
      return arr[0] || "/placeholder-product.svg";
    } catch {
      return images || "/placeholder-product.svg";
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sản phẩm</h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} sản phẩm được tìm thấy
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilter("search", (e.target as HTMLInputElement).value);
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition"
          />
        </div>
      </div>

      {/* Type Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { label: "Tất cả", value: "" },
          { label: "Nguyên liệu", value: "ingredient" },
          { label: "Thiết bị", value: "equipment" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateFilter("type", tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              type === tab.value
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}

        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Bộ lọc
        </button>
      </div>

      {/* Expanded Filters */}
      {filtersOpen && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Danh mục
            </label>
            <select
              title="Chọn danh mục"
              value={categoryId}
              onChange={(e) => updateFilter("categoryId", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat._count.products})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Sắp xếp
            </label>
            <select
              title="Chọn cách sắp xếp"
              value={sort}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => router.push("/products")}
              className="px-4 py-2 text-sm text-amber-700 hover:text-amber-800 transition"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {!loading && error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600">
            Không tìm thấy sản phẩm
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              data-testid={`product-card-${product.slug}`}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-amber-200 transition-all duration-300"
            >
              {/* Image */}
              <div className="aspect-square bg-slate-50 relative overflow-hidden">
                <img
                  src={getImageUrl(product.images)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-product.svg";
                  }}
                />
                {product.salePrice && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    -{Math.round((1 - product.salePrice / product.price) * 100)}%
                  </span>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                      Hết hàng
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4">
                {product.category && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {product.category.name}
                  </span>
                )}
                <h3 className="mt-2 text-sm font-semibold text-slate-800 line-clamp-2 group-hover:text-amber-700 transition">
                  {product.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-base font-bold text-amber-700">
                    {formatVND(product.salePrice || product.price)}
                  </span>
                  {product.salePrice && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatVND(product.price)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateFilter("page", p.toString())}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                p === page
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
