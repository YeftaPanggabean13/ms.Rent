package main

import (
	"log"

	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/models"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		godotenv.Load(".env")
	}

	db := database.InitDB()
	if db == nil {
		log.Fatal("Could not connect to database")
	}

	showcaseBikes := []models.Bike{
		{
			Name:         "Beat 2022",
			Brand:        "Honda",
			Category:     "Matic Compact",
			EngineCC:     110,
			Year:         2022,
			Transmission: "Automatic",
			PricePerDay:  85000,
			PricePerHour: 5000,
			PlateNumber:  "B 3912 KFX",
			Status:       "available",
			ImageURL:     "/bikes/beat-2022.png",
			Features:     "2 Helm SNI, Jas Hujan, Phone Holder, Irit BBM, Lincah",
			Description:  "Explore the city sustainably with fun and seamless ease! Lincah, super hemat bahan bakar, dan partner setia mobilitas urban perkotaan.",
		},
		{
			Name:         "Scoopy 2023",
			Brand:        "Honda",
			Category:     "Retro Matic",
			EngineCC:     110,
			Year:         2023,
			Transmission: "Automatic",
			PricePerDay:  95000,
			PricePerHour: 5500,
			PlateNumber:  "B 4712 SCP",
			Status:       "available",
			ImageURL:     "/bikes/scoopy-2023.png",
			Features:     "2 Helm Bogo, Jas Hujan, Smart Key System, Desain Retro Modern, Bagasi Luas",
			Description:  "A perfect solution for urban traffic! Desain retro modern ikonik, super convenient and ergonomically designed untuk kenyamanan berkendara harian.",
		},
		{
			Name:         "Aerox 150s",
			Brand:        "Yamaha",
			Category:     "Sport Matic",
			EngineCC:     155,
			Year:         2023,
			Transmission: "Automatic",
			PricePerDay:  125000,
			PricePerHour: 6500,
			PlateNumber:  "B 6023 ARX",
			Status:       "available",
			ImageURL:     "/bikes/aerox-150s.png",
			Features:     "2 Helm SNI, Jas Hujan, Phone Holder, Desain Agresif Sporty, Rem ABS, Sub-tank Suspension",
			Description:  "Maximum sports performance in urban streets! Bertenaga, akselerasi agresif, dan handling tajam untuk Anda yang berjiwa dinamis dan penuh energi.",
		},
	}

	for _, b := range showcaseBikes {
		var existing models.Bike
		// Check by name or plate
		if err := db.Where("name = ?", b.Name).First(&existing).Error; err != nil {
			if err := db.Create(&b).Error; err != nil {
				log.Printf("Error creating %s: %v", b.Name, err)
			} else {
				log.Printf("Successfully created %s (ID: %d)", b.Name, b.ID)
			}
		} else {
			// Update details & image
			existing.Brand = b.Brand
			existing.Category = b.Category
			existing.EngineCC = b.EngineCC
			existing.Year = b.Year
			existing.PricePerDay = b.PricePerDay
			existing.PricePerHour = b.PricePerHour
			existing.ImageURL = b.ImageURL
			existing.Features = b.Features
			existing.Description = b.Description
			existing.Status = "available"
			if err := db.Save(&existing).Error; err != nil {
				log.Printf("Error updating %s: %v", existing.Name, err)
			} else {
				log.Printf("Successfully updated %s (ID: %d)", existing.Name, existing.ID)
			}
		}
	}

	log.Println("SHOWCASE_BIKES_SEEDED_SUCCESSFULLY")
}
