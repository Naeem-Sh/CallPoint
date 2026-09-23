# Enterprise Organization Phonebook & Employee Directory

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](Dockerfile)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=for-the-badge&logo=node.js&logoColor=white)](package.json)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](src/App.tsx)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](tsconfig.json)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](src/index.css)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A modern, full-stack, production-ready enterprise phonebook and organizational directory. Built with a server-first architecture, atomic flat-file document storage, interactive live search, customizable background textures, an analog clock with calendar synchronization, role-based access control (RBAC), printable catalog generator, and seamless Docker containerization.

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Data Storage](#-architecture--data-storage)
- [Quickstart with Docker](#-quickstart-with-docker)
  - [Using Docker Compose (Recommended)](#1-using-docker-compose-recommended)
  - [Using Docker CLI](#2-using-docker-cli)
- [Local Development Setup](#-local-development-setup)
- [Production Build](#-production-build)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Default Administrator Credentials](#-default-administrator-credentials)
- [REST API Endpoints](#-rest-api-endpoints)
- [GitHub Synchronization Guide](#-github-synchronization-guide)
- [Contributing & License](#-contributing--license)

---

## 🌟 Key Features

### 1. Employee & Extension Directory
- Comprehensive staff directory: First/Last name, extension number, direct phone line, mobile, fax, email, building, floor, room, and department.
- **Dynamic Custom Fields**: Add unlimited organization-specific custom fields (e.g., National ID, Education, Specialized Skills).
- **Smart Avatar Engine**: Automatic image compression on upload and gender-aware default meteor avatars with fallback initial generation.
- **Profile Completeness Metrics**: Visual indicator evaluating how complete each employee's profile information is.

### 2. Instant Search & Multi-Criteria Filtering
- Real-time search by full name, extension, direct number, job title, department, or office location.
- Multi-dimensional filters: Filter by building, department tree, and employment status.
- **Search Analytics**: Tracks frequently searched terms and popular keywords with real-time counters.

### 3. Professional Print & PDF Catalog Export
- Clean, customizable printable directory generator supporting standard paper sizes (A4, A5) in both Portrait and Landscape.
- Configurable column visibility, font sizes, margins, and density presets.
- Browser-native print styles optimized for crisp physical and PDF output without requiring external dependencies.

### 4. Role-Based Administration & Security (RBAC)
- Multi-role permission system: Administrator (`admin`) and Operator (`operator`).
- Secure password hashing using industry-standard `bcryptjs`.
- **Audit Logging**: Comprehensive chronological history of all administrative modifications, deletions, and system updates.
- Organizational hierarchy management: Department trees, office buildings, floors, and job titles.

### 5. Automated Backups & Excel Data Interchange
- **Scheduled Backups**: Automated periodic zip archiving of databases and uploaded profile photos.
- **One-Click Restore**: Upload and restore previous backup snapshots directly from the admin panel.
- **Excel Import / Export**: Full bidirectional Excel (`.xlsx`) data synchronization with template validation.

### 6. Visual Polish & Themes
- Dual theme support: Dark Mode & Light Mode with seamless transitions.
- **15 Graphic Background Patterns**: High-contrast geometric textures (polka dots, chevron, argyle, honeycomb, wave lines, crosshatch, carbon mesh, etc.).
- Embedded SVG analog clock and live calendar synchronization.

---

## 🗄️ Architecture & Data Storage

The application leverages a robust, lightweight **Flat-File Document Storage** model located entirely in the `/app/storage` directory. This eliminates the operational overhead of external database servers while maintaining ACID-like reliability through in-memory mutex queues and atomic file writes.

### Directory Layout

```text
storage/
├── data/                       # Structured JSON databases
│   ├── employees.json          # Active personnel and phone extensions
│   ├── archived_employees.json # Soft-deleted / archived personnel records
│   ├── departments.json        # Organizational units and department tree
│   ├── positions.json          # Job titles and designations
│   ├── locations.json          # Buildings, facilities, and floor layouts
│   ├── fields.json             # Dynamic custom field definitions
│   ├── users.json              # Authentication accounts and role permissions
│   ├── settings.json           # Organization branding, logos, and policy settings
│   ├── audit-log.json          # Chronological audit logs of administrative actions
│   ├── search-stats.json       # Query analytics and keyword counters
│   └── sessions.json           # Active administrative sessions
│
├── uploads/                    # Binary assets and user media
│   ├── employees/              # Uploaded employee portrait photos
│   └── company/                # Organization logos and brand assets
│
├── backups/                    # Auto-generated and manual ZIP backup archives
└── imports/ & exports/         # Temporary Excel spreadsheets during data exchange
```

### Data Integrity & External Storage Safeguards
1. **Isolated External Storage**: By default, persistent data is stored in a directory **outside the application code repository** (e.g. `../org-phonebook-data` or `/var/lib/org-phonebook`). Even if you delete the entire project folder, perform a fresh `git pull`, or rebuild container images, **your data, user accounts, photos, and backups remain 100% intact**.
2. **Atomic File Writes**: Records are serialized to temporary files (`.tmp`) before being renamed atomically via the operating system's filesystem (`fs.rename`).
3. **Mutex Queuing**: Serialized asynchronous queues prevent race conditions and concurrent write hazards.
4. **Persistent Volume Binding**: In Docker, mapping `${STORAGE_PATH:-../org-phonebook-data}:/app/storage` guarantees continuous persistence across container updates and removals.

---

## 🐳 Quickstart with Docker

### 1. Using Docker Compose (Recommended)

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed.

```bash
# Clone the repository
git clone https://github.com/shaaeri/org-phonebook.git
cd org-phonebook

# Build and start the container in detached mode
docker compose up -d --build
```

Access the application in your browser at:
👉 **[http://localhost:4400](http://localhost:4400)**

#### Useful Docker Compose Commands:
```bash
# View real-time application logs
docker compose logs -f

# Inspect container status and health check
docker compose ps

# Stop the container safely without losing data
docker compose down

# Restart the application
docker compose restart
```

---

### 2. Using Docker CLI

```bash
# Build the optimized multi-stage image
docker build -t org-phonebook:latest .

# Run the container with persistent storage located outside the project directory
docker run -d \
  --name org_phonebook \
  -p 4400:4400 \
  -v $(pwd)/../org-phonebook-data:/app/storage \
  --restart unless-stopped \
  org-phonebook:latest
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: Version `20.0.0` or higher
- **npm** or **bun**

### Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Run the development server (Vite + TypeScript with live reload)
npm run dev
```

The dev server will boot up and bind to `http://localhost:3000`.

---

## 🏗️ Production Build

To build the client SPA and bundle the Express backend into a production-optimized file:

```bash
# Build frontend assets and bundle server with esbuild
npm run build

# Start the bundled production server
npm start
```

---

## ⚙️ Configuration & Environment Variables

Copy the example environment file if customization is needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime mode (`development` or `production`) | `production` |
| `PORT` | HTTP port exposed by the Express server | `4400` |
| `APP_URL` | Canonical URL of the application deployment | `http://localhost:4400` |
| `GEMINI_API_KEY` | Optional API key for Google Gemini AI features | `""` |

---

## 🔐 Default Administrator Credentials

When the system boots for the first time, a default administrative account is automatically provisioned:

- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin` (Full access to all panels, settings, users, and backups)

> ⚠️ **Security Notice**: Immediately log in and change the default administrator password in the **Settings & Users** tab.

---

## 📡 REST API Endpoints

The server exposes clean, structured RESTful API endpoints:

### Public & Directory Endpoints
- `GET /api/health`: Container health check probe
- `GET /api/employees`: Retrieve all active employees with department and location metadata
- `GET /api/departments`: Retrieve all departments and organizational tree
- `GET /api/locations`: Retrieve all buildings and floors
- `GET /api/positions`: Retrieve job positions
- `GET /api/fields`: Retrieve dynamic field configurations
- `GET /api/settings`: Retrieve public organization settings and branding
- `POST /api/search/record`: Increment search analytics counter

### Authentication & Admin Endpoints
- `POST /api/auth/login`: Authenticate administrative user and receive session token
- `POST /api/auth/logout`: Revoke active administrative session
- `GET /api/auth/me`: Validate current session credentials
- `POST /api/employees`: Create new employee record
- `PUT /api/employees/:id`: Update existing employee record
- `DELETE /api/employees/:id`: Soft-delete/archive employee record
- `POST /api/employees/:id/avatar`: Upload and compress employee portrait photo
- `POST /api/backup/export`: Trigger instant ZIP backup generation
- `POST /api/backup/restore`: Restore database and assets from uploaded ZIP backup
- `GET /api/excel/export`: Download formatted directory as Excel spreadsheet
- `POST /api/excel/import`: Bulk import personnel records from Excel file
- `GET /api/audit`: Retrieve administrative audit logs

---

## 🐙 GitHub Synchronization Guide

To connect and push this repository to your GitHub account:

### Option 1: AI Studio Export (One-Click)
1. In the AI Studio interface, click on the **Settings** / **Export** menu in the top-right corner.
2. Select **Export to GitHub** and authorize your account to create a synchronized repository with all files and git history.

### Option 2: Command Line Interface (CLI)

```bash
# Add your GitHub repository as the remote origin
git remote add origin https://github.com/shaaeri/org-phonebook.git

# Ensure the primary branch is named main
git branch -M main

# Push the committed code to GitHub
git push -u origin main
```

---

## 🤝 Contributing & License

Contributions, issue reports, and feature suggestions are welcome! Feel free to open an issue or submit a Pull Request.

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

Copyright (c) 2026 shaaeri.
