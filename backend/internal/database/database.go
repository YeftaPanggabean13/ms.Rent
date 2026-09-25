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
	err = db.AutoMigrate(&models.User{}, &models.Bike{}, &models.Booking{})
	if err != nil {
		log.Fatalf("❌ Gagal migrasi database: %v", err)
	}

	// Seed data jika belum ada motor
	seedBikes(db)
	seedAdmin(db)

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
		Phone:    "081234567890",
		IsActive: true,
	}
	db.Create(&admin)
	log.Println("✅ Akun admin berhasil dibuat (admin@msrent.com / admin123)")
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
