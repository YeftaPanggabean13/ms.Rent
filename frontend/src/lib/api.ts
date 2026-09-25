import { Bike, Booking, DashboardStats } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export const initialMockBikes: Bike[] = [
  {
    id: 1,
    name: "Yamaha NMAX 155 Connected",
    brand: "Yamaha",
    category: "Maxi Scooter",
    engine_cc: 155,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 135000,
    plate_number: "B 4120 KZA",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm SNI, Jas Hujan, Phone Holder, Keyless Smart Key, USB Charger",
    description: "Motor matic bongsor yang sangat nyaman untuk perjalanan santai di kota maupun perjalanan touring luar kota.",
  },
  {
    id: 2,
    name: "Honda PCX 160 ABS",
    brand: "Honda",
    category: "Maxi Scooter",
    engine_cc: 160,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 140000,
    plate_number: "B 3899 SWR",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm SNI, Jas Hujan, Phone Holder, Bagasi Luas 30L, ABS Braking",
    description: "Kenyamanan tingkat tinggi dengan posisi berkendara santai dan kapasitas bagasi sangat lapang.",
  },
  {
    id: 3,
    name: "Honda Vario 160 CBS",
    brand: "Honda",
    category: "Matic Compact",
    engine_cc: 160,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 110000,
    plate_number: "B 5521 TGB",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm SNI, Jas Hujan, Phone Holder, Lincah & Irit",
    description: "Sangat lincah di kemacetan kota dengan tenaga 160cc 4-katup yang bertenaga namun tetap hemat BBM.",
  },
  {
    id: 4,
    name: "Vespa Primavera 150 i-Get",
    brand: "Vespa",
    category: "Classic & Lifestyle",
    engine_cc: 150,
    year: 2023,
    transmission: "Automatic",
    price_per_day: 220000,
    plate_number: "B 1968 VSP",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1515777315835-281b94c9589f?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm Bogo Retro, Jas Hujan, Desain Ikonik Estetik",
    description: "Skuter ikonik bergaya Italia, cocok untuk jalan santai sore, nongkrong di cafe, maupun sesi foto jalanan.",
  },
  {
    id: 5,
    name: "Yamaha Aerox 155 CyberCity",
    brand: "Yamaha",
    category: "Sport Matic",
    engine_cc: 155,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 125000,
    plate_number: "B 6023 ARX",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm SNI, Jas Hujan, Phone Holder, Desain Agresif",
    description: "Performa sport bertenaga dengan handling presisi untuk Anda yang menyukai gaya berkendara dinamis.",
  },
  {
    id: 6,
    name: "Honda Scoopy Prestige",
    brand: "Honda",
    category: "Retro Matic",
    engine_cc: 110,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 95000,
    plate_number: "B 4712 SCP",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm Bogo, Jas Hujan, Smart Key, Super Irit BBM",
    description: "Ringan, lincah, stylish dan sangat hemat bensin. Pilihan terbaik untuk keliling kota harian.",
  },
  {
    id: 7,
    name: "Yamaha XMAX 250 Connected",
    brand: "Yamaha",
    category: "Big Maxi",
    engine_cc: 250,
    year: 2024,
    transmission: "Automatic",
    price_per_day: 290000,
    plate_number: "B 2500 XMX",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
    features: "2 Helm Modular, Windshield Elektrik, TFT Navigation, Bagasi Ekstra Besar",
    description: "Kenyamanan maksimal untuk perjalanan jarak jauh antar-kota dengan mesin 250cc dan fitur navigasi canggih.",
  },
  {
    id: 8,
    name: "Kawasaki KLX 150 BF",
    brand: "Kawasaki",
    category: "Dual Sport / Trail",
    engine_cc: 150,
    year: 2023,
    transmission: "Manual",
    price_per_day: 175000,
    plate_number: "B 6711 KLX",
    status: "available",
    image_url: "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80",
    features: "Helm Trail + Goggle, Jas Hujan, Ban Dual Purpose",
    description: "Motor segala medan, tangguh melibas jalanan berlubang, perkebunan, pantai hingga jalur pegunungan.",
  },
];

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

export async function createBooking(data: Booking): Promise<{ success: boolean; data?: Booking; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Gagal membuat pesanan");
    return { success: true, data: json.data };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal terhubung ke server backend";
    // Mock booking success if backend is offline
    const mockCode = `MSR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return {
      success: true,
      data: {
        ...data,
        id: Date.now(),
        booking_code: mockCode,
        payment_status: "unpaid",
        booking_status: "pending",
        created_at: new Date().toISOString(),
      },
      error: errorMessage,
    };
  }
}

export async function getBookings(): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings`, { cache: "no-store" });
    if (!res.ok) throw new Error("Gagal mengambil bookings");
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
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

export async function updateBookingStatus(
  id: number,
  status: { booking_status?: string; payment_status?: string }
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(status),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { cache: "no-store" });
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
