import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sort = searchParams.get("sort") || "newest";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "0");
    const featured = searchParams.get("featured");

    const where: Record<string, unknown> = { active: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (featured === "true") where.featured = true;
    if (minPrice > 0) where.price = { ...(where.price as object || {}), gte: minPrice };
    if (maxPrice > 0) where.price = { ...(where.price as object || {}), lte: maxPrice };

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "price_asc": orderBy.price = "asc"; break;
      case "price_desc": orderBy.price = "desc"; break;
      case "name": orderBy.name = "asc"; break;
      default: orderBy.createdAt = "desc";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
