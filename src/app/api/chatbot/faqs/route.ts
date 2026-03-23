import { NextResponse } from "next/server";
import { getChatbotFaqs } from "@/lib/chatbot/service";

export async function GET() {
  return NextResponse.json({ faqs: getChatbotFaqs() });
}
