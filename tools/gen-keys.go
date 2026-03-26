package main

import (
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"os"
)

func main() {
	pub, priv, err := ed25519.GenerateKey(nil)
	if err != nil {
		panic(err)
	}

	fmt.Printf("PUBLIC_KEY: %s\n", hex.EncodeToString(pub))
	fmt.Printf("PRIVATE_KEY: %s\n", hex.EncodeToString(priv))

	os.WriteFile("update_pub.key", []byte(hex.EncodeToString(pub)), 0644)
	os.WriteFile("update_priv.key", []byte(hex.EncodeToString(priv)), 0600)

	fmt.Println("\nKeys saved to update_pub.key and update_priv.key")
}
