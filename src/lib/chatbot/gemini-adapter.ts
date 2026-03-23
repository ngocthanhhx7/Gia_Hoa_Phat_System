import { ChatbotProvider, ChatbotProviderInput, ChatbotProviderResult } from "@/lib/chatbot/provider";

const DEFAULT_MODEL = "gemini-3.1-flash-lite-preview";

export class GeminiChatbotProvider implements ChatbotProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async sendMessage(input: ChatbotProviderInput): Promise<ChatbotProviderResult> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: [
                    "Bạn là trợ lý của hệ thống Gia Hòa Phát.",
                    "Chỉ trả lời các câu hỏi liên quan đến cách dùng hệ thống: mua hàng, thanh toán, theo dõi đơn, feedback, support, tài khoản.",
                    "Nếu câu hỏi ngoài phạm vi, hãy khuyên người dùng liên hệ support.",
                    `Câu hỏi của người dùng: ${input.message}`,
                  ].join("\n"),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join(" ").trim();
    if (!text) {
      throw new Error("Gemini returned empty content");
    }

    return {
      answer: text,
      sourceType: "ai",
    };
  }
}
