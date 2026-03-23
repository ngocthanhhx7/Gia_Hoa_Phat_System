export type ChatbotSourceType = "faq" | "ai" | "fallback";

export type ChatbotFaq = {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  suggestedActions?: { label: string; href: string }[];
};

export const CHATBOT_FAQS: ChatbotFaq[] = [
  {
    id: "buying-guide",
    question: "Làm sao để mua hàng?",
    keywords: ["mua hàng", "đặt hàng", "đặt mua", "cách mua"],
    answer:
      "Bạn vào trang Sản phẩm, chọn mặt hàng phù hợp, thêm vào giỏ, sau đó mở Giỏ hàng và bấm Thanh toán để nhập địa chỉ, số điện thoại và phương thức thanh toán.",
    suggestedActions: [
      { label: "Xem sản phẩm", href: "/products" },
      { label: "Mở giỏ hàng", href: "/cart" },
    ],
  },
  {
    id: "payment-guide",
    question: "Thanh toán như thế nào?",
    keywords: ["thanh toán", "vnpay", "cod", "momo", "chuyển khoản"],
    answer:
      "Hệ thống hỗ trợ COD, VNPay, MoMo và chuyển khoản ngân hàng. Khi checkout, bạn chỉ cần chọn phương thức phù hợp rồi xác nhận đơn hàng.",
    suggestedActions: [{ label: "Thanh toán", href: "/checkout" }],
  },
  {
    id: "order-history",
    question: "Xem lịch sử đơn hàng ở đâu?",
    keywords: ["lịch sử đơn", "đơn hàng của tôi", "xem đơn", "purchase history", "tracking"],
    answer:
      "Sau khi đăng nhập, bạn vào trang Đơn hàng để xem lịch sử mua hàng, lọc theo trạng thái, mở chi tiết và theo dõi timeline giao hàng của từng đơn.",
    suggestedActions: [{ label: "Đơn hàng của tôi", href: "/orders" }],
  },
  {
    id: "feedback-guide",
    question: "Làm sao gửi feedback?",
    keywords: ["feedback", "review", "đánh giá", "nhận xét"],
    answer:
      "Sau khi đơn hàng ở trạng thái Đã giao, bạn có thể mở chi tiết đơn hàng hoặc trang sản phẩm để gửi đánh giá sao và nhận xét cho sản phẩm đã mua.",
    suggestedActions: [{ label: "Xem đơn hàng", href: "/orders" }],
  },
  {
    id: "support-guide",
    question: "Liên hệ support thế nào?",
    keywords: ["support", "hỗ trợ", "ticket", "liên hệ"],
    answer:
      "Bạn vào trang Hỗ trợ để tạo ticket mới, theo dõi phản hồi và tiếp tục trao đổi với staff/admin cho đến khi vấn đề được xử lý.",
    suggestedActions: [
      { label: "Mở hỗ trợ", href: "/support" },
      { label: "Trợ lý hỗ trợ", href: "/support/assistant" },
    ],
  },
  {
    id: "order-status",
    question: "Đơn hàng của tôi đang ở trạng thái nào?",
    keywords: ["trạng thái đơn", "đang giao", "tracking đơn", "đơn hàng của tôi"],
    answer:
      "Bạn mở Đơn hàng của tôi, chọn Xem chi tiết hoặc Theo dõi đơn để xem timeline xử lý, thanh toán và giao hàng của chính đơn đó.",
    suggestedActions: [{ label: "Theo dõi đơn", href: "/orders" }],
  },
];
