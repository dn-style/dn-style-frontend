package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

var (
	jwtSecret     = []byte("dn-heavy-industrial-secret-2026")
	defaultDomain = "https://woogo.system4us.com"
)

func getSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		return jwtSecret
	}
	return []byte(s)
}

func secureToken(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("at_%d", time.Now().Unix())
	}
	return hex.EncodeToString(b)
}

func encryptPayload(plaintext []byte, key []byte) (string, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return hex.EncodeToString(ciphertext), nil
}

func generateToken(user User) string {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":     user.Email,
		"tenant":    user.TenantID,
		"plan":      user.Tenant.PlanID,
		"plan_name": user.Tenant.Plan.Name,
		"iat":       time.Now().Unix(),
		"exp":       time.Now().Add(time.Hour * 24).Unix(),
	})
	t, _ := token.SignedString(getSecret())
	return t
}

func maskConfig(raw string) string {
	var m map[string]string
	if err := json.Unmarshal([]byte(raw), &m); err != nil {
		return "{}"
	}
	for k, v := range m {
		if len(v) > 4 {
			m[k] = v[:3] + "********"
		} else {
			m[k] = "********"
		}
	}
	b, _ := json.Marshal(m)
	return string(b)
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}
