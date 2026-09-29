"use client";

import { Check } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "active" | "completed" | "cancelled";

interface TimelineStep {
  key: BookingStatus;
  label: string;
  sub: string;
}

const STEPS: TimelineStep[] = [
  { key: "pending", label: "Tercatat", sub: "Menunggu verifikasi" },
  { key: "confirmed", label: "Dikonfirmasi", sub: "Siap diserahkan" },
  { key: "active", label: "Sedang Berjalan", sub: "Unit aktif dipakai" },
  { key: "completed", label: "Selesai", sub: "Reservasi berakhir" },
];

interface BookingStatusTimelineProps {
  current?: BookingStatus;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export default function BookingStatusTimeline({
  current = "pending",
  orientation = "horizontal",
  className = "",
}: BookingStatusTimelineProps) {
  const cancelled = current === "cancelled";
  const currentIndex = cancelled ? -1 : STEPS.findIndex((s) => s.key === current);

  const state = (index: number): "done" | "current" | "todo" => {
    if (cancelled) return "todo";
    if (index < currentIndex) return "done";
    if (index === currentIndex) return "current";
    return "todo";
  };

  const nodeClass = (s: "done" | "current" | "todo") => {
    if (s === "done") return "bg-moss border-moss text-white";
    if (s === "current") return "bg-white border-rust text-rust ring-4 ring-rust/15";
    return "bg-white border-sand-300 text-ink-faint";
  };

  const labelClass = (s: "done" | "current" | "todo") => {
    if (s === "done") return "text-moss";
    if (s === "current") return "text-rust";
    return "text-ink-faint";
  };

  if (orientation === "vertical") {
    return (
      <ol className={`space-y-0 ${className}`}>
        {STEPS.map((step, idx) => {
          const s = state(idx);
          return (
            <li key={step.key} className="relative flex gap-3 pb-4 last:pb-0">
              {idx < STEPS.length - 1 && (
                <span
                  className={`absolute left-[15px] top-8 bottom-0 w-0.5 rounded ${
                    state(idx) === "todo" ? "bg-sand-300" : "bg-moss/70"
                  }`}
                />
              )}
              <span
                className={`relative z-10 shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${nodeClass(
                  s
                )}`}
              >
                {s === "done" ? (
                  <Check className="w-4 h-4" />
                ) : s === "current" ? (
                  <span className="w-2 h-2 rounded-full bg-rust animate-pulse" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-sand-400" />
                )}
              </span>
              <div className="pt-1 min-w-0">
                <span className={`block text-xs font-semibold ${labelClass(s)}`}>{step.label}</span>
                <span className="block text-[11px] text-ink-faint">{step.sub}</span>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={`flex items-start ${className}`}>
      {STEPS.map((step, idx) => {
        const s = state(idx);
        return (
          <li key={step.key} className="relative flex-1 min-w-0 flex flex-col items-center text-center px-1">
            {idx < STEPS.length - 1 && (
              <span
                className={`absolute top-[15px] left-1/2 w-full h-0.5 rounded ${
                  state(idx + 1) === "todo" && state(idx) !== "done" ? "bg-sand-300" : "bg-moss/70"
                }`}
              />
            )}
            <span
              className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${nodeClass(
                s
              )}`}
            >
              {s === "done" ? (
                <Check className="w-4 h-4" />
              ) : s === "current" ? (
                <span className="w-2 h-2 rounded-full bg-rust animate-pulse" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-sand-400" />
              )}
            </span>
            <span className={`mt-2 text-[11px] font-semibold leading-tight ${labelClass(s)}`}>{step.label}</span>
            <span className="text-[10px] text-ink-faint leading-tight mt-0.5">{step.sub}</span>
          </li>
        );
      })}
    </ol>
  );
}
