package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"dn-backend-go/internal/config"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestHandleCreateOrder_RetryLogic(t *testing.T) {
	app := fiber.New()
	app.Post("/auth/orders", HandleCreateOrder)

	var calls int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		var body map[string]interface{}
		_ = json.NewDecoder(r.Body).Decode(&body)

		if calls == 1 {
			// Simular fallo por ID inválido
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"code": "woocommerce_rest_invalid_customer_id",
			})
		} else {
			// Simular éxito en el segundo intento (sin customer_id)
			assert.Nil(t, body["customer_id"])
			w.WriteHeader(http.StatusCreated)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"id": 123,
			})
		}
	}))
	defer server.Close()

	oldClient := config.HttpClient
	config.HttpClient = resty.New().SetBaseURL(server.URL)
	defer func() { config.HttpClient = oldClient }()

	orderBody := map[string]interface{}{
		"customer_id": 999, // ID inválido
		"billing": map[string]interface{}{
			"first_name": "Test",
		},
	}
	jsonBody, _ := json.Marshal(orderBody)
	req := httptest.NewRequest("POST", "/auth/orders", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := app.Test(req)

	assert.Equal(t, http.StatusCreated, resp.StatusCode)
	assert.Equal(t, 2, calls, "Debe haber llamado a la API de WC dos veces (reintento)")
}

func TestHandleMPWebhook_Cancellation(t *testing.T) {
	app := fiber.New()
	app.Post("/wc/mercado-pago/webhook", HandleMPWebhook)

	var updatedStatus string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			// Mock del fetch de pago de MP
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"status":             "cancelled",
				"external_reference": "500",
			})
		} else if r.Method == "PUT" {
			// Mock de actualización de orden en WC
			var body map[string]interface{}
			_ = json.NewDecoder(r.Body).Decode(&body)
			updatedStatus = body["status"].(string)
			w.WriteHeader(http.StatusOK)
		}
	}))
	defer server.Close()

	oldClient := config.HttpClient
	config.HttpClient = resty.New().SetBaseURL(server.URL)
	defer func() { config.HttpClient = oldClient }()

	// Mandar webhook de tipo payment con id
	req := httptest.NewRequest("POST", "/wc/mercado-pago/webhook?id=123&topic=payment", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "cancelled", updatedStatus, "La orden de WC debería haber sido cancelada")
}
