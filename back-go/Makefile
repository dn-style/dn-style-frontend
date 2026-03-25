# Directorios
BIN_DIR=bin
PLUGINS_SRC_DIR=plugins_src
PLUGINS_BIN_DIR=$(BIN_DIR)/plugins
CMD_DIR=cmd/server

# Comandos
GO=go
BUILD_FLAGS=-o

# Obtener lista de carpetas en plugins_src para detectar plugins automáticamente
PLUGINS=$(shell find $(PLUGINS_SRC_DIR) -maxdepth 1 -mindepth 1 -type d)

.PHONY: all clean main plugins directories

all: directories main plugins
	@echo "✨ ¡Backend y Plugins compilados correctamente en $(BIN_DIR)/!"

# Crear estructura de carpetas necesaria
directories:
	@mkdir -p $(BIN_DIR)
	@mkdir -p $(PLUGINS_BIN_DIR)

# Compilar binario principal (desde cmd/server)
main:
	@echo "🏗️  Compilando binario principal (DN Backend)..."
	@$(GO) build $(BUILD_FLAGS) $(BIN_DIR)/dn-backend ./$(CMD_DIR)

# Bucle para compilar todos los plugins dinámicos detectados
plugins:
	@for dir in $(PLUGINS); do \
		name=$$(basename $$dir); \
		echo "🔌 Compilando plugin: $$name..."; \
		$(GO) build -buildmode=plugin $(BUILD_FLAGS) $(PLUGINS_BIN_DIR)/$$name.so $$dir/main.go; \
	done

# Limpieza de archivos generados
clean:
	@echo "🧹 Limpiando binarios anteriores..."
	@rm -rf $(BIN_DIR)

# Ayuda
help:
	@echo "Uso:"
	@echo "  make all      - Compila todo (Backend y Plugins)"
	@echo "  make main     - Compila solo el binario principal"
	@echo "  make plugins  - Compila solo los plugins dinámicos"
	@echo "  make clean    - Borra la carpeta bin/"
