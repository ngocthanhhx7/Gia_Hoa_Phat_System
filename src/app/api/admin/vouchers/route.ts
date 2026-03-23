import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function parseVoucherBody(body: Record<string, unknown>) {
  const code = normalizeCode(String(body.code || ""));
  const discountType = String(body.discountType || "");
  const discountValue = Number(body.discountValue || 0);
  const minOrderValue = Number(body.minOrderValue || 0);
  const maxUses = Number(body.maxUses || 0);
  const startDate = new Date(String(body.startDate || ""));
  const endDate = new Date(String(body.endDate || ""));

  if (!code) return { error: "Mã voucher là bắt buộc" };
  if (!["PERCENTAGE", "FIXED"].includes(discountType)) {
    return { error: "Loại giảm giá không hợp lệ" };
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: "Giá trị giảm giá phải lớn hơn 0" };
  }
  if (!(startDate instanceof Date) || Number.isNaN(startDate.getTime())) {
    return { error: "Ngày bắt đầu không hợp lệ" };
  }
  if (!(endDate instanceof Date) || Number.isNaN(endDate.getTime())) {
    return { error: "Ngày kết thúc không hợp lệ" };
  }
  if (endDate < startDate) {
    return { error: "Ngày kết thúc phải sau ngày bắt đầu" };
  }

  return {
    data: {
      code,
      description: String(body.description || "").trim() || null,
      discountType,
      discountValue,
      minOrderValue,
      maxUses,
      startDate,
      endDate,
      active: body.active !== false,
    },
  };
}

function ensureAdmin(role?: string) {
  return role === "ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !ensureAdmin(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { code: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const vouchers = await prisma.voucher.findMany({
    where,
    orderBy: [{ active: "desc" }, { endDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ vouchers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session?.user || !ensureAdmin(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as Record<string, unknown>;
  const parsed = parseVoucherBody(body);

  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await prisma.voucher.findUnique({
    where: { code: parsed.data.code },
  });

  if (existing) {
    return NextResponse.json({ error: "Mã voucher đã tồn tại" }, { status: 409 });
  }

  const voucher = await prisma.voucher.create({
    data: parsed.data,
  });

  return NextResponse.json(voucher, { status: 201 });
}
