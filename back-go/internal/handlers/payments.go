package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	"dn-backend-go/internal/config"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)

// HandleMPWebhook receives payment notifications from Mercado Pago
func HandleMPWebhook(c *fiber.Ctx) error {
	id := c.Query("data.id")
	if id == "" {
		id = c.Query("id")
	}

	if id == "" {
		return c.Status(200).SendString("OK (No ID)")
	}

	fmt.Printf("[Mercado Pago Webhook] 🔔 Notification received for ID: %s\n", id)

	token := os.Getenv("MP_ACCESS_TOKEN")
	client := resty.New()
	resp, err := client.R().
		SetHeader("Authorization", "Bearer "+token).
		Get("https://api.mercadopago.com/v1/payments/" + id)

	if err != nil {
		fmt.Printf("[Mercado Pago Webhook] ❌ Error fetching payment: %v\n", err)
		return c.Status(500).SendString(err.Error())
	}

	var payment map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &payment)

	status, _ := payment["status"].(string)
	orderID, _ := payment["external_reference"].(string)

	if status == "approved" && orderID != "" {
		fmt.Printf("[Mercado Pago Webhook] ✅ Payment approved for Order #%s\n", orderID)

		// Update WC Order
		auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
		_, _ = config.HttpClient.R().
			SetHeader("Authorization", "Basic "+auth).
			SetBody(fiber.Map{"status": "processing", "set_paid": true}).
			Put("/wp-json/wc/v3/orders/" + orderID)
	}

	return c.Status(200).SendString("OK")
}
