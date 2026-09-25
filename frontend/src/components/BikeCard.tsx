"use client";

import { Bike } from "@/types";
import { Gauge, Zap, CheckCircle2, ShieldAlert } from "lucide-react";

interface BikeCardProps {
  bike: Bike;
  onSelect: (bike: Bike) => void;
}

export default function BikeCard({ bike, onSelect }: BikeCardProps) {
  const isAvailable = bike.status === "available";

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const featureList = bike.features ? bike.features.split(",").map((f) => f.trim()) : [];

  return (
    <div className="group rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 hover:shadow-2xl hover:shadow-brand-500/10 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Gambar Motor */}
      <div className="relative h-56 w-full overflow-hidden bg-slate-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={bike.image_url}
          alt={bike.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-md flex items-center space-x-1 ${
              isAvailable
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : bike.status === "rented"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAvailable ? "bg-emerald-400 animate-pulse" : bike.status === "rented" ? "bg-amber-400" : "bg-rose-400"
              }`}
            />
            <span>
              {isAvailable ? "Unit Siap Pakai" : bike.status === "rented" ? "Sedang Disewa" : "Maintenance"}
            </span>
          </span>
        </div>

        {/* Brand & Category Pill */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5">
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700">
            {bike.brand}
          </span>
        </div>

        {/* Bottom Info Specs */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-300 font-medium">
          <div className="flex items-center space-x-1 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-brand-400" />
            <span>{bike.engine_cc} cc</span>
          </div>
          <div className="flex items-center space-x-1 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{bike.transmission}</span>
          </div>
          <div className="bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800 text-slate-400">
            Tahun {bike.year}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">
              {bike.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {bike.description}
          </p>

          {/* Fitur & Fasilitas */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {featureList.slice(0, 3).map((feat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60"
              >
                <CheckCircle2 className="w-3 h-3 text-brand-400" />
                <span>{feat}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Harga Sewa</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-extrabold text-brand-400">{formatRupiah(bike.price_per_day)}</span>
              <span className="text-xs text-slate-400">/ hari</span>
            </div>
          </div>

          <button
            onClick={() => onSelect(bike)}
            disabled={!isAvailable}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
              isAvailable
                ? "bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 hover:to-amber-600 text-white shadow-brand-500/20 active:scale-95"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
            }`}
          >
            {isAvailable ? "Sewa Unit Ini" : "Tidak Tersedia"}
          </button>
        </div>
      </div>
    </div>
  );
}
