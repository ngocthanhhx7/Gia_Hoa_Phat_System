"use client";

type TimelineItem = {
  key: string;
  label: string;
  description: string;
  status: "completed" | "current" | "upcoming" | "cancelled";
  time: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "Chưa cập nhật";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const statusStyle: Record<TimelineItem["status"], string> = {
  completed: "bg-emerald-500 border-emerald-500",
  current: "bg-amber-500 border-amber-500",
  upcoming: "bg-white border-slate-300",
  cancelled: "bg-red-500 border-red-500",
};

export default function OrderTimeline({ items }: { items: TimelineItem[] }) {
  if (!items.length) return null;

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.key} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className={`mt-1 h-4 w-4 rounded-full border-2 ${statusStyle[item.status]}`} />
            {index < items.length - 1 && <span className="mt-1 h-full w-px bg-slate-200" />}
          </div>
          <div className="pb-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h4 className="text-sm font-semibold text-slate-800">{item.label}</h4>
              <span className="text-xs text-slate-400">{formatDateTime(item.time)}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
