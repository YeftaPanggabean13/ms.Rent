"use client";

import { useEffect, useState } from "react";
import { Booking } from "@/types";
import { getBookingByCode, requestExtend } from "@/lib/api";
import { X, Search, Copy, Check, User, CalendarDays, MapPin, Bike as BikeIcon, Wallet, Inbox, Clock } from "lucide-react";
import BookingStatusTimeline from "@/components/BookingStatusTimeline";

interface CheckBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="flex items-start gap-2 text-ink-muted min-w-0">
        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-faint" />
        <span>{label}</span>
      </span>
      <span className="text-ink font-semibold text-right">{value}</span>
    </div>
  );
}

export default function CheckBookingModal({ isOpen, onClose, initialCode = "" }: CheckBookingModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // State form perpanjaman sewa
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendHours, setExtendHours] = useState(1);
  const [extendPhone, setExtendPhone] = useState("");
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState("");
  const [extendSuccess, setExtendSuccess] = useState("");

  // Waktu sekarang (diperbarui tiap 30 detik) untuk mengecek jendela perpanjaman
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const searchCode = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    setCode(trimmed.toUpperCase());
    setLoading(true);
    setErrorMsg("");
    setBooking(null);

    const data = await getBookingByCode(trimmed.toUpperCase());
    setLoading(false);

    if (data) {
      setBooking(data);
      setExtendOpen(false);
      setExtendError("");
      setExtendSuccess("");
      setExtendHours(1);
      setExtendPhone("");
    } else {
      setErrorMsg("Kode reservasi tidak ditemukan. Pastikan format sudah benar (contoh: MSR-20260925-XXXX).");
    }
  };

  useEffect(() => {
    if (!isOpen || !initialCode) return;
    const timer = setTimeout(() => {
      void searchCode(initialCode);
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, initialCode]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void searchCode(code);
  };

  const handleCopyCode = () => {
    if (booking?.booking_code) {
      navigator.clipboard.writeText(booking.booking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Label durasi sewa (harian / per jam, termasuk hasil perpanjaman)
  const durationLabel = !booking
    ? ""
    : booking.rental_type === "hourly"
    ? `${booking.duration_hours ?? 0} Jam`
    : `${booking.duration_days} Hari${booking.extended_hours ? ` + ${booking.extended_hours} Jam` : ""}`;

  const returnLabel = !booking
    ? ""
    : booking.end_time && booking.end_time !== "24:00"
    ? `${booking.end_date} pukul ${booking.end_time}`
    : booking.end_date;

  const hourlyRate = booking?.bike?.price_per_hour ?? 0;
  const hasPendingExtend = (booking?.pending_extend_hours ?? 0) > 0;
  const statusCanExtend =
    booking?.booking_status === "confirmed" || booking?.booking_status === "active";

  // Akhir masa sewa (end_date + end_time; "24:00" = akhir end_date) dan jendela extend:
  // hanya boleh minimal 30 menit sebelum masa sewa habis
  const intervalEndMs = (() => {
    if (!booking) return 0;
    const base = new Date(`${booking.end_date}T00:00:00`).getTime();
    const et = booking.end_time && booking.end_time !== "24:00" ? booking.end_time : "";
    if (!et) return base + 86400000;
    const [h, m] = et.split(":").map(Number);
    return base + ((h || 0) * 60 + (m || 0)) * 60000;
  })();
  const withinExtendWindow = !!booking && intervalEndMs - nowTs >= 30 * 60 * 1000;
  const extendClosedMsg = booking
    ? `Perpanjaman hanya bisa diajukan minimal 30 menit sebelum masa sewa habis (${returnLabel}).`
    : "";

  const canExtend =
    !!booking && statusCanExtend && !hasPendingExtend && hourlyRate > 0 && withinExtendWindow;
  const extendCost = hourlyRate * extendHours;

  const handleSubmitExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking?.booking_code) return;
    if (extendHours < 1 || extendHours > 23) {
      setExtendError("Durasi perpanjaman minimal 1 jam dan maksimal 23 jam.");
      return;
    }
    if (!withinExtendWindow) {
      setExtendError(extendClosedMsg);
      return;
    }
    if (!extendPhone.trim()) {
      setExtendError("Masukkan No. WhatsApp yang digunakan saat reservasi.");
      return;
    }

    setExtendLoading(true);
    setExtendError("");
    const res = await requestExtend(booking.booking_code, extendPhone, extendHours);
    setExtendLoading(false);

    if (res.success && res.data) {
      setBooking(res.data);
      setExtendSuccess(res.message || "Permintaan perpanjaman terkirim.");
      setExtendOpen(false);
      setExtendHours(1);
      setExtendPhone("");
    } else {
      setExtendError(res.error || "Gagal mengajukan perpanjaman. Coba lagi.");
    }
  };

  const paymentLabel =
    booking?.payment_status === "paid"
      ? "Lunas"
      : booking?.payment_status === "refunded"
      ? "Dikembalikan"
      : "Belum Lunas";

  const paymentClass =
    booking?.payment_status === "paid"
      ? "bg-moss/10 text-moss border-moss/20"
      : booking?.payment_status === "refunded"
      ? "bg-sand-100 text-ink-muted border-sand-300"
      : "bg-rust/10 text-rust border-rust/20";

  return (
    <div className="fixed inset-0 z-50 flex p-4 sm:p-6 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg m-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] bg-white border border-sand-200 rounded-2xl shadow-warm-xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-sand-200 bg-sand-50/50 shrink-0">
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">Lacak Reservasi</h3>
            <p className="text-xs text-ink-muted mt-0.5">Masukkan kode booking untuk melihat status armada Anda</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto min-h-0">
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
              <input
                type="text"
                placeholder="MSR-20260925-XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-ink text-xs focus:border-rust focus:bg-white focus:outline-none uppercase font-semibold tracking-wider transition"
                aria-label="Kode reservasi"
                required
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-ink-faint tracking-wide">Format: MSR-YYYYMMDD-XXXXXX</span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition disabled:opacity-50 shadow-warm-sm"
              >
                <Search className="w-3.5 h-3.5" /> {loading ? "Mencari..." : "Lacak"}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {!booking && !errorMsg && !loading && (
            <div className="text-center py-7 px-4 rounded-xl border border-dashed border-sand-300 bg-sand-50/50">
              <span className="mx-auto w-14 h-14 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center">
                <Inbox className="w-6 h-6 text-ink-faint" />
              </span>
              <p className="mt-3 text-xs font-semibold text-ink">Belum ada reservasi yang dilacak</p>
              <p className="mt-1 text-[11px] text-ink-muted max-w-xs mx-auto leading-relaxed">
                Masukkan kode reservasi Anda (contoh:{" "}
                <span className="font-semibold text-ink-light tracking-wider">MSR-20260925-A1B2C3</span>) untuk melihat
                status unit, jadwal sewa, dan total pembayaran.
              </p>
            </div>
          )}

          {booking && (
            <div className="rounded-xl border border-sand-200 bg-white shadow-warm-sm overflow-hidden animate-fade-in">
              {/* Kode reservasi */}
              <div className="flex items-center justify-between gap-3 p-4 bg-sand-50 border-b border-sand-200">
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-faint font-semibold">
                    Kode Reservasi
                  </span>
                  <p className="text-sm font-bold text-ink tracking-wider truncate">{booking.booking_code ?? "-"}</p>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-sand-200 hover:bg-sand-100 text-ink text-xs font-medium transition shadow-warm-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-moss" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {booking.booking_status === "cancelled" && (
                  <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">
                    Reservasi ini telah dibatalkan. Hubungi garasi bila butuh informasi lebih lanjut.
                  </div>
                )}

                <BookingStatusTimeline
                  current={booking.booking_status ?? "pending"}
                  orientation="vertical"
                />

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${paymentClass}`}
                  >
                    <Wallet className="w-3 h-3" /> Pembayaran: {paymentLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-white text-ink-light border-sand-200">
                    <Clock className="w-3 h-3" /> {durationLabel}
                  </span>
                  {booking.rental_type === "hourly" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-sand-50 text-ink-muted border-sand-200">
                      Per Jam
                    </span>
                  )}
                </div>

                <div className="border-t border-sand-200 pt-4 space-y-2.5">
                  {booking.bike && (
                    <DetailRow
                      icon={BikeIcon}
                      label="Unit Motor"
                      value={`${booking.bike.name} (${booking.bike.plate_number})`}
                    />
                  )}
                  <DetailRow icon={User} label="Nama Penyewa" value={booking.customer_name} />
                  <DetailRow
                    icon={CalendarDays}
                    label="Jadwal Sewa"
                    value={
                      booking.start_time
                        ? `${booking.start_date} ${booking.start_time} s/d ${returnLabel}`
                        : `${booking.start_date} s/d ${returnLabel}`
                    }
                  />
                  <DetailRow
                    icon={MapPin}
                    label="Penyerahan Unit"
                    value={booking.delivery_address ? booking.delivery_address : booking.pickup_location || "-"}
                  />
                </div>
                <div className="p-3 rounded-lg bg-rust/5 border border-rust/20 flex justify-between items-baseline gap-3">
                  <span className="text-xs font-semibold text-ink-light">Total Pembayaran</span>
                  <span className="font-serif font-bold text-base text-rust">{formatRupiah(booking.total_price)}</span>
                </div>

                {/* Perpanjaman sewa (extend jam) */}
                {extendSuccess && !hasPendingExtend && (
                  <div className="p-3 rounded-lg bg-moss/10 border border-moss/30 text-moss text-xs font-medium">
                    {extendSuccess}
                  </div>
                )}

                {hasPendingExtend && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    Permintaan perpanjaman <strong>+{booking.pending_extend_hours} jam</strong> (
                    {formatRupiah(booking.pending_extend_cost ?? 0)}) sedang menunggu persetujuan garasi.
                  </div>
                )}

                {statusCanExtend && !hasPendingExtend && !withinExtendWindow && (
                  <div className="p-3 rounded-lg bg-sand-100 border border-sand-200 text-ink-muted text-xs">
                    {extendClosedMsg}
                  </div>
                )}

                {canExtend && !extendOpen && !extendSuccess && (
                  <button
                    onClick={() => {
                      setExtendOpen(true);
                      setExtendError("");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white hover:bg-sand-50 border border-sand-300 text-ink font-medium text-xs transition active:scale-95"
                  >
                    <Clock className="w-3.5 h-3.5 text-rust" /> Perpanjang Sewa (per jam)
                  </button>
                )}

                {extendOpen && (
                  <form onSubmit={handleSubmitExtend} className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-3">
                    <div>
                      <span className="block text-xs font-semibold text-ink">Perpanjaman Jam Sewa</span>
                      <span className="block text-[11px] text-ink-muted">
                        Tarif {formatRupiah(hourlyRate)} / jam — diajukan ke garasi, berlaku setelah disetujui.
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-sand-200">
                      <span className="text-xs text-ink-muted">Jumlah jam tambahan</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setExtendHours(Math.max(1, extendHours - 1))}
                          className="w-7 h-7 rounded-lg bg-sand-50 border border-sand-200 text-ink font-semibold hover:bg-sand-100 text-xs transition"
                        >
                          -
                        </button>
                        <span className="text-xs font-semibold w-6 text-center text-ink">{extendHours}</span>
                        <button
                          type="button"
                          onClick={() => setExtendHours(Math.min(23, extendHours + 1))}
                          className="w-7 h-7 rounded-lg bg-sand-50 border border-sand-200 text-ink font-semibold hover:bg-sand-100 text-xs transition"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-muted">Biaya tambahan</span>
                      <span className="font-semibold text-rust">{formatRupiah(extendCost)}</span>
                    </div>

                    <div>
                      <label htmlFor="extend-phone" className="block text-[11px] text-ink-muted mb-1">
                        No. WhatsApp saat reservasi (verifikasi)
                      </label>
                      <input
                        id="extend-phone"
                        type="tel"
                        placeholder="082151728477"
                        value={extendPhone}
                        onChange={(e) => setExtendPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust transition"
                        required
                      />
                    </div>

                    {extendError && (
                      <div className="p-2.5 rounded-lg bg-rust/10 border border-rust/30 text-rust text-[11px] font-medium">
                        {extendError}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setExtendOpen(false);
                          setExtendError("");
                        }}
                        className="py-2.5 rounded-xl bg-white hover:bg-sand-50 border border-sand-300 text-ink-light font-medium text-xs transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={extendLoading}
                        className="py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition disabled:opacity-50 shadow-warm-sm"
                      >
                        {extendLoading ? "Mengirim..." : "Ajukan"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
