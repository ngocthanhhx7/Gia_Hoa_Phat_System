import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  LayoutDashboard,
  LifeBuoy,
  Package,
  ShoppingBag,
  Tag,
  Users,
} from "lucide-react";

const adminLinks = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard, roles: ["ADMIN", "STAFF", "VENDOR"] },
  { href: "/admin/users", label: "Người dùng", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/products", label: "Sản phẩm", icon: Package, roles: ["ADMIN", "VENDOR"] },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag, roles: ["ADMIN", "STAFF", "VENDOR"] },
  { href: "/admin/support", label: "Hỗ trợ", icon: LifeBuoy, roles: ["ADMIN", "STAFF"] },
  { href: "/admin/vouchers", label: "Voucher", icon: Tag, roles: ["ADMIN"] },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session?.user || !["ADMIN", "STAFF", "VENDOR"].includes(role || "")) {
    redirect("/login");
  }

  const visibleLinks = adminLinks.filter((link) => link.roles.includes(role || ""));

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-col bg-slate-900 text-white lg:flex">
        <div className="border-b border-slate-700 px-6 py-5">
          <Link href="/" className="flex items-center gap-2 text-amber-400 transition hover:text-amber-300">
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Về trang chủ</span>
          </Link>
          <h1 className="mt-3 text-lg font-bold">Điều hành hệ thống</h1>
          <p className="text-xs text-slate-400">{session.user.email}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-slate-800">Điều hành</h1>
            <Link href="/" className="text-sm text-amber-600 hover:underline">
              Về trang chủ
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
            {visibleLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
