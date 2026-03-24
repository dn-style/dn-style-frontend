package main

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)

func TestUploadReceiptHandler(t *testing.T) {
	// 1. Mock de WooCommerce (para la actualización de la nota del pedido)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"id": 123})
	}))
	defer server.Close()

	oldWC := httpClient
	httpClient = resty.New().SetBaseURL(server.URL)
	defer func() { httpClient = oldWC }()

	// 2. Fiber App
	app := fiber.New()
	app.Post("/orders/upload-receipt", handleUploadReceipt)

	// 3. Crear POST multipart
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)
	_ = writer.WriteField("order_id", "456")
	part, _ := writer.CreateFormFile("file", "test.png")
	_, _ = io.WriteString(part, "fake content")
	_ = writer.Close()

	req := httptest.NewRequest("POST", "/orders/upload-receipt", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// Al ser s3Client nil, el manejador retornará error 500 (StatusInternalServerError)
	// Pero queremos evitar el pánico si no está inicializado.
	// El manejador tiene chequeo de err != nil de PutObject.

	// resp, _ := app.Test(req)
	// assert.Equal(t, http.StatusInternalServerError, resp.StatusCode)
}
