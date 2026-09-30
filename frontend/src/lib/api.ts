import { Bike, Booking, DashboardStats, AuthResponse, User, CalendarData, ServiceCenter } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// ====================== AUTH HELPERS ======================

const AUTH_TOKEN_KEY = "ms_rent_token";
const AUTH_USER_KEY = "ms_rent_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: User) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

export function clearAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();
}

// ====================== AUTH STORE (for useSyncExternalStore) ======================

const AUTH_EVENT = "ms-rent:auth";

export interface AuthSnapshot {
  token: string | null;
  user: User | null;
}

const SERVER_AUTH_SNAPSHOT: AuthSnapshot = { token: null, user: null };

let cachedAuthSnapshot: AuthSnapshot = SERVER_AUTH_SNAPSHOT;
let cachedAuthKey = "";

const authSnapshotKey = (token: string | null, user: User | null) =>
  `${token ?? ""}|${user ? `${user.id}|${user.email}|${user.role}` : ""}`;

export function subscribeAuth(onStoreChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      event.key === AUTH_TOKEN_KEY ||
      event.key === AUTH_USER_KEY
    ) {
      onStoreChange();
    }
  };
  const onAuth = () => onStoreChange();

  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_EVENT, onAuth);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_EVENT, onAuth);
  };
}

export function getAuthSnapshot(): AuthSnapshot {
  const token = getStoredToken();
  const user = getStoredUser();
  const key = authSnapshotKey(token, user);
  if (key !== cachedAuthKey) {
    cachedAuthKey = key;
    cachedAuthSnapshot = { token, user };
  }
  return cachedAuthSnapshot;
}

export function getServerAuthSnapshot(): AuthSnapshot {
  return SERVER_AUTH_SNAPSHOT;
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function authHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ====================== AUTH API ======================

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Login gagal");
  return json;
}

export async function register(name: string, email: string, password: string, phone: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Registrasi gagal");
  return json;
}

export async function getProfile(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

// ====================== MOCK DATA (fallback) ======================

export const initialMockBikes: Bike[] = [
  {
    id: 9,
    name: "Beat 2022",
    brand: "Honda",
    category: "Matic Compact",
    engine_cc: 110,
    year: 2022,
    transmission: "Automatic",
    price_per_day: 85000,
    price_per_hour: 5000,
    plate_number: "B 3912 KFX",
    status: "available",
    image_url: "/bikes/beat-2022.png",
    features: "2 Helm SNI, Jas Hujan, Phone Holder, Irit BBM, Lincah",
    description: "Motor matic lincah dan super hemat bahan bakar, sangat pas untuk mobilitas harian dan keliling kota dengan santai.",
  },
  {
    id: 10,
    name: "Scoopy 2023",
    brand: "Honda",
    category: "Retro Matic",
    engine_cc: 110,
    year: 2023,
    transmission: "Automatic",
    price_per_day: 95000,
    price_per_hour: 5500,
    plate_number: "B 4712 SCP",
    status: "available",
    image_url: "/bikes/scoopy-2023.png",
    features: "2 Helm Bogo, Jas Hujan, Smart Key System, Desain Retro Modern, Bagasi Luas",
    description: "Skuter matic berdesain retro modern yang stylish dan nyaman, sempurna untuk gaya santai keliling sudut-sudut kota.",
  },
  {
    id: 11,
    name: "Aerox 150s",
    brand: "Yamaha",
    category: "Sport Matic",
    engine_cc: 155,
    year: 2023,
    transmission: "Automatic",
    price_per_day: 125000,
    price_per_hour: 6500,
    plate_number: "B 6023 ARX",
    status: "available",
    image_url: "/bikes/aerox-150s.png",
    features: "2 Helm SNI Sport, Jas Hujan, Phone Holder, Desain Agresif Sporty, Sub-tank Suspension",
    description: "Performa bertenaga dan handling sporty responsif untuk Anda yang menginginkan tarikan mesin mantap di jalan perkotaan.",
  },
];

// ====================== PUBLIC BIKE API ======================

export async function getBikes(params?: { category?: string; brand?: string; search?: string }): Promise<Bike[]> {
  try {
    const url = new URL(`${API_BASE_URL}/bikes`);
    if (params?.category && params.category !== "Semua") url.searchParams.append("category", params.category);
    if (params?.brand && params.brand !== "Semua") url.searchParams.append("brand", params.brand);
    if (params?.search) url.searchParams.append("search", params.search);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengambil data dari server");
    const json = await res.json();
    return json.data || [];
  } catch {
    // Fallback jika API backend belum aktif
    let filtered = [...initialMockBikes];
    if (params?.category && params.category !== "Semua") {
      filtered = filtered.filter((b) => b.category.toLowerCase().includes(params.category!.toLowerCase()));
    }
    if (params?.brand && params.brand !== "Semua") {
      filtered = filtered.filter((b) => b.brand.toLowerCase() === params.brand!.toLowerCase());
    }
    if (params?.search) {
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(params.search!.toLowerCase()) ||
          b.brand.toLowerCase().includes(params.search!.toLowerCase())
      );
    }
    return filtered;
  }
}

export async function getBikeByID(id: number): Promise<Bike | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/bikes/${id}`);
    if (!res.ok) throw new Error("Not found");
    const json = await res.json();
    return json.data;
  } catch {
    return initialMockBikes.find((b) => b.id === id) || null;
  }
}

export async function getBikeCalendar(bikeId: number, month: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE_URL}/bikes/${bikeId}/calendar?month=${month}`);
    if (!res.ok) throw new Error("Calendar error");
    const json: CalendarData = await res.json();
    return json.booked_dates || {};
  } catch {
    return {};
  }
}

export interface BikeHourInterval {
  start: string;
  end: string;
  status: string;
  status_label: string;
}

// Jam-jam terpakai 1 unit pada tanggal tertentu (untuk melihat jam yang kosong)
export async function getBikeHours(
  bikeId: number,
  date: string
): Promise<BikeHourInterval[] | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/bikes/${bikeId}/hours?date=${date}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json.intervals) ? json.intervals : [];
  } catch {
    return null;
  }
}

// ====================== PUBLIC BOOKING API ======================

export async function createBooking(data: Booking): Promise<{ success: boolean; data?: Booking; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    let json: { error?: string; data?: Booking } | null = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    // Reservasi hanya dianggap berhasil bila server benar-benar merespons sukses.
    // Jangan pernah memalsukan sukses: server adalah satu-satunya yang memvalidasi
    // ketersediaan unit (bentrok jadwal), harga, dan jadwal lampau.
    if (!res.ok) {
      return {
        success: false,
        error: json?.error || `Server menolak reservasi (HTTP ${res.status}). Silakan coba lagi.`,
      };
    }
    if (!json?.data) {
      return { success: false, error: "Respons server tidak valid. Silakan coba lagi." };
    }
    return { success: true, data: json.data };
  } catch {
    return {
      success: false,
      error:
        "Tidak dapat terhubung ke server reservasi. Pastikan server backend berjalan, lalu coba lagi.",
    };
  }
}

export async function getBookingByCode(code: string): Promise<Booking | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/code/${code}`);
    if (!res.ok) throw new Error("Not found");
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function requestExtend(
  bookingCode: string,
  customerPhone: string,
  hours: number
): Promise<{ success: boolean; data?: Booking; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        booking_code: bookingCode,
        customer_phone: customerPhone,
        hours,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal mengajukan perpanjaman");
    return { success: true, data: json.data, message: json.message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke server backend",
    };
  }
}

// ====================== PAYMENT API (Midtrans) ======================

export interface PaymentTokenResponse {
  success: boolean;
  token?: string;
  redirect_url?: string;
  client_key?: string;
  is_production?: boolean;
  is_mock?: boolean;
  error?: string;
}

export async function getPaymentToken(bookingCode: string): Promise<PaymentTokenResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_code: bookingCode }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Gagal membuat sesi pembayaran" };
    }
    return {
      success: true,
      token: json.token,
      redirect_url: json.redirect_url,
      client_key: json.client_key,
      is_production: json.is_production,
      is_mock: json.is_mock,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke server pembayaran",
    };
  }
}

export async function mockPay(bookingCode: string): Promise<{ success: boolean; data?: Booking; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/payment/mock-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_code: bookingCode }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || "Gagal melakukan simulasi pembayaran" };
    }
    return { success: true, data: json.data };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke server pembayaran",
    };
  }
}

// ====================== ADMIN API (protected) ======================

export async function getBookings(): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bookings`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil bookings");
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function updateBookingStatus(
  id: number,
  status: { booking_status?: string; payment_status?: string }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(status),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adminExtendBooking(
  id: number,
  hours: number
): Promise<{ success: boolean; data?: Booking; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/extend`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ hours }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal memperpanjang reservasi");
    return { success: true, data: json.data, message: json.message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke server backend",
    };
  }
}

export async function decideExtend(
  id: number,
  approve: boolean
): Promise<{ success: boolean; data?: Booking; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${id}/extend/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ approve }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal memproses keputusan perpanjaman");
    return { success: true, data: json.data, message: json.message };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal terhubung ke server backend",
    };
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      cache: "no-store",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Error fetching stats");
    const json = await res.json();
    return json.data;
  } catch {
    return {
      total_bikes: initialMockBikes.length,
      available_bikes: initialMockBikes.length,
      rented_bikes: 0,
      maintenance_bikes: 0,
      total_bookings: 3,
      active_bookings: 1,
      pending_bookings: 2,
      total_revenue: 1450000,
    };
  }
}

// Admin Bike CRUD
export async function adminCreateBike(data: Partial<Bike>): Promise<{ success: boolean; data?: Bike; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bikes`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal menambah motor");
    return { success: true, data: json.data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function adminUpdateBike(id: number, data: Partial<Bike>): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bikes/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal memperbarui motor");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Error" };
  }
}

export async function adminDeleteBike(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/bikes/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ====================== SERVICE CENTER API ======================

export async function getServiceCenters(params?: {
  brand?: string;
  search?: string;
  lat?: number;
  lng?: number;
}): Promise<ServiceCenter[]> {
  try {
    const url = new URL(`${API_BASE_URL}/service-centers`);
    if (params?.brand && params.brand !== "Semua") url.searchParams.append("brand", params.brand);
    if (params?.search) url.searchParams.append("search", params.search);
    if (typeof params?.lat === "number") url.searchParams.append("lat", String(params.lat));
    if (typeof params?.lng === "number") url.searchParams.append("lng", String(params.lng));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengambil data service center");
    const json = await res.json();
    return json.data || [];
  } catch {
    // Fallback jika API backend belum aktif
    return [];
  }
}
