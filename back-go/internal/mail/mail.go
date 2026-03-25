package mail

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/aymerick/raymond"
	"github.com/wneessen/go-mail"
)

// SendOrderEmail sends a status update email using Handlebars templates
func SendOrderEmail(to, orderID, status string, orderData interface{}) error {
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := 587
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")

	// 1. Cargar Template
	templatePath := filepath.Join("templates", "order_status.html")
	tpl, err := os.ReadFile(templatePath)
	if err != nil {
		fmt.Printf("[Mail] ❌ Template not found: %v\n", err)
		return err
	}

	// 2. Renderizar con Handlebars
	html, err := raymond.Render(string(tpl), map[string]interface{}{
		"order_id":   orderID,
		"status":     status,
		"order_data": orderData,
		"site_url":   os.Getenv("SITE_URL"),
	})

	if err != nil {
		fmt.Printf("[Mail] ❌ Error rendering template: %v\n", err)
		return err
	}

	// 3. Enviar
	m := mail.NewMsg()
	if err := m.From(fmt.Sprintf("DN Style < %s >", smtpUser)); err != nil {
		return err
	}
	if err := m.To(to); err != nil {
		return err
	}
	m.Subject(fmt.Sprintf("Actualización de tu pedido #%s", orderID))
	m.SetBodyString(mail.TypeTextHTML, html)

	c, err := mail.NewClient(smtpHost, mail.WithPort(smtpPort), mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(smtpUser), mail.WithPassword(smtpPass))
	if err != nil {
		return err
	}

	return c.DialAndSend(m)
}
