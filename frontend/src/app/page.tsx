"use client";

import { useEffect, useState } from "react";
import { Bike } from "@/types";
import { getBikes } from "@/lib/api";
import Navbar from "@/components/Navbar";
import ShowcaseCatalog from "@/components/ShowcaseCatalog";
import Logo from "@/components/Logo";
import BookingModal from "@/components/BookingModal";
import CheckBookingModal from "@/components/CheckBookingModal";
import BikeHoursModal from "@/components/BikeHoursModal";
import TermsAccordion from "@/components/TermsAccordion";
import { Search } from "lucide-react";

export default function Home() {
  const [bikes, setBikes] = useState<Bike[]>([]);

  // Search & showcase state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);

  const [bookingBike, setBookingBike] = useState<Bike | null>(null);
  const [infoBike, setInfoBike] = useState<Bike | null>(null);
  const [checkBookingOpen, setCheckBookingOpen] = useState(false);
  const [trackCode, setTrackCode] = useState("");

  useEffect(() => {
    async function loadData() {
      const data = await getBikes();
      setBikes(data);
    }
    loadData();
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (q.includes("beat") || selectedCategory === "Matic Compact") {
      setActiveShowcaseIndex(0);
    } else if (q.includes("scoop") || selectedCategory === "Retro Matic") {
      setActiveShowcaseIndex(1);
    } else if (q.includes("aerox") || selectedCategory === "Sport Matic") {
      setActiveShowcaseIndex(2);
    }
    const elem = document.getElementById("armada");
    if (elem) elem.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "Matic Compact") setActiveShowcaseIndex(0);
    else if (cat === "Retro Matic") setActiveShowcaseIndex(1);
    else if (cat === "Sport Matic") setActiveShowcaseIndex(2);
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col font-sans">
      {/* Navigation */}
      <Navbar onOpenCheckBooking={() => setCheckBookingOpen(true)} />

      {/* ──────────────────────────────────────────────────────────────────
          HERO — Dark with Rich Warm Brown Gradient & Glow
          ────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-16 sm:pt-20 sm:pb-20 overflow-hidden bg-[#151D24] text-white border-b border-line">
        {/* Background photo + dark overlays + subtle grid */}
        <div className="absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#151D24]/85 via-[#182028]/92 to-[#111111]" />
          <div className="absolute inset-0 bg-grid-light opacity-60" />
        </div>

        {/* Glowing Orange Radial Gradients */}
        <div 
          className="absolute -top-36 right-0 w-[40rem] h-[40rem] rounded-full bg-[#C1622A]/35 blur-[130px] pointer-events-none" 
          aria-hidden="true" 
        />
        <div 
          className="absolute -bottom-48 -left-20 w-[30rem] h-[30rem] rounded-full bg-[#E9974F]/20 blur-[120px] pointer-events-none" 
          aria-hidden="true" 
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#E9974F] animate-fade-up">
            Garasi Sewa Motor Urban Bandung
          </p>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white animate-fade-up [animation-delay:60ms]">
            Sewa motor{" "}
            <span className="text-[#E9974F]">
              prima
            </span>,
            <br className="hidden sm:inline" /> siap jalan hari ini.
          </h1>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed animate-fade-up [animation-delay:120ms]">
            3 unit pilihan favorit urban: Beat 2022, Scoopy 2023 &amp; Aerox 150s.
            <br className="hidden sm:inline" /> Diservis berkala &amp; higienis, lengkap 2 helm SNI + jas hujan.
          </p>

          {/* Search bar — clean, crisp, floating container on dark */}
          <div className="mt-8 max-w-3xl mx-auto animate-fade-up [animation-delay:180ms]">
            <form onSubmit={handleSearchSubmit} className="flex items-center bg-white rounded-full border border-white/20 shadow-2xl p-1.5 pl-5 focus-within:ring-2 focus-within:ring-[#C1622A]/50 transition-all">
              <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Cari unit (Beat, Scoopy, Aerox)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />
              <div className="hidden sm:block h-6 w-px bg-slate-200 mx-3 flex-shrink-0" />
              <div className="hidden sm:flex items-center text-xs sm:text-sm text-slate-700 font-medium whitespace-nowrap pr-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer pr-1"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Matic Compact">Matic Compact (Beat)</option>
                  <option value="Retro Matic">Retro Matic (Scoopy)</option>
                  <option value="Sport Matic">Sport Matic (Aerox)</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#C1622A] hover:bg-[#A95120] text-white font-bold text-xs sm:text-sm rounded-full transition whitespace-nowrap shadow-sm flex-shrink-0 cursor-pointer"
              >
                Cari Unit
              </button>
            </form>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 pt-7 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300 animate-fade-up [animation-delay:320ms]">
            <span className="flex items-center gap-1.5"><span className="text-[#E9974F] font-bold">✓</span> Beat, Scoopy &amp; Aerox</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-1.5"><span className="text-[#E9974F] font-bold">✓</span> 2 Helm SNI + Jas Hujan</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-1.5"><span className="text-[#E9974F] font-bold">✓</span> Antar Jemput Stasiun / Hotel</span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span className="flex items-center gap-1.5"><span className="text-[#E9974F] font-bold">✓</span> Bantuan 24 Jam Bandung</span>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          KATALOG SHOWCASE — Beat 2022, Scoopy 2023, Aerox 150s
          ────────────────────────────────────────────────────────────────── */}
      <ShowcaseCatalog
        bikes={bikes}
        externalActiveIndex={activeShowcaseIndex}
        onActiveIndexChange={setActiveShowcaseIndex}
        onSelectBikeForBooking={(b) => setBookingBike(b)}
        onOpenHoursModal={(b) => setInfoBike(b)}
      />

      {/* ──────────────────────────────────────────────────────────────────
          KETENTUAN & CARA SEWA — Interactive Experience (Yulu Style)
          ────────────────────────────────────────────────────────────────── */}
      <section id="ketentuan" className="py-14 sm:py-20 bg-surface border-b border-line scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TermsAccordion />
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────
          FOOTER — Solid --dark background, text --bg / light --ink-muted
          ────────────────────────────────────────────────────────────────── */}
      <footer className="mt-auto bg-dark text-bg py-14 border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Brand */}
            <div className="md:col-span-5 space-y-4">
              <Logo size={40} monochrome className="text-bg" />
              <p className="text-xs text-bg/70 leading-relaxed max-w-sm">
                Layanan rental motor urban Bandung. Armada terawat, proses transparan, dan unit
                siap jalan dengan standar inspeksi dan helm higienis.
              </p>

              {/* Lacak Reservasi button in footer */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTrackCode("");
                    setCheckBookingOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] border border-line/30 bg-surface/10 hover:bg-surface/20 text-bg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5 text-bg" /> Lacak Status Reservasi
                </button>
              </div>
            </div>

            {/* Navigasi */}
            <div className="md:col-span-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-bg/90">
                Navigasi
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-bg/70">
                <li>
                  <a href="#armada" className="hover:text-bg transition-colors">
                    Katalog Armada
                  </a>
                </li>
                <li>
                  <a href="#ketentuan" className="hover:text-bg transition-colors">
                    Ketentuan Sewa
                  </a>
                </li>

                <li>
                  <a href="/service-center" className="hover:text-bg transition-colors">
                    Service Center
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-bg transition-colors">
                    Login Admin
                  </a>
                </li>
              </ul>
            </div>

            {/* Kontak & Operasional */}
            <div className="md:col-span-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-bg/90">
                Kontak Garasi
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-bg/70">
                <li>
                  <a
                    href="https://wa.me/6282151728477"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-bg hover:underline font-semibold"
                  >
                    WhatsApp: 0821-5172-8477
                  </a>
                </li>
                <li>Operasional: 06.00 – 22.00 WIB</li>
                <li>Garasi: Bandung, Indonesia</li>
              </ul>

              <h5 className="text-xs font-bold uppercase tracking-wider text-bg/90 mt-6">
                Pembayaran
              </h5>
              <p className="mt-2 text-xs text-bg/70">
                Transfer BCA, Mandiri, BRI dan QRIS resmi.
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-line/20 text-[11px] text-bg/50">
            <span>&copy; {new Date().getFullYear()} ms.Rent. Garasi Motor Urban Bandung.</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        bike={bookingBike}
        onClose={() => setBookingBike(null)}
        onSuccess={() => {
          getBikes().then(setBikes);
        }}
        onTrackBooking={(code) => {
          setTrackCode(code);
          setCheckBookingOpen(true);
        }}
      />

      <CheckBookingModal
        key={checkBookingOpen ? `track-${trackCode}` : "closed"}
        isOpen={checkBookingOpen}
        initialCode={trackCode}
        onClose={() => {
          setCheckBookingOpen(false);
          setTrackCode("");
        }}
      />

      <BikeHoursModal
        bike={infoBike}
        isOpen={!!infoBike}
        onClose={() => setInfoBike(null)}
      />
    </div>
  );
}

