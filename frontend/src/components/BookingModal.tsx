"use client";

import { useState, useId } from "react";
import { Bike, Booking } from "@/types";
import { createBooking } from "@/lib/api";
import { X, Calendar, User, Phone, CreditCard, MapPin, CheckCircle, Copy, Check, MessageSquare } from "lucide-react";

interface BookingModalProps {
  bike: Bike | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookingModal({ bike, onClose, onSuccess }: BookingModalProps) {
  const formId = useId();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idCard, setIdCard] = useState("");
  const [deliveryType, setDeliveryType] = useState<"self" | "delivery">("self");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [extraHelmets, setExtraHelmets] = useState(0);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!bike) return null;

  // Hitung durasi hari
  const calcDays = () => {
    try {
      const s = new Date(startDate).getTime();
      const e = new Date(endDate).getTime();
      const diff = Math.ceil((e - s) / (1000 * 3600 * 24));
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const days = calcDays();
  const rentalBaseCost = bike.price_per_day * days;
  const deliveryCost = deliveryType === "delivery" ? 35000 : 0;
  const extraHelmetCost = extraHelmets * 15000 * days;
  const grandTotal = rentalBaseCost + deliveryCost + extraHelmetCost;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !idCard.trim()) {
      setErrorMsg("Harap lengkapi Nama, Nomor WhatsApp, dan Nomor KTP/Identitas.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const payload: Booking = {
      bike_id: bike.id,
      customer_name: name,
      customer_phone: phone,
      customer_id_card: idCard,
      start_date: startDate,
      end_date: endDate,
      duration_days: days,
      pickup_location: deliveryType === "self" ? "Garasi ms.Rent" : "Layanan Antar Unit",
      return_location: deliveryType === "self" ? "Garasi ms.Rent" : "Layanan Antar/Jemput",
      delivery_address: deliveryType === "delivery" ? deliveryAddress : "",
      extra_helmets: extraHelmets,
      raincoat_count: 1,
      phone_holder: true,
      total_price: grandTotal,
      notes: notes,
    };

    const res = await createBooking(payload);
    setLoading(false);

    if (res.success && res.data) {
      setCreatedBooking(res.data);
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || "Terjadi kesalahan saat memproses booking");
    }
  };

  const handleCopyCode = () => {
    if (createdBooking?.booking_code) {
      navigator.clipboard.writeText(createdBooking.booking_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getWaLink = () => {
    if (!createdBooking) return "#";
    const msg = `Halo Admin ms.Rent, saya telah membuat booking motor:%0A%0A*Kode Booking:* ${createdBooking.booking_code}%0A*Motor:* ${bike.name} (${bike.plate_number})%0A*Nama:* ${name}%0A*Jadwal:* ${startDate} s/d ${endDate} (${days} hari)%0A*Total Biaya:* ${formatRupiah(grandTotal)}%0A%0AMohon info rekening pembayaran dan konfirmasi ketersediaan unit. Terima kasih!`;
    return `https://wa.me/6281234567890?text=${msg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
              Formulir Reservasi Motor
            </span>
            <h2 className="text-xl font-bold text-white">{bike.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content State: Sukses Booking */}
        {createdBooking ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Booking Berhasil Dibuat!</h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Terima kasih, data reservasi Anda telah tersimpan. Silakan simpan Kode Booking berikut untuk pelacakan.
              </p>
            </div>

            {/* Kode Booking Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between max-w-md mx-auto">
              <div className="text-left">
                <span className="text-xs text-slate-400 font-medium">Kode Booking Anda:</span>
                <p className="text-lg font-mono font-bold text-brand-400">{createdBooking.booking_code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Tersalin!" : "Salin"}</span>
              </button>
            </div>

            {/* Rincian Singkat */}
            <div className="text-left bg-slate-800/40 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Unit:</span>
                <span className="text-white font-medium">{bike.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Durasi:</span>
                <span className="text-white font-medium">{days} Hari ({startDate} s/d {endDate})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Layanan:</span>
                <span className="text-white font-medium">{deliveryType === "delivery" ? "Antar ke Lokasi" : "Ambil di Garasi"}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700/60 font-semibold text-sm">
                <span className="text-slate-300">Total Biaya:</span>
                <span className="text-brand-400 font-bold">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2 max-w-md mx-auto">
              <a
                href={getWaLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Konfirmasi via WhatsApp Sekarang</span>
              </a>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        ) : (
          /* Form Booking */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Tanggal Sewa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-start-date`} className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  <span>Tanggal Mulai Sewa</span>
                </label>
                <input
                  id={`${formId}-start-date`}
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${formId}-end-date`} className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tanggal Selesai Sewa</span>
                </label>
                <input
                  id={`${formId}-end-date`}
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Data Penyewa */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Penyewa</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formId}-name`} className="block text-xs text-slate-300 mb-1 flex items-center space-x-1">
                    <User className="w-3 h-3 text-brand-400" />
                    <span>Nama Lengkap (sesuai KTP)</span>
                  </label>
                  <input
                    id={`${formId}-name`}
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`${formId}-phone`} className="block text-xs text-slate-300 mb-1 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-brand-400" />
                    <span>Nomor WhatsApp Aktif</span>
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${formId}-id-card`} className="block text-xs text-slate-300 mb-1 flex items-center space-x-1">
                  <CreditCard className="w-3 h-3 text-brand-400" />
                  <span>Nomor KTP / Paspor</span>
                </label>
                <input
                  id={`${formId}-id-card`}
                  type="text"
                  placeholder="3271xxxxxxxxxxxx"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Opsi Pengambilan */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Metode Pengambilan Motor</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("self")}
                  className={`p-3 rounded-xl border text-left transition ${
                    deliveryType === "self"
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">Ambil Sendiri di Garasi</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Gratis (Showroom ms.Rent)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  className={`p-3 rounded-xl border text-left transition ${
                    deliveryType === "delivery"
                      ? "border-brand-500 bg-brand-500/10 text-white"
                      : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-semibold text-xs text-white">Antar ke Lokasi</div>
                  <div className="text-[11px] text-brand-400 mt-0.5">+Rp 35.000 (Stasiun/Hotel)</div>
                </button>
              </div>

              {deliveryType === "delivery" && (
                <div>
                  <label htmlFor={`${formId}-delivery-address`} className="block text-xs text-slate-300 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-brand-400" />
                    <span>Alamat Lengkap Pengantaran (Nama Hotel / Stasiun)</span>
                  </label>
                  <input
                    id={`${formId}-delivery-address`}
                    type="text"
                    placeholder="Contoh: Hotel Grand Dafam, Lobby Depan"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-brand-500 focus:outline-none"
                    required={deliveryType === "delivery"}
                  />
                </div>
              )}
            </div>

            {/* Tambahan & Fasilitas */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tambahan Opsional</h4>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="font-semibold text-white block">Helm Tambahan (+Rp 15.000/hari)</span>
                  <span className="text-slate-400 text-[11px]">Standar sewa sudah termasuk 1 Helm SNI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setExtraHelmets(Math.max(0, extraHelmets - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    -
                  </button>
                  <span className="text-sm font-semibold w-4 text-center text-white">{extraHelmets}</span>
                  <button
                    type="button"
                    onClick={() => setExtraHelmets(Math.min(2, extraHelmets + 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Rincian Biaya */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Sewa {bike.name} ({days} hari)</span>
                <span className="text-white font-medium">{formatRupiah(rentalBaseCost)}</span>
              </div>
              {deliveryCost > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Ongkir Antar-Jemput</span>
                  <span className="text-white font-medium">{formatRupiah(deliveryCost)}</span>
                </div>
              )}
              {extraHelmetCost > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Helm Tambahan ({extraHelmets} unit x {days} hari)</span>
                  <span className="text-white font-medium">{formatRupiah(extraHelmetCost)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-bold text-white text-sm">Total Estimasi Biaya</span>
                <span className="font-black text-xl text-brand-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white shadow-lg shadow-brand-500/25 active:scale-[0.99] transition disabled:opacity-50"
              >
                {loading ? "Memproses Reservasi..." : `Konfirmasi Booking Sekarang (${formatRupiah(grandTotal)})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
