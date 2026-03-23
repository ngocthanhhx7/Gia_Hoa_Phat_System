import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOrderTrackingTimeline } from "@/lib/order-tracking";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      payment: true,
      delivery: {
        include: {
          assignee: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  }

  const role = session.user.role || "";
  const canAccess =
    ["ADMIN", "STAFF", "VENDOR"].includes(role) ||
    (role === "DELIVERY" && order.delivery?.assigneeId === session.user.id) ||
    order.userId === session.user.id;

  if (!canAccess) {
    return NextResponse.json({ error: "Không có quyền xem tracking đơn hàng này" }, { status: 403 });
  }

  return NextResponse.json({
    orderId: order.id,
    code: order.code,
    status: order.status,
    delivery: order.delivery,
    payment: order.payment,
    timeline: buildOrderTrackingTimeline(order),
  });
}
