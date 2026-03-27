# DN SaaS Global Orchestrator - PRO ROOT MAKEFILE

BIN_DIR=bin
CONTROLPLANE_SRC=back-control-plane
WORKLOAD_SRC=back-go
AGENT_SRC=agent
UI_SRC=control-plane-ui
ASSETS_DIR=$(CONTROLPLANE_SRC)/assets
VERSION=4.3.0

.PHONY: all agent controlplane frontend clean help directories production release

all: directories agent controlplane frontend
	@echo " [SUCCESS] Full ecosystem compiled in $(BIN_DIR)/"

directories:
	@mkdir -p $(BIN_DIR)
	@mkdir -p $(ASSETS_DIR)/bin
	@mkdir -p $(ASSETS_DIR)/plugins

agent:
	@echo " Compiling DN Orchestration Agent (wooGo-Proxy)..."
	@go build -o $(ASSETS_DIR)/bin/wooGo-Proxy ./$(AGENT_SRC)/main.go
	@echo " Compiling DN Workload Agent (Core)..."
	@cd $(WORKLOAD_SRC) && make all
	@cp -f $(WORKLOAD_SRC)/bin/agent $(ASSETS_DIR)/bin/wooGo-Proxy-core
	@cp -f $(WORKLOAD_SRC)/bin/plugins/*.so $(ASSETS_DIR)/plugins/
	@echo " Compiling SECURE UPDATER..."
	@go build -o $(ASSETS_DIR)/bin/wooGo-Proxy-updater ./updater/main.go

release: directories agent
	@echo " Signing Release v$(VERSION)..."
	@go run tools/sign-release.go $(ASSETS_DIR)/bin/wooGo-Proxy $(VERSION)
	@echo " Release finalized and signed."

controlplane:
	@echo " Compiling DN CONTROL PLANE..."
	@cd $(CONTROLPLANE_SRC) && go build -o ../$(BIN_DIR)/controlplane .

frontend:
	@echo " Building Frontend UI..."
	@cd $(UI_SRC) && npm install && npm run build
	@mkdir -p $(BIN_DIR)/www
	@cp -rf $(UI_SRC)/dist/* $(BIN_DIR)/www/

# PREPARING FOR PRODUCTION PACKAGE
production: release all
	@echo " Packaging Production Assets..."
	@mkdir -p $(BIN_DIR)/final/assets
	@cp -f $(BIN_DIR)/controlplane $(BIN_DIR)/final/
	@cp -rf $(BIN_DIR)/www $(BIN_DIR)/final/
	@cp -rf $(ASSETS_DIR)/* $(BIN_DIR)/final/assets/
	@echo " Production files ready in $(BIN_DIR)/final/"

clean:
	@echo " Cleaning artifacts..."
	@rm -rf $(BIN_DIR)
	@cd $(WORKLOAD_SRC) && make clean
	@rm -rf $(ASSETS_DIR)/bin/*
	@rm -rf $(ASSETS_DIR)/plugins/*.so

help:
	@echo "DN SaaS Manager Commands:"
	@echo "  make all          - Build EVERYTHING"
	@echo "  make agent        - Build Orchestrator, Core and Updater"
	@echo "  make release      - Build and SIGN the release (requires update_priv.key)"
	@echo "  make production   - Build and Package for Production"
	@echo "  make clean        - Clear all binaries"


