type TimelineStatus = "completed" | "current" | "upcoming" | "cancelled";

type OrderTrackingInput = {
  code: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  payment?: {
    status?: string | null;
    method?: string | null;
    paidAt?: Date | string | null;
  } | null;
  delivery?: {
    status?: string | null;
    carrier?: string | null;
    trackingCode?: string | null;
    deliveredAt?: Date | string | null;
    assignee?: {
      fullName?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  } | null;
};

const ORDER_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"] as const;

export function canCustomerCancelOrder(status: string) {
  return ["PENDING", "CONFIRMED", "PROCESSING"].includes(status);
}

function getStepStatus(step: string, currentStatus: string): TimelineStatus {
  if (currentStatus === "CANCELLED") {
    return step === "CANCELLED" ? "cancelled" : "completed";
  }

  const currentIndex = ORDER_FLOW.indexOf(currentStatus as (typeof ORDER_FLOW)[number]);
  const stepIndex = ORDER_FLOW.indexOf(step as (typeof ORDER_FLOW)[number]);

  if (stepIndex < currentIndex) return "completed";
  if (stepIndex === currentIndex) return "current";
  return "upcoming";
}

export function buildOrderTrackingTimeline(order: OrderTrackingInput) {
  const updatedAt = new Date(order.updatedAt);
  const createdAt = new Date(order.createdAt);
  const paidAt = order.payment?.paidAt ? new Date(order.payment.paidAt) : null;
  const deliveredAt = order.delivery?.deliveredAt ? new Date(order.delivery.deliveredAt) : null;

  const timeline = [
    {
      key: "PENDING",
      label: "Đơn hàng đã tạo",
      description: `Đơn ${order.code} đã được tạo thành công.`,
      status: getStepStatus("PENDING", order.status),
      time: createdAt.toISOString(),
    },
    {
      key: "CONFIRMED",
      label: "Đã xác nhận",
      description:
        order.payment?.status === "SUCCESS"
          ? `Thanh toán ${order.payment.method || ""} đã được ghi nhận.`
          : "Đơn hàng đang được hệ thống xác nhận.",
      status: getStepStatus("CONFIRMED", order.status),
      time: paidAt?.toISOString() || (["CONFIRMED", "PROCESSING", "SHIPPING", "DELIVERED"].includes(order.status) ? updatedAt.toISOString() : null),
    },
    {
      key: "PROCESSING",
      label: "Đang chuẩn bị",
      description: "Đơn hàng đang được đóng gói và chuẩn bị bàn giao cho đơn vị vận chuyển.",
      status: getStepStatus("PROCESSING", order.status),
      time: ["PROCESSING", "SHIPPING", "DELIVERED"].includes(order.status) ? updatedAt.toISOString() : null,
    },
    {
      key: "SHIPPING",
      label: "Đang giao hàng",
      description: order.delivery?.trackingCode
        ? `Mã vận đơn ${order.delivery.trackingCode}${order.delivery?.carrier ? ` - ${order.delivery.carrier}` : ""}.`
        : "Đơn hàng đang trên đường giao đến bạn.",
      status: getStepStatus("SHIPPING", order.status),
      time: ["SHIPPING", "DELIVERED"].includes(order.status) ? updatedAt.toISOString() : null,
    },
    {
      key: "DELIVERED",
      label: "Đã giao thành công",
      description: "Đơn hàng đã được giao hoàn tất.",
      status: getStepStatus("DELIVERED", order.status),
      time: deliveredAt?.toISOString() || (order.status === "DELIVERED" ? updatedAt.toISOString() : null),
    },
  ];

  if (order.status === "CANCELLED") {
    timeline.push({
      key: "CANCELLED",
      label: "Đơn hàng đã hủy",
      description: "Đơn hàng đã được hủy và không tiếp tục xử lý giao hàng.",
      status: "cancelled",
      time: updatedAt.toISOString(),
    });
  }

  return timeline;
}
