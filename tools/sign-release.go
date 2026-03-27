package main

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type Manifest struct {
	BinaryName string `json:"binary_name"`
	Version    string `json:"version"`
	SHA256     string `json:"sha256"`
	Signature  string `json:"signature"`
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run tools/sign-release.go <binary_path> [version]")
		return
	}

	binPath := os.Args[1]
	version := "4.3.0"
	if len(os.Args) > 2 {
		version = os.Args[2]
	}

	privKeyBytesRaw, err := os.ReadFile("update_priv.key")
	if err != nil {
		fmt.Println("Error: update_priv.key not found. Run gen-keys first.")
		return
	}
	privKeyHex := strings.TrimSpace(string(privKeyBytesRaw))
	privKeyBytes, _ := hex.DecodeString(privKeyHex)
	privKey := ed25519.PrivateKey(privKeyBytes)

	// 1. Read Binary
	data, err := os.ReadFile(binPath)
	if err != nil {
		fmt.Printf("Error: binary not found at %s\n", binPath)
		return
	}

	// 2. Hash it
	h := sha256.Sum256(data)
	hashSum := hex.EncodeToString(h[:])

	// 3. Metadata for signature (version|hash)
	msg := fmt.Sprintf("%s|%s", version, hashSum)

	// 4. Sign
	sig := ed25519.Sign(privKey, []byte(msg))

	// 5. Generate Manifest
	m := Manifest{
		BinaryName: "wooGo-Proxy",
		Version:    version,
		SHA256:     hashSum,
		Signature:  hex.EncodeToString(sig),
	}

	mJSON, _ := json.MarshalIndent(m, "", "  ")

	// Place manifest in the same directory as the binary
	manifestPath := binPath + ".manifest.json"
	// Also fallback to a generic manifest.json in that dir for easy serving
	genericManifestPath := binPath[:strings.LastIndex(binPath, "/")+1] + "manifest.json"

	os.WriteFile(manifestPath, mJSON, 0644)
	os.WriteFile(genericManifestPath, mJSON, 0644)

	fmt.Printf("\n--- RELEASE SIGNED ---\n")
	fmt.Printf("Binary:    %s\n", binPath)
	fmt.Printf("Version:   %s\n", version)
	fmt.Printf("SHA256:    %s\n", hashSum)
	fmt.Printf("Signature: %s\n", hex.EncodeToString(sig))
	fmt.Printf("Manifests: %s, %s\n", manifestPath, genericManifestPath)
}
