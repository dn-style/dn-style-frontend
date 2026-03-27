# wooGo-Proxy System Architecture (v4.3)

## 1. Overview
The wooGo-Proxy ecosystem is a distributed orchestration platform designed for high-security, Zero-Trust workload management. It employs a **Sidecar Architecture** where management logic is strictly separated from application execution.

---

## 2. Core Components

### A. Control Plane (CP)
- **Tech Stack**: Go (Fiber), SQLite/Postgres (Gorm), React (Vite).
- **Functions**:
    - Centralized dashboard for node management.
    - Global state tracking (Agent Online/Offline status).
    - Remote configuration dispatch (AES-GCM encrypted).
    - Release signing and manifest generation (ED25519).
    - Marketplace for dynamic plugins.

### B. Orchestrator Agent (`wooGo-Proxy.service`)
- **Role**: The "Brain" of the node.
- **Security**: 
    - RAM-Only Persistence: Syncs environment variables to `/run/wooGo-Proxy/.env` (tmpfs).
    - Restricted Permissions: Config file locked to `0600` (Root only).
- **Lifecycle Management**:
    - Automatically restarts the Workload Core when configuration changes.
    - Self-updates via the **Secure Updater** (verified by Developer Public Key).

### C. Workload Core (`wooGo-Proxy-core.service`)
- **Role**: The "Muscle". Runs the actual application (API, WordPress bridge, etc.).
- **Features**:
    - Agnostic Configuration: Reads environment from path specified by `WP_ENV_PATH`.
    - Stability: If the core crashes, the Orchestrator remains online, preventing total node loss.

---

## 3. Security Infrastructure

### Zero-Trust Updates
1. **Signing**: Releases are compiled and signed using a Private ED25519 key (kept offline). 
2. **Verification**: The agent invokes `wooGo-Proxy-updater`, which:
   - Downloads `manifest.json`.
   - Verifies the signature of (Version | SHA256) against the embedded Public Key.
   - Verifies file integrity of the binary.
   - Overwrites the binary only if both checks pass.

### Hardware Isolation (Ghost Level)
- **Port Conflict Detection**: The Orchestrator performs a "Ghost Listen" on the requested port before applying changes to warn about conflicts (e.g., Nginx blocking Port 80).
- **Grace Period**: If a node loses connection to the Control Plane for >30 days, it automatically purges all secrets and locks down.

---

## 4. Operational Guide

### Installation
New nodes are provisioned using a secure script:
```bash
curl -sSL http://<CP_URL>/install.sh | sudo bash -s -- --token <AGENT_TOKEN>
```

### Maintenance Commands
- **Check Orchestrator Status**: `systemctl status wooGo-Proxy`
- **Check Application Health**: `systemctl status wooGo-Proxy-core`
- **View Integrated Logs**: `journalctl -u wooGo-Proxy* -f`
- **Inspect Volatile Config**: `sudo cat /run/wooGo-Proxy/.env`

---

## 5. Directory Structure (Standard Node)
- `/etc/wooGo-Proxy/`: Persistent identity (Token, CP URL, State).
- `/usr/local/bin/`: Production binaries (Orchestrator, Core, Updater).
- `/run/wooGo-Proxy/`: Volatile bridge (RAM-only `.env` file).
