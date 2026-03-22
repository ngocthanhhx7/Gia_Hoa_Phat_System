import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/users/[id] – Update user role or unlock account
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, unlock } = body as { role?: string; unlock?: boolean };

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (role && ["ADMIN", "VENDOR", "CUSTOMER", "STAFF", "DELIVERY"].includes(role)) {
    updateData.role = role;
  }
  if (unlock) {
    updateData.failedLogins = 0;
    updateData.lockedUntil = null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, email: true, fullName: true, role: true },
  });

  return NextResponse.json({ message: "Cập nhật thành công.", user: updated });
}

// DELETE /api/admin/users/[id] – Delete user
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Không thể xóa chính mình." },
      { status: 400 }
    );
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ message: "Đã xóa người dùng." });
}
