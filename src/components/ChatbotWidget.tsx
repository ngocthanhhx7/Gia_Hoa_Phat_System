"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, X } from "lucide-react";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type ChatbotResponse = {
  answer: string;
  sourceType: "faq" | "ai" | "fallback";
  suggestedActions?: { label: string; href: string }[];
};

const QUICK_PROMPTS = [
  "Làm sao để mua hàng?",
  "Tôi xem lịch sử đơn ở đâu?",
  "Làm sao gửi feedback?",
  "Liên hệ support thế nào?",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Chào bạn, mình là trợ lý Gia Hòa Phát. Mình có thể hướng dẫn mua hàng, thanh toán, lịch sử đơn, feedback và liên hệ support.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<{ label: string; href: string }[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as ChatbotResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi tin nhắn");
      }

      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      setSuggestedActions(data.suggestedActions || []);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Mình đang gặp sự cố khi trả lời. Bạn có thể thử lại hoặc tạo ticket hỗ trợ để staff/admin hỗ trợ trực tiếp.",
        },
      ]);
      setSuggestedActions([{ label: "Tạo ticket hỗ trợ", href: "/support" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:scale-105"
        title="Mở trợ lý hỗ trợ"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Trợ lý Gia Hòa Phát</p>
              <p className="text-xs text-slate-500">Hướng dẫn nhanh các thao tác trong hệ thống</p>
            </div>
          </div>

          <div ref={containerRef} className="max-h-96 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === "assistant"
                    ? "bg-slate-100 text-slate-700"
                    : "ml-auto bg-amber-600 text-white"
                }`}
              >
                {message.content}
              </div>
            ))}
            {loading && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang trả lời...
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 py-3">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {suggestedActions.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestedActions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
