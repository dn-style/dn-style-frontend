package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)

// handleGetRate gets USD/ARS exchange rate from Dolar API
func handleGetRate(c *fiber.Ctx) error {
	cacheKey := "dolar_blue_rate"
	ctx := context.Background()

	if redisClient != nil {
		cached, err := redisClient.Get(ctx, cacheKey).Result()
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

		if redisClient != nil {
			b, _ := json.Marshal(finalResult)
			redisClient.Set(ctx, cacheKey, b, 30*time.Minute)
		}

		return c.JSON(finalResult)
	}

	return c.Status(500).JSON(fiber.Map{"error": "Invalid rate data"})
}

func handleCacheFlush(c *fiber.Ctx) error {
	if redisClient != nil {
		redisClient.FlushAll(context.Background())
	}
	return c.JSON(fiber.Map{"success": true, "message": "All cache flushed"})
}

func handlePaymentGateways(c *fiber.Ctx) error {
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get("/wp-json/wc/v3/payment_gateways")

	if err != nil {
		return c.JSON([]interface{}{})
	}

	var data interface{}
	_ = json.Unmarshal(resp.Body(), &data)
	return c.JSON(rewriteUrls(data))
}
