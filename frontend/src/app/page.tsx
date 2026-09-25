"use client";

import { useEffect, useState } from "react";
import { Bike } from "@/types";
import { getBikes } from "@/lib/api";
import Navbar from "@/components/Navbar";
import BikeCard from "@/components/BikeCard";
import BookingModal from "@/components/BookingModal";
import CheckBookingModal from "@/components/CheckBookingModal";
import { Search } from "lucide-react";

export default function Home() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookingBike, setBookingBike] = useState<Bike | null>(null);
  const [checkBookingOpen, setCheckBookingOpen] = useState(false);

  const categories = [
    "Semua",
    "Maxi Scooter",
    "Matic Compact",
    "Classic & Lifestyle",
    "Sport Matic",
    "Dual Sport / Trail",
  ];
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

  // Separate the first bike for spotlight showcase if available
  const featuredBike = bikes.length > 0 ? bikes[0] : null;
  const remainingBikes = bikes.length > 1 ? bikes.slice(1) : [];

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col font-sans">
      {/* Navigation */}
      <Navbar onOpenCheckBooking={() => setCheckBookingOpen(true)} />

      {/* Hero Section: Asymmetric & Brave Editorial Moment */}
      <section className="relative pt-12 pb-20 border-b border-sand-200 overflow-hidden bg-gradient-to-b from-base via-base to-sand-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Bold Typography & Search Integration */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-moss/10 border border-moss/20 text-moss text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
                <span>Garasi Sewa Motor Urban Jabodetabek</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-ink font-bold leading-[1.1] tracking-tight">
                Bebas macet, <br className="hidden sm:inline" />
                tunggangi roda dua <br className="hidden sm:inline" />
                <span className="text-rust italic font-normal">paling terawat.</span>
              </h1>

              <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl">
                Layanan sewa motor harian dan mingguan berkelas untuk komuter urban,
                pekerja kantoran, dan penggemar roda dua. Unit prima siap antar-jemput stasiun
                atau hotel Anda — lengkap 2 helm SNI dan jas hujan higienis.
              </p>

              {/* Integrated Control Bar (Not a generic floating white search box) */}
              <div className="pt-2">
                <div className="p-3 sm:p-4 rounded-2xl bg-white border border-sand-200 shadow-warm-md">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-6 relative flex items-center">
                      <Search className="w-4 h-4 text-ink-faint absolute left-3.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Cari unit (NMAX, PCX, Vario, Vespa, Scoopy...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-sand-50 rounded-xl border border-sand-200 text-xs sm:text-sm text-ink placeholder-ink-faint focus:outline-none focus:border-rust focus:bg-white transition"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2.5 bg-sand-50 rounded-xl border border-sand-200 text-xs sm:text-sm text-ink-light focus:outline-none focus:border-rust focus:bg-white transition"
                      >
                        <option value="Semua">Semua Kategori</option>
                        <option value="Maxi Scooter">Maxi Scooter</option>
                        <option value="Matic Compact">Matic Compact</option>
                        <option value="Classic & Lifestyle">Vespa & Klasik</option>
                        <option value="Sport Matic">Sport Matic</option>
                        <option value="Dual Sport / Trail">Dual Sport / Trail</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <a
                        href="#armada"
                        className="w-full h-full min-h-[42px] px-4 py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs sm:text-sm flex items-center justify-center transition shadow-warm-sm"
                      >
                        Lihat Unit Siap
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Motorcycle Visual Moment (Bleeding dof photo with sunset headlamp warmth) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Ambient Warm Rust Glow (Headlamp & dusk ambiance) */}
                <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-rust/15 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-60 h-60 rounded-full bg-moss/10 blur-3xl pointer-events-none" />

                {/* Hero Frame */}
                <div className="relative rounded-3xl overflow-hidden border border-sand-200 shadow-warm-lg bg-sand-100 aspect-[4/3] sm:aspect-[16/11]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=85"
                    alt="Motor Prima ms.Rent"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

                  {/* Curated Editorial Stamp */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-4 rounded-xl bg-base/90 backdrop-blur-md border border-sand-200/80 shadow-warm-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-moss">Standar Servis Garasi</span>
                        <p className="text-xs text-ink font-medium mt-0.5">
                          Disanitasi & dikalibrasi bengkel resmi tiap 2.000 km
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 pl-3 text-rust">
                        <span className="w-2 h-2 rounded-full bg-rust animate-ping" />
                        <span className="text-[11px] font-semibold whitespace-nowrap">Siap Jalan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Understated Editorial Trust Strip (No generic AI metric cards) */}
          <div className="mt-14 pt-8 border-t border-sand-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div>
              <div className="text-sm font-semibold text-ink">Unit Tahun Muda</div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                Armada keluaran 2023 - 2024, tarikan responsif tanpa getaran kasar.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">2 Helm SNI + Jas Hujan</div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                Termasuk holder smartphone kuat untuk navigasi harian Anda.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Antar Jemput Lokasi</div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                Langsung di stasiun KRL, bandara, atau lobi penginapan Anda.
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Bantuan Cepat 24 Jam</div>
              <div className="text-xs text-ink-muted mt-1 leading-relaxed">
                Layanan tim teknisi siap tanggap jika terjadi kendala di jalanan.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section: Editorial Varied Card Layout */}
      <section id="armada" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-semibold text-rust tracking-wide">
              Pilihan Armada Garasi
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-1">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedBrand === b
                    ? "bg-ink text-white font-semibold shadow-warm-sm"
                    : "bg-white text-ink-muted hover:text-ink border border-sand-200 hover:bg-sand-100"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-rust text-white font-semibold shadow-warm-sm"
                  : "bg-white text-ink-muted hover:bg-sand-100 hover:text-ink border border-sand-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Body with Varied Visual Rhythm */}
        {loading ? (
          <div className="space-y-6">
            <div className="h-72 rounded-2xl bg-white border border-sand-200 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-xl bg-white border border-sand-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : bikes.length > 0 ? (
          <div className="space-y-8">
            {/* Featured Spotlight Unit */}
            {featuredBike && (
              <BikeCard
                bike={featuredBike}
                variant="spotlight"
                onSelect={(b) => setBookingBike(b)}
              />
            )}

            {/* Remaining Bikes in Balanced 3-Column Editorial Grid */}
            {remainingBikes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingBikes.map((bike) => (
                  <BikeCard
                    key={bike.id}
                    bike={bike}
                    variant="standard"
                    onSelect={(b) => setBookingBike(b)}
                  />
                ))}
              </div>
            )}
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

      {/* Facilities & Standar Garasi Section */}
      <section id="standar-garasi" className="py-16 bg-sand-100/70 border-y border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-semibold text-moss tracking-wide">
              Standar Layanan ms.Rent
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-1">
              Fasilitas Lengkap Setiap Sewa
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">
              Kenyamanan perjalanan dan kebersihan unit adalah prioritas operasional kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-2xl bg-white border border-sand-200 shadow-warm-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded text-[11px] font-semibold bg-moss/10 text-moss">
                Sanitasi & Higienis
              </span>
              <h3 className="font-serif text-lg font-bold text-ink">2 Helm SNI + Jas Hujan Bersih</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Setiap helm disemprot disinfektan dan dibersihkan rutin sebelum diserahkan,
                lengkap dengan sepasang jas hujan tebal siap hadapi cuaca Jakarta.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-sand-200 shadow-warm-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded text-[11px] font-semibold bg-rust/10 text-rust">
                Mobilitas Fleksibel
              </span>
              <h3 className="font-serif text-lg font-bold text-ink">Antar-Jemput Stasiun & Hotel</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Unit dapat diantarkan langsung ke Stasiun Gambir, Pasar Senen, Halim, bandara,
                atau hotel Anda sesuai jadwal kedatangan.
              </p>
            </div>

            <div className="p-7 rounded-2xl bg-white border border-sand-200 shadow-warm-sm space-y-3">
              <span className="inline-block px-2.5 py-1 rounded text-[11px] font-semibold bg-ink/10 text-ink">
                Keamanan Terjamin
              </span>
              <h3 className="font-serif text-lg font-bold text-ink">Dukungan Darurat Jalanan 24 Jam</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Kendala teknis atau ban bocor di tengah jalan? Tim teknisi siaga meluncur untuk
                penanganan cepat atau penggantian unit motor langsung.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ketentuan Sewa Section */}
      <section id="ketentuan" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8">
          <span className="text-xs font-semibold text-rust tracking-wide">
            Informasi Reservasi
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mt-1">
            Ketentuan & Syarat Rental
          </h2>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <h4 className="font-serif font-bold text-base text-ink">
              Dokumen apa saja yang diperlukan untuk menyewa motor?
            </h4>
            <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
              Penyewa wajib memiliki <strong>SIM C aktif</strong> dan menitipkan 2 identitas asli sebagai jaminan
              (misal: e-KTP dan SIM A / NPWP / Kartu BPJS / Kartu Karyawan / Paspor).
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <h4 className="font-serif font-bold text-base text-ink">
              Bagaimana metode pembayaran yang didukung?
            </h4>
            <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
              Pembayaran dapat dilakukan melalui transfer bank (BCA, Mandiri, BRI) atau QRIS resmi setelah pemesanan
              dikonfirmasi oleh admin garasi kami.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <h4 className="font-serif font-bold text-base text-ink">
              Berapa jam hitungan 1 hari sewa?
            </h4>
            <p className="text-xs sm:text-sm text-ink-muted mt-2 leading-relaxed">
              Sewa 1 hari dihitung 24 jam penuh sejak jam serah terima unit motor kepada penyewa. Keterlambatan pengembalian
              hingga 60 menit dibebaskan dari biaya denda.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-sand-200 bg-sand-100/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-xs text-ink-muted">
          <div>
            <div className="flex items-baseline space-x-1.5 text-ink font-bold text-lg font-serif">
              <span>ms<span className="text-rust">.</span>rent</span>
            </div>
            <p className="mt-1 text-ink-muted text-xs max-w-sm">
              Layanan rental motor urban Jabodetabek. Armada terawat, proses transparan, dan unit siap tempur.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-ink-light">
            <a href="#armada" className="hover:text-rust transition">Katalog Armada</a>
            <a href="#standar-garasi" className="hover:text-rust transition">Standar Perawatan</a>
            <a href="#ketentuan" className="hover:text-rust transition">Ketentuan Sewa</a>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rust hover:text-rust-hover font-semibold transition"
            >
              WhatsApp: 0812-3456-7890
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-sand-200/80 text-[11px] text-ink-faint flex flex-col sm:flex-row justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ms.Rent. Garasi Motor Urban.</span>
          <span>Operasional Garasi: 06.00 - 22.00 WIB</span>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        bike={bookingBike}
        onClose={() => setBookingBike(null)}
        onSuccess={() => {
          getBikes().then(setBikes);
        }}
      />

      <CheckBookingModal
        isOpen={checkBookingOpen}
        onClose={() => setCheckBookingOpen(false)}
      />
    </div>
  );
}
