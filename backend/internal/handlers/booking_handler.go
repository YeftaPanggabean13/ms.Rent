package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/models"
)

type BookingHandler struct{}

func NewBookingHandler() *BookingHandler {
	return &BookingHandler{}
}

// GetCalendar mengembalikan tanggal-tanggal yang sudah terbooking pada bulan tertentu
func (h *BookingHandler) GetCalendar(c *gin.Context) {
	bikeID := c.Param("id")
	month := c.Query("month") // format YYYY-MM

	if month == "" {
		month = time.Now().Format("2006-01")
	}

	// Parse awal dan akhir bulan
	startOfMonth, err := time.Parse("2006-01", month)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid (gunakan YYYY-MM)"})
		return
	}
	endOfMonth := startOfMonth.AddDate(0, 1, -1)

	// Ambil semua booking yang overlap dengan bulan ini
	var bookings []models.Booking
	database.DB.Where(
		"bike_id = ? AND booking_status IN ('pending', 'confirmed', 'active') AND start_date <= ? AND end_date >= ?",
		bikeID, endOfMonth.Format("2006-01-02"), startOfMonth.Format("2006-01-02"),
	).Find(&bookings)

	// Bangun map tanggal yang terbooked
	bookedDates := map[string]string{} // date -> status
	for _, b := range bookings {
		start, e1 := time.Parse("2006-01-02", b.StartDate)
		end, e2 := time.Parse("2006-01-02", b.EndDate)
		if e1 != nil || e2 != nil {
			continue
		}
		for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
			dateStr := d.Format("2006-01-02")
			bookedDates[dateStr] = b.BookingStatus
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"bike_id":      bikeID,
		"month":        month,
		"booked_dates": bookedDates,
	})
}

// CheckAvailability memeriksa apakah motor tertentu tersedia pada rentang tanggal tertentu
func (h *BookingHandler) CheckAvailability(c *gin.Context) {
	bikeID := c.Param("id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter 'start_date' dan 'end_date' (YYYY-MM-DD) wajib diisi"})
		return
	}

	var overlappingCount int64
	// Periksa overlap booking yang masih aktif/confirmed
	database.DB.Model(&models.Booking{}).
		Where("bike_id = ? AND booking_status IN ('pending', 'confirmed', 'active')", bikeID).
		Where("(start_date <= ? AND end_date >= ?)", endDate, startDate).
		Count(&overlappingCount)

	isAvailable := overlappingCount == 0

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"bike_id":      bikeID,
		"start_date":   startDate,
		"end_date":     endDate,
		"is_available": isAvailable,
		"message": func() string {
			if isAvailable {
				return "Motor tersedia untuk jadwal yang dipilih"
			}
			return "Motor sudah dibooking pada rentang tanggal tersebut"
		}(),
	})
}

// CreateBooking membuat transaksi sewa baru
func (h *BookingHandler) CreateBooking(c *gin.Context) {
	var input models.Booking
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data permohonan booking tidak valid: " + err.Error()})
		return
	}

	if input.BikeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BikeID wajib dipilih"})
		return
	}
	if input.CustomerName == "" || input.CustomerPhone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama pemesan dan No. WhatsApp wajib diisi"})
		return
	}
	if input.StartDate == "" || input.EndDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal mulai dan selesai sewa wajib diisi"})
		return
	}

	// Cek eksistensi motor
	var bike models.Bike
	if err := database.DB.First(&bike, input.BikeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	// Cek overlap booking
	var overlappingCount int64
	database.DB.Model(&models.Booking{}).
		Where("bike_id = ? AND booking_status IN ('confirmed', 'active')", input.BikeID).
		Where("(start_date <= ? AND end_date >= ?)", input.EndDate, input.StartDate).
		Count(&overlappingCount)

	if overlappingCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Motor ini sudah dipesan orang lain pada rentang tanggal yang dipilih"})
		return
	}

	// Generate kode booking unik
	bytes := make([]byte, 3)
	rand.Read(bytes)
	randomSuffix := strings.ToUpper(hex.EncodeToString(bytes))
	todayStr := time.Now().Format("20060102")
	input.BookingCode = fmt.Sprintf("MSR-%s-%s", todayStr, randomSuffix)

	// Hitung durasi jika belum ada
	if input.DurationDays <= 0 {
		start, err1 := time.Parse("2006-01-02", input.StartDate)
		end, err2 := time.Parse("2006-01-02", input.EndDate)
		if err1 == nil && err2 == nil {
			days := int(end.Sub(start).Hours()/24) + 1
			if days < 1 {
				days = 1
			}
			input.DurationDays = days
		} else {
			input.DurationDays = 1
		}
	}

	// Hitung total harga jika belum dihitung frontend
	if input.TotalPrice <= 0 {
		basePrice := bike.PricePerDay * float64(input.DurationDays)
		extraHelmetCost := float64(input.ExtraHelmets) * 15000 * float64(input.DurationDays)
		deliveryCost := 0.0
		if input.DeliveryAddress != "" {
			deliveryCost = 35000 // biaya antar jemput
		}
		input.TotalPrice = basePrice + extraHelmetCost + deliveryCost
	}

	if input.PaymentStatus == "" {
		input.PaymentStatus = "unpaid"
	}
	if input.BookingStatus == "" {
		input.BookingStatus = "pending"
	}

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan booking: " + err.Error()})
		return
	}

	// Preload relasi bike untuk respon
	database.DB.Preload("Bike").First(&input, input.ID)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Booking berhasil dibuat! Silakan lakukan konfirmasi pembayaran.",
		"data":    input,
	})
}

// GetBookings mengambil daftar seluruh pesanan
func (h *BookingHandler) GetBookings(c *gin.Context) {
	var bookings []models.Booking
	query := database.DB.Preload("Bike").Model(&models.Booking{})

	if status := c.Query("status"); status != "" {
		query = query.Where("booking_status = ?", status)
	}
	if phone := c.Query("phone"); phone != "" {
		query = query.Where("customer_phone = ?", phone)
	}
	if code := c.Query("code"); code != "" {
		query = query.Where("booking_code = ?", code)
	}

	if err := query.Order("id DESC").Find(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data booking: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(bookings),
		"data":    bookings,
	})
}

// GetBookingByCode mencari pesanan berdasarkan kode booking
func (h *BookingHandler) GetBookingByCode(c *gin.Context) {
	code := c.Param("code")
	var booking models.Booking

	if err := database.DB.Preload("Bike").Where("booking_code = ?", code).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kode booking tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    booking,
	})
}

// UpdateBookingStatus memperbarui status booking dan pembayaran
func (h *BookingHandler) UpdateBookingStatus(c *gin.Context) {
	id := c.Param("id")
	var booking models.Booking

	if err := database.DB.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data booking tidak ditemukan"})
		return
	}

	var req struct {
		PaymentStatus string `json:"payment_status"`
		BookingStatus string `json:"booking_status"`
		Notes         string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format payload tidak valid"})
		return
	}

	if req.PaymentStatus != "" {
		booking.PaymentStatus = req.PaymentStatus
	}
	if req.BookingStatus != "" {
		booking.BookingStatus = req.BookingStatus
	}
	if req.Notes != "" {
		booking.Notes = req.Notes
	}

	if err := database.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status: " + err.Error()})
		return
	}

	// Update status motor jika status booking berubah
	if req.BookingStatus == "active" {
		database.DB.Model(&models.Bike{}).Where("id = ?", booking.BikeID).Update("status", "rented")
	} else if req.BookingStatus == "completed" || req.BookingStatus == "cancelled" {
		database.DB.Model(&models.Bike{}).Where("id = ?", booking.BikeID).Update("status", "available")
	}

	database.DB.Preload("Bike").First(&booking, booking.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status booking berhasil diperbarui",
		"data":    booking,
	})
}
