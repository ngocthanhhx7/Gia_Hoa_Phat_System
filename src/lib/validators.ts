import { z } from "zod";

// ─── Auth Validators ───────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 số")
    .regex(/[^A-Za-z0-9]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z
    .string()
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  role: z.enum(["CUSTOMER", "VENDOR"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

// ─── Product Validators ────────────────────────────────────────────────────────

export const productSchema = z.object({
  name: z.string().min(2, "Tên sản phẩm phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
  type: z.enum(["ingredient", "equipment"]).optional(),
  unit: z.string().optional(),
  price: z.number().positive("Giá phải lớn hơn 0"),
  salePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, "Tồn kho không được âm"),
  categoryId: z.string().optional().nullable(),
  images: z.string().optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});

// ─── Cart Validators ───────────────────────────────────────────────────────────

export const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(50, "Tối đa 50 sản phẩm/loại"),
});

// ─── Order Validators ──────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  address: z.string().min(5, "Vui lòng nhập địa chỉ giao hàng"),
  phone: z.string().regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ"),
  note: z.string().optional(),
  paymentMethod: z.enum(["COD", "VNPAY", "MOMO", "BANK_TRANSFER"]),
  voucherCode: z.string().optional(),
});

// ─── Profile Validators ────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z
    .string()
    .regex(/^(0[3|5|7|8|9])+([0-9]{8})$/, "Số điện thoại không hợp lệ")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
});

export const feedbackSchema = z.object({
  productId: z.string().min(1, "Thiếu sản phẩm"),
  orderId: z.string().min(1, "Thiếu đơn hàng"),
  rating: z.number().int().min(1, "Đánh giá tối thiểu 1 sao").max(5, "Đánh giá tối đa 5 sao"),
  comment: z.string().trim().min(3, "Vui lòng nhập nhận xét").max(1000, "Nhận xét quá dài"),
});

export const supportTicketSchema = z.object({
  subject: z.string().trim().min(5, "Chủ đề phải có ít nhất 5 ký tự").max(120, "Chủ đề quá dài"),
  category: z.enum(["ORDER", "PAYMENT", "DELIVERY", "PRODUCT", "ACCOUNT", "OTHER"]),
  message: z.string().trim().min(10, "Nội dung phải có ít nhất 10 ký tự").max(2000, "Nội dung quá dài"),
});

export const supportReplySchema = z.object({
  message: z.string().trim().min(1, "Vui lòng nhập nội dung phản hồi").max(2000, "Nội dung quá dài"),
});

export const supportTicketUpdateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"]).optional(),
  assignedToId: z.string().nullable().optional(),
});

export const chatbotMessageSchema = z.object({
  message: z.string().trim().min(2, "Tin nhắn quá ngắn").max(1000, "Tin nhắn quá dài"),
  sessionId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type SupportTicketInput = z.infer<typeof supportTicketSchema>;
export type SupportReplyInput = z.infer<typeof supportReplySchema>;
export type SupportTicketUpdateInput = z.infer<typeof supportTicketUpdateSchema>;
export type ChatbotMessageInput = z.infer<typeof chatbotMessageSchema>;
