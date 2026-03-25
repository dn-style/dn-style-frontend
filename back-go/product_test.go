package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestGetProducts(t *testing.T) {
	// 1. Setup mock server
	mockProducts := []map[string]interface{}{
		{"id": 1, "name": "iPhone 15", "price": "1000"},
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(mockProducts)
	}))
	defer server.Close()

	// 2. Point httpClient to mock server
	oldClient := httpClient
	httpClient = resty.New().SetBaseURL(server.URL)
	defer func() { httpClient = oldClient }()

	// 3. Test handleGetProducts
	app := fiber.New()
	app.Get("/wc/products", handleGetProducts)

	req := httptest.NewRequest("GET", "/wc/products", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result []map[string]interface{}
	_ = json.NewDecoder(resp.Body).Decode(&result)

	assert.Len(t, result, 1)
	assert.Equal(t, "iPhone 15", result[0]["name"])
}
