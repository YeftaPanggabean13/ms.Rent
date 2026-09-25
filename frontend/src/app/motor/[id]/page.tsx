"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Bike } from "@/types";
import { getBikeByID, getBikeCalendar, getBikes } from "@/lib/api";
import BookingModal from "@/components/BookingModal";
import Navbar from "@/components/Navbar";
import CheckBookingModal from "@/components/CheckBookingModal";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Fuel,
  Gauge,
  Settings2,
  Shield,
  Share2,
} from "lucide-react";

export default function BikeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bikeId = Number(params.id);

  const [bike, setBike] = useState<Bike | null>(null);
  const [relatedBikes, setRelatedBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingBike, setBookingBike] = useState<Bike | null>(null);
  const [checkBookingOpen, setCheckBookingOpen] = useState(false);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [bookedDates, setBookedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const b = await getBikeByID(bikeId);
      if (!b) {
        router.push("/");
        return;
      }
      setBike(b);

      // Load related bikes (same category, exclude current)
      const allBikes = await getBikes({ category: b.category });
      setRelatedBikes(allBikes.filter((rb) => rb.id !== b.id).slice(0, 3));

      setLoading(false);
    }
    if (bikeId) load();
  }, [bikeId, router]);

  // Load calendar data
  useEffect(() => {
    if (!bikeId) return;
    getBikeCalendar(bikeId, calendarMonth).then(setBookedDates);
  }, [bikeId, calendarMonth]);

  const navigateMonth = (dir: number) => {
    const [y, m] = calendarMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setCalendarMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleShare = () => {
    if (!bike) return;
    const text = `Sewa ${bike.name} di ms.Rent — ${formatRupiah(bike.price_per_day)}/hari. Cek di ${window.location.href}`;
    if (navigator.share) {
      navigator.share({ title: bike.name, text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      alert("Link berhasil disalin!");
    }
  };

  if (loading || !bike) {
    return (
      <div className="min-h-screen bg-base flex flex-col">
        <Navbar onOpenCheckBooking={() => setCheckBookingOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sand-100 animate-pulse" />
            <p className="text-sm text-ink-muted">Memuat detail motor...</p>
          </div>
        </div>
      </div>
    );
  }

  const featureList = bike.features.split(",").map((f) => f.trim()).filter(Boolean);

  // Calendar rendering
  const renderCalendar = () => {
    const [year, month] = calendarMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();
    const today = new Date().toISOString().split("T")[0];

    const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

    const cells = [];
    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} />);
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const status = bookedDates[dateStr];
      const isPast = dateStr < today;

      let bg = "bg-moss/10 text-moss"; // available
      let label = "Tersedia";
      if (isPast) {
        bg = "bg-sand-100 text-ink-faint";
        label = "";
      } else if (status === "active" || status === "confirmed") {
        bg = "bg-rust/15 text-rust";
        label = "Terpakai";
      } else if (status === "pending") {
        bg = "bg-amber-100 text-amber-700";
        label = "Pending";
      }

      cells.push(
        <div
          key={d}
          className={`relative p-1.5 rounded-lg text-center text-xs font-medium transition ${bg} ${isPast ? "opacity-50" : ""}`}
          title={label ? `${dateStr}: ${label}` : dateStr}
        >
          <span className="block text-sm font-semibold">{d}</span>
          {!isPast && (
            <span className="block text-[9px] mt-0.5 leading-none">{label}</span>
          )}
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-sand-100 text-ink-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-ink">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg hover:bg-sand-100 text-ink-muted transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((dn) => (
            <div key={dn} className="text-center text-[10px] font-semibold text-ink-faint py-1">
              {dn}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{cells}</div>
        {/* Legend */}
        <div className="flex items-center space-x-4 mt-4 text-[10px] text-ink-muted">
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-moss/20" /><span>Tersedia</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-rust/20" /><span>Terpakai</span></span>
          <span className="flex items-center space-x-1"><span className="w-2.5 h-2.5 rounded bg-amber-200" /><span>Pending</span></span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col font-sans">
      <Navbar onOpenCheckBooking={() => setCheckBookingOpen(true)} />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center space-x-2 text-xs text-ink-muted">
          <Link href="/" className="hover:text-rust transition">Beranda</Link>
          <span>/</span>
          <Link href="/#armada" className="hover:text-rust transition">Katalog</Link>
          <span>/</span>
          <span className="text-ink font-medium">{bike.name}</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Image & Specs */}
          <div className="lg:col-span-7 space-y-6">
            {/* Hero Image */}
            <div className="relative rounded-2xl overflow-hidden border border-sand-200 shadow-warm-md bg-sand-100 aspect-[16/10]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bike.image_url}
                alt={bike.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />

              {/* Status badge */}
              <div className="absolute top-4 left-4">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border ${
                    bike.status === "available"
                      ? "bg-moss/90 text-white border-moss/50"
                      : bike.status === "rented"
                      ? "bg-rust/90 text-white border-rust/50"
                      : "bg-sand-200/90 text-ink border-sand-300"
                  }`}
                >
                  {bike.status === "available" ? "✓ Tersedia" : bike.status === "rented" ? "Sedang Disewa" : "Dalam Servis"}
                </span>
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="absolute top-4 right-4 p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-sand-200/80 text-ink hover:bg-white transition shadow-warm-sm"
                title="Bagikan"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white border border-sand-200 shadow-warm-sm text-center">
                <Gauge className="w-5 h-5 mx-auto text-rust mb-1.5" />
                <span className="block text-lg font-serif font-bold text-ink">{bike.engine_cc}cc</span>
                <span className="text-[10px] text-ink-muted">Kapasitas Mesin</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-sand-200 shadow-warm-sm text-center">
                <Settings2 className="w-5 h-5 mx-auto text-rust mb-1.5" />
                <span className="block text-lg font-serif font-bold text-ink">{bike.transmission}</span>
                <span className="text-[10px] text-ink-muted">Transmisi</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-sand-200 shadow-warm-sm text-center">
                <Calendar className="w-5 h-5 mx-auto text-rust mb-1.5" />
                <span className="block text-lg font-serif font-bold text-ink">{bike.year}</span>
                <span className="text-[10px] text-ink-muted">Tahun Produksi</span>
              </div>
              <div className="p-4 rounded-xl bg-white border border-sand-200 shadow-warm-sm text-center">
                <Fuel className="w-5 h-5 mx-auto text-rust mb-1.5" />
                <span className="block text-lg font-serif font-bold text-ink">{bike.brand}</span>
                <span className="text-[10px] text-ink-muted">Brand</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 rounded-2xl bg-white border border-sand-200 shadow-warm-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-ink">Tentang Unit Ini</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{bike.description}</p>

              {/* Features */}
              <div>
                <h4 className="text-xs font-semibold text-ink mb-2">Fasilitas & Kelengkapan</h4>
                <div className="flex flex-wrap gap-2">
                  {featureList.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sand-50 border border-sand-200 text-xs font-medium text-ink"
                    >
                      <Shield className="w-3 h-3 mr-1.5 text-moss" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Availability Calendar */}
            <div className="p-6 rounded-2xl bg-white border border-sand-200 shadow-warm-sm">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-rust" />
                <h3 className="font-serif text-lg font-bold text-ink">Kalender Ketersediaan</h3>
              </div>
              {renderCalendar()}
            </div>
          </div>

          {/* Right: Pricing & CTA */}
          <div className="lg:col-span-5 space-y-6">
            {/* Sticky pricing card */}
            <div className="lg:sticky lg:top-24">
              <div className="p-6 rounded-2xl bg-white border border-sand-200 shadow-warm-lg space-y-5">
                {/* Title */}
                <div>
                  <div className="flex items-center space-x-2 text-xs text-ink-muted mb-1">
                    <span className="text-rust font-semibold">{bike.brand}</span>
                    <span>·</span>
                    <span>{bike.category}</span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink leading-tight">
                    {bike.name}
                  </h1>
                  <p className="text-xs text-ink-faint mt-1">Plat: {bike.plate_number}</p>
                </div>

                {/* Price */}
                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200">
                  <span className="text-xs text-ink-muted block mb-1">Tarif Sewa Harian</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="font-serif text-3xl font-bold text-rust">
                      {formatRupiah(bike.price_per_day)}
                    </span>
                    <span className="text-sm text-ink-muted">/ 24 jam</span>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-ink-muted">
                    <div className="flex justify-between">
                      <span>Mingguan (7 hari)</span>
                      <span className="font-medium text-ink">{formatRupiah(bike.price_per_day * 7 * 0.9)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bulanan (30 hari)</span>
                      <span className="font-medium text-ink">{formatRupiah(bike.price_per_day * 30 * 0.75)}</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => setBookingBike(bike)}
                  disabled={bike.status !== "available"}
                  className="w-full py-3.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-semibold text-sm transition shadow-warm-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bike.status === "available" ? "Pesan Unit Ini Sekarang" : "Unit Tidak Tersedia"}
                </button>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/6281234567890?text=Halo%20ms.Rent,%20saya%20tertarik%20sewa%20${encodeURIComponent(bike.name)}%20(${bike.plate_number})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-2.5 rounded-xl bg-sand-50 hover:bg-sand-100 border border-sand-200 text-ink text-xs font-medium transition"
                >
                  Tanya via WhatsApp
                </a>

                {/* Info */}
                <div className="space-y-2.5 text-xs text-ink-muted border-t border-sand-200 pt-4">
                  <div className="flex items-start space-x-2">
                    <span className="w-1 h-1 mt-1.5 rounded-full bg-moss shrink-0" />
                    <span>Gratis 2 Helm SNI + Jas Hujan setiap sewa</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1 h-1 mt-1.5 rounded-full bg-moss shrink-0" />
                    <span>Unit disanitasi & diservis berkala tiap 2.000 km</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1 h-1 mt-1.5 rounded-full bg-moss shrink-0" />
                    <span>Layanan antar-jemput stasiun, hotel & bandara</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1 h-1 mt-1.5 rounded-full bg-moss shrink-0" />
                    <span>Dukungan darurat jalanan 24 jam</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Bikes */}
        {relatedBikes.length > 0 && (
          <div className="mt-16 pt-10 border-t border-sand-200">
            <div className="mb-6">
              <span className="text-xs font-semibold text-rust tracking-wide">Motor Serupa</span>
              <h2 className="font-serif text-2xl font-bold text-ink mt-1">
                Pilihan Lain di Kategori {bike.category}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedBikes.map((rb) => (
                <Link
                  key={rb.id}
                  href={`/motor/${rb.id}`}
                  className="group p-4 rounded-2xl bg-white border border-sand-200 shadow-warm-sm hover:shadow-warm-md transition-all"
                >
                  <div className="rounded-xl overflow-hidden aspect-[16/10] bg-sand-100 mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={rb.image_url}
                      alt={rb.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-ink-muted mb-1">
                    <span className="font-medium">{rb.brand}</span>
                    <span>·</span>
                    <span className="text-rust">{rb.category}</span>
                  </div>
                  <h3 className="font-serif font-bold text-ink group-hover:text-rust transition">{rb.name}</h3>
                  <p className="font-serif text-rust font-bold mt-1">
                    {formatRupiah(rb.price_per_day)} <span className="text-xs text-ink-muted font-sans font-normal">/ hari</span>
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-sand-200 bg-sand-100/60 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[11px] text-ink-faint">
          <span>&copy; {new Date().getFullYear()} ms.Rent. Garasi Motor Urban.</span>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        bike={bookingBike}
        onClose={() => setBookingBike(null)}
        onSuccess={() => {}}
      />
      <CheckBookingModal
        isOpen={checkBookingOpen}
        onClose={() => setCheckBookingOpen(false)}
      />
    </div>
  );
}
