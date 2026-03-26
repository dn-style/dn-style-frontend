package control

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"dn-backend-go/internal/config"
	"dn-backend-go/internal/plugins"

	"github.com/gorilla/websocket"
)

// Command representa una orden del Control Plane
type Command struct {
	Action  string            `json:"action"`
	Payload map[string]string `json:"payload"`
}

func ConnectToControlPlane() {
	cpURL := os.Getenv("CP_URL")
	agentToken := os.Getenv("AGENT_TOKEN") // Token nico provisto por la SaaS

	if cpURL == "" || agentToken == "" {
		fmt.Println("[Control]  CP_URL or AGENT_TOKEN not set. Remote management disabled.")
		return
	}

	u, _ := url.Parse(cpURL)
	header := make(map[string][]string)
	header["Authorization"] = []string{"Bearer " + agentToken}

	go func() {
		for {
			fmt.Printf("[Control]  Connecting to %s...\n", u.String())
			conn, _, err := websocket.DefaultDialer.Dial(u.String(), header)
			if err != nil {
				fmt.Printf("[Control]  Connection failed: %v. Retrying in 10s...\n", err)
				time.Sleep(10 * time.Second)
				continue
			}

			fmt.Println("[Control]  Connected to Control Plane")

			for {
				_, message, err := conn.ReadMessage()
				if err != nil {
					log.Printf("[Control]  Disconnected: %v\n", err)
					break
				}
				var cmd Command
				if err := json.Unmarshal(message, &cmd); err != nil {
					continue
				}
				handleCommand(cmd)
			}
			conn.Close()
			time.Sleep(5 * time.Second)
		}
	}()
}

func handleCommand(cmd Command) {
	fmt.Printf("[Control]   Executing: %s\n", cmd.Action)

	switch cmd.Action {
	case "CONFIG_UPDATE":
		// Actualizacin genrica de cualquier variable en config
		config.UpdateConfig(cmd.Payload)

		// Tambin SMTP/Env si es necesario
		if smtpUser, ok := cmd.Payload["smtp_user"]; ok {
			os.Setenv("SMTP_USER", smtpUser)
		}
		if smtpPass, ok := cmd.Payload["smtp_pass"]; ok {
			os.Setenv("SMTP_PASS", smtpPass)
		}

	case "ASSET_UPDATE":
		// Comando para descargar e instalar un asset (plugin o template)
		assetURL := cmd.Payload["url"]
		assetType := cmd.Payload["type"] // "plugin" o "template"
		fileName := cmd.Payload["name"]

		go downloadAndInstallAsset(assetType, fileName, assetURL)

	case "PLUGINS_RELOAD":
		fmt.Println("[Control]  Reloading all dynamic plugins...")
		plugins.LoadDynamicPlugins()
	}
}

func downloadAndInstallAsset(assetType, name, downloadURL string) {
	fmt.Printf("[Downloader]  Downloading %s: %s\n", assetType, name)

	resp, err := http.Get(downloadURL)
	if err != nil {
		log.Printf("[Downloader]  Error download: %v\n", err)
		return
	}
	defer resp.Body.Close()

	var targetPath string
	if assetType == "plugin" {
		targetPath = filepath.Join("plugins", name+".so")
	} else if assetType == "template" {
		targetPath = filepath.Join("templates", name+".html")
	} else {
		return
	}

	// Asegurar directorio
	_ = os.MkdirAll(filepath.Dir(targetPath), 0755)

	out, err := os.Create(targetPath)
	if err != nil {
		log.Printf("[Downloader]  Error creating file: %v\n", err)
		return
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	if err != nil {
		log.Printf("[Downloader]  Error writing file: %v\n", err)
		return
	}

	fmt.Printf("[Downloader]  Asset installed: %s\n", targetPath)

	// Si es plugin, gatillamos recarga
	if assetType == "plugin" {
		plugins.LoadDynamicPlugins()
	}
}
