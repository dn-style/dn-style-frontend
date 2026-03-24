package main

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

func rewriteUrls(data interface{}) interface{} {
	if data == nil {
		return nil
	}
	b, err := json.Marshal(data)
	if err != nil {
		return data
	}
	s := string(b)

	siteUrlBase := siteUrl

	// 1. Regex para capturar wp-content/uploads de cualquier dominio
	// Igual que back.ts: /https?:(\/\/|\\\/\\\/)[^"'\s]+?(\/|\\\/)wp-content(\/|\\\/)uploads/gi
	uploadsRegex := regexp.MustCompile(`https?://[^"'\s]+?/wp-content/uploads`)
	s = uploadsRegex.ReplaceAllString(s, siteUrlBase+"/images/uploads")

	// También para escapes de JSON
	uploadsRegexEscaped := regexp.MustCompile(`https?:\\/\\/[^"'\s]+?\\/wp-content\\/uploads`)
	s = uploadsRegexEscaped.ReplaceAllString(s, siteUrlBase+"/images/uploads")

	// 2. Regex para otros hosts conocidos (wordpress|localhost|10.10.0.3)
	hostRegex := regexp.MustCompile(`https?://(wordpress|localhost|10\.10\.0\.3)(:[0-9]+)?`)
	s = hostRegex.ReplaceAllString(s, siteUrlBase)

	hostRegexEscaped := regexp.MustCompile(`https?:\\/\\/(wordpress|localhost|10\.10\.0\.3)(:[0-9]+)?`)
	s = hostRegexEscaped.ReplaceAllString(s, siteUrlBase)

	var result interface{}
	_ = json.Unmarshal([]byte(s), &result)
	return result
}

func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

func formatCents(val interface{}) string {
	f := 0.0
	switch v := val.(type) {
	case int:
		f = float64(v)
	case int64:
		f = float64(v)
	case float64:
		f = v
	}
	return fmt.Sprintf("%.2f", f)
}

func flushCacheByPattern(ctx context.Context, pattern string) {
	if redisClient == nil {
		return
	}
	keys, err := redisClient.Keys(ctx, pattern).Result()
	if err == nil && len(keys) > 0 {
		redisClient.Del(ctx, keys...)
		fmt.Printf("[Cache] 🧹 Flushed %d keys matching: %s\n", len(keys), pattern)
	}
}
