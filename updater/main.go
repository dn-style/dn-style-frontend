package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

const (
	// PublicKeyHex is hardcoded to ensure only binaries signed by the owner are accepted.
	// Even if the Control Plane is compromised, the attacker cannot sign a malicious binary.
	PublicKeyHex = "75448992456233fd72ebe8fec97cf400cf73b9215a6b256ddfc0a0101e77bd7e"
	BinaryDest   = "/usr/local/bin/wooGo-Proxy"
	CPFile       = "/etc/wooGo-Proxy/cp_url"
)

type Manifest struct {
	BinaryName string `json:"binary_name"`
	Version    string `json:"version"`
	SHA256     string `json:"sha256"`
	Signature  string `json:"signature"`
}

func main() {
	log.Println("--- wooGo-Proxy SECURE UPDATER v4.3 ---")

	// 1. Get CP URL
	cpBytes, err := os.ReadFile(CPFile)
	if err != nil {
		log.Fatalf("Update Failed: Control Plane URL missing at %s", CPFile)
	}
	cpURL := strings.TrimSpace(string(cpBytes))

	// 2. Download Manifest
	manifestURL := cpURL + "/assets/bin/manifest.json"
	log.Printf("Fetching update manifest from: %s", manifestURL)

	resp, err := http.Get(manifestURL)
	if err != nil || resp.StatusCode != 200 {
		log.Fatalf("Update Failed: Could not fetch manifest from %s", manifestURL)
	}
	defer resp.Body.Close()

	var manifest Manifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		log.Fatalf("Update Failed: Corrupt manifest format")
	}

	log.Printf("Manifest Received: Version %s", manifest.Version)

	// 3. Verify Signature (Zero-Trust Check)
	pubKeyBytes, _ := hex.DecodeString(PublicKeyHex)
	pubKey := ed25519.PublicKey(pubKeyBytes)

	signatureBytes, _ := hex.DecodeString(manifest.Signature)
	msg := fmt.Sprintf("%s|%s", manifest.Version, manifest.SHA256)

	if !ed25519.Verify(pubKey, []byte(msg), signatureBytes) {
		log.Fatalf("SECURITY_CRITICAL: Manifest Signature Verification FAILED. Update Aborted.")
	}
	log.Println("Manifest Signature: VALID (Authenticated by Developer Key)")

	// 4. Download Binary
	binaryURL := cpURL + "/assets/bin/" + manifest.BinaryName
	tmpPath := BinaryDest + ".next"
	log.Printf("Downloading signed binary: %s", binaryURL)

	out, err := os.Create(tmpPath)
	if err != nil {
		log.Fatalf("Update Failed: Could not create temporary file: %v", err)
	}
	defer out.Close()

	resp, err = http.Get(binaryURL)
	if err != nil || resp.StatusCode != 200 {
		log.Fatalf("Update Failed: Binary download error")
	}
	defer resp.Body.Close()

	if _, err = io.Copy(out, resp.Body); err != nil {
		log.Fatalf("Update Failed: Download transfer error: %v", err)
	}
	out.Close()

	// 5. Verify Binary Hash (Integrity Check)
	binData, _ := os.ReadFile(tmpPath)
	h := sha256.Sum256(binData)
	computedHash := hex.EncodeToString(h[:])

	if computedHash != manifest.SHA256 {
		os.Remove(tmpPath)
		log.Fatalf("SECURITY_CRITICAL: Binary Hash Mismatch. Expected: %s, Computed: %s. Aborting.", manifest.SHA256, computedHash)
	}
	log.Println("Binary Integrity: VERIFIED (Match Hash)")

	// 6. Apply Update
	log.Println("Applying update (Replacing Native Binary)...")
	if err := os.Rename(tmpPath, BinaryDest); err != nil {
		log.Fatalf("Apply Failed (FS Lock? Check Permissions): %v", err)
	}
	os.Chmod(BinaryDest, 0755)

	// 7. Restart Service
	log.Println("Reloading wooGo-Proxy systemd unit...")
	restartCmd := exec.Command("systemctl", "restart", "wooGo-Proxy")
	if err := restartCmd.Run(); err != nil {
		log.Printf("Warning: Service restart failed, may need manual attention: %v", err)
	}

	log.Printf("--- UPDATE SUCCESSFUL: wooGo-Proxy is now version %s ---", manifest.Version)
}
