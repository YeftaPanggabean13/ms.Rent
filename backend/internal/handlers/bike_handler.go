package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/models"
)

func calculateAvailableStock(bike *models.Bike) {
	if bike.Status == "maintenance" || bike.Stock <= 0 {
		bike.AvailableStock = 0
		return
	}
	today := time.Now().Format("2006-01-02")
	var activeCount int64
	database.DB.Model(&models.Booking{}).
		Where("bike_id = ? AND booking_status IN ('confirmed', 'active') AND start_date <= ? AND end_date >= ?", bike.ID, today, today).
		Count(&activeCount)

	avail := bike.Stock - int(activeCount)
	if avail < 0 {
		avail = 0
	}
	bike.AvailableStock = avail
}

type BikeHandler struct{}

func NewBikeHandler() *BikeHandler {
	return &BikeHandler{}
}

// GetBikes mengambil daftar semua motor dengan filter opsional
func (h *BikeHandler) GetBikes(c *gin.Context) {
	var bikes []models.Bike
	query := database.DB.Model(&models.Bike{})

	if brand := c.Query("brand"); brand != "" {
		query = query.Where("brand = ?", brand)
	}
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR brand LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	if minPrice := c.Query("min_price"); minPrice != "" {
		query = query.Where("price_per_day >= ?", minPrice)
	}
	if maxPrice := c.Query("max_price"); maxPrice != "" {
		query = query.Where("price_per_day <= ?", maxPrice)
	}

	if err := query.Order("price_per_day ASC").Find(&bikes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data motor: " + err.Error()})
		return
	}

	for i := range bikes {
		calculateAvailableStock(&bikes[i])
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(bikes),
		"data":    bikes,
	})
}

// GetBikeByID mengambil detail motor spesifik berdasarkan ID
func (h *BikeHandler) GetBikeByID(c *gin.Context) {
	id := c.Param("id")
	var bike models.Bike

	if err := database.DB.First(&bike, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	calculateAvailableStock(&bike)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    bike,
	})
}

// CreateBike menambahkan motor baru ke armada
func (h *BikeHandler) CreateBike(c *gin.Context) {
	var input models.Bike
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	if input.Status == "" {
		input.Status = "available"
	}
	if input.Stock <= 0 {
		input.Stock = 1
	}

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data motor: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Unit motor berhasil ditambahkan",
		"data":    input,
	})
}

// UpdateBike memperbarui informasi unit motor
func (h *BikeHandler) UpdateBike(c *gin.Context) {
	id := c.Param("id")
	var bike models.Bike

	if err := database.DB.First(&bike, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	var input models.Bike
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	// Update field
	bike.Name = input.Name
	bike.Brand = input.Brand
	bike.Category = input.Category
	bike.EngineCC = input.EngineCC
	bike.Year = input.Year
	bike.Transmission = input.Transmission
	bike.PricePerDay = input.PricePerDay
	bike.PricePerHour = input.PricePerHour
	bike.PlateNumber = input.PlateNumber
	bike.Stock = input.Stock
	bike.Status = input.Status
	bike.ImageURL = input.ImageURL
	bike.Features = input.Features
	bike.Description = input.Description

	if err := database.DB.Save(&bike).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui unit motor: " + err.Error()})
		return
	}

	calculateAvailableStock(&bike)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Unit motor berhasil diperbarui",
		"data":    bike,
	})
}

// UpdateStock memperbarui ketersediaan / stok unit motor secara cepat
func (h *BikeHandler) UpdateStock(c *gin.Context) {
	id := c.Param("id")
	var bike models.Bike

	if err := database.DB.First(&bike, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	var input struct {
		Stock int `json:"stock"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	if input.Stock < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jumlah stok tidak boleh kurang dari 0"})
		return
	}

	bike.Stock = input.Stock
	if bike.Stock == 0 {
		bike.Status = "maintenance"
	} else if bike.Status == "maintenance" && bike.Stock > 0 {
		bike.Status = "available"
	}

	if err := database.DB.Save(&bike).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui stok: " + err.Error()})
		return
	}

	calculateAvailableStock(&bike)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Stok armada motor berhasil diperbarui",
		"data":    bike,
	})
}

// DeleteBike menghapus motor dari armada
func (h *BikeHandler) DeleteBike(c *gin.Context) {
	id := c.Param("id")
	var bike models.Bike

	if err := database.DB.First(&bike, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Motor tidak ditemukan"})
		return
	}

	if err := database.DB.Delete(&bike).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus unit motor: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Unit motor berhasil dihapus",
	})
}
