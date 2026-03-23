import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [feedbacks, aggregates] = await Promise.all([
    prisma.feedback.findMany({
      where: {
        productId: id,
        isVisible: true,
      },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
        order: {
          select: { id: true, code: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.feedback.aggregate({
      where: {
        productId: id,
        isVisible: true,
      },
      _avg: { rating: true },
      _count: { id: true },
    }),
  ]);

  return NextResponse.json({
    feedbacks,
    stats: {
      averageRating: aggregates._avg.rating || 0,
      total: aggregates._count.id || 0,
    },
  });
}
