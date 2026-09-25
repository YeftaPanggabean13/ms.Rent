package routes

import (
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"ms_rent_backend/internal/handlers"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	clientURL := os.Getenv("CLIENT_URL")
	if clientURL == "" {
		clientURL = "http://localhost:3000"
	}

	// Setup CORS agar Next.js di port 3000 bisa berkomunikasi tanpa kendala
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", clientURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// Inisialisasi Handlers
	bikeHandler := handlers.NewBikeHandler()
	bookingHandler := handlers.NewBookingHandler()
	dashboardHandler := handlers.NewDashboardHandler()

	// API Group
	api := r.Group("/api")
	{
		// Health check
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "healthy",
				"service": "ms.Rent API",
				"time":    time.Now().Format(time.RFC3339),
			})
		})

		// Bike routes
		bikes := api.Group("/bikes")
		{
			bikes.GET("", bikeHandler.GetBikes)
			bikes.GET("/:id", bikeHandler.GetBikeByID)
			bikes.GET("/:id/availability", bookingHandler.CheckAvailability)
			bikes.POST("", bikeHandler.CreateBike)
			bikes.PUT("/:id", bikeHandler.UpdateBike)
			bikes.DELETE("/:id", bikeHandler.DeleteBike)
		}

		// Booking routes
		bookings := api.Group("/bookings")
		{
			bookings.GET("", bookingHandler.GetBookings)
			bookings.GET("/code/:code", bookingHandler.GetBookingByCode)
			bookings.POST("", bookingHandler.CreateBooking)
			bookings.PATCH("/:id/status", bookingHandler.UpdateBookingStatus)
		}

		// Dashboard routes
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("/stats", dashboardHandler.GetDashboardStats)
		}
	}

	return r
}
