import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MESSAGES } from "@/lib/constants";

// POST /api/vouchers/validate — validate a voucher code
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, subtotal = 0 } = body;

  if (!code) {
    return NextResponse.json({ error: "Vui lòng nhập mã giảm giá" }, { status: 400 });
  }

  const voucher = await prisma.voucher.findUnique({ where: { code } });

  if (!voucher || !voucher.active) {
    return NextResponse.json({ error: MESSAGES.MSG12 }, { status: 404 });
  }

  const now = new Date();
  if (now < voucher.startDate || now > voucher.endDate) {
    return NextResponse.json({ error: MESSAGES.MSG12 }, { status: 400 });
  }

  if (voucher.maxUses > 0 && voucher.usedCount >= voucher.maxUses) {
    return NextResponse.json({ error: MESSAGES.MSG12 }, { status: 400 });
  }

  if (subtotal < voucher.minOrderValue) {
    return NextResponse.json(
      { error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString("vi-VN")} đ` },
      { status: 400 }
    );
  }

  let discount = 0;
  if (voucher.discountType === "PERCENTAGE") {
    discount = Math.round(subtotal * (voucher.discountValue / 100));
  } else {
    discount = voucher.discountValue;
  }
  discount = Math.min(discount, subtotal);

  return NextResponse.json({
    valid: true,
    code: voucher.code,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    discount,
    description: voucher.description,
  });
}
