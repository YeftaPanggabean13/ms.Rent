"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Booking, DashboardStats } from "@/types";
import { getBikes, getBookings, getDashboardStats, updateBookingStatus } from "@/lib/api";
import {
  Bike as BikeIcon,
  ArrowLeft,
  DollarSign,
  CalendarCheck,
  Clock,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Phone,
  RefreshCw,
  Plus,
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Kembali ke Web Publik"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl text-white">ms<span className="text-brand-500">.Rent</span></span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Admin Panel
              </span>
            </div>
          </div>

          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-400" : ""}`} />
            <span>Refresh Data</span>
          </button>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Armada Motor</span>
              <BikeIcon className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">{stats?.total_bikes ?? 0}</div>
            <span className="text-[11px] text-emerald-400">{stats?.available_bikes ?? 0} Unit Siap Pakai</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Sedang Disewa (Aktif)</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">{stats?.active_bookings ?? 0}</div>
            <span className="text-[11px] text-slate-400">{stats?.pending_bookings ?? 0} menunggu persetujuan</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Pesanan Masuk</span>
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">{stats?.total_bookings ?? 0}</div>
            <span className="text-[11px] text-slate-400">Sepanjang masa</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Pendapatan Terbayar</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-brand-400 mt-2">
              {formatRupiah(stats?.total_revenue ?? 0)}
            </div>
            <span className="text-[11px] text-emerald-400">Status Pembayaran Lunas</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-3 border-b border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === "bookings"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Manajemen Reservasi ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("bikes")}
            className={`pb-3 text-sm font-bold border-b-2 transition ${
              activeTab === "bikes"
                ? "border-brand-500 text-brand-400"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Daftar Armada Motor ({bikes.length})
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {bookings.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                <p>Belum ada data pesanan sewa motor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Kode / Waktu</th>
                      <th className="p-4">Penyewa</th>
                      <th className="p-4">Motor</th>
                      <th className="p-4">Jadwal & Durasi</th>
                      <th className="p-4">Total Biaya</th>
                      <th className="p-4">Status Sewa</th>
                      <th className="p-4 text-right">Aksi & Kontak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-4">
                          <span className="font-mono font-bold text-brand-400">{b.booking_code}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            {b.created_at ? new Date(b.created_at).toLocaleDateString("id-ID") : "Baru saja"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-white">{b.customer_name}</div>
                          <div className="text-[11px] text-slate-400">{b.customer_phone}</div>
                          <div className="text-[10px] text-slate-500">KTP: {b.customer_id_card}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-white">{b.bike?.name || `Motor ID: ${b.bike_id}`}</div>
                          <div className="text-[11px] text-slate-400">{b.bike?.plate_number}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-white">{b.start_date} s/d {b.end_date}</div>
                          <div className="text-[11px] text-brand-400">{b.duration_days} Hari Sewa</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-white">{formatRupiah(b.total_price)}</div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold mt-1 ${
                              b.payment_status === "paid"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {b.payment_status === "paid" ? "Lunas" : "Belum Bayar"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              b.booking_status === "confirmed"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : b.booking_status === "active"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : b.booking_status === "completed"
                                ? "bg-slate-700 text-slate-300"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          {b.id && (
                            <>
                              {b.booking_status === "pending" && (
                                <button
                                  onClick={() => handleUpdateStatus(b.id!, "confirmed", "paid")}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                                  title="Approve & Tandai Lunas"
                                >
                                  Konfirmasi
                                </button>
                              )}
                              {b.booking_status === "confirmed" && (
                                <button
                                  onClick={() => handleUpdateStatus(b.id!, "active")}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                                  title="Unit sudah diserahkan ke pelanggan"
                                >
                                  Serahkan Unit
                                </button>
                              )}
                              {b.booking_status === "active" && (
                                <button
                                  onClick={() => handleUpdateStatus(b.id!, "completed")}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs"
                                  title="Motor sudah dikembalikan"
                                >
                                  Selesai
                                </button>
                              )}
                              <a
                                href={`https://wa.me/${b.customer_phone.replace(/^0/, "62")}?text=Halo%20${encodeURIComponent(b.customer_name)},%20mengenai%20booking%20motor%20${encodeURIComponent(b.booking_code || "")}%20di%20ms.Rent...`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                title="Chat WhatsApp Pelanggan"
                              >
                                <Phone className="w-3.5 h-3.5" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bikes.map((bike) => (
              <div
                key={bike.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="flex space-x-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bike.image_url}
                    alt={bike.name}
                    className="w-20 h-20 rounded-xl object-cover bg-slate-950 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{bike.name}</h4>
                    <p className="text-xs text-brand-400 font-semibold">{formatRupiah(bike.price_per_day)} / hari</p>
                    <p className="text-[11px] text-slate-400 mt-1">Plat: {bike.plate_number}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                        bike.status === "available"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : bike.status === "rented"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {bike.status}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 flex justify-between">
                  <span>{bike.engine_cc} CC • {bike.transmission}</span>
                  <span>{bike.brand}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
