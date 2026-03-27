package main

import (
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"strings"
	"time"

	"github.com/gorilla/websocket"
)

var (
	sessionKey []byte
)

const (
	tokenFile         = "/etc/wooGo-Proxy/token"
	cpFile            = "/etc/wooGo-Proxy/cp_url"
	envPathConfigFile = "/etc/wooGo-Proxy/env_path"
	stateFile         = "/etc/wooGo-Proxy/agent_state.json"
)

func getEnvPath() string {
	pathBytes, err := os.ReadFile(envPathConfigFile)
	if err != nil {
		// Default fallback for legacy or development
		return ".env"
	}
	return strings.TrimSpace(string(pathBytes))
}

func isAllowedKey(key string) bool {
	key = strings.ToUpper(key)
	allowedPrefixes := []string{
		"WP_", "DB_", "WC_", "JWT_", "SERVER_", "API_",
		"REDIS_", "SMTP_", "S3_", "MAIL_", "AWS_", "MINIO_",
		"MYSQL_", "POSTGRES_", "EMAIL_",
	}
	allowedExact := []string{"PORT", "DOMAIN", "DEBUG", "LOG_LEVEL", "SITE_URL", "APP_ENV"}

	for _, p := range allowedPrefixes {
		if strings.HasPrefix(key, p) {
			return true
		}
	}
	for _, e := range allowedExact {
		if key == e {
			return true
		}
	}
	return false
}

func main() {
	cpBytes, _ := os.ReadFile(cpFile)
	cpBase := strings.TrimSpace(string(cpBytes))
	if cpBase == "" {
		cpBase = "http://localhost:5000"
	}

	wsURL := strings.Replace(cpBase, "http", "ws", 1) + "/ws"

	tokenBytes, err := os.ReadFile(tokenFile)
	if err != nil {
		log.Fatalf("ERROR: Token file missing at %s", tokenFile)
	}
	token := strings.TrimSpace(string(tokenBytes))

	log.Printf("wooGo-Proxy Agent v4.3 - Starting service...")
	log.Printf("System Context: %s", getHostname())
	log.Printf("Target Environment: %s", getEnvPath())

	// Verificación de Periodo de Gracia (30 días)
	if err := checkGracePeriod(); err != nil {
		log.Fatalf("CRITICAL: Grace Period Expired or State Corrupt. Node Locked: %v", err)
	}

	interrupt := make(chan os.Signal, 1)
	signal.Notify(interrupt, os.Interrupt)

	for {
		log.Printf("Handshake attempt with Control Plane...")

		header := http.Header{}
		header.Set("Authorization", "Bearer "+token)

		c, _, err := websocket.DefaultDialer.Dial(wsURL, header)
		if err != nil {
			log.Printf("Handshake failed: %v. Retrying in 5s...", err)
			time.Sleep(5 * time.Second)
			continue
		}

		log.Printf("Connection Established. Node Online.")

		done := make(chan struct{})
		go func() {
			defer close(done)
			// Heartbeat Loop (Prevent Janitor Pruning)
			go func() {
				ticker := time.NewTicker(10 * time.Second)
				defer ticker.Stop()
				for {
					select {
					case <-done:
						return
					case <-ticker.C:
						_ = c.WriteMessage(websocket.PingMessage, []byte{})
					}
				}
			}()

			for {
				_, message, err := c.ReadMessage()
				if err != nil {
					log.Printf("CONNECTION_LOST: %v", err)
					return
				}

				var msg struct {
					Action     string      `json:"action"`
					SessionKey string      `json:"session_key"`
					Payload    interface{} `json:"payload"`
				}
				if err := json.Unmarshal(message, &msg); err == nil {
					switch msg.Action {
					case "HANDSHAKE_OK":
						log.Printf("HANDSHAKE_OK: Session established.")
						sessionKey, _ = hex.DecodeString(msg.SessionKey)
						updateSyncTimestamp()

					case "CONFIG_UPDATE":
						payloadStr, ok := msg.Payload.(string)
						if !ok {
							log.Printf("ERROR: Invalid encrypted payload format")
							continue
						}

						decrypted, err := decryptPayload(payloadStr, sessionKey)
						if err != nil {
							log.Printf("DECRYPTION_FAILED: %v", err)
							continue
						}

						var config map[string]string
						if err := json.Unmarshal(decrypted, &config); err == nil {
							log.Printf("NEW_CONFIG_RECEIVED: Received %d identifiers (Encrypted Channel).", len(config))
							if err := reconfigureSystem(config); err == nil {
								log.Printf("RECONFIGURATION_SUCCESS: System state synchronized.")
								updateSyncTimestamp()
							} else {
								log.Printf("RECONFIGURATION_FAILED: %v", err)
							}
						}
					case "TRIGGER_UPDATE":
						log.Println("UPDATE_REQUISITION: CP triggered a secure system update...")
						// Execute the secure updater binary which handles verification
						cmd := exec.Command("/usr/local/bin/wooGo-Proxy-updater")
						go func() {
							if err := cmd.Start(); err != nil {
								log.Printf("UPDATE_TRIGGER_FAILED: %v", err)
							}
						}()
					case "ASSET_UPDATE":
						payloadMap, _ := msg.Payload.(map[string]interface{})
						log.Printf("DEPLOY_REQUISITION: Installing %s/%s", payloadMap["type"], payloadMap["name"])
					}
				}
			}
		}()

		select {
		case <-done:
			log.Printf("Re-initiating handshake protocol in 2s...")
			c.Close()
			time.Sleep(2 * time.Second)
		case <-interrupt:
			log.Println("Shutting down agent.")
			c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
			return
		}
	}
}

func reconfigureSystem(payload map[string]string) error {
	envPath := getEnvPath()
	content, err := os.ReadFile(envPath)
	if err != nil {
		// If file doesn't exist, start with empty content
		content = []byte("")
	}

	lines := strings.Split(string(content), "\n")
	syncCount := 0

	for k, v := range payload {
		if !isAllowedKey(k) {
			log.Printf("SECURITY_WARNING: Blocked unauthorized config key: %s", k)
			continue
		}

		envKey := k
		found := false
		for i, line := range lines {
			if strings.HasPrefix(line, envKey+"=") {
				lines[i] = fmt.Sprintf("%s=%s", envKey, v)
				found = true
				break
			}
		}
		if !found {
			lines = append(lines, fmt.Sprintf("%s=%s", envKey, v))
		}
		syncCount++
	}

	// PORT CONFLICT DETECTION
	if p, exists := payload["PORT"]; exists {
		ln, err := net.Listen("tcp", ":"+p)
		if err != nil {
			log.Printf("PORT_CONFLICT_WARNING: Environment specifies port %s but it is already occupied!", p)
		} else {
			_ = ln.Close()
		}
	}

	err = os.WriteFile(envPath, []byte(strings.Join(lines, "\n")), 0600)
	if err != nil {
		return fmt.Errorf("failed to write .env: %v", err)
	}

	log.Printf("RECONFIGURATION_PROGRESS: Synced %d authorized parameters to %s", syncCount, envPath)

	// AUTO-RESTART WORKLOAD TO APPLY CHANGES
	log.Println("RECONFIGURATION_APPLY: Restarting Workload Core (wooGo-Proxy-core)...")
	exec.Command("systemctl", "restart", "wooGo-Proxy-core").Run()

	return nil
}

func decryptPayload(ciphertextHex string, key []byte) ([]byte, error) {
	if key == nil {
		return nil, fmt.Errorf("no session key")
	}
	ciphertext, _ := hex.DecodeString(ciphertextHex)
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return nil, fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	return gcm.Open(nil, nonce, ciphertext, nil)
}

func checkGracePeriod() error {
	data, err := os.ReadFile(stateFile)
	if err != nil {
		updateSyncTimestamp()
		return nil
	}

	var state struct {
		LastSyncAt string `json:"last_sync_at"`
	}
	json.Unmarshal(data, &state)

	lastSync, err := time.Parse(time.RFC3339, state.LastSyncAt)
	if err != nil {
		return nil
	}

	if time.Since(lastSync) > 30*24*time.Hour {
		log.Printf("GRACE_PERIOD_EXPIRED: Purging secrets and locking node.")
		_ = os.Remove(getEnvPath())
		return fmt.Errorf("node inactive for > 30 days")
	}
	return nil
}

func updateSyncTimestamp() {
	state := struct {
		LastSyncAt string `json:"last_sync_at"`
	}{
		LastSyncAt: time.Now().Format(time.RFC3339),
	}
	b, _ := json.Marshal(state)
	_ = os.WriteFile(stateFile, b, 0644)
}

func getHostname() string {
	h, _ := os.Hostname()
	return h
}
