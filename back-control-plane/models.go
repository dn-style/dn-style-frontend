package main

import (
	"time"

	"github.com/gofiber/websocket/v2"
)

// --- MODELS ---

type Plan struct {
	ID        string  `gorm:"primaryKey" json:"id"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	MaxAgents int     `json:"max_agents"`
	MaxSeats  int     `json:"max_seats"`
	PayPalID  string  `json:"paypal_id"`
	Features  string  `json:"features_raw"` // CSV
}

type Tenant struct {
	ID          string `gorm:"primaryKey" json:"id"`
	Name        string `json:"name"`
	PlanID      string `json:"plan_id"`
	Status      string `json:"status" gorm:"default:'TRIAL'"`
	PayPalSubID string `json:"paypal_sub_id" gorm:"column:paypal_sub_id"`
	NextBill    string `json:"next_bill"`
	Plan        Plan   `gorm:"foreignKey:PlanID" json:"plan_details"`
}

type User struct {
	Email    string `gorm:"primaryKey" json:"email"`
	Password string `json:"-"`
	TenantID string `json:"tenant_id"`
	Tenant   Tenant `gorm:"foreignKey:TenantID" json:"tenant_details"`
}

type AgentInfo struct {
	Token    string  `gorm:"primaryKey" json:"token"`
	TenantID string  `json:"tenant_id"`
	SiteID   string  `json:"site_id"`
	Status   string  `json:"status" gorm:"default:'OFFLINE'"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	Config   string  `gorm:"column:config_raw" json:"config_raw"` // JSON string
	Tags     string  `gorm:"column:tags_raw" json:"tags_raw"`
}

type Template struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  string    `json:"tenant_id" gorm:"uniqueIndex:idx_tenant_name"`
	Name      string    `json:"name" gorm:"uniqueIndex:idx_tenant_name"`
	HTML      string    `json:"html"`
	UpdatedAt time.Time `json:"updated_at"`
}

type APIKey struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`              // ej: "Development Key"
	Key       string    `gorm:"unique" json:"key"` // el token real
	Status    string    `gorm:"default:'ACTIVE'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type ActiveAgent struct {
	Conn       *websocket.Conn
	LastSeen   time.Time
	SessionKey []byte
}
