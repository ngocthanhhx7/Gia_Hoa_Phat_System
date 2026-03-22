"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  ChefHat,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const canAccessBackoffice = ["ADMIN", "STAFF", "VENDOR"].includes(session?.user?.role || "");

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-amber-700 hover:text-amber-800 transition"
          >
            <ChefHat className="w-7 h-7" />
            <span className="hidden sm:inline">Gia Hòa Phát</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/products"
              className="hover:text-amber-700 transition"
            >
              Sản phẩm
            </Link>
            <Link
              href="/products?type=ingredient"
              className="hover:text-amber-700 transition"
            >
              Nguyên liệu
            </Link>
            <Link
              href="/products?type=equipment"
              className="hover:text-amber-700 transition"
            >
              Thiết bị
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/cart"
                  className="relative p-2 rounded-full hover:bg-slate-100 transition"
                  title="Giỏ hàng"
                >
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                </Link>

                <NotificationBell />

                {canAccessBackoffice && (
                  <Link
                    href="/admin/dashboard"
                    className="p-2 rounded-full hover:bg-slate-100 transition"
                    title="Điều hành"
                  >
                    <LayoutDashboard className="w-5 h-5 text-slate-600" />
                  </Link>
                )}

                <Link
                  href="/profile"
                  className="p-2 rounded-full hover:bg-slate-100 transition"
                  title="Tài khoản"
                >
                  <User className="w-5 h-5 text-slate-600" />
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-amber-700 hover:text-amber-800 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-2 pt-3 space-y-1">
            <Link
              href="/products"
              className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Tất cả sản phẩm
            </Link>
            <Link
              href="/products?type=ingredient"
              className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Nguyên liệu
            </Link>
            <Link
              href="/products?type=equipment"
              className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Thiết bị
            </Link>
            {canAccessBackoffice && (
              <Link
                href="/admin/dashboard"
                className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                Điều hành
              </Link>
            )}
            {session && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
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
