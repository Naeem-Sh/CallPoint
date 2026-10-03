# Enterprise Organization Phonebook & Employee Directory

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](Dockerfile)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](src/App.tsx)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A self-hosted, air-gapped, production-grade enterprise employee phonebook and extension directory system. Engineered with a server-first architecture, atomic flat-file document persistence, instant multi-criteria search, role-based access control (RBAC), and automated backup management.

---

## 🔒 Air-Gapped Intranet Readiness

This application is strictly designed for **100% isolated, air-gapped intranet environments**:
- **Zero Runtime External Requests**: No outbound internet traffic, remote CDNs, tracking scripts, or external DNS resolution.
- **Fully Bundled Offline Assets**: Persian typography (`Vazirmatn`), icons, stylesheets, and build artifacts are packaged locally inside the container image.
- **Relative Path Routing**: All client HTTP requests utilize relative endpoints (`/api/...`), enabling smooth reverse proxying and SSL termination without hardcoded IPs or ports.

---

## 🔑 Default Administrator Credentials

Upon initial deployment, the database boots cleanly with bootstrap credentials:

| Field | Default Value | Role |
| :--- | :--- | :--- |
| **Username** | `admin` | Full System Administrator |
| **Password** | `123` | Password can be updated in Admin Settings |
| **Editor Username** | `editor` | Directory Editor (Staff and extension management) |
| **Editor Password** | `123` | Password can be updated in Admin Settings |

> **Note on Credential Persistence:** Once updated in the Admin panel, administrator credentials are permanently stored in persistent storage (`users.json`). Container restarts will **never** overwrite updated passwords unless explicitly requested via `RESET_ADMIN_PASSWORD=true`.

---

## 🚀 Single-Command Launch (Docker Compose)

### 1. Start the Application
Run the following single command in the repository root:

```bash
docker compose up -d --build
```

### 2. Access the System
Open your web browser and navigate to:
👉 **[http://localhost:4400](http://localhost:4400)**

### 3. Verify Health
```bash
# Check container status and health probe
docker compose ps

# Check HTTP 200 connectivity
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4400/

# Check dedicated health probe
curl -s http://localhost:4400/healthz
```

---

## 🔌 Port Mapping & Networking

- **Container Port**: `4400`
- **Host Exposed Port**: `4400:4400`
- **Reverse Proxy Support**: Pre-configured with `trust proxy` enabled to handle `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers behind Nginx, Traefik, or HAProxy.
- **SPA Fallback Routing**: All non-API routes resolve to `index.html` with immutable caching on static assets and no-cache on HTML.

---

## 💾 Standardized Persistent Storage (`DATA_DIR`)

All persistent application state is consolidated under a single standardized container directory:
- **Container Path**: `/app/data`
- **Host Persistent Path**: `./data` (Intended deployment: `/opt/docker/<app-name>/data/` -> `/app/data/`)

```text
/app/data/
├── database.json           # Consolidated system database snapshot
├── visits.json             # Search queries & visit metrics
├── employees.json          # Active personnel and phone extensions
├── archived_employees.json # Recycle bin & archived employee records
├── departments.json        # Organizational units & structure
├── positions.json          # Job titles
├── locations.json          # Buildings, facilities, and rooms
├── fields.json             # Dynamic custom field definitions
├── users.json              # Accounts and bcrypt password hashes
├── settings.json           # Organization branding, logos, and config
├── audit-log.json          # Chronological administrative audit logs
├── search-stats.json       # Search query metrics and counter history
├── sessions.json           # Active token sessions
├── uploads/                # User avatars and organization logos
│   ├── employees/          # Compressed employee portrait photos
│   └── company/            # Organization logos and brand assets
├── backups/                # Automated and on-demand ZIP backup archives
└── imports/ & exports/     # Temporary import/export buffers
```

**Empty Directory Tolerance:** When `/app/data` is mounted completely empty, the application automatically initializes the directory structure and starter schemas with zero manual intervention.

---

## ⚙️ Environment Variables & In-Code Fallbacks

Every variable has a resilient in-code fallback ensuring instant zero-stop runtime:

| Variable | Required | Default Fallback | Purpose |
| :--- | :--- | :--- | :--- |
| `DATA_DIR` | Optional | `/app/data` | Root directory for all database files, uploads, and backups |
| `PORT` | Optional | `4400` (prod) / `3000` (dev) | Server HTTP listening port |
| `NODE_ENV` | Optional | `production` | Runtime mode (static bundle serving vs Vite dev server) |
| `TZ` | Optional | `Asia/Tehran` | Timezone for logs and Iranian calendar conversions |
| `RESET_ADMIN_PASSWORD` | Optional | `false` | When `true`, resets the admin password to `INITIAL_ADMIN_PASSWORD` |
| `JWT_SECRET` | Optional | `fallback-production-jwt-secret-replace-me` | Internal secret for session/token verification |
| `INITIAL_ADMIN_USERNAME` | Optional | `admin` | Bootstrap administrator username |
| `INITIAL_ADMIN_PASSWORD` | Optional | `123` | Bootstrap administrator password |

---

## 🛡️ Container Hardening & Operational Resilience

1. **Lightweight Offline Healthcheck**: Built-in native Node.js probe (`/healthz`) requiring zero external packages or network queries.
2. **Disk & Log Boundaries**: Enforces strict Docker JSON logging limits (`max-size: "10m"`, `max-file: "3"`) to prevent host disk exhaustion.
3. **Time Synchronization**: Synchronizes container time to `TZ=Asia/Tehran` with host time bind mount (`/etc/localtime:ro`) for accurate audit logs and Persian calendars.
4. **Graceful Signal Handling**: Listens for POSIX `SIGTERM` and `SIGINT` signals to flush open file buffers and close HTTP connections cleanly.

---

## 💻 Local Development & Manual Build

### Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0`

### Development Mode
```bash
# Install dependencies
npm ci

# Start Vite dev server with Express middleware on port 3000
npm run dev
```

### Production Build & Execution
```bash
# Compile React frontend and bundle Express backend
npm run build

# Start production server on port 4400
npm start
```

---

## 🧪 Automated Verification Script

A standalone verification script is included to test compilation, type sanity, Docker builds, and air-gapped isolation:

```bash
chmod +x verify.sh
./verify.sh
```

---

## 📄 License

This software is released under the [MIT License](LICENSE).  
Copyright (c) 2026 shaaeri.
