"use client";

import { useMemo, useState } from "react";
import { Booking, DashboardStats } from "@/types";

const PALETTE = {
  rust: "#C1622A",
  ink: "#1B2430",
  moss: "#2F4A3D",
  sand: "#BCB3A5",
  amber: "#D97706",
  faint: "#8D99A8",
};

const BRAND_COLORS: Record<string, string> = {
  Honda: "#D6001C",
  Yamaha: "#0033A0",
  Vespa: "#0E9F8E",
  Kawasaki: "#5BA525",
};

const STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Menunggu", color: PALETTE.amber },
  confirmed: { label: "Siap Jalan", color: PALETTE.moss },
  active: { label: "Aktif", color: PALETTE.ink },
  completed: { label: "Selesai", color: PALETTE.sand },
  cancelled: { label: "Dibatalkan", color: PALETTE.faint },
};

const compactRupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 })
    .format(val)
    .replace("rb", "rb");

function ChartCard({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="p-5 rounded-2xl bg-white border border-sand-200 shadow-warm-sm hover:shadow-warm-md transition-shadow h-full animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-serif font-bold text-ink text-sm sm:text-[16px]">{title}</h3>
          <p className="text-[11px] text-ink-muted mt-0.5">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="h-40 flex items-center justify-center rounded-xl border border-dashed border-sand-300 bg-sand-50/60 text-xs text-ink-faint text-center px-4">
      {text}
    </div>
  );
}

/* ——— 1. Grafik batang: reservasi masuk 14 hari terakhir ——— */
export function BookingTrendChart({ bookings }: { bookings: Booking[] }) {
  const { days, max, total } = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      list.push({
        key,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        count: 0,
      });
    }
    bookings.forEach((b) => {
      if (!b.created_at) return;
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const hit = list.find((x) => x.key === key);
      if (hit) hit.count += 1;
    });
    return {
      days: list,
      max: Math.max(...list.map((d) => d.count), 1),
      total: list.reduce((s, d) => s + d.count, 0),
    };
  }, [bookings]);

  if (total === 0) {
    return (
      <ChartCard
        title="Tren Reservasi Masuk"
        subtitle="14 hari terakhir · berdasarkan waktu pemesanan"
        delay={80}
      >
        <EmptyHint text="Belum ada reservasi masuk dalam 14 hari terakhir." />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Tren Reservasi Masuk"
      subtitle="14 hari terakhir · berdasarkan waktu pemesanan"
      delay={80}
    >
      <div className="flex items-end gap-1.5 h-44">
        {days.map((d, i) => (
          <div key={d.key} className="group relative flex-1 flex flex-col items-center justify-end h-full">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-ink text-white text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 shadow-warm-md">
              {d.label} · {d.count} reservasi
            </span>
            <div
              className={`w-full rounded-t-md origin-bottom animate-bar-grow transition-colors ${
                d.count > 0 ? "bg-rust group-hover:bg-rust-hover" : "bg-sand-100 group-hover:bg-sand-200"
              } ${d.count === 0 ? "min-h-[3px]" : ""}`}
              style={{
                height: `${Math.max((d.count / max) * 100, d.count === 0 ? 2 : 8)}%`,
                animationDelay: `${i * 45}ms`,
              }}
            />
            <span className="mt-1.5 text-[9px] text-ink-faint group-hover:text-ink transition-colors">
              {d.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-sand-100 flex items-center justify-between text-[11px]">
        <span className="text-ink-muted">
          Total 14 hari: <strong className="text-ink">{total} reservasi</strong>
        </span>
        <span className="text-ink-faint">Puncak: {max} / hari</span>
      </div>
    </ChartCard>
  );
}

/* ——— 2. Donat: distribusi status reservasi ——— */
export function StatusDonut({ bookings }: { bookings: Booking[] }) {
  const [hover, setHover] = useState<string | null>(null);

  const segments = useMemo(() => {
    const counts: Record<string, number> = {};
    bookings.forEach((b) => {
      const s = b.booking_status || "pending";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.keys(STATUS_META)
      .filter((k) => counts[k])
      .map((k) => ({
        key: k,
        label: STATUS_META[k].label,
        color: STATUS_META[k].color,
        value: counts[k],
      }));
  }, [bookings]);

  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;

  if (total === 0) {
    return (
      <ChartCard title="Status Reservasi" subtitle="Komposisi status pesanan" delay={160}>
        <EmptyHint text="Belum ada data reservasi untuk ditampilkan." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Status Reservasi" subtitle="Komposisi status pesanan" delay={160}>
      <div className="flex items-center gap-5">
        <div className="relative shrink-0 animate-donut-pop">
          <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="#F5F0EA" strokeWidth="18" />
            {segments.map((s) => {
              const pct = s.value / total;
              const dash = Math.max(pct * C - 3, 1);
              const el = (
                <circle
                  key={s.key}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.key ? 24 : 18}
                  strokeDasharray={`${dash} ${C - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHover(s.key)}
                  onMouseLeave={() => setHover(null)}
                />
              );
              offset += pct * C;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-serif font-bold text-ink leading-none">
              {hover !== null ? segments.find((s) => s.key === hover)?.value ?? total : total}
            </span>
            <span className="text-[10px] text-ink-muted mt-1">
              {hover !== null
                ? segments.find((s) => s.key === hover)?.label
                : "Reservasi"}
            </span>
          </div>
        </div>

        <ul className="flex-1 space-y-2 min-w-0">
          {segments.map((s) => (
            <li
              key={s.key}
              className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 cursor-default transition ${
                hover === s.key ? "bg-sand-100" : ""
              }`}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-ink truncate">{s.label}</span>
              <span className="ml-auto font-semibold text-ink">{s.value}</span>
              <span className="text-ink-faint w-9 text-right">{Math.round((s.value / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}

/* ——— 3. Batang horizontal: pendapatan per brand (lunas) ——— */
export function BrandRevenueBars({ bookings }: { bookings: Booking[] }) {
  const rows = useMemo(() => {
    const sums: Record<string, number> = {};
    bookings
      .filter((b) => b.payment_status === "paid")
      .forEach((b) => {
        const brand = b.bike?.brand || "Lainnya";
        sums[brand] = (sums[brand] || 0) + (b.total_price || 0);
      });
    return Object.entries(sums)
      .map(([brand, value]) => ({ brand, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [bookings]);

  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (rows.length === 0) {
    return (
      <ChartCard
        title="Pendapatan per Brand"
        subtitle="Dari pembayaran berstatus lunas"
        delay={240}
      >
        <EmptyHint text="Belum ada pembayaran terverifikasi. Grafik muncul setelah reservasi di-approve & ditandai lunas." />
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="Pendapatan per Brand"
      subtitle={`Dari pembayaran lunas · total ${compactRupiah(total)}`}
      delay={240}
    >
      <div className="space-y-3.5">
        {rows.map((r, i) => (
          <div key={r.brand} className="group">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-ink">{r.brand}</span>
              <span className="font-semibold text-ink">{compactRupiah(r.value)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-sand-100 overflow-hidden">
              <div
                className="h-full rounded-full origin-left animate-bar-grow-x group-hover:opacity-80 transition-opacity"
                style={{
                  width: `${(r.value / max) * 100}%`,
                  backgroundColor: BRAND_COLORS[r.brand] || PALETTE.faint,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-3 border-t border-sand-100 text-[11px] text-ink-muted">
        Brand paling produktif:{" "}
        <strong className="text-ink">{rows[0].brand}</strong> ({compactRupiah(rows[0].value)})
      </div>
    </ChartCard>
  );
}

/* ——— 4. Utilisasi armada: stacked bar ——— */
export function FleetUtilization({ stats }: { stats: DashboardStats | null }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = stats?.total_bikes || 0;

  const parts = [
    { key: "available", label: "Tersedia", value: stats?.available_bikes || 0, color: PALETTE.moss },
    { key: "rented", label: "Disewa", value: stats?.rented_bikes || 0, color: PALETTE.rust },
    { key: "maintenance", label: "Servis", value: stats?.maintenance_bikes || 0, color: PALETTE.sand },
  ];

  const activePct = total > 0 ? Math.round(((stats?.rented_bikes || 0) / total) * 100) : 0;

  if (total === 0) {
    return (
      <ChartCard title="Pemanfaatan Armada" subtitle="Status seluruh unit" delay={320}>
        <EmptyHint text="Data armada belum dimuat." />
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Pemanfaatan Armada" subtitle="Status seluruh unit" delay={320}>
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-24 h-24 shrink-0 rounded-full flex items-center justify-center animate-donut-pop"
          style={{ background: `conic-gradient(${PALETTE.rust} ${activePct * 3.6}deg, #F5F0EA 0deg)` }}
        >
          <div className="w-[72px] h-[72px] rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-xl font-serif font-bold text-rust leading-none">{activePct}%</span>
            <span className="text-[9px] text-ink-muted mt-0.5">terpakai</span>
          </div>
        </div>
        <div className="text-xs text-ink-muted leading-relaxed min-w-0">
          <p>
            <strong className="text-ink">{stats?.rented_bikes || 0}</strong> dari{" "}
            <strong className="text-ink">{total}</strong> unit sedang beroperasi.
          </p>
          <p className="mt-1">
            {stats?.available_bikes || 0} unit siap menerima reservasi baru.
          </p>
        </div>
      </div>

      <div className="flex h-3 rounded-full overflow-hidden bg-sand-100">
        {parts.map((p) => (
          <div
            key={p.key}
            className="h-full origin-left animate-bar-grow-x transition-all duration-200"
            style={{
              width: `${total > 0 ? (p.value / total) * 100 : 0}%`,
              backgroundColor: p.color,
              opacity: hover && hover !== p.key ? 0.4 : 1,
            }}
            onMouseEnter={() => setHover(p.key)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {parts.map((p) => (
          <li
            key={p.key}
            className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1 transition ${
              hover === p.key ? "bg-sand-100" : ""
            }`}
            onMouseEnter={() => setHover(p.key)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-ink">{p.label}</span>
            <span className="ml-auto font-semibold text-ink">{p.value} unit</span>
            <span className="text-ink-faint w-9 text-right">
              {total > 0 ? Math.round((p.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
