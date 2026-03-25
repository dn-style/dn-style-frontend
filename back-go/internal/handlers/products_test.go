package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"dn-backend-go/internal/config"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestHandleGetProducts(t *testing.T) {
	app := fiber.New()
	app.Get("/wc/products", HandleGetProducts)

	// Mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode([]map[string]interface{}{{"id": 1, "name": "Fake Product"}})
	}))
	defer server.Close()

	// Configure mock client
	oldClient := config.HttpClient
	config.HttpClient = resty.New().SetBaseURL(server.URL)
	config.WcKey = "fake"
	config.WcSecret = "fake"
	defer func() { config.HttpClient = oldClient }()

	req := httptest.NewRequest("GET", "/wc/products", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestHandleValidateCoupon(t *testing.T) {
	app := fiber.New()
	app.Get("/wc/coupons/validate", HandleValidateCoupon)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		code := r.URL.Query().Get("code")
		if code == "INVALID" {
			_ = json.NewEncoder(w).Encode([]interface{}{})
		} else {
			_ = json.NewEncoder(w).Encode([]map[string]interface{}{{
				"code":          "VALID10",
				"amount":        "10.00",
				"discount_type": "percent",
			}})
		}
	}))
	defer server.Close()

	oldClient := config.HttpClient
	config.HttpClient = resty.New().SetBaseURL(server.URL)
	defer func() { config.HttpClient = oldClient }()

	// Test Valid
	req := httptest.NewRequest("GET", "/wc/coupons/validate?code=VALID10", nil)
	resp, _ := app.Test(req)
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	// Test Invalid
	reqInv := httptest.NewRequest("GET", "/wc/coupons/validate?code=INVALID", nil)
	respInv, _ := app.Test(reqInv)

	var data map[string]interface{}
	_ = json.NewDecoder(respInv.Body).Decode(&data)
	assert.False(t, data["valid"].(bool))
}
