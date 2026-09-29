"use client";

import { useState } from "react";
import { 
  FileText, 
  MapPin, 
  QrCode, 
  ShieldCheck, 
  Flag, 
  Check, 
  CreditCard,
  Clock,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldAlert
} from "lucide-react";

export interface StepItem {
  id: number;
  icon: any;
  title: string;
  desc: string;
  phoneBadge: string;
  phoneHeading: string;
  phoneBullets: string[];
}

export const STEPS: StepItem[] = [
  {
    id: 1,
    icon: FileText,
    title: "Siapkan Dokumen Ringan",
    desc: "Cukup e-KTP asli dan KTM Mahasiswa aktif (atau SIM A/NPWP/BPJS/Paspor). Tunjukkan SIM C aktif saat serah terima. Tanpa tahan ijazah/surat berharga.",
    phoneBadge: "Langkah 1 • Verifikasi Dokumen",
    phoneHeading: "Syarat Mahasiswa & Urban",
    phoneBullets: [
      "SIM C aktif milik pengemudi",
      "e-KTP Asli sebagai jaminan aman",
      "KTM Mahasiswa / SIM A / NPWP"
    ]
  },
  {
    id: 2,
    icon: MapPin,
    title: "Pilih Unit & Durasi Sewa",
    desc: "Tentukan pilihan motor Beat, Scoopy, atau Aerox. Pilih sewa harian (24 jam utuh) atau sewa per jam (minimal 2 jam) sesuai kebutuhan mobilitasmu.",
    phoneBadge: "Langkah 2 • Reservasi Unit",
    phoneHeading: "Pilih Motor & Waktu",
    phoneBullets: [
      "Unit matic: Beat / Scoopy / Aerox",
      "Sewa 24 jam utuh (bukan batas malam)",
      "Opsi sewa fleksibel per jam"
    ]
  },
  {
    id: 3,
    icon: QrCode,
    title: "Konfirmasi & Bayar via QRIS",
    desc: "Admin memverifikasi ketersediaan unit kilat via WhatsApp. Bayar praktis melalui QRIS resmi (Gopay, OVO, Dana, m-Banking) atau Transfer Bank tanpa uang deposit berbelit.",
    phoneBadge: "Langkah 3 • Pembayaran Praktis",
    phoneHeading: "QRIS & Bebas Deposit",
    phoneBullets: [
      "Bayar instan setelah unit confirm",
      "Scan QRIS semua bank & e-wallet",
      "Tanpa uang deposit berbelit"
    ]
  },
  {
    id: 4,
    icon: ShieldCheck,
    title: "Fasilitas Lengkap & Aman",
    desc: "Unit diantar langsung ke stasiun, hotel, atau kost. Lengkap 2 helm SNI higienis, jas hujan tebal, phone holder navigasi, serta bantuan darurat 24 jam di jalan.",
    phoneBadge: "Langkah 4 • Serah Terima",
    phoneHeading: "Paket Riding Siap Gas",
    phoneBullets: [
      "Gratis 2 Helm SNI higienis",
      "Jas hujan 2 set siap cuaca",
      "Holder HP + Bantuan 24 Jam"
    ]
  },
  {
    id: 5,
    icon: Flag,
    title: "Selesai & Pengembalian Fleksibel",
    desc: "Kunci dan motor dijemput kembali sesuai lokasi kesepakatan. Kena macet di jalanan Bandung? Nikmati toleransi keterlambatan hingga 60 menit bebas denda.",
    phoneBadge: "Langkah 5 • Pengembalian",
    phoneHeading: "Bebas Macet & Denda",
    phoneBullets: [
      "Jemput di Stasiun / Kost / Hotel",
      "Toleransi 60 menit bebas denda",
      "Jaminan dokumen dikembalikan utuh"
    ]
  },
];

// Fallback untuk modal lama yang mengimpor TERMS
export const TERMS = STEPS.map(s => ({
  q: s.title,
  a: s.desc
}));

interface TermsAccordionProps {
  className?: string;
  isModal?: boolean;
}

export default function TermsAccordion({ 
  className = "",
  isModal = false 
}: TermsAccordionProps) {
  // Default langkah ke-4 (Fasilitas Lengkap & Aman) aktif seperti konsep referensi
  const [activeStep, setActiveStep] = useState(3);

  const current = STEPS[activeStep];

  // Tampilan ringkas jika dibuka di dalam popup modal
  if (isModal) {
    return (
      <div className={`space-y-4 ${className}`}>
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStep;
          return (
            <div 
              key={step.id} 
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-[6px] border transition-all cursor-pointer ${
                isActive ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent/30"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  isActive ? "bg-accent text-accent-ink" : "bg-bg text-ink-muted border border-line"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isActive ? "text-accent" : "text-ink"}`}>
                    {step.title}
                  </h4>
                  <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        
        {/* ──────────────────────────────────────────────────────────
            KOLOM KIRI: REALISTIC APP SCREEN MOCKUP
            Menampilkan antarmuka booking nyata ms.Rent dengan foto motor asli
            ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex justify-center order-2 lg:order-1">
          <div className="w-[268px] sm:w-[286px] h-[520px] bg-[#1E1E1E] rounded-[42px] p-3 shadow-2xl border-4 border-[#2E2E2E] relative overflow-hidden flex flex-col justify-between select-none">
            
            {/* Dynamic Island / Speaker notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#121212] rounded-full z-30 flex items-center justify-between px-3">
              <span className="w-2 h-2 rounded-full bg-[#050505]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1A2535] border border-accent/40" />
            </div>

            {/* Phone Screen Canvas */}
            <div className="w-full h-full bg-[#FAF8F5] rounded-[32px] overflow-hidden flex flex-col justify-between relative z-10 pt-7 pb-3.5 px-3.5 border border-[#E5E0D8]">
              
              {/* Top Navigation Bar in Phone */}
              <div className="flex items-center justify-between border-b border-line/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="font-extrabold text-[12px] tracking-tight text-ink">
                    ms<span className="text-accent">.</span>rent
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                    Bandung Garasi
                  </span>
                </div>
              </div>

              {/* Main App Content: Real motor & relevant booking details */}
              <div className="flex-1 flex flex-col justify-between py-2.5 overflow-hidden">
                
                {/* Dynamic Screen Header & Route */}
                <div className="bg-surface rounded-xl p-2.5 border border-line text-left shadow-xs">
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-ink-muted">
                    <span>Titik Penyerahan</span>
                    <span className="text-accent font-semibold flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Siap Jalan
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-ink">
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                    <span className="truncate">Stasiun Bandung ➔ Kost / Hotel</span>
                  </div>
                </div>

                {/* Central Visual: Motor Realistis ms.Rent (Beat 2022 / Scoopy) */}
                <div className="my-1 relative bg-gradient-to-b from-[#F2EDE4] to-surface rounded-2xl p-2.5 border border-line flex flex-col items-center justify-center min-h-[145px]">
                  
                  {/* Watermark brand text */}
                  <span className="absolute top-1 text-[26px] font-black text-ink/5 tracking-tighter select-none pointer-events-none">
                    BANDUNG
                  </span>

                  {/* Real motorcycle cutout photo */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeStep === 1 ? "/bikes/scoopy-2023.png" : "/bikes/beat-2022.png"}
                    alt="Armada ms.Rent"
                    className="w-36 h-24 object-contain drop-shadow-md z-10 transition-transform duration-300 hover:scale-105"
                  />

                  {/* Unit Label Tag */}
                  <div className="z-10 mt-1 flex items-center gap-1.5 bg-dark/90 text-white px-2.5 py-0.5 rounded-full text-[9px] font-semibold shadow-xs">
                    <span>{activeStep === 1 ? "Scoopy Prestige 2023" : "Honda Beat Sporty 2022"}</span>
                    <span className="text-[#E9974F]">• Rp 85rb/hr</span>
                  </div>
                </div>

                {/* Dynamic Active Step Badge & Checklist */}
                <div className="bg-surface rounded-xl p-3 border border-accent/30 shadow-xs text-left transition-all duration-300">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-accent">
                      {current.phoneBadge}
                    </span>
                    <span className="text-[9px] font-medium text-ink-muted">
                      {activeStep + 1} / 5
                    </span>
                  </div>

                  <h5 className="text-[12px] font-extrabold text-ink mb-1.5 leading-snug">
                    {current.phoneHeading}
                  </h5>

                  <ul className="space-y-1 text-[10px] text-ink-muted">
                    {current.phoneBullets.map((bullet, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-accent shrink-0" />
                        <span className="leading-tight">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Simulated Action Button */}
              <div className="pt-1">
                <div className="w-full py-2 bg-accent text-accent-ink rounded-lg text-center text-[10px] font-bold tracking-wide shadow-xs flex items-center justify-center gap-1">
                  <span>Booking Kilat Garasi</span>
                  <Sparkles className="w-3 h-3" />
                </div>
                {/* Home Indicator */}
                <div className="w-16 h-1 bg-ink/20 rounded-full mx-auto mt-2" />
              </div>

            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            KOLOM TENGAH: VERTICAL STEPS (FLOW SEWA USER-FRIENDLY)
            ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 order-1 lg:order-2 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
              Cara &amp; Ketentuan Sewa
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-muted">
              Alur pemesanan mudah tanpa drama untuk anak muda, mahasiswa &amp; traveler di Bandung.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === activeStep;

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(idx)}
                  className={`group flex items-start gap-4 p-3.5 sm:p-4 rounded-[10px] transition-all cursor-pointer ${
                    isActive
                      ? "bg-surface border-2 border-accent shadow-sm"
                      : "hover:bg-surface/70 border border-line/60 bg-surface/30"
                  }`}
                >
                  {/* Step Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? "bg-accent text-accent-ink shadow-xs"
                        : "bg-bg text-ink-muted group-hover:text-ink border border-line"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm sm:text-base font-bold transition-colors ${
                          isActive ? "text-accent" : "text-ink group-hover:text-accent"
                        }`}
                      >
                        {step.title}
                      </h3>
                      {isActive && (
                        <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────
            KOLOM KANAN: FOTO ASLI REALISTIS KOMUTER SCOOTER
            Bukan foto AI, foto autentik suasana santai di atas motor matic
            ────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 hidden lg:flex justify-center relative order-3">
          <div className="relative w-full max-w-[280px] h-[520px] rounded-2xl overflow-hidden shadow-lg border border-line bg-dark">
            
            {/* Foto Asli Tanpa Efek AI */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/commuter-lifestyle.jpg" 
              alt="Pengendara Motor Matic ms.Rent Bandung"
              className="w-full h-full object-cover object-center select-none"
              loading="lazy"
            />

            {/* Gradient Overlay Elegan */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/25 to-transparent" />

            {/* Ornamen Geometris Khas ms.Rent (Terracotta Tone) */}
            <div 
              className="absolute -top-10 -right-10 w-44 h-44 rounded-full border-[8px] border-accent/40 pointer-events-none" 
              aria-hidden="true" 
            />
            <div 
              className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full border-[6px] border-accent/30 pointer-events-none" 
              aria-hidden="true" 
            />

            {/* Kartu Informasi Komuter di Atas Foto */}
            <div className="absolute bottom-5 left-5 right-5 text-white z-10 space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent text-accent-ink">
                ms.Rent Bandung
              </span>
              <h4 className="text-base font-extrabold text-white leading-snug">
                Jelajah Kota Bebas Macet
              </h4>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Unit matic Honda Beat, Scoopy &amp; Aerox terawat siap antar ke stasiun, kost, atau hotel.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
