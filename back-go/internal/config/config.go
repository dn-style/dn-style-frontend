package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	socketio "github.com/googollee/go-socket.io"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"
	"golang.org/x/sync/singleflight"
)

// Global Variables used across the backend (CORE ONLY)
var (
	HttpClient   *resty.Client
	RedisClient  *redis.Client
	S3Client     *minio.Client
	SocketServer *socketio.Server
	SFGroup      = &singleflight.Group{}

	SiteUrl     string
	WcKey       string
	WcSecret    string
	WcWpUrl     string // URL interna de WordPress (ej: http://localhost:8086)
	CorsOrigins string // Orgenes permitidos separados por coma

	ProductsBucket = "products"
)

// InitHttpClient centraliza la creacin del cliente para permitir actualizaciones en caliente
func InitHttpClient(baseURL string) {
	WcWpUrl = baseURL
	HttpClient = resty.New().
		SetBaseURL(baseURL).
		SetTimeout(10 * time.Second)
	fmt.Printf("[Config]  HTTP Client initialized with: %s\n", baseURL)
}

// UpdateConfig updates multiple global variables at once
func UpdateConfig(params map[string]string) {
	fmt.Printf("[Config]  Processing remote update (%d values)...\n", len(params))

	if val, ok := params["domain"]; ok {
		SiteUrl = val
		fmt.Printf("[Config]  SiteUrl: %s\n", val)
	}
	if val, ok := params["wc_wp_url"]; ok {
		InitHttpClient(val)
	}
	if val, ok := params["wc_key"]; ok {
		WcKey = val
	}
	if val, ok := params["wc_secret"]; ok {
		WcSecret = val
	}
	if val, ok := params["cors_origins"]; ok {
		CorsOrigins = val
	}

	// Variables de entorno crticas
	for k, v := range params {
		fmt.Printf("[Config]  Sync: %s\n", k)
		// Actualizamos variables de entorno para procesos que las lean directamente (DB, SMTP, etc)
		os.Setenv(strings.ToUpper(k), v)
	}
}
