package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func initDB() {
	dsn := os.Getenv("DATABASE_URL")
	var dialector gorm.Dialector

	if dsn == "" {
		fmt.Println("Warning: No DATABASE_URL found, using SQLite (saas_master.db)")
		dialector = sqlite.Open("saas_master.db")
	} else {
		dialector = postgres.Open(dsn)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		log.Fatalf("FAILED TO CONNECT TO DB: %v", err)
	}

	DB = db
	DB.AutoMigrate(&Plan{}, &Tenant{}, &User{}, &AgentInfo{}, &Template{}, &APIKey{})
	seedData()
}

func seedData() {
	// Seed Plans
	DB.Save(&Plan{ID: "basic", Name: "Basic Plan", Price: 29.0, MaxAgents: 1, MaxSeats: 1, PayPalID: "P-5PP12345", Features: "1 Device,1 Administrator Seat,Standard Support"})
	DB.Save(&Plan{ID: "pro", Name: "Pro Network", Price: 99.0, MaxAgents: 10, MaxSeats: 5, PayPalID: "P-86G78901", Features: "10 Devices,5 Team Seats,24/7 Support,Visual Editor"})
	DB.Save(&Plan{ID: "ultra", Name: "Enterprise", Price: 499.0, MaxAgents: 100, MaxSeats: 20, PayPalID: "P-9KK11223", Features: "100 Devices,20 Team Seats,Priority Support,Private Cloud"})

	// Clear existing templates to avoid duplicates on restart
	DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&Template{})

	// SEED MASTER TEMPLATES
	emailDir := "../back/email-templates"
	files, _ := os.ReadDir(emailDir)
	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".hbs") {
			name := strings.ToUpper(strings.TrimSuffix(f.Name(), ".hbs"))
			content, _ := os.ReadFile(emailDir + "/" + f.Name())
			DB.Save(&Template{
				TenantID: "tesla_motors",
				Name:     name,
				HTML:     string(content),
			})
			DB.Save(&Template{
				TenantID: "space_x",
				Name:     name,
				HTML:     string(content),
			})
		}
	}

	// Seed Tenants
	DB.Save(&Tenant{ID: "tesla_motors", Name: "Tesla Motors", PlanID: "pro", Status: "ACTIVE", NextBill: "2026-04-25"})
	DB.Save(&Tenant{ID: "space_x", Name: "Space X", PlanID: "ultra", Status: "ACTIVE", NextBill: "2026-05-10"})

	// Seed Users
	hp, _ := hashPassword("123")
	DB.Save(&User{Email: "admin@tesla.com", Password: hp, TenantID: "tesla_motors"})
	DB.Save(&User{Email: "dev@space-x.com", Password: hp, TenantID: "space_x"})

	// Seed Agents
	configMap := map[string]string{
		"db_name":     "wordpress",
		"db_user":     "wordpress",
		"db_password": "wordpress_password",
		"db_host":     "db",
		"wc_key":      "ck_xxxxxxxxxxxx",
		"wc_secret":   "cs_xxxxxxxxxxxx",
		"jwt_secret":  "secret_v4_2026",
		"domain":      "https://tesla-retiro.com.ar",
		"port":        "4000",
	}
	configJSON, _ := json.Marshal(configMap)
	tagsTesla, _ := json.Marshal([]map[string]string{
		{"label": "CLIENT: TESLA", "color": "#3b82f6"},
		{"label": "LOC: LATAM", "color": "#10b981"},
	})
	DB.Save(&AgentInfo{Token: "token-tesla-1", TenantID: "tesla_motors", SiteID: "sucursal_retiro", Config: string(configJSON), Tags: string(tagsTesla), Lat: -34.593, Lng: -58.375})
}
