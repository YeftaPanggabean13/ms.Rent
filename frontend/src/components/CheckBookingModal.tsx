"use client";

import { useState } from "react";
import { Booking } from "@/types";
import { getBookingByCode } from "@/lib/api";
import { X } from "lucide-react";

interface CheckBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckBookingModal({ isOpen, onClose }: CheckBookingModalProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setBooking(null);

    const data = await getBookingByCode(code.trim().toUpperCase());
    setLoading(false);

    if (data) {
      setBooking(data);
    } else {
      setErrorMsg("Kode reservasi tidak ditemukan. Pastikan format sudah benar (contoh: MSR-20260925-XXXX).");
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white border border-sand-200 rounded-2xl shadow-warm-lg overflow-hidden my-8">
        <div className="flex items-center justify-between p-6 border-b border-sand-200 bg-sand-50/50">
          <div>
            <h3 className="font-serif text-xl font-bold text-ink">Lacak Reservasi</h3>
            <p className="text-xs text-ink-muted mt-0.5">Masukkan kode booking untuk melihat status armada Anda</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="MSR-20260925-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-sand-50 border border-sand-200 text-ink text-xs focus:border-rust focus:bg-white focus:outline-none uppercase font-semibold tracking-wider transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition disabled:opacity-50 shadow-warm-sm"
            >
              {loading ? "Mencari..." : "Cari Unit"}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {booking && (
            <div className="p-5 rounded-xl bg-sand-50 border border-sand-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-ink-muted block font-medium">Status Reservasi:</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                      booking.booking_status === "confirmed"
                        ? "bg-moss/10 text-moss border border-moss/20"
                        : booking.booking_status === "active"
                        ? "bg-sand-200 text-ink border border-sand-300"
                        : "bg-rust/10 text-rust border border-rust/20"
                    }`}
                  >
                    {booking.booking_status === "confirmed"
                      ? "Dikonfirmasi (Unit Siap Jalan)"
                      : booking.booking_status === "active"
                      ? "Sedang Berjalan (Unit Aktif)"
                      : "Menunggu Verifikasi Garasi"}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-ink-muted block font-medium">Pembayaran:</span>
                  <span
                    className={`inline-block text-xs font-semibold uppercase mt-1 ${
                      booking.payment_status === "paid" ? "text-moss" : "text-rust"
                    }`}
                  >
                    {booking.payment_status === "paid" ? "Lunas" : "Belum Lunas"}
                  </span>
                </div>
              </div>

              <div className="border-t border-sand-200 pt-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Nama Penyewa:</span>
                  <span className="text-ink font-semibold">{booking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Jadwal Sewa:</span>
                  <span className="text-ink font-medium">
                    {booking.start_date} s/d {booking.end_date} ({booking.duration_days} hari)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Penyerahan Unit:</span>
                  <span className="text-ink font-medium">
                    {booking.delivery_address ? booking.delivery_address : booking.pickup_location}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-sand-200 font-semibold text-xs items-baseline">
                  <span className="text-ink-light">Total Pembayaran:</span>
                  <span className="font-serif font-bold text-base text-rust">{formatRupiah(booking.total_price)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
