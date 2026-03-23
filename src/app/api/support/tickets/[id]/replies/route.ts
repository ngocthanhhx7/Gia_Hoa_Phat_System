import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageSupport, notifySupportUpdate } from "@/lib/support";
import { supportReplySchema } from "@/lib/validators";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const parsed = supportReplySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { id } = await params;
  const role = session.user.role || "";
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      subject: true,
      status: true,
      assignedToId: true,
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Không tìm thấy ticket" }, { status: 404 });
  }

  const canManage = canManageSupport(role);
  if (!canManage && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Không có quyền phản hồi ticket này" }, { status: 403 });
  }

  if (!canManage && ticket.status === "CLOSED") {
    return NextResponse.json({ error: "Ticket đã đóng, bạn không thể phản hồi thêm" }, { status: 400 });
  }

  await prisma.supportReply.create({
    data: {
      ticketId: id,
      senderId: session.user.id,
      message: parsed.data.message,
    },
  });

  const updatedTicket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: canManage ? "WAITING_USER" : "OPEN",
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
      assignedTo: {
        select: { id: true, fullName: true, email: true },
      },
      replies: {
        include: {
          sender: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const recipientIds = canManage
    ? [ticket.userId]
    : [ticket.assignedToId].filter((value): value is string => Boolean(value));

  await notifySupportUpdate({
    ticketId: updatedTicket.id,
    subject: updatedTicket.subject,
    recipientIds,
    senderId: session.user.id,
    message: canManage ? "Ticket hỗ trợ có phản hồi mới từ staff/admin." : "Người dùng đã phản hồi ticket hỗ trợ.",
  });

  return NextResponse.json(
    {
      ticket: {
        ...updatedTicket,
        assignee: updatedTicket.assignedTo,
      },
    },
    { status: 201 }
  );
}
