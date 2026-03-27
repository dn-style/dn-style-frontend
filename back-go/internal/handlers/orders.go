package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"
	"time"

	"dn-backend-go/internal/config"
	"dn-backend-go/internal/plugins"
	"dn-backend-go/internal/util"

	"github.com/gofiber/fiber/v2"
	"github.com/minio/minio-go/v7"
)

// HandleGetOrders gets orders for a customer
func HandleGetOrders(c *fiber.Ctx) error {
	email := c.Query("email")
	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	// Buscar ID del cliente por mail
	resp, _ := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("email", email).
		Get("/wp-json/wc/v3/customers")

	var customers []map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &customers)

	params := url.Values{}
	if len(customers) > 0 {
		params.Set("customer", fmt.Sprintf("%v", customers[0]["id"]))
	} else {
		params.Set("search", email)
	}

	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParamsFromValues(params).
		Get("/wp-json/wc/v3/orders")

	if err != nil {
		return c.Status(500).JSON([]interface{}{})
	}

	var data interface{}
	_ = json.Unmarshal(resp.Body(), &data)
	return c.JSON(util.RewriteUrls(data))
}

// HandleCreateOrder creates a WooCommerce order
func HandleCreateOrder(c *fiber.Ctx) error {
	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid body"})
	}

	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(body).
		Post("/wp-json/wc/v3/orders")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Error al crear pedido"})
	}

	// Reintento si el ID de cliente es invlido (stale data en cliente)
	if resp.StatusCode() == 400 {
		var errData map[string]interface{}
		_ = json.Unmarshal(resp.Body(), &errData)
		if errData["code"] == "woocommerce_rest_invalid_customer_id" {
			delete(body, "customer_id")
			resp, err = config.HttpClient.R().
				SetHeader("Authorization", "Basic "+auth).
				SetBody(body).
				Post("/wp-json/wc/v3/orders")
			if err != nil {
				return c.Status(500).JSON(fiber.Map{"message": "Error al crear pedido"})
			}
		} else {
			return c.Status(400).JSON(errData)
		}
	}

	var data map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &data)

	if orderID, ok := data["id"]; ok {
		// 1. Notificacion admin
		customerName := "Cliente"
		if billing, ok := body["billing"].(map[string]interface{}); ok {
			customerName = fmt.Sprintf("%v %v", billing["first_name"], billing["last_name"])
		}

		msg := fmt.Sprintf("Se ha recibido un nuevo pedido de <b>%s</b> por un total de <b>%v %v</b>.",
			customerName, data["total"], data["currency"])
		_ = util.SendAdminNotification(fmt.Sprintf("Nuevo Pedido #%v", orderID), msg)

		// 2. Nota de conversion
		if conv, ok := body["_conversion_data"].(map[string]interface{}); ok {
			rateVal, _ := conv["rate"].(float64)
			if rateVal > 0 {
				totalVal, _ := conv["total_ars"].(float64)
				details := "No especificado"
				if d, ok := conv["details"].(string); ok {
					details = d
				}

				noteContent := fmt.Sprintf(" DETALLES DE CONVERSIN (ARS):\n\n"+
					" Cotizacin aplicada: $%v\n"+
					" Total en Pesos: ARS $%v\n\n"+
					"Detalle de productos:\n%s", rateVal, totalVal, details)

				_, _ = config.HttpClient.R().
					SetHeader("Authorization", "Basic "+auth).
					SetBody(fiber.Map{"note": noteContent, "customer_note": false}).
					Post(fmt.Sprintf("/wp-json/wc/v3/orders/%v/notes", orderID))
			}
		}

		// 3. MOTOR DE PLUGINS DINMICO (Soporte Interceptores)
		totalVal, _ := strconv.ParseFloat(fmt.Sprintf("%v", data["total"]), 64)

		for _, plugin := range plugins.OrderInterceptors {
			if plugin.Matches(body) {
				extra, err := plugin.Execute(orderID, totalVal, body)
				if err == nil {
					// Enriquecemos la respuesta de WooCommerce con los datos del plugin (ej: 'init_point')
					for k, v := range extra {
						data[k] = v
					}
				}
			}
		}
	}

	return c.JSON(util.RewriteUrls(data))
}

// HandleUploadReceipt handles payment receipt upload to S3
func HandleUploadReceipt(c *fiber.Ctx) error {
	orderID := c.FormValue("order_id")
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(400).SendString("No file")
	}

	f, err := file.Open()
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	defer f.Close()

	key := fmt.Sprintf("receipts/order-%s-%d-%s", orderID, time.Now().UnixMilli(), file.Filename)

	_, err = config.S3Client.PutObject(context.Background(), config.ProductsBucket, key, f, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error al subir a almacenamiento: " + err.Error()})
	}

	// Update WooCommerce order status and add note
	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	noteContent := fmt.Sprintf("Comprobante subido: %s/images/%s", config.SiteUrl, key)

	// 1. Status 'on-hold'
	_, _ = config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(fiber.Map{"status": "on-hold"}).
		Put("/wp-json/wc/v3/orders/" + orderID)

	// 2. Private note
	_, _ = config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(fiber.Map{"note": noteContent, "customer_note": false}).
		Post("/wp-json/wc/v3/orders/" + orderID + "/notes")

	return c.JSON(fiber.Map{"success": true, "key": key})
}
