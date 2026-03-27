package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"dn-backend-go/internal/config"
	"dn-backend-go/internal/control"
	"dn-backend-go/internal/handlers"
	"dn-backend-go/internal/plugins"
	"dn-backend-go/internal/util"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	socketio "github.com/googollee/go-socket.io"
	"github.com/joho/godotenv"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Load Environment
	if ep := os.Getenv("WP_ENV_PATH"); ep != "" {
		_ = godotenv.Load(ep)
	} else {
		_ = godotenv.Load()
	}

	// Initialize Configuration
	config.WcKey = os.Getenv("WC_KEY")
	config.WcSecret = os.Getenv("WC_SECRET")
	config.SiteUrl = os.Getenv("SITE_URL")
	if config.SiteUrl == "" {
		config.SiteUrl = "http://localhost:3001"
	}

	// 1. Redis
	redisURL := os.Getenv("REDIS_URL")
	if redisURL != "" {
		config.RedisClient = redis.NewClient(&redis.Options{
			Addr: redisURL,
		})
	}

	// 2. S3 (MinIO)
	s3Host := os.Getenv("MINIO_HOST")
	s3User := os.Getenv("MINIO_USER")
	s3Pass := os.Getenv("MINIO_PASS")
	if s3Host != "" {
		client, err := minio.New(s3Host, &minio.Options{
			Creds:  credentials.NewStaticV4(s3User, s3Pass, ""),
			Secure: false,
		})
		if err == nil {
			config.S3Client = client
		}
	}

	// 3. HTTP Client (Resty)
	wpURL := os.Getenv("WC_WP_URL")
	if wpURL == "" {
		wpURL = "http://localhost:8086" // Docker WP Default
	}
	config.InitHttpClient(wpURL)

	// 4. Socket.io
	config.SocketServer = socketio.NewServer(nil)
	config.SocketServer.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		fmt.Println("Chat: Cliente conectado", s.ID())
		return nil
	})
	config.SocketServer.OnEvent("/", "join_chat", func(s socketio.Conn, msg string) {
		s.Emit("receive_message", map[string]interface{}{
			"text":      "Hola! Cmo podemos ayudarte?",
			"sender":    "agent",
			"timestamp": time.Now(),
		})
	})
	go config.SocketServer.Serve()
	defer config.SocketServer.Close()

	// 5. Plugins, Workers & Control Plane
	plugins.LoadDynamicPlugins()
	util.StartWorker()
	control.ConnectToControlPlane()

	// 6. Fiber App
	app := fiber.New(fiber.Config{
		BodyLimit: 50 * 1024 * 1024,
	})

	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173, https://dnshop.com.ar, http://dnshop.com.ar, https://www.dnshop.com.ar, http://10.10.0.3:3001, http://localhost:3000, http://localhost:3001",
		AllowCredentials: true,
		AllowMethods:     "GET,POST,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders:     "Content-Type, Authorization, X-Requested-With",
	}))

	// Socket.io via adaptor
	app.All("/socket.io/*", adaptor.HTTPHandler(config.SocketServer))

	// Routes
	setupRoutes(app)

	// Static Fallback (Production)
	rootDir, _ := os.Getwd()
	app.Static("/", filepath.Join(rootDir, "public_html"))
	app.Get("*", func(c *fiber.Ctx) error {
		path := c.Path()
		// APIs no deben devolver index.html
		if len(path) > 4 && path[:4] == "/wc/" {
			return c.Status(404).JSON(fiber.Map{"error": "Not Found"})
		}
		return c.SendFile(filepath.Join(rootDir, "public_html", "index.html"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	log.Fatal(app.Listen(":" + port))
}

func setupRoutes(app *fiber.App) {
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("DN Backend-Go (Professional Structure) is running")
	})

	// Auth
	app.Post("/auth/login", handlers.HandleLogin)
	app.Post("/auth/register", handlers.HandleRegister)
	app.Get("/auth/customer", handlers.HandleGetCustomer)
	app.Put("/auth/customer/:id", handlers.HandleUpdateCustomer)
	app.Post("/auth/forgot-password", handlers.HandleForgotPassword)

	// Orders
	app.Get("/auth/orders", handlers.HandleGetOrders)
	app.Post("/auth/orders", handlers.HandleCreateOrder)
	app.Post("/orders/upload-receipt", handlers.HandleUploadReceipt)

	// Products
	app.Get("/wc/products", handlers.HandleGetProducts)
	app.Get("/wc/products/:id", handlers.HandleGetProduct)
	app.Get("/wc/products/:id/variations", handlers.HandleGetProductVariations)
	app.Get("/wc/categories", handlers.HandleGetCategories)
	app.Get("/wc/coupons/validate", handlers.HandleValidateCoupon)

	// Misc
	app.Get("/wc/rate", handlers.HandleGetRate)
	app.Get("/wc/payment_gateways", handlers.HandlePaymentGateways)
	app.Get("/wc/shipping_methods", handlers.HandleGetShippingMethods)
	app.Post("/wc/cache/flush", handlers.HandleCacheFlush)

	// Webhooks
	app.Post("/webhooks/woocommerce", handlers.HandleWCWebhook)
	app.Post("/wc/payments/mp/webhook", handlers.HandleMPWebhook)

	// Generic Bridge
	app.All("/wp-json/*", handlers.HandleGenericWPProxy)
}
