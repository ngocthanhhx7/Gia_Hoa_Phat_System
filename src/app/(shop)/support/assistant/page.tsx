"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send } from "lucide-react";

type Faq = {
  id: string;
  question: string;
  answer: string;
  suggestedActions?: { label: string; href: string }[];
};

type ResponsePayload = {
  answer: string;
  sourceType: "faq" | "ai" | "fallback";
  suggestedActions?: { label: string; href: string }[];
};

export default function SupportAssistantPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ResponsePayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/chatbot/faqs")
      .then((res) => res.json())
      .then((data) => setFaqs(data.faqs || []))
      .catch(() => setFaqs([]));
  }, []);

  async function ask(message: string) {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = (await res.json()) as ResponsePayload;
      setAnswer(data);
      setQuestion("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Trợ lý AI Gia Hòa Phát</h1>
            <p className="mt-1 text-sm text-slate-500">
              Hỏi nhanh về cách mua hàng, thanh toán, lịch sử đơn, feedback và liên hệ support.
            </p>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ví dụ: Tôi xem lịch sử đơn ở đâu?"
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Gửi câu hỏi
          </button>
        </form>

        {answer && (
          <div className="mt-6 rounded-3xl bg-slate-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Nguồn: {answer.sourceType}</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-700">{answer.answer}</p>
            {answer.suggestedActions && answer.suggestedActions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {answer.suggestedActions.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">FAQ nhanh</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {faqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => void ask(faq.question)}
              className="rounded-2xl border border-slate-100 p-4 text-left transition hover:border-amber-200 hover:bg-amber-50/40"
            >
              <p className="font-semibold text-slate-800">{faq.question}</p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{faq.answer}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
