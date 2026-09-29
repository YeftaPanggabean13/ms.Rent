"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { Bike } from "@/types";

interface BikeCardProps {
  bike: Bike;
  onSelect: (bike: Bike) => void;
  onInfo?: (bike: Bike) => void;
  variant?: "spotlight" | "standard";
}

export default function BikeCard({ bike, onSelect, onInfo, variant = "standard" }: BikeCardProps) {
  const isAvailable = bike.status === "available";
  // Unit yang sedang disewa tetap bisa dipesan untuk jam/jadwal di luar sewa berjalan.
  // Hanya unit dalam servis yang tidak bisa dipesan.
  const canBook = bike.status !== "maintenance";

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const featureList = bike.features ? bike.features.split(",").map((f) => f.trim()) : [];

  if (variant === "spotlight") {
    return (
      <div className="group rounded-2xl bg-white border border-sand-200 hover:border-sand-300 transition-all duration-300 overflow-hidden shadow-warm-md hover:shadow-warm-lg flex flex-col lg:grid lg:grid-cols-12">
        {/* Large Bleed / DoF Photo Container */}
        <Link href={`/motor/${bike.id}`} className="relative lg:col-span-7 aspect-[16/10] lg:aspect-auto w-full overflow-hidden bg-sand-100 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bike.image_url}
            alt={bike.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-60" />

          {/* Availability Status */}
          {bike.status === "maintenance" ? (
            <div className="absolute inset-0 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-4">
              <span className="px-4 py-1.5 rounded-full text-xs font-medium bg-sand-100 text-ink border border-sand-200">
                Dalam Jadwal Servis
              </span>
            </div>
          ) : bike.status === "rented" ? (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sand-100/95 backdrop-blur text-ink border border-sand-200 shadow-warm-sm">
                Sedang Disewa · bisa disewa di luar jam sewa
              </span>
            </div>
          ) : (
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-moss text-white shadow-warm-sm">
                Unit Rekomendasi Garasi
              </span>
            </div>
          )}
        </Link>

        {/* Content Column */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-sand-100 text-ink-muted border border-sand-200">
                {bike.brand}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rust/10 text-rust border border-rust/20">
                {bike.category}
              </span>
            </div>

            <Link href={`/motor/${bike.id}`} className="block">
              <h3 className="font-serif text-2xl sm:text-3xl text-ink font-bold group-hover:text-rust transition-colors leading-snug">
                {bike.name}
              </h3>
            </Link>

            {/* Natural Sentence Meta */}
            <p className="text-xs sm:text-sm text-moss font-medium">
              Mesin {bike.engine_cc}cc transmisi {bike.transmission.toLowerCase()} lansiran {bike.year}
            </p>

            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              {bike.description}
            </p>

            {/* Features in pills */}
            {featureList.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {featureList.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-sand-50 text-ink-light border border-sand-200"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & CTA */}
          <div className="pt-5 border-t border-sand-200 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[11px] text-ink-muted font-medium">Tarif Sewa Harian</span>
              <div className="flex items-baseline space-x-1.5">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-rust">
                  {formatRupiah(bike.price_per_day)}
                </span>
                <span className="text-xs text-ink-muted font-normal">/ 24 jam</span>
              </div>
              {bike.price_per_hour > 0 && (
                <span className="block text-[11px] text-ink-muted mt-1">
                  <span className="font-semibold text-ink-light">{formatRupiah(bike.price_per_hour)}</span> / jam
                  <span className="text-ink-faint"> (2-23 jam)</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onInfo && (
                <button
                  onClick={() => onInfo(bike)}
                  className="px-3 py-3 rounded-xl border border-sand-200 bg-sand-50 hover:bg-sand-100 text-rust hover:text-rust-hover transition"
                  title="Lihat jam kosong unit ini"
                >
                  <Clock className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onSelect(bike)}
                disabled={!canBook}
                className={`px-5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-warm-sm ${
                  canBook
                    ? "bg-rust hover:bg-rust-hover text-white active:scale-95"
                    : "bg-sand-200 text-ink-faint cursor-not-allowed"
                }`}
              >
                {canBook ? "Pesan Unit Ini" : "Tidak Tersedia"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Standard Card Variant
  return (
    <div className="group rounded-2xl bg-white border border-sand-200 hover:border-sand-300 transition-all duration-300 flex flex-col overflow-hidden shadow-warm-sm hover:shadow-warm-lg hover:-translate-y-1">
      {/* Gambar Motor */}
      <Link href={`/motor/${bike.id}`} className="relative aspect-[16/10] w-full overflow-hidden bg-sand-100 block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bike.image_url}
          alt={bike.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/95 backdrop-blur text-moss border border-moss/20 shadow-warm-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-moss" />
              Siap Sewa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-ink/90 backdrop-blur text-sand-100 border border-white/10 shadow-warm-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-rust" />
              {bike.status === "rented" ? "Sedang Disewa" : "Jadwal Servis"}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-medium text-ink-muted">
              {bike.brand}
            </span>
            <span className="inline-block w-1 h-1 rounded-full bg-sand-300" />
            <span className="text-[11px] font-medium text-rust">
              {bike.category}
            </span>
          </div>

          <Link href={`/motor/${bike.id}`}>
            <h3 className="font-serif text-lg font-bold text-ink mt-1 group-hover:text-rust transition-colors leading-snug">
              {bike.name}
            </h3>
          </Link>

          {/* Natural Sentence Meta */}
          <p className="text-xs text-moss font-medium mt-1">
            {bike.engine_cc}cc {bike.transmission.toLowerCase()} lansiran {bike.year}
          </p>

          <p className="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed">
            {bike.description}
          </p>

          {/* Fitur Pills */}
          {featureList.length > 0 && (
            <div className="mt-3 pt-3 border-t border-sand-200/80 flex flex-wrap gap-1">
              {featureList.slice(0, 3).map((feat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-sand-50 text-ink-light border border-sand-200"
                >
                  {feat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-sand-200 flex items-end justify-between gap-3">
          <div>
            <span className="block text-[10px] text-ink-faint font-medium">Mulai dari</span>
            <div className="flex items-baseline space-x-1">
              <span className="font-serif text-xl font-bold text-rust">{formatRupiah(bike.price_per_day)}</span>
              <span className="text-[11px] text-ink-muted font-normal">/ hari</span>
            </div>
            {bike.price_per_hour > 0 && (
              <span className="block text-[10px] text-ink-muted mt-0.5">
                {formatRupiah(bike.price_per_hour)} / jam
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onInfo && (
              <button
                onClick={() => onInfo(bike)}
                className="p-2.5 rounded-xl border border-sand-200 bg-sand-50 hover:bg-sand-100 text-rust hover:text-rust-hover transition"
                title="Lihat jam kosong unit ini"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onSelect(bike)}
              disabled={!canBook}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                canBook
                  ? "bg-rust hover:bg-rust-hover text-white shadow-warm-sm hover:shadow-glow-rust active:scale-95"
                  : "bg-sand-200 text-ink-faint cursor-not-allowed"
              }`}
            >
              {canBook ? "Pesan Unit" : "Penuh"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
