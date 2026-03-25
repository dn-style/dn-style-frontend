package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
)

func handleGetProductReviews(c *fiber.Ctx) error {
	id := c.Params("id")
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, _ := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("product", id).
		Get("/wp-json/wc/v3/products/reviews")

	var data interface{}
	_ = json.Unmarshal(resp.Body(), &data)
	return c.JSON(rewriteUrls(data))
}

func handleGetProductVariations(c *fiber.Ctx) error {
	id := c.Params("id")
	cacheKey := "variations:" + id
	ctx := context.Background()

	if redisClient != nil {
		cached, _ := redisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, _ := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get("/wp-json/wc/v3/products/" + id + "/variations")

	var raw interface{}
	_ = json.Unmarshal(resp.Body(), &raw)
	data := rewriteUrls(raw)

	if redisClient != nil {
		b, _ := json.Marshal(data)
		redisClient.Set(ctx, cacheKey, b, 1*time.Hour)
	}

	return c.JSON(data)
}

func handleGetProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	cacheKey := "product:" + id
	ctx := context.Background()

	if redisClient != nil {
		cached, _ := redisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get("/wp-json/wc/v3/products/" + id)

	if err != nil || resp.StatusCode() != 200 {
		return c.Status(404).JSON(fiber.Map{"error": true})
	}

	var raw interface{}
	_ = json.Unmarshal(resp.Body(), &raw)
	data := rewriteUrls(raw)

	if redisClient != nil {
		b, _ := json.Marshal(data)
		redisClient.Set(ctx, cacheKey, b, 1*time.Hour)
	}

	return c.JSON(data)
}

func handleGetProducts(c *fiber.Ctx) error {
	queryParams := c.Queries()
	cacheKey := "products:" + fmt.Sprintf("%v", queryParams)
	ctx := context.Background()

	if redisClient != nil {
		cached, _ := redisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParams(queryParams).
		Get("/wp-json/wc/v3/products")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": true})
	}

	var raw interface{}
	_ = json.Unmarshal(resp.Body(), &raw)
	data := rewriteUrls(raw)

	if redisClient != nil {
		b, _ := json.Marshal(data)
		redisClient.Set(ctx, cacheKey, b, 5*time.Minute)
	}

	return c.JSON(data)
}

func handleGetCategories(c *fiber.Ctx) error {
	force := c.Query("force") == "true"
	queryParams := c.Queries()
	cacheKey := "categories:" + fmt.Sprintf("%v", queryParams)
	ctx := context.Background()

	if !force && redisClient != nil {
		cached, _ := redisClient.Get(ctx, cacheKey).Result()
		if cached != "" {
			var data interface{}
			_ = json.Unmarshal([]byte(cached), &data)
			return c.JSON(data)
		}
	}

	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParams(queryParams).
		Get("/wp-json/wc/v3/products/categories")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": true})
	}

	var rawCategories []map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &rawCategories)

	categories := make([]map[string]interface{}, 0)
	for _, cat := range rawCategories {
		img := interface{}(nil)
		if cat["image"] != nil {
			img = cat["image"].(map[string]interface{})["src"]
		}
		categories = append(categories, map[string]interface{}{
			"id":     cat["id"],
			"name":   cat["name"],
			"slug":   cat["slug"],
			"parent": cat["parent"],
			"image":  img,
		})
	}

	data := rewriteUrls(categories)
	if redisClient != nil {
		b, _ := json.Marshal(data)
		redisClient.Set(ctx, cacheKey, b, 1*time.Hour)
	}

	return c.JSON(data)
}

// handleCheckReview checks if a customer has reviewed a product
func handleCheckReview(c *fiber.Ctx) error {
	productID := c.Query("product_id")
	email := c.Query("email")
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))

	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetQueryParam("product", productID).
		SetQueryParam("reviewer_email", email).
		Get("/wp-json/wc/v3/products/reviews")

	if err != nil {
		return c.JSON(fiber.Map{"hasReviewed": false})
	}

	var reviews []interface{}
	_ = json.Unmarshal(resp.Body(), &reviews)
	return c.JSON(fiber.Map{"hasReviewed": len(reviews) > 0})
}

// handleCreateReview creates a review
func handleCreateReview(c *fiber.Ctx) error {
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		SetBody(c.Body()).
		Post("/wp-json/wc/v3/products/reviews")

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Error al enviar reseña"})
	}

	return c.Status(resp.StatusCode()).Send(resp.Body())
}
