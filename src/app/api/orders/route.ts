import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MESSAGES } from "@/lib/constants";
import {
  createNotifications,
  getOrderStatusNotification,
  notifyLowStock,
} from "@/lib/notifications";

function generateOrderCode() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 999)
    .toString()
    .padStart(3, "0");
  return `GHP-${dateStr}-${random}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const role = session.user.role || "";
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: Record<string, unknown> = {};
  if (role === "DELIVERY") {
    where.delivery = { assigneeId: session.user.id };
  } else if (!["ADMIN", "STAFF", "VENDOR"].includes(role)) {
    where.userId = session.user.id;
  }

  if (status) {
    where.status = status;
  } else if (role === "DELIVERY") {
    where.status = { in: ["PROCESSING", "SHIPPING", "DELIVERED"] };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        details: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true, unit: true },
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
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json();
  const { address, phone, note, paymentMethod = "COD", voucherCode } = body;

  if (!address || !phone) {
    return NextResponse.json(
      { error: "Vui lòng nhập địa chỉ và số điện thoại giao hàng" },
      { status: 400 }
    );
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 400 });
  }

  for (const item of cart.items) {
    if (!item.product.active) {
      return NextResponse.json(
        { error: `Sản phẩm "${item.product.name}" đã ngưng bán` },
        { status: 400 }
      );
    }
    if (item.quantity > item.product.stock) {
      return NextResponse.json(
        { error: `"${item.product.name}" chỉ còn ${item.product.stock} trong kho` },
        { status: 400 }
      );
    }
  }

  let subtotal = 0;
  const orderDetails = cart.items.map((item) => {
    const unitPrice = item.product.salePrice ?? item.product.price;
    subtotal += unitPrice * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
    };
  });

  let discount = 0;
  if (voucherCode) {
    const voucher = await prisma.voucher.findUnique({ where: { code: voucherCode } });
    const now = new Date();
    if (!voucher || !voucher.active || now < voucher.startDate || now > voucher.endDate) {
      return NextResponse.json(
        { error: "Mã giảm giá không hợp lệ hoặc đã hết hạn" },
        { status: 400 }
      );
    }
    if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json(
        { error: "Mã giảm giá đã hết lượt sử dụng" },
        { status: 400 }
      );
    }
    if (subtotal < voucher.minOrderValue) {
      return NextResponse.json(
        {
          error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString(
            "vi-VN"
          )} đ để sử dụng mã này`,
        },
        { status: 400 }
      );
    }

    discount =
      voucher.discountType === "PERCENTAGE"
        ? Math.round(subtotal * (voucher.discountValue / 100))
        : voucher.discountValue;
    discount = Math.min(discount, subtotal);
  }

  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const totalAmount = subtotal - discount + shippingFee;

  if (subtotal < 50000) {
    return NextResponse.json({ error: MESSAGES.MSG09 }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      code: generateOrderCode(),
      userId: session.user.id,
      status: "PENDING",
      totalAmount,
      shippingFee,
      discount,
      address,
      phone,
      note: note || null,
      voucherCode: voucherCode || null,
      details: {
        create: orderDetails,
      },
      payment: {
        create: {
          method: paymentMethod,
          amount: totalAmount,
          status: "PENDING",
        },
      },
      delivery: {
        create: {
          status: "PREPARING",
        },
      },
    },
    include: {
      details: { include: { product: { select: { name: true } } } },
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

  for (const item of cart.items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  if (voucherCode) {
    await prisma.voucher.update({
      where: { code: voucherCode },
      data: { usedCount: { increment: 1 } },
    });
  }

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const orderCreatedNotice = getOrderStatusNotification("PENDING", order.code);

  await createNotifications([
    {
      ...orderCreatedNotice,
      recipientId: session.user.id,
      channel: "IN_APP",
    },
    {
      ...orderCreatedNotice,
      recipientId: session.user.id,
      channel: "EMAIL",
    },
    ...admins.map((admin) => ({
      type: "ORDER_NEW",
      title: "Có đơn hàng mới",
      message: `Đơn hàng ${order.code} vừa được tạo và cần xác nhận.`,
      recipientId: admin.id,
      channel: "IN_APP" as const,
    })),
  ]);

  await Promise.all(cart.items.map((item) => notifyLowStock(item.productId)));

  return NextResponse.json({ success: true, order }, { status: 201 });
}
