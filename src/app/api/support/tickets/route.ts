import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportTicketSchema } from "@/lib/validators";
import { canManageSupport, getSupportStaffIds, notifySupportUpdate } from "@/lib/support";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const role = session.user.role || "";
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const where: Record<string, unknown> = canManageSupport(role)
    ? {}
    : { userId: session.user.id };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { category: { contains: search } },
      { id: { contains: search } },
    ];
  }

  const tickets = await prisma.supportTicket.findMany({
    where,
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
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
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      ...ticket,
      assignee: ticket.assignedTo,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const parsed = supportTicketSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const { subject, category, message } = parsed.data;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: session.user.id,
      subject,
      category,
      status: "OPEN",
      replies: {
        create: {
          senderId: session.user.id,
          message,
        },
      },
    },
    include: {
      user: {
        select: { id: true, fullName: true, email: true },
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

  const supportRecipientIds = await getSupportStaffIds(session.user.id);
  await notifySupportUpdate({
    ticketId: ticket.id,
    subject: ticket.subject,
    recipientIds: supportRecipientIds,
    senderId: session.user.id,
    message: "Có ticket hỗ trợ mới cần xử lý.",
  });

  return NextResponse.json(
    {
      ticket: {
        ...ticket,
        assignee: ticket.assignedTo,
      },
    },
    { status: 201 }
  );
}
