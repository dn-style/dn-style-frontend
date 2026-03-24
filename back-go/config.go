package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/joho/godotenv"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/redis/go-redis/v9"
)

var (
	redisClient    *redis.Client
	s3Client       *minio.Client
	httpClient     *resty.Client
	isVerbose      bool
	rootDir        string
	siteUrl        string
	productsBucket string
	wcKey          string
	wcSecret       string
	mpAccessToken  string
)

func initClients() {
	_ = godotenv.Load()

	isVerbose = os.Getenv("VERBOSE_DEBUG") == "true"
	siteUrl = os.Getenv("SITE_URL")
	if siteUrl == "" {
		siteUrl = "https://dnshop.com.ar"
	}
	productsBucket = os.Getenv("STORAGE_BUCKET_PRODUCTS")
	if productsBucket == "" {
		productsBucket = "products"
	}
	wcKey = os.Getenv("WC_KEY")
	wcSecret = os.Getenv("WC_SECRET")
	mpAccessToken = os.Getenv("MP_ACCESS_TOKEN")

	ex, err := os.Executable()
	if err != nil {
		rootDir = "."
	} else {
		rootDir = filepath.Dir(ex)
	}

	// Redis
	redisUrl := os.Getenv("REDIS_URL")
	if redisUrl == "" {
		redisUrl = "redis://host.docker.internal:6379"
	}
	opt, err := redis.ParseURL(redisUrl)
	if err == nil {
		redisClient = redis.NewClient(opt)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if _, err := redisClient.Ping(ctx).Result(); err == nil {
			fmt.Println("✅ Conectado a Redis")
		}
	}

	// S3
	s3Endpoint := os.Getenv("S3_ENDPOINT")
	if s3Endpoint == "" {
		s3Endpoint = "host.docker.internal:9000"
	}
	s3Endpoint = strings.TrimPrefix(s3Endpoint, "http://")
	s3Endpoint = strings.TrimPrefix(s3Endpoint, "https://")
	s3AccessKey := os.Getenv("S3_ACCESS_KEY_ID")
	s3SecretKey := os.Getenv("S3_SECRET_ACCESS_KEY")
	s3UseSSL := os.Getenv("S3_SECURE") == "true"

	s3Client, err = minio.New(s3Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(s3AccessKey, s3SecretKey, ""),
		Secure: s3UseSSL,
	})
	if err == nil {
		ensureBucketExists()
	}

	// WooCommerce
	httpClient = resty.New().
		SetBaseURL("http://wordpress").
		SetHeader("Accept", "application/json")
}

func ensureBucketExists() {
	exists, err := s3Client.BucketExists(context.Background(), productsBucket)
	if err == nil && !exists {
		_ = s3Client.MakeBucket(context.Background(), productsBucket, minio.MakeBucketOptions{})
	}
}
