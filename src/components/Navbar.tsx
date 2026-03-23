"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  ChefHat,
  LayoutDashboard,
  LogOut,
  Menu,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = session?.user?.role || "";
  const canAccessBackoffice = ["ADMIN", "STAFF", "VENDOR"].includes(role);
  const canAccessDelivery = role === "DELIVERY";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 shadow-sm backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-amber-700 transition hover:text-amber-800"
          >
            <ChefHat className="h-7 w-7" />
            <span className="hidden sm:inline">Gia Hòa Phát</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/products" className="transition hover:text-amber-700">
              Sản phẩm
            </Link>
            <Link href="/products?type=ingredient" className="transition hover:text-amber-700">
              Nguyên liệu
            </Link>
            <Link href="/products?type=equipment" className="transition hover:text-amber-700">
              Thiết bị
            </Link>
            <Link href="/support" className="transition hover:text-amber-700">
              Hỗ trợ
            </Link>
            {session && (
              <Link href="/orders" className="transition hover:text-amber-700">
                Đơn hàng
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/cart"
                  className="relative rounded-full p-2 transition hover:bg-slate-100"
                  title="Giỏ hàng"
                >
                  <ShoppingCart className="h-5 w-5 text-slate-600" />
                </Link>

                <NotificationBell />

                {canAccessBackoffice && (
                  <Link
                    href="/admin/dashboard"
                    className="rounded-full p-2 transition hover:bg-slate-100"
                    title="Điều hành"
                  >
                    <LayoutDashboard className="h-5 w-5 text-slate-600" />
                  </Link>
                )}

                {canAccessDelivery && (
                  <Link
                    href="/delivery"
                    className="rounded-full p-2 transition hover:bg-slate-100"
                    title="Giao hàng"
                  >
                    <Truck className="h-5 w-5 text-slate-600" />
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="rounded-full p-2 transition hover:bg-slate-100"
                  title="Tài khoản"
                >
                  <User className="h-5 w-5 text-slate-600" />
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-600 sm:flex"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-amber-700 transition hover:text-amber-800"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-amber-700"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen((value) => !value)}
              className="rounded-lg p-2 transition hover:bg-slate-100 md:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="mt-2 space-y-1 border-t border-slate-100 pb-4 pt-3 md:hidden">
            <Link
              href="/products"
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Tất cả sản phẩm
            </Link>
            <Link
              href="/products?type=ingredient"
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Nguyên liệu
            </Link>
            <Link
              href="/products?type=equipment"
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Thiết bị
            </Link>
            <Link
              href="/support"
              className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Hỗ trợ
            </Link>
            {session && (
              <Link
                href="/orders"
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                Đơn hàng
              </Link>
            )}
            {canAccessBackoffice && (
              <Link
                href="/admin/dashboard"
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                Điều hành
              </Link>
            )}
            {canAccessDelivery && (
              <Link
                href="/delivery"
                className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                Giao hàng
              </Link>
            )}
            {session && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Đăng xuất
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
