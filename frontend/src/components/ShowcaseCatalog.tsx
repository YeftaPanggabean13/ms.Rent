"use client";

import { useState } from "react";
import { Bike } from "@/types";
import { initialMockBikes } from "@/lib/api";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";

interface ShowcaseCatalogProps {
  bikes: Bike[];
  onSelectBikeForBooking: (bike: Bike) => void;
  onOpenHoursModal?: (bike: Bike) => void;
  externalActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

export default function ShowcaseCatalog({
  bikes,
  onSelectBikeForBooking,
  onOpenHoursModal,
  externalActiveIndex,
  onActiveIndexChange,
}: ShowcaseCatalogProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Gunakan data dinamis dari backend, fallback ke initialMockBikes hanya jika data belum ter-load
  const displayBikes = bikes && bikes.length > 0 ? bikes : initialMockBikes;

  const rawActiveIndex = externalActiveIndex !== undefined ? externalActiveIndex : internalActiveIndex;
  // Pastikan activeIndex selalu berada dalam rentang valid displayBikes
  const activeIndex = Math.min(Math.max(0, rawActiveIndex), Math.max(0, displayBikes.length - 1));

  const setActiveIndex = (setter: number | ((prev: number) => number)) => {
    const nextVal = typeof setter === "function" ? setter(activeIndex) : setter;
    const clamped = Math.min(Math.max(0, nextVal), Math.max(0, displayBikes.length - 1));
    setInternalActiveIndex(clamped);
    onActiveIndexChange?.(clamped);
  };

  const activeBike = displayBikes[activeIndex] || displayBikes[0];

  const handleTabChange = (index: number) => {
    setActiveIndex(index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45 && activeIndex < displayBikes.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else if (diff < -45 && activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Helper fitur motor
  const getFeatureList = (featuresStr?: string) => {
    if (!featuresStr) return ["2 Helm SNI", "Jas Hujan", "Phone Holder"];
    return featuresStr.split(",").map((f) => f.trim()).filter(Boolean);
  };

  return (
    <section 
      id="armada" 
      className="relative w-full overflow-hidden bg-bg text-ink border-b border-line scroll-mt-20 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 relative z-10">
        
        {/* TOP NAVIGATION TABS + CONTROLS */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {displayBikes.map((bike, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={bike.id || idx}
                  type="button"
                  onClick={() => handleTabChange(idx)}
                  className={`relative pb-2 text-base sm:text-xl md:text-2xl tracking-tight transition-colors duration-200 cursor-pointer font-bold ${
                    isActive
                      ? "text-ink border-b-2 border-accent"
                      : "text-ink-muted border-b-2 border-transparent hover:text-ink"
                  }`}
                  aria-pressed={isActive}
                >
                  {bike.name}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls (Page indicator + Chevron Buttons) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-xs text-ink-muted font-semibold tracking-wider">
              {String(activeIndex + 1).padStart(2, "0")} / {String(displayBikes.length).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                aria-label="Unit sebelumnya"
                className="p-1.5 sm:p-2 rounded-[4px] border border-line bg-surface hover:bg-bg disabled:opacity-25 disabled:cursor-not-allowed transition text-ink cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.min(displayBikes.length - 1, prev + 1))}
                disabled={activeIndex === displayBikes.length - 1}
                aria-label="Unit berikutnya"
                className="p-1.5 sm:p-2 rounded-[4px] border border-line bg-surface hover:bg-bg disabled:opacity-25 disabled:cursor-not-allowed transition text-ink cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN SLIDER AREA (Continuous Canvas) */}
        <div 
          className="relative mt-4 sm:mt-6 overflow-hidden touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex w-full transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {displayBikes.map((bike, idx) => {
              const isActive = idx === activeIndex;
              const currentStock = bike.stock ?? 0;
              const currentAvail = bike.available_stock ?? currentStock;
              const isAvailable = currentAvail > 0 && bike.status !== "maintenance";

              return (
                <div 
                  key={bike.id || idx}
                  className="w-full shrink-0 relative min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] flex items-center"
                >
                  {/* GIANT WATERMARK TEXT (Behind bike, spanning lower canvas) */}
                  <div 
                    className="absolute inset-x-0 bottom-4 sm:bottom-6 pointer-events-none select-none z-0 flex items-center justify-start overflow-hidden pl-2 sm:pl-4"
                    aria-hidden="true"
                  >
                    <span 
                      className="font-black tracking-tight text-watermark whitespace-nowrap select-none text-[68px] sm:text-[110px] md:text-[150px] lg:text-[185px] xl:text-[210px]"
                      style={{
                        letterSpacing: "-0.03em",
                        lineHeight: "0.85",
                      }}
                    >
                      {bike.name}
                    </span>
                  </div>

                  {/* LEFT CONTENT: Short description, dynamic stock badge, & "Lihat Detail" button */}
                  <div className="relative z-10 max-w-[260px] sm:max-w-[320px] md:max-w-sm space-y-6 self-start pt-2 sm:pt-4">
                    {/* Tagline / Dynamic Stock Indicator */}
                    <div className="space-y-3">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                        isAvailable
                          ? "bg-accent/15 text-accent border-accent/25"
                          : "bg-red-500/10 text-red-600 border-red-500/25"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-accent animate-pulse" : "bg-red-500"}`} />
                        {isAvailable ? (
                          <span>Tersedia <strong>{currentAvail}</strong> dari {currentStock} Unit</span>
                        ) : (
                          <span>Stok Habis / Dalam Perawatan</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-3">
                        {bike.description}
                      </p>
                    </div>

                    {/* "Lihat Detail" Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveIndex(idx);
                          setIsDetailOpen(true);
                        }}
                        className="inline-flex items-center justify-center px-6 py-2.5 bg-accent text-accent-ink hover:opacity-90 font-bold text-xs sm:text-sm tracking-wide rounded-[4px] transition-opacity cursor-pointer shadow-sm"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </div>

                  {/* FOREGROUND MOTORCYCLE CUTOUT (On top of watermark, positioned to the right) */}
                  <div className="absolute right-0 sm:right-4 md:right-8 lg:right-12 bottom-0 z-10 w-[65%] sm:w-[60%] md:w-[56%] lg:w-[52%] max-w-[580px] pointer-events-none flex justify-end items-end">
                    <div 
                      className={`relative w-full aspect-[4/3] max-h-[300px] sm:max-h-[360px] lg:max-h-[400px] transition-transform duration-700 ease-out ${
                        isActive ? "scale-100" : "scale-95"
                      }`}
                    >
                      {/* Ground Shadow */}
                      <div 
                        className="absolute bottom-[3%] left-[10%] right-[10%] h-[12px] sm:h-[16px] bg-dark/20 blur-[12px] rounded-full"
                        aria-hidden="true"
                      />

                      {/* Motorcycle transparent PNG */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bike.image_url}
                        alt={bike.name}
                        className="w-full h-full object-contain select-none"
                        loading="eager"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL (Opened from "Lihat Detail") */}
      {isDetailOpen && activeBike && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-dark/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="relative w-full max-w-3xl bg-surface rounded-[6px] border border-line shadow-xl overflow-hidden max-h-[90vh] flex flex-col text-ink"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-bg">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Detail Unit ms.Rent
              </span>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 rounded text-ink-muted hover:text-ink hover:bg-line/40 transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Bike Cutout inside Modal */}
                <div className="md:col-span-6 bg-bg border border-line rounded-[6px] p-6 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <span className="text-4xl font-black text-watermark">{activeBike.name}</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeBike.image_url}
                    alt={activeBike.name}
                    className="relative z-10 w-full max-h-[240px] object-contain"
                  />
                </div>

                {/* Bike Info & Rates */}
                <div className="md:col-span-6 space-y-4">
                  <div>
                    <h3 id="modal-title" className="text-2xl font-extrabold text-ink tracking-tight">
                      {activeBike.name}
                    </h3>
                    <p className="text-xs text-ink-muted mt-1 flex flex-wrap items-center gap-1.5">
                      <span>{activeBike.category}</span>
                      <span>·</span>
                      <span>Tahun {activeBike.year}</span>
                      <span>·</span>
                      <span className={`font-bold ${
                        (activeBike.available_stock ?? activeBike.stock ?? 0) > 0 && activeBike.status !== "maintenance"
                          ? "text-accent"
                          : "text-red-500"
                      }`}>
                        Stok: {activeBike.stock ?? 0} Unit {activeBike.available_stock !== undefined ? `(${activeBike.available_stock} Siap)` : ""}
                      </span>
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-4 rounded-[6px] bg-bg border border-line space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-ink-muted">Tarif Sewa Harian:</span>
                      <span className="text-xl font-extrabold text-accent">
                        {formatRupiah(activeBike.price_per_day)} <span className="text-xs font-normal text-ink-muted">/ 24 jam</span>
                      </span>
                    </div>
                    {activeBike.price_per_hour > 0 && (
                      <div className="flex items-baseline justify-between pt-2 border-t border-line">
                        <span className="text-xs text-ink-muted">Tarif Sewa Jam:</span>
                        <span className="text-sm font-bold text-ink">
                          {formatRupiah(activeBike.price_per_hour)} <span className="text-[11px] font-normal text-ink-muted">/ jam</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    {activeBike.description}
                  </p>
                </div>
              </div>

              {/* Dynamic Specs Grid */}
              <div className="pt-2 border-t border-line">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Spesifikasi Kendaraan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Kapasitas Mesin</span>
                    <p className="font-bold text-ink mt-0.5">{activeBike.engine_cc} cc</p>
                  </div>
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Brand / Manufaktur</span>
                    <p className="font-bold text-ink mt-0.5">{activeBike.brand}</p>
                  </div>
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Transmisi</span>
                    <p className="font-bold text-ink mt-0.5">{activeBike.transmission}</p>
                  </div>
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Tahun Produksi</span>
                    <p className="font-bold text-ink mt-0.5">{activeBike.year}</p>
                  </div>
                </div>
              </div>

              {/* Included Perks */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Fasilitas Termasuk dalam Sewa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {getFeatureList(activeBike.features).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-ink-muted">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-ink-muted">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Layanan Bantuan Darurat 24 Jam Bandung</span>
                  </div>
                  <div className="flex items-center gap-2 text-ink-muted">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Antar-Jemput ke Stasiun / Hotel / Kost</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-line bg-bg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {onOpenHoursModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      onOpenHoursModal(activeBike);
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[4px] border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold transition cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" /> Cek Ketersediaan Jam
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={activeBike.status === "maintenance" || (activeBike.available_stock ?? activeBike.stock ?? 0) <= 0}
                onClick={() => {
                  setIsDetailOpen(false);
                  onSelectBikeForBooking(activeBike);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[4px] bg-accent text-accent-ink hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold transition cursor-pointer"
              >
                {activeBike.status === "maintenance" || (activeBike.available_stock ?? activeBike.stock ?? 0) <= 0
                  ? "Unit Sedang Tidak Tersedia"
                  : "Pesan Unit Ini Sekarang"} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
