import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Package, ShoppingBag, Tag, ChevronLeft } from "lucide-react";

const adminLinks = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard, roles: ["ADMIN", "STAFF", "VENDOR"] },
  { href: "/admin/users", label: "Người dùng", icon: Users, roles: ["ADMIN"] },
  { href: "/admin/products", label: "Sản phẩm", icon: Package, roles: ["ADMIN", "VENDOR"] },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag, roles: ["ADMIN", "STAFF", "VENDOR"] },
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
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white">
        <div className="px-6 py-5 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Về trang chủ</span>
          </Link>
          <h1 className="text-lg font-bold mt-3">Điều hành hệ thống</h1>
          <p className="text-xs text-slate-400">{session.user.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-slate-800">Điều hành</h1>
            <Link href="/" className="text-sm text-amber-600 hover:underline">
              Về trang chủ
            </Link>
          </div>
          <nav className="px-4 pb-3 flex gap-2 overflow-x-auto">
            {visibleLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="whitespace-nowrap rounded-full border border-slate-200 px-3 py-1.5 text-sm text-slate-600 bg-slate-50"
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
