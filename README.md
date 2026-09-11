# 🚀 Omni Command Center & Storage Vault

Omni Command Center is a modern, modular, privacy-first personal server dashboard, knowledge aggregator, and storage vault built with **FastAPI**, **React 19**, **Vite**, **Tailwind CSS**, and **WebSocket** real-time streaming.

---

## ✨ Features & Modules

1. **📊 Live Server Telemetry & Overview**:
   - Real-time CPU, RAM, Disk, Uptime, and Network metrics streamed via WebSockets every 2 seconds.
   - Fail2ban intrusion defense health & security jail inspector.

2. **📸 Storage Vault & Photo Backup**:
   - Isolated private file storage with anti path-traversal protection.
   - Dual-view interface: **Photo & Media Gallery** (with full-resolution Lightbox viewer) and **File Explorer** (breadcrumbs, table view).
   - Drag & drop multi-file uploader with real-time progress bar.
   - Folder creation, rename, file download, and delete operations.

3. **📝 Personal Task Kanban Board**:
   - Clean Kanban board for personal to-do items with priority tags, status columns, categories, and due dates.

4. **💼 Career & Job Hunter Tracker**:
   - Application status pipeline (Wishlist, Applied, Screening, Technical Test, Interview, Offer, Rejected) for tracking career applications.

5. **🧠 Second Brain & Knowledge Graph**:
   - Interactive search and preview of Obsidian markdown vault notes, concepts, and persistent rules.

6. **🌦️ Weather & BMKG Earthquake Guardian**:
   - Real-time weather, AQI, and BMKG earthquake early warning alerts for Surabaya & Indonesia.

7. **🏃 Zepp / Amazfit Fitness Stats**:
   - Live synchronization with Amazfit smartwatch metrics (daily steps, heart rate, sleep quality).

8. **🛡️ Enterprise-Grade Security & Hardening**:
   - Anti brute-force login rate limiting (FastAPI sliding window limiter).
   - Session Cookie Authentication with PBKDF2-HMAC-SHA256 password hashing and HMAC-signed tokens.
   - Strict CORS whitelist and dynamic HTTPS `secure=True` cookie attributes.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.14+, FastAPI, Uvicorn, SQLite (WAL mode), WebSocket, Psutil
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, i18next
- **Reverse Proxy & Security**: Nginx, Let's Encrypt SSL/TLS, Fail2ban, UFW

---

## 🚀 Quick Start (Clone & Run Anywhere)

This project is completely portable and can run on any Linux, macOS, or WSL environment.

### 1. Clone & Prerequisites
```bash
git clone https://github.com/fahmirizal229/omni-command-center.git
cd dashboard
```

### 2. Backend Setup
```bash
# Create virtual environment (Optional but recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Copy .env.example if you wish to customize paths
cp .env.example .env
```

### 3. Frontend Setup & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### 4. Run Application
```bash
python3 app.py
```
Visit `http://127.0.0.1:8888` in your browser. Default master credentials will be initialized on first run (`arusuka` / `arusuka123`).

---

## 📁 Architecture Overview

```
dashboard/
├── app.py                     # Main application entry point & SPA static files server
├── backend/
│   ├── config.py              # Dynamic configuration & path resolver
│   ├── database.py            # SQLite database initializer & connection helper
│   ├── security.py            # PBKDF2 auth, HMAC session tokens & rate limiter
│   ├── websocket.py           # Real-time WebSocket connection manager & telemetry loop
│   └── routes/                # Modular domain API routers
│       ├── auth.py            # Authentication & session endpoints
│       ├── overview.py        # System health & dashboard summaries
│       ├── storage.py         # Storage vault & photo upload/preview/download
│       ├── tasks.py           # Personal Kanban board CRUD
│       ├── jobs.py            # Job Hunter career tracker CRUD
│       ├── second_brain.py    # Obsidian note explorer & knowledge graph
│       ├── weather.py         # Weather & BMKG earthquake monitoring
│       ├── zepp.py            # Amazfit/Zepp health metrics
│       └── schedules.py       # Cron routines & daemon inspector
└── frontend/                  # React 19 + Vite + Tailwind CSS SPA UI
```

---

## 🔒 License
Private & Personal Workspace © 2026 Fahmi Rizal (@arusuka).
