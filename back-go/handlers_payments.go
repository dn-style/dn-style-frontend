package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/mercadopago/sdk-go/pkg/config"
	"github.com/mercadopago/sdk-go/pkg/preference"
)

// createMPPreference creates a checkout preference for Mercado Pago
func createMPPreference(orderID interface{}, total float64, items []interface{}) (string, error) {
	if mpAccessToken == "" {
		return "", fmt.Errorf("Mercado Pago Access Token not configured")
	}

	cfg, err := config.New(mpAccessToken)
	if err != nil {
		return "", err
	}
	client := preference.NewClient(cfg)

	preferenceItems := make([]preference.ItemRequest, 0)
	preferenceItems = append(preferenceItems, preference.ItemRequest{
		Title:      fmt.Sprintf("Pedido #%v - DN shop", orderID),
		Quantity:   1,
		UnitPrice:  total,
		CurrencyID: "ARS",
	})

	req := preference.Request{
		Items:             preferenceItems,
		ExternalReference: fmt.Sprintf("%v", orderID),
		BackURLs: &preference.BackURLsRequest{
			Success: fmt.Sprintf("%s/thanks?order_id=%v&status=success", siteUrl, orderID),
			Failure: fmt.Sprintf("%s/checkout?status=failure", siteUrl),
			Pending: fmt.Sprintf("%s/thanks?order_id=%v&status=pending", siteUrl, orderID),
		},
		AutoReturn:      "approved",
		NotificationURL: fmt.Sprintf("%s/wc/payments/mp/webhook", os.Getenv("MP_WEBHOOK_URL")),
	}

	result, err := client.Create(context.Background(), req)
	if err != nil {
		return "", err
	}

	return result.InitPoint, nil
}

// handleMPWebhook receives IPN/Webhooks from Mercado Pago
func handleMPWebhook(c *fiber.Ctx) error {
	var body struct {
		Action string `json:"action"`
		Data   struct {
			ID string `json:"id"`
		} `json:"data"`
		Type string `json:"type"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.SendStatus(200)
	}

	fmt.Printf("[MP Webhook] Received notification type: %s, ID: %s\n", body.Type, body.Data.ID)

	if body.Type == "payment" || (body.Action == "payment.created" || body.Action == "payment.updated") {
		// Fetch payment from MP
		resp, err := httpClient.R().
			SetHeader("Authorization", "Bearer "+mpAccessToken).
			Get(fmt.Sprintf("https://api.mercadopago.com/v1/payments/%s", body.Data.ID))

		if err == nil && resp.StatusCode() == 200 {
			var paymentData struct {
				Status            string `json:"status" `
				ExternalReference string `json:"external_reference"`
			}
			_ = json.Unmarshal(resp.Body(), &paymentData)

			if paymentData.Status == "approved" && paymentData.ExternalReference != "" {
				fmt.Printf("[MP Webhook] ✅ Payment approved for Order #%v\n", paymentData.ExternalReference)

				// Update WooCommerce order
				auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))

				// 1. Mark as processing and set paid
				_, _ = httpClient.R().
					SetHeader("Authorization", "Basic "+auth).
					SetBody(fiber.Map{"status": "processing", "set_paid": true}).
					Put(fmt.Sprintf("/wp-json/wc/v3/orders/%v", paymentData.ExternalReference))

				// 2. Add private note
				note := fmt.Sprintf("✅ Pago aprobado via Mercado Pago (ID: %s)", body.Data.ID)
				_, _ = httpClient.R().
					SetHeader("Authorization", "Basic "+auth).
					SetBody(fiber.Map{"note": note, "customer_note": false}).
					Post(fmt.Sprintf("/wp-json/wc/v3/orders/%v/notes", paymentData.ExternalReference))

				fmt.Printf("[MP Webhook] WooCommerce Order #%v updated successfully\n", paymentData.ExternalReference)
			}
		}
	}

	return c.SendStatus(200)
}
