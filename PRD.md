# PRD — ms.Rent: Sistem Reservasi & Manajemen Rental Motor

| | |
| :--- | :--- |
| **Dokumen** | Product Requirements Document (PRD) |
| **Produk** | ms.Rent — Platform rental motor (Frontend Next.js + Backend Golang) |
| **Versi** | 1.0 |
| **Tanggal** | 26 September 2026 |
| **Status** | Draft |
| **Repo** | `https://gitlab.com/panggabeaneta/ms-rent` |
| **Branch fitur terkini** | `main` (inti), `feature/peta-service` (peta service center) |

---

## 1. Ringkasan Produk

ms.Rent adalah platform reservasi dan manajemen rental motor untuk garasi ("Garasi Motor Urban Jabodetabek"). Pelanggan dapat menelusuri katalog armada, memeriksa ketersediaan tanggal, membuat reservasi online, melacak status pesanan lewat kode booking, dan mengonfirmasi pesanan via WhatsApp. Admin mengelola armada, memvalidasi booking, serta memantau metrik bisnis melalui dashboard khusus.

Produk terdiri dari dua komponen:

- **Frontend** — Next.js 16 (App Router, TypeScript, Tailwind CSS v3) di `frontend/`
- **Backend** — Golang REST API (Gin + GORM + MySQL) di `backend/`

---

## 2. Latar Belakang & Masalah

1. **Reservasi manual** (telepon/DM) rawan bentrok jadwal dan salah catat.
2. **Informasi armada tidak terpublikasi** — calon penyewa tidak tahu unit, harga, dan ketersediaan sebelum menghubungi admin.
3. **Pelacakan pesanan sulit** — pelanggan harus menanyakan status berkali-kali.
4. **Purna jual** — penyewa (terutama wisatawan) tidak tahu di mana bengkel resmi terdekat jika unit bermasalah di perjalanan.

---

## 3. Tujuan & Indikator Keberhasilan

| ID | Tujuan | Indikator |
| :--- | :--- | :--- |
| G1 | Kurangi bentrok jadwal sewa | 0 kasus double-booking pada pengujian overlap |
| G2 | Self-service booking tanpa admin | ≥ 80% booking dibuat lewat form online |
| G3 | Pelacakan mandiri | Pelacak kode booking berfungsi tanpa login |
| G4 | Transparansi harga | Total biaya tampil real-time sebelum konfirmasi |
| G5 | Pernapra jual terbantu | Pengguna dapat menemukan service center terdekat < 3 klik |

---

## 4. Target Pengguna (Personas)

### 4.1 Penyewa / Pelanggan (publik)
- Warga lokal & wisatawan yang butuh motor harian (stasiun/hotel).
- Tidak wajib login; cukup nomor WhatsApp aktif dan KTP/identitas.
- Butuh: katalog jelas, cek ketersediaan, harga transparan, konfirmasi cepat.

### 4.2 Admin Garasi
- Mengelola armada, memvalidasi & menyelesaikan booking, memantau omzet.
- Login wajib (JWT + role `admin`).
- Butuh: ringkasan metrik, tabel booking, CRUD motor, mutasi status.

---

## 5. Ruang Lingkup

### 5.1 In Scope (v1.0)
- Katalog motor + filter (kategori, brand) & pencarian.
- Detail unit + kalender ketersediaan per bulan.
- Reservasi online: durasi, opsi antar-jemput, helm tambahan, kalkulasi otomatis.
- Validasi ketersediaan & pencegahan overlap booking.
- Kode booking unik + pelacakan status publik.
- Tautan konfirmasi WhatsApp berformat otomatis.
- Autentikasi JWT (login/registrasi/profil) + otorisasi role.
- Dashboard admin: statistik, kelola booking (mutasi status), CRUD armada.
- **Peta service center resmi** (Leaflet + OpenStreetMap) dengan deteksi lokasi & urutan terdekat.
- Fallback mock data di frontend bila backend offline.

### 5.2 Out of Scope (v1.0)
- Pembayaran online (payment gateway) — saat ini konfirmasi manual via WhatsApp/transfer.
- Notifikasi push/email/SMS otomatis.
- Aplikasi mobile native; PWA.
- Manajemen pelanggan (CRM), loyalitas, promo/kupon.
- Modul akuntansi/keuangan selain total omzet sederhana.
- Multi-cabang/multi-tenant rental.
- Crowdsourcing/pengeditan data service center oleh publik.

---

## 6. Arsitektur & Teknologi

```
Browser (Next.js App Router, Tailwind v3, Lucide icons, Leaflet)
   │  fetch JSON + JWT Bearer
   ▼
Golang REST API (Gin, CORS allowlist, middleware JWT)
   │  GORM (AutoMigrate + seed)
   ▼
MySQL (XAMPP/MariaDB, db: ms_rent)  —  default fallback ke SQLite TIDAK tersedia (lihat §14)
```

| Lapisan | Teknologi |
| :--- | :--- |
| Frontend | Next.js 16.3.6, React 19, TypeScript 5, Tailwind CSS 3.4 |
| Peta | Leaflet 1.9.4 + react-leaflet 5 (tile OpenStreetMap) |
| Backend | Go 1.27, Gin 1.12, GORM 1.31, godotenv, golang-jwt/v5, bcrypt |
| Database | MySQL/MariaDB (XAMPP) — `ms_rent` |
| Auth | JWT HS256, masa berlaku 24 jam |

---

## 6.1 Struktur Repo

```text
ms-rent/
├── backend/
│   ├── cmd/api/main.go              # entry point, load .env, init DB, start server
│   └── internal/
│       ├── database/database.go     # GORM init, AutoMigrate, seed (bikes, admin, service centers)
│       ├── handlers/                # auth, bike, booking, dashboard, service_center
│       ├── middleware/auth.go       # JWT generate/verify, AuthRequired, AdminRequired
│       ├── models/                  # User, Bike, Booking, ServiceCenter
│       └── routes/routes.go         # routing + CORS
├── frontend/
│   └── src/
│       ├── app/                     # page, login, admin, motor/[id], service-center
│       ├── components/              # Navbar, BikeCard, BookingModal, CheckBookingModal, ServiceCenterMap
│       ├── lib/api.ts               # API client + mock fallback
│       └── types/                   # TypeScript interfaces
├── PRD.md                           # dokumen ini
└── README.md
```

---

## 7. Kebutuhan Fungsional (Functional Requirements)

### FR-1 — Katalog Armada (Publik)
- **FR-1.1** Menampilkan semua motor (nama, brand, kategori, CC, tahun, transmisi, harga/hari, plat, status, gambar, fitur, deskripsi).
- **FR-1.2** Filter: `category`, `brand`, `status`, `min_price`, `max_price`, `search` (nama/brand).
- **FR-1.3** Halaman detail `/motor/[id]` menampilkan spesifikasi, fitur, galeri terkait (3 unit se-kategori), dan tombol booking.
- **FR-1.4** Bila API tidak terjangkau, frontend menampilkan data mock (`initialMockBikes`, 8 unit).

### FR-2 — Kalender & Cek Ketersediaan (Publik)
- **FR-2.1** Kalender per bulan (`YYYY-MM`) menandai tanggal terbooking (status `pending/confirmed/active`) dengan navigasi bulan sebelumnya/berikutnya.
- **FR-2.2** Endpoint cek ketersediaan `start_date`–`end_date` mengembalikan `is_available` + pesan.

### FR-3 — Reservasi Online (Publik)
- **FR-3.1** Form booking: nama, WhatsApp, KTP/identitas, tanggal mulai–selesai, durasi hari, opsi ambil sendiri / antar ke lokasi (+alamat), jumlah helm tambahan (0–2), catatan.
- **FR-3.2** Kalkulasi biaya real-time:
  - Sewa = `price_per_day × durasi_hari`
  - Helm tambahan = `Rp 15.000 × jumlah × hari` (2 helm SNI pertama **gratis**)
  - Antar-jemput = `Rp 35.000` (sekali jalan, bila pilih antar)
  - **Total = sewa + helm + antar-jemput**
- **FR-3.3** Server menghitung ulang durasi & total bila frontend tidak mengirimnya (validasi server-side terhadap manipulasi harga).
- **FR-3.4** Booking tersimpan dengan status `pending` / pembayaran `unpaid`.
- **FR-3.5** Respons sukses berisi kode booking unik (lihat FR-5).

### FR-4 — Pencegahan Overlap Booking
- **FR-4.1** `CreateBooking` menolak (HTTP 409) bila ada booking `confirmed`/`active` lain pada unit sama dengan rentang tanggal menabrak (`start_date <= end_new AND end_date >= start_new`).
- **FR-4.2** Cek ketersediaan (FR-2.2) dan kalender mempertimbangkan status `pending`, `confirmed`, `active`.
- **FR-4.3** *Known caveat* (lihat §14): booking `pending` tidak menghalangi `CreateBooking`, padahal dihitung pada kalender/availability — status `pending` lama berpotensi "memakan" slot di tampilan kalender tanpa pernah dikonfirmasi.

### FR-5 — Kode Booking & Pelacakan (Publik)
- **FR-5.1** Format kode: `MSR-YYYYMMDD-XXXXXX` (`XXXXXX` hex acak uppercase, 6 karakter).
- **FR-5.2** Pelacakan via modal "Lacak Reservasi": input kode → tampilkan detail pesanan (unit, jadwal, total, status booking & pembayaran).
- **FR-5.3** Tidak memerlukan login; endpoint hanya menerima kode valid (404 bila tidak ada).

### FR-6 — Konfirmasi WhatsApp
- **FR-6.1** Setelah booking sukses, tombol membuka `https://wa.me/6282151728477` dengan pesan otomatis berisi: kode booking, nama unit + plat, nama penyewa, jadwal + durasi, total biaya, dan permintaan info rekening pembayaran.
- **FR-6.2** Nomor tujuan dikonfigurasi di kode (`Contact`); perubahan nomor cukup menyentuh satu tempat.

### FR-7 — Autentikasi & Otorisasi
- **FR-7.1** `POST /api/auth/register` — daftar akun `customer` (nama, email, password, phone; password di-hash bcrypt).
- **FR-7.2** `POST /api/auth/login` — mengembalikan JWT (24 jam) + profil; menolak akun non-`IsActive` (403).
- **FR-7.3** `GET /api/auth/me` — profil memerlukan token.
- **FR-7.4** Middleware `AuthRequired` (401 bila tanpa/salah token) dan `AdminRequired` (403 bila role ≠ `admin`).
- **FR-7.5** Simpan sesi di `localStorage` (`ms_rent_token`, `ms_rent_user`); header `Authorization: Bearer` otomatis.

### FR-8 — Dashboard Admin (Terkunci Role `admin`)
- **FR-8.1** Metrik: total unit, unit available/rented/maintenance, total booking, active, pending, total omzet (booking `paid`).
- **FR-8.2** Tab **Bookings**: tabel semua pesanan (kode, pelanggan, unit, jadwal, total, status) + filter status; aksi mutasi status booking & pembayaran.
- **FR-8.3** Tab **Bikes**: CRUD armada (tambah/edit/hapus) — field: nama, brand, kategori, CC, tahun, transmisi, harga/hari, plat, status, URL gambar, fitur (pisah koma), deskripsi.
- **FR-8.4** Akses ditolak (redirect/logout) bagi non-admin.

### FR-9 — Alur Status Booking
- **Status booking**: `pending` → `confirmed` → `active` → `completed` (atau `cancelled`).
- **Status pembayaran**: `unpaid` → `paid` (atau `refunded`).
- **Efek pada unit**: saat booking menjadi `active` → unit `rented`; saat `completed`/dibatalkan → unit `available` (otomatis oleh backend).
- **FR-9.1** Admin dapat mengubah status lewat `PATCH /api/admin/bookings/:id/status` (booking **dan** pembayaran dalam satu panggilan).

### FR-10 — Peta Service Center Resmi (Fitur `feature/peta-service`)
- **FR-10.1** Halaman `/service-center` menampilkan peta Leaflet/OpenStreetMap dengan 30 titik dealer resmi: Honda/AHASS (10), Yamaha (10), Vespa (5), Kawasaki (5) di 20+ kota.
- **FR-10.2** **Lokasi terdekat**: tombol "Gunakan Lokasi Saya" meminta izin geolocation; backend mengurutkan hasil via formula **haversine** dan menyertakan `distance_km`.
- **FR-10.3** Filter brand (chips berwarna sesuai legenda) + pencarian teks (kota/nama/alamat).
- **FR-10.4** Klik daftar → peta `flyTo` ke marker & sorot; marker berwarna per brand; marker biru = lokasi pengguna.
- **FR-10.5** Kartu detail terpilih: tombol **Rute** (Google Maps directions) dan **Telepon** (`tel:`), jam operasional, jarak.
- **FR-10.6** Kegagalan izin lokasi → tampil status jelas, daftar tetap ditampilkan (urut brand/kota).
- **FR-10.7** Data seed bersifat **contoh demonstrasi** (disclaimer ditampilkan di halaman).

### FR-11 — Resilience Frontend
- **FR-11.1** Semua API punya fallback: katalog → data mock; stats → nilai contoh; booking → kode mock (respons tetap `success`, dengan field `error` berisi pesan koneksi).
- **FR-11.2** Fallback hanya aktif bila request gagal — bukan saat server merespons error bisnis.

---

## 8. Kebutuhan Non-Fungsional (NFR)

| ID | Kategori | Persyaratan |
| :--- | :--- | :--- |
| NFR-1 | Performa | Katalog & halaman utama siap < 3 s (dev, kompilasi Turbopack); API merespons < 300 ms untuk 30–100 baris data |
| NFR-2 | Keamanan | Password bcrypt; JWT HS256 24 jam; field password tidak pernah ikut JSON (`json:"-"`); CORS allowlist ketat (localhost:3000/3002 + `CLIENT_URL`); endpoint admin wajib 2 lapis middleware |
| NFR-3 | Keamanan | `.env` tidak masuk repo (`.gitignore` `**/.env`); secret ada di `JWT_SECRET` |
| NFR-4 | Responsif | Layout mobile-first; navigasi drawer; peta & daftar menumpuk vertikal di layar kecil |
| NFR-5 | Kompatibilitas | Chrome/Edge/Firefox/Safari terbaru (desktop & mobile); geolocation hanya di konteks aman (https/localhost) |
| NFR-6 | Ketersediaan | Backend tanpa MySQL = gagal start (lihat §14); frontend tetap menyajikan katalog mock |
| NFR-7 | Integritas data | AutoMigrate + seed idempoten (seed hanya saat tabel kosong) |
| NFR-8 | Aksesibilitas | Label form tersedia; kontras teks memadai; status bukan hanya warna (ada teks) |
| NFR-9 | Kualitas kode | `go build ./...` bersih; `tsc --noEmit` bersih; `next build` sukses; lint tanpa error baru |

---

## 9. Model Data

| Tabel | Kolom Pentungan |
| :--- | :--- |
| `users` | id, name, email (unique), password (bcrypt, hidden), role (`admin`/`customer`), phone, is_active |
| `bikes` | id, name, brand, category, engine_cc, year, transmission, price_per_day, plate_number, status (`available`/`rented`/`maintenance`), image_url, features, description |
| `bookings` | id, booking_code (unique), bike_id → bikes, customer_name/phone/email/id_card, start_date, end_date, duration_days, pickup/return_location, delivery_address, extra_helmets, raincoat_count, phone_holder, total_price, payment_status, booking_status, payment_method, notes |
| `service_centers` | id, name, brand, type, address, city, province, phone, hours, latitude, longitude, is_official |

---

## 10. Kontrak API

Base URL: `http://localhost:8080/api` — semua respons memakai pola `{ success, message?, count?, data }`.

| Method | Endpoint | Akses | Keterangan |
| :--- | :--- | :--- | :--- |
| GET | `/health` | publik | Healthcheck |
| POST | `/auth/register` | publik | Daftar akun customer |
| POST | `/auth/login` | publik | Login → JWT + user |
| GET | `/auth/me` | token | Profil |
| GET | `/bikes` | publik | Katalog + filter |
| GET | `/bikes/:id` | publik | Detail unit |
| GET | `/bikes/:id/availability?start_date&end_date` | publik | Cek ketersediaan |
| GET | `/bikes/:id/calendar?month=YYYY-MM` | publik | Tanggal terbooking |
| POST | `/bookings` | publik | Buat reservasi (409 bila overlap) |
| GET | `/bookings/code/:code` | publik | Lacak kode booking |
| GET | `/service-centers` | publik | Filter: `brand`, `city`, `search`, `lat`, `lng` (urut jarak + `distance_km`) |
| GET | `/service-centers/:id` | publik | Detail service center |
| GET | `/admin/bookings` | admin | Filter: `status`, `phone`, `code` |
| PATCH | `/admin/bookings/:id/status` | admin | Mutasi status booking/pembayaran |
| POST/PUT/DELETE | `/admin/bikes[/:id]` | admin | CRUD armada |
| GET | `/admin/dashboard/stats` | admin | Metrik dashboard |

---

## 11. User Flow Utama

**F1 — Penyewa memesan (happy path)**
Buka `/` → filter/pilih motor → lihat detail + kalender ketersediaan → "Sewa Sekarang" → isi form (tanggal, antar/ambil, helm) → total tampil real-time → submit → dapat kode booking → klik "Konfirmasi via WhatsApp" → admin konfirmasi (status & bayar).

**F2 — Lacak pesanan**
Klik "Lacak Reservasi" (navbar/halaman mana pun) → input `MSR-…` → detail status pesanan tampil.

**F3 — Admin memproses**
`/login` dengan akun admin → dashboard → tab Bookings → ubah `pending→confirmed` → saat unit diserahkan `→active` (unit otomatis `rented`) → selesai `→completed` (unit kembali `available`) + tandai `paid` → lihat omzet.

**F4 — Kelola armada**
Admin tab Bikes → tambah/edit/hapus unit → perubahan langsung tampil di katalog publik.

**F5 — Cari service center terdekat**
Buka `/service-center` → klik "Gunakan Lokasi Saya" → izinkan → daftar terurut jarak + peta ter-center ke lokasi → filter brand → klik unit → lihat detail → "Rute"/"Telepon".

---

## 12. Aturan Bisnis

| ID | Aturan |
| :--- | :--- |
| BR-1 | Satu unit hanya boleh memiliki satu booking aktif per tanggal (overlap ditolak untuk status `confirmed`/`active`). |
| BR-2 | Durasi minimal 1 hari; durasi = `(end − start) + 1` hari. |
| BR-3 | Harga final = server (recompute bila `total_price` tidak dikirim). |
| BR-4 | Kode booking bersifat unik global dan tidak dapat dipilih pelanggan. |
| BR-5 | Hanya `admin` yang boleh memutasi status booking, mengelola unit, dan membaca statistik. |
| BR-6 | Unit otomatis `rented` saat booking `active`, kembali `available` saat `completed`/dibatalkan. |
| BR-7 | Seed (motor, admin, service center) hanya berjalan bila tabel masih kosong. |

---

## 13. Acceptance Criteria (Ringkas)

- [ ] Katalog menampilkan ≥ 8 unit dari database; filter brand/kategori/pencarian bekerja.
- [ ] Booking ganda pada rentang tanggal menabrak ditolak HTTP 409 dengan pesan jelas.
- [ ] Kode booking ter-generate, bisa dilacak tanpa login, dan tampil di dashboard admin.
- [ ] Total biaya identik antara hitungan frontend & server untuk skenario normal.
- [ ] Endpoint `/admin/*` mengembalikan 401 tanpa token dan 403 dengan token customer.
- [ ] Login `admin@msrent.com` menampilkan dashboard berisi metrik nyata.
- [ ] Halaman `/service-center`: marker tampil, geolocation mengurutkan jarak benar (uji titik Jakarta), filter brand memfilter peta + daftar.
- [ ] Semua halaman utama (`/`, `/login`, `/admin`, `/motor/[id]`, `/service-center`) merespons 200.
- [ ] `go build`, `tsc --noEmit`, dan `next build` sukses tanpa error.

---

## 14. Batasan, Risiko & Asumsi

| ID | Item | Dampak / Mitigasi |
| :--- | :--- | :--- |
| R1 | **Fallback SQLite tidak ada di kode** — README menyebut fallback, tetapi `database.go` hanya `return nil` saat MySQL gagal → server hidup tetapi semua query panic (nil pointer). | Tinggi. Mitigasi: implement fallback SQLite sesuai README, atau `log.Fatalf` eksplisit + health check. |
| R2 | Booking `pending` tidak menahan slot di `CreateBooking` (hanya `confirmed`/`active`), tetapi dihitung di kalender/availability. | Sedang. Pendekatan: sertakan `pending` dalam cek overlap atau batasi umur `pending`. |
| R3 | Booking mock saat backend offline **tidak tersimpan** (kode random) — pelacakan akan gagal. | Sedang. Mitigasi: komunikasikan pesan error pada respons (sudah dikirim di field `error`). |
| R4 | Data service center adalah **seed contoh** (nama/koordinat ilustratif, bukan verifikasi lapangan). | Sedang. Mitigasi: disclaimer di halaman; kurasi bertahap. |
| R5 | Tidak ada pembayaran online → omzet hanya benar bila admin menandai `paid` manual. | Sedang (by design v1). Roadmap: payment gateway. |
| R6 | JWT secret default hard-coded bila `JWT_SECRET` kosong. | Tinggi di produksi. Mitigasi: wajibkan env di deployment. |
| R7 | Geolocation hanya berfungsi di https/localhost. | Rendah (dev lokal aman). |
| R8 | Lint memiliki 4 error pre-existing (React 19 strict rules di `admin/page.tsx`, `Navbar.tsx`, `BookingModal.tsx`). | Rendah. Perbaiki terpisah tanpa mengubah perilaku. |
| R9 | Push ke GitLab diblokir 403 (akun bukan member) — fitur peta tertahan di `feature/peta-service`. | Proses. Selesaikan akses repo / fork + MR. |

---

## 15. Milestone / Roadmap

| Fase | Isi | Status |
| :--- | :--- | :--- |
| M1 | Setup full-stack, katalog, detail unit, booking + WhatsApp, tracking, dashboard admin | ✅ Selesai (`main`) |
| M2 | Auth JWT + role protection | ✅ Selesai (`main`) |
| M3 | Peta service center + lokasi terdekat | ✅ Selesai (`feature/peta-service`) |
| M4 | Perapian: fallback DB, sinkronisasi README, perbaikan lint pre-existing | ⬜ Belum |
| M5 | Hardening produksi: `JWT_SECRET` wajib, rate limit, validasi input menyeluruh | ⬜ Belum |
| M6 | Pembayaran online & notifikasi otomatis | ⬜ Rencana |
| M7 | Data service center terverifikasi + admin CRUD service center | ⬜ Rencana |

---

## 16. Lampiran

**Akun demo (seed otomatis)**
- Admin: `admin@msrent.com` / `admin123` (hanya untuk development — ganti di produksi)

**Perintah lokal**
```powershell
# Backend (butuh MySQL berjalan + backend/.env)
cd backend
go run cmd/api/main.go          # http://localhost:8080

# Frontend
cd frontend
npm install
npm run dev                     # http://localhost:3000
```

**Konstanta bisnis**
| Item | Nilai |
| :--- | :--- |
| Helm tambahan | Rp 15.000 / hari / helm (maks 2 tambahan) |
| Antar-jemput | Rp 35.000 sekali jalan |
| Helm gratis | 2 helm SNI per sewa |
| Masa berlaku JWT | 24 jam |
| Nomor WhatsApp tujuan | 0821-5172-8477 |
