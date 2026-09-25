"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Booking, DashboardStats } from "@/types";
import { getBikes, getBookings, getDashboardStats, updateBookingStatus } from "@/lib/api";
import {
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "bikes">("bookings");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [s, bList, bkList] = await Promise.all([
      getDashboardStats(),
      getBikes(),
      getBookings(),
    ]);
    setStats(s);
    setBikes(bList);
    setBookings(bkList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (
    bookingId: number,
    bookingStatus: string,
    paymentStatus?: string
  ) => {
    await updateBookingStatus(bookingId, {
      booking_status: bookingStatus,
      ...(paymentStatus ? { payment_status: paymentStatus } : {}),
    });
    loadData();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-base text-ink flex flex-col font-sans">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-30 bg-base/90 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-ink transition"
              title="Kembali ke Web Publik"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-baseline space-x-2">
              <span className="font-serif text-xl font-bold text-ink">ms<span className="text-rust">.</span>rent</span>
              <span className="text-xs text-ink-muted font-medium">/ Panel Manajemen Garasi</span>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-xs font-medium text-ink transition shadow-warm-sm"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-rust" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <span className="text-xs text-ink-muted font-medium block">Total Armada Unit</span>
            <div className="text-2xl font-serif font-bold text-ink mt-1.5">{stats?.total_bikes ?? 0}</div>
            <span className="text-xs text-moss mt-1 block font-medium">{stats?.available_bikes ?? 0} Unit Siap Jalan</span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <span className="text-xs text-ink-muted font-medium block">Sedang Disewa (Aktif)</span>
            <div className="text-2xl font-serif font-bold text-rust mt-1.5">{stats?.active_bookings ?? 0}</div>
            <span className="text-xs text-ink-muted mt-1 block">{stats?.pending_bookings ?? 0} menunggu konfirmasi</span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <span className="text-xs text-ink-muted font-medium block">Total Reservasi Masuk</span>
            <div className="text-2xl font-serif font-bold text-ink mt-1.5">{stats?.total_bookings ?? 0}</div>
            <span className="text-xs text-ink-muted mt-1 block">Sepanjang waktu</span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-sand-200 shadow-warm-sm">
            <span className="text-xs text-ink-muted font-medium block">Total Penerimaan</span>
            <div className="text-2xl font-serif font-bold text-moss mt-1.5">
              {formatRupiah(stats?.total_revenue ?? 0)}
            </div>
            <span className="text-xs text-moss mt-1 block font-medium">Pembayaran terverifikasi</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-6 border-b border-sand-200 mb-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "bookings"
                ? "border-rust text-rust"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Manajemen Reservasi ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("bikes")}
            className={`pb-3 text-xs font-semibold border-b-2 transition ${
              activeTab === "bikes"
                ? "border-rust text-rust"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            Daftar Armada Motor ({bikes.length})
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-sand-200 shadow-warm-sm text-ink-muted">
                <p>Belum ada data pesanan sewa motor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white shadow-warm-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-50 text-ink-muted border-b border-sand-200 text-[11px] font-semibold">
                    <tr>
                      <th className="p-4">Kode Reservasi</th>
                      <th className="p-4">Penyewa</th>
                      <th className="p-4">Motor</th>
                      <th className="p-4">Jadwal & Durasi</th>
                      <th className="p-4">Total Biaya</th>
                      <th className="p-4">Status Sewa</th>
                      <th className="p-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-200/70 text-ink">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-sand-50/70 transition">
                        <td className="p-4">
                          <span className="font-semibold text-ink tracking-wider">{b.booking_code}</span>
                          <span className="block text-[10px] text-ink-faint mt-0.5">
                            {b.created_at ? new Date(b.created_at).toLocaleDateString("id-ID") : "Baru saja"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-ink">{b.customer_name}</div>
                          <div className="text-[11px] text-ink-muted">{b.customer_phone}</div>
                          <div className="text-[10px] text-ink-faint">KTP: {b.customer_id_card}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-ink">{b.bike?.name || `Motor ID: ${b.bike_id}`}</div>
                          <div className="text-[11px] text-ink-muted">{b.bike?.plate_number}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-ink">{b.start_date} s/d {b.end_date}</div>
                          <div className="text-[11px] text-ink-muted">{b.duration_days} Hari Sewa</div>
                        </td>
                        <td className="p-4">
                          <div className="font-serif font-bold text-rust">{formatRupiah(b.total_price)}</div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-semibold mt-1 ${
                              b.payment_status === "paid"
                                ? "bg-moss/10 text-moss border border-moss/20"
                                : "bg-rust/10 text-rust border border-rust/20"
                            }`}
                          >
                            {b.payment_status === "paid" ? "Lunas" : "Belum Lunas"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                              b.booking_status === "confirmed"
                                ? "bg-moss/10 text-moss border border-moss/20"
                                : b.booking_status === "active"
                                ? "bg-sand-200 text-ink border border-sand-300"
                                : b.booking_status === "completed"
                                ? "bg-sand-100 text-ink-muted border border-sand-200"
                                : "bg-rust/10 text-rust border border-rust/20"
                            }`}
                          >
                            {b.booking_status === "confirmed"
                              ? "Siap Jalan"
                              : b.booking_status === "active"
                              ? "Aktif"
                              : b.booking_status === "completed"
                              ? "Selesai"
                              : "Menunggu"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {b.id && (
                            <>
                              {b.booking_status === "pending" && (
                                <button
                                  onClick={() => handleUpdateStatus(b.id!, "confirmed", "paid")}
                                  className="px-3 py-1 rounded-lg bg-rust hover:bg-rust-hover text-white font-medium text-xs shadow-warm-sm"
                                  title="Approve & Tandai Lunas"
                                >
                                  Konfirmasi
                                </button>
                              )}
                              {b.booking_status === "confirmed" && (
                                <button
                                  onClick={() => handleUpdateStatus(b.id!, "active")}
                                  className="px-3 py-1 rounded-lg bg-ink hover:bg-rust text-white font-medium text-xs shadow-warm-sm"
                                  title="Unit sudah diserahkan ke pelanggan"
                                >
                                  Serahkan Unit
                                </button>
                              )}
                              {b.booking_status === "active" && (
                                <button
                                  onClick={() => handleUpdateStatus(b.id!, "completed")}
                                  className="px-3 py-1 rounded-lg bg-sand-200 hover:bg-sand-300 text-ink font-medium text-xs"
                                  title="Motor sudah dikembalikan"
                                >
                                  Selesai
                                </button>
                              )}
                              <a
                                href={`https://wa.me/${b.customer_phone.replace(/^0/, "62")}?text=Halo%20${encodeURIComponent(b.customer_name)},%20mengenai%20booking%20motor%20${encodeURIComponent(b.booking_code || "")}%20di%20ms.Rent...`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-2.5 py-1 rounded-lg bg-sand-50 hover:bg-sand-100 text-ink text-xs font-medium border border-sand-200"
                                title="Chat WhatsApp Pelanggan"
                              >
                                WhatsApp
                              </a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bikes Management */}
        {activeTab === "bikes" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {bikes.map((bike) => (
              <div
                key={bike.id}
                className="p-4 rounded-xl bg-white border border-sand-200 shadow-warm-sm flex flex-col justify-between space-y-3"
              >
                <div className="flex space-x-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bike.image_url}
                    alt={bike.name}
                    className="w-20 h-20 rounded-lg object-cover bg-sand-100 shrink-0"
                  />
                  <div>
                    <h4 className="font-serif font-bold text-ink text-sm leading-snug">{bike.name}</h4>
                    <p className="font-serif text-sm text-rust font-bold mt-0.5">{formatRupiah(bike.price_per_day)} <span className="font-sans text-xs text-ink-muted font-normal">/ hari</span></p>
                    <p className="text-[11px] text-ink-muted mt-1">Plat: {bike.plate_number}</p>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                        bike.status === "available"
                          ? "bg-moss/10 text-moss border border-moss/20"
                          : bike.status === "rented"
                          ? "bg-rust/10 text-rust border border-rust/20"
                          : "bg-sand-200 text-ink-muted border border-sand-300"
                      }`}
                    >
                      {bike.status === "available" ? "Tersedia" : bike.status === "rented" ? "Disewa" : "Jadwal Servis"}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-ink-muted border-t border-sand-200 pt-2 flex justify-between">
                  <span>{bike.engine_cc}cc {bike.transmission.toLowerCase()}</span>
                  <span className="font-medium text-ink">{bike.brand}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
