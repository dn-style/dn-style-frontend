package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	jwtware "github.com/gofiber/jwt/v3"
	fiber_ws "github.com/gofiber/websocket/v2"
	"github.com/gorilla/websocket"
)

var (
	activeAgents = make(map[string]*ActiveAgent)
	mutex        sync.RWMutex
	upgrader     = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		allowedOrigins := []string{"https://woogo.system4us.com", "http://localhost:5000", "http://localhost:5173"}
		for _, o := range allowedOrigins {
			if origin == o {
				return true
			}
		}
		return false
	}}
)

func main() {
	initDB()

	app := fiber.New()
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "https://woogo.system4us.com, http://localhost:5000, http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	app.Static("/assets", "./assets")
	app.Static("/", "./www", fiber.Static{
		Compress: true,
		Index:    "index.html",
	})

	app.Get("/ws", fiber_ws.New(handleAgentConnection))

	api := app.Group("/api")
	api.Use(jwtware.New(jwtware.Config{
		SigningKey: getSecret(),
		Filter: func(c *fiber.Ctx) bool {
			return c.Path() == "/api/login" || c.Path() == "/api/paypal/webhook" || c.Path() == "/api/agents/connect"
		},
	}))

	// ROUTES
	api.Post("/login", handleLogin)
	api.Get("/billing", handleBilling)
	api.Get("/online", handleOnlineAgents)
	api.Post("/agents", handleCreateAgent)
	api.Delete("/agents/delete", handleDeleteAgent)
	api.Patch("/update-tags", handleUpdateTags)
	api.Post("/push-config", handlePushConfig)
	api.Get("/usage", handleUsage)
	api.Post("/paypal/webhook", handlePaypalWebhook)

	// Fallback SPA
	app.Get("/*", func(c *fiber.Ctx) error {
		if strings.HasPrefix(c.Path(), "/api") || strings.HasPrefix(c.Path(), "/ws") {
			return c.Next()
		}
		return c.SendFile("./www/index.html")
	})

	// Janitor
	go func() {
		for {
			time.Sleep(15 * time.Second)
			mutex.Lock()
			for token, agent := range activeAgents {
				if time.Since(agent.LastSeen) > 70*time.Second {
					if agent.Conn != nil {
						agent.Conn.Close()
					}
					delete(activeAgents, token)
				}
			}
			mutex.Unlock()
		}
	}()

	fmt.Println("wooGo-Proxy CP Server online on :5000")
	log.Fatal(app.Listen(":5000"))
}
