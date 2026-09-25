package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/routes"
)

func main() {
	// Muat file .env langsung ke environment runtime
	if err := godotenv.Load(); err != nil {
		log.Println("Info: file .env tidak ditemukan, menggunakan nilai bawaan sistem")
	}

	// Inisialisasi Database (baca langsung dari DB_HOST, DB_PORT, dsb)
	database.InitDB()

	// Setup Router & CORS
	r := routes.SetupRouter()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("🚀 Server ms.Rent Backend berjalan di http://localhost%s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("❌ Server error: %v", err)
	}
}
