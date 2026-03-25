package util

import (
	"context"
	"dn-backend-go/internal/config"
	"encoding/json"
	"fmt"
	"regexp"
)

// RewriteUrls normalizes URLs from WordPress for the frontend
func RewriteUrls(data interface{}) interface{} {
	if data == nil {
		return nil
	}

	raw, _ := json.Marshal(data)
	s := string(raw)

	// SEO Parity: Remapeo de Uploads de WordPress a Proxy Local
	uploadsPattern := `https?:(?:\\\/\\\/|//)[^"'\s]+?(?:\\\/|/)wp-content(?:\\\/|/)uploads`
	re := regexp.MustCompile(uploadsPattern)
	s = re.ReplaceAllString(s, config.SiteUrl+"/images/uploads")

	// Remapeo de enlaces internos del sitio
	sitePattern := `https?:(?:\\\/\\\/|//)localhost:8086`
	reSite := regexp.MustCompile(sitePattern)
	s = reSite.ReplaceAllString(s, config.SiteUrl)

	var result interface{}
	_ = json.Unmarshal([]byte(s), &result)
	return result
}

// FlushCacheByPattern flushes Redis keys matching a pattern
func FlushCacheByPattern(pattern string) {
	if config.RedisClient == nil {
		return
	}
	ctx := context.Background()
	iter := config.RedisClient.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		config.RedisClient.Del(ctx, iter.Val())
	}
}

// SendAdminNotification sends an internal notification email (placeholder)
func SendAdminNotification(subject, message string) error {
	fmt.Printf("[Notification] Admin Email: %s - %s\n", subject, message)
	return nil
}
