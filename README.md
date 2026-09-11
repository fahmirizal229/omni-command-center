# 🚀 Arusuka Command Center & Storage Vault

Arusuka Command Center is a modern, privacy-first personal server dashboard, knowledge aggregator, and storage vault built with **FastAPI**, **React 19**, **Vite**, **Tailwind CSS**, and **WebSocket** real-time streaming.

## ✨ Features & Modules

1. **Live Server Telemetry & Overview**:
   - Real-time CPU, RAM, Disk, Uptime, and Network I/O metrics streamed via WebSockets every 2s.

2. **Storage Vault & Photo Backup**:
   - Isolated private file storage with anti path-traversal protection.
   - Dual-view interface: **Photo & Media Gallery** (with full-resolution Lightbox viewer) and **File Explorer** (breadcrumbs, table view).
   - Drag & drop multi-file uploader with real-time progress bar.
   - Folder creation, rename, file download, and delete operations.

3. **Personal Task Kanban Board**:
   - Clean Kanban board for personal to-do items with priority tags, status columns, categories, and due dates.

4. **Career & Job Hunter Tracker**:
   - Application status pipeline (Applied, Interviewing, Offer, Rejected) for tracking career applications.

5. **Second Brain & Knowledge Graph**:
   - Interactive search and preview of Obsidian markdown vault notes, concepts, and persistent rules.

6. **Weather & BMKG Earthquake Guardian**:
   - Real-time weather, AQI, and BMKG earthquake early warning alerts for Surabaya & Indonesia.

7. **Zepp / Amazfit Fitness Stats**:
   - Live synchronization with Amazfit smartwatch metrics (daily steps, heart rate, sleep quality).

8. **Enterprise-Grade Security & Hardening**:
   - Dual-layer anti brute-force login rate limiting (Nginx & FastAPI sliding window).
   - Session Cookie Authentication with PBKDF2-HMAC-SHA256 password hashing and HMAC-signed tokens.
   - Strict CORS whitelist and dynamic HTTPS `secure=True` cookie attributes.
   - Fail2ban integration with automated IP banning for malicious scanners.

## 🛠️ Tech Stack

- **Backend**: Python 3.14+, FastAPI, Uvicorn, SQLite (WAL mode), WebSocket, Psutil
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React
- **Reverse Proxy & Security**: Nginx, Let\x27s Encrypt SSL/TLS, Fail2ban, UFW, Cloudflare WAF

## 🚀 Getting Started

### 1. Backend Setup
```bash
pip install fastapi uvicorn psutil python-multipart pydantic
python3 app.py
```

### 2. Frontend Development & Build
```bash
cd frontend
npm install
npm run build
```

## 🔒 License
Private & Personal Workspace © 2026 Fahmi Rizal (@arusuka).
