"use client";

import { useEffect, useState } from "react";
import { Bike } from "@/types";
import { getBikes } from "@/lib/api";
import Navbar from "@/components/Navbar";
import BikeCard from "@/components/BikeCard";
import Logo from "@/components/Logo";
import BookingModal from "@/components/BookingModal";
import CheckBookingModal from "@/components/CheckBookingModal";
import BikeHoursModal from "@/components/BikeHoursModal";
import TermsAccordion from "@/components/TermsAccordion";
import { Search, Gauge, ShieldCheck, MapPin, LifeBuoy, LayoutGrid, Bike as BikeIcon, Zap, Sparkles, Mountain, Landmark, QrCode, BadgeCheck, Headphones, Wrench, Truck, Package, Check, MousePointerClick, CalendarCheck, ClipboardCheck, ScrollText, ChevronRight } from "lucide-react";

const MAINTENANCE_STEPS = [
  {
    icon: Wrench,
    title: "Pengecekan Rutin",
    teaser: "Ban, rem, kelistrikan & oli",
    desc: "Setiap unit diperiksa ulang sebelum diserahkan — bukan sekadar dicuci, tapi dicek mekanis oleh teknisi garasi.",
    bullets: ["Tekanan ban & kampas rem", "Kelistrikan, lampu & klakson", "Oli & filter — servis resmi tiap 2.000 km"],
  },
  {
    icon: Sparkles,
    title: "Sanitasi Unit & Helm",
    teaser: "Higienis tiap pengembalian",
    desc: "Unit dan perlengkapan dibersihkan menyeluruh setiap kali kembali dari penyewa sebelum masuk katalog lagi.",
    bullets: ["Helm disemprot disinfektan & dilap dalam", "Body unit dilap bersih dari debu jalan", "Jas hujan dicuci & dikeringkan sempurna"],
  },
  {
    icon: Package,
    title: "Kelengkapan Disiapkan",
    teaser: "2 helm SNI + jas hujan",
    desc: "Paket kelengkapan dirakit sebelum serah terima, jadi Anda tinggal jalan tanpa perlu bawa apa-apa.",
    bullets: ["2 helm SNI untuk penumpang & pengemudi", "Sepasang jas hujan tebal siap cuaca", "Holder smartphone untuk navigasi harian"],
  },
  {
    icon: Truck,
    title: "Antar-Jemput & Serah Terima",
    teaser: "Stasiun, hotel, bandara",
    desc: "Unit diantar sesuai jadwal kedatangan Anda, dengan verifikasi dokumen langsung di lokasi serah terima.",
    bullets: ["Stasiun KRL, bandara, hotel & lobi penginapan", "Verifikasi SIM C + 2 identitas asli di lokasi", "Penjelasan fitur unit sebelum ditinggal"],
  },
  {
    icon: LifeBuoy,
    title: "Bantuan Darurat 24 Jam",
    teaser: "Teknisi siaga di jalanan",
    desc: "Kendala di jalan bukan akhir perjalanan — tim garasi stand by untuk penanganan cepat atau penggantian unit.",
    bullets: ["Ban bocor, mogok, atau gangguan mesin", "Penanganan cepat atau unit pengganti", "Kontak WhatsApp garasi kapan saja"],
  },
];

const RESERVATION_STEPS = [
  {
    icon: BikeIcon,
    title: "Pilih Unit & Isi Form",
    teaser: "Tanggal, identitas & penyerahan",
    desc: "Pilih motor di katalog, tentukan tanggal sewa, isi identitas pemesan, dan pilih metode ambil sendiri atau antar ke lokasi. Total biaya dihitung otomatis secara real-time.",
  },
  {
    icon: ClipboardCheck,
    title: "Simpan Kode Reservasi",
    teaser: "Kode MSR-… langsung muncul",
    desc: "Setelah reservasi tercatat, kode berformat MSR-YYYYMMDD-XXXX muncul langsung di layar konfirmasi. Simpan atau salin kode tersebut untuk melacak status kapan saja.",
  },
  {
    icon: BadgeCheck,
    title: "Konfirmasi & Pembayaran",
    teaser: "WhatsApp garasi + transfer/QRIS",
    desc: "Admin garasi memverifikasi ketersediaan unit dan mengonfirmasi lewat WhatsApp. Setelah konfirmasi, lakukan pembayaran via transfer (BCA, Mandiri, BRI) atau QRIS.",
  },
  {
    icon: Truck,
    title: "Serah Terima Unit",
    teaser: "Ambil di garasi atau diantar",
    desc: "Datang ke garasi sesuai jadwal, atau unit diantar ke lokasi Anda. Verifikasi SIM C aktif dan 2 identitas asli dilakukan di lokasi serah terima.",
  },
];

export default function Home() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookingBike, setBookingBike] = useState<Bike | null>(null);
  const [infoBike, setInfoBike] = useState<Bike | null>(null);
  const [checkBookingOpen, setCheckBookingOpen] = useState(false);
  const [trackCode, setTrackCode] = useState("");

  // Section ketentuan — segmented tab + langkah reservasi interaktif
  const [infoTab, setInfoTab] = useState<"ketentuan" | "reservasi">("ketentuan");
  const [activeStep, setActiveStep] = useState(0);

  // Standar perawatan — stepper interaktif (autoplay berhenti setelah user klik)
  const [step, setStep] = useState(0);
  const [autoStep, setAutoStep] = useState(true);

  useEffect(() => {
    if (!autoStep) return;
    const timer = setInterval(() => {
      setStep((s) => (s + 1) % MAINTENANCE_STEPS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [autoStep]);

  const selectStep = (i: number) => {
    setStep(i);
    setAutoStep(false);
  };

  const brands = ["Semua", "Honda", "Yamaha", "Vespa", "Kawasaki"];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getBikes({
        category: selectedCategory,
        brand: selectedBrand,
        search: searchQuery,
      });
      setBikes(data);
      setLoading(false);
    }
    loadData();
  }, [selectedCategory, selectedBrand, searchQuery]);

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col font-sans">
      {/* Navigation */}
      <Navbar onOpenCheckBooking={() => setCheckBookingOpen(true)} />

      {/* Hero Section — Marketplace Search Style */}
      <section className="relative pt-16 pb-14 overflow-hidden bg-ink text-white">
        {/* Background photo + grid */}
        <div className="absolute inset-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=80"
            alt=""
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/92 to-ink" />
          <div className="absolute inset-0 bg-grid-light" />
        </div>
        <div className="absolute -top-40 right-0 w-[36rem] h-[36rem] rounded-full bg-rust/30 blur-[130px] pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-52 -left-24 w-96 h-96 rounded-full bg-moss/15 blur-[120px] pointer-events-none" aria-hidden="true" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-sand-200 text-xs font-medium animate-fade-up backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              <span>Garasi Sewa Motor Urban Jabodetabek</span>
            </div>

            <h1 className="mt-5 font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight animate-fade-up [animation-delay:80ms]">
              Sewa motor <span className="text-[#E9974F] italic font-normal">prima</span>,
              <br className="hidden sm:inline" /> siap jalan hari ini.
            </h1>

              <p className="mt-4 text-sm sm:text-[16px] text-sand-300 leading-relaxed max-w-xl mx-auto animate-fade-up [animation-delay:160ms]">
              Unit 2023–2024 diservis berkala, lengkap 2 helm SNI &amp; jas hujan.
              Antar-jemput stasiun, hotel, dan bandara.
            </p>
          </div>

          {/* Search Card */}
          <div className="mt-8 max-w-4xl mx-auto animate-fade-up [animation-delay:240ms]">
            <div className="bg-white rounded-2xl shadow-2xl border border-white/60 p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6 relative flex items-center">
                  <Search className="w-4 h-4 text-ink-faint absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari unit (NMAX, PCX, Vario, Vespa, Scoopy...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-sand-50 rounded-xl border border-sand-200 text-xs sm:text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-rust focus:bg-white focus:ring-4 focus:ring-rust/10 transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-3 bg-sand-50 rounded-xl border border-sand-200 text-xs sm:text-sm text-ink-light focus:outline-none focus:border-rust focus:bg-white focus:ring-4 focus:ring-rust/10 transition"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Maxi Scooter">Maxi Scooter</option>
                    <option value="Matic Compact">Matic Compact</option>
                    <option value="Classic & Lifestyle">Vespa &amp; Klasik</option>
                    <option value="Sport Matic">Sport Matic</option>
                    <option value="Dual Sport / Trail">Dual Sport / Trail</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <a
                    href="#armada"
                    className="w-full h-full min-h-[46px] px-4 py-3 rounded-xl bg-rust hover:bg-rust-hover text-white font-semibold text-xs sm:text-sm flex items-center justify-center transition shadow-warm-sm hover:shadow-glow-rust active:scale-95"
                  >
                    Cari Unit
                  </a>
                </div>
              </div>
            </div>

            {/* Quick chips (fungsional — mengisi kolom pencarian) */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs animate-fade-up [animation-delay:320ms]">
              <span className="text-sand-400 font-medium">Populer:</span>
              {["NMAX", "PCX", "Vario", "Scoopy", "Vespa", "KLX"].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchQuery(term)}
                  className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sand-200 hover:bg-white/20 hover:text-white transition backdrop-blur-sm"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-left animate-fade-up [animation-delay:400ms]">
            {[
              {
                icon: Gauge,
                title: "Unit Tahun Muda",
                desc: "Armada keluaran 2023–2024, tarikan responsif.",
              },
              {
                icon: ShieldCheck,
                title: "2 Helm SNI + Jas Hujan",
                desc: "Termasuk holder smartphone untuk navigasi.",
              },
              {
                icon: MapPin,
                title: "Antar Jemput Lokasi",
                desc: "Stasiun KRL, bandara, atau lobi penginapan.",
              },
              {
                icon: LifeBuoy,
                title: "Bantuan Cepat 24 Jam",
                desc: "Tim teknisi siap tanggap di jalanan.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group flex gap-3.5">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#E9974F] transition-all group-hover:bg-white/15 group-hover:border-white/25">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs text-sand-400 mt-1 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section: Editorial Varied Card Layout */}
      <section id="armada" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="eyebrow-line text-xs font-semibold text-rust tracking-[0.14em] uppercase">
              Pilihan Armada Garasi
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-2">
              Katalog Motor Siap Sewa
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Semua unit telah melewati pengecekan tekanan ban, kelistrikan, dan oli sebelum diserahkan.
            </p>
          </div>

          {/* Filter Brands */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedBrand === b
                    ? "bg-ink text-white font-semibold shadow-warm-md ring-1 ring-ink/20"
                    : "bg-white text-ink-muted hover:text-ink border border-sand-200 hover:bg-sand-100 hover:border-sand-300"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Category Icon Tiles (marketplace style) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Semua", icon: LayoutGrid },
            { label: "Maxi Scooter", icon: BikeIcon },
            { label: "Matic Compact", icon: Zap },
            { label: "Classic & Lifestyle", icon: Sparkles },
            { label: "Sport Matic", icon: Gauge },
            { label: "Dual Sport / Trail", icon: Mountain },
          ].map(({ label, icon: Icon }) => {
            const active = selectedCategory === label;
            return (
              <button
                key={label}
                onClick={() => setSelectedCategory(label)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${
                  active
                    ? "border-rust bg-rust-faint shadow-warm-md ring-1 ring-rust/25"
                    : "bg-white border-sand-200 hover:border-sand-300 hover:shadow-warm-sm"
                }`}
              >
                <span
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    active ? "bg-rust text-white shadow-glow-rust" : "bg-sand-100 text-ink-muted group-hover:text-ink"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <span className={`text-[11px] font-semibold text-center leading-tight ${active ? "text-rust" : "text-ink"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Catalog Body — Uniform Marketplace Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 rounded-xl bg-white border border-sand-200 animate-pulse" />
            ))}
          </div>
        ) : bikes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map((bike) => (
              <BikeCard
                key={bike.id}
                bike={bike}
                variant="standard"
                onSelect={(b) => setBookingBike(b)}
                onInfo={(b) => setInfoBike(b)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-sand-200 p-8 shadow-warm-sm">
            <p className="text-ink-muted text-sm">Tidak ada unit motor yang cocok dengan filter yang dipilih.</p>
            <button
              onClick={() => {
                setSelectedCategory("Semua");
                setSelectedBrand("Semua");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-rust hover:bg-rust-hover text-white text-xs font-medium transition shadow-warm-sm"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* Facilities & Standar Garasi Section — Interactive Stepper */}
      <section id="standar-garasi" className="py-16 bg-sand-100/70 border-y border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="eyebrow-line text-xs font-semibold text-moss tracking-[0.14em] uppercase">
              Standar Layanan ms.Rent
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-2">
              Fasilitas Lengkap Setiap Sewa
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Lima tahap operasional yang dilalui setiap unit sebelum sampai ke tangan Anda.
            </p>
            <p className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-medium text-rust bg-rust/10 border border-rust/20 px-2.5 py-1 rounded-full">
              <MousePointerClick className="w-3.5 h-3.5" />
              Klik salah satu tahap untuk lihat detailnya
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Step list */}
            <div className="lg:col-span-5 flex gap-3 overflow-x-auto pb-2 lg:pb-0 lg:flex-col lg:overflow-visible">
              {MAINTENANCE_STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = step === i;
                return (
                  <button
                    key={s.title}
                    onClick={() => selectStep(i)}
                    className={`group shrink-0 w-64 lg:w-full text-left p-4 rounded-2xl border flex items-start gap-3.5 transition-all active:scale-[0.98] ${
                      active
                        ? "bg-white border-rust shadow-warm-md ring-1 ring-rust/25"
                        : "bg-white/60 border-sand-200 hover:bg-white hover:border-sand-300 hover:shadow-warm-sm"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        active
                          ? "bg-rust text-white shadow-glow-rust"
                          : "bg-sand-100 text-ink-muted group-hover:text-rust group-hover:bg-rust/10"
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ink-faint">0{i + 1}</span>
                        <span className={`text-sm font-semibold ${active ? "text-rust" : "text-ink"}`}>
                          {s.title}
                        </span>
                      </span>
                      <span className="block text-[11px] text-ink-muted mt-0.5 truncate">{s.teaser}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-7">
              <div className="h-full rounded-3xl bg-ink text-white overflow-hidden shadow-warm-lg relative">
                {/* Progress bar */}
                <div className="h-1 bg-white/10">
                  <div
                    className="h-full bg-rust transition-all duration-700 ease-out"
                    style={{ width: `${((step + 1) / MAINTENANCE_STEPS.length) * 100}%` }}
                  />
                </div>

                <div key={step} className="p-7 sm:p-9 animate-fade-up">
                  <div className="flex items-center gap-4">
                    <span className="w-12 h-12 rounded-2xl bg-rust/20 border border-rust/30 flex items-center justify-center text-[#E9974F]">
                      {(() => {
                        const Icon = MAINTENANCE_STEPS[step].icon;
                        return <Icon className="w-6 h-6" strokeWidth={1.75} />;
                      })()}
                    </span>
                    <div>
                      <span className="text-[11px] font-semibold text-sand-400 tracking-[0.14em] uppercase">
                        Tahap {step + 1} dari {MAINTENANCE_STEPS.length}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                        {MAINTENANCE_STEPS[step].title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm text-sand-300 leading-relaxed mt-5">
                    {MAINTENANCE_STEPS[step].desc}
                  </p>

                  <ul className="mt-5 space-y-2.5">
                    {MAINTENANCE_STEPS[step].bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-xs sm:text-sm text-sand-200">
                        <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[#4ADE80]/15 text-[#4ADE80] flex items-center justify-center">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>

                  {/* Step dots (navigasi tambahan) */}
                  <div className="mt-7 pt-5 border-t border-white/10 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {MAINTENANCE_STEPS.map((s, i) => (
                        <button
                          key={s.title}
                          onClick={() => selectStep(i)}
                          aria-label={`Tahap ${i + 1}: ${s.title}`}
                          className={`h-1.5 rounded-full transition-all ${
                            step === i ? "w-7 bg-rust" : "w-3 bg-white/20 hover:bg-white/40"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => selectStep((step + 1) % MAINTENANCE_STEPS.length)}
                      className="text-xs font-semibold text-white hover:text-[#E9974F] transition"
                    >
                      Tahap berikutnya →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Informasi Reservasi & Ketentuan Section */}
      <section id="ketentuan" className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <span className="eyebrow-line text-xs font-semibold text-rust tracking-[0.14em] uppercase">
              Informasi Reservasi
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-2">
              {infoTab === "reservasi" ? "Reservasi dalam 4 Langkah" : "Ketentuan & Syarat Rental"}
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Bagian informasi reservasi dan ketentuan"
            className="inline-flex p-1 rounded-full bg-white border border-sand-200 shadow-warm-sm self-start"
          >
            <button
              type="button"
              role="tab"
              id="tab-reservasi"
              aria-controls="panel-reservasi"
              aria-selected={infoTab === "reservasi"}
              onClick={() => setInfoTab("reservasi")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                infoTab === "reservasi"
                  ? "bg-ink text-white shadow-warm-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" /> Informasi Reservasi
            </button>
            <button
              type="button"
              role="tab"
              id="tab-ketentuan"
              aria-controls="panel-ketentuan"
              aria-selected={infoTab === "ketentuan"}
              onClick={() => setInfoTab("ketentuan")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                infoTab === "ketentuan"
                  ? "bg-ink text-white shadow-warm-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <ScrollText className="w-3.5 h-3.5" /> Ketentuan &amp; Syarat
            </button>
          </div>
        </div>

        {/* Panel: Informasi Reservasi */}
        {infoTab === "reservasi" && (
          <div role="tabpanel" id="panel-reservasi" aria-labelledby="tab-reservasi" className="animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {RESERVATION_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = activeStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    aria-expanded={isActive}
                    onClick={() => setActiveStep(isActive ? -1 : idx)}
                    className={`relative text-left p-4 rounded-xl border transition-all ${
                      isActive
                        ? "border-rust bg-rust/5 shadow-warm-md"
                        : "bg-white border-sand-200 shadow-warm-sm hover:-translate-y-0.5 hover:border-sand-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                          isActive ? "bg-rust text-white border-rust" : "bg-sand-100 text-rust border-sand-200"
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-bold tracking-[0.14em] text-ink-faint">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <span className={`block text-sm font-semibold ${isActive ? "text-rust" : "text-ink"}`}>
                      {step.title}
                    </span>
                    <span className="block text-[11px] text-ink-muted mt-1 leading-snug">{step.teaser}</span>
                    {idx < RESERVATION_STEPS.length - 1 && (
                      <span className="hidden lg:block absolute top-1/2 -right-3 w-3 h-0.5 bg-sand-300 rounded" />
                    )}
                  </button>
                );
              })}
            </div>

            {activeStep >= 0 && (
              <div
                key={activeStep}
                className="mt-4 p-5 rounded-xl bg-white border border-sand-200 shadow-warm-sm animate-fade-in flex items-start gap-4"
              >
                <span className="shrink-0 w-10 h-10 rounded-lg bg-rust/10 border border-rust/20 text-rust flex items-center justify-center">
                  {(() => {
                    const DetailIcon = RESERVATION_STEPS[activeStep].icon;
                    return <DetailIcon className="w-5 h-5" />;
                  })()}
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Langkah {activeStep + 1} dari {RESERVATION_STEPS.length}
                  </span>
                  <h4 className="font-serif text-lg font-bold text-ink mt-0.5">
                    {RESERVATION_STEPS[activeStep].title}
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-muted mt-1 leading-relaxed">
                    {RESERVATION_STEPS[activeStep].desc}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="#armada"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-full bg-rust hover:bg-rust-hover text-white font-semibold text-xs transition shadow-warm-sm hover:shadow-glow-rust active:scale-95"
              >
                Pilih Motor Sekarang <ChevronRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setTrackCode("");
                  setCheckBookingOpen(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-3 rounded-full bg-white hover:bg-sand-50 border border-sand-300 text-ink font-semibold text-xs transition shadow-warm-sm active:scale-95"
              >
                <Search className="w-4 h-4" /> Lacak Reservasi
              </button>
            </div>
          </div>
        )}

        {/* Panel: Ketentuan & Syarat */}
        {infoTab === "ketentuan" && (
          <div role="tabpanel" id="panel-ketentuan" aria-labelledby="tab-ketentuan" className="animate-fade-in">
            <TermsAccordion />
          </div>
        )}
      </section>

      {/* Payment & Trust Strip */}
      <section className="py-14 border-t border-sand-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-9">
            <span className="eyebrow-line text-xs font-semibold text-rust tracking-[0.14em] uppercase">
              Aman &amp; Transparan
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-2">
              Pembayaran Mudah, Tanpa Drama
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Landmark,
                title: "Transfer Bank",
                desc: "BCA, Mandiri, dan BRI.",
              },
              {
                icon: QrCode,
                title: "QRIS",
                desc: "Scan dari e-wallet apa pun.",
              },
              {
                icon: BadgeCheck,
                title: "Bayar Setelah Konfirmasi",
                desc: "Admin mengunci unit dulu, baru bayar.",
              },
              {
                icon: Headphones,
                title: "Bantuan via WhatsApp",
                desc: "Dibalas cepat pada jam operasional.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-2.5 p-5 rounded-2xl bg-sand-50 border border-sand-200 hover:border-rust/30 hover:bg-white hover:shadow-warm-sm transition-all"
              >
                <span className="w-11 h-11 rounded-xl bg-rust/10 text-rust flex items-center justify-center">
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <div>
                  <div className="text-sm font-semibold text-ink">{title}</div>
                  <div className="text-xs text-ink-muted mt-0.5 leading-relaxed">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-sand-200 bg-white/60 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Brand */}
            <div className="md:col-span-5">
              <Logo size={44} />
              <p className="mt-3 text-ink-muted text-xs leading-relaxed max-w-sm">
                Layanan rental motor urban Jabodetabek. Armada terawat, proses transparan, dan unit
                siap tempur — lengkap dengan standar sanitasi bengkel resmi.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-sand-100 border border-sand-200 text-ink-muted">
                  Honda
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-sand-100 border border-sand-200 text-ink-muted">
                  Yamaha
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-sand-100 border border-sand-200 text-ink-muted">
                  Vespa
                </span>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-sand-100 border border-sand-200 text-ink-muted">
                  Kawasaki
                </span>
              </div>
            </div>

            {/* Navigasi */}
            <div className="md:col-span-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Navigasi
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-ink-light">
                <li>
                  <a href="#armada" className="hover:text-rust transition-colors">
                    Katalog Armada
                  </a>
                </li>
                <li>
                  <a href="#standar-garasi" className="hover:text-rust transition-colors">
                    Standar Perawatan
                  </a>
                </li>
                <li>
                  <a href="#ketentuan" className="hover:text-rust transition-colors">
                    Ketentuan Sewa
                  </a>
                </li>
                <li>
                  <a href="/service-center" className="hover:text-rust transition-colors">
                    Peta Service Center
                  </a>
                </li>
                <li>
                  <a href="/login" className="hover:text-rust transition-colors">
                    Login Admin
                  </a>
                </li>
              </ul>
            </div>

            {/* Kontak */}
            <div className="md:col-span-4">
              <h5 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Kontak Garasi
              </h5>
              <ul className="mt-4 space-y-2.5 text-xs text-ink-light">
                <li>
                  <a
                    href="https://wa.me/6282151728477"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rust hover:text-rust-hover font-semibold transition"
                  >
                    WhatsApp: 0821-5172-8477
                  </a>
                </li>
                <li>Operasional: 06.00 – 22.00 WIB</li>
                <li>Garasi: Jabodetabek, Indonesia</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-sand-200 text-[11px] text-ink-faint flex flex-col sm:flex-row justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} ms.Rent. Garasi Motor Urban.</span>
            <span>Dibangun dengan Next.js &amp; Golang</span>
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
