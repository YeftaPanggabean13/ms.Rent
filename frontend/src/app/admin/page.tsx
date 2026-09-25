"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Booking, DashboardStats, User } from "@/types";
import {
  getBikes,
  getBookings,
  getDashboardStats,
  updateBookingStatus,
  getStoredUser,
  getStoredToken,
  clearAuth,
  adminCreateBike,
  adminUpdateBike,
  adminDeleteBike,
} from "@/lib/api";
import {
  ArrowLeft,
  RefreshCw,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activeTab, setActiveTab] = useState<"bookings" | "bikes">("bookings");
  const [loading, setLoading] = useState(true);

  // Bike form state
  const [showBikeForm, setShowBikeForm] = useState(false);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [bikeForm, setBikeForm] = useState<{
    name: string;
    brand: string;
    category: string;
    engine_cc: number;
    year: number;
    transmission: string;
    price_per_day: number;
    plate_number: string;
    image_url: string;
    features: string;
    description: string;
    status: "available" | "rented" | "maintenance";
  }>({
    name: "",
    brand: "Honda",
    category: "Matic Compact",
    engine_cc: 110,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 100000,
    plate_number: "",
    image_url: "",
    features: "",
    description: "",
    status: "available",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    if (!token || !storedUser || storedUser.role !== "admin") {
      router.push("/login");
      return;
    }
    setUser(storedUser);
    setAuthChecked(true);
  }, [router]);

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
    if (authChecked) loadData();
  }, [authChecked]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

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

  // Bike CRUD handlers
  const openCreateForm = () => {
    setEditingBike(null);
    setBikeForm({
      name: "",
      brand: "Honda",
      category: "Matic Compact",
      engine_cc: 110,
      year: 2024,
      transmission: "Automatic",
      price_per_day: 100000,
      plate_number: "",
      image_url: "",
      features: "",
      description: "",
      status: "available",
    });
    setFormError("");
    setShowBikeForm(true);
  };

  const openEditForm = (bike: Bike) => {
    setEditingBike(bike);
    setBikeForm({
      name: bike.name,
      brand: bike.brand,
      category: bike.category,
      engine_cc: bike.engine_cc,
      year: bike.year,
      transmission: bike.transmission,
      price_per_day: bike.price_per_day,
      plate_number: bike.plate_number,
      image_url: bike.image_url,
      features: bike.features,
      description: bike.description,
      status: bike.status,
    });
    setFormError("");
    setShowBikeForm(true);
  };

  const handleSaveBike = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bikeForm.name || !bikeForm.plate_number) {
      setFormError("Nama motor dan nomor plat wajib diisi");
      return;
    }
    setFormLoading(true);
    setFormError("");

    if (editingBike) {
      const res = await adminUpdateBike(editingBike.id, bikeForm);
      if (!res.success) {
        setFormError(res.error || "Gagal memperbarui");
        setFormLoading(false);
        return;
      }
    } else {
      const res = await adminCreateBike(bikeForm);
      if (!res.success) {
        setFormError(res.error || "Gagal menambah motor");
        setFormLoading(false);
        return;
      }
    }

    setFormLoading(false);
    setShowBikeForm(false);
    loadData();
  };

  const handleDeleteBike = async (id: number, name: string) => {
    if (!confirm(`Yakin hapus motor "${name}" dari armada?`)) return;
    await adminDeleteBike(id);
    loadData();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="animate-pulse text-ink-muted text-sm">Memeriksa autentikasi...</div>
      </div>
    );
  }

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

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline text-xs text-ink-muted">
              {user?.name} ({user?.email})
            </span>
            <button
              onClick={loadData}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-xs font-medium text-ink transition shadow-warm-sm"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-rust" : ""}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rust/10 hover:bg-rust/20 text-rust text-xs font-medium transition"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
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

        {/* Tab 2: Bikes Management with CRUD */}
        {activeTab === "bikes" && (
          <div>
            {/* Add bike button */}
            <div className="mb-4">
              <button
                onClick={openCreateForm}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rust hover:bg-rust-hover text-white text-xs font-medium transition shadow-warm-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Motor Baru</span>
              </button>
            </div>

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
                    <div className="flex-1 min-w-0">
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

                  <div className="text-[11px] text-ink-muted border-t border-sand-200 pt-2 flex justify-between items-center">
                    <span>{bike.engine_cc}cc {bike.transmission.toLowerCase()} · {bike.brand}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditForm(bike)}
                        className="p-1.5 rounded-lg hover:bg-sand-100 text-ink-muted hover:text-rust transition"
                        title="Edit Motor"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBike(bike.id, bike.name)}
                        className="p-1.5 rounded-lg hover:bg-rust/10 text-ink-muted hover:text-rust transition"
                        title="Hapus Motor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bike Create/Edit Modal */}
      {showBikeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-sand-200 rounded-2xl shadow-warm-lg overflow-hidden my-8">
            <div className="flex items-center justify-between p-5 border-b border-sand-200 bg-sand-50/50">
              <h2 className="font-serif text-xl font-bold text-ink">
                {editingBike ? "Edit Unit Motor" : "Tambah Motor Baru"}
              </h2>
              <button onClick={() => setShowBikeForm(false)} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBike} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">{formError}</div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1">Nama Motor *</label>
                  <input type="text" value={bikeForm.name} onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })} placeholder="Honda PCX 160 ABS" className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Brand</label>
                  <select value={bikeForm.brand} onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option>Honda</option><option>Yamaha</option><option>Vespa</option><option>Kawasaki</option><option>Suzuki</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Kategori</label>
                  <select value={bikeForm.category} onChange={(e) => setBikeForm({ ...bikeForm, category: e.target.value })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option>Maxi Scooter</option><option>Matic Compact</option><option>Classic &amp; Lifestyle</option><option>Sport Matic</option><option>Retro Matic</option><option>Big Maxi</option><option>Dual Sport / Trail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">CC Mesin</label>
                  <input type="number" value={bikeForm.engine_cc} onChange={(e) => setBikeForm({ ...bikeForm, engine_cc: Number(e.target.value) })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Tahun</label>
                  <input type="number" value={bikeForm.year} onChange={(e) => setBikeForm({ ...bikeForm, year: Number(e.target.value) })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Transmisi</label>
                  <select value={bikeForm.transmission} onChange={(e) => setBikeForm({ ...bikeForm, transmission: e.target.value })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option>Automatic</option><option>Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Harga / Hari (Rp)</label>
                  <input type="number" value={bikeForm.price_per_day} onChange={(e) => setBikeForm({ ...bikeForm, price_per_day: Number(e.target.value) })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Nomor Plat *</label>
                  <input type="text" value={bikeForm.plate_number} onChange={(e) => setBikeForm({ ...bikeForm, plate_number: e.target.value })} placeholder="B 1234 XYZ" className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Status</label>
                  <select value={bikeForm.status} onChange={(e) => setBikeForm({ ...bikeForm, status: e.target.value as "available" | "rented" | "maintenance" })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option value="available">Tersedia</option><option value="rented">Disewa</option><option value="maintenance">Servis</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1">URL Gambar</label>
                  <input type="url" value={bikeForm.image_url} onChange={(e) => setBikeForm({ ...bikeForm, image_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1">Fitur (pisahkan koma)</label>
                  <input type="text" value={bikeForm.features} onChange={(e) => setBikeForm({ ...bikeForm, features: e.target.value })} placeholder="2 Helm SNI, Jas Hujan, Phone Holder" className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1">Deskripsi</label>
                  <textarea value={bikeForm.description} onChange={(e) => setBikeForm({ ...bikeForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition resize-none" />
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button type="submit" disabled={formLoading} className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition shadow-warm-sm disabled:opacity-50">
                  <Save className="w-3.5 h-3.5" />
                  <span>{formLoading ? "Menyimpan..." : editingBike ? "Perbarui Motor" : "Simpan Motor Baru"}</span>
                </button>
                <button type="button" onClick={() => setShowBikeForm(false)} className="px-4 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-muted font-medium text-xs transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
