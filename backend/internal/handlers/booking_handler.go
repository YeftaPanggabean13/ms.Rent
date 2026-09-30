package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"sort"
	"strconv"
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

	var bike models.Bike
	if err := database.DB.Select("id, stock, status").First(&bike, bikeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	// Ambil semua booking yang overlap dengan bulan ini
	var bookings []models.Booking
	database.DB.Where(
		"bike_id = ? AND booking_status IN ('pending', 'confirmed', 'active') AND start_date <= ? AND end_date >= ?",
		bikeID, endOfMonth.Format("2006-01-02"), startOfMonth.Format("2006-01-02"),
	).Find(&bookings)

	// Hitung akumulasi booking per tanggal
	dateCount := map[string]int{}
	dateStatus := map[string]string{}
	for _, b := range bookings {
		start, e1 := time.Parse("2006-01-02", b.StartDate)
		end, e2 := time.Parse("2006-01-02", b.EndDate)
		if e1 != nil || e2 != nil {
			continue
		}
		for d := start; !d.After(end); d = d.AddDate(0, 0, 1) {
			dateStr := d.Format("2006-01-02")
			dateCount[dateStr]++
			dateStatus[dateStr] = b.BookingStatus
		}
	}

	// Tanggal dianggap penuh hanya jika jumlah booking >= kapasitas stok motor (atau stok = 0)
	bookedDates := map[string]string{}
	for dateStr, count := range dateCount {
		if count >= bike.Stock || bike.Stock == 0 {
			bookedDates[dateStr] = dateStatus[dateStr]
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"bike_id":      bikeID,
		"stock":        bike.Stock,
		"month":        month,
		"booked_dates": bookedDates,
	})
}

// GetBikeHours mengembalikan jam-jam terpakai (beserta statusnya) milik 1 unit pada
// tanggal tertentu, agar user bisa melihat jam yang masih kosong.
func (h *BookingHandler) GetBikeHours(c *gin.Context) {
	bikeID := c.Param("id")
	dateStr := c.Query("date")
	if dateStr == "" {
		dateStr = time.Now().Format("2006-01-02")
	}
	day, err := time.ParseInLocation("2006-01-02", dateStr, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid (YYYY-MM-DD)"})
		return
	}

	dayStart := time.Date(day.Year(), day.Month(), day.Day(), 0, 0, 0, 0, time.Local)
	dayEnd := dayStart.Add(24 * time.Hour)

	var bookings []models.Booking
	database.DB.
		Where("bike_id = ? AND booking_status IN ('pending', 'confirmed', 'active') AND start_date <= ? AND end_date >= ?",
			bikeID, dayEnd.Format("2006-01-02"), dayStart.Format("2006-01-02")).
		Order("start_date ASC, start_time ASC").
		Find(&bookings)

	var bike models.Bike
	if err := database.DB.Select("id, stock, status").First(&bike, bikeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	statusLabels := map[string]string{
		"pending":   "Menunggu Konfirmasi",
		"confirmed": "Siap Jalan",
		"active":    "Sedang Berjalan",
	}

	type hourInterval struct {
		Start       string `json:"start"`
		End         string `json:"end"`
		Status      string `json:"status"`
		StatusLabel string `json:"status_label"`
	}
	intervals := make([]hourInterval, 0, len(bookings))

	if bike.Stock > 1 {
		// Interval waktu hanya diblokir bila jumlah pemakaian bersamaan mencapai kapasitas total stok
		type event struct {
			t     time.Time
			delta int
		}
		var events []event
		for i := range bookings {
			b := &bookings[i]
			start, end := b.IntervalStart(), b.IntervalEnd()
			if start.IsZero() || end.IsZero() {
				continue
			}
			if start.Before(dayStart) {
				start = dayStart
			}
			if end.After(dayEnd) {
				end = dayEnd
			}
			if !end.After(start) {
				continue
			}
			events = append(events, event{t: start, delta: 1})
			events = append(events, event{t: end, delta: -1})
		}
		sort.SliceStable(events, func(i, j int) bool {
			if events[i].t.Equal(events[j].t) {
				return events[i].delta < events[j].delta
			}
			return events[i].t.Before(events[j].t)
		})
		concurrent := 0
		var blockStart time.Time
		for _, ev := range events {
			prev := concurrent
			concurrent += ev.delta
			if prev < bike.Stock && concurrent >= bike.Stock {
				blockStart = ev.t
			} else if prev >= bike.Stock && concurrent < bike.Stock {
				if !blockStart.IsZero() && ev.t.After(blockStart) {
					endLabel := "24:00"
					if ev.t.Before(dayEnd) {
						endLabel = ev.t.Format("15:04")
					}
					intervals = append(intervals, hourInterval{
						Start:       blockStart.Format("15:04"),
						End:         endLabel,
						Status:      "confirmed",
						StatusLabel: "Semua Unit Terpakai",
					})
				}
				blockStart = time.Time{}
			}
		}
	} else {
		for i := range bookings {
			b := &bookings[i]
			start, end := b.IntervalStart(), b.IntervalEnd()
			if start.IsZero() || end.IsZero() {
				continue
			}
			if start.Before(dayStart) {
				start = dayStart
			}
			if end.After(dayEnd) {
				end = dayEnd
			}
			if !end.After(start) {
				continue
			}
			endLabel := "24:00"
			if end.Before(dayEnd) {
				endLabel = end.Format("15:04")
			}
			label, ok := statusLabels[b.BookingStatus]
			if !ok {
				label = b.BookingStatus
			}
			intervals = append(intervals, hourInterval{
				Start:       start.Format("15:04"),
				End:         endLabel,
				Status:      b.BookingStatus,
				StatusLabel: label,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success":   true,
		"bike_id":   bikeID,
		"date":      dateStr,
		"intervals": intervals,
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

	var bike models.Bike
	if err := database.DB.Select("id, stock, status").First(&bike, bikeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	mockBooking := models.Booking{
		BikeID:     bike.ID,
		StartDate:  startDate,
		EndDate:    endDate,
		RentalType: "daily",
		StartTime:  "08:00",
		EndTime:    "08:00",
	}

	conflict := hasConflict(bike.ID, &mockBooking, 0)
	isAvailable := !conflict && bike.Status != "maintenance" && bike.Stock > 0

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"bike_id":      bikeID,
		"stock":        bike.Stock,
		"start_date":   startDate,
		"end_date":     endDate,
		"is_available": isAvailable,
		"message": func() string {
			if isAvailable {
				return "Motor tersedia untuk jadwal yang dipilih"
			}
			return "Stok unit motor ini sudah penuh dipesan pada rentang tanggal tersebut"
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
	if input.RentalType == "" {
		input.RentalType = "daily"
	}
	if input.RentalType != "daily" && input.RentalType != "hourly" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tipe sewa tidak dikenal (harian atau per jam)"})
		return
	}

	// Cek eksistensi motor
	var bike models.Bike
	if err := database.DB.First(&bike, input.BikeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	if input.RentalType == "hourly" {
		if input.StartTime == "" || input.EndTime == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai dan jam selesai sewa wajib diisi"})
			return
		}
		startParts := strings.Split(input.StartTime, ":")
		endParts := strings.Split(input.EndTime, ":")
		if len(startParts) != 2 || len(endParts) != 2 || startParts[1] != "00" || endParts[1] != "00" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sewa per jam hanya bisa dipilih per jam penuh (misal 08:00 - 17:00)"})
			return
		}
		if bike.PricePerHour <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Unit ini belum mengaktifkan sewa per jam"})
			return
		}
		durMin := input.DurationMinutes()
		if durMin <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Waktu selesai sewa harus setelah waktu mulai"})
			return
		}
		if durMin < 2*60 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Durasi sewa per jam minimal 2 jam"})
			return
		}
		if durMin > 23*60 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Durasi sewa per jam maksimal 23 jam (untuk 24 jam ke atas gunakan sewa harian)"})
			return
		}
		input.DurationHours = durMin / 60
		input.DurationDays = 0
	} else {
		// Sewa harian dihitung N x 24 jam sejak jam mulai (jam serah terima unit)
		if input.StartTime == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai sewa wajib diisi (sewa harian dihitung 24 jam dari jam mulai)"})
			return
		}
		dailyParts := strings.Split(input.StartTime, ":")
		if len(dailyParts) != 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai sewa tidak valid"})
			return
		}
		dh, errH := strconv.Atoi(dailyParts[0])
		dm, errM := strconv.Atoi(dailyParts[1])
		if errH != nil || errM != nil || dh < 0 || dh > 23 || dm < 0 || dm > 59 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai sewa tidak valid"})
			return
		}
		input.EndTime = input.StartTime
		input.DurationHours = 0
	}

	// Jadwal sewa tidak boleh berada di masa lalu (waktu yang sudah berlalu)
	now := time.Now()
	parsedStart, err := time.ParseInLocation("2006-01-02", input.StartDate, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal mulai sewa tidak valid"})
		return
	}
	parsedEnd, err := time.ParseInLocation("2006-01-02", input.EndDate, time.Local)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal selesai sewa tidak valid"})
		return
	}
	if parsedEnd.Before(parsedStart) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal selesai sewa tidak boleh sebelum tanggal mulai"})
		return
	}
	// Jam mulai (harian maupun per jam) tidak boleh sudah berlalu
	mulaiParts := strings.Split(input.StartTime, ":")
	if len(mulaiParts) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai sewa tidak valid"})
		return
	}
	hour, convErr := strconv.Atoi(mulaiParts[0])
	minute, minErr := strconv.Atoi(mulaiParts[1])
	if convErr != nil || minErr != nil || hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai sewa tidak valid"})
		return
	}
	startAt := time.Date(parsedStart.Year(), parsedStart.Month(), parsedStart.Day(), hour, minute, 0, 0, time.Local)
	if !startAt.After(now) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jam mulai sewa sudah berlalu. Silakan pilih jadwal sewa yang masih belum berlalu."})
		return
	}

	// Cek overlap booking (interval presisi: harian = setengah hari, per jam = jam persis)
	if hasConflict(input.BikeID, &input, 0) {
		c.JSON(http.StatusConflict, gin.H{"error": "Motor ini sudah dipesan orang lain pada rentang jadwal yang dipilih"})
		return
	}

	// Generate kode booking unik
	bytes := make([]byte, 3)
	rand.Read(bytes)
	randomSuffix := strings.ToUpper(hex.EncodeToString(bytes))
	todayStr := time.Now().Format("20060102")
	input.BookingCode = fmt.Sprintf("MSR-%s-%s", todayStr, randomSuffix)

	// Sewa harian: durasi = N x 24 jam dari jam mulai (tanggal selesai = tanggal kembali)
	if input.RentalType == "daily" {
		days := int(parsedEnd.Sub(parsedStart).Hours() / 24)
		if days < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Sewa harian minimal 1 hari (24 jam penuh dari jam mulai). Tanggal selesai harus setelah tanggal mulai."})
			return
		}
		input.DurationDays = days
	}

	// Hitung total harga di sisi server (sumber kebenaran tunggal)
	basePrice := bike.PricePerDay * float64(input.DurationDays)
	rentalDays := float64(input.DurationDays) // biaya helm dihitung per hari
	if input.RentalType == "hourly" {
		basePrice = bike.PricePerHour * float64(input.DurationHours)
		rentalDays = 1 // sewa < 24 jam dihitung 1 hari untuk biaya helm
	}
	extraHelmetCost := float64(input.ExtraHelmets) * 15000 * rentalDays
	deliveryCost := 0.0
	if input.DeliveryAddress != "" {
		deliveryCost = 35000 // biaya antar jemput
	}
	input.TotalPrice = basePrice + extraHelmetCost + deliveryCost

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
	var activeForBike int64
	database.DB.Model(&models.Booking{}).Where("bike_id = ? AND booking_status = 'active'", booking.BikeID).Count(&activeForBike)
	var currentBike models.Bike
	if err := database.DB.Select("id, stock").First(&currentBike, booking.BikeID).Error; err == nil {
		if activeForBike >= int64(currentBike.Stock) && currentBike.Stock > 0 {
			database.DB.Model(&models.Bike{}).Where("id = ?", booking.BikeID).Update("status", "rented")
		} else {
			database.DB.Model(&models.Bike{}).Where("id = ? AND status != 'maintenance'", booking.BikeID).Update("status", "available")
		}
	}

	database.DB.Preload("Bike").First(&booking, booking.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status booking berhasil diperbarui",
		"data":    booking,
	})
}

// hasConflict memeriksa apakah ada booking lain (pending/confirmed/active) pada motor
// yang sama dan jumlah booking yang menimpa pada suatu titik waktu melebihi atau sama dengan kapasitas stok motor.
func hasConflict(bikeID uint, b *models.Booking, excludeID uint) bool {
	var bike models.Bike
	if err := database.DB.Select("id, stock, status").First(&bike, bikeID).Error; err != nil {
		return true
	}
	if bike.Status == "maintenance" || bike.Stock <= 0 {
		return true
	}

	bStart := b.IntervalStart()
	bEnd := b.IntervalEnd()
	if bStart.IsZero() || bEnd.IsZero() {
		return false
	}

	var candidates []models.Booking
	database.DB.
		Where("bike_id = ? AND booking_status IN ('pending', 'confirmed', 'active')", bikeID).
		Where("start_date <= ? AND end_date >= ?", b.EndDate, b.StartDate).
		Find(&candidates)

	type event struct {
		t     time.Time
		delta int
	}
	var events []event

	for i := range candidates {
		if candidates[i].ID == excludeID {
			continue
		}
		if !models.Overlaps(&candidates[i], b) {
			continue
		}
		cStart := candidates[i].IntervalStart()
		cEnd := candidates[i].IntervalEnd()
		if cStart.IsZero() || cEnd.IsZero() {
			continue
		}
		if cStart.Before(bStart) {
			cStart = bStart
		}
		if cEnd.After(bEnd) {
			cEnd = bEnd
		}
		if !cEnd.After(cStart) {
			continue
		}
		events = append(events, event{t: cStart, delta: 1})
		events = append(events, event{t: cEnd, delta: -1})
	}

	if len(events) == 0 {
		return false
	}

	sort.SliceStable(events, func(i, j int) bool {
		if events[i].t.Equal(events[j].t) {
			return events[i].delta < events[j].delta // -1 before +1 (unit released before next pickup)
		}
		return events[i].t.Before(events[j].t)
	})

	concurrent := 0
	for _, ev := range events {
		concurrent += ev.delta
		if concurrent >= bike.Stock {
			return true
		}
	}
	return false
}

// canExtend memeriksa apakah status booking memperbolehkan perpanjaman.
func canExtend(b *models.Booking) bool {
	return b.BookingStatus == "confirmed" || b.BookingStatus == "active"
}

// extendCutoff: perpanjangan hanya boleh dilakukan minimal 30 menit sebelum masa sewa habis.
const extendCutoff = 30 * time.Minute

// checkExtendWindow mengembalikan pesan error bila perpanjangan sudah melewati jendela
// yang diizinkan (kosong = masih boleh). Berlaku untuk ajukan, terapkan, dan setujui extend.
func checkExtendWindow(b *models.Booking, now time.Time) string {
	end := b.IntervalEnd()
	if end.IsZero() {
		return "Jadwal selesai sewa tidak valid, hubungi garasi"
	}
	if now.Before(end.Add(-extendCutoff)) {
		return ""
	}
	if now.Before(end) {
		return "Perpanjangan hanya bisa dilakukan minimal 30 menit sebelum masa sewa habis (sisa waktu kurang dari 30 menit)"
	}
	return "Masa sewa sudah berakhir, perpanjangan tidak lagi tersedia"
}

func normalizePhone(s string) string {
	var digits strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	p := digits.String()
	if strings.HasPrefix(p, "0") && len(p) > 1 {
		p = "62" + p[1:]
	}
	return p
}

func formatIDR(v float64) string {
	s := strconv.FormatFloat(v, 'f', 0, 64)
	neg := strings.HasPrefix(s, "-")
	if neg {
		s = s[1:]
	}
	var out strings.Builder
	for i, r := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			out.WriteRune('.')
		}
		out.WriteRune(r)
	}
	if neg {
		return "-" + out.String()
	}
	return out.String()
}

// applyExtension menerapkan perpanjaman sewa ke booking (mutasi in-memory, belum disimpan).
func applyExtension(b *models.Booking, hours int, by string) float64 {
	cost := b.Bike.PricePerHour * float64(hours)
	b.AddHours(hours)
	b.ExtendedHours += hours
	b.TotalPrice += cost
	if b.PaymentStatus == "paid" {
		b.PaymentStatus = "unpaid"
	}
	entry := fmt.Sprintf("[Extend] +%d jam oleh %s (Rp%s) - jadwal kembali %s %s",
		hours, by, formatIDR(cost), b.EndDate, b.EndTime)
	if b.Notes == "" {
		b.Notes = entry
	} else {
		b.Notes += "\n" + entry
	}
	b.PendingExtendHours = 0
	b.PendingExtendCost = 0
	b.PendingExtendBy = ""
	return cost
}

// RequestExtend (publik): pelanggan mengajukan perpanjaman via kode booking + no. WhatsApp.
// Perpanjaman baru diterapkan setelah admin menyetujui (ExtendDecision).
func (h *BookingHandler) RequestExtend(c *gin.Context) {
	var req struct {
		BookingCode   string `json:"booking_code"`
		CustomerPhone string `json:"customer_phone"`
		Hours         int    `json:"hours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format payload tidak valid"})
		return
	}
	if req.BookingCode == "" || req.CustomerPhone == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode booking dan No. WhatsApp wajib diisi"})
		return
	}
	if req.Hours < 1 || req.Hours > 23 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Durasi perpanjaman minimal 1 jam dan maksimal 23 jam"})
		return
	}

	var booking models.Booking
	if err := database.DB.Preload("Bike").
		Where("booking_code = ?", strings.ToUpper(req.BookingCode)).
		First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kode booking tidak ditemukan"})
		return
	}

	if normalizePhone(req.CustomerPhone) != normalizePhone(booking.CustomerPhone) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Nomor WhatsApp tidak sesuai dengan data pemesan"})
		return
	}
	if !canExtend(&booking) {
		c.JSON(http.StatusConflict, gin.H{"error": "Hanya reservasi berstatus Siap Jalan atau Aktif yang bisa diperpanjang"})
		return
	}
	if msg := checkExtendWindow(&booking, time.Now()); msg != "" {
		c.JSON(http.StatusConflict, gin.H{"error": msg})
		return
	}
	if booking.PendingExtendHours > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Masih ada permintaan perpanjaman yang menunggu persetujuan garasi"})
		return
	}
	if booking.Bike == nil || booking.Bike.PricePerHour <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tarif per jam unit ini belum diatur, hubungi garasi untuk perpanjaman"})
		return
	}

	// Uji coba interval baru apakah bentrok dengan reservasi lain
	extended := booking
	extended.AddHours(req.Hours)
	if hasConflict(booking.BikeID, &extended, booking.ID) {
		c.JSON(http.StatusConflict, gin.H{"error": "Jadwal perpanjaman bentrok dengan reservasi lain pada unit ini"})
		return
	}

	booking.PendingExtendHours = req.Hours
	booking.PendingExtendCost = booking.Bike.PricePerHour * float64(req.Hours)
	booking.PendingExtendBy = "customer"

	if err := database.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengajukan perpanjaman: " + err.Error()})
		return
	}

	database.DB.Preload("Bike").First(&booking, booking.ID)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Permintaan perpanjaman +%d jam (Rp%s) terkirim. Menunggu persetujuan garasi.", req.Hours, formatIDR(booking.PendingExtendCost)),
		"data":    booking,
	})
}

// AdminExtend (admin): memperpanjang reservasi langsung tanpa menunggu persetujuan.
func (h *BookingHandler) AdminExtend(c *gin.Context) {
	booking, ok := h.loadExtendable(c)
	if !ok {
		return
	}

	var req struct {
		Hours int `json:"hours"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Hours < 1 || req.Hours > 23 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Durasi perpanjaman harus antara 1 sampai 23 jam"})
		return
	}
	if booking.Bike == nil || booking.Bike.PricePerHour <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tarif per jam unit ini belum diatur"})
		return
	}
	if msg := checkExtendWindow(booking, time.Now()); msg != "" {
		c.JSON(http.StatusConflict, gin.H{"error": msg})
		return
	}

	extended := *booking
	extended.AddHours(req.Hours)
	if hasConflict(booking.BikeID, &extended, booking.ID) {
		c.JSON(http.StatusConflict, gin.H{"error": "Jadwal perpanjaman bentrok dengan reservasi lain pada unit ini"})
		return
	}

	cost := applyExtension(booking, req.Hours, "admin")
	if err := database.DB.Save(booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menerapkan perpanjaman: " + err.Error()})
		return
	}

	database.DB.Preload("Bike").First(booking, booking.ID)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Reservasi diperpanjang +%d jam, tagihan bertambah Rp%s", req.Hours, formatIDR(cost)),
		"data":    booking,
	})
}

// ExtendDecision (admin): menyetujui atau menolak permintaan perpanjaman pelanggan.
func (h *BookingHandler) ExtendDecision(c *gin.Context) {
	booking, ok := h.loadExtendable(c)
	if !ok {
		return
	}

	var req struct {
		Approve *bool `json:"approve"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || req.Approve == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Field 'approve' (true/false) wajib diisi"})
		return
	}
	if booking.PendingExtendHours <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada permintaan perpanjaman pada reservasi ini"})
		return
	}

	if !*req.Approve {
		booking.PendingExtendHours = 0
		booking.PendingExtendCost = 0
		booking.PendingExtendBy = ""
		if err := database.DB.Save(booking).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui reservasi: " + err.Error()})
			return
		}
		database.DB.Preload("Bike").First(booking, booking.ID)
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "Permintaan perpanjaman ditolak",
			"data":    booking,
		})
		return
	}

	hours := booking.PendingExtendHours

	// Persetujuan juga wajib masih di dalam jendela 30 menit sebelum masa sewa habis
	if msg := checkExtendWindow(booking, time.Now()); msg != "" {
		c.JSON(http.StatusConflict, gin.H{"error": msg + " — permintaan perpanjaman tidak dapat disetujui"})
		return
	}

	extended := *booking
	extended.AddHours(hours)
	if hasConflict(booking.BikeID, &extended, booking.ID) {
		c.JSON(http.StatusConflict, gin.H{"error": "Jadwal perpanjaman bentrok dengan reservasi lain, persetujuan dibatalkan"})
		return
	}

	cost := applyExtension(booking, hours, "disetujui admin")
	if err := database.DB.Save(booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menerapkan perpanjaman: " + err.Error()})
		return
	}

	database.DB.Preload("Bike").First(booking, booking.ID)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Perpanjaman +%d jam disetujui, tagihan bertambah Rp%s", hours, formatIDR(cost)),
		"data":    booking,
	})
}

// loadExtendable memuat booking by id dan memvalidasi kelayakan perpanjaman.
func (h *BookingHandler) loadExtendable(c *gin.Context) (*models.Booking, bool) {
	booking := &models.Booking{}
	if err := database.DB.Preload("Bike").First(booking, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data booking tidak ditemukan"})
		return nil, false
	}
	if !canExtend(booking) {
		c.JSON(http.StatusConflict, gin.H{"error": "Hanya reservasi berstatus Siap Jalan atau Aktif yang bisa diperpanjang"})
		return nil, false
	}
	return booking, true
}
