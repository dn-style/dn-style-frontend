package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	socketio "github.com/googollee/go-socket.io"
)

func main() {
	initClients()

	// Socket.io Setup
	socketServer := socketio.NewServer(nil)
	socketServer.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		if isVerbose {
			fmt.Printf("Cliente chat conectado: %s\n", s.ID())
		}
		return nil
	})
	socketServer.OnEvent("/", "join_chat", func(s socketio.Conn, msg string) {
		s.Emit("receive_message", map[string]interface{}{
			"text":      "¡Hola! ¿Cómo podemos ayudarte?",
			"sender":    "agent",
			"timestamp": time.Now(),
		})
	})
	go socketServer.Serve()
	defer socketServer.Close()

	// Fiber Setup
	app := fiber.New(fiber.Config{
		BodyLimit: 50 * 1024 * 1024, // 50MB
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://dnshop.com.ar, http://dnshop.com.ar, https://www.dnshop.com.ar, http://www.dnshop.com.ar, http://10.10.0.3:3001, http://localhost:3000, http://localhost:3001",
		AllowCredentials: true,
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Content-Type, Authorization, X-Requested-With",
	}))

	// Socket.io routes via adaptor
	app.All("/socket.io/*", adaptor.HTTPHandler(socketServer))

	setupRoutes(app)

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	// Root and health check
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("DN Backend-Go is running")
	})

	// Auth & User routes
	app.Post("/auth/login", handleLogin)
	app.Post("/auth/register", handleRegister)
	app.Get("/auth/customer", handleGetCustomer)
	app.Put("/auth/customer/:id", handleUpdateCustomer)
	app.Get("/auth/orders", handleGetOrders)
	app.Post("/auth/orders", handleCreateOrder)
	app.Get("/wc/payment_gateways", handlePaymentGateways)
	app.Get("/wc/reviews/check", handleCheckReview)
	app.Post("/wc/reviews", handleCreateReview)
	app.Get("/wc/rate", handleGetRate)
	app.Post("/auth/forgot-password", handleForgotPassword)
	app.Post("/orders/upload-receipt", handleUploadReceipt)

	// WooCommerce routes
	app.Get("/wc/products/:id/reviews", handleGetProductReviews)
	app.Get("/wc/products/:id/variations", handleGetProductVariations)
	app.Get("/wc/products/:id", handleGetProduct)
	app.Get("/wc/products", handleGetProducts)
	app.Get("/wc/categories", handleGetCategories)
	app.Post("/wc/cache/flush", handleCacheFlush)
	app.Post("/webhooks/woocommerce", handleWCWebhook)
	app.Post("/wc/payments/mp/webhook", handleMPWebhook)

	// Image/Proxy service
	app.Get("/images/*", handleProxyImages)

	// SSR routes
	app.Get("/producto/:id", handleSSRProduct)

	// Static fallback
	app.Static("/", filepath.Join(rootDir, "public_html"))
	app.Get("*", func(c *fiber.Ctx) error {
		// Si no es una ruta API, servir index.html
		path := c.Path()
		if strings.HasPrefix(path, "/wc/") || strings.HasPrefix(path, "/auth/") || strings.HasPrefix(path, "/images/") || strings.HasPrefix(path, "/orders/") {
			return c.Status(404).SendString("API Not Found")
		}
		return c.SendFile(filepath.Join(rootDir, "public_html", "index.html"))
	})
}
