"use client";

import { useState } from "react";
import { Bike } from "@/types";
import { 
  X, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface ShowcaseCatalogProps {
  bikes: Bike[];
  onSelectBikeForBooking: (bike: Bike) => void;
  onOpenHoursModal?: (bike: Bike) => void;
  externalActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

interface ShowcaseItem {
  id: number;
  tabLabel: string;
  watermarkText: string;
  tagline: string;
  pngUrl: string;
  specs: {
    engine: string;
    consumption: string;
    transmission: string;
    year: string;
    features: string[];
  };
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 9,
    tabLabel: "Beat 2022",
    watermarkText: "Beat 2022",
    tagline: "Motor matic lincah dan hemat bahan bakar untuk kebutuhan mobilitas perkotaan.",
    pngUrl: "/bikes/beat-2022.png",
    specs: {
      engine: "110 cc eSP",
      consumption: "60.6 km/L (Super Irit)",
      transmission: "Otomatis (V-Matic)",
      year: "2022",
      features: ["2 Helm SNI", "Jas Hujan", "Phone Holder", "Combi Brake System (CBS)", "Idling Stop System"],
    },
  },
  {
    id: 10,
    tabLabel: "Scoopy 2023",
    watermarkText: "Scoopy 2023",
    tagline: "Desain retro modern yang stylish dan nyaman untuk perjalanan harian santai.",
    pngUrl: "/bikes/scoopy-2023.png",
    specs: {
      engine: "110 cc eSP Modern",
      consumption: "59.0 km/L",
      transmission: "Otomatis (V-Matic)",
      year: "2023",
      features: ["2 Helm Bogo Retro", "Jas Hujan", "Smart Key System", "USB Charger In-Console", "Bagasi 15.4L"],
    },
  },
  {
    id: 11,
    tabLabel: "Aerox 150s",
    watermarkText: "Aerox 150s",
    tagline: "Performa bertenaga dengan akselerasi responsif dan posisi berkendara sporty.",
    pngUrl: "/bikes/aerox-150s.png",
    specs: {
      engine: "155 cc Blue Core VVA",
      consumption: "45.0 km/L",
      transmission: "Otomatis (Sport Matic)",
      year: "2023",
      features: ["2 Helm SNI Sport", "Jas Hujan", "Phone Holder", "Rem ABS", "Sub-tank Rear Suspension"],
    },
  },
];

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

  const activeIndex = externalActiveIndex !== undefined ? externalActiveIndex : internalActiveIndex;
  const setActiveIndex = (setter: number | ((prev: number) => number)) => {
    const nextVal = typeof setter === "function" ? setter(activeIndex) : setter;
    setInternalActiveIndex(nextVal);
    onActiveIndexChange?.(nextVal);
  };

  const activeShowcase = SHOWCASE_ITEMS[activeIndex];

  const dbBike = bikes.find(
    (b) => b.id === activeShowcase.id || b.name.toLowerCase().includes(activeShowcase.tabLabel.toLowerCase().split(" ")[0])
  );

  const pricePerDay = dbBike?.price_per_day || (activeIndex === 0 ? 85000 : activeIndex === 1 ? 95000 : 125000);
  const pricePerHour = dbBike?.price_per_hour || (activeIndex === 0 ? 5000 : activeIndex === 1 ? 5500 : 6500);

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

    if (diff > 45 && activeIndex < SHOWCASE_ITEMS.length - 1) {
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

  return (
    <section 
      id="armada" 
      className="relative w-full overflow-hidden bg-bg text-ink border-b border-line scroll-mt-20 select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 relative z-10">
        
        {/* TOP NAVIGATION TABS + CONTROLS */}
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {SHOWCASE_ITEMS.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.tabLabel}
                  type="button"
                  onClick={() => handleTabChange(idx)}
                  className={`relative pb-2 text-base sm:text-xl md:text-2xl tracking-tight transition-colors duration-200 cursor-pointer font-bold ${
                    isActive
                      ? "text-ink border-b-2 border-accent"
                      : "text-ink-muted border-b-2 border-transparent hover:text-ink"
                  }`}
                  aria-pressed={isActive}
                >
                  {item.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Navigation Controls (Page indicator + Chevron Buttons) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-xs text-ink-muted font-semibold tracking-wider">
              0{activeIndex + 1} / 0{SHOWCASE_ITEMS.length}
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
                onClick={() => setActiveIndex((prev) => Math.min(SHOWCASE_ITEMS.length - 1, prev + 1))}
                disabled={activeIndex === SHOWCASE_ITEMS.length - 1}
                aria-label="Unit berikutnya"
                className="p-1.5 sm:p-2 rounded-[4px] border border-line bg-surface hover:bg-bg disabled:opacity-25 disabled:cursor-not-allowed transition text-ink cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN STAGE: Horizontal Sliding Track */}
        <div 
          className="relative mt-8 sm:mt-10 overflow-hidden w-full select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex w-full transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {SHOWCASE_ITEMS.map((item, idx) => {
              const isActive = idx === activeIndex;

              return (
                <div 
                  key={item.id}
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
                      {item.watermarkText}
                    </span>
                  </div>

                  {/* LEFT CONTENT: Only short tagline and "Lihat Detail" button */}
                  <div className="relative z-10 max-w-[260px] sm:max-w-[320px] md:max-w-sm space-y-6 self-start pt-2 sm:pt-4">
                    {/* Tagline / Penjelasan Singkat */}
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {item.tagline}
                    </p>

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
                        src={item.pngUrl}
                        alt={item.tabLabel}
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
      {isDetailOpen && (
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
                    <span className="text-4xl font-black text-watermark">{activeShowcase.watermarkText}</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeShowcase.pngUrl}
                    alt={activeShowcase.tabLabel}
                    className="relative z-10 w-full max-h-[240px] object-contain"
                  />
                </div>

                {/* Bike Info & Rates */}
                <div className="md:col-span-6 space-y-4">
                  <div>
                    <h3 id="modal-title" className="text-2xl font-extrabold text-ink tracking-tight">
                      {activeShowcase.tabLabel}
                    </h3>
                    <p className="text-xs text-ink-muted mt-1">
                      Kategori: {activeIndex === 1 ? "Retro Matic" : activeIndex === 2 ? "Sport Matic" : "Matic Compact"} · Tahun {activeShowcase.specs.year}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-4 rounded-[6px] bg-bg border border-line space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-ink-muted">Tarif Sewa Harian:</span>
                      <span className="text-xl font-extrabold text-accent">
                        {formatRupiah(pricePerDay)} <span className="text-xs font-normal text-ink-muted">/ 24 jam</span>
                      </span>
                    </div>
                    {pricePerHour > 0 && (
                      <div className="flex items-baseline justify-between pt-2 border-t border-line">
                        <span className="text-xs text-ink-muted">Tarif Sewa Jam:</span>
                        <span className="text-sm font-bold text-ink">
                          {formatRupiah(pricePerHour)} <span className="text-[11px] font-normal text-ink-muted">/ jam</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    {activeShowcase.tagline} Unit terawat berkala dengan helm SNI higienis dan siap jalan.
                  </p>
                </div>
              </div>

              {/* Technical Specs */}
              <div className="pt-4 border-t border-line">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Spesifikasi &amp; Performa Unit
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Kapasitas Mesin</span>
                    <p className="font-bold text-ink mt-0.5">{activeShowcase.specs.engine}</p>
                  </div>
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Konsumsi BBM</span>
                    <p className="font-bold text-ink mt-0.5">{activeShowcase.specs.consumption}</p>
                  </div>
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Transmisi</span>
                    <p className="font-bold text-ink mt-0.5">{activeShowcase.specs.transmission}</p>
                  </div>
                  <div className="p-3 rounded-[6px] bg-bg border border-line">
                    <span className="text-[10px] text-ink-muted uppercase">Tahun Perakitan</span>
                    <p className="font-bold text-ink mt-0.5">{activeShowcase.specs.year}</p>
                  </div>
                </div>
              </div>

              {/* Included Perks */}
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-3">
                  Fasilitas Termasuk dalam Sewa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {activeShowcase.specs.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-ink-muted">
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
                    <span>Antar-Jemput ke Kampus / Stasiun / Kost"</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-line bg-bg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {dbBike && onOpenHoursModal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      onOpenHoursModal(dbBike);
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[4px] border border-line bg-surface hover:bg-bg text-ink text-xs font-semibold transition"
                  >
                    <Clock className="w-3.5 h-3.5" /> Cek Ketersediaan Jam
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  const target = dbBike || ({
                    id: activeShowcase.id,
                    name: activeShowcase.tabLabel,
                    brand: activeIndex === 2 ? "Yamaha" : "Honda",
                    category: activeIndex === 1 ? "Retro Matic" : activeIndex === 2 ? "Sport Matic" : "Matic Compact",
                    engine_cc: activeIndex === 2 ? 155 : 110,
                    year: parseInt(activeShowcase.specs.year),
                    transmission: "Automatic",
                    price_per_day: pricePerDay,
                    price_per_hour: pricePerHour,
                    plate_number: activeIndex === 0 ? "B 3912 KFX" : activeIndex === 1 ? "B 4712 SCP" : "B 6023 ARX",
                    status: "available",
                    image_url: activeShowcase.pngUrl,
                    features: activeShowcase.specs.features.join(", "),
                    description: activeShowcase.tagline,
                  } as Bike);
                  onSelectBikeForBooking(target);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[4px] bg-accent text-accent-ink hover:opacity-90 text-xs font-bold transition"
              >
                Pesan Unit Ini Sekarang <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

