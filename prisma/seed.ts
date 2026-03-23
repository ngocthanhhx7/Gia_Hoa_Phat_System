import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Gia Hoa Phat database...");

  await prisma.notificationLog.deleteMany();
  await prisma.supportReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderDetail.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.order.deleteMany();
  console.log("Cleared transactional data");

  const adminPassword = await bcrypt.hash("Admin@2024", 10);
  const customerPassword = await bcrypt.hash("Customer@2024", 10);
  const staffPassword = await bcrypt.hash("Staff@2024", 10);
  const deliveryPassword = await bcrypt.hash("Delivery@2024", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@giahoophat.vn" },
    update: {
      password: adminPassword,
      fullName: "Quản Trị Viên",
      phone: "0901234567",
      role: "ADMIN",
      emailVerified: true,
      failedLogins: 0,
      lockedUntil: null,
    },
    create: {
      email: "admin@giahoophat.vn",
      password: adminPassword,
      fullName: "Quản Trị Viên",
      phone: "0901234567",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "khachhang@gmail.com" },
    update: {
      password: customerPassword,
      fullName: "Nguyễn Văn A",
      phone: "0912345678",
      address: "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
      role: "CUSTOMER",
      emailVerified: true,
      failedLogins: 0,
      lockedUntil: null,
    },
    create: {
      email: "khachhang@gmail.com",
      password: customerPassword,
      fullName: "Nguyễn Văn A",
      phone: "0912345678",
      address: "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "nhanvien@giahoophat.vn" },
    update: {
      password: staffPassword,
      fullName: "Trần Thị B",
      phone: "0987654321",
      role: "STAFF",
      emailVerified: true,
      failedLogins: 0,
      lockedUntil: null,
    },
    create: {
      email: "nhanvien@giahoophat.vn",
      password: staffPassword,
      fullName: "Trần Thị B",
      phone: "0987654321",
      role: "STAFF",
      emailVerified: true,
    },
  });

  const deliveryUser = await prisma.user.upsert({
    where: { email: "giaohang@giahoophat.vn" },
    update: {
      password: deliveryPassword,
      fullName: "Lê Văn Giao",
      phone: "0977777777",
      role: "DELIVERY",
      emailVerified: true,
      failedLogins: 0,
      lockedUntil: null,
    },
    create: {
      email: "giaohang@giahoophat.vn",
      password: deliveryPassword,
      fullName: "Lê Văn Giao",
      phone: "0977777777",
      role: "DELIVERY",
      emailVerified: true,
    },
  });

  console.log("Seeded users:", admin.email, customer.email, staff.email, deliveryUser.email);

  const catIngredients = await prisma.category.upsert({
    where: { slug: "nguyen-lieu-lam-banh" },
    update: {},
    create: {
      name: "Nguyên liệu làm bánh",
      slug: "nguyen-lieu-lam-banh",
      image: "/images/categories/ingredients.jpg",
    },
  });

  const catEquipment = await prisma.category.upsert({
    where: { slug: "dung-cu-lam-banh" },
    update: {},
    create: {
      name: "Dụng cụ làm bánh",
      slug: "dung-cu-lam-banh",
      image: "/images/categories/equipment.jpg",
    },
  });

  const catFlour = await prisma.category.upsert({
    where: { slug: "bot-lam-banh" },
    update: {},
    create: {
      name: "Bột làm bánh",
      slug: "bot-lam-banh",
      parentId: catIngredients.id,
    },
  });

  const catChocolate = await prisma.category.upsert({
    where: { slug: "socola-cacao" },
    update: {},
    create: {
      name: "Sô-cô-la & Cacao",
      slug: "socola-cacao",
      parentId: catIngredients.id,
    },
  });

  const catMolds = await prisma.category.upsert({
    where: { slug: "khuon-banh" },
    update: {},
    create: {
      name: "Khuôn bánh",
      slug: "khuon-banh",
      parentId: catEquipment.id,
    },
  });

  const catTools = await prisma.category.upsert({
    where: { slug: "dung-cu-trang-tri" },
    update: {},
    create: {
      name: "Dụng cụ trang trí",
      slug: "dung-cu-trang-tri",
      parentId: catEquipment.id,
    },
  });

  const productSeeds = [
    {
      name: "Bột mì đa dụng Bakers' Choice 1kg",
      slug: "bot-mi-da-dung-bakers-1kg",
      description: "Bột mì đa dụng cho bánh mì, bánh ngọt và bánh quy.",
      type: "ingredient",
      unit: "kg",
      price: 45000,
      stock: 200,
      images: JSON.stringify(["/images/products/bot-mi-1.jpg"]),
      featured: true,
      categoryId: catFlour.id,
    },
    {
      name: "Bột mì làm bánh cao cấp 500g",
      slug: "bot-mi-cao-cap-500g",
      description: "Bột siêu mịn cho bánh bông lan và bánh kem.",
      type: "ingredient",
      unit: "gói",
      price: 35000,
      stock: 150,
      images: JSON.stringify(["/images/products/bot-mi-2.jpg"]),
      categoryId: catFlour.id,
    },
    {
      name: "Sô-cô-la đen 70% cacao Callebaut 1kg",
      slug: "socola-den-70-callebaut-1kg",
      description: "Sô-cô-la cao cấp phù hợp làm ganache và truffle.",
      type: "ingredient",
      unit: "kg",
      price: 320000,
      salePrice: 285000,
      stock: 80,
      images: JSON.stringify(["/images/products/socola-1.jpg"]),
      featured: true,
      categoryId: catChocolate.id,
    },
    {
      name: "Bột cacao nguyên chất 250g",
      slug: "bot-cacao-nguyen-chat-250g",
      description: "Bột cacao nguyên chất không đường, màu đậm.",
      type: "ingredient",
      unit: "hộp",
      price: 75000,
      stock: 120,
      images: JSON.stringify(["/images/products/cacao-1.jpg"]),
      categoryId: catChocolate.id,
    },
    {
      name: "Khuôn bánh silicon 12 lỗ",
      slug: "khuon-banh-silicon-12-lo",
      description: "Khuôn silicon chống dính, chịu nhiệt cao.",
      type: "equipment",
      unit: "cái",
      price: 89000,
      stock: 60,
      images: JSON.stringify(["/images/products/khuon-1.jpg"]),
      featured: true,
      categoryId: catMolds.id,
    },
    {
      name: "Bộ đuôi bắt kem 24 đầu inox",
      slug: "bo-duoi-bat-kem-24-dau",
      description: "Bộ 24 đầu bắt kem cho nhiều kiểu trang trí.",
      type: "equipment",
      unit: "bộ",
      price: 145000,
      salePrice: 125000,
      stock: 45,
      images: JSON.stringify(["/images/products/duoi-kem-1.jpg"]),
      categoryId: catTools.id,
    },
    {
      name: "Bơ lạt Anchor 227g",
      slug: "bo-lat-anchor-227g",
      description: "Bơ lạt nhập khẩu cho buttercream và pastry.",
      type: "ingredient",
      unit: "thanh",
      price: 65000,
      stock: 100,
      images: JSON.stringify(["/images/products/bo-1.jpg"]),
      featured: true,
      categoryId: catIngredients.id,
    },
    {
      name: "Whipping Cream Anchor 1L",
      slug: "whipping-cream-anchor-1l",
      description: "Kem tươi dễ đánh bông, hương vị béo mượt.",
      type: "ingredient",
      unit: "hộp",
      price: 95000,
      stock: 75,
      images: JSON.stringify(["/images/products/cream-1.jpg"]),
      categoryId: catIngredients.id,
    },
    {
      name: "Máy đánh trứng cầm tay 5 tốc độ",
      slug: "may-danh-trung-cam-tay",
      description: "Máy đánh trứng 300W nhỏ gọn, dễ dùng.",
      type: "equipment",
      unit: "cái",
      price: 250000,
      salePrice: 199000,
      stock: 30,
      images: JSON.stringify(["/images/products/may-danh-trung-1.jpg"]),
      categoryId: catEquipment.id,
    },
    {
      name: "Cân điện tử nhà bếp 5kg",
      slug: "can-dien-tu-nha-bep-5kg",
      description: "Cân điện tử độ chính xác 1g, màn hình LCD.",
      type: "equipment",
      unit: "cái",
      price: 120000,
      stock: 55,
      images: JSON.stringify(["/images/products/can-1.jpg"]),
      categoryId: catEquipment.id,
    },
  ];

  const productMap = new Map<string, Awaited<ReturnType<typeof prisma.product.upsert>>>();
  for (const productSeed of productSeeds) {
    const product = await prisma.product.upsert({
      where: { slug: productSeed.slug },
      update: productSeed,
      create: productSeed,
    });
    productMap.set(product.slug, product);
  }
  console.log("Seeded products:", productMap.size);

  await prisma.voucher.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "Giảm 10% cho khách hàng mới",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 100000,
      maxUses: 1000,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2026-12-31"),
    },
  });

  await prisma.voucher.upsert({
    where: { code: "GIAM50K" },
    update: {},
    create: {
      code: "GIAM50K",
      description: "Giảm 50.000đ cho đơn từ 300.000đ",
      discountType: "FIXED",
      discountValue: 50000,
      minOrderValue: 300000,
      maxUses: 500,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2026-12-31"),
    },
  });

  const deliveredOrder = await prisma.order.create({
    data: {
      code: "GHP-20260320-101",
      userId: customer.id,
      status: "DELIVERED",
      totalAmount: 524000,
      shippingFee: 0,
      discount: 50000,
      address: customer.address || "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
      phone: customer.phone || "0912345678",
      note: "Gọi trước khi giao",
      voucherCode: "GIAM50K",
      createdAt: new Date("2026-03-20T08:30:00.000Z"),
      updatedAt: new Date("2026-03-21T10:30:00.000Z"),
      details: {
        create: [
          {
            productId: productMap.get("socola-den-70-callebaut-1kg")!.id,
            quantity: 1,
            unitPrice: 285000,
          },
          {
            productId: productMap.get("whipping-cream-anchor-1l")!.id,
            quantity: 2,
            unitPrice: 95000,
          },
          {
            productId: productMap.get("khuon-banh-silicon-12-lo")!.id,
            quantity: 1,
            unitPrice: 89000,
          },
        ],
      },
      payment: {
        create: {
          method: "COD",
          amount: 524000,
          status: "SUCCESS",
          paidAt: new Date("2026-03-21T10:30:00.000Z"),
        },
      },
      delivery: {
        create: {
          status: "DELIVERED",
          carrier: "Giao Hàng Nhanh",
          trackingCode: "GHN-DEMO-001",
          deliveredAt: new Date("2026-03-21T10:30:00.000Z"),
          assigneeId: deliveryUser.id,
        },
      },
    },
    include: {
      details: true,
    },
  });

  await prisma.order.create({
    data: {
      code: "GHP-20260322-202",
      userId: customer.id,
      status: "PROCESSING",
      totalAmount: 264000,
      shippingFee: 30000,
      discount: 0,
      address: customer.address || "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
      phone: customer.phone || "0912345678",
      note: null,
      createdAt: new Date("2026-03-22T07:45:00.000Z"),
      updatedAt: new Date("2026-03-22T11:00:00.000Z"),
      details: {
        create: [
          {
            productId: productMap.get("bo-duoi-bat-kem-24-dau")!.id,
            quantity: 1,
            unitPrice: 125000,
          },
          {
            productId: productMap.get("can-dien-tu-nha-bep-5kg")!.id,
            quantity: 1,
            unitPrice: 120000,
          },
        ],
      },
      payment: {
        create: {
          method: "COD",
          amount: 264000,
          status: "PENDING",
        },
      },
      delivery: {
        create: {
          status: "PREPARING",
          carrier: "Giao Hàng Nhanh",
          trackingCode: "GHN-DEMO-002",
          assigneeId: deliveryUser.id,
        },
      },
    },
  });

  await prisma.feedback.create({
    data: {
      userId: customer.id,
      productId: productMap.get("socola-den-70-callebaut-1kg")!.id,
      orderId: deliveredOrder.id,
      rating: 5,
      comment: "Sô-cô-la rất thơm, dễ temper và đóng gói cẩn thận.",
      isVisible: true,
      createdAt: new Date("2026-03-21T12:00:00.000Z"),
      updatedAt: new Date("2026-03-21T12:00:00.000Z"),
    },
  });

  const openTicket = await prisma.supportTicket.create({
    data: {
      userId: customer.id,
      subject: "Cần hỗ trợ đổi địa chỉ giao hàng",
      category: "DELIVERY",
      status: "IN_PROGRESS",
      assignedToId: staff.id,
      createdAt: new Date("2026-03-22T03:00:00.000Z"),
      updatedAt: new Date("2026-03-22T06:30:00.000Z"),
      replies: {
        create: [
          {
            senderId: customer.id,
            message: "Mình muốn đổi địa chỉ giao hàng cho đơn đang chuẩn bị.",
            createdAt: new Date("2026-03-22T03:00:00.000Z"),
          },
          {
            senderId: staff.id,
            message: "Bên mình đã tiếp nhận. Bạn vui lòng xác nhận lại địa chỉ mới trong phản hồi tiếp theo.",
            createdAt: new Date("2026-03-22T06:30:00.000Z"),
          },
        ],
      },
    },
  });

  await prisma.supportTicket.create({
    data: {
      userId: customer.id,
      subject: "Hướng dẫn kiểm tra lịch sử đơn hàng",
      category: "ACCOUNT",
      status: "RESOLVED",
      assignedToId: admin.id,
      createdAt: new Date("2026-03-21T02:00:00.000Z"),
      updatedAt: new Date("2026-03-21T04:00:00.000Z"),
      replies: {
        create: [
          {
            senderId: customer.id,
            message: "Mình muốn xem lại các đơn đã mua nhưng chưa rõ vào đâu.",
            createdAt: new Date("2026-03-21T02:00:00.000Z"),
          },
          {
            senderId: admin.id,
            message: "Bạn đăng nhập rồi vào mục Đơn hàng để xem lịch sử mua hàng và tracking từng đơn.",
            createdAt: new Date("2026-03-21T04:00:00.000Z"),
          },
        ],
      },
    },
  });

  console.log("Seeded sample delivered order:", deliveredOrder.code);
  console.log("Seeded sample support ticket:", openTicket.subject);
  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
