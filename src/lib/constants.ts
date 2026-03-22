// System messages from SRS (MSG01–MSG15)
export const MESSAGES = {
  MSG01: "Đăng ký thành công! Vui lòng đăng nhập.",
  MSG02: "Email đã tồn tại trong hệ thống.",
  MSG03: "Đăng nhập thành công!",
  MSG04: "Email hoặc mật khẩu không đúng.",
  MSG05: "Tài khoản đã bị khóa. Vui lòng thử lại sau 30 phút.",
  MSG06: "Sản phẩm đã được thêm vào giỏ hàng.",
  MSG07: "Số lượng vượt quá tồn kho hiện có.",
  MSG08: "Đặt hàng thành công! Mã đơn hàng: {orderCode}",
  MSG09: "Giá trị đơn hàng tối thiểu là 50.000 VND.",
  MSG10: "Thanh toán thành công!",
  MSG11: "Thanh toán thất bại. Vui lòng thử lại.",
  MSG12: "Mã giảm giá không hợp lệ hoặc đã hết hạn.",
  MSG13: "Cập nhật thông tin thành công!",
  MSG14: "Đơn hàng đã được hủy thành công.",
  MSG15: "Không thể hủy đơn hàng ở trạng thái hiện tại.",
} as const;

// Business rules constants
export const BUSINESS_RULES = {
  MAX_FAILED_LOGINS: 6,          // BR4: Lock after 6 failures
  LOCK_DURATION_MINUTES: 30,      // BR3: Lock for 30 minutes
  MAX_CART_QUANTITY: 50,           // BR8: Max 50 per product in cart
  MIN_ORDER_VALUE: 50000,         // BR10: Minimum order 50,000 VND
  CART_EXPIRY_DAYS: 7,            // BR12: Cart auto-expire after 7 days
} as const;

// VND currency formatter
export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Generate order code: GHP-YYYYMMDD-XXX
export function generateOrderCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `GHP-${date}-${random}`;
}

export function formatSystemMessage(
  message: string,
  values: Record<string, string | number>
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message
  );
}
