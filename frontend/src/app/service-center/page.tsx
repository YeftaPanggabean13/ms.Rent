"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Phone, Clock, Search, Navigation, Loader2, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";
import CheckBookingModal from "@/components/CheckBookingModal";
import { ServiceCenter } from "@/types";
import { getServiceCenters } from "@/lib/api";

const ServiceCenterMap = dynamic(() => import("@/components/ServiceCenterMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-sand-100 rounded-xl flex items-center justify-center text-ink-faint text-sm">
      Memuat peta...
    </div>
  ),
});

const BRANDS = ["Semua", "Honda", "Yamaha", "Vespa", "Kawasaki"];

const BRAND_COLORS: Record<string, string> = {
  Honda: "#D6001C",
  Yamaha: "#0033A0",
  Vespa: "#0E9F8E",
  Kawasaki: "#5BA525",
};

type GeoStatus = "idle" | "loading" | "granted" | "denied";

export default function ServiceCenterPage() {
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [brand, setBrand] = useState("Semua");
  const [search, setSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [checkBookingOpen, setCheckBookingOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await getServiceCenters();
      if (!cancelled) {
        setCenters(data);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGeoStatus("granted");
        const data = await getServiceCenters({ lat: loc.lat, lng: loc.lng });
        setCenters(data);
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return centers.filter((c) => {
      const matchBrand = brand === "Semua" || c.brand === brand;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.province.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q);
      return matchBrand && matchSearch;
    });
  }, [centers, brand, search]);

  const selected = centers.find((c) => c.id === selectedId) || null;

  const geoHint =
    geoStatus === "idle"
      ? "Aktifkan lokasi untuk urutkan terdekat"
      : geoStatus === "loading"
        ? "Mencari lokasi Anda..."
        : geoStatus === "denied"
          ? "Lokasi tidak diizinkan — menampilkan semua wilayah"
          : "Lokasi terdeteksi • diurutkan dari terdekat";

  return (
    <div className="min-h-screen bg-base">
      <Navbar onOpenCheckBooking={() => setCheckBookingOpen(true)} />

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl animate-fade-up">
            <span className="eyebrow-line inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-rust">
              <Wrench className="w-3.5 h-3.5" /> Layanan Service
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-ink mt-3 leading-tight">
              Peta Service Center Resmi Indonesia
            </h1>
            <p className="text-ink-muted mt-3 text-sm sm:text-[16px] leading-relaxed">
              Temukan bengkel & dealer resmi <strong>Honda (AHASS)</strong>,{" "}
              <strong>Yamaha</strong>, <strong>Vespa</strong>, dan{" "}
              <strong>Kawasaki</strong> terdekat dari lokasi Anda — lengkap dengan alamat,
              nomor telepon, dan jam operasional.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 animate-fade-up [animation-delay:120ms]">
            <button
              onClick={requestLocation}
              disabled={geoStatus === "loading"}
              className="inline-flex items-center gap-2 text-xs font-semibold px-5 py-3 rounded-lg bg-rust hover:bg-rust-hover disabled:opacity-60 text-white transition-all shadow-warm-sm"
            >
              {geoStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {geoStatus === "granted" ? "Lokasi Aktif" : "Gunakan Lokasi Saya"}
            </button>
            <span className="text-[11px] text-ink-faint">{geoHint}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {BRANDS.map((b) => (
              <button
                key={b}
                onClick={() => setBrand(b)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
                  brand === b
                    ? "bg-ink text-base border-ink shadow-warm-sm"
                    : "bg-sand-50 text-ink-muted border-sand-200 hover:border-sand-300 hover:text-ink"
                }`}
              >
                {b !== "Semua" && (
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: BRAND_COLORS[b] }}
                  />
                )}
                {b}
              </button>
            ))}
          </div>

          <div className="md:ml-auto relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kota, nama, atau alamat..."
              className="w-full text-sm pl-10 pr-4 py-2.5 rounded-lg border border-sand-200 bg-sand-50 focus:outline-none focus:border-rust focus:bg-white transition-all"
            />
          </div>
        </div>
      </section>

      {/* Map + List */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* List */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-ink-muted">
                {loading
                  ? "Memuat data..."
                  : `${filtered.length} pusat layanan ditemukan`}
              </span>
              {userLocation && (
                <span className="text-[11px] text-rust font-semibold inline-flex items-center gap-1">
                  <Navigation className="w-3 h-3" /> Terdekat dulu
                </span>
              )}
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-32 rounded-xl bg-sand-100 animate-pulse border border-sand-200"
                  />
                ))}

              {!loading && filtered.length === 0 && (
                <div className="rounded-xl border border-dashed border-sand-300 bg-sand-50 p-8 text-center">
                  <MapPin className="w-8 h-8 mx-auto text-ink-faint mb-3" />
                  <p className="text-sm text-ink-muted font-medium">
                    Tidak ada service center yang cocok.
                  </p>
                  <p className="text-xs text-ink-faint mt-1">
                    Coba ubah filter brand atau kata kunci pencarian.
                  </p>
                </div>
              )}

              {!loading &&
                filtered.map((c) => {
                  const isActive = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all shadow-warm-sm ${
                        isActive
                          ? "border-rust bg-rust-faint ring-1 ring-rust/40"
                          : "border-sand-200 bg-white hover:border-sand-300 hover:shadow-warm-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full text-white"
                              style={{
                                backgroundColor: BRAND_COLORS[c.brand] || "#C1622A",
                              }}
                            >
                              {c.brand}
                            </span>
                            <span className="text-[11px] text-ink-faint">{c.type}</span>
                          </div>
                          <h3 className="font-semibold text-sm text-ink mt-1.5 truncate">
                            {c.name}
                          </h3>
                          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                            {c.address}
                          </p>
                          <p className="text-xs text-ink-faint mt-0.5">
                            {c.city}, {c.province}
                          </p>
                        </div>

                        {typeof c.distance_km === "number" && (
                          <span className="shrink-0 text-[11px] font-bold text-rust bg-rust-light px-2 py-1 rounded-lg">
                            {c.distance_km < 1
                              ? `${(c.distance_km * 1000).toFixed(0)} m`
                              : `${c.distance_km.toFixed(1)} km`}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pt-3 border-t border-sand-100 text-[11px] text-ink-muted">
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-rust" />
                            {c.phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-ink-faint" />
                          {c.hours}
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="relative z-0 h-[320px] sm:h-[420px] lg:h-[620px] rounded-xl overflow-hidden border border-sand-200 shadow-warm-md bg-sand-100">
              <ServiceCenterMap
                centers={filtered}
                userLocation={userLocation}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[11px] text-ink-muted">
              <span className="font-semibold text-ink">Legenda:</span>
              {Object.entries(BRAND_COLORS).map(([b, color]) => (
                <span key={b} className="inline-flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {b}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                Lokasi Anda
              </span>
            </div>
          </div>
        </div>

        {/* Selected detail card */}
        {selected && (
          <div className="mt-6 rounded-xl border border-sand-200 bg-white shadow-warm-md p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
              style={{ backgroundColor: BRAND_COLORS[selected.brand] || "#C1622A" }}
            >
              {selected.brand.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-ink">{selected.name}</p>
              <p className="text-xs text-ink-muted mt-0.5">
                {selected.address} — {selected.city}, {selected.province}
              </p>
              <p className="text-xs text-ink-faint mt-0.5">
                {selected.hours}
                {typeof selected.distance_km === "number" &&
                  ` • ${selected.distance_km.toFixed(1)} km dari lokasi Anda`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-4 py-2.5 rounded-lg border border-sand-200 bg-sand-50 hover:bg-sand-100 text-ink transition-all"
              >
                Rute
              </a>
              {selected.phone && (
                <a
                  href={`tel:${selected.phone}`}
                  className="text-xs font-semibold px-4 py-2.5 rounded-lg bg-rust hover:bg-rust-hover text-white transition-all"
                >
                  Telepon
                </a>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-[11px] text-ink-faint leading-relaxed max-w-3xl">
          Catatan: data pusat layanan merupakan daftar contoh jaringan dealer resmi untuk
          keperluan demonstrasi. Untuk info pasti (alamat, jam buka, ketersediaan suku
          cadang), silakan hubungi dealer terkait terlebih dahulu.
        </p>
      </section>

      <CheckBookingModal
        key={checkBookingOpen ? "track-open" : "closed"}
        isOpen={checkBookingOpen}
        onClose={() => setCheckBookingOpen(false)}
      />
    </div>
  );
}
