package main

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestHealthCheck(t *testing.T) {
	app := fiber.New()
	setupRoutes(app)

	req := httptest.NewRequest("GET", "/", nil)
	resp, _ := app.Test(req)

	assert.Equal(t, http.StatusOK, resp.StatusCode)
}

func TestRewriteUrls(t *testing.T) {
	siteUrl = "https://dnshop.com.ar"

	input := map[string]interface{}{
		"url": "http://wordpress/wp-content/uploads/image.jpg",
		"items": []interface{}{
			map[string]interface{}{"link": "http://localhost/product/1"},
		},
	}

	result := rewriteUrls(input).(map[string]interface{})

	// Check wordpress replacement
	assert.Equal(t, "https://dnshop.com.ar/images/uploads/image.jpg", result["url"].(string))
	// Check localhost replacement
	assert.Equal(t, "https://dnshop.com.ar/product/1", result["items"].([]interface{})[0].(map[string]interface{})["link"].(string))
}

func TestContainsHelper(t *testing.T) {
	assert.True(t, contains("hola mundo", "mundo"))
	assert.False(t, contains("hola", "chau"))
}

func TestFormatCentsHelper(t *testing.T) {
	assert.Equal(t, "100.00", formatCents(100))
	assert.Equal(t, "100.50", formatCents(100.50))
}
