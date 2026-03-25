package handlers

import (
	"fmt"
	"strings"

	"dn-backend-go/internal/util"

	"github.com/gofiber/fiber/v2"
)

// HandleWCWebhook handles notifications from WooCommerce (Cache invalidation & Emails)
func HandleWCWebhook(c *fiber.Ctx) error {
	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.SendStatus(200)
	}

	topic := c.Get("X-Wc-Webhook-Topic")
	id := fmt.Sprintf("%v", payload["id"])

	fmt.Printf("[WC Webhook] Topic: %s (ID: %s)\n", topic, id)

	// 1. Invalidation de Cache
	if strings.Contains(topic, "product") {
		util.FlushCacheByPattern("products:*")
		util.FlushCacheByPattern("product:" + id)
		util.FlushCacheByPattern("variations:" + id)
	} else if strings.Contains(topic, "category") {
		util.FlushCacheByPattern("categories:*")
	}

	return c.SendStatus(200)
}
