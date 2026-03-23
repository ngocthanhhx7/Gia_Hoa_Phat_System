import { CHATBOT_FAQS } from "@/lib/chatbot/faq-knowledge";

export function findBestFaqMatch(message: string) {
  const normalized = message.toLowerCase();

  let bestMatch = null as (typeof CHATBOT_FAQS)[number] | null;
  let bestScore = 0;

  for (const faq of CHATBOT_FAQS) {
    const score = faq.keywords.reduce((total, keyword) => {
      return normalized.includes(keyword.toLowerCase()) ? total + 1 : total;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = faq;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

export function buildFallbackAnswer(message: string) {
  const faq = findBestFaqMatch(message);
  if (faq) {
    return {
      answer: faq.answer,
      sourceType: "faq" as const,
      suggestedActions: faq.suggestedActions || [],
    };
  }

  return {
    answer:
      "Mình có thể hỗ trợ về mua hàng, thanh toán, lịch sử đơn, feedback và liên hệ support trong hệ thống Gia Hòa Phát. Nếu câu hỏi của bạn cần xử lý cụ thể hơn, hãy tạo ticket hỗ trợ để staff/admin hỗ trợ trực tiếp.",
    sourceType: "fallback" as const,
    suggestedActions: [
      { label: "Tạo ticket hỗ trợ", href: "/support" },
      { label: "Xem FAQ", href: "/support/assistant" },
    ],
  };
}
