import { NextRequest, NextResponse } from "next/server";
import { chatbotMessageSchema } from "@/lib/validators";
import { getChatbotReply } from "@/lib/chatbot/service";

export async function POST(req: NextRequest) {
  const parsed = chatbotMessageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Tin nhắn không hợp lệ" }, { status: 400 });
  }

  const result = await getChatbotReply(parsed.data.message);
  return NextResponse.json(result);
}
