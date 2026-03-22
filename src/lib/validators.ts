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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
