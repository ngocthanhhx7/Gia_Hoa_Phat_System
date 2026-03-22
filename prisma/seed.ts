import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin User ──────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@2024", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@giahoophat.vn" },
    update: {},
    create: {
      email: "admin@giahoophat.vn",
      password: adminPassword,
      fullName: "Quản Trị Viên",
      phone: "0901234567",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("✅ Admin:", admin.email);

  // ─── Customer User ──────────────────────────────────────────────────────────
  const customerPassword = await bcrypt.hash("Customer@2024", 10);
  const customer = await prisma.user.upsert({
    where: { email: "khachhang@gmail.com" },
    update: {},
    create: {
      email: "khachhang@gmail.com",
      password: customerPassword,
      fullName: "Nguyễn Văn A",
      phone: "0912345678",
      address: "123 Nguyễn Văn Cừ, Q.5, TP.HCM",
      role: "CUSTOMER",
      emailVerified: true,
    },
  });
  console.log("✅ Customer:", customer.email);

  // ─── Staff User ──────────────────────────────────────────────────────────────
  const staffPassword = await bcrypt.hash("Staff@2024", 10);
  const staff = await prisma.user.upsert({
    where: { email: "nhanvien@giahoophat.vn" },
    update: {},
    create: {
      email: "nhanvien@giahoophat.vn",
      password: staffPassword,
      fullName: "Trần Thị B",
      phone: "0987654321",
      role: "STAFF",
      emailVerified: true,
    },
  });
  console.log("✅ Staff:", staff.email);

  // ─── Categories ──────────────────────────────────────────────────────────────
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

  console.log("✅ Categories created");

  // ─── Products ────────────────────────────────────────────────────────────────
  const products = [
    {
      name: "Bột mì đa dụng Bakers' Choice 1kg",
      slug: "bot-mi-da-dung-bakers-1kg",
      description: "Bột mì đa dụng chất lượng cao, thích hợp làm bánh mì, bánh ngọt, bánh quy. Hàm lượng protein 10-12%.",
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
      description: "Bột mì siêu mịn, độ nở cao, chuyên dùng cho bánh kem, bánh bông lan.",
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
      description: "Sô-cô-la đen Bỉ cao cấp, hàm lượng cacao 70%. Thích hợp làm ganache, truffle, coating.",
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
      description: "Bột cacao tự nhiên không đường, màu đậm, hương thơm đặc trưng.",
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
      description: "Khuôn silicon chịu nhiệt cao -40°C đến 230°C, dễ tháo khuôn, không dính. 12 lỗ tròn.",
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
      description: "Bộ 24 đầu bắt kem inox 304 cao cấp kèm túi bắt silicone. Đa dạng hoa văn trang trí.",
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
      description: "Bơ lạt nhập khẩu New Zealand, béo 82%, thích hợp làm bánh croissant, buttercream.",
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
      description: "Kem tươi Anchor 35.5% béo, đánh bông tốt, vị béo ngậy tự nhiên.",
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
      description: "Máy đánh trứng 300W, 5 mức tốc độ, 2 que đánh inox. Nhỏ gọn, dễ sử dụng.",
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
      description: "Cân điện tử độ chính xác 1g, màn hình LCD. Chuyển đổi đơn vị g/oz/ml/lb.",
      type: "equipment",
      unit: "cái",
      price: 120000,
      stock: 55,
      images: JSON.stringify(["/images/products/can-1.jpg"]),
      categoryId: catEquipment.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
  }
  console.log(`✅ ${products.length} products created`);

  // ─── Vouchers ────────────────────────────────────────────────────────────────
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
      description: "Giảm 50,000đ cho đơn từ 300,000đ",
      discountType: "FIXED",
      discountValue: 50000,
      minOrderValue: 300000,
      maxUses: 500,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2026-12-31"),
    },
  });
  console.log("✅ Vouchers created");

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
