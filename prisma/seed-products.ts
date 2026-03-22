import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding categories and products...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "bot-mi" },
      update: {},
      create: {
        name: "Bột mì",
        slug: "bot-mi",
      },
    }),
    prisma.category.upsert({
      where: { slug: "nguyen-lieu-banh" },
      update: {},
      create: {
        name: "Nguyên liệu bánh",
        slug: "nguyen-lieu-banh",
      },
    }),
    prisma.category.upsert({
      where: { slug: "dung-cu" },
      update: {},
      create: {
        name: "Dụng cụ",
        slug: "dung-cu",
      },
    }),
    prisma.category.upsert({
      where: { slug: "huong-lieu" },
      update: {},
      create: {
        name: "Hương liệu",
        slug: "huong-lieu",
      },
    }),
    prisma.category.upsert({
      where: { slug: "bao-bi" },
      update: {},
      create: {
        name: "Bao bì",
        slug: "bao-bi",
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample products
  const products = [
    {
      name: "Bột mì đa dụng Gia Hòa Phát 1kg",
      slug: "bot-mi-da-dung-ghp-1kg",
      description: "Bột mì đa dụng chất lượng cao, phù hợp cho các loại bánh ngọt, bánh mì, pizza.",
      type: "ingredient",
      unit: "kg",
      price: 35000,
      salePrice: null,
      stock: 500,
      featured: true,
      active: true,
      categoryId: categories[0].id,
    },
    {
      name: "Bột mì số 13 (bread flour) 1kg",
      slug: "bot-mi-so-13-1kg",
      description: "Bột mì số 13 protein cao, chuyên dùng cho bánh mì.",
      type: "ingredient",
      unit: "kg",
      price: 42000,
      salePrice: 38000,
      stock: 200,
      featured: true,
      active: true,
      categoryId: categories[0].id,
    },
    {
      name: "Bơ lạt President 200g",
      slug: "bo-lat-president-200g",
      description: "Bơ lạt nhập khẩu Pháp, nguyên liệu không thể thiếu cho bánh âu.",
      type: "ingredient",
      unit: "hộp",
      price: 89000,
      salePrice: null,
      stock: 100,
      featured: false,
      active: true,
      categoryId: categories[1].id,
    },
    {
      name: "Đường cát trắng 1kg",
      slug: "duong-cat-trang-1kg",
      description: "Đường cát trắng tinh khiết.",
      type: "ingredient",
      unit: "kg",
      price: 25000,
      salePrice: null,
      stock: 1000,
      featured: false,
      active: true,
      categoryId: categories[1].id,
    },
    {
      name: "Chocolate chip đen 500g",
      slug: "chocolate-chip-den-500g",
      description: "Chocolate chip đen cao cấp, tan chảy mượt mà.",
      type: "ingredient",
      unit: "gói",
      price: 120000,
      salePrice: 105000,
      stock: 80,
      featured: true,
      active: true,
      categoryId: categories[1].id,
    },
    {
      name: "Khuôn bánh Silicon 12 ô",
      slug: "khuon-banh-silicon-12-o",
      description: "Khuôn silicon chịu nhiệt cao cấp, 12 ô tròn.",
      type: "equipment",
      unit: "cái",
      price: 85000,
      salePrice: null,
      stock: 50,
      featured: false,
      active: true,
      categoryId: categories[2].id,
    },
    {
      name: "Máy đánh trứng cầm tay 300W",
      slug: "may-danh-trung-cam-tay-300w",
      description: "Máy đánh trứng cầm tay công suất 300W, 5 tốc độ.",
      type: "equipment",
      unit: "cái",
      price: 450000,
      salePrice: 399000,
      stock: 30,
      featured: true,
      active: true,
      categoryId: categories[2].id,
    },
    {
      name: "Tinh dầu vani nguyên chất 30ml",
      slug: "tinh-dau-vani-nguyen-chat-30ml",
      description: "Tinh dầu vani nguyên chất Madagascar.",
      type: "ingredient",
      unit: "chai",
      price: 75000,
      salePrice: null,
      stock: 150,
      featured: false,
      active: true,
      categoryId: categories[3].id,
    },
    {
      name: "Hộp đựng bánh kraft 20x20cm (50 cái)",
      slug: "hop-dung-banh-kraft-20x20-50cai",
      description: "Hộp giấy kraft thân thiện môi trường.",
      type: "ingredient",
      unit: "bộ",
      price: 250000,
      salePrice: 220000,
      stock: 40,
      featured: false,
      active: true,
      categoryId: categories[4].id,
    },
    {
      name: "Bột cacao Van Houten 500g",
      slug: "bot-cacao-van-houten-500g",
      description: "Bột cacao nguyên chất Van Houten nhập khẩu Hà Lan.",
      type: "ingredient",
      unit: "hộp",
      price: 185000,
      salePrice: null,
      stock: 60,
      featured: true,
      active: true,
      categoryId: categories[1].id,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: prod,
    });
  }

  console.log(`✅ Created ${products.length} products`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
