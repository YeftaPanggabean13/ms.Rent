package handlers

import (
	"math"
	"net/http"
	"sort"
	"strconv"

	"github.com/gin-gonic/gin"
	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/models"
)

type ServiceCenterHandler struct{}

func NewServiceCenterHandler() *ServiceCenterHandler {
	return &ServiceCenterHandler{}
}

// serviceCenterResponse adalah service center + jarak opsional dari lokasi pengguna
type serviceCenterResponse struct {
	models.ServiceCenter
	DistanceKm *float64 `json:"distance_km,omitempty"`
}

// haversine menghitung jarak antar dua koordinat dalam kilometer
func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadiusKm = 6371.0
	toRad := func(deg float64) float64 { return deg * math.Pi / 180 }

	dLat := toRad(lat2 - lat1)
	dLng := toRad(lng2 - lng1)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(toRad(lat1))*math.Cos(toRad(lat2))*math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadiusKm * c
}

// GetServiceCenters mengambil daftar service center resmi
// Query opsional: brand, city, search, lat, lng (untuk urutkan jarak terdekat)
func (h *ServiceCenterHandler) GetServiceCenters(c *gin.Context) {
	var centers []models.ServiceCenter
	query := database.DB.Model(&models.ServiceCenter{})

	if brand := c.Query("brand"); brand != "" {
		query = query.Where("brand = ?", brand)
	}
	if city := c.Query("city"); city != "" {
		query = query.Where("city LIKE ?", "%"+city+"%")
	}
	if search := c.Query("search"); search != "" {
		query = query.Where("name LIKE ? OR address LIKE ? OR city LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	if err := query.Find(&centers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data service center: " + err.Error()})
		return
	}

	lat, latErr := strconv.ParseFloat(c.Query("lat"), 64)
	lng, lngErr := strconv.ParseFloat(c.Query("lng"), 64)
	hasLocation := latErr == nil && lngErr == nil &&
		c.Query("lat") != "" && c.Query("lng") != ""

	if hasLocation {
		responses := make([]serviceCenterResponse, 0, len(centers))
		for _, center := range centers {
			dist := haversine(lat, lng, center.Latitude, center.Longitude)
			dist = math.Round(dist*100) / 100
			responses = append(responses, serviceCenterResponse{
				ServiceCenter: center,
				DistanceKm:    &dist,
			})
		}
		sort.Slice(responses, func(i, j int) bool {
			return *responses[i].DistanceKm < *responses[j].DistanceKm
		})
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"count":   len(responses),
			"data":    responses,
		})
		return
	}

	// Tanpa lokasi pengguna: urutkan berdasarkan brand lalu kota
	sort.Slice(centers, func(i, j int) bool {
		if centers[i].Brand != centers[j].Brand {
			return centers[i].Brand < centers[j].Brand
		}
		return centers[i].City < centers[j].City
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"count":   len(centers),
		"data":    centers,
	})
}

// GetServiceCenterByID mengambil detail satu service center
func (h *ServiceCenterHandler) GetServiceCenterByID(c *gin.Context) {
	id := c.Param("id")
	var center models.ServiceCenter

	if err := database.DB.First(&center, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service center tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    center,
	})
}
