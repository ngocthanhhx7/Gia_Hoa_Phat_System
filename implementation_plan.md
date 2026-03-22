# Gia Hòa Phát — E-commerce System Implementation Plan

Build a full-stack e-commerce platform for **Gia Hòa Phát** (baking ingredients & equipment) based on the [SRS document](file:///c:/Users/nguye/OneDrive%20-%20nguyenngocthanhhx7/Documents/Visual%20Studio%202017/Gia_Hoa_Phat_System/SRS_GiaHoaPhat.docx).

## User Review Required

> [!IMPORTANT]
> **Tech stack choice**: The plan uses **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + NextAuth.js**. If you prefer a different stack (e.g., plain React + Express, or a Vietnamese-centric framework), please say so before I begin.

> [!WARNING]
> **BR1 specifies MD5 for password hashing.** MD5 is cryptographically insecure. I will use **bcrypt** instead (industry standard). If your course/professor explicitly requires MD5, let me know and I'll switch. 

> [!IMPORTANT]
> **Payment gateways (VNPay/MoMo)**: I will build **mock/stub** implementations since real API keys require business registration. The architecture will be ready to swap in real SDKs.

> [!IMPORTANT]
> **Database**: This plan assumes you have PostgreSQL running locally (or I can use SQLite for simplicity). Which do you prefer?

---

## Proposed Changes

### Phase 1 — Project Scaffold & Prisma Schema

#### [NEW] Project initialization

- `npx create-next-app@latest ./` with TypeScript, App Router, ESLint, Tailwind CSS
- Install: `prisma`, `@prisma/client`, `next-auth`, `bcryptjs`, `zod`
- Folder structure:

```
app/
  (auth)/login/page.tsx
  (auth)/register/page.tsx
  (shop)/page.tsx              # Home
  (shop)/products/page.tsx     # Product list
  (shop)/products/[id]/page.tsx
  (shop)/cart/page.tsx
  (shop)/checkout/page.tsx
  (shop)/orders/page.tsx
  (shop)/orders/[id]/page.tsx
  (shop)/profile/page.tsx
  (admin)/dashboard/page.tsx
  (admin)/products/page.tsx
  (admin)/users/page.tsx
  (admin)/orders/page.tsx
  (admin)/reports/page.tsx
  api/auth/[...nextauth]/route.ts
  api/products/route.ts
  api/cart/route.ts
  api/orders/route.ts
  api/payments/route.ts
components/
  Navbar.tsx, Footer.tsx, ProductCard.tsx, CartItem.tsx, OrderTable.tsx, ...
lib/
  prisma.ts, auth.ts, validators.ts
prisma/
  schema.prisma
  seed.ts
```

#### [NEW] [schema.prisma](file:///c:/Users/nguye/OneDrive%20-%20nguyenngocthanhhx7/Documents/Visual%20Studio%202017/Gia_Hoa_Phat_System/prisma/schema.prisma)

All 10 SRS entities mapped:

| SRS Entity | Prisma Model | Key Fields |
|---|---|---|
| UserAccount | `User` | id, email (unique), password, role (CUSTOMER/ADMIN/VENDOR/STAFF/DELIVERY), failedLogins, lockedUntil |
| Customer | embedded in `User` | fullName, phone, address |
| Admin | embedded in `User` (role=ADMIN) | — |
| Product | `Product` | id, name, description, type, unit, images, price, stock, categoryId |
| Category | `Category` | id, name, slug, parentId |
| Order | `Order` | id, code, status, totalAmount, address, userId, createdAt |
| OrderDetail | `OrderDetail` | id, orderId, productId, quantity, unitPrice |
| Cart / CartItem | `Cart` + `CartItem` | userId, lastActivity; productId, quantity |
| Payment | `Payment` | id, orderId, method, transactionCode, amount, status |
| Delivery | `Delivery` | id, orderId, carrier, trackingCode, status, updatedAt |
| NotificationLog | `NotificationLog` | id, type, recipientId, status, sentAt |

Plus: `Voucher` model for discount codes (BR13).

---

### Phase 2 — Authentication & Users

#### [NEW] [app/api/auth/[...nextauth]/route.ts](file:///c:/Users/nguye/OneDrive%20-%20nguyenngocthanhhx7/Documents/Visual%20Studio%202017/Gia_Hoa_Phat_System/app/api/auth/%5B...nextauth%5D/route.ts)

- Credentials provider with bcrypt password check
- Google & Facebook OAuth providers
- Login failure tracking: increment `failedLogins`, lock account for 30 min after 6 failures (BR3, BR4)
- Role-based session (`req.session.user.role`)

#### [NEW] [app/(auth)/register/page.tsx](file:///c:/Users/nguye/OneDrive%20-%20nguyenngocthanhhx7/Documents/Visual%20Studio%202017/Gia_Hoa_Phat_System/app/(auth)/register/page.tsx)

- Registration form with Zod validation (email format, password strength)
- Unique email enforcement (BR2)
- Role selection (Customer vs Vendor)

#### [NEW] [app/(shop)/profile/page.tsx](file:///c:/Users/nguye/OneDrive%20-%20nguyenngocthanhhx7/Documents/Visual%20Studio%202017/Gia_Hoa_Phat_System/app/(shop)/profile/page.tsx)

- Edit fullName, phone, address, email (BR5, BR6)
- Link to order history

#### [NEW] [app/(admin)/users/page.tsx](file:///c:/Users/nguye/OneDrive%20-%20nguyenngocthanhhx7/Documents/Visual%20Studio%202017/Gia_Hoa_Phat_System/app/(admin)/users/page.tsx)

- List all users, assign roles, lock/unlock accounts, reset passwords (UC-A02)

---

### Phase 3 — Products & Categories

#### [NEW] Product API routes

- `GET /api/products` — list with search, filter by category/price/keyword (UC-02)
- `GET /api/products/[id]` — product detail
- `POST/PUT/DELETE /api/products` — admin/vendor CRUD (UC-V03)
- `GET /api/categories` — category list (UC-04)

#### [NEW] Product pages

- Product list page with tabs: Baking Ingredients / Baking Equipment / Sale / News
- Product detail with images, description, price, stock, "Add to Cart" button
- Admin product dashboard (add/edit/delete)

---

### Phase 4 — Shopping Cart & Orders

#### [NEW] Cart API & UI

- `GET/POST/PUT/DELETE /api/cart` — CRUD cart items
- Cart linked to user session (BR7)
- Max 50 per product (BR8)
- Real-time cart icon updates (BR9)
- Auto-expire after 7 days inactivity (BR12)
- Stock validation before add (BR11)

#### [NEW] Order flow

- Checkout page: review cart, enter address, select payment
- Minimum order 50,000 VND (BR10)
- Apply discount code (BR13)
- Order API: `POST /api/orders` — create order, deduct stock
- Order history page with status tracking (UC-C07)
- Cancel order API (UC-C09) — only if status = "Pending"

---

### Phase 5 — Payment & Delivery

#### [NEW] Payment stubs

- `POST /api/payments` — mock VNPay/MoMo flow
- COD option (no gateway needed)
- Payment status: Pending → Success / Failed
- Order confirmed only after successful payment (BR20)

#### [NEW] Delivery tracking

- `POST /api/delivery` — create shipment
- `PUT /api/delivery/[id]` — update status (in transit, delivered, failed)
- Delivery status page for customers and delivery staff

---

### Phase 6 — Notifications & Reports

#### [NEW] NotificationLog system

- Record notifications on order events (BR14, BR15)
- In-app notification bell with unread count
- Mock email sending (console log in dev)

#### [NEW] Admin reports

- Orders by day/week/month
- Revenue summary
- Best-selling products
- Low stock alerts (BR11)

---

### Phase 7 — UI Polish

- Responsive design across all pages (mobile, tablet, desktop)
- Vietnamese locale support for currency (VND formatting)
- Toast notifications using system messages MSG01–MSG15
- Error states, loading states, empty states
- Dark/light mode toggle

---

## Verification Plan

### Automated Tests

Since this is a greenfield project, I will create tests alongside the code:

1. **Prisma schema validation**
   ```bash
   npx prisma validate
   ```
   Verifies schema syntax and relations are correct.

2. **Prisma seed test**
   ```bash
   npx prisma db push && npx prisma db seed
   ```
   Verifies seed data loads without errors.

3. **API route tests** (using the built-in Next.js test approach or a simple script):
   - Registration: POST with valid/invalid/duplicate email
   - Login: correct credentials, wrong password, locked account
   - Products: CRUD operations, search, filter
   - Cart: add, update quantity, remove, stock check
   - Orders: create, cancel, status transitions

### Browser-Based Manual Verification

After each phase, I will use the **browser subagent** to:

1. **Auth flow**: Navigate to `/register`, fill form, submit → verify redirect. Navigate to `/login`, authenticate → verify session and redirect to home.
2. **Product browsing**: Navigate to `/products`, verify list renders with images/prices. Click a product → verify detail page. Use search bar → verify filtered results.
3. **Cart & checkout**: Add products to cart → verify cart icon badge. Go to `/cart` → verify items, update quantity. Proceed to checkout → verify order creation.
4. **Order tracking**: Go to `/orders` → verify order list with statuses.
5. **Admin panel**: Login as admin → verify `/admin/dashboard`, `/admin/products`, `/admin/users` render correctly.

### User Manual Testing

After implementation is complete, you can verify:

1. Open the app at `http://localhost:3000`
2. Register a new account (try both Customer and Vendor roles)
3. Browse products, add items to cart, place an order
4. Check `/orders` page for your new order
5. Log in as admin and verify user/product/order management
