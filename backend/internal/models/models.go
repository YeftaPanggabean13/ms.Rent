package models

import (
	"time"
)

type Bike struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:100;not null" json:"name"`
	Brand        string    `gorm:"size:50;not null" json:"brand"`
	Category     string    `gorm:"size:50;not null" json:"category"`
	EngineCC     int       `json:"engine_cc"`
	Year         int       `json:"year"`
	Transmission string    `gorm:"size:30" json:"transmission"`
	PricePerDay  float64   `gorm:"not null" json:"price_per_day"`
	PricePerHour float64   `gorm:"default:0" json:"price_per_hour"`
	PlateNumber  string    `gorm:"size:30" json:"plate_number"`
	Status       string    `gorm:"size:30;default:'available'" json:"status"` // available, rented, maintenance
	ImageURL     string    `gorm:"size:255" json:"image_url"`
	Features     string    `gorm:"size:255" json:"features"` // comma separated e.g. "2 Helm SNI, Jas Hujan, Phone Holder"
	Description  string    `gorm:"type:text" json:"description"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ServiceCenter adalah titik bengkel/dealer resmi untuk peta layanan
type ServiceCenter struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:120;not null" json:"name"`
	Brand      string    `gorm:"size:50;not null;index" json:"brand"` // Honda, Yamaha, Vespa, Kawasaki
	Type       string    `gorm:"size:80" json:"type"`
	Address    string    `gorm:"size:255;not null" json:"address"`
	City       string    `gorm:"size:80;not null;index" json:"city"`
	Province   string    `gorm:"size:80" json:"province"`
	Phone      string    `gorm:"size:40" json:"phone"`
	Hours      string    `gorm:"size:120" json:"hours"`
	Latitude   float64   `gorm:"not null" json:"latitude"`
	Longitude  float64   `gorm:"not null" json:"longitude"`
	IsOfficial bool      `gorm:"default:true" json:"is_official"`
	CreatedAt  time.Time `json:"created_at"`
}

type Booking struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	BookingCode     string    `gorm:"size:50;uniqueIndex;not null" json:"booking_code"`
	BikeID          uint      `gorm:"not null" json:"bike_id"`
	Bike            *Bike     `gorm:"foreignKey:BikeID" json:"bike,omitempty"`
	CustomerName    string    `gorm:"size:100;not null" json:"customer_name"`
	CustomerPhone   string    `gorm:"size:30;not null" json:"customer_phone"`
	CustomerEmail   string    `gorm:"size:100" json:"customer_email"`
	CustomerIDCard  string    `gorm:"size:50" json:"customer_id_card"`
	StartDate       string    `gorm:"size:30;not null" json:"start_date"` // YYYY-MM-DD
	EndDate         string    `gorm:"size:30;not null" json:"end_date"`   // YYYY-MM-DD
	DurationDays    int       `gorm:"not null" json:"duration_days"`
	RentalType      string    `gorm:"size:10;default:'daily'" json:"rental_type"` // daily, hourly
	StartTime       string    `gorm:"size:5" json:"start_time"`                  // HH:MM (jam mulai harian & per jam)
	EndTime         string    `gorm:"size:5" json:"end_time"`                    // HH:MM, 00:00-24:00
	DurationHours   int       `gorm:"default:0" json:"duration_hours"`           // durasi total sewa per jam
	ExtendedHours   int       `gorm:"default:0" json:"extended_hours"`           // akumulasi jam hasil extend
	PendingExtendHours int    `gorm:"default:0" json:"pending_extend_hours"`
	PendingExtendCost  float64 `gorm:"default:0" json:"pending_extend_cost"`
	PendingExtendBy    string  `gorm:"size:20" json:"pending_extend_by"` // customer, admin
	PickupLocation  string    `gorm:"size:100" json:"pickup_location"`
	ReturnLocation  string    `gorm:"size:100" json:"return_location"`
	DeliveryAddress string    `gorm:"size:255" json:"delivery_address"`
	ExtraHelmets    int       `gorm:"default:0" json:"extra_helmets"`
	RaincoatCount   int       `gorm:"default:1" json:"raincoat_count"`
	PhoneHolder     bool      `gorm:"default:true" json:"phone_holder"`
	TotalPrice      float64   `gorm:"not null" json:"total_price"`
	PaymentStatus   string    `gorm:"size:30;default:'unpaid'" json:"payment_status"` // unpaid, paid, refunded
	BookingStatus   string    `gorm:"size:30;default:'pending'" json:"booking_status"` // pending, confirmed, active, completed, cancelled
	PaymentMethod   string    `gorm:"size:50;default:'Transfer Bank'" json:"payment_method"`
	Notes           string    `gorm:"type:text" json:"notes"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
