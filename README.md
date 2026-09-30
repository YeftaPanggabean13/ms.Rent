# ms.Rent — Sistem Rental Motor (Next.js & Golang)

Platform reservasi dan manajemen rental motor modern yang dibangun menggunakan **Next.js (App Router, TypeScript, Tailwind CSS v3)** untuk Frontend dan **Golang (Gin Framework, GORM, MySQL/SQLite)** untuk Backend REST API.

---

## 🚀 Fitur Utama

- **Katalog Motor Interaktif**: Showcase unit motor matic (*Beat 2022, Scoopy 2023, Aerox 150s*) dengan filter kategori praktis (*Matic Compact, Retro Matic, Sport Matic*).
- **Sistem Reservasi & Kalkulasi Otomatis**: Pemilihan rentang tanggal sewa, penghitungan durasi hari, opsi antar-jemput ke stasiun/hotel, dan helm tambahan secara real-time.
- **Pencegahan Overlap Booking**: Validasi tanggal otomatis untuk mencegah bentrok jadwal pada motor yang sama.
- **Konfirmasi WhatsApp Cepat**: Integrasi link WhatsApp langsung dengan format pesan otomatis berisi kode booking & rincian sewa.
- **Pelacakan Kode Booking**: Pelanggan dapat mengecek status pesanan dan ketersediaan unit melalui modal pelacakan.
- **Admin Fleet & Booking Dashboard**: Monitor armada, approve booking, serahkan unit, tandai lunas, dan rekap omzet sewa.

---

## 📂 Struktur Project

```text
ms.Rent/
├── backend/                  # Golang REST API (Gin + GORM)
│   ├── cmd/api/main.go       # Entry point server
│   ├── internal/
│   │   ├── config/           # Loader konfigurasi .env
│   │   ├── database/         # Inisialisasi GORM, MySQL & fallback SQLite + Seed data
│   │   ├── handlers/         # Controller Bike, Booking, & Dashboard
│   │   ├── models/           # Struct database Bike & Booking
│   │   └── routes/           # Router Gin & konfigurasi CORS
│   ├── .env                  # Konfigurasi port & database
│   ├── go.mod
│   └── go.sum
│
└── frontend/                 # Next.js App Router (TypeScript + Tailwind CSS v3)
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx      # Landing page & katalog publik
    │   │   └── admin/        # Admin Fleet & Booking Dashboard
    │   ├── components/       # Navbar, BikeCard, BookingModal, CheckBookingModal
    │   ├── lib/api.ts        # Client API helper & mock fallback
    │   └── types/            # TypeScript interfaces
    ├── package.json
    └── tailwind.config.js
```

---

## 🛠️ Cara Menjalankan Project

### 1. Backend (Golang)

1. Buka terminal dan masuk ke folder `backend`:
   ```powershell
   cd backend
   ```
2. Jalankan server backend:
   ```powershell
   go run cmd/api/main.go
   ```
3. Backend akan berjalan di `http://localhost:8080`.
   - *Catatan Database*: Secara default backend mencoba menghubungkan ke MySQL di `127.0.0.1:3306` (database: `ms_rent`). Jika MySQL belum aktif (misal di XAMPP), backend otomatis menggunakan SQLite lokal (`ms_rent.db`) sehingga aplikasi bisa langsung diuji tanpa hambatan.

### 2. Frontend (Next.js)

1. Buka terminal baru dan masuk ke folder `frontend`:
   ```powershell
   cd frontend
   ```
2. Jalankan development server:
   ```powershell
   npm run dev
   ```
3. Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 📑 Endpoint API Backend

| Method | Endpoint | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Healthcheck API |
| `GET` | `/api/bikes` | Ambil semua katalog motor (mendukung filter `category`, `brand`, `search`) |
| `GET` | `/api/bikes/:id` | Detail spesifik unit motor |
| `GET` | `/api/bikes/:id/availability` | Cek ketersediaan motor pada rentang tanggal |
| `POST` | `/api/bookings` | Buat reservasi sewa motor baru |
| `GET` | `/api/bookings` | Daftar seluruh pesanan sewa |
| `GET` | `/api/bookings/code/:code` | Lacak pesanan berdasarkan Kode Booking |
| `PATCH`| `/api/bookings/:id/status` | Update status booking (`pending`, `confirmed`, `active`, `completed`) |
| `GET` | `/api/dashboard/stats` | Ringkasan metrik rental motor untuk panel admin |
