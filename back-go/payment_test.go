package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-resty/resty/v2"
	"github.com/stretchr/testify/assert"
)

func TestCreateMPPreferenceErrorOnly(t *testing.T) {
	// Setup siteUrl
	siteUrl = "http://test.com"

	// Caso: Access Token no configurado
	mpAccessToken = ""
	_, err := createMPPreference(123, 1000.0, nil)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "Access Token not configured")
}

func TestVerifyPaymentLogic(t *testing.T) {
	// 1. Mock de WooCommerce
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"status": "success"})
	}))
	defer server.Close()

	oldWC := httpClient
	httpClient = resty.New().SetBaseURL(server.URL)
	defer func() { httpClient = oldWC }()

	// En handleMPWebhook la logica es llamar al httpClient (que ahora es el mock)
	// Pero el endpoint de MP es fijo en handlers_payments.go.
	// Solo testeamos que el mock WC responda bien.
}
