import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageSupport, notifySupportUpdate } from "@/lib/support";
import { supportTicketUpdateSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { id } = await params;
  const role = session.user.role || "";

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
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

  if (!ticket) {
    return NextResponse.json({ error: "Không tìm thấy ticket" }, { status: 404 });
  }

  if (!canManageSupport(role) && ticket.userId !== session.user.id) {
    return NextResponse.json({ error: "Không có quyền xem ticket này" }, { status: 403 });
  }

  return NextResponse.json({
    ticket: {
      ...ticket,
      assignee: ticket.assignedTo,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const role = session.user.role || "";
  if (!canManageSupport(role)) {
    return NextResponse.json({ error: "Không có quyền cập nhật ticket" }, { status: 403 });
  }

  const parsed = supportTicketUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { id } = await params;
  const existing = await prisma.supportTicket.findUnique({
    where: { id },
    select: { id: true, userId: true, subject: true, assignedToId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy ticket" }, { status: 404 });
  }

  if (parsed.data.assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: { id: parsed.data.assignedToId },
      select: { id: true, role: true },
    });

    if (!assignee || !["ADMIN", "STAFF"].includes(assignee.role)) {
      return NextResponse.json({ error: "Người được gán không hợp lệ" }, { status: 400 });
    }
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.assignedToId !== undefined ? { assignedToId: parsed.data.assignedToId || null } : {}),
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

  const recipientIds = new Set<string>([existing.userId]);
  if (ticket.assignedToId) recipientIds.add(ticket.assignedToId);

  await notifySupportUpdate({
    ticketId: ticket.id,
    subject: ticket.subject,
    recipientIds: Array.from(recipientIds).filter((id) => id !== session.user.id),
    senderId: session.user.id,
    message: "Ticket hỗ trợ đã được cập nhật trạng thái hoặc người xử lý.",
  });

  return NextResponse.json({
    ticket: {
      ...ticket,
      assignee: ticket.assignedTo,
    },
  });
}
