import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const limit = Number(searchParams.get("limit") || "6");

  const where = {
    recipientId: session.user.id,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { sentAt: "desc" },
      take: limit,
    }),
    prisma.notificationLog.count({
      where: { recipientId: session.user.id, isRead: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    ids?: string[];
    readAll?: boolean;
  };

  if (body.readAll) {
    await prisma.notificationLog.updateMany({
      where: { recipientId: session.user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  }

  if (!body.ids?.length) {
    return NextResponse.json({ error: "Thiếu thông báo cần cập nhật" }, { status: 400 });
  }

  await prisma.notificationLog.updateMany({
    where: {
      recipientId: session.user.id,
      id: { in: body.ids },
    },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
