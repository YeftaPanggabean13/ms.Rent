package handlers

import (
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
	"ms_rent_backend/internal/database"
	"ms_rent_backend/internal/models"
)

type PaymentHandler struct {
	ServerKey    string
	ClientKey    string
	IsProduction bool
	SnapClient   snap.Client
}

func NewPaymentHandler() *PaymentHandler {
	serverKey := strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY"))
	clientKey := strings.TrimSpace(os.Getenv("MIDTRANS_CLIENT_KEY"))
	isProd := os.Getenv("MIDTRANS_IS_PRODUCTION") == "true"

	env := midtrans.Sandbox
	if isProd {
		env = midtrans.Production
	}

	var snapClient snap.Client
	if serverKey != "" {
		snapClient.New(serverKey, env)
	}

	return &PaymentHandler{
		ServerKey:    serverKey,
		ClientKey:    clientKey,
		IsProduction: isProd,
		SnapClient:   snapClient,
	}
}

// CreateSnapToken membuat token transaksi Midtrans Snap untuk pesanan
func (h *PaymentHandler) CreateSnapToken(c *gin.Context) {
	var req struct {
		BookingCode string `json:"booking_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode booking wajib diisi"})
		return
	}

	var booking models.Booking
	if err := database.DB.Preload("Bike").Where("booking_code = ?", req.BookingCode).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	if booking.PaymentStatus == "paid" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pesanan ini sudah lunas"})
		return
	}

	// Gunakan token yang sudah ada jika belum lunas dan masih valid (dan bukan mock token lama)
	if booking.PaymentToken != "" && booking.PaymentRedirectURL != "" && !strings.HasPrefix(booking.PaymentToken, "MOCK-") {
		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"token":         booking.PaymentToken,
			"redirect_url":  booking.PaymentRedirectURL,
			"client_key":    h.ClientKey,
			"is_production": h.IsProduction,
		})
		return
	}

	// Jika server key belum disetel, kembalikan mock token untuk development
	if h.ServerKey == "" || strings.HasPrefix(h.ServerKey, "SB-Mid-server-xxx") || strings.HasPrefix(h.ServerKey, "Mid-server-xxx") {
		mockToken := fmt.Sprintf("MOCK-SNAP-TOKEN-%d", time.Now().Unix())
		booking.PaymentToken = mockToken
		booking.PaymentRedirectURL = "https://app.sandbox.midtrans.com/snap/v2/vtweb/" + mockToken
		database.DB.Save(&booking)

		c.JSON(http.StatusOK, gin.H{
			"success":       true,
			"token":         mockToken,
			"redirect_url":  booking.PaymentRedirectURL,
			"client_key":    h.ClientKey,
			"is_production": h.IsProduction,
			"is_mock":       true,
		})
		return
	}

	// Siapkan request Snap Midtrans
	itemName := "Sewa Motor ms.Rent"
	if booking.Bike != nil {
		itemName = fmt.Sprintf("Sewa %s (%s)", booking.Bike.Name, booking.Bike.PlateNumber)
	}

	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  booking.BookingCode,
			GrossAmt: int64(booking.TotalPrice),
		},
		CustomerDetail: &midtrans.CustomerDetails{
			FName: booking.CustomerName,
			Phone: booking.CustomerPhone,
			Email: booking.CustomerEmail,
		},
		Items: &[]midtrans.ItemDetails{
			{
				ID:    fmt.Sprintf("BIKE-%d", booking.BikeID),
				Price: int64(booking.TotalPrice),
				Qty:   1,
				Name:  itemName,
			},
		},
	}

	snapResp, err := h.SnapClient.CreateTransaction(snapReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat sesi pembayaran Midtrans: " + err.Message,
		})
		return
	}

	// Simpan token ke database
	booking.PaymentToken = snapResp.Token
	booking.PaymentRedirectURL = snapResp.RedirectURL
	database.DB.Save(&booking)

	c.JSON(http.StatusOK, gin.H{
		"success":       true,
		"token":         snapResp.Token,
		"redirect_url":  snapResp.RedirectURL,
		"client_key":    h.ClientKey,
		"is_production": h.IsProduction,
	})
}

// HandleNotification menangani Webhook / HTTP Callback dari Midtrans
func (h *PaymentHandler) HandleNotification(c *gin.Context) {
	var payload struct {
		OrderID           string `json:"order_id"`
		StatusCode        string `json:"status_code"`
		GrossAmount       string `json:"gross_amount"`
		SignatureKey      string `json:"signature_key"`
		TransactionStatus string `json:"transaction_status"`
		PaymentType       string `json:"payment_type"`
		FraudStatus       string `json:"fraud_status"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload tidak valid"})
		return
	}

	// Validasi signature key jika server key dikonfigurasi
	if h.ServerKey != "" && !strings.HasPrefix(h.ServerKey, "SB-Mid-server-xxx") && !strings.HasPrefix(h.ServerKey, "Mid-server-xxx") {
		hasher := sha512.New()
		hasher.Write([]byte(payload.OrderID + payload.StatusCode + payload.GrossAmount + h.ServerKey))
		expectedSig := hex.EncodeToString(hasher.Sum(nil))

		if payload.SignatureKey != expectedSig {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Signature tidak valid"})
			return
		}
	}

	// Ambil kode booking dasar
	bookingCode := payload.OrderID
	if idx := strings.Index(bookingCode, "-"); idx != -1 {
		// Midtrans order_id mungkin format MSR-XXXX atau MSR-XXXX-timestamp
		parts := strings.Split(bookingCode, "-")
		if len(parts) >= 3 {
			bookingCode = strings.Join(parts[:3], "-")
		}
	}

	var booking models.Booking
	if err := database.DB.Where("booking_code = ?", bookingCode).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	now := time.Now()
	switch payload.TransactionStatus {
	case "capture":
		if payload.FraudStatus == "accept" {
			booking.PaymentStatus = "paid"
			booking.BookingStatus = "confirmed"
			booking.PaymentMethod = payload.PaymentType
			booking.PaidAt = &now
		}
	case "settlement":
		booking.PaymentStatus = "paid"
		booking.BookingStatus = "confirmed"
		booking.PaymentMethod = payload.PaymentType
		booking.PaidAt = &now
	case "pending":
		booking.PaymentStatus = "unpaid"
	case "deny", "cancel", "expire":
		booking.PaymentStatus = "failed"
	}

	if err := database.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status pesanan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "OK"})
}

// MockPay mensimulasikan pembayaran lunas instan (untuk pengujian dev tanpa webhook)
func (h *PaymentHandler) MockPay(c *gin.Context) {
	var req struct {
		BookingCode string `json:"booking_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode booking wajib diisi"})
		return
	}

	var booking models.Booking
	if err := database.DB.Where("booking_code = ?", req.BookingCode).First(&booking).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pesanan tidak ditemukan"})
		return
	}

	now := time.Now()
	booking.PaymentStatus = "paid"
	booking.BookingStatus = "confirmed"
	booking.PaymentMethod = "Midtrans Simulator (QRIS/VA)"
	booking.PaidAt = &now

	if err := database.DB.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pesanan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Pembayaran berhasil disimulasikan sebagai LUNAS",
		"data":    booking,
	})
}
