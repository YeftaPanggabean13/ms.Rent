"use client";

import { useState, useId } from "react";
import { Bike, Booking } from "@/types";
import { createBooking } from "@/lib/api";
import { X, Copy, Check } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white border border-sand-200 rounded-2xl shadow-warm-lg overflow-hidden my-8">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-sand-200 bg-sand-50/50">
          <div>
            <span className="text-xs font-semibold text-rust tracking-wide">
              Reservasi Unit Motor
            </span>
            <h2 className="font-serif text-2xl font-bold text-ink mt-0.5">{bike.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content State: Sukses Booking */}
        {createdBooking ? (
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-moss/10 text-moss border border-moss/20">
                Pemesanan Tercatat
              </span>
              <h3 className="font-serif text-2xl font-bold text-ink">Reservasi Siap Dikonfirmasi</h3>
              <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
                Simpan Kode Reservasi di bawah ini untuk pelacakan status unit dan verifikasi garasi kami.
              </p>
            </div>

            {/* Kode Booking Card */}
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 flex items-center justify-between max-w-md mx-auto">
              <div className="text-left">
                <span className="text-[11px] text-ink-muted font-medium">Kode Reservasi:</span>
                <p className="text-lg font-bold text-ink tracking-wider">{createdBooking.booking_code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-sand-200 hover:bg-sand-100 text-ink text-xs font-medium transition shadow-warm-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-moss" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Tersalin" : "Salin"}</span>
              </button>
            </div>

            {/* Rincian Singkat */}
            <div className="text-left bg-sand-50/70 p-5 rounded-xl border border-sand-200 text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between text-ink-muted">
                <span>Unit Motor:</span>
                <span className="text-ink font-semibold">{bike.name}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Durasi Sewa:</span>
                <span className="text-ink font-medium">{days} Hari ({startDate} s/d {endDate})</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Metode Penyerahan:</span>
                <span className="text-ink font-medium">
                  {deliveryType === "delivery" ? "Antar ke Lokasi Pemesan" : "Ambil Sendiri di Garasi"}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-sand-200 font-semibold text-sm">
                <span className="text-ink-light">Total Pembayaran:</span>
                <span className="font-serif text-lg font-bold text-rust">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2 max-w-md mx-auto">
              <a
                href={getWaLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-3 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs sm:text-sm transition shadow-warm-sm text-center"
              >
                Konfirmasi via WhatsApp Sekarang
              </a>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-light font-medium text-xs transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        ) : (
          /* Form Booking */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Tanggal Sewa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`${formId}-start-date`} className="block text-xs font-medium text-ink mb-1.5">
                  Tanggal Mulai Sewa
                </label>
                <input
                  id={`${formId}-start-date`}
                  type="date"
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label htmlFor={`${formId}-end-date`} className="block text-xs font-medium text-ink mb-1.5">
                  Tanggal Selesai ({days} Hari)
                </label>
                <input
                  id={`${formId}-end-date`}
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Data Penyewa */}
            <div className="space-y-3 pt-3 border-t border-sand-200">
              <span className="text-xs font-semibold text-ink">Identitas Pemesan</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${formId}-name`} className="block text-xs text-ink-muted mb-1">
                    Nama Lengkap Sesuai KTP
                  </label>
                  <input
                    id={`${formId}-name`}
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor={`${formId}-phone`} className="block text-xs text-ink-muted mb-1">
                    Nomor WhatsApp Aktif
                  </label>
                  <input
                    id={`${formId}-phone`}
                    type="tel"
                    placeholder="081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${formId}-id-card`} className="block text-xs text-ink-muted mb-1">
                  Nomor KTP / Paspor
                </label>
                <input
                  id={`${formId}-id-card`}
                  type="text"
                  placeholder="Nomor identitas sah"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                  className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Opsi Pengambilan */}
            <div className="space-y-3 pt-3 border-t border-sand-200">
              <span className="text-xs font-semibold text-ink">Metode Penyerahan Unit</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType("self")}
                  className={`p-3 rounded-xl border text-left transition ${
                    deliveryType === "self"
                      ? "border-rust bg-rust/5 ring-1 ring-rust"
                      : "border-sand-200 bg-sand-50 text-ink-muted hover:border-sand-300"
                  }`}
                >
                  <div className={`font-semibold text-xs ${deliveryType === "self" ? "text-rust" : "text-ink"}`}>
                    Ambil di Garasi
                  </div>
                  <div className={`text-[11px] mt-0.5 ${deliveryType === "self" ? "text-ink-muted" : "text-ink-faint"}`}>
                    Gratis (Garasi ms.Rent)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType("delivery")}
                  className={`p-3 rounded-xl border text-left transition ${
                    deliveryType === "delivery"
                      ? "border-rust bg-rust/5 ring-1 ring-rust"
                      : "border-sand-200 bg-sand-50 text-ink-muted hover:border-sand-300"
                  }`}
                >
                  <div className={`font-semibold text-xs ${deliveryType === "delivery" ? "text-rust" : "text-ink"}`}>
                    Antar ke Lokasi
                  </div>
                  <div className={`text-[11px] mt-0.5 ${deliveryType === "delivery" ? "text-rust font-medium" : "text-ink-faint"}`}>
                    +Rp 35.000 (Stasiun/Hotel)
                  </div>
                </button>
              </div>

              {deliveryType === "delivery" && (
                <div>
                  <label htmlFor={`${formId}-delivery-address`} className="block text-xs text-ink-muted mb-1">
                    Alamat Pengantaran (Nama Stasiun / Hotel / Alamat Lengkap)
                  </label>
                  <input
                    id={`${formId}-delivery-address`}
                    type="text"
                    placeholder="Contoh: Lobby Hotel Santika, atau Pintu Timur Stasiun Gambir"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                    required={deliveryType === "delivery"}
                  />
                </div>
              )}
            </div>

            {/* Tambahan Opsional */}
            <div className="pt-3 border-t border-sand-200">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-sand-50 border border-sand-200 text-xs">
                <div>
                  <span className="font-medium text-ink block">Helm Tambahan (+Rp 15.000/hari)</span>
                  <span className="text-ink-muted text-[11px]">Setiap sewa sudah termasuk gratis 2 Helm SNI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setExtraHelmets(Math.max(0, extraHelmets - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-sand-200 text-ink font-semibold hover:bg-sand-100 text-xs transition"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold w-4 text-center text-ink">{extraHelmets}</span>
                  <button
                    type="button"
                    onClick={() => setExtraHelmets(Math.min(2, extraHelmets + 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-sand-200 text-ink font-semibold hover:bg-sand-100 text-xs transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Rincian Biaya */}
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-2 text-xs">
              <div className="flex justify-between text-ink-muted">
                <span>Sewa {bike.name} ({days} hari)</span>
                <span className="text-ink font-medium">{formatRupiah(rentalBaseCost)}</span>
              </div>
              {deliveryCost > 0 && (
                <div className="flex justify-between text-ink-muted">
                  <span>Ongkos Antar-Jemput</span>
                  <span className="text-ink font-medium">{formatRupiah(deliveryCost)}</span>
                </div>
              )}
              {extraHelmetCost > 0 && (
                <div className="flex justify-between text-ink-muted">
                  <span>Helm Tambahan ({extraHelmets} unit x {days} hari)</span>
                  <span className="text-ink font-medium">{formatRupiah(extraHelmetCost)}</span>
                </div>
              )}
              <div className="pt-2.5 border-t border-sand-200 flex justify-between items-baseline">
                <span className="font-semibold text-ink text-xs">Estimasi Total Pembayaran</span>
                <span className="font-serif font-bold text-lg text-rust">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium text-xs sm:text-sm bg-rust hover:bg-rust-hover text-white transition disabled:opacity-50 shadow-warm-sm"
              >
                {loading ? "Memproses Data..." : `Konfirmasi Reservasi (${formatRupiah(grandTotal)})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
