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

func TestCheckReviewHandler(t *testing.T) {
	// 1. Mock de WooCommerce
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode([]interface{}{map[string]interface{}{"id": 1}})
	}))
	defer server.Close()

	oldWC := httpClient
	httpClient = resty.New().SetBaseURL(server.URL)
	defer func() { httpClient = oldWC }()

	// 2. Fiber App
	app := fiber.New()
	app.Get("/wc/reviews/check", handleCheckReview)

	// 3. Test
	req := httptest.NewRequest("GET", "/wc/reviews/check?product_id=1&email=test@test.com", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	var result map[string]bool
	_ = json.NewDecoder(resp.Body).Decode(&result)

	assert.True(t, result["hasReviewed"])
}
