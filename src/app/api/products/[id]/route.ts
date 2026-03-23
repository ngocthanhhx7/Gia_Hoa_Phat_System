import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        feedbacks: {
          where: { isVisible: true },
          include: {
            user: {
              select: { id: true, fullName: true },
            },
            order: {
              select: { id: true, code: true, createdAt: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product || !product.active) {
      return NextResponse.json(
        { error: "Sản phẩm không tồn tại" },
        { status: 404 }
      );
    }

    // Also fetch related products from same category
    const related = product.categoryId
      ? await prisma.product.findMany({
          where: {
            categoryId: product.categoryId,
            id: { not: product.id },
            active: true,
          },
          take: 4,
          orderBy: { createdAt: "desc" },
        })
      : [];

    const averageRating =
      product.feedbacks.length > 0
        ? product.feedbacks.reduce((total, feedback) => total + feedback.rating, 0) / product.feedbacks.length
        : 0;

    return NextResponse.json({
      product,
      related,
      feedbackStats: {
        averageRating,
        total: product.feedbacks.length,
      },
    });
  } catch (error) {
    console.error("Product detail error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
