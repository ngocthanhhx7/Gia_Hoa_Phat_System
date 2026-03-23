import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function ensureAdmin(role?: string) {
  return role === "ADMIN";
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function parseUpdateBody(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};

  if (body.code !== undefined) data.code = normalizeCode(String(body.code || ""));
  if (body.description !== undefined) data.description = String(body.description || "").trim() || null;
  if (body.discountType !== undefined) data.discountType = String(body.discountType);
  if (body.discountValue !== undefined) data.discountValue = Number(body.discountValue);
  if (body.minOrderValue !== undefined) data.minOrderValue = Number(body.minOrderValue);
  if (body.maxUses !== undefined) data.maxUses = Number(body.maxUses);
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.startDate !== undefined) data.startDate = new Date(String(body.startDate));
  if (body.endDate !== undefined) data.endDate = new Date(String(body.endDate));

  return data;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !ensureAdmin(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const data = parseUpdateBody(body);

  if (typeof data.code === "string" && !data.code) {
    return NextResponse.json({ error: "Mã voucher là bắt buộc" }, { status: 400 });
  }

  if (
    data.discountType !== undefined &&
    !["PERCENTAGE", "FIXED"].includes(String(data.discountType))
  ) {
    return NextResponse.json({ error: "Loại giảm giá không hợp lệ" }, { status: 400 });
  }

  if (
    data.discountValue !== undefined &&
    (!Number.isFinite(Number(data.discountValue)) || Number(data.discountValue) <= 0)
  ) {
    return NextResponse.json({ error: "Giá trị giảm giá phải lớn hơn 0" }, { status: 400 });
  }

  const voucher = await prisma.voucher.update({
    where: { id },
    data,
  });

  return NextResponse.json(voucher);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !ensureAdmin(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.voucher.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
