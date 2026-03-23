"use client";

import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  productId: string;
  orderId: string;
  productName: string;
  onSubmitted?: () => Promise<void> | void;
};

export default function FeedbackForm({ productId, orderId, productName, onSubmitted }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể gửi đánh giá");
        return;
      }

      toast.success("Đã gửi đánh giá thành công");
      setComment("");
      setRating(5);
      await onSubmitted?.();
    } catch {
      toast.error("Không thể gửi đánh giá");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-800">Đánh giá sản phẩm {productName}</p>
      <div className="mt-3 flex items-center gap-2">
        {Array.from({ length: 5 }, (_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              title={`Chọn ${value} sao`}
              onClick={() => setRating(value)}
              className="rounded-full p-1 text-amber-500 hover:bg-amber-100"
            >
              <Star className={`h-5 w-5 ${value <= rating ? "fill-current" : ""}`} />
            </button>
          );
        })}
      </div>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={4}
        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm"
        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Gửi đánh giá
      </button>
    </form>
  );
}
