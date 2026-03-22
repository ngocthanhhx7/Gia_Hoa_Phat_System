# Gia Hòa Phát System – Build from SRS

## Phase 1: Project Setup & Backend Foundation
- [x] Initialize Next.js project with TypeScript, Tailwind, SQLite
- [x] Set up project structure (app router, API routes, components, lib)
- [x] Configure Prisma schema with all 10 entities from SRS
- [x] Seed database with sample data (categories + products)

## Phase 2: Authentication & User Management
- [x] Implement registration (Customer/Vendor) with email uniqueness (BR2)
- [x] Implement login with password encryption (BR1), lockout after 6 failures (BR4)
- [x] Google OAuth login flow
- [x] Profile management (UC-C08)
- [x] Admin user management (UC-A02)

## Phase 3: Product & Category Management
- [x] Category API (`/api/categories`)
- [x] Product listing API with search/filter (`/api/products`)
- [x] Product listing page (`/products`) with search, type filters, sale badges
- [x] Product detail page (`/products/[slug]`)
- [x] Product seed data (10 products across 5 categories)
- [x] Admin/Vendor product CRUD (UC-V03)
- [x] Inventory management (UC-A01, UC-V04)

## Phase 4: Shopping Cart & Orders
- [x] Cart API (`/api/cart`) — GET/POST/PUT/DELETE, max 50 items (BR8), stock check (BR11)
- [x] Cart page (`/cart`) with qty ±, remove, clear, order summary
- [x] Place order flow (`/api/orders` POST) with min value check (BR10)
- [x] Discount code validation (`/api/vouchers/validate`) & application (BR13)
- [x] Checkout page (`/checkout`) — shipping, payment, voucher, order placement
- [x] Order status update API (`/api/orders/[id]` PUT) with valid transitions
- [x] Order history page (`/orders`) with status filters
- [x] Order detail page (`/orders/[id]`)
- [x] Cancel order (UC-C09) — customer cancel PENDING, stock restore
- [x] Staff/Vendor order processing (UC-S03, UC-V06, UC-V07)

## Phase 5: Payment & Delivery Integration
- [x] Payment record auto-created with order (COD/VNPay/MoMo/Bank)
- [x] Delivery record auto-created with order
- [x] Payment & delivery status auto-updated on order status changes
- [x] COD payment option

## Phase 6: Notifications & Reports
- [x] Email/SMS notification system (UC-A07, BR14, BR15)
- [x] Admin reports dashboard (UC-A03)
- [x] Low stock alerts

## Phase 7: UI Polish & Verification
- [x] Responsive design for all screens
- [x] System messages (MSG01–MSG15)
- [ ] Browser testing of all major flows
