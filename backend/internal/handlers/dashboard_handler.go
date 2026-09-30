package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/models"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

// GetDashboardStats mengembalikan ringkasan metrik rental motor untuk panel admin
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	var totalBikes int64
	var activeBookings int64
	var pendingBookings int64
	var totalBookings int64
	var maintenanceBikes int64

	database.DB.Model(&models.Bike{}).Select("COALESCE(SUM(stock), 0)").Scan(&totalBikes)
	database.DB.Model(&models.Bike{}).Where("status = ?", "maintenance").Count(&maintenanceBikes)

	database.DB.Model(&models.Booking{}).Count(&totalBookings)
	database.DB.Model(&models.Booking{}).Where("booking_status = ?", "active").Count(&activeBookings)
	database.DB.Model(&models.Booking{}).Where("booking_status = ?", "pending").Count(&pendingBookings)

	var currentlyRented int64
	database.DB.Model(&models.Booking{}).Where("booking_status IN ('confirmed', 'active')").Count(&currentlyRented)
	availableBikes := totalBikes - currentlyRented
	if availableBikes < 0 {
		availableBikes = 0
	}
	rentedBikes := currentlyRented

	var totalRevenue float64
	database.DB.Model(&models.Booking{}).
		Where("payment_status = ?", "paid").
		Select("COALESCE(SUM(total_price), 0)").
		Scan(&totalRevenue)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"total_bikes":        totalBikes,
			"available_bikes":    availableBikes,
			"rented_bikes":       rentedBikes,
			"maintenance_bikes":  maintenanceBikes,
			"total_bookings":     totalBookings,
			"active_bookings":    activeBookings,
			"pending_bookings":   pendingBookings,
			"total_revenue":      totalRevenue,
		},
	})
}
