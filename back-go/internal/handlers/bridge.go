package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"

	"dn-backend-go/internal/config"
	"dn-backend-go/internal/util"

	"github.com/gofiber/fiber/v2"
)

// List of sensitive endpoints that should NEVER be exposed through the bridge
var BlacklistedBridgeResources = []string{
	"users", "settings", "webhooks", "plugins", "themes", "options", "security",
}

// HandleGenericWPProxy provides a hardened bridge to WP/WC REST API
func HandleGenericWPProxy(c *fiber.Ctx) error {
	path := c.Params("*")
	method := c.Method()

	// 1. Hardening: Only GET is allowed via generic bridge for safety
	if method != "GET" {
		return c.Status(405).JSON(fiber.Map{"error": "Only GET method is allowed on generic bridge"})
	}

	// 2. Blacklist check
	for _, res := range BlacklistedBridgeResources {
		if strings.Contains(strings.ToLower(path), res) {
			return c.Status(403).JSON(fiber.Map{"error": "Access to this resource is restricted"})
		}
	}

	// 3. Forward request to WordPress
	auth := base64.StdEncoding.EncodeToString([]byte(config.WcKey + ":" + config.WcSecret))

	// Preservar query params
	targetUrl := fmt.Sprintf("/wp-json/%s", path)
	if queryString := c.Request().URI().QueryString(); len(queryString) > 0 {
		targetUrl += "?" + string(queryString)
	}

	resp, err := config.HttpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get(targetUrl)

	if err != nil {
		fmt.Printf("[Bridge]  Error: %v\n", err)
		return c.Status(500).JSON(fiber.Map{"error": "Error forwarding request to WordPress"})
	}

	// 4. Return response with URL remapping
	c.Status(resp.StatusCode())
	c.Set("Content-Type", "application/json")

	var data interface{}
	_ = json.Unmarshal(resp.Body(), &data)

	return c.JSON(util.RewriteUrls(data))
}
