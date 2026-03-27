package main

import (
	"dn-backend-go/pkg/orderhook"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type dbInterceptor struct {
	db *gorm.DB
}

// Matches define qu ordenes interceptar
func (d *dbInterceptor) Matches(body map[string]interface{}) bool {
	return true
}

// Execute procesa la orden y usa el DB Toolkit
func (d *dbInterceptor) Execute(orderID interface{}, total float64, body map[string]interface{}) (map[string]interface{}, error) {
	d.ensureDB()
	if d.db == nil {
		return nil, nil
	}

	fmt.Printf("[DB-Toolkit]  Processing order %v\n", orderID)

	// EJEMPLO CRUD: Guardar log de la orden usando el Toolkit (abstraccin)
	d.Create("order_audit", map[string]interface{}{
		"order_id": orderID,
		"total":    total,
		"status":   body["status"],
	})

	return nil, nil
}

// --- DB TOOLKIT CORE ---

func (d *dbInterceptor) ensureDB() {
	if d.db == nil {
		dsn := "host=localhost user=tenant_user password=pass dbname=tenant_db port=5432 sslmode=disable"
		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			d.db = db
			fmt.Println("[DB-Toolkit]  Connected to Private Tenant DB")
			// Automigrate tables if they don't exist (Simple Schema Management)
			d.setupSchema()
		}
	}
}

func (d *dbInterceptor) setupSchema() {
	// Aqu definimos las tablas del tenant de forma dinmica
	d.db.Exec("CREATE TABLE IF NOT EXISTS order_audit (id SERIAL PRIMARY KEY, order_id TEXT, total NUMERIC, status TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
}

// Create abstraction
func (d *dbInterceptor) Create(table string, data map[string]interface{}) {
	d.db.Table(table).Create(data)
	fmt.Printf("[DB-Toolkit]  Inserted into %s\n", table)
}

// Query abstraction (JSON DSL)
// Permitira filtrar por: { "status": "completed", "total": { "gt": 100 } }
func (d *dbInterceptor) Query(table string, jsonQuery string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// Motor de traduccin de JSON DSL a SQL/GORM (Simplificado para el demo)
	query := d.db.Table(table)

	// En produccin aqu procesaramos el JSON para aadir .Where(), .Limit(), etc.
	err := query.Find(&results).Error

	return results, err
}

func (d *dbInterceptor) RawUpdate(table string, id interface{}, data map[string]interface{}) {
	d.db.Table(table).Where("id = ?", id).Updates(data)
}

// OrderHook es la instancia que exportaremos
var OrderHook orderhook.OrderInterceptor = &dbInterceptor{}
