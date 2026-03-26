package handlers

import (
	"context"
	"dn-backend-go/internal/config"
	"dn-backend-go/internal/util"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

// HandleLogin authenticates a customer with WooCommerce
func HandleLogin(c *fiber.Ctx) error {
	var body map[string]string
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(body).
		Post("/wp-json/jwt-auth/v1/token")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Auth service down"})
	}

	if resp.IsError() {
		return c.Status(resp.StatusCode()).Send(resp.Body())
	}

	// Recuperar perfil usando el token (o el mail) para tener los datos de billing/shipping
	var tokenData struct {
		UserEmail string `json:"user_email"`
	}
	_ = json.Unmarshal(resp.Body(), &tokenData)

	// Iniciar sesin tambin en WC para obtener billing info
	respProf, _ := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("email", tokenData.UserEmail).
		Get("/wp-json/wc/v3/customers")

	var customers []interface{}
	_ = json.Unmarshal(respProf.Body(), &customers)

	return c.JSON(fiber.Map{
		"token":    resp.Body(),
		"customer": util.RewriteUrls(customers[0]),
	})
}

// HandleRegister creates a new customer in WooCommerce
func HandleRegister(c *fiber.Ctx) error {
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid body"})
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(body).
		Post("/wp-json/wc/v3/customers")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Registration failed"})
	}

	return c.Status(resp.StatusCode()).Send(resp.Body())
}

// HandleGetCustomer retrieves customer profile
func HandleGetCustomer(c *fiber.Ctx) error {
	email := c.Query("email")
	cacheKey := "customer:" + email
	ctx := context.Background()

	if config.RedisClient != nil {
		cached, _ := config.RedisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var d interface{}
			_ = json.Unmarshal([]byte(cached), &d)
			return c.JSON(d)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, _ := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("email", email).
		Get("/wp-json/wc/v3/customers")

	var customers []interface{}
	_ = json.Unmarshal(resp.Body(), &customers)

	if len(customers) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Not found"})
	}

	data := util.RewriteUrls(customers[0])
	if config.RedisClient != nil {
		b, _ := json.Marshal(data)
		config.RedisClient.Set(ctx, cacheKey, b, 5*time.Minute)
	}

	return c.JSON(data)
}

// HandleUpdateCustomer updates customer billing/shipping
func HandleUpdateCustomer(c *fiber.Ctx) error {
	id := c.Params("id")
	var body map[string]interface{}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid JSON"})
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(body).
		Put(fmt.Sprintf("/wp-json/wc/v3/customers/%s", id))

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Update failed"})
	}

	return c.Status(resp.StatusCode()).JSON(util.RewriteUrls(resp.Body()))
}

// HandleForgotPassword handles WP password reset email
func HandleForgotPassword(c *fiber.Ctx) error {
	var body map[string]string
	_ = c.BodyParser(&body)
	email := body["user_login"]

	// Proxy a auth bridge de WordPress
	resp, _ := config.HttpClient.R().
		SetBody(map[string]string{"user_login": email}).
		Post("/auth-bridge.php?action=forgot_password")

	return c.Status(resp.StatusCode()).Send(resp.Body())
}
