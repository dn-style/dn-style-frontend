package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"time"

	"github.com/gofiber/fiber/v2"
)

// handleLogin calls WooCommerce JWT Auth
func handleLogin(c *fiber.Ctx) error {
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid body"})
	}

	resp, err := httpClient.R().
		SetBody(body).
		Post("/wp-json/jwt-auth/v1/token")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(resp.StatusCode()).Send(resp.Body())
}

// handleRegister registers a customer
func handleRegister(c *fiber.Ctx) error {
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid body"})
	}

	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))

	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(body).
		Post("/wp-json/wc/v3/customers")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": err.Error()})
	}

	return c.Status(resp.StatusCode()).Send(resp.Body())
}

// handleGetCustomer gets a customer profile
func handleGetCustomer(c *fiber.Ctx) error {
	email := c.Query("email")
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))

	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("email", email).
		Get("/wp-json/wc/v3/customers")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Error"})
	}

	var customers []interface{}
	_ = json.Unmarshal(resp.Body(), &customers)

	if len(customers) > 0 {
		return c.JSON(rewriteUrls(customers[0]))
	}

	return c.JSON(fiber.Map{})
}

// handleUpdateCustomer updates a customer profile
func handleUpdateCustomer(c *fiber.Ctx) error {
	id := c.Params("id")
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))

	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(c.Body()).
		Put("/wp-json/wc/v3/customers/" + id)

	if err != nil || resp.StatusCode() != 200 {
		return c.Status(500).JSON(fiber.Map{"message": "Error al actualizar perfil"})
	}

	var raw interface{}
	_ = json.Unmarshal(resp.Body(), &raw)
	return c.Status(resp.StatusCode()).JSON(rewriteUrls(raw))
}

func handleForgotPassword(c *fiber.Ctx) error {
	var body struct {
		Email string `json:"email"`
	}
	if err := c.BodyParser(&body); err != nil || body.Email == "" {
		return c.Status(400).SendString("Invalid body or email")
	}

	resetLink := fmt.Sprintf("%s/reset-password?email=%s&token=simulated-token", siteUrl, url.QueryEscape(body.Email))

	data := map[string]interface{}{
		"email":      body.Email,
		"reset_link": resetLink,
		"year":       time.Now().Year(),
	}

	html, err := renderTemplate("reset-password", data)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Error al renderizar plantilla: " + err.Error()})
	}

	err = sendEmail(body.Email, "Recuperar Contraseña - DN shop", html)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Error al enviar el correo: " + err.Error()})
	}

	return c.JSON(fiber.Map{"sent": true})
}
