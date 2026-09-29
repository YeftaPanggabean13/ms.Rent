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
  const canBook = bike.status !== "maintenance";

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const statusLabel = isAvailable
    ? "Siap Sewa"
    : bike.status === "rented"
    ? "Sedang Disewa"
    : "Jadwal Servis";

  // Standard Card Variant — clean, flat, minimal
  return (
    <div className="group rounded-[6px] bg-surface border border-line hover:border-accent/40 transition-colors flex flex-col overflow-hidden">
      {/* Image */}
      <Link href={`/motor/${bike.id}`} className="relative aspect-[16/10] w-full overflow-hidden bg-bg block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bike.image_url}
          alt={bike.name}
          className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />

        {/* Maintenance overlay */}
        {bike.status === "maintenance" && (
          <div className="absolute inset-0 bg-dark/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-xs font-medium text-bg">Dalam Jadwal Servis</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Meta line */}
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span>{bike.brand}</span>
            <span>·</span>
            <span>{bike.category}</span>
            <span>·</span>
            <span>{statusLabel}</span>
          </div>

          <Link href={`/motor/${bike.id}`}>
            <h3 className="text-base sm:text-lg font-bold text-ink mt-1 group-hover:text-accent transition-colors leading-snug">
              {bike.name}
            </h3>
          </Link>

          {/* Specs inline */}
          <p className="text-xs text-ink-muted mt-1">
            {bike.engine_cc}cc · {bike.transmission} · {bike.year}
          </p>

          <p className="text-xs text-ink-muted mt-2 line-clamp-2 leading-relaxed">
            {bike.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-line flex items-end justify-between gap-3">
          <div>
            <span className="text-lg font-bold text-accent">{formatRupiah(bike.price_per_day)}</span>
            <span className="text-xs text-ink-muted ml-1">/ hari</span>
            {bike.price_per_hour > 0 && (
              <span className="block text-[11px] text-ink-muted mt-0.5">
                {formatRupiah(bike.price_per_hour)} / jam
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {onInfo && (
              <button
                type="button"
                onClick={() => onInfo(bike)}
                className="p-2 rounded-[4px] border border-line hover:bg-bg text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title="Lihat jam kosong unit ini"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelect(bike)}
              disabled={!canBook}
              className={`px-3.5 py-2 rounded-[4px] text-xs font-semibold transition-opacity cursor-pointer ${
                canBook
                  ? "bg-accent text-accent-ink hover:opacity-90"
                  : "bg-line text-ink-muted cursor-not-allowed"
              }`}
            >
              {canBook ? "Pesan" : "Penuh"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

