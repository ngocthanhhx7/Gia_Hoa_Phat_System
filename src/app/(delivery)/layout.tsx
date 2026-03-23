import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, LayoutDashboard, History, CircleCheckBig } from "lucide-react";

const deliveryLinks = [
  { href: "/delivery", label: "Dashboard", icon: LayoutDashboard },
  { href: "/delivery/history", label: "Lịch sử", icon: History },
  { href: "/delivery/completed", label: "Hoàn tất", icon: CircleCheckBig },
];

export default async function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DELIVERY") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white">
        <div className="px-6 py-5 border-b border-slate-700">
          <Link href="/" className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Về trang chủ</span>
          </Link>
          <h1 className="text-lg font-bold mt-3">Giao hàng</h1>
          <p className="text-xs text-slate-400">{session.user.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {deliveryLinks.map(({ href, label, icon: Icon }) => (
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

      <div className="flex-1 flex flex-col">
        <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-bold text-slate-800">Giao hàng</h1>
            <Link href="/" className="text-sm text-amber-600 hover:underline">
              Về trang chủ
            </Link>
          </div>
          <nav className="px-4 pb-3 flex gap-2 overflow-x-auto">
            {deliveryLinks.map(({ href, label }) => (
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
