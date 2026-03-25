package util

import (
	"dn-backend-go/internal/config"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRewriteUrls(t *testing.T) {
	config.SiteUrl = "https://dnshop.com.ar"

	input := map[string]interface{}{
		"url": "http://wordpress/wp-content/uploads/image.jpg",
		"items": []interface{}{
			map[string]interface{}{"link": "http://localhost:8086/product/1"},
		},
	}

	result := RewriteUrls(input).(map[string]interface{})

	// Check wordpress replacement
	assert.Equal(t, "https://dnshop.com.ar/images/uploads/image.jpg", result["url"].(string))
	// Check site replacement
	assert.Equal(t, "https://dnshop.com.ar/product/1", result["items"].([]interface{})[0].(map[string]interface{})["link"].(string))
}
