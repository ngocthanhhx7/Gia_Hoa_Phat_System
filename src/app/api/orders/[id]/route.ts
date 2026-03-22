import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications, getOrderStatusNotification } from "@/lib/notifications";

// GET /api/orders/[id] — get single order
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
      details: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: true, unit: true, price: true, salePrice: true },
          },
        },
      },
      payment: true,
      delivery: true,
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  }

  const isStaff = ["ADMIN", "STAFF", "VENDOR"].includes(session.user.role || "");
  if (!isStaff && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Không có quyền xem đơn hàng này" }, { status: 403 });
  }

  return NextResponse.json(order);
}

// PUT /api/orders/[id] — update order status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { details: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  }

  const isStaff = ["ADMIN", "STAFF", "VENDOR"].includes(session.user.role || "");

  // Customer can only cancel pending orders (UC-C09)
  if (!isStaff) {
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
    }
    if (status !== "CANCELLED") {
      return NextResponse.json({ error: "Bạn chỉ có thể hủy đơn hàng" }, { status: 400 });
    }
    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Chỉ có thể hủy đơn hàng đang chờ xử lý" },
        { status: 400 }
      );
    }
  }

  // Valid status transitions
  const validTransitions: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPING", "CANCELLED"],
    SHIPPING: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Không thể chuyển trạng thái từ ${order.status} sang ${status}` },
      { status: 400 }
    );
  }

  // If cancelling, restore stock
  if (status === "CANCELLED") {
    for (const detail of order.details) {
      await prisma.product.update({
        where: { id: detail.productId },
        data: { stock: { increment: detail.quantity } },
      });
    }
    // Update payment status
    await prisma.payment.updateMany({
      where: { orderId: id },
      data: { status: "FAILED" },
    });
  }

  // If confirmed, update payment for COD
  if (status === "CONFIRMED") {
    await prisma.payment.updateMany({
      where: { orderId: id, method: "COD" },
      data: { status: "PENDING" },
    });
  }

  // If delivered, mark payment as success for COD
  if (status === "DELIVERED") {
    await prisma.payment.updateMany({
      where: { orderId: id },
      data: { status: "SUCCESS", paidAt: new Date() },
    });
    await prisma.delivery.updateMany({
      where: { orderId: id },
      data: { status: "DELIVERED", deliveredAt: new Date() },
    });
  }

  // If shipping, update delivery status
  if (status === "SHIPPING") {
    await prisma.delivery.updateMany({
      where: { orderId: id },
      data: { status: "IN_TRANSIT" },
    });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: { payment: true, delivery: true },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const notice = getOrderStatusNotification(status, order.code);
  const actorId = session.user.id;
  const adminRecipients = admins
    .filter((admin) => admin.id !== order.userId)
    .map((admin) => ({
      type: notice.type,
      title: notice.title,
      message: `${notice.message} Người cập nhật: ${session.user.email || "hệ thống"}.`,
      recipientId: admin.id,
      senderId: actorId,
      channel: "IN_APP" as const,
    }));

  await createNotifications([
    {
      ...notice,
      recipientId: order.userId,
      senderId: actorId,
      channel: "IN_APP",
    },
    {
      ...notice,
      recipientId: order.userId,
      senderId: actorId,
      channel: "EMAIL",
    },
    ...adminRecipients,
  ]);

  return NextResponse.json(updated);
}
