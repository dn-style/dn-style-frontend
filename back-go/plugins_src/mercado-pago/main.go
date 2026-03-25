package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/go-resty/resty/v2"
)

type MercadoPagoPlugin struct{}

func (p *MercadoPagoPlugin) Matches(body map[string]interface{}) bool {
	pm, _ := body["payment_method"].(string)
	return pm == "woo-mercado-pago-basic"
}

func (p *MercadoPagoPlugin) Execute(orderID interface{}, total float64, body map[string]interface{}) (map[string]interface{}, error) {
	fmt.Printf("[Mercado Pago .SO] 💳 Procesando Orden #%v\n", orderID)

	initPoint, err := createMPPreference(orderID, total)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{"init_point": initPoint}, nil
}

// Exported variable for the main binary to load
var Plugin MercadoPagoPlugin

func createMPPreference(orderID interface{}, amount float64) (string, error) {
	token := os.Getenv("MP_ACCESS_TOKEN")
	webhookURL := os.Getenv("MP_WEBHOOK_URL")
	siteUrl := os.Getenv("SITE_URL") // Plugin lee su propio env

	payload := map[string]interface{}{
		"items": []map[string]interface{}{
			{
				"title":       fmt.Sprintf("Pedido DN Style #%v", orderID),
				"quantity":    1,
				"unit_price":  amount,
				"currency_id": "ARS",
			},
		},
		"external_reference": fmt.Sprintf("%v", orderID),
		"notification_url":   webhookURL,
		"back_urls": map[string]string{
			"success": siteUrl + "/thanks",
			"failure": siteUrl + "/cart",
			"pending": siteUrl + "/thanks",
		},
		"auto_return": "approved",
	}

	client := resty.New()
	resp, err := client.R().
		SetHeader("Authorization", "Bearer "+token).
		SetHeader("Content-Type", "application/json").
		SetBody(payload).
		Post("https://api.mercadopago.com/checkout/preferences")

	if err != nil {
		return "", err
	}

	var result map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &result)

	if initPoint, ok := result["init_point"].(string); ok {
		return initPoint, nil
	}

	return "", fmt.Errorf("init_point not found")
}
