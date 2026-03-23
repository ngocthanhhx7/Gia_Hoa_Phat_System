# Gia Hoa Phat System

Hệ thống e-commerce cho nguyên liệu và dụng cụ làm bánh, phát triển trên Next.js App Router + NextAuth + Prisma + SQLite.

## Tính năng chính

- Xác thực tài khoản theo role `CUSTOMER`, `ADMIN`, `STAFF`, `VENDOR`, `DELIVERY`
- Danh mục, danh sách sản phẩm, chi tiết sản phẩm
- Giỏ hàng, checkout, voucher, đơn hàng, thanh toán, giao hàng
- Purchase history và tracking timeline cho customer
- Feedback/review theo rule `1 review / product / order`
- Contact support với ticket + reply thread
- Delivery portal và phân công giao hàng cho `ADMIN` + `STAFF`
- AI chatbot hỗ trợ FAQ hệ thống, có fallback nội bộ nếu chưa cấu hình Gemini
- Notifications nội bộ và smoke tests bằng Playwright

## Cài đặt local

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env.local` từ `.env.example`.

3. Cấu hình tối thiểu:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-long-random-secret"
AUTH_URL="http://localhost:3000"
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-3.1-flash-lite-preview"
```

4. Đồng bộ schema và seed dữ liệu:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Chạy ứng dụng:

```bash
npm run dev
```

## Tài khoản seed

- Admin: `admin@giahoophat.vn` / `Admin@2024`
- Staff: `nhanvien@giahoophat.vn` / `Staff@2024`
- Customer: `khachhang@gmail.com` / `Customer@2024`
- Delivery: `giaohang@giahoophat.vn` / `Delivery@2024`

## Cách test nhanh các flow mới

### Staff assign delivery

1. Đăng nhập bằng staff.
2. Vào `/admin/orders`.
3. Xác nhận hoặc chuyển đơn sang `PROCESSING`.
4. Chọn nhân viên giao hàng role `DELIVERY`, nhập đơn vị vận chuyển và mã vận đơn.
5. Bấm `Lưu giao hàng`.

### Order history + tracking

1. Đăng nhập customer.
2. Vào `/orders`.
3. Lọc theo trạng thái, tìm theo mã đơn hoặc chọn khoảng ngày.
4. Mở chi tiết một đơn rồi chuyển sang tab `Tracking`.

### Feedback

1. Đăng nhập customer.
2. Mở một đơn `DELIVERED` trong `/orders`.
3. Vào tab `Feedback`.
4. Gửi đánh giá cho sản phẩm chưa review.
5. Mở lại product detail để xem review công khai.

### Contact support

Customer:
- Vào `/support`
- Tạo ticket mới
- Mở ticket để xem thread và gửi phản hồi tiếp

Staff/Admin:
- Vào `/admin/support`
- Lọc ticket, phân công người xử lý, đổi trạng thái
- Mở chi tiết ticket để trả lời

### Chatbot

- Widget nổi xuất hiện trên khu vực shop/auth
- Trang đầy đủ tại `/support/assistant`
- Nếu thiếu `GEMINI_API_KEY`, hệ thống tự dùng FAQ/fallback nội bộ

## Smoke test

Chạy Playwright smoke suite:

```bash
npm run e2e
```

Suite hiện cover:

- login admin/customer/delivery
- customer checkout
- staff assign delivery
- delivery cập nhật `SHIPPING -> DELIVERED`
- customer xem purchase history + tracking
- customer gửi feedback
- support ticket flow
- chatbot FAQ flow

## Build và kiểm tra chất lượng

```bash
npx tsc --noEmit
npx eslint src tests playwright.config.ts --max-warnings=999
npm run build
```

## Ghi chú Gemini

- Không hard-code API key vào source code.
- Chỉ cấu hình `GEMINI_API_KEY` trong `.env.local` hoặc secret manager.
- Nếu key đã từng bị lộ ở nơi khác, nên rotate trước khi dùng trong môi trường thật.
