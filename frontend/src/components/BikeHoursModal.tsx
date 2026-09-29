"use client";

import { useEffect, useState } from "react";
import { X, Clock, CalendarDays, AlertTriangle } from "lucide-react";
import { Bike } from "@/types";
import { getBikeHours, BikeHourInterval } from "@/lib/api";

interface BikeHoursModalProps {
  bike: Bike | null;
  isOpen: boolean;
  onClose: () => void;
}

const toLocalDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default function BikeHoursModal({ bike, isOpen, onClose }: BikeHoursModalProps) {
  const todayStr = toLocalDate(new Date());
  const [date, setDate] = useState(todayStr);
  const [intervals, setIntervals] = useState<BikeHourInterval[] | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const requestKey = `${bike?.id ?? 0}|${date}`;
  const loading = isOpen && !!bike && loadedKey !== requestKey;

  useEffect(() => {
    if (!isOpen || !bike) return;
    let cancelled = false;
    getBikeHours(bike.id, date).then((res) => {
      if (cancelled) return;
      if (res === null) {
        setError("Gagal memuat jadwal jam. Silakan coba lagi.");
        setIntervals([]);
      } else {
        setIntervals(res);
        setError("");
      }
      setLoadedKey(`${bike.id}|${date}`);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, bike, date]);

  if (!isOpen || !bike) return null;

  const now = new Date();
  const nowHour = now.getHours();
  const isToday = date === todayStr;

  // Status visual interval menyesuaikan jam berjalan (bukan status booking semata)
  const intervalState = (iv: BikeHourInterval): { text: string; cls: string } => {
    const dayStart = new Date(`${date}T00:00:00`).getTime();
    const startTs = dayStart + toMinutes(iv.start) * 60000;
    const endTs = dayStart + toMinutes(iv.end) * 60000;
    if (nowTs >= endTs) return { text: "Selesai", cls: "text-ink-muted" };
    if (nowTs >= startTs) return { text: "Sedang Berjalan", cls: "text-rust font-semibold" };
    if (iv.status === "pending") return { text: "Menunggu Konfirmasi", cls: "text-amber-600 font-medium" };
    return { text: "Sudah Dipesan", cls: "text-rust font-medium" };
  };

  // Interval yang menutupi jam ke-h (00:00 - 24:00)
  const occupiedBy = (h: number): BikeHourInterval | null => {
    if (!intervals) return null;
    const s = h * 60;
    const e = (h + 1) * 60;
    return intervals.find((iv) => toMinutes(iv.start) < e && toMinutes(iv.end) > s) || null;
  };

  // Rentang jam kosong
  const freeRanges: Array<[number, number]> = [];
  if (intervals) {
    let runStart: number | null = null;
    for (let h = 0; h <= 24; h++) {
      const busy = h < 24 && occupiedBy(h) !== null;
      if (!busy && runStart === null) runStart = h;
      if (busy && runStart !== null) {
        freeRanges.push([runStart, h]);
        runStart = null;
      }
    }
    if (runStart !== null) freeRanges.push([runStart, 24]);
  }
  const futureFreeRanges = freeRanges
    .map(([a, b]): [number, number] => [Math.max(a, isToday ? nowHour + 1 : 0), b])
    .filter(([a, b]) => b > a);

  return (
    <div className="fixed inset-0 z-[60] flex p-4 sm:p-6 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl m-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] bg-white border border-sand-200 rounded-2xl shadow-warm-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-sand-200 bg-sand-50/50 shrink-0">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-rust tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Informasi Ketersediaan per Jam
            </span>
            <h2 className="text-xl font-bold text-ink mt-0.5 truncate">{bike.name}</h2>
            <p className="text-[11px] text-ink-faint mt-0.5">Plat: {bike.plate_number}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition shrink-0"
            aria-label="Tutup informasi jam"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto min-h-0">
          {/* Pilih tanggal */}
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="hours-modal-date" className="flex items-center gap-1.5 text-xs font-medium text-ink">
              <CalendarDays className="w-3.5 h-3.5 text-rust" /> Tanggal
            </label>
            <input
              id="hours-modal-date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust focus:bg-white transition"
            />
          </div>

          {bike.status === "maintenance" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Unit ini sedang dalam jadwal servis dan belum bisa dipesan.</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-sand-100 animate-pulse" />
              <div className="h-28 rounded-xl bg-sand-100 animate-pulse" />
            </div>
          ) : (
            <>
              {/* Grid 24 jam */}
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
                {Array.from({ length: 24 }, (_, h) => {
                  const iv = occupiedBy(h);
                  const past = isToday && h < nowHour;
                  const cls = iv
                    ? "bg-rust/15 text-rust border-rust/25"
                    : past
                    ? "bg-sand-100 text-ink-faint border-sand-200 opacity-60"
                    : "bg-moss/10 text-moss border-moss/25";
                  const sub = iv ? "Terpakai" : past ? "Lewat" : "Kosong";
                  const tip = iv
                    ? `${date}: ${iv.start} - ${iv.end} · ${iv.status_label}`
                    : `${date} ${hourLabel(h)}: ${past ? "sudah lewat" : "kosong"}`;
                  return (
                    <div
                      key={h}
                      className={`rounded-lg border px-1 py-2 text-center ${cls}`}
                      title={tip}
                    >
                      <span className="block text-[13px] font-semibold leading-none">
                        {String(h).padStart(2, "0")}
                      </span>
                      <span className="block text-[9px] mt-1 leading-none">{sub}</span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-moss/30 border border-moss/40" /> Kosong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rust/30 border border-rust/40" /> Terpakai
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-sand-200 border border-sand-300" /> Lewat
                </span>
              </div>

              {/* Ringkasan jam kosong */}
              <div className="p-3.5 rounded-xl bg-moss/5 border border-moss/20 space-y-1">
                <span className="block text-xs font-semibold text-ink">
                  Jam kosong{" "}
                  <span className="font-normal text-ink-muted">
                    ({date}
                    {isToday ? ", sisa hari ini" : ""})
                  </span>
                </span>
                {futureFreeRanges.length > 0 ? (
                  <p className="text-xs font-semibold text-moss leading-relaxed">
                    {futureFreeRanges.map(([a, b]) => `${hourLabel(a)} - ${hourLabel(b)}`).join(" · ")}
                  </p>
                ) : (
                  <p className="text-xs text-rust font-medium">
                    Tidak ada jam kosong pada tanggal ini.
                  </p>
                )}
              </div>

              {/* Detail jam terpakai */}
              {intervals && intervals.length > 0 && (
                <div className="space-y-1.5">
                  <span className="block text-[11px] font-semibold text-ink">Detail jadwal sewa</span>
                  {intervals.map((iv, i) => {
                    const state = intervalState(iv);
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-rust/5 border border-rust/15 text-[11px]"
                        title={`Jadwal sewa ${iv.start} - ${iv.end} · ${iv.status_label}`}
                      >
                        <span className="font-semibold text-ink whitespace-nowrap">
                          {iv.start} - {iv.end}
                        </span>
                        <span className={`text-right ${state.cls}`}>{state.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {intervals && intervals.length === 0 && (
                <p className="text-xs text-ink-muted text-center py-2">
                  Unit ini bebas sepanjang hari — tidak ada jadwal sewa pada tanggal tersebut.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-sand-200 bg-sand-50/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition shadow-warm-sm"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
