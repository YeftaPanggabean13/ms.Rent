package database

import (
	"fmt"
	"log"

	"os"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"ms_rent_backend/internal/models"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "")
	dbName := getEnv("DB_NAME", "ms_rent")

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	// DSN MySQL standar (Laragon / XAMPP)
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort, dbName)

	log.Printf("🔌 Menghubungkan ke MySQL di %s:%s (Database: %s)...", dbHost, dbPort, dbName)
	db, err := gorm.Open(mysql.Open(dsn), gormConfig)

	if err != nil {
		log.Printf("❌ Gagal koneksi ke MySQL: %v", err)
		log.Println("💡 Solusi:")
		log.Println("   1. Buka Laragon / XAMPP, lalu klik 'Start All'.")
		log.Println("   2. Pastikan database '" + dbName + "' sudah dibuat (bisa lewat DBeaver / HeidiSQL).")
		return nil
	}

	log.Println("✅ Sukses terhubung ke database MySQL!")

	// Auto Migration
	log.Println("🛠️ Menjalankan Auto-Migration tabel database...")
	err = db.AutoMigrate(&models.User{}, &models.Bike{}, &models.Booking{}, &models.ServiceCenter{})
	if err != nil {
		log.Fatalf("❌ Gagal migrasi database: %v", err)
	}

	// Seed data jika belum ada motor
	seedBikes(db)
	seedAdmin(db)
	seedServiceCenters(db)
	// Catatan: harga per jam sepenuhnya diatur admin lewat panel (0 = sewa per jam nonaktif),
	// jadi tidak ada backfill otomatis agar pilihan admin tidak tertimpa saat server restart.

	DB = db
	return db
}

func seedBikes(db *gorm.DB) {
	var count int64
	db.Model(&models.Bike{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("🌱 Mengisi data awal armada motor rental...")
	initialBikes := []models.Bike{
		{
			Name:         "Yamaha NMAX 155 Connected",
			Brand:        "Yamaha",
			Category:     "Maxi Scooter",
			EngineCC:     155,
			Year:         2024,
			Transmission: "Automatic",
			PricePerDay:  135000,
			PricePerHour: 7000,
			PlateNumber:  "B 4120 KZA",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm SNI, Jas Hujan, Phone Holder, Keyless Smart Key, USB Charger",
			Description:  "Motor matic bongsor yang sangat nyaman untuk perjalanan santai di kota maupun perjalanan touring luar kota.",
		},
		{
			Name:         "Honda PCX 160 ABS",
			Brand:        "Honda",
			Category:     "Maxi Scooter",
			EngineCC:     160,
			Year:         2024,
			Transmission: "Automatic",
			PricePerDay:  140000,
			PricePerHour: 7000,
			PlateNumber:  "B 3899 SWR",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm SNI, Jas Hujan, Phone Holder, Bagasi Luas 30L, ABS Braking",
			Description:  "Kenyamanan tingkat tinggi dengan posisi berkendara santai dan kapasitas bagasi sangat lapang.",
		},
		{
			Name:         "Honda Vario 160 CBS",
			Brand:        "Honda",
			Category:     "Matic Compact",
			EngineCC:     160,
			Year:         2024,
			Transmission: "Automatic",
			PricePerDay:  110000,
			PricePerHour: 6000,
			PlateNumber:  "B 5521 TGB",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm SNI, Jas Hujan, Phone Holder, Lincah & Irit",
			Description:  "Sangat lincah di kemacetan kota dengan tenaga 160cc 4-katup yang bertenaga namun tetap hemat BBM.",
		},
		{
			Name:         "Vespa Primavera 150 i-Get",
			Brand:        "Vespa",
			Category:     "Classic & Lifestyle",
			EngineCC:     150,
			Year:         2023,
			Transmission: "Automatic",
			PricePerDay:  220000,
			PricePerHour: 11000,
			PlateNumber:  "B 1968 VSP",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1515777315835-281b94c9589f?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm Bogo Retro, Jas Hujan, Desain Ikonik Estetik",
			Description:  "Skuter ikonik bergaya Italia, cocok untuk jalan santai sore, nongkrong di cafe, maupun sesi foto jalanan.",
		},
		{
			Name:         "Yamaha Aerox 155 CyberCity",
			Brand:        "Yamaha",
			Category:     "Sport Matic",
			EngineCC:     155,
			Year:         2024,
			Transmission: "Automatic",
			PricePerDay:  125000,
			PricePerHour: 6500,
			PlateNumber:  "B 6023 ARX",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1547549082-6bc09f2049ae?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm SNI, Jas Hujan, Phone Holder, Desain Agresif",
			Description:  "Performa sport bertenaga dengan handling presisi untuk Anda yang menyukai gaya berkendara dinamis.",
		},
		{
			Name:         "Honda Scoopy Prestige",
			Brand:        "Honda",
			Category:     "Retro Matic",
			EngineCC:     110,
			Year:         2024,
			Transmission: "Automatic",
			PricePerDay:  95000,
			PricePerHour: 5500,
			PlateNumber:  "B 4712 SCP",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm Bogo, Jas Hujan, Smart Key, Super Irit BBM",
			Description:  "Ringan, lincah, stylish dan sangat hemat bensin. Pilihan terbaik untuk keliling kota harian.",
		},
		{
			Name:         "Yamaha XMAX 250 Connected",
			Brand:        "Yamaha",
			Category:     "Big Maxi",
			EngineCC:     250,
			Year:         2024,
			Transmission: "Automatic",
			PricePerDay:  290000,
			PricePerHour: 15000,
			PlateNumber:  "B 2500 XMX",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
			Features:     "2 Helm Modular, Windshield Elektrik, TFT Navigation, Bagasi Ekstra Besar",
			Description:  "Kenyamanan maksimal untuk perjalanan jarak jauh antar-kota dengan mesin 250cc dan fitur navigasi canggih.",
		},
		{
			Name:         "Kawasaki KLX 150 BF",
			Brand:        "Kawasaki",
			Category:     "Dual Sport / Trail",
			EngineCC:     150,
			Year:         2023,
			Transmission: "Manual",
			PricePerDay:  175000,
			PricePerHour: 9500,
			PlateNumber:  "B 6711 KLX",
			Status:       "available",
			ImageURL:     "https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&w=800&q=80",
			Features:     "Helm Trail + Goggle, Jas Hujan, Ban Dual Purpose",
			Description:  "Motor segala medan, tangguh melibas jalanan berlubang, perkebunan, pantai hingga jalur pegunungan.",
		},
	}

	for _, bike := range initialBikes {
		db.Create(&bike)
	}
	log.Printf("✅ Berhasil menambahkan %d unit motor awal ke database!", len(initialBikes))
}

func seedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		return
	}

	log.Println("🔐 Membuat akun admin default...")
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	admin := models.User{
		Name:     "Admin Garasi",
		Email:    "admin@msrent.com",
		Password: string(hashedPassword),
		Role:     "admin",
		Phone:    "082151728477",
		IsActive: true,
	}
	db.Create(&admin)
	log.Println("✅ Akun admin berhasil dibuat (admin@msrent.com / admin123)")
}

// seedServiceCenters mengisi titik service center resmi Honda, Yamaha, Vespa & Kawasaki
func seedServiceCenters(db *gorm.DB) {
	var count int64
	db.Model(&models.ServiceCenter{}).Count(&count)
	if count > 0 {
		return
	}

	log.Println("📍 Mengisi data service center resmi...")
	centers := []models.ServiceCenter{
		// ===== Honda (AHASS) =====
		{Name: "AHASS Pondok Indah", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Metro Pondok Indah Blok IV, Pondok Indah", City: "Jakarta Selatan", Province: "DKI Jakarta", Phone: "021-7501234", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -6.2615, Longitude: 106.7835},
		{Name: "AHASS Kalimalang", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Raya Kalimalang Km 18, Bekasi Selatan", City: "Bekasi", Province: "Jawa Barat", Phone: "021-88451236", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -6.2389, Longitude: 106.9889},
		{Name: "AHASS Serpong", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Raya Serpong No. 12, Tangerang Selatan", City: "Tangerang Selatan", Province: "Banten", Phone: "021-7567890", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -6.3170, Longitude: 106.6520},
		{Name: "AHASS Dago Bandung", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Ir. H. Juanda No. 315, Dago", City: "Bandung", Province: "Jawa Barat", Phone: "022-2501567", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -6.8920, Longitude: 107.6160},
		{Name: "AHASS Pandanaran Semarang", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Pandanaran No. 88, Semarang Tengah", City: "Semarang", Province: "Jawa Tengah", Phone: "024-8412345", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -6.9710, Longitude: 110.4120},
		{Name: "AHASS Rungkut Surabaya", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Raya Rungkut Industri III No. 17, Rungkut", City: "Surabaya", Province: "Jawa Timur", Phone: "031-8432109", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -7.3280, Longitude: 112.7650},
		{Name: "AHASS Sesetan Denpasar", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Sesetan Gang Kancana No. 9, Denpasar Selatan", City: "Denpasar", Province: "Bali", Phone: "0361-234567", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -8.6580, Longitude: 115.2160},
		{Name: "AHASS Padang Bulan Medan", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Gajah Mada No. 102, Medan Baru", City: "Medan", Province: "Sumatera Utara", Phone: "061-8456789", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: 3.5060, Longitude: 98.6720},
		{Name: "AHASS Pengayoman Makassar", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Pengayoman Blok F2 No. 30, Makassar", City: "Makassar", Province: "Sulawesi Selatan", Phone: "0411-876543", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -5.1560, Longitude: 119.4400},
		{Name: "AHASS Kusumanegara Yogyakarta", Brand: "Honda", Type: "Bengkel Resmi AHASS", Address: "Jl. Kusumanegara No. 45, Umbulharjo", City: "Yogyakarta", Province: "DI Yogyakarta", Phone: "0274-512345", Hours: "Senin-Sabtu 08.00-17.00, Minggu 08.00-15.00", Latitude: -7.7950, Longitude: 110.3690},

		// ===== Yamaha =====
		{Name: "Yamaha DDS Jakarta Barat", Brand: "Yamaha", Type: "Dealer & Service Resmi", Address: "Jl. Kebon Jeruk Raya No. 88, Kebon Jeruk", City: "Jakarta Barat", Province: "DKI Jakarta", Phone: "021-5367890", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -6.1940, Longitude: 106.8230},
		{Name: "Yamaha Service Center Bekasi", Brand: "Yamaha", Type: "Bengkel Resmi YSS", Address: "Jl. Ahmad Yani No. 127, Bekasi Timur", City: "Bekasi", Province: "Jawa Barat", Phone: "021-88761234", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -6.2440, Longitude: 107.0050},
		{Name: "Yamaha Bandung Pastika", Brand: "Yamaha", Type: "Dealer & Service Resmi", Address: "Jl. Soekarno-Hatta No. 410, Bandung", City: "Bandung", Province: "Jawa Barat", Phone: "022-7301234", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -6.9170, Longitude: 107.6190},
		{Name: "Yamaha Semarang Pandanaran", Brand: "Yamaha", Type: "Bengkel Resmi YSS", Address: "Jl. Pandanaran No. 210, Semarang", City: "Semarang", Province: "Jawa Tengah", Phone: "024-8412987", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -6.9930, Longitude: 110.4300},
		{Name: "Yamaha Surabaya Rungkut", Brand: "Yamaha", Type: "Dealer & Service Resmi", Address: "Jl. Raya Rungkut Asri Tengah No. 12, Surabaya", City: "Surabaya", Province: "Jawa Timur", Phone: "031-8431122", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -7.2570, Longitude: 112.7520},
		{Name: "Yamaha Denpasar Sudirman", Brand: "Yamaha", Type: "Bengkel Resmi YSS", Address: "Jl. Prof. Dr. Ir. Yohanes Sudirman No. 55, Denpasar", City: "Denpasar", Province: "Bali", Phone: "0361-234789", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -8.6610, Longitude: 115.2360},
		{Name: "Yamaha Medan Iskandar Muda", Brand: "Yamaha", Type: "Dealer & Service Resmi", Address: "Jl. Iskandar Muda No. 78, Medan Petisah", City: "Medan", Province: "Sumatera Utara", Phone: "061-8459900", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: 3.5950, Longitude: 98.6750},
		{Name: "Yamaha Makassar Somba Opu", Brand: "Yamaha", Type: "Bengkel Resmi YSS", Address: "Jl. Somba Opu No. 88, Makassar", City: "Makassar", Province: "Sulawesi Selatan", Phone: "0411-8762233", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -5.1480, Longitude: 119.4360},
		{Name: "Yamaha Balikpapan Sudirman", Brand: "Yamaha", Type: "Dealer & Service Resmi", Address: "Jl. Jenderal Sudirman No. 60, Balikpapan", City: "Balikpapan", Province: "Kalimantan Timur", Phone: "0542-421234", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -1.2680, Longitude: 116.8290},
		{Name: "Yamaha Palembang Sudirman", Brand: "Yamaha", Type: "Bengkel Resmi YSS", Address: "Jl. Jenderal Sudirman No. 145, Palembang", City: "Palembang", Province: "Sumatera Selatan", Phone: "0711-5732200", Hours: "Senin-Sabtu 08.00-17.00, Minggu 09.00-15.00", Latitude: -2.9760, Longitude: 104.7750},

		// ===== Vespa (Piaggio Indonesia) =====
		{Name: "Vespa Store Jakarta Sudirman", Brand: "Vespa", Type: "Vespa Store & Workshop", Address: "Jl. Jenderal Sudirman Kav. 52, Jakarta Selatan", City: "Jakarta Selatan", Province: "DKI Jakarta", Phone: "021-27501234", Hours: "Senin-Minggu 09.00-18.00", Latitude: -6.2240, Longitude: 106.8100},
		{Name: "Vespa Store Bandung Dago", Brand: "Vespa", Type: "Vespa Store & Workshop", Address: "Jl. Ir. H. Juanda No. 220, Dago, Bandung", City: "Bandung", Province: "Jawa Barat", Phone: "022-4231188", Hours: "Senin-Minggu 09.00-18.00", Latitude: -6.9030, Longitude: 107.6180},
		{Name: "Vespa Store Surabaya Tunjungan", Brand: "Vespa", Type: "Vespa Store & Workshop", Address: "Jl. Tunjungan No. 55, Surabaya", City: "Surabaya", Province: "Jawa Timur", Phone: "031-5312288", Hours: "Senin-Minggu 09.00-18.00", Latitude: -7.2650, Longitude: 112.7480},
		{Name: "Vespa Store Bali Seminyak", Brand: "Vespa", Type: "Vespa Store & Workshop", Address: "Jl. Sunset Road No. 9, Seminyak, Kuta", City: "Badung", Province: "Bali", Phone: "0361-9388100", Hours: "Senin-Minggu 09.00-18.00", Latitude: -8.6900, Longitude: 115.1680},
		{Name: "Vespa Store Medan Gatot Subroto", Brand: "Vespa", Type: "Vespa Store & Workshop", Address: "Jl. Gatot Subroto No. 188, Medan", City: "Medan", Province: "Sumatera Utara", Phone: "061-80512288", Hours: "Senin-Minggu 09.00-18.00", Latitude: 3.5890, Longitude: 98.6740},

		// ===== Kawasaki (KMI) =====
		{Name: "Kawasaki SSI Tebet", Brand: "Kawasaki", Type: "Sales & Service Resmi KMI", Address: "Jl. Tebet Raya No. 88, Tebet, Jakarta Selatan", City: "Jakarta Selatan", Province: "DKI Jakarta", Phone: "021-8304123", Hours: "Senin-Sabtu 08.30-17.30, Minggu 08.30-16.00", Latitude: -6.2350, Longitude: 106.8520},
		{Name: "Kawasaki Bandung Antapani", Brand: "Kawasaki", Type: "Sales & Service Resmi KMI", Address: "Jl. Antapani Lama No. 45, Bandung", City: "Bandung", Province: "Jawa Barat", Phone: "022-7201234", Hours: "Senin-Sabtu 08.30-17.30, Minggu 08.30-16.00", Latitude: -6.9290, Longitude: 107.6080},
		{Name: "Kawasaki Semarang Majapahit", Brand: "Kawasaki", Type: "Sales & Service Resmi KMI", Address: "Jl. Majapahit No. 60, Semarang", City: "Semarang", Province: "Jawa Tengah", Phone: "024-8412456", Hours: "Senin-Sabtu 08.30-17.30, Minggu 08.30-16.00", Latitude: -7.0050, Longitude: 110.4380},
		{Name: "Kawasaki Surabaya Kenjeran", Brand: "Kawasaki", Type: "Sales & Service Resmi KMI", Address: "Jl. Kenjeran No. 178, Surabaya", City: "Surabaya", Province: "Jawa Timur", Phone: "031-8532100", Hours: "Senin-Sabtu 08.30-17.30, Minggu 08.30-16.00", Latitude: -7.2830, Longitude: 112.7680},
		{Name: "Kawasaki Bali Ngurah Rai", Brand: "Kawasaki", Type: "Sales & Service Resmi KMI", Address: "Jl. Raya Tuban No. 22, Kuta, Badung", City: "Badung", Province: "Bali", Phone: "0361-756789", Hours: "Senin-Sabtu 08.30-17.30, Minggu 08.30-16.00", Latitude: -8.7240, Longitude: 115.1690},
	}

	for _, center := range centers {
		db.Create(&center)
	}
	log.Printf("✅ Berhasil menambahkan %d titik service center resmi!", len(centers))
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
