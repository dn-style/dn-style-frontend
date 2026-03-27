package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"time"

	"dn-backend-go/internal/config"
	"dn-backend-go/internal/util"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)

// HandleGetRate gets USD/ARS exchange rate from Dolar API
func HandleGetRate(c *fiber.Ctx) error {
	cacheKey := "dolar_blue_rate"
	ctx := context.Background()

	if config.RedisClient != nil {
		cached, err := config.RedisClient.Get(ctx, cacheKey).Result()
		if err == nil {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	resp, err := resty.New().R().Get("https://dolarapi.com/v1/dolares/blue")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching rate"})
	}

	var result struct {
		Venta float64 `json:"venta"`
	}
	_ = json.Unmarshal(resp.Body(), &result)

	if result.Venta > 0 {
		rateWithMarkup := result.Venta * 1.02
		finalResult := fiber.Map{
			"rate":      rateWithMarkup,
			"original":  result.Venta,
			"timestamp": time.Now(),
		}

		if config.RedisClient != nil {
			b, _ := json.Marshal(finalResult)
			config.RedisClient.Set(ctx, cacheKey, b, 30*time.Minute)
		}

		return c.JSON(finalResult)
	}

	return c.Status(500).JSON(fiber.Map{"error": "Invalid rate data"})
}

// HandleCacheFlush flushes all Redis keys
func HandleCacheFlush(c *fiber.Ctx) error {
	if config.RedisClient != nil {
		config.RedisClient.FlushAll(context.Background())
	}
	return c.JSON(fiber.Map{"success": true, "message": "All cache flushed"})
}

// HandlePaymentGateways lists all enabled payment gateways from WC
func HandlePaymentGateways(c *fiber.Ctx) error {
	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get("/wp-json/wc/v3/payment_gateways")

	if err != nil {
		return c.JSON([]interface{}{})
	}

	var data interface{}
	_ = json.Unmarshal(resp.Body(), &data)
	return c.JSON(util.RewriteUrls(data))
}

// HandleGetShippingMethods returns all global shipping methods from WC
func HandleGetShippingMethods(c *fiber.Ctx) error {
	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get("/wp-json/wc/v3/shipping_methods")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching shipping methods"})
	}

	var data interface{}
	_ = json.Unmarshal(resp.Body(), &data)
	return c.JSON(util.RewriteUrls(data))
}
