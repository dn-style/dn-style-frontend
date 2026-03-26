package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"time"

	"dn-backend-go/internal/config"
	"dn-backend-go/internal/util"

	"github.com/gofiber/fiber/v2"
)

// HandleGetProducts retrieves all products from WC
func HandleGetProducts(c *fiber.Ctx) error {
	ctx := context.Background()
	cacheKey := "products:all"

	if config.RedisClient != nil {
		cached, _ := config.RedisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	// Singleflight: solo una peticion a WC si hay multiples concurrentes
	v, err, _ := config.SFGroup.Do(cacheKey, func() (interface{}, error) {
		resp, err := config.HttpClient.R().
			SetHeader("Authorization", "Basic "+auth).
			Get("/wp-json/wc/v3/products?per_page=100")

		if err != nil {
			return nil, err
		}

		var raw interface{}
		_ = json.Unmarshal(resp.Body(), &raw)
		data := util.RewriteUrls(raw)

		if config.RedisClient != nil {
			b, _ := json.Marshal(data)
			config.RedisClient.Set(ctx, cacheKey, b, 1*time.Hour)
		}
		return data, nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching products"})
	}

	return c.JSON(v)
}

// HandleGetProduct retrieves a single product from WC
func HandleGetProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	cacheKey := "product:" + id
	ctx := context.Background()

	if config.RedisClient != nil {
		cached, _ := config.RedisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	v, err, _ := config.SFGroup.Do(cacheKey, func() (interface{}, error) {
		resp, err := config.HttpClient.R().
			SetHeader("Authorization", "Basic "+auth).
			Get("/wp-json/wc/v3/products/" + id)

		if err != nil {
			return nil, err
		}

		var raw interface{}
		_ = json.Unmarshal(resp.Body(), &raw)
		data := util.RewriteUrls(raw)

		if config.RedisClient != nil {
			b, _ := json.Marshal(data)
			config.RedisClient.Set(ctx, cacheKey, b, 1*time.Hour)
		}
		return data, nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Product not found"})
	}

	return c.JSON(v)
}

// HandleGetProductVariations retrieves variations for a product
func HandleGetProductVariations(c *fiber.Ctx) error {
	id := c.Params("id")
	cacheKey := "variations:" + id
	ctx := context.Background()

	if config.RedisClient != nil {
		cached, _ := config.RedisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	v, err, _ := config.SFGroup.Do(cacheKey, func() (interface{}, error) {
		resp, err := config.HttpClient.R().
			SetHeader("Authorization", "Basic "+auth).
			Get("/wp-json/wc/v3/products/" + id + "/variations")

		if err != nil {
			return nil, err
		}

		var raw interface{}
		_ = json.Unmarshal(resp.Body(), &raw)
		data := util.RewriteUrls(raw)

		if config.RedisClient != nil {
			b, _ := json.Marshal(data)
			config.RedisClient.Set(ctx, cacheKey, b, 1*time.Hour)
		}
		return data, nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Variations not found"})
	}

	return c.JSON(v)
}

// HandleGetCategories retrieves all categories from WC
func HandleGetCategories(c *fiber.Ctx) error {
	ctx := context.Background()
	cacheKey := "categories:all"

	if config.RedisClient != nil {
		cached, _ := config.RedisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	v, err, _ := config.SFGroup.Do(cacheKey, func() (interface{}, error) {
		resp, err := config.HttpClient.R().
			SetHeader("Authorization", "Basic "+auth).
			Get("/wp-json/wc/v3/products/categories?per_page=100")

		if err != nil {
			return nil, err
		}

		var raw interface{}
		_ = json.Unmarshal(resp.Body(), &raw)
		data := util.RewriteUrls(raw)

		if config.RedisClient != nil {
			b, _ := json.Marshal(data)
			config.RedisClient.Set(ctx, cacheKey, b, 24*time.Hour)
		}
		return data, nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Categories error"})
	}

	return c.JSON(v)
}

// HandleValidateCoupon checks if a coupon is valid and returns its value
func HandleValidateCoupon(c *fiber.Ctx) error {
	code := c.Query("code")
	if code == "" {
		return c.Status(400).JSON(fiber.Map{"valid": false, "message": "Cdigo vaco"})
	}

	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))
	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("code", code).
		Get("/wp-json/wc/v3/coupons")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"valid": false, "message": "Error al validar cupn"})
	}

	var coupons []map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &coupons)

	if len(coupons) == 0 {
		return c.JSON(fiber.Map{"valid": false, "message": "Cupn invlido"})
	}

	coupon := coupons[0]

	// Verificar fecha de expiracin
	if dateExp, ok := coupon["date_expires"].(string); ok && dateExp != "" {
		expires, _ := time.Parse("2006-01-02T15:04:05", dateExp)
		if time.Now().After(expires) {
			return c.JSON(fiber.Map{"valid": false, "message": "Cupn expirado"})
		}
	}

	return c.JSON(fiber.Map{
		"valid":          true,
		"amount":         coupon["amount"],
		"discount_type":  coupon["discount_type"],
		"code":           coupon["code"],
		"nominal_amount": coupon["amount"],
	})
}
