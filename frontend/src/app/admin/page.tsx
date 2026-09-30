"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, Booking, DashboardStats } from "@/types";
import {
  getBikes,
  getBookings,
  getDashboardStats,
  updateBookingStatus,
  adminExtendBooking,
  decideExtend,
  clearAuth,
  adminCreateBike,
  adminUpdateBike,
  adminUpdateBikeStock,
  adminDeleteBike,
  subscribeAuth,
  getAuthSnapshot,
  getServerAuthSnapshot,
} from "@/lib/api";
import {
  ArrowLeft,
  RefreshCw,
  LogOut,
  Plus,
  Minus,
  Pencil,
  Trash2,
  X,
  Save,
  Search,
  Bike as BikeIcon,
  CalendarCheck,
  Wallet,
  Activity,
  Clock,
  Check,
} from "lucide-react";
import {
  BookingTrendChart,
  StatusDonut,
  BrandRevenueBars,
  FleetUtilization,
} from "@/components/admin/DashboardCharts";
import Logo from "@/components/Logo";

const STATUS_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Siap Jalan" },
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Selesai" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function countBookingsThisWeek(bookings: Booking[]): number {
  const now = Date.now();
  return bookings.filter(
    (b) => b.created_at && now - new Date(b.created_at).getTime() < WEEK_MS
  ).length;
}

export default function AdminPage() {
  const router = useRouter();
  const { token, user } = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );
  const isAdmin = Boolean(token && user && user.role === "admin");

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [newThisWeek, setNewThisWeek] = useState(0);
  const [activeTab, setActiveTab] = useState<"bookings" | "bikes" | "pricing">("bookings");
  const [loading, setLoading] = useState(true);

  // Waktu sekarang (diperbarui tiap 30 detik) untuk mengecek jendela perpanjaman (extend)
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Filter interaktif untuk tabel reservasi
  const [bookingQuery, setBookingQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
    price_per_hour: number;
    plate_number: string;
    stock: number;
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
    price_per_hour: 5500,
    plate_number: "",
    stock: 1,
    image_url: "",
    features: "",
    description: "",
    status: "available",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Tarif per jam state (tab "Tarif Per Jam")
  const [priceDraft, setPriceDraft] = useState<Record<number, number>>({});
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null);
  const [savingAllPrices, setSavingAllPrices] = useState(false);
  const [priceMsg, setPriceMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Arahkan ke login jika bukan admin (auth dibaca dari store localStorage)
  useEffect(() => {
    if (!isAdmin) router.push("/login");
  }, [isAdmin, router]);

  const fetchDashboardData = async () => {
    const [s, bList, bkList] = await Promise.all([
      getDashboardStats(),
      getBikes(),
      getBookings(),
    ]);
    return { stats: s, bikes: bList, bookings: bkList };
  };

  const applyDashboardData = (data: {
    stats: DashboardStats;
    bikes: Bike[];
    bookings: Booking[];
  }) => {
    setStats(data.stats);
    setBikes(data.bikes);
    setBookings(data.bookings);
    setNewThisWeek(countBookingsThisWeek(data.bookings));
    // Pertahankan draft tarif per jam yang belum disimpan, buang yang sudah dihapus
    setPriceDraft((prev) => {
      const next: Record<number, number> = {};
      for (const b of data.bikes) next[b.id] = prev[b.id] ?? b.price_per_hour ?? 0;
      return next;
    });
    setLoading(false);
  };

  const loadData = async () => {
    setLoading(true);
    applyDashboardData(await fetchDashboardData());
  };

  // Muat data dashboard setelah status admin terkonfirmasi
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchDashboardData().then((data) => {
      if (!cancelled) applyDashboardData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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

  // ====== Perpanjaman sewa (extend) ======
  const [extendTarget, setExtendTarget] = useState<Booking | null>(null);
  const [extendHours, setExtendHours] = useState(1);
  const [extendLoading, setExtendLoading] = useState(false);
  const [extendError, setExtendError] = useState("");

  const openExtendForm = (b: Booking) => {
    setExtendTarget(b);
    setExtendHours(1);
    setExtendError("");
    setExtendLoading(false);
  };

  const handleAdminExtend = async () => {
    if (!extendTarget?.id) return;
    if (!extendWindowOk(extendTarget)) {
      setExtendError("Perpanjangan hanya bisa dilakukan minimal 30 menit sebelum masa sewa habis.");
      return;
    }
    setExtendLoading(true);
    setExtendError("");
    const res = await adminExtendBooking(extendTarget.id, extendHours);
    setExtendLoading(false);
    if (res.success) {
      setExtendTarget(null);
      loadData();
    } else {
      setExtendError(res.error || "Gagal memperpanjang reservasi");
    }
  };

  const handleExtendDecision = async (id: number, approve: boolean) => {
    const res = await decideExtend(id, approve);
    if (!res.success) {
      alert(res.error || "Gagal memproses keputusan perpanjaman");
    }
    loadData();
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const durationLabel = (b: Booking) =>
    b.rental_type === "hourly"
      ? `${b.duration_hours ?? 0} Jam Sewa (per jam)`
      : `${b.duration_days} Hari Sewa${b.extended_hours ? ` + ${b.extended_hours} Jam extend` : ""}`;

  // Jendela perpanjangan: minimal 30 menit sebelum masa sewa habis (end_date + end_time)
  const extendWindowOk = (b: Booking) => {
    const base = new Date(`${b.end_date}T00:00:00`).getTime();
    const et = b.end_time && b.end_time !== "24:00" ? b.end_time : "";
    const end = et
      ? base + ((Number(et.split(":")[0]) || 0) * 60 + (Number(et.split(":")[1]) || 0)) * 60000
      : base + 86400000;
    return end - nowTs >= 30 * 60 * 1000;
  };

  const filteredBookings = useMemo(() => {
    const q = bookingQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = statusFilter === "all" || b.booking_status === statusFilter;
      const matchQuery =
        !q ||
        (b.customer_name || "").toLowerCase().includes(q) ||
        (b.booking_code || "").toLowerCase().includes(q) ||
        (b.customer_phone || "").toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [bookings, bookingQuery, statusFilter]);

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const scrollToTabs = () => {
    document.getElementById("tab-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToBookings = (filter: StatusFilter) => {
    setActiveTab("bookings");
    setStatusFilter(filter);
    setBookingQuery("");
    scrollToTabs();
  };

  const goToBikes = () => {
    setActiveTab("bikes");
    scrollToTabs();
  };

  const resetBookingFilter = () => {
    setStatusFilter("all");
    setBookingQuery("");
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
      price_per_hour: 5500,
      plate_number: "",
      stock: 1,
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
      price_per_hour: bike.price_per_hour ?? 0,
      plate_number: bike.plate_number,
      stock: bike.stock ?? 0,
      image_url: bike.image_url,
      features: bike.features,
      description: bike.description,
      status: bike.status,
    });
    setFormError("");
    setShowBikeForm(true);
  };

  const handleQuickStockChange = async (bike: Bike, delta: number) => {
    const currentStock = bike.stock ?? 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    // Optimistic UI update
    setBikes((prev) =>
      prev.map((b) =>
        b.id === bike.id
          ? { ...b, stock: newStock, status: newStock === 0 ? "maintenance" : "available" }
          : b
      )
    );

    const res = await adminUpdateBikeStock(bike.id, newStock);
    if (!res.success) {
      alert(res.error || "Gagal mengubah stok armada");
      loadData();
    } else {
      loadData();
    }
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

  // ====== Tarif per jam (tab pricing) ======
  const suggestedHourly = (bike: Bike) => Math.ceil(bike.price_per_day / 24);
  const isPriceDirty = (bike: Bike) =>
    (priceDraft[bike.id] ?? bike.price_per_hour ?? 0) !== (bike.price_per_hour ?? 0);

  const dirtyPriceCount = useMemo(
    () => bikes.filter(isPriceDirty).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bikes, priceDraft]
  );

  const handleSaveHourlyPrice = async (bike: Bike) => {
    const value = priceDraft[bike.id] ?? 0;
    setSavingPriceId(bike.id);
    setPriceMsg(null);
    const res = await adminUpdateBike(bike.id, { ...bike, price_per_hour: value });
    setSavingPriceId(null);
    if (res.success) {
      setPriceMsg({ ok: true, text: `${bike.name}: tarif per jam disimpan ${formatRupiah(value)}.` });
      loadData();
    } else {
      setPriceMsg({ ok: false, text: res.error || "Gagal menyimpan tarif per jam" });
    }
  };

  const handleSaveAllHourlyPrices = async () => {
    const dirty = bikes.filter(isPriceDirty);
    if (dirty.length === 0) return;
    setSavingAllPrices(true);
    setPriceMsg(null);
    let failed = 0;
    for (const bike of dirty) {
      const res = await adminUpdateBike(bike.id, {
        ...bike,
        price_per_hour: priceDraft[bike.id] ?? 0,
      });
      if (!res.success) failed++;
    }
    setSavingAllPrices(false);
    setPriceMsg(
      failed === 0
        ? { ok: true, text: `${dirty.length} tarif per jam berhasil diperbarui.` }
        : { ok: false, text: `${failed} dari ${dirty.length} tarif gagal disimpan.` }
    );
    loadData();
  };

  if (!isAdmin) {
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
            <div className="flex items-center gap-3">
              <Logo size={36} />
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
        {/* Page Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
          <div>
            <span className="eyebrow-line text-xs font-semibold text-rust tracking-[0.14em] uppercase">
              Dashboard Garasi
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink mt-1.5">
              Halo, {user?.name || "Admin"}
            </h1>
            <p className="text-xs text-ink-muted mt-1">
              {todayLabel} · Ringkasan operasional ms.Rent
            </p>
          </div>
          <Link
            href="/#armada"
            className="self-start sm:self-auto text-xs font-semibold px-4 py-2.5 rounded-lg border border-sand-300 bg-white hover:bg-sand-50 hover:border-sand-400 text-ink transition shadow-warm-sm"
          >
            Lihat Katalog Publik →
          </Link>
        </div>

        {/* Metric Cards (klik untuk melompat ke data terkait) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: BikeIcon,
              label: "Total Armada Unit",
              value: `${bikes.reduce((acc, b) => acc + (b.stock ?? 0), 0)} Unit`,
              sub: bikes.length > 0 ? bikes.map((b) => `${b.name.split(" ")[0]}: ${b.stock ?? 0}`).join(" · ") : `${stats?.available_bikes ?? 0} Unit Siap Jalan`,
              accent: "bg-moss/10 text-moss",
              subClass: "text-moss",
              border: "border-t-moss/60",
              onClick: goToBikes,
            },
            {
              icon: Activity,
              label: "Sedang Disewa (Aktif)",
              value: String(stats?.active_bookings ?? 0),
              sub: `${stats?.pending_bookings ?? 0} menunggu konfirmasi`,
              accent: "bg-rust/10 text-rust",
              subClass: "text-ink-muted",
              border: "border-t-rust/60",
              onClick: () => goToBookings("active"),
            },
            {
              icon: CalendarCheck,
              label: "Total Reservasi Masuk",
              value: String(stats?.total_bookings ?? 0),
              sub: `+${newThisWeek} reservasi 7 hari terakhir`,
              accent: "bg-ink/10 text-ink",
              subClass: "text-ink-muted",
              border: "border-t-ink/50",
              onClick: () => goToBookings("all"),
            },
            {
              icon: Wallet,
              label: "Total Penerimaan",
              value: formatRupiah(stats?.total_revenue ?? 0),
              sub: "Pembayaran terverifikasi",
              accent: "bg-moss/10 text-moss",
              subClass: "text-moss",
              border: "border-t-moss",
              onClick: () => goToBookings("all"),
            },
          ].map((k) => {
            const Icon = k.icon;
            return (
              <button
                key={k.label}
                onClick={k.onClick}
                className="group text-left p-5 rounded-2xl bg-white border border-sand-200 border-t-2 shadow-warm-sm hover:shadow-warm-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs text-ink-muted font-medium">{k.label}</span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition group-hover:scale-110 ${k.accent}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                  </span>
                </div>
                <div className="text-2xl font-bold text-ink mt-1.5">{k.value}</div>
                <span className={`text-xs mt-1 block font-medium ${k.subClass}`}>{k.sub}</span>
                <span className="text-[10px] text-ink-faint mt-2 block opacity-0 group-hover:opacity-100 transition">
                  Klik untuk lihat detail →
                </span>
              </button>
            );
          })}
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <BookingTrendChart bookings={bookings} />
          </div>
          <StatusDonut bookings={bookings} />
          <div className="lg:col-span-2">
            <BrandRevenueBars bookings={bookings} />
          </div>
          <FleetUtilization stats={stats} />
        </div>

        {/* Tab Navigation (segmented control) */}
        <div id="tab-section" className="scroll-mt-24">
        <div className="inline-flex p-1 rounded-xl bg-sand-100 border border-sand-200 mb-6">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "bookings"
                ? "bg-white text-ink shadow-warm-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Manajemen Reservasi ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("bikes")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "bikes"
                ? "bg-white text-ink shadow-warm-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Daftar Armada Motor ({bikes.length})
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === "pricing"
                ? "bg-white text-ink shadow-warm-sm"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            Tarif Per Jam ({bikes.length})
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {/* Toolbar: search + status chips */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
                <input
                  type="text"
                  value={bookingQuery}
                  onChange={(e) => setBookingQuery(e.target.value)}
                  placeholder="Cari nama, kode, atau no. HP..."
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-sand-200 bg-sand-50 text-ink placeholder-ink-faint focus:outline-none focus:border-rust focus:bg-white focus:ring-4 focus:ring-rust/10 transition"
                />
              </div>
              <div className="flex flex-wrap gap-2 md:ml-auto">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
                      statusFilter === f.value
                        ? "bg-ink text-base border-ink shadow-warm-sm"
                        : "bg-sand-50 text-ink-muted border-sand-200 hover:border-sand-300 hover:text-ink"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-ink-muted">
              Menampilkan <strong className="text-ink">{filteredBookings.length}</strong> dari{" "}
              {bookings.length} reservasi
              {statusFilter !== "all" && (
                <button
                  onClick={resetBookingFilter}
                  className="ml-2 text-rust hover:text-rust-hover font-semibold underline underline-offset-2"
                >
                  Reset filter
                </button>
              )}
            </p>

            {bookings.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-sand-200 shadow-warm-sm text-ink-muted">
                <p>Belum ada data pesanan sewa motor.</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-sand-200 shadow-warm-sm">
                <p className="text-ink-muted text-sm">Tidak ada reservasi yang cocok dengan filter.</p>
                <button
                  onClick={resetBookingFilter}
                  className="mt-4 px-4 py-2 rounded-lg bg-rust hover:bg-rust-hover text-white text-xs font-medium transition shadow-warm-sm"
                >
                  Reset Filter
                </button>
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
                    {filteredBookings.map((b) => (
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
                          <div className="font-medium text-ink">
                            {b.start_date}{b.start_time ? ` ${b.start_time}` : ""} s / d {b.end_time && b.end_time !== "24:00" ? `${b.end_date} ${b.end_time}` : b.end_date}
                          </div>
                          <div className="text-[11px] text-ink-muted">{durationLabel(b)}</div>
                          {(b.pending_extend_hours ?? 0) > 0 && (
                            <div className="text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 inline-block whitespace-nowrap px-1.5 py-0.5 rounded mt-1">
                              Extend +{b.pending_extend_hours} jam menunggu
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-rust">{formatRupiah(b.total_price)}</div>
                          <span
                            className={`inline-block whitespace-nowrap px-2 py-0.5 rounded text-[10px] uppercase font-semibold mt-1 ${
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
                            className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium ${
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
                              {(b.booking_status === "confirmed" || b.booking_status === "active") &&
                                (extendWindowOk(b) ? (
                                  <button
                                    onClick={() => openExtendForm(b)}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-sand-50 border border-sand-300 text-ink font-medium text-xs"
                                    title="Perpanjang jam sewa (extend)"
                                  >
                                    <Clock className="w-3 h-3 inline -mt-0.5 mr-1" />
                                    Extend
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-200 text-ink-faint font-medium text-xs opacity-60 cursor-not-allowed"
                                    title="Perpanjangan hanya bisa dilakukan minimal 30 menit sebelum masa sewa habis"
                                  >
                                    <Clock className="w-3 h-3 inline -mt-0.5 mr-1" />
                                    Extend
                                  </button>
                                ))}
                              {(b.pending_extend_hours ?? 0) > 0 && (
                                <>
                                  <button
                                    onClick={() => handleExtendDecision(b.id!, true)}
                                    disabled={!extendWindowOk(b)}
                                    className="px-2.5 py-1 rounded-lg bg-moss hover:opacity-90 text-white font-medium text-xs shadow-warm-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                    title={
                                      extendWindowOk(b)
                                        ? "Setujui permintaan perpanjaman pelanggan"
                                        : "Jendela perpanjaman sudah tertutup (kurang dari 30 menit sebelum masa sewa habis)"
                                    }
                                  >
                                    <Check className="w-3 h-3 inline -mt-0.5 mr-1" />
                                    Setujui
                                  </button>
                                  <button
                                    onClick={() => handleExtendDecision(b.id!, false)}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-sand-50 border border-sand-300 text-ink font-medium text-xs"
                                    title="Tolak permintaan perpanjaman"
                                  >
                                    Tolak
                                  </button>
                                </>
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
                      <h4 className="font-bold text-ink text-sm leading-snug">{bike.name}</h4>
                      <p className="text-sm text-rust font-bold mt-0.5">{formatRupiah(bike.price_per_day)} <span className="font-sans text-xs text-ink-muted font-normal">/ hari</span></p>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        {formatRupiah(bike.price_per_hour ?? 0)} <span className="font-normal">/ jam</span>
                      </p>
                      <p className="text-[11px] text-ink-muted mt-1">Plat: {bike.plate_number}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span
                          className={`inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            bike.status === "available"
                              ? "bg-moss/10 text-moss border border-moss/20"
                              : bike.status === "rented"
                              ? "bg-rust/10 text-rust border border-rust/20"
                              : "bg-sand-200 text-ink-muted border border-sand-300"
                          }`}
                        >
                          {bike.status === "available" ? "Tersedia" : bike.status === "rented" ? "Disewa" : "Jadwal Servis"}
                        </span>
                        <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-800 border border-amber-500/30">
                          Stok: {bike.stock ?? 0} Unit {bike.available_stock !== undefined ? `(${bike.available_stock} Siap)` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stock Controller */}
                  <div className="px-3 py-2 bg-sand-50/80 border border-sand-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-ink">Ketersediaan Stok</span>
                      <p className="text-[10px] text-ink-muted">Unit fisik siap direntalkan</p>
                    </div>
                    <div className="flex items-center space-x-1 bg-white border border-sand-200 rounded-lg p-0.5 shadow-xs">
                      <button
                        type="button"
                        onClick={() => handleQuickStockChange(bike, -1)}
                        disabled={bike.stock <= 0}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-sand-100 text-ink disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                        title="Kurangi stok 1 unit"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-black text-ink min-w-[24px] text-center">
                        {bike.stock ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickStockChange(bike, 1)}
                        className="w-7 h-7 rounded flex items-center justify-center hover:bg-sand-100 text-ink transition cursor-pointer"
                        title="Tambah stok 1 unit"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
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

        {/* Tab 3: Pengaturan Tarif Per Jam */}
        {activeTab === "pricing" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-sand-200 shadow-warm-sm text-xs text-ink-muted leading-relaxed">
              Atur <strong className="text-ink">tarif sewa per jam</strong> untuk tiap unit. Sewa per jam hanya
              tersedia bila tarif di atas 0 (durasi min. 2 jam, maks. 23 jam) dan tidak memengaruhi harga harian.
              Isi <strong className="text-ink">0</strong> untuk menonaktifkan sewa per jam pada unit tersebut.
              Harga berlaku untuk reservasi baru maupun perpanjangan (extend).
            </div>

            {priceMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium border ${
                  priceMsg.ok
                    ? "bg-moss/10 border-moss/30 text-moss"
                    : "bg-rust/10 border-rust/30 text-rust"
                }`}
              >
                {priceMsg.text}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveAllHourlyPrices}
                disabled={savingAllPrices || dirtyPriceCount === 0}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-rust hover:bg-rust-hover text-white text-xs font-medium transition shadow-warm-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingAllPrices
                    ? "Menyimpan..."
                    : `Terapkan Semua Perubahan${dirtyPriceCount ? ` (${dirtyPriceCount})` : ""}`}
                </span>
              </button>
              {dirtyPriceCount > 0 && (
                <span className="text-[11px] text-ink-muted">
                  {dirtyPriceCount} perubahan belum disimpan
                </span>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white shadow-warm-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50 text-ink-muted border-b border-sand-200 text-[11px] font-semibold">
                  <tr>
                    <th className="p-4">Unit Motor</th>
                    <th className="p-4">Harga / Hari</th>
                    <th className="p-4">Tarif / Jam (Rp)</th>
                    <th className="p-4">Saran</th>
                    <th className="p-4">Status Sewa Per Jam</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/70 text-ink">
                  {bikes.map((bike) => {
                    const draft = priceDraft[bike.id] ?? bike.price_per_hour ?? 0;
                    const dirty = draft !== (bike.price_per_hour ?? 0);
                    const suggested = suggestedHourly(bike);
                    const active = draft > 0;
                    return (
                      <tr key={bike.id} className={`transition ${dirty ? "bg-rust/5" : "hover:bg-sand-50/70"}`}>
                        <td className="p-4">
                          <div className="font-semibold text-ink">{bike.name}</div>
                          <div className="text-[10px] text-ink-faint mt-0.5">
                            {bike.brand} · {bike.plate_number} · <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Stok: {bike.stock ?? 0} Unit</span>
                          </div>
                        </td>
                        <td className="p-4 text-ink-muted whitespace-nowrap">
                          {formatRupiah(bike.price_per_day)}
                        </td>
                        <td className="p-4">
                          <input
                            type="number"
                            min={0}
                            step={500}
                            value={draft}
                            onChange={(e) =>
                              setPriceDraft({ ...priceDraft, [bike.id]: Number(e.target.value) })
                            }
                            className="w-32 px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust focus:bg-white focus:ring-4 focus:ring-rust/10 transition"
                          />
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => setPriceDraft({ ...priceDraft, [bike.id]: suggested })}
                            className="text-rust hover:text-rust-hover font-semibold underline underline-offset-2 whitespace-nowrap"
                            title="Pakai harga harian dibagi 24 (dibulatkan ke atas)"
                          >
                            {formatRupiah(suggested)}
                          </button>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap border ${
                              active
                                ? "bg-moss/10 text-moss border-moss/20"
                                : "bg-sand-200 text-ink-muted border-sand-300"
                            }`}
                          >
                            {active ? `Aktif · ${formatRupiah(draft)}/jam` : "Nonaktif"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleSaveHourlyPrice(bike)}
                            disabled={!dirty || savingPriceId !== null}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-rust hover:bg-rust-hover text-white text-[11px] font-medium transition shadow-warm-sm disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Save className="w-3 h-3" />
                            <span>{savingPriceId === bike.id ? "Menyimpan" : "Simpan"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-ink-faint">
              Baris berwarna oranye menandai perubahan yang belum disimpan. Klik nilai pada kolom Saran
              untuk mengisi tarif otomatis (harga harian dibagi 24, dibulatkan ke atas).
            </p>
          </div>
        )}
        </div>
      </main>

      {/* Bike Create/Edit Modal */}
      {showBikeForm && (
        <div className="fixed inset-0 z-50 flex p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg m-auto flex flex-col max-h-[calc(100vh-2rem)] bg-white border border-sand-200 rounded-2xl shadow-warm-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-sand-200 bg-sand-50/50 shrink-0">
              <h2 className="text-xl font-bold text-ink">
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
                  <input type="text" value={bikeForm.name} onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })} placeholder="Beat 2022 / Scoopy 2023 / Aerox 150s" className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Brand</label>
                  <select value={bikeForm.brand} onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option>Honda</option><option>Yamaha</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Kategori</label>
                  <select value={bikeForm.category} onChange={(e) => setBikeForm({ ...bikeForm, category: e.target.value })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option>Matic Compact</option><option>Retro Matic</option><option>Sport Matic</option>
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
                  <label className="block text-xs font-medium text-ink mb-1">Harga / Jam (Rp)</label>
                  <input type="number" min={0} value={bikeForm.price_per_hour} onChange={(e) => setBikeForm({ ...bikeForm, price_per_hour: Number(e.target.value) })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" />
                  <p className="text-[10px] text-ink-faint mt-1">0 = fitur sewa per jam nonaktif</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Nomor Plat *</label>
                  <input type="text" value={bikeForm.plate_number} onChange={(e) => setBikeForm({ ...bikeForm, plate_number: e.target.value })} placeholder="B 1234 XYZ" className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Jumlah Stok Unit *</label>
                  <input
                    type="number"
                    min={0}
                    value={bikeForm.stock}
                    onChange={(e) => setBikeForm({ ...bikeForm, stock: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition font-bold"
                    required
                  />
                  <p className="text-[10px] text-ink-faint mt-1">Kapasitas total unit armada fisik</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-ink mb-1">Status Ketersediaan</label>
                  <select value={bikeForm.status} onChange={(e) => setBikeForm({ ...bikeForm, status: e.target.value as "available" | "rented" | "maintenance" })} className="w-full px-3 py-2 bg-sand-50 rounded-lg border border-sand-200 text-xs text-ink focus:outline-none focus:border-rust transition">
                    <option value="available">Tersedia Siap Jalan</option><option value="rented">Semua Sedang Disewa</option><option value="maintenance">Dalam Perawatan / Servis</option>
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

      {/* Extend (Perpanjaman Jam Sewa) Modal */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex p-4 bg-ink/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md m-auto flex flex-col max-h-[calc(100vh-2rem)] bg-white border border-sand-200 rounded-2xl shadow-warm-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-sand-200 bg-sand-50/50 shrink-0">
              <div>
                <span className="text-xs font-semibold text-rust tracking-wide">Perpanjaman Sewa</span>
                <h2 className="text-xl font-bold text-ink">{extendTarget.booking_code}</h2>
              </div>
              <button onClick={() => setExtendTarget(null)} className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-200 text-xs space-y-1.5">
                <div className="flex justify-between gap-3">
                  <span className="text-ink-muted">Penyewa</span>
                  <span className="font-semibold text-ink">{extendTarget.customer_name}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-muted">Unit</span>
                  <span className="font-semibold text-ink">{extendTarget.bike?.name || `Motor ID: ${extendTarget.bike_id}`}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-muted">Jadwal saat ini</span>
                  <span className="font-semibold text-ink">
                    {extendTarget.start_date}{extendTarget.start_time ? ` ${extendTarget.start_time}` : ""} s/d {extendTarget.end_time && extendTarget.end_time !== "24:00" ? `${extendTarget.end_date} ${extendTarget.end_time}` : extendTarget.end_date}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-ink-muted">Tarif per jam</span>
                  <span className="font-semibold text-rust">{formatRupiah(extendTarget.bike?.price_per_hour ?? 0)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-sand-200 text-xs">
                <span className="text-ink-muted">Jam tambahan (1-23)</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setExtendHours(Math.max(1, extendHours - 1))}
                    className="w-7 h-7 rounded-lg bg-sand-50 border border-sand-200 text-ink font-semibold hover:bg-sand-100 text-xs transition"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold w-5 text-center text-ink">{extendHours}</span>
                  <button
                    type="button"
                    onClick={() => setExtendHours(Math.min(23, extendHours + 1))}
                    className="w-7 h-7 rounded-lg bg-sand-50 border border-sand-200 text-ink font-semibold hover:bg-sand-100 text-xs transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-muted">Biaya tambahan</span>
                <span className="font-semibold text-rust">
                  {formatRupiah((extendTarget.bike?.price_per_hour ?? 0) * extendHours)}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Total reservasi akan ditambah biaya di atas. Bila sebelumnya sudah lunas, status pembayaran
                kembali menjadi <strong>Belum Lunas</strong> untuk sisa tagihan.
              </p>

              {extendError && (
                <div className="p-2.5 rounded-lg bg-rust/10 border border-rust/30 text-rust text-xs font-medium">{extendError}</div>
              )}

              {extendTarget && !extendWindowOk(extendTarget) && (
                <div className="p-2.5 rounded-lg bg-sand-100 border border-sand-200 text-ink-muted text-[11px] leading-relaxed">
                  Perpanjangan hanya bisa dilakukan minimal 30 menit sebelum masa sewa habis —
                  jendela perpanjaman untuk reservasi ini sudah tertutup.
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setExtendTarget(null)}
                  className="py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-ink-light font-medium text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleAdminExtend}
                  disabled={extendLoading || (extendTarget ? !extendWindowOk(extendTarget) : false)}
                  className="py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition disabled:opacity-50 shadow-warm-sm"
                >
                  {extendLoading ? "Menerapkan..." : "Terapkan Extend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
