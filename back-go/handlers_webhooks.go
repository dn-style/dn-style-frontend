package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

// handleWCWebhook receives webhooks from WooCommerce
func handleWCWebhook(c *fiber.Ctx) error {
	topic := c.Get("X-WC-Webhook-Topic")
	if topic == "" {
		topic = c.Get("X-WC-Topic")
	}

	var data map[string]interface{}
	if err := json.Unmarshal(c.Body(), &data); err != nil {
		return c.Status(200).SendString("OK")
	}

	fmt.Printf("[WC Webhook] Topic: %s (ID: %v)\n", topic, data["id"])

	if topic != "" {
		ctx := context.Background()

		switch topic {
		case "order.created":
			if data["id"] != nil {
				_ = sendOrderEmail(data, "order-confirmation", nil)
			}

		case "order.updated":
			status, _ := data["status"].(string)
			orderID, _ := data["id"]

			fmt.Printf("[WC Webhook] Order Update: #%v Status: %s\n", orderID, status)

			switch status {
			case "processing":
				_ = sendOrderEmail(data, "order-preparing", nil)
			case "cancelled":
				_ = sendOrderEmail(data, "order-cancelled", nil)
				_ = sendAdminNotification(fmt.Sprintf("Pedido #%v CANCELADO", orderID), "El pedido ha sido marcado como cancelado.")
			case "completed":
				_ = sendOrderEmail(data, "order-shipped", nil)
				_ = sendAdminNotification(fmt.Sprintf("Pedido #%v COMPLETADO", orderID), "El pedido ha sido marcado como entregado/completado.")
			default:
				if status != "pending" && status != "on-hold" {
					_ = sendAdminNotification(fmt.Sprintf("Actualización Pedido #%v", orderID), "El pedido ha cambiado su estado a: <b>"+status+"</b>.")
				}
			}

		case "order_note.created":
			if customerNote, ok := data["customer_note"].(bool); ok && customerNote {
				noteText, _ := data["note"].(string)
				noteLower := strings.ToLower(noteText)

				if strings.Contains(noteLower, "seguimiento") || strings.Contains(noteLower, "tracking") || strings.Contains(noteLower, "guia") {
					fmt.Printf("[WC Webhook] 🚚 Nota de seguimiento detectada para orden #%v\n", data["order_id"])

					orderID := fmt.Sprintf("%v", data["order_id"])
					auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
					resp, err := httpClient.R().
						SetHeader("Authorization", "Basic "+auth).
						Get(fmt.Sprintf("/wp-json/wc/v3/orders/%s", orderID))

					if err == nil {
						var orderData map[string]interface{}
						_ = json.Unmarshal(resp.Body(), &orderData)

						parts := strings.Split(noteText, ":")
						tracking := strings.TrimSpace(parts[len(parts)-1])

						_ = sendOrderEmail(orderData, "order-shipped", map[string]interface{}{
							"tracking_number": tracking,
						})
					}
				}
			}

		case "category.created", "category.updated", "category.deleted", "product.created", "product.updated", "product.deleted", "product.restored":
			fmt.Printf("[WC Webhook] 🧹 Flushing cache for topic: %s\n", topic)
			flushCacheByPattern(ctx, "categories:*")
			flushCacheByPattern(ctx, "products:*")
			flushCacheByPattern(ctx, "variations:*")
			flushCacheByPattern(ctx, "product:*")
		}
	}

	return c.Status(200).SendString("OK")
}

func sendOrderEmail(orderData map[string]interface{}, templateName string, extraData map[string]interface{}) error {
	billing, _ := orderData["billing"].(map[string]interface{})
	email, _ := billing["email"].(string)
	if email == "" {
		return fmt.Errorf("no email found")
	}

	orderID := orderData["id"]

	subject := ""
	switch templateName {
	case "order-confirmation":
		subject = fmt.Sprintf("Pedido Recibido #%v - DN shop", orderID)
	case "order-preparing":
		subject = fmt.Sprintf("Estamos preparando tu pedido #%v - DN shop", orderID)
	case "order-cancelled":
		subject = fmt.Sprintf("Pedido Cancelado #%v - DN shop", orderID)
	case "order-shipped":
		subject = fmt.Sprintf("¡Tu pedido #%v está en camino! 🚚", orderID)
	default:
		subject = fmt.Sprintf("Actualización de Pedido #%v - DN shop", orderID)
	}

	renderData := map[string]interface{}{
		"order":    orderData,
		"billing":  billing,
		"order_id": orderID,
		"total":    orderData["total"],
		"year":     time.Now().Year(),
	}

	if items, ok := orderData["line_items"].([]interface{}); ok {
		lineItems := make([]map[string]interface{}, 0)
		for _, it := range items {
			m, _ := it.(map[string]interface{})
			lineItems = append(lineItems, map[string]interface{}{
				"name":     m["name"],
				"quantity": m["quantity"],
				"price":    m["total"],
			})
		}
		renderData["items"] = lineItems
	}

	for k, v := range extraData {
		renderData[k] = v
	}

	html, err := renderTemplate(templateName, renderData)
	if err != nil {
		return err
	}

	return sendEmail(email, subject, html)
}
