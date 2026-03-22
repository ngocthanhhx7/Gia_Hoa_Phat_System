import { prisma } from "@/lib/prisma";

type NotificationInput = {
  type: string;
  title: string;
  message: string;
  recipientId: string;
  senderId?: string | null;
  channel?: "IN_APP" | "EMAIL" | "SMS";
};

export async function createNotification({
  type,
  title,
  message,
  recipientId,
  senderId,
  channel = "IN_APP",
}: NotificationInput) {
  const notification = await prisma.notificationLog.create({
    data: {
      type,
      title,
      message,
      recipientId,
      senderId: senderId ?? null,
      channel,
    },
  });

  if (channel !== "IN_APP") {
    console.log(`[${channel}] ${title} -> ${recipientId}: ${message}`);
  }

  return notification;
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) return [];

  return Promise.all(inputs.map((input) => createNotification(input)));
}

export async function notifyLowStock(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, stock: true, active: true },
  });

  if (!product || !product.active || product.stock > 5) {
    return;
  }

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) {
    return;
  }

  await createNotifications(
    admins.map((admin) => ({
      type: "LOW_STOCK",
      title: "Cảnh báo tồn kho thấp",
      message: `${product.name} chỉ còn ${product.stock} sản phẩm trong kho.`,
      recipientId: admin.id,
      channel: "IN_APP",
    }))
  );
}

export function getOrderStatusNotification(status: string, orderCode: string) {
  switch (status) {
    case "PENDING":
      return {
        type: "ORDER_CREATED",
        title: "Đơn hàng đã được tạo",
        message: `Đơn hàng ${orderCode} đã được tạo và đang chờ xử lý.`,
      };
    case "CONFIRMED":
      return {
        type: "ORDER_CONFIRMED",
        title: "Đơn hàng đã được xác nhận",
        message: `Đơn hàng ${orderCode} đã được xác nhận.`,
      };
    case "PROCESSING":
      return {
        type: "ORDER_PROCESSING",
        title: "Đơn hàng đang được chuẩn bị",
        message: `Đơn hàng ${orderCode} đang được đóng gói.`,
      };
    case "SHIPPING":
      return {
        type: "ORDER_SHIPPED",
        title: "Đơn hàng đang được giao",
        message: `Đơn hàng ${orderCode} đã bàn giao cho đơn vị vận chuyển.`,
      };
    case "DELIVERED":
      return {
        type: "ORDER_DELIVERED",
        title: "Đơn hàng đã giao thành công",
        message: `Đơn hàng ${orderCode} đã được giao thành công.`,
      };
    case "CANCELLED":
      return {
        type: "ORDER_CANCELLED",
        title: "Đơn hàng đã bị hủy",
        message: `Đơn hàng ${orderCode} đã được hủy.`,
      };
    default:
      return {
        type: "ORDER_UPDATED",
        title: "Đơn hàng đã được cập nhật",
        message: `Đơn hàng ${orderCode} đã chuyển sang trạng thái ${status}.`,
      };
  }
}
