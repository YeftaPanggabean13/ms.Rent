"use client";

import { useState } from "react";
import { Booking } from "@/types";
import { getBookingByCode } from "@/lib/api";
import { X, Search, CheckCircle2, Clock, AlertCircle } from "lucide-react";

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
      setErrorMsg("Kode booking tidak ditemukan. Pastikan format penulisan sudah benar (contoh: MSR-20260925-XXXX).");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white">Lacak Status Reservasi</h3>
            <p className="text-xs text-slate-400">Masukkan kode booking untuk mengecek konfirmasi dan status unit</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: MSR-20260925-A1B2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none uppercase font-mono"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "..." : "Cari"}</span>
            </button>
          </form>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {booking && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium">Status Pesanan:</span>
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        booking.booking_status === "confirmed"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : booking.booking_status === "active"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {booking.booking_status === "confirmed"
                        ? "Dikonfirmasi / Siap Ambil"
                        : booking.booking_status === "active"
                        ? "Sedang Disewa (Aktif)"
                        : "Menunggu Konfirmasi Pembayaran"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-medium">Pembayaran:</span>
                  <span
                    className={`block text-xs font-bold uppercase mt-0.5 ${
                      booking.payment_status === "paid" ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {booking.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Penyewa:</span>
                  <span className="text-white font-medium">{booking.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Jadwal Sewa:</span>
                  <span className="text-white font-medium">
                    {booking.start_date} s/d {booking.end_date} ({booking.duration_days} hari)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Lokasi:</span>
                  <span className="text-white font-medium">
                    {booking.delivery_address ? booking.delivery_address : booking.pickup_location}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-semibold text-sm">
                  <span className="text-slate-300">Total Biaya:</span>
                  <span className="text-brand-400">{formatRupiah(booking.total_price)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
