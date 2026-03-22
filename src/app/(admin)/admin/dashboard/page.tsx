import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatVND } from "@/lib/constants";
import {
  Users,
  Package,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Bell,
} from "lucide-react";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminDashboard() {
  const session = await auth();
  const role = session?.user?.role || "CUSTOMER";

  const [
    userCount,
    productCount,
    orderCount,
    deliveredRevenue,
    pendingOrders,
    lowStockProducts,
    recentOrders,
    recentNotifications,
  ] = await Promise.all([
    role === "ADMIN" ? prisma.user.count() : Promise.resolve(0),
    ["ADMIN", "VENDOR"].includes(role) ? prisma.product.count() : Promise.resolve(0),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: "DELIVERED" },
    }),
    prisma.order.count({
      where: { status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING"] } },
    }),
    prisma.product.findMany({
      where: { active: true, stock: { lte: 5 } },
      orderBy: [{ stock: "asc" }, { updatedAt: "asc" }],
      take: 8,
      include: { category: { select: { name: true } } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { fullName: true, email: true } },
      },
    }),
    prisma.notificationLog.findMany({
      where: role === "ADMIN" ? undefined : { recipientId: session?.user?.id },
      orderBy: { sentAt: "desc" },
      take: 6,
      include: {
        recipient: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  const stats = [
    {
      label: role === "ADMIN" ? "Người dùng" : "Đơn đang xử lý",
      value: role === "ADMIN" ? userCount : pendingOrders,
      icon: role === "ADMIN" ? Users : ShoppingBag,
      color: "bg-blue-500",
      helper: role === "ADMIN" ? "Tổng tài khoản trong hệ thống" : "Cần theo dõi hôm nay",
    },
    {
      label: "Sản phẩm",
      value: productCount,
      icon: Package,
      color: "bg-amber-500",
      helper: "Đang kinh doanh",
    },
    {
      label: "Đơn hàng",
      value: orderCount,
      icon: ShoppingBag,
      color: "bg-green-500",
      helper: "Tổng đơn đã ghi nhận",
    },
    {
      label: "Doanh thu",
      value: formatVND(deliveredRevenue._sum.totalAmount || 0),
      icon: DollarSign,
      color: "bg-rose-500",
      helper: "Từ đơn đã giao thành công",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan vận hành</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi doanh thu, đơn hàng và các cảnh báo cần xử lý ngay.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, helper }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="text-xl font-bold text-slate-800">{value}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">{helper}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Đơn hàng gần đây</h2>
              <p className="text-sm text-slate-400">Bảng tóm tắt để xử lý nhanh.</p>
            </div>
          </div>

          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-800">{order.code}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {order.user.fullName || order.user.email}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-amber-700">{formatVND(order.totalAmount)}</p>
                  <p className="text-sm text-slate-500 mt-1">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Cảnh báo tồn kho</h2>
              <p className="text-sm text-slate-400">Sản phẩm còn từ 5 đơn vị trở xuống.</p>
            </div>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có sản phẩm nào cần cảnh báo.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                  <p className="font-medium text-slate-800">{product.name}</p>
                  <p className="text-sm text-slate-500 mt-1">{product.category?.name || "Chưa phân loại"}</p>
                  <p className="text-sm font-semibold text-red-600 mt-2">Còn {product.stock} sản phẩm</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-amber-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Thông báo hệ thống</h2>
            <p className="text-sm text-slate-400">Lịch sử email, SMS và thông báo nội bộ gần nhất.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentNotifications.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có thông báo nào được ghi nhận.</p>
          ) : (
            recentNotifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-800">{notification.title}</p>
                  <span className="text-[11px] text-slate-400">{notification.channel}</span>
                </div>
                <p className="text-sm text-slate-500 mt-2">{notification.message}</p>
                <p className="text-xs text-slate-400 mt-3">
                  {notification.recipient.fullName || notification.recipient.email}
                </p>
                <p className="text-xs text-slate-400 mt-1">{formatDate(notification.sentAt)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
