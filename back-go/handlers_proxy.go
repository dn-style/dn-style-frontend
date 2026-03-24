package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/minio/minio-go/v7"
)

// handleProxyImages serves images from S3 or local fallback
func handleProxyImages(c *fiber.Ctx) error {
	key := c.Params("*")
	key, _ = url.QueryUnescape(strings.TrimPrefix(key, "/"))

	// Security check for receipts
	if strings.Contains(key, "receipts/") {
		// Log security check
		fmt.Printf("[SECURITY CHECK] ACCESO A COMPROBANTE DETECTADO: %s\n", key)

		authHeader := c.Get("Authorization")
		cookieHeader := c.Get("Cookie")

		if authHeader == "" && cookieHeader == "" {
			return c.Status(401).SendString("No autorizado: Recurso privado")
		}

		// Call PHP bridge (simplified for now, assuming bridge exists in WP)
		bridgeResp, err := httpClient.R().
			SetHeader("Authorization", authHeader).
			SetHeader("Cookie", cookieHeader).
			SetHeader("Host", c.Hostname()).
			Get("/auth-bridge.php")

		if err != nil || bridgeResp.StatusCode() != 200 {
			return c.Status(401).SendString("No autorizado: Sesión inválida")
		}

		var authData struct {
			Authenticated bool `json:"authenticated"`
			IsPrivileged  bool `json:"is_privileged"`
		}
		_ = json.Unmarshal(bridgeResp.Body(), &authData)

		if !authData.Authenticated || !authData.IsPrivileged {
			return c.Status(403).SendString("Prohibido: Permisos insuficientes")
		}

		c.Set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
	}

	// Try S3
	ctx := context.Background()
	obj, err := s3Client.GetObject(ctx, productsBucket, key, minio.GetObjectOptions{})
	if err == nil {
		info, err := obj.Stat()
		if err == nil {
			c.Set("Content-Type", info.ContentType)
			c.Set("Cache-Control", "public, max-age=31536000")
			return c.SendStream(obj)
		}
	}

	// Local fallback
	localPaths := []string{
		filepath.Join(rootDir, "wp_uploads", "wp-content", key),
		filepath.Join(rootDir, "wp_uploads", key),
		filepath.Join(rootDir, "wp_uploads", strings.TrimPrefix(key, "uploads/")),
	}

	for _, lp := range localPaths {
		if _, err := os.Stat(lp); err == nil {
			return c.SendFile(lp)
		}
	}

	return c.Status(404).SendString("Not Found")
}

func handleSSRProduct(c *fiber.Ctx) error {
	id := c.Params("id")
	auth := base64.StdEncoding.EncodeToString([]byte(wcKey + ":" + wcSecret))
	resp, err := httpClient.R().
		SetHeader("Authorization", "Basic "+auth).
		Get("/wp-json/wc/v3/products/" + id)

	if err != nil || resp.StatusCode() != 200 {
		return c.SendFile(filepath.Join(rootDir, "public_html", "index.html"))
	}

	var p map[string]interface{}
	_ = json.Unmarshal(resp.Body(), &p)

	title := fmt.Sprintf("%v", p["name"])
	desc := ""
	if p["short_description"] != nil {
		desc = fmt.Sprintf("%v", p["short_description"])
	}
	img := ""
	if images, ok := p["images"].([]interface{}); ok && len(images) > 0 {
		img = fmt.Sprintf("%v", images[0].(map[string]interface{})["src"])
	}

	return serveWithSEO(c, title, desc, img)
}

func serveWithSEO(c *fiber.Ctx, title, description, image string) error {
	indexPath := filepath.Join(rootDir, "public_html", "index.html")
	b, err := os.ReadFile(indexPath)
	if err != nil {
		return c.Status(500).SendString("Build not found")
	}

	html := string(b)
	fullTitle := title + " | DN shop"

	description = strings.ReplaceAll(description, "<[^>]*>", "")
	description = strings.ReplaceAll(description, "\"", "&quot;")
	description = strings.ReplaceAll(description, "\n", " ")

	html = strings.Replace(html, "<title>", "<title>"+fullTitle+"</title><!--", 1)
	html = strings.Replace(html, "</title>", "-->", 1)

	metaTags := fmt.Sprintf(`
    <meta name="description" content="%s" />
    <meta property="og:title" content="%s" />
    <meta property="og:description" content="%s" />
    <meta property="og:image" content="%s" />
    <meta property="og:type" content="product" />
    <meta name="twitter:card" content="summary_large_image" />
    `, description, fullTitle, description, image)

	return c.Type("html").SendString(strings.Replace(html, "</head>", metaTags+"</head>", 1))
}
