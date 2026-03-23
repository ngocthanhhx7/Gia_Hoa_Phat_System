import { buildFallbackAnswer, findBestFaqMatch } from "@/lib/chatbot/fallback";
import { CHATBOT_FAQS } from "@/lib/chatbot/faq-knowledge";
import { GeminiChatbotProvider } from "@/lib/chatbot/gemini-adapter";

export async function getChatbotReply(message: string) {
  const faqMatch = findBestFaqMatch(message);
  if (faqMatch) {
    return {
      answer: faqMatch.answer,
      sourceType: "faq" as const,
      suggestedActions: faqMatch.suggestedActions || [],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const provider = new GeminiChatbotProvider(
        apiKey,
        process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview"
      );
      const result = await provider.sendMessage({ message });
      return {
        ...result,
        suggestedActions: [{ label: "Liên hệ support", href: "/support" }],
      };
    } catch (error) {
      console.error("Chatbot provider error:", error);
    }
  }

  return buildFallbackAnswer(message);
}

export function getChatbotFaqs() {
  return CHATBOT_FAQS;
}
