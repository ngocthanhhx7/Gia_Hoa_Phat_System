import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const feedbacks = await prisma.feedback.findMany({
    where: { userId: session.user.id },
    include: {
      product: {
        select: { id: true, name: true, slug: true, images: true },
      },
      order: {
        select: { id: true, code: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feedbacks });
}
