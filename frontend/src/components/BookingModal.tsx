"use client";

import { useState, useEffect, useId } from "react";
import { Bike, Booking } from "@/types";
import { createBooking } from "@/lib/api";
import { X, Copy, Check, Bike as BikeIcon, CalendarDays, Truck, Wallet, ArrowRight } from "lucide-react";
import BookingStatusTimeline from "@/components/BookingStatusTimeline";
import TermsModal from "@/components/TermsModal";

const NEXT_STEPS = [
  {
    t: "Simpan kode reservasi",
    d: "Catat atau salin kode di atas — dipakai untuk melacak status kapan saja.",
  },
  {
    t: "Tunggu konfirmasi garasi",
    d: "Admin memverifikasi ketersediaan unit melalui WhatsApp.",
  },
  {
    t: "Lakukan pembayaran",
    d: "Transfer BCA / Mandiri / BRI atau QRIS setelah reservasi dikonfirmasi.",
  },
];

function InfoRow({ icon: Icon, label, value }: { icon: typeof BikeIcon; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-start gap-2 text-ink-muted min-w-0">
        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-faint" />
        <span>{label}</span>
      </span>
      <span className="text-ink font-semibold text-right">{value}</span>
    </div>
  );
}

interface BookingModalProps {
  bike: Bike | null;
  onClose: () => void;
  onSuccess?: () => void;
  onTrackBooking?: (code: string) => void;
}

const toLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Default tanggal sewa dihitung sekali saat modul dimuat (zona waktu lokal, bukan UTC)
const DEFAULT_START_DATE = toLocalDateString(new Date());
const DEFAULT_END_DATE = toLocalDateString(new Date(Date.now() + 86400000));

// Opsi jam untuk sewa per jam (per jam penuh)
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

// Jam mulai default: jam berikutnya yang belum lewat (harian maupun per jam)
const nextValidStartTime = () => {
  const h = new Date().getHours();
  return h + 1 <= 23 ? `${String(h + 1).padStart(2, "0")}:00` : "00:00";
};

export default function BookingModal({ bike, onClose, onSuccess, onTrackBooking }: BookingModalProps) {
  const formId = useId();

  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [endDate, setEndDate] = useState(DEFAULT_END_DATE);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idCard, setIdCard] = useState("");
  const [deliveryType, setDeliveryType] = useState<"self" | "delivery">("self");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [extraHelmets, setExtraHelmets] = useState(0);
  const [rentalType, setRentalType] = useState<"daily" | "hourly">("daily");
  const [startTime, setStartTime] = useState(nextValidStartTime);
  const [endTime, setEndTime] = useState("17:00");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  // Waktu sekarang (diperbarui tiap 30 detik) untuk menolak jadwal yang sudah berlalu
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const toLocalDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const todayStr = toLocalDate(now);
  const isToday = startDate === todayStr;

  // Jam mulai yang masih belum berlalu (untuk hari ini hanya jam setelah jam sekarang)
  const validStartTimesFor = (date: string) =>
    TIME_OPTIONS.filter((t) => date !== todayStr || Number(t.slice(0, 2)) > now.getHours());

  const availableStartTimes = validStartTimesFor(startDate);

  const clampStartTime = (date: string) => {
    const validTimes = validStartTimesFor(date);
    if (validTimes.length > 0 && !validTimes.includes(startTime)) setStartTime(validTimes[0]);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    // Sewa harian minimal 1 hari (24 jam): tanggal selesai minimal sehari setelah tanggal mulai
    const minEnd = toLocalDateString(new Date(new Date(`${value}T00:00:00`).getTime() + 86400000));
    if (endDate <= value) setEndDate(minEnd);
    clampStartTime(value);
  };

  const switchRentalType = (type: "daily" | "hourly") => {
    setRentalType(type);
    if (type === "hourly") clampStartTime(startDate);
  };

  if (!bike) return null;

  // Hitung durasi hari (sewa harian)
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

  // Hitung durasi jam (sewa per jam) — boleh melewati tengah malam
  const calcHourly = () => {
    try {
      const s = new Date(`${startDate}T${startTime}:00`);
      let e = new Date(`${startDate}T${endTime}:00`);
      if (e.getTime() <= s.getTime()) e = new Date(e.getTime() + 86400000);
      const hours = Math.round((e.getTime() - s.getTime()) / 3600000);
      return { hours, endDate: toLocalDate(e) };
    } catch {
      return { hours: 0, endDate: startDate };
    }
  };

  const hourlyEnabled = bike.price_per_hour > 0;
  const isHourly = rentalType === "hourly" && hourlyEnabled;
  const { hours: durationHours, endDate: computedEndDate } = calcHourly();
  const hoursValid = durationHours >= 2 && durationHours <= 23;

  const days = calcDays();
  // Sewa harian: selesai = tanggal selesai pada jam mulai yang sama (N x 24 jam)
  const minEndDate = toLocalDateString(new Date(new Date(`${startDate}T00:00:00`).getTime() + 86400000));
  const rentalBaseCost = isHourly ? bike.price_per_hour * durationHours : bike.price_per_day * days;
  const deliveryCost = deliveryType === "delivery" ? 35000 : 0;
  const extraHelmetCost = extraHelmets * 15000 * (isHourly ? 1 : days);
  const grandTotal = rentalBaseCost + deliveryCost + extraHelmetCost;

  const scheduleText = isHourly
    ? `${startDate} ${startTime} - ${computedEndDate} ${endTime} (${durationHours} jam)`
    : `${startDate} ${startTime} - ${endDate} ${startTime} (${days} hari)`;

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
    if (startDate < todayStr) {
      setErrorMsg("Tanggal mulai sewa sudah lewat. Silakan pilih jadwal yang masih belum berlalu.");
      return;
    }
    if (isHourly && !hoursValid) {
      setErrorMsg("Durasi sewa per jam minimal 2 jam dan maksimal 23 jam. Untuk 24 jam ke atas, pilih sewa Harian.");
      return;
    }
    if (!isHourly && endDate <= startDate) {
      setErrorMsg("Sewa harian minimal 1 hari (24 jam penuh dari jam mulai). Tanggal selesai harus setelah tanggal mulai.");
      return;
    }
    if (availableStartTimes.length === 0) {
      setErrorMsg("Semua jam hari ini sudah lewat. Silakan pilih tanggal sewa besok atau setelahnya.");
      return;
    }
    const startAt = new Date(`${startDate}T${startTime}:00`);
    if (startAt.getTime() <= now.getTime()) {
      setErrorMsg(
        `Jam mulai ${startTime} sudah berlalu. Pilih jadwal mulai setelah pukul ${String(now.getHours()).padStart(2, "0")}:00 atau tanggal lain.`
      );
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Centang persetujuan Ketentuan & Syarat Rental untuk melanjutkan reservasi.");
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
      end_date: isHourly ? computedEndDate : endDate,
      duration_days: isHourly ? 0 : days,
      rental_type: isHourly ? "hourly" : "daily",
      start_time: startTime,
      end_time: isHourly ? endTime : "",
      duration_hours: isHourly ? durationHours : 0,
      pickup_location: deliveryType === "self" ? "Garasi ms.Rent" : "Layanan Antar Unit",
      return_location: deliveryType === "self" ? "Garasi ms.Rent" : "Layanan Antar/Jemput",
      delivery_address: deliveryType === "delivery" ? deliveryAddress : "",
      extra_helmets: extraHelmets,
      raincoat_count: 1,
      phone_holder: true,
      total_price: grandTotal,
      notes: "",
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
    const msg = `Halo Admin ms.Rent, saya telah membuat booking motor:%0A%0A*Kode Booking:* ${createdBooking.booking_code}%0A*Motor:* ${bike.name} (${bike.plate_number})%0A*Nama:* ${name}%0A*Jadwal:* ${scheduleText}%0A*Total Biaya:* ${formatRupiah(grandTotal)}%0A%0AMohon info rekening pembayaran dan konfirmasi ketersediaan unit. Terima kasih!`;
    return `https://wa.me/6282151728477?text=${msg}`;
  };

  return (
    <>
    <div className="fixed inset-0 z-50 flex p-4 sm:p-6 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl m-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] bg-white border border-sand-200 rounded-2xl shadow-warm-xl overflow-hidden animate-scale-in">
        {/* Header Modal */}
        <div className="flex items-center justify-between p-6 border-b border-sand-200 bg-sand-50/50 shrink-0">
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
          <div className="p-6 sm:p-8 text-center space-y-6 overflow-y-auto min-h-0">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-moss/10 text-moss border border-moss/20">
                Pemesanan Tercatat
              </span>
              <h3 className="font-serif text-2xl font-bold text-ink">Reservasi Siap Dikonfirmasi</h3>
              <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto leading-relaxed">
                Simpan Kode Reservasi di bawah ini untuk pelacakan status unit dan verifikasi garasi kami.
              </p>
            </div>

            {/* Timeline Status Reservasi */}
            <BookingStatusTimeline
              current={createdBooking.booking_status ?? "pending"}
              orientation="horizontal"
              className="max-w-md mx-auto text-left"
            />

            {/* Kode Booking Card */}
            <div className="p-4 rounded-xl border-2 border-dashed border-rust/30 bg-rust/5 flex items-center justify-between gap-3 max-w-md mx-auto text-left">
              <div className="min-w-0">
                <span className="text-[11px] text-ink-muted font-medium">Kode Reservasi:</span>
                <p className="text-lg font-bold text-ink tracking-wider truncate">{createdBooking.booking_code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-sand-200 hover:bg-sand-100 text-ink text-xs font-medium transition shadow-warm-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-moss" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Tersalin" : "Salin"}</span>
              </button>
            </div>

            {/* Langkah Selanjutnya */}
            <div className="text-left max-w-md mx-auto p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-3">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Langkah Selanjutnya
              </span>
              {NEXT_STEPS.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-white border border-moss/40 text-moss text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-ink">{step.t}</span>
                    <span className="block text-[11px] text-ink-muted leading-snug">{step.d}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Singkat */}
            <div className="text-left bg-white p-5 rounded-xl border border-sand-200 shadow-warm-sm text-xs space-y-3 max-w-md mx-auto">
              <InfoRow icon={BikeIcon} label="Unit Motor" value={bike.name} />
              <InfoRow
                icon={CalendarDays}
                label="Durasi Sewa"
                value={
                  isHourly
                    ? `${durationHours} Jam (${startDate} ${startTime} - ${computedEndDate} ${endTime})`
                    : `${days} Hari (${startDate} ${startTime} - ${endDate} ${startTime})`
                }
              />
              <InfoRow
                icon={Truck}
                label="Metode Penyerahan"
                value={deliveryType === "delivery" ? "Antar ke Lokasi Pemesan" : "Ambil Sendiri di Garasi"}
              />
              <div className="flex justify-between items-baseline pt-3 border-t border-sand-200">
                <span className="text-ink-light font-semibold text-xs">Total Pembayaran:</span>
                <span className="font-serif text-lg font-bold text-rust">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1 max-w-md mx-auto">
              <a
                href={getWaLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-3 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs sm:text-sm transition shadow-warm-sm text-center"
              >
                Konfirmasi via WhatsApp Sekarang
              </a>
              <div className={onTrackBooking ? "grid grid-cols-2 gap-2.5" : "space-y-2.5"}>
                {onTrackBooking && (
                  <button
                    onClick={() => {
                      if (createdBooking.booking_code) onTrackBooking(createdBooking.booking_code);
                      onClose();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white hover:bg-sand-50 border border-sand-300 text-ink font-medium text-xs transition active:scale-95"
                  >
                    Lacak Reservasi <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-light font-medium text-xs transition"
                >
                  Tutup Jendela
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Booking */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto min-h-0">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {/* Tanggal Sewa */}
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                01
              </span>
              <span className="text-xs font-semibold text-ink">
                Tanggal &amp; Jam Sewa
              </span>
            </div>

            {/* Tipe sewa: Harian / Per Jam */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => switchRentalType("daily")}
                className={`p-3 rounded-xl border text-left transition ${
                  rentalType === "daily"
                    ? "border-rust bg-rust/5 ring-1 ring-rust"
                    : "border-sand-200 bg-sand-50 text-ink-muted hover:border-sand-300"
                }`}
              >
                <div className={`font-semibold text-xs ${rentalType === "daily" ? "text-rust" : "text-ink"}`}>
                  Harian (24 jam)
                </div>
                <div className={`text-[11px] mt-0.5 ${rentalType === "daily" ? "text-ink-muted" : "text-ink-faint"}`}>
                  {formatRupiah(bike.price_per_day)} / hari · mulai dari jam dipilih
                </div>
              </button>
              <button
                type="button"
                onClick={() => hourlyEnabled && switchRentalType("hourly")}
                disabled={!hourlyEnabled}
                title={hourlyEnabled ? "Sewa per jam" : "Tarif per jam belum tersedia untuk unit ini"}
                className={`p-3 rounded-xl border text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  rentalType === "hourly"
                    ? "border-rust bg-rust/5 ring-1 ring-rust"
                    : "border-sand-200 bg-sand-50 text-ink-muted hover:border-sand-300"
                }`}
              >
                <div className={`font-semibold text-xs ${rentalType === "hourly" ? "text-rust" : "text-ink"}`}>
                  Per Jam (2-23 jam)
                </div>
                <div className={`text-[11px] mt-0.5 ${rentalType === "hourly" ? "text-ink-muted" : "text-ink-faint"}`}>
                  {hourlyEnabled ? `${formatRupiah(bike.price_per_hour)} / jam` : "Belum tersedia"}
                </div>
              </button>
            </div>

            {!isHourly ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor={`${formId}-start-date`} className="block text-xs font-medium text-ink mb-1.5">
                      Tanggal Mulai Sewa
                    </label>
                    <input
                      id={`${formId}-start-date`}
                      type="date"
                      min={todayStr}
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`${formId}-daily-start-time`} className="block text-xs font-medium text-ink mb-1.5">
                      Jam Mulai
                    </label>
                    <select
                      id={`${formId}-daily-start-time`}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                      required
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} disabled={!availableStartTimes.includes(t)}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor={`${formId}-end-date`} className="block text-xs font-medium text-ink mb-1.5">
                      Tanggal Selesai ({days} Hari)
                    </label>
                    <input
                      id={`${formId}-end-date`}
                      type="date"
                      min={minEndDate}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                      required
                    />
                  </div>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Durasi dihitung dari Jam Mulai — 1 hari = 24 jam penuh. Contoh: mulai{" "}
                  <span className="font-semibold text-ink">{startDate} {startTime}</span> → selesai{" "}
                  <span className="font-semibold text-ink">{endDate} {startTime}</span>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor={`${formId}-hourly-date`} className="block text-xs font-medium text-ink mb-1.5">
                      Tanggal Sewa
                    </label>
                    <input
                      id={`${formId}-hourly-date`}
                      type="date"
                      min={todayStr}
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor={`${formId}-start-time`} className="block text-xs font-medium text-ink mb-1.5">
                      Jam Mulai
                    </label>
                    <select
                      id={`${formId}-start-time`}
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                      required
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t} disabled={!availableStartTimes.includes(t)}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${formId}-end-time`} className="block text-xs font-medium text-ink mb-1.5">
                      Jam Selesai
                    </label>
                    <select
                      id={`${formId}-end-time`}
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-ink text-xs focus:outline-none focus:border-rust focus:bg-white transition"
                      required
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {isToday && (
                  <p className="text-[11px] text-ink-muted">
                    {availableStartTimes.length > 0
                      ? `Hari ini hanya jam mulai setelah pukul ${availableStartTimes[0]} yang masih bisa dipilih.`
                      : "Semua jam hari ini sudah lewat — silakan pilih tanggal sewa besok atau setelahnya."}
                  </p>
                )}
                <p className={`text-[11px] ${hoursValid ? "text-moss" : "text-rust"}`}>
                  {hoursValid
                    ? `Durasi ${durationHours} jam — kembali ${computedEndDate} pukul ${endTime}`
                    : "Durasi sewa per jam minimal 2 jam dan maksimal 23 jam"}
                </p>
              </div>
            )}

            {/* Data Penyewa */}
            <div className="space-y-3 pt-3 border-t border-sand-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  02
                </span>
                <span className="text-xs font-semibold text-ink">Identitas Pemesan</span>
              </div>
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
                    placeholder="082151728477"
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
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  03
                </span>
                <span className="text-xs font-semibold text-ink">Metode Penyerahan Unit</span>
              </div>
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
            <div className="pt-3 border-t border-sand-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-ink text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  04
                </span>
                <span className="text-xs font-semibold text-ink">Tambahan Opsional</span>
              </div>
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
            <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-start gap-2 text-ink-muted min-w-0">
                  <BikeIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-faint" />
                  <span>
                    <span className="block text-ink font-medium">Sewa Unit</span>
                    <span className="block text-[11px] text-ink-faint">
                      {isHourly
                        ? `${durationHours} jam x ${formatRupiah(bike.price_per_hour)}`
                        : `${days} hari x ${formatRupiah(bike.price_per_day)}`}
                    </span>
                  </span>
                </span>
                <span className="text-ink font-semibold">{formatRupiah(rentalBaseCost)}</span>
              </div>
              {deliveryCost > 0 && (
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2 text-ink-muted min-w-0">
                    <Truck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-faint" />
                    <span>
                      <span className="block text-ink font-medium">Antar-Jemput</span>
                      <span className="block text-[11px] text-ink-faint">Sekali jalan</span>
                    </span>
                  </span>
                  <span className="text-ink font-semibold">{formatRupiah(deliveryCost)}</span>
                </div>
              )}
              {extraHelmetCost > 0 && (
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-2 text-ink-muted min-w-0">
                    <Wallet className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ink-faint" />
                    <span>
                      <span className="block text-ink font-medium">Helm Tambahan</span>
                      <span className="block text-[11px] text-ink-faint">
                        {extraHelmets} unit x {isHourly ? "1 hari (sewa < 24 jam)" : `${days} hari`}
                      </span>
                    </span>
                  </span>
                  <span className="text-ink font-semibold">{formatRupiah(extraHelmetCost)}</span>
                </div>
              )}
              <div className="p-3 rounded-lg bg-rust/5 border border-rust/20 flex justify-between items-baseline gap-3">
                <span className="font-semibold text-ink text-xs">Estimasi Total Pembayaran</span>
                <span className="font-serif font-bold text-lg text-rust">{formatRupiah(grandTotal)}</span>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-moss">
                <Check className="w-3.5 h-3.5 shrink-0" />
                Sudah termasuk 2 helm SNI + jas hujan gratis.
              </p>
            </div>

            {/* Persetujuan Ketentuan */}
            <label
              htmlFor={`${formId}-agree`}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                agreeTerms ? "border-moss/40 bg-moss/5" : "border-sand-200 bg-sand-50 hover:border-sand-300"
              }`}
            >
              <input
                id={`${formId}-agree`}
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#C1622A]"
              />
              <span className="text-[11px] leading-relaxed text-ink-muted">
                Saya telah membaca dan menyetujui{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="text-rust font-semibold underline underline-offset-2 hover:text-rust-hover"
                >
                  Ketentuan &amp; Syarat Rental
                </button>{" "}
                ms.Rent, termasuk ketentuan dokumen, pembayaran, dan hitungan durasi sewa.
              </span>
            </label>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !agreeTerms}
                className="w-full py-3 rounded-xl font-medium text-xs sm:text-sm bg-rust hover:bg-rust-hover text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-warm-sm"
              >
                {loading ? "Memproses Data..." : `Konfirmasi Reservasi (${formatRupiah(grandTotal)})`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>

    {/* Modal Ketentuan & Syarat (tanpa pindah halaman) */}
    <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
    </>
  );
}
