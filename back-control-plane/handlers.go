package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	fiber_ws "github.com/gofiber/websocket/v2"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/websocket"
	"golang.org/x/crypto/bcrypt"
)

func handleLogin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).SendString("Invalid body")
	}

	var user User
	if err := DB.Preload("Tenant.Plan").First(&user, "email = ?", req.Email).Error; err != nil {
		return c.Status(401).SendString("Invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(401).SendString("Invalid credentials")
	}

	return c.JSON(fiber.Map{
		"email":  user.Email,
		"tenant": user.TenantID,
		"token":  generateToken(user),
		"plan": fiber.Map{
			"max_agents": user.Tenant.Plan.MaxAgents,
			"max_seats":  user.Tenant.Plan.MaxSeats,
			"name":       user.Tenant.Plan.Name,
		},
	})
}

func handleBilling(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var tenant Tenant
	if err := DB.Preload("Plan").First(&tenant, "id = ?", tenantID).Error; err != nil {
		return c.Status(404).SendString("Tenant not found")
	}

	var allPlans []Plan
	DB.Find(&allPlans)

	return c.JSON(fiber.Map{
		"current_plan":  tenant.Plan,
		"status":        tenant.Status,
		"paypal_sub_id": tenant.PayPalSubID,
		"next_bill":     tenant.NextBill,
		"all_plans":     allPlans,
	})
}

func handleOnlineAgents(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var agents []AgentInfo
	DB.Find(&agents, "tenant_id = ?", tenantID)

	result := []map[string]interface{}{}
	for _, a := range agents {
		mutex.RLock()
		agent, online := activeAgents[a.Token]
		mutex.RUnlock()
		status := "OFFLINE"
		if online && agent != nil {
			status = "ONLINE"
		}

		result = append(result, map[string]interface{}{
			"token":  a.Token,
			"site":   a.SiteID,
			"status": status,
			"tenant": a.TenantID,
			"lat":    a.Lat,
			"lng":    a.Lng,
			"config": a.Config,
			"tags":   a.Tags,
		})
	}
	return c.JSON(result)
}

func handleCreateAgent(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var a AgentInfo
	c.BodyParser(&a)
	a.TenantID = tenantID
	a.Token = "at_" + secureToken(16) + "_" + a.TenantID
	a.Status = "OFFLINE"

	defaultConfig := map[string]string{
		"DB_NAME":       "app_db",
		"DB_USER":       "root",
		"DB_PASSWORD":   "password",
		"DB_HOST":       "localhost",
		"WC_KEY":        "",
		"WC_SECRET":     "",
		"JWT_SECRET":    "jwt_secret_here",
		"DOMAIN":        "",
		"PORT":          "80",
		"REDIS_HOST":    "127.0.0.1",
		"REDIS_PORT":    "6379",
		"S3_ENDPOINT":   "",
		"S3_BUCKET":     "",
		"S3_ACCESS_KEY": "",
		"S3_SECRET_KEY": "",
		"SMTP_HOST":     "",
		"SMTP_PORT":     "587",
		"SMTP_USER":     "",
		"SMTP_PASS":     "",
		"SMTP_SECURE":   "true",
		"EMAIL_SENDER":  "",
	}
	confJSON, _ := json.Marshal(defaultConfig)
	a.Config = string(confJSON)

	DB.Create(&a)
	return c.JSON(a)
}

func handleDeleteAgent(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	token := c.Query("token")
	if err := DB.Where("token = ? AND tenant_id = ?", token, tenantID).Delete(&AgentInfo{}).Error; err != nil {
		return c.Status(500).SendString("Failed to remove agent")
	}

	mutex.Lock()
	delete(activeAgents, token)
	mutex.Unlock()

	return c.SendStatus(204)
}

func handleUpdateTags(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var req struct {
		Token string `json:"token"`
		Tags  string `json:"tags"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).SendString("Invalid body")
	}

	var agent AgentInfo
	if err := DB.First(&agent, "token = ? AND tenant_id = ?", req.Token, tenantID).Error; err != nil {
		return c.Status(403).SendString("Unauthorized")
	}

	DB.Model(&agent).Update("tags_raw", req.Tags)
	return c.JSON(fiber.Map{"status": "ok", "tags": req.Tags})
}

func handlePushConfig(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var req struct {
		Token  string            `json:"token"`
		Config map[string]string `json:"config"`
	}
	c.BodyParser(&req)

	var agent AgentInfo
	if err := DB.First(&agent, "token = ? AND tenant_id = ?", req.Token, tenantID).Error; err != nil {
		return c.Status(403).SendString("Unauthorized")
	}

	configJSON, _ := json.Marshal(req.Config)
	DB.Model(&agent).Update("config_raw", string(configJSON))

	mutex.RLock()
	aa, exists := activeAgents[req.Token]
	mutex.RUnlock()

	if exists && aa != nil && aa.Conn != nil && aa.SessionKey != nil {
		encrypted, _ := encryptPayload(configJSON, aa.SessionKey)
		msg, _ := json.Marshal(map[string]interface{}{"action": "CONFIG_UPDATE", "payload": encrypted})
		aa.Conn.WriteMessage(websocket.TextMessage, msg)
	}

	return c.JSON(fiber.Map{"status": "ok"})
}

func handleTriggerUpdate(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var req struct {
		Token string `json:"token"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).SendString("Invalid request")
	}

	var agent AgentInfo
	if err := DB.First(&agent, "token = ? AND tenant_id = ?", req.Token, tenantID).Error; err != nil {
		return c.Status(403).SendString("Unauthorized")
	}

	mutex.Lock()
	a, ok := activeAgents[req.Token]
	mutex.Unlock()

	if !ok {
		return c.Status(404).SendString("Agent offline")
	}

	msg, _ := json.Marshal(map[string]interface{}{"action": "TRIGGER_UPDATE"})
	a.Conn.WriteMessage(websocket.TextMessage, msg)

	return c.JSON(fiber.Map{"status": "Update sequence initiated for node " + req.Token})
}

func handleUsage(c *fiber.Ctx) error {
	u := c.Locals("user").(*jwt.Token)
	claims := u.Claims.(jwt.MapClaims)
	tenantID := claims["tenant"].(string)

	var tenant Tenant
	DB.Preload("Plan").First(&tenant, "id = ?", tenantID)

	var agentCount int64
	DB.Model(&AgentInfo{}).Where("tenant_id = ?", tenantID).Count(&agentCount)

	var userCount int64
	DB.Model(&User{}).Where("tenant_id = ?", tenantID).Count(&userCount)

	return c.JSON(fiber.Map{
		"agents_used": agentCount,
		"agents_max":  tenant.Plan.MaxAgents,
		"seats_used":  userCount,
		"seats_max":   tenant.Plan.MaxSeats,
		"plan_name":   tenant.Plan.Name,
	})
}

func handleAgentConnection(c *fiber_ws.Conn) {
	token := strings.TrimPrefix(c.Headers("Authorization"), "Bearer ")
	var info AgentInfo
	if err := DB.First(&info, "token = ?", token).Error; err != nil {
		return
	}

	sessionKey := make([]byte, 32)
	rand.Read(sessionKey)

	mutex.Lock()
	activeAgents[token] = &ActiveAgent{
		Conn:       c,
		LastSeen:   time.Now(),
		SessionKey: sessionKey,
	}
	c.SetPingHandler(func(appData string) error {
		mutex.Lock()
		if a, ok := activeAgents[token]; ok {
			a.LastSeen = time.Now()
		}
		mutex.Unlock()
		return nil
	})
	mutex.Unlock()

	handshake, _ := json.Marshal(map[string]interface{}{
		"action":      "HANDSHAKE_OK",
		"session_key": hex.EncodeToString(sessionKey),
	})
	c.WriteMessage(websocket.TextMessage, handshake)

	var config map[string]string
	json.Unmarshal([]byte(info.Config), &config)
	configBytes, _ := json.Marshal(config)
	encrypted, _ := encryptPayload(configBytes, sessionKey)

	msg, _ := json.Marshal(map[string]interface{}{"action": "CONFIG_UPDATE", "payload": encrypted})
	c.WriteMessage(websocket.TextMessage, msg)

	defer func() {
		mutex.Lock()
		delete(activeAgents, token)
		mutex.Unlock()
		c.Close()
	}()

	for {
		if _, _, err := c.ReadMessage(); err != nil {
			break
		}
		mutex.Lock()
		if a, ok := activeAgents[token]; ok {
			a.LastSeen = time.Now()
		}
		mutex.Unlock()
	}
}

func handlePaypalWebhook(c *fiber.Ctx) error {
	var event struct {
		EventType string `json:"event_type"`
		Resource  struct {
			ID       string `json:"id"`
			PlanID   string `json:"plan_id"`
			TenantID string `json:"tenant_id"`
		} `json:"resource"`
	}
	c.BodyParser(&event)

	if event.EventType == "BILLING.SUBSCRIPTION.ACTIVATED" {
		DB.Model(&Tenant{}).Where("id = ?", event.Resource.TenantID).Updates(map[string]interface{}{
			"status":        "ACTIVE",
			"plan_id":       event.Resource.PlanID,
			"paypal_sub_id": event.Resource.ID,
		})
	}
	return c.SendStatus(200)
}
func handleMarketPlugins(c *fiber.Ctx) error {
	plugins := []string{}
	files, err := os.ReadDir("./assets/plugins")
	if err != nil {
		return c.JSON(plugins)
	}

	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".so") {
			plugins = append(plugins, strings.TrimSuffix(f.Name(), ".so"))
		}
	}
	return c.JSON(plugins)
}
