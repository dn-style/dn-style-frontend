package handlers

import (
	"fmt"

	"dn-backend-go/internal/util"

	"github.com/gofiber/fiber/v2"
)

// HandleWCWebhook handles notifications from WooCommerce (Async via Global Worker)
func HandleWCWebhook(c *fiber.Ctx) error {
	var payload map[string]interface{}
	if err := c.BodyParser(&payload); err != nil {
		return c.SendStatus(200)
	}

	topic := c.Get("X-Wc-Webhook-Topic")

	// Enviar a la cola de trabajo GLOBAL
	util.TaskQueue <- util.Task{
		Type: "wc_webhook",
		Payload: map[string]interface{}{
			"topic": topic,
			"id":    payload["id"],
		},
	}

	fmt.Printf("[Webhook] Event queued: %s\n", topic)

	return c.SendStatus(200)
}
