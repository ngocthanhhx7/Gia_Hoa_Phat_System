export type ChatbotProviderInput = {
  message: string;
};

export type ChatbotProviderResult = {
  answer: string;
  sourceType: "ai";
};

export interface ChatbotProvider {
  sendMessage(input: ChatbotProviderInput): Promise<ChatbotProviderResult>;
}
