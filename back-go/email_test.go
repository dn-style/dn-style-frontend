package main

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRenderTemplate(t *testing.T) {
	// 1. Setup rootDir and template path
	ex, _ := os.Executable()
	rootDir = filepath.Dir(ex)

	templateDir := filepath.Join(rootDir, "email-templates")
	_ = os.MkdirAll(templateDir, 0755)

	testTemplate := filepath.Join(templateDir, "test.hbs")
	_ = os.WriteFile(testTemplate, []byte("Hola {{name}}!"), 0644)
	defer os.Remove(testTemplate)

	// 2. Test rendering
	data := map[string]interface{}{"name": "Mundo"}
	html, err := renderTemplate("test", data)

	assert.Nil(t, err)
	assert.Equal(t, "Hola Mundo!", html)
}
