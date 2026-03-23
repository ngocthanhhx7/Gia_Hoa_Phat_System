import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createNotifications, getOrderStatusNotification } from "@/lib/notifications";
import { buildOrderTrackingTimeline, canCustomerCancelOrder } from "@/lib/order-tracking";

function canStaffAccess(role?: string) {
  return ["ADMIN", "STAFF", "VENDOR"].includes(role || "");
}

function canAssignDelivery(role?: string) {
  return ["ADMIN", "STAFF"].includes(role || "");
}

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
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              unit: true,
              price: true,
              salePrice: true,
            },
          },
        },
      },
      payment: true,
      delivery: {
        include: {
          assignee: {
            select: { id: true, fullName: true, email: true, phone: true },
          },
        },
      },
      feedbacks: {
        where: { userId: session.user.id },
        select: { productId: true },
      },
      user: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  }

  const role = session.user.role || "";
  const isStaff = canStaffAccess(role);
  const isAssignedDelivery = role === "DELIVERY" && order.delivery?.assigneeId === session.user.id;

  if (!isStaff && !isAssignedDelivery && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Không có quyền xem đơn hàng này" }, { status: 403 });
  }

  const feedbackEligibleItems =
    role === "CUSTOMER" && order.userId === session.user.id && order.status === "DELIVERED"
      ? order.details.map((detail) => ({
          productId: detail.productId,
          orderId: order.id,
          productName: detail.product.name,
          canReview: !order.feedbacks.some((feedback) => feedback.productId === detail.productId),
        }))
      : [];

  return NextResponse.json({
    ...order,
    feedbackEligibleItems,
    trackingTimeline: buildOrderTrackingTimeline(order),
    canCancel:
      role === "CUSTOMER" &&
      order.userId === session.user.id &&
      canCustomerCancelOrder(order.status),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const role = session.user.role || "";
  const { id } = await params;
  const body = (await req.json()) as {
    status?: string;
    assigneeId?: string | null;
    carrier?: string | null;
    trackingCode?: string | null;
  };

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      details: true,
      delivery: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Không tìm thấy đơn hàng" }, { status: 404 });
  }

  const isStaff = canStaffAccess(role);
  const isAssignedDelivery = role === "DELIVERY" && order.delivery?.assigneeId === session.user.id;

  if (!isStaff && !isAssignedDelivery && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Không có quyền" }, { status: 403 });
  }

  const deliveryUpdates: Record<string, unknown> = {};
  const orderUpdates: Record<string, unknown> = {};

  if (body.assigneeId !== undefined || body.carrier !== undefined || body.trackingCode !== undefined) {
    if (!canAssignDelivery(role)) {
      return NextResponse.json({ error: "Không có quyền phân công giao hàng" }, { status: 403 });
    }
    if (["DELIVERED", "CANCELLED"].includes(order.status)) {
      return NextResponse.json({ error: "Không thể cập nhật giao hàng cho đơn đã hoàn tất" }, { status: 400 });
    }

    if (body.assigneeId !== undefined) {
      if (body.assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: body.assigneeId },
          select: { id: true, role: true },
        });
        if (!assignee || assignee.role !== "DELIVERY") {
          return NextResponse.json({ error: "Nhân viên giao hàng không hợp lệ" }, { status: 400 });
        }
      }
      deliveryUpdates.assigneeId = body.assigneeId || null;
    }

    if (body.carrier !== undefined) {
      deliveryUpdates.carrier = body.carrier?.trim() || null;
    }

    if (body.trackingCode !== undefined) {
      deliveryUpdates.trackingCode = body.trackingCode?.trim() || null;
    }
  }

  const nextStatus = body.status;
  if (nextStatus) {
    if (!isStaff && !isAssignedDelivery) {
      if (nextStatus !== "CANCELLED" || !canCustomerCancelOrder(order.status)) {
        return NextResponse.json({ error: "Bạn chỉ có thể hủy đơn hàng trước khi giao hàng" }, { status: 400 });
      }
    }

    const validTransitions: Record<string, string[]> =
      role === "DELIVERY"
        ? {
            PROCESSING: ["SHIPPING"],
            SHIPPING: ["DELIVERED"],
          }
        : {
            PENDING: ["CONFIRMED", "CANCELLED"],
            CONFIRMED: ["PROCESSING", "CANCELLED"],
            PROCESSING: ["SHIPPING", "CANCELLED"],
            SHIPPING: ["DELIVERED"],
            DELIVERED: [],
            CANCELLED: [],
          };

    if (!validTransitions[order.status]?.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Không thể chuyển trạng thái từ ${order.status} sang ${nextStatus}` },
        { status: 400 }
      );
    }

    orderUpdates.status = nextStatus;

    if (nextStatus === "CANCELLED") {
      for (const detail of order.details) {
        await prisma.product.update({
          where: { id: detail.productId },
          data: { stock: { increment: detail.quantity } },
        });
      }
      await prisma.payment.updateMany({
        where: { orderId: id },
        data: { status: "FAILED" },
      });
      deliveryUpdates.status = "FAILED";
    }

    if (nextStatus === "CONFIRMED") {
      await prisma.payment.updateMany({
        where: { orderId: id, method: "COD" },
        data: { status: "PENDING" },
      });
    }

    if (nextStatus === "SHIPPING") {
      deliveryUpdates.status = "IN_TRANSIT";
    }

    if (nextStatus === "DELIVERED") {
      await prisma.payment.updateMany({
        where: { orderId: id },
        data: { status: "SUCCESS", paidAt: new Date() },
      });
      deliveryUpdates.status = "DELIVERED";
      deliveryUpdates.deliveredAt = new Date();
    }
  }

  if (Object.keys(deliveryUpdates).length > 0) {
    await prisma.delivery.update({
      where: { orderId: id },
      data: deliveryUpdates,
    });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: orderUpdates,
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

  if (nextStatus) {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    const notice = getOrderStatusNotification(nextStatus, order.code);
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
      ...(updated.delivery?.assigneeId
        ? [
            {
              type: nextStatus === "DELIVERED" ? "DELIVERY_COMPLETED" : "DELIVERY_UPDATED",
              title: nextStatus === "DELIVERED" ? "Đơn giao thành công" : "Đơn giao hàng đã cập nhật",
              message: `Đơn ${order.code} hiện ở trạng thái ${nextStatus}.`,
              recipientId: updated.delivery.assigneeId,
              senderId: actorId,
              channel: "IN_APP" as const,
            },
          ]
        : []),
    ]);
  }

  return NextResponse.json(updated);
}
