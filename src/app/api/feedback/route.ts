import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  if (session.user.role !== "CUSTOMER") {
    return NextResponse.json({ error: "Chỉ khách hàng mới có thể gửi đánh giá" }, { status: 403 });
  }

  const parsed = feedbackSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { orderId, productId, rating, comment } = parsed.data;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: session.user.id,
      status: "DELIVERED",
      details: {
        some: {
          productId,
        },
      },
    },
    select: { id: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Bạn chỉ có thể đánh giá sản phẩm từ đơn đã giao" }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({
    where: {
      userId_productId_orderId: {
        userId: session.user.id,
        productId,
        orderId,
      },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Bạn đã đánh giá sản phẩm này trong đơn hàng này" }, { status: 400 });
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: session.user.id,
      productId,
      orderId,
      rating,
      comment,
      isVisible: true,
    },
    include: {
      user: {
        select: { id: true, fullName: true },
      },
      product: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}
