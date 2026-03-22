import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/cart — get current user's cart items
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              salePrice: true,
              stock: true,
              images: true,
              unit: true,
              active: true,
            },
          },
        },
      },
    },
  });

  const items = (cart?.items || []).map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
  }));

  // Calculate totals
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => {
    const price = i.product.salePrice ?? i.product.price;
    return sum + price * i.quantity;
  }, 0);

  return NextResponse.json({ items, totalItems, totalAmount });
}

// POST /api/cart — add item to cart
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json();
  const { productId, quantity = 1 } = body;

  if (!productId) {
    return NextResponse.json({ error: "Thiếu mã sản phẩm" }, { status: 400 });
  }

  // Check product exists and is active
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) {
    return NextResponse.json({ error: "Sản phẩm không tồn tại hoặc đã ngưng bán" }, { status: 404 });
  }

  // Check stock (BR11)
  if (product.stock < quantity) {
    return NextResponse.json({ error: `Chỉ còn ${product.stock} sản phẩm trong kho` }, { status: 400 });
  }

  // Get or create cart
  let cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId: session.user.id } });
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    // Max 50 per product (BR8)
    if (newQty > 50) {
      return NextResponse.json({ error: "Tối đa 50 sản phẩm mỗi loại (BR8)" }, { status: 400 });
    }
    if (newQty > product.stock) {
      return NextResponse.json({ error: `Chỉ còn ${product.stock} sản phẩm trong kho` }, { status: 400 });
    }
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  } else {
    if (quantity > 50) {
      return NextResponse.json({ error: "Tối đa 50 sản phẩm mỗi loại (BR8)" }, { status: 400 });
    }
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity },
    });
  }

  // Update last activity
  await prisma.cart.update({
    where: { id: cart.id },
    data: { lastActivity: new Date() },
  });

  return NextResponse.json({ success: true, message: "Đã thêm vào giỏ hàng" });
}

// PUT /api/cart — update item quantity
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await req.json();
  const { itemId, quantity } = body;

  if (!itemId || quantity === undefined) {
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== session.user.id) {
    return NextResponse.json({ error: "Không tìm thấy sản phẩm trong giỏ" }, { status: 404 });
  }

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true, message: "Đã xóa sản phẩm khỏi giỏ" });
  }

  if (quantity > 50) {
    return NextResponse.json({ error: "Tối đa 50 sản phẩm mỗi loại (BR8)" }, { status: 400 });
  }

  if (quantity > item.product.stock) {
    return NextResponse.json({ error: `Chỉ còn ${item.product.stock} sản phẩm trong kho` }, { status: 400 });
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  return NextResponse.json({ success: true, message: "Đã cập nhật số lượng" });
}

// DELETE /api/cart — remove item or clear cart
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");

  const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
  if (!cart) {
    return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 404 });
  }

  if (itemId) {
    // Delete single item
    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item || item.cartId !== cart.id) {
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
    }
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true, message: "Đã xóa sản phẩm" });
  } else {
    // Clear all items
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return NextResponse.json({ success: true, message: "Đã xóa toàn bộ giỏ hàng" });
  }
}
