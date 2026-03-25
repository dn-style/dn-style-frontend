package config

import (
	"github.com/go-resty/resty/v2"
	socketio "github.com/googollee/go-socket.io"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"
)

// Global Variables used across the backend
var (
	HttpClient   *resty.Client
	RedisClient  *redis.Client
	S3Client     *minio.Client
	SocketServer *socketio.Server

	SiteUrl  string
	WcKey    string
	WcSecret string

	ProductsBucket = "products"
)
