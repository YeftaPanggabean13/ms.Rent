"use client";

import { useEffect, useState } from "react";
import { Bike } from "@/types";
import { getBikes } from "@/lib/api";
import Navbar from "@/components/Navbar";
import BikeCard from "@/components/BikeCard";
import BookingModal from "@/components/BookingModal";
import CheckBookingModal from "@/components/CheckBookingModal";
import {
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  HelpCircle,
  PhoneCall,
  Search,
  CheckCircle,
  Flame,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedBrand, setSelectedBrand] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookingBike, setBookingBike] = useState<Bike | null>(null);
  const [checkBookingOpen, setCheckBookingOpen] = useState(false);

  const categories = ["Semua", "Maxi Scooter", "Matic Compact", "Classic & Lifestyle", "Sport Matic", "Dual Sport / Trail"];
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <Navbar onOpenCheckBooking={() => setCheckBookingOpen(true)} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.15),rgba(255,255,255,0))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Flame className="w-4 h-4 text-brand-500" />
            <span>Rental Motor No. 1 Terlengkap & Terpercaya</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Jelajahi Kota Tanpa Ribet Bersama <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-amber-500">ms.Rent</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Sewa motor matic, maxi scooter, hingga motor klasik harian dan mingguan. Unit terawat berkala, gratis 2 helm SNI, jas hujan, dan layanan antar jemput langsung ke stasiun atau hotel Anda.
          </p>

          {/* Quick Search Bar */}
          <div className="mt-10 max-w-3xl mx-auto p-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
              <Search className="w-5 h-5 text-brand-400 shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Cari tipe motor (NMAX, PCX, Vario, Vespa, Scoopy...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <a
              href="#armada"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center space-x-2 transition"
            >
              <span>Lihat Armada</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Highlight Stats Badges */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Unit Tahun Muda</h4>
                <p className="text-[11px] text-slate-400">Terawat servis resmi berkala</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Gratis 2 Helm SNI</h4>
                <p className="text-[11px] text-slate-400">+ Jas hujan higienis</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Layanan Antar-Jemput</h4>
                <p className="text-[11px] text-slate-400">Stasiun, hotel & bandara</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Proses Cepat 5 Menit</h4>
                <p className="text-[11px] text-slate-400">Verifikasi data tanpa ribet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Section */}
      <section id="armada" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Pilihan Armada</span>
            <h2 className="text-3xl font-black text-white mt-1">Katalog Motor Siap Sewa</h2>
            <p className="text-sm text-slate-400 mt-1">Pilih tipe motor yang sesuai dengan kebutuhan perjalanan Anda</p>
          </div>

          {/* Filter Brands */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <span className="text-xs text-slate-400 font-semibold mr-1">Brand:</span>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedBrand === b
                    ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-slate-100 text-slate-950 font-bold"
                  : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bike Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-slate-800" />
            ))}
          </div>
        ) : bikes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bikes.map((bike) => (
              <BikeCard key={bike.id} bike={bike} onSelect={(b) => setBookingBike(b)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
            <p className="text-slate-400 text-sm">Tidak ada unit motor yang cocok dengan filter yang dipilih.</p>
            <button
              onClick={() => {
                setSelectedCategory("Semua");
                setSelectedBrand("Semua");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold"
            >
              Reset Filter
            </button>
          </div>
        )}
      </section>

      {/* Facilities & Why Us */}
      <section id="keunggulan" className="py-16 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Kenapa Memilih Kami?</span>
            <h2 className="text-3xl font-black text-white mt-1">Fasilitas Lengkap Setiap Sewa</h2>
            <p className="text-sm text-slate-400 mt-2">Semua kebutuhan berkendara Anda sudah kami siapkan dengan standar terbaik.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg">
                01
              </div>
              <h3 className="text-lg font-bold text-white">Kebersihan & Keamanan Helm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap penyewa mendapatkan 2 helm berstandar SNI yang telah dibersihkan dan disanitasi secara berkala untuk kenyamanan berkendara Anda.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-lg">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Antar Jemput Langsung</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tidak perlu datang ke kantor kami. Driver kami siap mengantarkan motor langsung ke stasiun kereta, terminal, atau lobby penginapan Anda.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Dukungan Darurat 24 Jam</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mengalami kendala teknis atau ban bocor di jalan? Tim teknisi ms.Rent siap memberikan bantuan darurat atau penggantian unit jika diperlukan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Syarat & FAQ Section */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Informasi Penting</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Syarat & Ketentuan Rental</h2>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-sm text-white flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Dokumen apa saja yang diperlukan untuk menyewa motor?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-6">
              Penyewa wajib memiliki <strong>SIM C aktif</strong> dan menitipkan 2 identitas asli sebagai jaminan (misal: e-KTP dan SIM A / NPWP / Kartu BPJS / Kartu Karyawan / Paspor).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-sm text-white flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Bagaimana cara pembayaran?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-6">
              Pembayaran dapat dilakukan melalui transfer bank (BCA, Mandiri, BRI) atau QRIS setelah pemesanan dikonfirmasi oleh admin kami.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <h4 className="font-bold text-sm text-white flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Berapa jam hitungan 1 hari sewa?</span>
            </h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed pl-6">
              Sewa 1 hari dihitung 24 jam penuh sejak jam serah terima unit motor kepada penyewa. Keterlambatan pengembalian dikenakan overtime wajar.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">ms.Rent</span>
            <span>&copy; {new Date().getFullYear()} — Solusi Rental Motor Modern & Andal.</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>Powered by Next.js & Golang Gin</span>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="hover:text-brand-400 transition">
              Bantuan WhatsApp
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BookingModal
        bike={bookingBike}
        onClose={() => setBookingBike(null)}
        onSuccess={() => {
          // reload data
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
