package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/aymerick/raymond"
	"github.com/wneessen/go-mail"
)

func getSenderInfo() string {
	email := os.Getenv("EMAIL_SENDER")
	if email == "" {
		email = os.Getenv("SMTP_USER")
	}
	name := os.Getenv("EMAIL_SENDER_NAME")
	if name == "" {
		name = "DN shop"
	}
	return fmt.Sprintf("\"%s\" <%s>", name, email)
}

func sendEmail(to, subject, htmlContent string) error {
	m := mail.NewMsg()
	if err := m.From(getSenderInfo()); err != nil {
		return err
	}
	if err := m.To(to); err != nil {
		return err
	}
	m.Subject(subject)
	m.SetBodyString(mail.TypeTextHTML, htmlContent)

	host := os.Getenv("SMTP_HOST")
	portStr := os.Getenv("SMTP_PORT")
	port, _ := strconv.Atoi(portStr)
	if port == 0 {
		port = 587
	}
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")

	// Configurar cliente SMTP
	c, err := mail.NewClient(host, mail.WithPort(port), mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(user), mail.WithPassword(pass))
	if err != nil {
		return err
	}

	if os.Getenv("SMTP_SECURE") != "true" {
		c.SetTLSPolicy(mail.NoTLS)
	}

	return c.DialAndSend(m)
}

func sendAdminNotification(subject, content string) error {
	adminEmail := os.Getenv("ADMIN_EMAIL")
	if adminEmail == "" {
		adminEmail = os.Getenv("EMAIL_SENDER")
	}
	if adminEmail == "" {
		adminEmail = os.Getenv("SMTP_USER")
	}

	if adminEmail == "" || !strings.Contains(adminEmail, "@") {
		fmt.Println("[Email Admin] ⚠️ No hay una dirección de correo real para el admin.")
		return nil
	}

	html := fmt.Sprintf(`<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #333;">Notificación de Sistema</h2>
              <p style="font-size: 16px; color: #666;">%s</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #999;">DN Backend-Go</p>
            </div>`, content)

	return sendEmail(adminEmail, "[ADMIN] "+subject, html)
}

func init() {
	raymond.RegisterHelper("eq", func(a, b interface{}) bool {
		return fmt.Sprintf("%v", a) == fmt.Sprintf("%v", b)
	})
}

func renderTemplate(templateName string, data interface{}) (string, error) {
	templatePath := filepath.Join(rootDir, "email-templates", templateName+".hbs")
	if _, err := os.Stat(templatePath); err != nil {
		return "", err
	}

	source, err := os.ReadFile(templatePath)
	if err != nil {
		return "", err
	}

	return raymond.Render(string(source), data)
}
