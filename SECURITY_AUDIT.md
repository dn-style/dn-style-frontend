# wooGo-Proxy Security Evaluation Report

**Date:** 2026-03-26
**Target:** Agent and Control Plane (SaaS Master Engine) v4.2

---

## Executive Summary
The wooGo-Proxy ecosystem exhibits several critical security vulnerabilities that could lead to full system compromise of both the control plane and connected agents. The most significant risks include cleartext password storage, hardcoded secrets, and unverified remote binary execution.

---

## 1. Critical Vulnerabilities

### 1.1 Cleartext Password Storage (CP)
- **Location:** `back-control-plane/main.go` (Multiple locations)
- **Status:** **CRITICAL**
- **Description:** User passwords are stored and compared in plain text. A database leak would immediately compromise all user accounts.
- **Recommendation:** Implement `bcrypt` or `Argon2` for password hashing and verification.

### 1.2 Hardcoded JWT Secret (CP)
- **Location:** `back-control-plane/main.go` (Line 95)
- **Status:** **CRITICAL**
- **Description:** Pre-shared JWT secret `dn-heavy-industrial-secret-2026` is hardcoded in the source. Any attacker can forge valid administrative tokens.
- **Recommendation:** Load `JWT_SECRET` from environment variables.

### 1.3 Unverified RCE - Arbitrary Binary Execution (Agent/Installer)
- **Location:** `back-control-plane/main.go` (install.sh) and `updater/main.go`.
- **Status:** **CRITICAL**
- **Description:** The installer and updater download binaries via `curl` and execute them as `root` without signature verification or checksum validation. A compromised Control Plane results in immediate root access across all agents.
- **Recommendation:** Implement code signing or at least pre-shared SHA-256 checksum verification.

---

## 2. High Vulnerabilities

### 2.1 Cross-Site WebSocket Hijacking (CSWSH) (CP)
- **Location:** `back-control-plane/main.go` (Line 94)
- **Status:** **HIGH**
- **Description:** The WebSocket upgrader `CheckOrigin` function always returns `true`, allowing any malicious site to initiate a connection on behalf of a logged-in user (if users use browsers for agents, though here agents are Go binaries, but the endpoint is exposed).
- **Recommendation:** Restrict `CheckOrigin` to allowed domains only.

### 2.2 Broken Authorization - Tag Updates (CP)
- **Location:** `back-control-plane/main.go:394` (`/api/update-tags`)
- **Status:** **HIGH**
- **Description:** The endpoint for updating agent tags accepts a `token` and `tags` but does **not** verify if the authenticated user (JWT) owns the agent associated with that token. Any user can modify tags for any other tenant's agent.
- **Recommendation:** Add tenant owner verification.

### 2.3 Arbitrary System Reconfiguration (Agent)
- **Location:** `agent/main.go:116` (`reconfigureSystem`)
- **Status:** **HIGH**
- **Description:** The agent allows the Control Plane to push arbitrary key-value pairs which are written into `.env`. If the CP is compromised, an attacker can modify critical secrets (DB_PASS, JWT_SECRET) on the agent host.
- **Recommendation:** Sanitize values and strictly validate allowed keys. Prevent overwriting of the agent's own orchestration secrets.

---

## 3. Medium/Low Vulnerabilities

### 3.1 Hardcoded Local Paths (Agent)
- **Location:** `agent/main.go:134`
- **Description:** Path to `.env` is hardcoded to `/mnt/beleriand/...`. This is fragile and limits deployment flexibility.

### 3.2 Insecure File Permissions (Agent)
- **Location:** `agent/main.go:160`
- **Description:** `.env` file is created with `0644` permissions. It should be `0600` to prevent other local users from reading secrets.

### 3.3 Predictable Agent Tokens (CP)
- **Location:** `back-control-plane/main.go:368`
- **Description:** Tokens follow the pattern `at_<timestamp>_<tenantID>`, which are significantly easier to guess than UUIDs.

---

## 4. Proposed Fixes Implementation Order

1.  **Passwords:** Implement hashing on `POST /api/login` and user creation.
2.  **JWT Secret:** Transition to `os.Getenv("JWT_SECRET")`.
3.  **Authorization:** Fix `/api/update-tags` to include tenant-ID check.
4.  **WebSocket:** Fix Origin Check.
5.  **Agent Security:** Restrict `.env` permissions to `0600`.

---

## 5. Operational Stability & Resilience
- **Persistence:** The agent uses an aggressive reconnection strategy (5s on handshake failure, 2s on connection loss).
- **Heartbeat:** Increased heartbeat frequency to 10s to improve real-time visibility.
- **Grace Period (30 Days):** The agent maintains a local state (`agent_state.json`) with the timestamp of the last successful sync. If the node fails to sync for > 30 days, it automatically purges local secrets (`.env`) and enters a locked state.

## 6. Zero-Trust Architecture
- **Payload Encryption (AES-256-GCM):** Data sent via WebSocket is now encrypted using session-specific keys generated during the handshake. Even with TLS termination, the configuration remains inaccessible to third parties.
- **Dynamic Session Keys:** A unique 32-byte key is generated for every agent connection, ensuring perfect forward secrecy for that session's data.
- **Generic Synchronization:** Removed hardcoded mapping; the agent now serves as a generic, secure sync engine for arbitrary environment variables.
