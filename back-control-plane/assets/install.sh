#!/bin/bash
# wooGo-Proxy Agent Secure Installer (Full Stack v2 - High Fidelity)
set -e

# COLORS
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== wooGo-Proxy Agent | Full Stack Installation (v2) ===${NC}"

# 1. Parse Args
TOKEN=""
CP_URL="http://localhost:5000"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --token) TOKEN="$2"; shift ;;
        --url) CP_URL="$2"; shift ;;
    esac
    shift
done

if [ -z "$TOKEN" ]; then
    echo -e "${RED}[ERROR] Required parameter missing: --token${NC}"
    exit 1
fi

# 2. Check Permissions
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERROR] Please run as root (sudo)${NC}"
  exit 1
fi

# 3. Directories
CONF_DIR="/etc/wooGo-Proxy"
BIN_DIR="/usr/local/bin"
mkdir -p "$CONF_DIR"

echo -e "[1/4] Configuring paths (RAM Isolation)..."
echo "$TOKEN" > "$CONF_DIR/token"
echo "$CP_URL" > "$CONF_DIR/cp_url"
echo "/run/wooGo-Proxy/.env" > "$CONF_DIR/env_path"
chmod 600 "$CONF_DIR/token"

# 4. Download Binaries
echo -e "[2/4] Downloading Secure Binaries..."
systemctl stop wooGo-Proxy-core wooGo-Proxy 2>/dev/null || true

rm -f "$BIN_DIR/wooGo-Proxy"
curl -sSL "$CP_URL/assets/bin/wooGo-Proxy" -o "$BIN_DIR/wooGo-Proxy"

rm -f "$BIN_DIR/wooGo-Proxy-core"
curl -sSL "$CP_URL/assets/bin/wooGo-Proxy-core" -o "$BIN_DIR/wooGo-Proxy-core"

rm -f "$BIN_DIR/wooGo-Proxy-updater"
curl -sSL "$CP_URL/assets/bin/wooGo-Proxy-updater" -o "$BIN_DIR/wooGo-Proxy-updater"

chmod +x "$BIN_DIR/wooGo-Proxy"
chmod +x "$BIN_DIR/wooGo-Proxy-core"
chmod +x "$BIN_DIR/wooGo-Proxy-updater"

# 5. Create systemd Services
echo -e "[3/4] Registering systemd services..."

# ORCHESTRATOR SERVICE
cat <<EOF > /etc/systemd/system/wooGo-Proxy.service
[Unit]
Description=wooGo-Proxy Orchestration Agent
After=network.target

[Service]
Type=simple
ExecStart=$BIN_DIR/wooGo-Proxy
Restart=always
RestartSec=5
LimitNOFILE=65536
RuntimeDirectory=wooGo-Proxy
RuntimeDirectoryMode=0700

[Install]
WantedBy=multi-user.target
EOF

# WORKLOAD CORE SERVICE
cat <<EOF > /etc/systemd/system/wooGo-Proxy-core.service
[Unit]
Description=wooGo-Proxy Workload Core
After=wooGo-Proxy.service
Requires=wooGo-Proxy.service

[Service]
Type=simple
# Pass CP context to the workload
Environment="CP_URL=$CP_URL"
Environment="AGENT_TOKEN=$TOKEN"
Environment="WP_ENV_PATH=/run/wooGo-Proxy/.env"
ExecStart=$BIN_DIR/wooGo-Proxy-core
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 6. Finalization
systemctl daemon-reload
systemctl enable wooGo-Proxy wooGo-Proxy-core
systemctl restart wooGo-Proxy
# Wait a bit for orchestrator to create .env before starting core
sleep 2
systemctl restart wooGo-Proxy-core

echo -e "${GREEN}=== INSTALLATION COMPLETED SUCCESSFULLY ===${NC}"
echo -e "Orchestrator Node: $TOKEN"
echo -e "Workload Status:   $(systemctl is-active wooGo-Proxy-core)"
echo -e "Env Bridge:       /run/wooGo-Proxy/.env"
echo -e "${BLUE}============================================${NC}"
