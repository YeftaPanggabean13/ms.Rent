package routes

import (
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"ms_rent_backend/internal/handlers"
	"ms_rent_backend/internal/middleware"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	clientURL := os.Getenv("CLIENT_URL")
	if clientURL == "" {
		clientURL = "http://localhost:3000"
	}

	// Setup CORS agar Next.js di port 3000 bisa berkomunikasi tanpa kendala
	corsConfig := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002", clientURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	r.Use(cors.New(corsConfig))

	// Inisialisasi Handlers
	authHandler := handlers.NewAuthHandler()
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

		// ====== Auth routes (public) ======
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.POST("/register", authHandler.Register)
		}

		// Auth: profil user (memerlukan token)
		api.GET("/auth/me", middleware.AuthRequired(), authHandler.GetProfile)

		// ====== Bike routes (public read, admin write) ======
		bikes := api.Group("/bikes")
		{
			bikes.GET("", bikeHandler.GetBikes)
			bikes.GET("/:id", bikeHandler.GetBikeByID)
			bikes.GET("/:id/availability", bookingHandler.CheckAvailability)
			bikes.GET("/:id/calendar", bookingHandler.GetCalendar)
		}

		// ====== Booking routes (public create & track, admin manage) ======
		bookings := api.Group("/bookings")
		{
			bookings.POST("", bookingHandler.CreateBooking)
			bookings.GET("/code/:code", bookingHandler.GetBookingByCode)
		}

		// ====== Admin-protected routes ======
		admin := api.Group("/admin")
		admin.Use(middleware.AuthRequired(), middleware.AdminRequired())
		{
			// Bikes CRUD
			admin.POST("/bikes", bikeHandler.CreateBike)
			admin.PUT("/bikes/:id", bikeHandler.UpdateBike)
			admin.DELETE("/bikes/:id", bikeHandler.DeleteBike)

			// Bookings management
			admin.GET("/bookings", bookingHandler.GetBookings)
			admin.PATCH("/bookings/:id/status", bookingHandler.UpdateBookingStatus)

			// Dashboard
			admin.GET("/dashboard/stats", dashboardHandler.GetDashboardStats)
		}
	}

	return r
}
