#!/usr/bin/env python3
"""
Arusuka Server Command Center - FastAPI Backend Engine (Privacy-First & Authenticated)
Clean, robust, and secure API aggregator with:
- Session Cookie Authentication & Password Hashing (PBKDF2-SHA256)
- Personal Task Kanban Board (SQLite)
- Career & Job Hunter Kanban Tracker
- System & Fail2ban Security Metrics
- Second Brain & Knowledge Graph Stats
- Surabaya Weather, AQI & BMKG Earthquake Guardian
- Pokémon Trade Queue Status
(Note: Financial data is strictly private and managed via CLI/MCP only).
"""

import os
import sys
import json
import sqlite3
import shutil
import time
import subprocess
import hashlib
import hmac
import secrets
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, date, timedelta
from pathlib import Path
import mimetypes
import urllib.parse
from typing import Optional, Any, Set, Dict, List

import psutil
from fastapi import FastAPI, HTTPException, Request, Response, Depends, status, Cookie, WebSocket, WebSocketDisconnect, Query, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse, RedirectResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Root paths
HOME_DIR = Path("/home/arusuka")
CONFIG_DIR = HOME_DIR / ".config"
AUTH_FILE = CONFIG_DIR / "dashboard_auth.json"
TASK_DB = HOME_DIR / "dashboard" / "tasks.db"
JOB_DB = HOME_DIR / "mcp-job-hunter" / "job_hunter.db"
GRAPH_DB = HOME_DIR / "mcp-graph-memory" / "graph_memory.db"
BRAIN_DIR = HOME_DIR / "second-brain"
BMKG_DB = HOME_DIR / "mcp-weather" / "bmkg_alerts.db"
POKEMON_QUEUE = CONFIG_DIR / "pokemon_queue.json"

# Strict Privacy Blacklist: Zero Finance & Debt Visibility on Dashboard
FINANCE_BLACKLIST = {"finance", "debt", "pinjol", "tagihan", "rekening", "wallet", "dompet", "cicilan", "paylater", "ocr", "receipt"}

def is_finance_related(text: str) -> bool:
    if not text:
        return False
    lower = str(text).lower()
    return any(keyword in lower for keyword in FINANCE_BLACKLIST)

# Import weather helper
sys.path.append(str(HOME_DIR / "mcp-weather"))
try:
    from weather_api import fetch_weather_and_aqi, fetch_latest_earthquake, fetch_recent_earthquakes
except Exception:
    fetch_weather_and_aqi = None
    fetch_latest_earthquake = None
    fetch_recent_earthquakes = None

# Import Zepp helper
sys.path.append(str(HOME_DIR / ".hermes" / "mcp-zepp"))
try:
    from server import ZeppClient
    zepp_client_instance = ZeppClient()
except Exception:
    zepp_client_instance = None

# --- WebSocket Connection Manager ---

class WebSocketConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.active_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        async with self.lock:
            if not self.active_connections:
                return
            connections = list(self.active_connections)

        payload = json.dumps(message)
        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                async with self.lock:
                    self.active_connections.discard(ws)

ws_manager = WebSocketConnectionManager()

def trigger_ws_event(event_type: str, data: Any = None):
    """Trigger an event broadcast to all connected WebSocket clients."""
    try:
        loop = asyncio.get_running_loop()
        asyncio.create_task(ws_manager.broadcast({
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }))
    except RuntimeError:
        pass

async def realtime_telemetry_loop():
    """Background task to broadcast real-time server telemetry every 2 seconds."""
    prev_net = psutil.net_io_counters()
    prev_time = time.time()

    while True:
        try:
            await asyncio.sleep(2)
            if not ws_manager.active_connections:
                continue

            cpu_pct = psutil.cpu_percent(interval=None)
            cpu_cores = psutil.cpu_percent(percpu=True)
            mem = psutil.virtual_memory()
            disk = shutil.disk_usage("/")
            curr_net = psutil.net_io_counters()
            curr_time = time.time()

            dt = max(curr_time - prev_time, 0.1)
            bytes_sent_per_sec = (curr_net.bytes_sent - prev_net.bytes_sent) / dt
            bytes_recv_per_sec = (curr_net.bytes_recv - prev_net.bytes_recv) / dt
            prev_net = curr_net
            prev_time = curr_time

            boot_time = psutil.boot_time()
            uptime_sec = curr_time - boot_time
            load_avg = [round(x, 2) for x in psutil.getloadavg()] if hasattr(psutil, "getloadavg") else [0.0, 0.0, 0.0]

            # Format uptime helper inline for loop
            days, rem = divmod(int(uptime_sec), 86400)
            hours, rem = divmod(rem, 3600)
            mins, _ = divmod(rem, 60)
            up_parts = []
            if days > 0:
                up_parts.append(f"{days}h")
            if hours > 0:
                up_parts.append(f"{hours}j")
            up_parts.append(f"{mins}m")
            formatted_uptime = " ".join(up_parts)

            telemetry = {
                "type": "telemetry",
                "timestamp": datetime.now().isoformat(),
                "system": {
                    "cpu_percent": cpu_pct,
                    "cpu_cores": cpu_cores,
                    "memory": {
                        "percent": mem.percent,
                        "used_gb": round(mem.used / (1024**3), 2),
                        "total_gb": round(mem.total / (1024**3), 2),
                        "available_gb": round(mem.available / (1024**3), 2),
                    },
                    "disk": {
                        "percent": round((disk.used / disk.total) * 100, 1),
                        "used_gb": round(disk.used / (1024**3), 1),
                        "total_gb": round(disk.total / (1024**3), 1),
                        "free_gb": round(disk.free / (1024**3), 1),
                    },
                    "uptime": formatted_uptime,
                    "uptime_sec": int(uptime_sec),
                    "load_avg": load_avg,
                    "network": {
                        "bytes_sent_sec": round(bytes_sent_per_sec, 1),
                        "bytes_recv_sec": round(bytes_recv_per_sec, 1),
                        "total_sent_mb": round(curr_net.bytes_sent / (1024**2), 1),
                        "total_recv_mb": round(curr_net.bytes_recv / (1024**2), 1),
                    }
                }
            }
            await ws_manager.broadcast(telemetry)
        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    telemetry_task = asyncio.create_task(realtime_telemetry_loop())
    yield
    telemetry_task.cancel()
    try:
        await telemetry_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Arusuka Command Center",
    description="Clean Dark & Secure Dashboard API for Arusuka Server",
    version="1.4.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dashboard.arusuka.my.id",
        "https://arusuka.my.id",
        "https://www.arusuka.my.id",
        "http://localhost:8888",
        "http://127.0.0.1:8888",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication & Password Management ---

def hash_password(password: str, salt: Optional[str] = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${dk.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    if "$" not in hashed:
        return False
    salt, dk_hex = hashed.split("$", 1)
    test_dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return hmac.compare_digest(test_dk.hex(), dk_hex)

def load_or_init_auth_config() -> dict:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if not AUTH_FILE.exists():
        # Default initial credentials: arusuka / arusuka123
        secret_key = secrets.token_hex(32)
        default_pwd_hash = hash_password("arusuka123")
        config = {
            "username": "arusuka",
            "password_hash": default_pwd_hash,
            "secret_key": secret_key,
            "session_expire_days": 30
        }
        AUTH_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")
        try:
            os.chmod(AUTH_FILE, 0o600)
        except Exception:
            pass
        return config
    try:
        data = json.loads(AUTH_FILE.read_text(encoding="utf-8"))
        if "secret_key" not in data:
            data["secret_key"] = secrets.token_hex(32)
            AUTH_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data
    except Exception:
        secret_key = secrets.token_hex(32)
        default_pwd_hash = hash_password("arusuka123")
        config = {
            "username": "arusuka",
            "password_hash": default_pwd_hash,
            "secret_key": secret_key,
            "session_expire_days": 30
        }
        AUTH_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")
        return config

AUTH_CONFIG = load_or_init_auth_config()

def create_session_token(username: str) -> str:
    config = load_or_init_auth_config()
    secret = config["secret_key"].encode("utf-8")
    expire_days = config.get("session_expire_days", 30)
    expire_ts = int(time.time()) + (expire_days * 86400)
    nonce = secrets.token_hex(8)
    payload = f"{username}:{expire_ts}:{nonce}"
    sig = hmac.new(secret, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_session_token(token: Optional[str]) -> Optional[str]:
    if not token or ":" not in token:
        return None
    try:
        parts = token.split(":")
        if len(parts) != 4:
            return None
        username, expire_ts_str, nonce, sig = parts
        expire_ts = int(expire_ts_str)
        if time.time() > expire_ts:
            return None
        config = load_or_init_auth_config()
        secret = config["secret_key"].encode("utf-8")
        expected_payload = f"{username}:{expire_ts_str}:{nonce}"
        expected_sig = hmac.new(secret, expected_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected_sig):
            return username
        return None
    except Exception:
        return None

def get_current_user(
    request: Request,
    arusuka_session: Optional[str] = Cookie(default=None)
) -> str:
    # 1. Check cookie
    user = verify_session_token(arusuka_session)
    if user:
        return user
    
    # 2. Check Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        user = verify_session_token(token)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentikasi diperlukan. Silakan login terlebih dahulu."
    )

# --- Helper Functions ---

def get_db_connection(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def format_uptime(seconds: float) -> str:
    days, rem = divmod(int(seconds), 86400)
    hours, rem = divmod(rem, 3600)
    mins, _ = divmod(rem, 60)
    parts = []
    if days > 0:
        parts.append(f"{days}h")
    if hours > 0:
        parts.append(f"{hours}j")
    parts.append(f"{mins}m")
    return " ".join(parts)

def init_task_db():
    TASK_DB.parent.mkdir(parents=True, exist_ok=True)
    with get_db_connection(TASK_DB) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS personal_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                status TEXT NOT NULL DEFAULT 'todo',
                priority TEXT NOT NULL DEFAULT 'medium',
                category TEXT DEFAULT 'Personal',
                due_date TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

init_task_db()

# --- Models ---

class LoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class TaskCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "todo"
    priority: str = "medium"
    category: str = "Personal"
    due_date: str = ""

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None

class JobCreate(BaseModel):
    company: str
    role: str
    location: str = "Remote"
    salary: str = "Kompetitif"
    job_url: str = ""
    status: str = "wishlist"
    applied_date: Optional[str] = None
    next_schedule: str = ""
    notes: str = ""

class JobStatusUpdate(BaseModel):
    status: str
    next_schedule: Optional[str] = None
    notes: Optional[str] = None

# --- Auth Endpoints ---

@app.get("/api/auth/status")
def auth_status(request: Request, arusuka_session: Optional[str] = Cookie(default=None)):
    """Check if current session is authenticated via cookie or header."""
    user = verify_session_token(arusuka_session)
    if not user:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            user = verify_session_token(token)
    return {
        "authenticated": bool(user),
        "username": user or ""
    }

# --- Rate Limiter (In-Memory IP Limiter for Login Endpoint) ---
LOGIN_ATTEMPTS: Dict[str, list[float]] = {}

def check_login_rate_limit(request: Request, max_attempts: int = 5, window_seconds: int = 60):
    """Enforce maximum 5 login attempts per IP per minute."""
    client_ip = request.headers.get("x-real-ip")
    if not client_ip:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
    if not client_ip and request.client:
        client_ip = request.client.host
    client_ip = client_ip or "unknown"

    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(client_ip, [])
    # Keep only attempts in the last window_seconds
    recent_attempts = [t for t in attempts if now - t < window_seconds]

    if len(recent_attempts) >= max_attempts:
        retry_after = int(window_seconds - (now - recent_attempts[0])) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan login (maksimal {max_attempts}x dalam {window_seconds} detik). Silakan coba lagi dalam {max(1, retry_after)} detik.",
            headers={"Retry-After": str(max(1, retry_after))}
        )

    recent_attempts.append(now)
    LOGIN_ATTEMPTS[client_ip] = recent_attempts

@app.post("/api/auth/login")
def login(payload: LoginRequest, request: Request, response: Response):
    """Authenticate user and issue session cookie with rate limiting."""
    # Enforce 5 login attempts per 1 minute per IP
    check_login_rate_limit(request, max_attempts=5, window_seconds=60)

    config = load_or_init_auth_config()
    stored_username = config.get("username", "arusuka")
    stored_pwd_hash = config.get("password_hash", "")

    if payload.username != stored_username or not verify_password(payload.password, stored_pwd_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah."
        )

    token = create_session_token(payload.username)
    expire_days = config.get("session_expire_days", 30)
    
    # Check if HTTPS
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
    )

    response.set_cookie(
        key="arusuka_session",
        value=token,
        max_age=expire_days * 86400,
        httponly=True,
        samesite="lax",
        secure=is_secure
    )

    return {
        "status": "success",
        "message": "Login berhasil!",
        "username": payload.username,
        "token": token
    }

@app.post("/api/auth/logout")
def logout(response: Response):
    """Clear session cookie."""
    response.delete_cookie(key="arusuka_session")
    return {"status": "success", "message": "Logout berhasil."}

@app.post("/api/auth/change-password")
def change_password(payload: ChangePasswordRequest, current_user: str = Depends(get_current_user)):
    """Change dashboard master password."""
    config = load_or_init_auth_config()
    stored_pwd_hash = config.get("password_hash", "")

    if not verify_password(payload.old_password, stored_pwd_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password lama tidak sesuai."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password baru minimal 6 karakter."
        )

    new_hash = hash_password(payload.new_password)
    config["password_hash"] = new_hash
    config["secret_key"] = secrets.token_hex(32)  # Invalidate other sessions
    AUTH_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")

    return {"status": "success", "message": "Password berhasil diperbarui."}

# --- Core Protected Dashboard APIs ---

@app.get("/api/overview")
def get_overview(current_user: str = Depends(get_current_user)):
    """Aggregated high-level overview metrics for the dashboard home."""
    now = datetime.now()
    
    # 1. System summary
    cpu_pct = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    disk = shutil.disk_usage("/")
    boot_time = psutil.boot_time()
    uptime_sec = time.time() - boot_time

    # 2. Personal Task summary
    task_counts = {"backlog": 0, "todo": 0, "in_progress": 0, "review": 0, "done": 0, "total_active": 0, "urgent": 0}
    if TASK_DB.exists():
        try:
            with get_db_connection(TASK_DB) as conn:
                cur = conn.cursor()
                cur.execute("SELECT status, COUNT(*) as cnt FROM personal_tasks GROUP BY status")
                for row in cur.fetchall():
                    st = row["status"]
                    cnt = row["cnt"]
                    if st in task_counts:
                        task_counts[st] = cnt
                    if st != "done":
                        task_counts["total_active"] += cnt
                cur.execute("SELECT COUNT(*) FROM personal_tasks WHERE priority IN ('urgent', 'high') AND status != 'done'")
                task_counts["urgent"] = cur.fetchone()[0]
        except Exception as e:
            print(f"Error reading tasks: {e}")

    # 3. Job Hunter summary
    job_counts = {"wishlist": 0, "applied": 0, "screening": 0, "tech_test": 0, "interview": 0, "offering": 0, "rejected": 0, "total_active": 0}
    if JOB_DB.exists():
        try:
            with get_db_connection(JOB_DB) as conn:
                cur = conn.cursor()
                cur.execute("SELECT status, COUNT(*) as cnt FROM job_applications GROUP BY status")
                for row in cur.fetchall():
                    st = row["status"]
                    cnt = row["cnt"]
                    if st in job_counts:
                        job_counts[st] = cnt
                    if st not in ("rejected", "offering"):
                        job_counts["total_active"] += cnt
        except Exception as e:
            print(f"Error reading jobs: {e}")

    # 4. Second Brain & Graph stats (Filtered: No Finance/Debt)
    total_notes = 0
    inbox_notes = 0
    if BRAIN_DIR.exists():
        for root, _, files in os.walk(str(BRAIN_DIR)):
            if ".obsidian" in root or ".trash" in root:
                continue
            for f in files:
                if f.endswith(".md") and not is_finance_related(f):
                    total_notes += 1
        inbox_dir = BRAIN_DIR / "Inbox"
        if inbox_dir.exists():
            inbox_notes = len([f for f in inbox_dir.glob("*.md") if not is_finance_related(f.name)])

    graph_entities = 0
    graph_relations = 0
    if GRAPH_DB.exists():
        try:
            with get_db_connection(GRAPH_DB) as conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT COUNT(*) FROM entities
                    WHERE LOWER(name) NOT LIKE '%finance%'
                      AND LOWER(name) NOT LIKE '%debt%'
                      AND LOWER(name) NOT LIKE '%pinjol%'
                      AND LOWER(name) NOT LIKE '%tagihan%'
                      AND LOWER(name) NOT LIKE '%wallet%'
                      AND LOWER(name) NOT LIKE '%dompet%'
                      AND LOWER(name) NOT LIKE '%cicilan%'
                      AND LOWER(name) NOT LIKE '%paylater%'
                """)
                graph_entities = cur.fetchone()[0]
                cur.execute("""
                    SELECT COUNT(*) FROM relations
                    WHERE LOWER(source_entity) NOT LIKE '%finance%'
                      AND LOWER(target_entity) NOT LIKE '%finance%'
                      AND LOWER(source_entity) NOT LIKE '%debt%'
                      AND LOWER(target_entity) NOT LIKE '%debt%'
                """)
                graph_relations = cur.fetchone()[0]
        except Exception as e:
            print(f"Error reading graph: {e}")

    # 5. Pokemon Queue
    pokemon_queue_count = 0
    if POKEMON_QUEUE.exists():
        try:
            items = json.loads(POKEMON_QUEUE.read_text(encoding="utf-8"))
            pokemon_queue_count = len(items)
        except Exception:
            pass

    # 6. Quick Weather Snippet
    weather_snippet = {
        "location": "Surabaya",
        "temp_c": 28.0,
        "condition": "Cerah Berawan",
        "icon": "🌤️",
        "aqi": 65,
        "aqi_category": "Sedang (Moderate)",
        "aqi_icon": "🟡"
    }
    if fetch_weather_and_aqi:
        try:
            w_res = fetch_weather_and_aqi(-7.2575, 112.7521, "Surabaya, Jawa Timur")
            weather_snippet = {
                "location": "Surabaya",
                "temp_c": w_res["weather"]["temperature_c"],
                "condition": w_res["weather"]["condition"],
                "icon": w_res["weather"]["icon"],
                "aqi": w_res["air_quality"]["us_aqi"],
                "aqi_category": w_res["air_quality"]["category"],
                "aqi_icon": w_res["air_quality"]["icon"]
            }
        except Exception as e:
            print(f"Error fetching weather: {e}")

    return {
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S"),
        "user": current_user,
        "system": {
            "cpu_percent": cpu_pct,
            "ram_percent": mem.percent,
            "ram_used_gb": round(mem.used / (1024**3), 2),
            "ram_total_gb": round(mem.total / (1024**3), 2),
            "disk_percent": round((disk.used / disk.total) * 100, 1),
            "disk_free_gb": round(disk.free / (1024**3), 1),
            "uptime": format_uptime(uptime_sec),
        },
        "tasks": task_counts,
        "jobs": job_counts,
        "second_brain": {
            "total_notes": total_notes,
            "inbox_notes": inbox_notes,
            "graph_entities": graph_entities,
            "graph_relations": graph_relations
        },
        "weather": weather_snippet,
        "pokemon_queue": pokemon_queue_count
    }

# --- Personal Tasks CRUD API ---

@app.get("/api/tasks")
def get_tasks(
    search: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Fetch personal tasks grouped by Kanban columns + stats."""
    if not TASK_DB.exists():
        init_task_db()

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        query = "SELECT * FROM personal_tasks WHERE 1=1"
        params = []
        
        if search:
            query += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param])
        if category and category.lower() != "all":
            query += " AND category = ?"
            params.append(category)
        if priority and priority.lower() != "all":
            query += " AND priority = ?"
            params.append(priority)
        if status:
            query += " AND status = ?"
            params.append(status)
            
        query += """
            ORDER BY 
            CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
                ELSE 5 
            END ASC,
            updated_at DESC, id DESC
        """
        
        cur.execute(query, params)
        all_tasks = [dict(r) for r in cur.fetchall()]

    columns = {
        "backlog": [],
        "todo": [],
        "in_progress": [],
        "review": [],
        "done": []
    }
    for t in all_tasks:
        st = t["status"]
        if st in columns:
            columns[st].append(t)
        else:
            columns["todo"].append(t)

    stats = {k: len(v) for k, v in columns.items()}
    stats["total"] = len(all_tasks)
    stats["active"] = sum(len(v) for k, v in columns.items() if k != "done")
    stats["urgent"] = sum(1 for t in all_tasks if t.get("priority") in ("urgent", "high") and t.get("status") != "done")

    # Categories list
    categories = []
    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT category FROM personal_tasks WHERE category != '' ORDER BY category ASC")
        categories = [r[0] for r in cur.fetchall()]

    return {
        "columns": columns,
        "stats": stats,
        "categories": categories,
        "total_count": len(all_tasks)
    }

@app.post("/api/tasks")
def create_task(task: TaskCreate, current_user: str = Depends(get_current_user)):
    """Add a new personal task."""
    if not TASK_DB.exists():
        init_task_db()

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO personal_tasks (title, description, status, priority, category, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (task.title, task.description, task.status, task.priority, task.category, task.due_date))
        conn.commit()
        new_id = cur.lastrowid

    trigger_ws_event("tasks_updated", {"action": "created", "id": new_id, "title": task.title})
    return {"status": "success", "id": new_id, "message": f"Task '{task.title}' berhasil ditambahkan"}

@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, current_user: str = Depends(get_current_user)):
    """Update personal task status, priority, description, etc."""
    if not TASK_DB.exists():
        raise HTTPException(status_code=404, detail="Task database not found")

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM personal_tasks WHERE id=?", (task_id,))
        task = cur.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        updates = ["updated_at = CURRENT_TIMESTAMP"]
        params = []

        if payload.title is not None:
            updates.append("title = ?")
            params.append(payload.title)
        if payload.description is not None:
            updates.append("description = ?")
            params.append(payload.description)
        if payload.status is not None:
            updates.append("status = ?")
            params.append(payload.status)
        if payload.priority is not None:
            updates.append("priority = ?")
            params.append(payload.priority)
        if payload.category is not None:
            updates.append("category = ?")
            params.append(payload.category)
        if payload.due_date is not None:
            updates.append("due_date = ?")
            params.append(payload.due_date)

        params.append(task_id)
        cur.execute(f"UPDATE personal_tasks SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    trigger_ws_event("tasks_updated", {"action": "updated", "id": task_id})
    return {"status": "success", "message": f"Task #{task_id} berhasil diperbarui"}

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: int, current_user: str = Depends(get_current_user)):
    """Delete a personal task."""
    if not TASK_DB.exists():
        raise HTTPException(status_code=404, detail="Task database not found")

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM personal_tasks WHERE id=?", (task_id,))
        conn.commit()

    trigger_ws_event("tasks_updated", {"action": "deleted", "id": task_id})
    return {"status": "success", "message": f"Task #{task_id} berhasil dihapus"}

# --- System Metrics API ---

@app.get("/api/system")
def get_system_metrics(current_user: str = Depends(get_current_user)):
    """Detailed System health & Fail2ban security statistics."""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk_root = shutil.disk_usage("/")
    disk_home = shutil.disk_usage(str(HOME_DIR))
    boot_time = psutil.boot_time()
    uptime_sec = time.time() - boot_time
    load_1, load_5, load_15 = os.getloadavg()

    # Fail2ban info
    fail2ban_info = {"status": "inactive", "jails": [], "banned_count": 0, "failed_count": 0}
    try:
        res = subprocess.run(["sudo", "fail2ban-client", "status"], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            lines = res.stdout.strip().split("\n")
            jails = []
            for l in lines:
                if "Jail list:" in l:
                    jails = [j.strip() for j in l.split(":", 1)[1].split(",") if j.strip()]
            fail2ban_info["status"] = "active"
            fail2ban_info["jails"] = jails
            
            # check sshd jail
            res_sshd = subprocess.run(["sudo", "fail2ban-client", "status", "sshd"], capture_output=True, text=True, timeout=3)
            if res_sshd.returncode == 0:
                for l in res_sshd.stdout.splitlines():
                    if "Total banned:" in l:
                        fail2ban_info["banned_count"] = int(l.split(":", 1)[1].strip())
                    elif "Total failed:" in l:
                        fail2ban_info["failed_count"] = int(l.split(":", 1)[1].strip())
    except Exception as e:
        fail2ban_info["error"] = str(e)

    return {
        "hostname": os.uname().nodename,
        "os": f"{os.uname().sysname} {os.uname().release}",
        "uptime": format_uptime(uptime_sec),
        "uptime_seconds": int(uptime_sec),
        "load_avg": [round(load_1, 2), round(load_5, 2), round(load_15, 2)],
        "cpu": {
            "percent": psutil.cpu_percent(interval=0.1),
            "cores_physical": psutil.cpu_count(logical=False),
            "cores_logical": psutil.cpu_count(logical=True),
            "per_cpu": psutil.cpu_percent(interval=0.1, percpu=True)
        },
        "memory": {
            "total_gb": round(mem.total / (1024**3), 2),
            "used_gb": round(mem.used / (1024**3), 2),
            "free_gb": round(mem.available / (1024**3), 2),
            "percent": mem.percent,
            "swap_used_gb": round(swap.used / (1024**3), 2),
            "swap_total_gb": round(swap.total / (1024**3), 2),
            "swap_percent": swap.percent
        },
        "disk": {
            "root": {
                "total_gb": round(disk_root.total / (1024**3), 2),
                "used_gb": round(disk_root.used / (1024**3), 2),
                "free_gb": round(disk_root.free / (1024**3), 2),
                "percent": round((disk_root.used / disk_root.total) * 100, 1)
            },
            "home": {
                "total_gb": round(disk_home.total / (1024**3), 2),
                "used_gb": round(disk_home.used / (1024**3), 2),
                "free_gb": round(disk_home.free / (1024**3), 2),
                "percent": round((disk_home.used / disk_home.total) * 100, 1)
            }
        },
        "security": fail2ban_info
    }

# --- Job Hunter API ---

@app.get("/api/jobs")
def get_jobs(
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Fetch job applications grouped by Kanban columns + stats."""
    if not JOB_DB.exists():
        raise HTTPException(status_code=404, detail="Job hunter database not found")

    with get_db_connection(JOB_DB) as conn:
        cur = conn.cursor()
        query = "SELECT * FROM job_applications WHERE 1=1"
        params = []
        if search:
            query += " AND (company LIKE ? OR role LIKE ? OR location LIKE ? OR notes LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param, s_param])
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY updated_at DESC, id DESC"
        
        cur.execute(query, params)
        all_jobs = [dict(r) for r in cur.fetchall()]

    # Group by Kanban columns
    columns = {
        "wishlist": [],
        "applied": [],
        "screening": [],
        "tech_test": [],
        "interview": [],
        "offering": [],
        "rejected": []
    }
    for j in all_jobs:
        st = j["status"]
        if st in columns:
            columns[st].append(j)
        else:
            columns["wishlist"].append(j)

    stats = {k: len(v) for k, v in columns.items()}
    stats["total"] = len(all_jobs)
    stats["active"] = sum(len(v) for k, v in columns.items() if k not in ("rejected", "offering"))

    return {
        "columns": columns,
        "stats": stats,
        "total_count": len(all_jobs)
    }

@app.post("/api/jobs")
def create_job(job: JobCreate, current_user: str = Depends(get_current_user)):
    """Add a new job application."""
    if not JOB_DB.exists():
        raise HTTPException(status_code=404, detail="Job hunter database not found")

    applied_date = job.applied_date
    if not applied_date and job.status != "wishlist":
        applied_date = date.today().strftime("%Y-%m-%d")

    with get_db_connection(JOB_DB) as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO job_applications (company, role, location, salary, job_url, status, applied_date, next_schedule, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (job.company, job.role, job.location, job.salary, job.job_url, job.status, applied_date, job.next_schedule, job.notes))
        conn.commit()
        new_id = cur.lastrowid

    trigger_ws_event("jobs_updated", {"action": "created", "id": new_id, "company": job.company})
    return {"status": "success", "id": new_id, "message": f"Job application for {job.company} added"}

@app.patch("/api/jobs/{job_id}/status")
def update_job_status(job_id: int, payload: JobStatusUpdate, current_user: str = Depends(get_current_user)):
    """Advance or update the status of a job application."""
    if not JOB_DB.exists():
        raise HTTPException(status_code=404, detail="Job hunter database not found")

    with get_db_connection(JOB_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM job_applications WHERE id=?", (job_id,))
        job = cur.fetchone()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        updates = ["status = ?", "updated_at = CURRENT_TIMESTAMP"]
        params = [payload.status]

        if payload.next_schedule is not None:
            updates.append("next_schedule = ?")
            params.append(payload.next_schedule)
        if payload.notes is not None:
            updates.append("notes = ?")
            params.append(payload.notes)

        # Set applied date if moving from wishlist to applied
        if job["status"] == "wishlist" and payload.status != "wishlist" and not job["applied_date"]:
            updates.append("applied_date = ?")
            params.append(date.today().strftime("%Y-%m-%d"))

        params.append(job_id)
        cur.execute(f"UPDATE job_applications SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    trigger_ws_event("jobs_updated", {"action": "updated", "id": job_id, "status": payload.status})
    return {"status": "success", "message": f"Job #{job_id} moved to {payload.status}"}

@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: int, current_user: str = Depends(get_current_user)):
    """Remove a job application."""
    if not JOB_DB.exists():
        raise HTTPException(status_code=404, detail="Job hunter database not found")

    with get_db_connection(JOB_DB) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM job_applications WHERE id=?", (job_id,))
        conn.commit()

    trigger_ws_event("jobs_updated", {"action": "deleted", "id": job_id})
    return {"status": "success", "message": f"Job #{job_id} deleted"}

# --- Second Brain API ---

@app.get("/api/second-brain")
def get_second_brain(query: Optional[str] = None, current_user: str = Depends(get_current_user)):
    """Fetch Second Brain note feed and Knowledge Graph statistics (Excluding private finance data)."""
    notes = []
    if BRAIN_DIR.exists():
        for folder in ["Inbox", "Projects", "Entities", "Preferences", "Rules"]:
            target_dir = BRAIN_DIR / folder
            if not target_dir.exists():
                continue
            for f in target_dir.glob("*.md"):
                # Strict Privacy Filter: Skip any finance/debt files
                if is_finance_related(f.name) or is_finance_related(f.stem):
                    continue

                try:
                    stat = f.stat()
                    content = f.read_text(encoding="utf-8", errors="ignore")
                    
                    # Privacy: exclude any note containing finance keywords
                    if is_finance_related(content):
                        continue

                    if query and query.lower() not in f.name.lower() and query.lower() not in content.lower():
                        continue
                    
                    preview_lines = [l.strip() for l in content.splitlines() if l.strip() and not l.startswith("#")][:3]
                    preview = " ".join(preview_lines)[:180] + "..." if preview_lines else ""

                    notes.append({
                        "filename": f.name,
                        "folder": folder,
                        "title": f.stem.replace("_", " ").title(),
                        "preview": preview,
                        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                        "size_bytes": stat.st_size
                    })
                except Exception:
                    pass

    notes.sort(key=lambda x: x["modified_at"], reverse=True)

    # Graph stats (Strict Privacy Filter)
    graph_stats = {"entities_count": 0, "relations_count": 0, "top_entities": []}
    if GRAPH_DB.exists():
        try:
            with get_db_connection(GRAPH_DB) as conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT COUNT(*) FROM entities
                    WHERE LOWER(name) NOT LIKE '%finance%'
                      AND LOWER(name) NOT LIKE '%debt%'
                      AND LOWER(name) NOT LIKE '%pinjol%'
                      AND LOWER(name) NOT LIKE '%tagihan%'
                      AND LOWER(name) NOT LIKE '%wallet%'
                      AND LOWER(name) NOT LIKE '%dompet%'
                      AND LOWER(name) NOT LIKE '%cicilan%'
                      AND LOWER(name) NOT LIKE '%paylater%'
                """)
                graph_stats["entities_count"] = cur.fetchone()[0]
                cur.execute("""
                    SELECT COUNT(*) FROM relations
                    WHERE LOWER(source_entity) NOT LIKE '%finance%'
                      AND LOWER(target_entity) NOT LIKE '%finance%'
                      AND LOWER(source_entity) NOT LIKE '%debt%'
                      AND LOWER(target_entity) NOT LIKE '%debt%'
                """)
                graph_stats["relations_count"] = cur.fetchone()[0]
                
                cur.execute("""
                    SELECT name, entity_type, COUNT(r.id) as connection_count
                    FROM entities e
                    LEFT JOIN relations r ON e.name = r.source_entity OR e.name = r.target_entity
                    WHERE LOWER(e.name) NOT LIKE '%finance%'
                      AND LOWER(e.name) NOT LIKE '%debt%'
                      AND LOWER(e.name) NOT LIKE '%pinjol%'
                      AND LOWER(e.name) NOT LIKE '%tagihan%'
                      AND LOWER(e.name) NOT LIKE '%wallet%'
                      AND LOWER(e.name) NOT LIKE '%dompet%'
                      AND LOWER(e.name) NOT LIKE '%cicilan%'
                      AND LOWER(e.name) NOT LIKE '%paylater%'
                    GROUP BY e.name
                    ORDER BY connection_count DESC
                    LIMIT 10
                """)
                graph_stats["top_entities"] = [dict(r) for r in cur.fetchall()]
        except Exception as e:
            print(f"Error reading graph stats: {e}")

    return {
        "notes": notes[:30],
        "total_notes": len(notes),
        "graph": graph_stats
    }

# --- Weather & BMKG API ---

@app.get("/api/weather")
def get_weather_detail(current_user: str = Depends(get_current_user)):
    """Detailed live weather, AQI, and BMKG Earthquake alerts."""
    weather_data = {}
    earthquake_data = {}
    recent_earthquakes = []

    if fetch_weather_and_aqi:
        try:
            weather_data = fetch_weather_and_aqi(-7.2575, 112.7521, "Surabaya, Jawa Timur")
        except Exception as e:
            weather_data = {"error": str(e)}

    if fetch_latest_earthquake:
        try:
            earthquake_data = fetch_latest_earthquake()
        except Exception as e:
            earthquake_data = {"error": str(e)}

    if fetch_recent_earthquakes:
        try:
            recent_earthquakes = fetch_recent_earthquakes(limit=5)
        except Exception as e:
            recent_earthquakes = []

    return {
        "weather": weather_data,
        "earthquake": earthquake_data,
        "recent_earthquakes": recent_earthquakes
    }

@app.get("/api/zepp")
def get_zepp_fitness_data(current_user: str = Depends(get_current_user)):
    """Fetch live Amazfit / Zepp step, calories, distance, and sleep metrics."""
    if not zepp_client_instance:
        return {"status": "unconfigured", "message": "Modul Zepp MCP belum diinisialisasi."}

    today_str = datetime.now().strftime("%Y-%m-%d")
    week_ago_str = (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d")

    try:
        records = zepp_client_instance.get_band_data_summary(week_ago_str, today_str)
        history = []
        last_valid_sleep = None
        today_data = None

        for rec in records:
            summary = rec.get("summary", {})
            stp = summary.get("stp", {})
            slp = summary.get("slp", {})
            
            ttl_steps = stp.get("ttl", 0) or 0
            goal = summary.get("goal", 8000) or 8000
            dis_m = stp.get("dis", 0) or 0
            cal = stp.get("cal", 0) or 0
            wk = stp.get("wk", 0) or 0
            rn = stp.get("rn", 0) or 0
            
            dp = slp.get("dp", 0) or 0
            lt = slp.get("lt", 0) or 0
            ss = slp.get("ss", 0) or 0
            awake = slp.get("wk", 0) or 0
            total_sleep = dp + lt + ss

            item = {
                "date": rec.get("date"),
                "steps": ttl_steps,
                "goal": goal,
                "goal_percent": min(100, round((ttl_steps / goal) * 100, 1)) if goal > 0 else 0,
                "distance_km": round(dis_m / 1000.0, 2),
                "calories_kcal": cal,
                "active_mins": wk + rn,
                "sleep_mins": total_sleep,
                "sleep_hours": f"{total_sleep // 60}j {total_sleep % 60}m" if total_sleep > 0 else "0j",
                "deep_sleep_mins": dp,
                "light_sleep_mins": lt,
                "rem_mins": ss,
                "awake_mins": awake
            }
            history.append(item)
            if total_sleep > 0:
                last_valid_sleep = item
            if rec.get("date") == today_str:
                today_data = item

        if not today_data and history:
            today_data = history[-1]

        return {
            "status": "synced",
            "today": today_data or {
                "date": today_str,
                "steps": 0,
                "goal": 8000,
                "goal_percent": 0,
                "distance_km": 0,
                "calories_kcal": 0,
                "active_mins": 0,
                "sleep_mins": 0,
                "sleep_hours": "0j"
            },
            "last_sleep": last_valid_sleep,
            "history_7days": history
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/schedules")
def get_system_schedules(current_user: str = Depends(get_current_user)):
    """Active automated cron schedules, routines, and maintenance timers."""
    hermes_jobs_file = HOME_DIR / ".hermes" / "cron" / "jobs.json"
    hermes_jobs = []
    if hermes_jobs_file.exists():
        try:
            h_data = json.loads(hermes_jobs_file.read_text(encoding="utf-8"))
            hermes_jobs = h_data.get("jobs", [])
        except Exception:
            pass

    schedules = [
        {
            "id": "bmkg-earthquake-guardian",
            "name": "BMKG Real-Time Earthquake & Tsunami Guardian",
            "schedule": "Setiap 45 Detik (Loop 24/7)",
            "cron_expr": "systemd daemon (45s loop)",
            "type": "Continuous Guardian Daemon",
            "icon": "shield-alert",
            "category": "Disaster Early Warning",
            "badge_color": "rose",
            "status": "active",
            "target": "Telegram (@fahmirizal96)",
            "description": "Memantau API TEWS BMKG non-stop setiap 45 detik, menghitung radius jarak gempa ke Surabaya (-7.2575, 112.7521), dan otomatis mengirimkan peringatan darurat instan + foto Shakemap ke Telegram jika terdeteksi gempa baru.",
            "next_run": "Real-time (Interval 45s)"
        },
        {
            "id": "hermes-morning-report",
            "name": "Server Morning Health Report",
            "schedule": "06:30 WIB Setiap Hari",
            "cron_expr": "30 6 * * *",
            "type": "Hermes AI Agent (Autonomous)",
            "icon": "bot",
            "category": "Server & AI Audit",
            "badge_color": "indigo",
            "status": "active",
            "target": "Telegram (@fahmirizal96)",
            "description": "Hermes Agent melakukan audit kesehatan server secara mandiri (CPU, RAM, disk storage, load average, uptime, dan status servis kritis) lalu mengirimkan laporan komprehensif ke Telegram pemilik.",
            "next_run": "Besok, 06:30 WIB"
        },
        {
            "id": "crontab-morning-briefing",
            "name": "Arusuka Morning Briefing & Greeting",
            "schedule": "07:00 WIB Setiap Hari",
            "cron_expr": "0 7 * * *",
            "type": "Daily Routine (Python Script)",
            "icon": "sun",
            "category": "Personal & Lifestyle",
            "badge_color": "amber",
            "status": "active",
            "target": "Telegram (@fahmirizal96)",
            "description": "Morning greeting personal dari Arusuka yang merangkum prakiraan cuaca Surabaya hari ini, indeks kualitas udara (AQI), status ringkas server, serta catatan motivasi pagi.",
            "next_run": "Besok, 07:00 WIB"
        },
        {
            "id": "crontab-nightly-reflection",
            "name": "Arusuka Nightly Reflection & Check-in",
            "schedule": "22:00 WIB Setiap Hari",
            "cron_expr": "0 22 * * *",
            "type": "Daily Routine (Python Script)",
            "icon": "moon",
            "category": "Personal Growth & Memory",
            "badge_color": "purple",
            "status": "active",
            "target": "Telegram & Second Brain",
            "description": "Sesi check-in malam hari untuk merefleksikan pencapaian hari ini, pengingat istirahat/tidur, dan auto-capture insight/catatan refleksi ke Obsidian Second Brain.",
            "next_run": "Besok, 22:00 WIB"
        },
        {
            "id": "systemd-certbot-ssl",
            "name": "Let's Encrypt SSL Auto-Renewal",
            "schedule": "Setiap 12 Jam",
            "cron_expr": "systemd timer (certbot.timer)",
            "type": "Security & Web Server",
            "icon": "shield-check",
            "category": "Maintenance",
            "badge_color": "emerald",
            "status": "active",
            "target": "Nginx Web Server",
            "description": "Pengecekan otomatis masa berlaku sertifikat HTTPS SSL untuk domain arusuka.my.id dan dashboard.arusuka.my.id, serta auto-renewal sebelum kedaluwarsa.",
            "next_run": "Berkala (12 jam)"
        },
        {
            "id": "systemd-logrotate",
            "name": "System Logrotate & Disk Cleaner",
            "schedule": "00:00 WIB Setiap Hari",
            "cron_expr": "systemd timer (logrotate.timer)",
            "type": "OS Maintenance",
            "icon": "archive",
            "category": "Maintenance",
            "badge_color": "slate",
            "status": "active",
            "target": "System Logs (/var/log/)",
            "description": "Rotasi, kompresi, dan pembersihan log sistem harian (Nginx, Fail2ban, Syslog) untuk menjaga kapasitas storage SSD server tetap optimal.",
            "next_run": "Tengah Malam (00:00 WIB)"
        }
    ]

    return {
        "total": len(schedules),
        "schedules": schedules,
        "raw_hermes": hermes_jobs
    }

# --- Realtime WebSocket Gateway ---

@app.websocket("/ws")
@app.websocket("/api/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(default=None)
):
    """Realtime WebSocket endpoint for instant telemetry and event broadcasts."""
    session_cookie = websocket.cookies.get("arusuka_session")
    auth_token = token or session_cookie
    user = verify_session_token(auth_token) if auth_token else None

    await ws_manager.connect(websocket)

    try:
        # Initial handshake confirmation
        await websocket.send_text(json.dumps({
            "type": "connected",
            "authenticated": bool(user),
            "user": user or "guest",
            "message": "Arusuka Realtime WebSocket Connected",
            "timestamp": datetime.now().isoformat()
        }))

        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                msg_type = msg.get("type")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "time": time.time()}))
                elif msg_type == "auth":
                    token_val = msg.get("token")
                    valid_user = verify_session_token(token_val)
                    if valid_user:
                        user = valid_user
                        await websocket.send_text(json.dumps({"type": "auth_success", "user": user}))
                    else:
                        await websocket.send_text(json.dumps({"type": "auth_failed"}))
                elif msg_type == "request_refresh":
                    target = msg.get("target", "all")
                    if target in ("all", "overview"):
                        ov = get_overview(current_user=user or "arusuka")
                        await websocket.send_text(json.dumps({"type": "overview_data", "data": ov}))
                    if target in ("all", "tasks"):
                        tk = get_tasks(current_user=user or "arusuka")
                        await websocket.send_text(json.dumps({"type": "tasks_data", "data": tk}))
                    if target in ("all", "jobs"):
                        jb = get_jobs(current_user=user or "arusuka")
                        await websocket.send_text(json.dumps({"type": "jobs_data", "data": jb}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)

# --- Storage Vault & File / Photo Manager ---
STORAGE_VAULT_DIR = HOME_DIR / "storage_vault"
STORAGE_VAULT_DIR.mkdir(parents=True, exist_ok=True)
for sub in ["Photos", "Documents", "Backups"]:
    (STORAGE_VAULT_DIR / sub).mkdir(parents=True, exist_ok=True)

def safe_resolve_vault_path(rel_path: str = "") -> Path:
    """Resolve subpath securely inside STORAGE_VAULT_DIR, preventing path traversal."""
    cleaned = (rel_path or "").strip().lstrip("/").replace("\\", "/")
    full_path = (STORAGE_VAULT_DIR / cleaned).resolve()
    vault_resolved = STORAGE_VAULT_DIR.resolve()
    if full_path != vault_resolved and not str(full_path).startswith(str(vault_resolved) + "/"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: Jalur path tidak valid atau berada di luar folder penyimpanan."
        )
    return full_path

def get_dir_size(path: Path) -> int:
    total = 0
    try:
        for entry in os.scandir(path):
            if entry.is_file(follow_symlinks=False):
                total += entry.stat().st_size
            elif entry.is_dir(follow_symlinks=False):
                total += get_dir_size(Path(entry.path))
    except Exception:
        pass
    return total

def format_bytes(size: int) -> str:
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}" if unit != 'B' else f"{size} B"
        size /= 1024.0
    return f"{size:.1f} PB"

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.heic', '.avif'}
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv'}
DOC_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'}
ARCHIVE_EXTENSIONS = {'.zip', '.tar', '.gz', '.bz2', '.7z', '.rar'}

class CreateFolderRequest(BaseModel):
    path: str = ""
    folder_name: str

class RenameItemRequest(BaseModel):
    path: str = ""
    old_name: str
    new_name: str

class DeleteItemRequest(BaseModel):
    path: str

@app.get("/api/storage/files")
def list_storage_files(
    path: str = Query(default="", description="Subpath relative to storage vault"),
    current_user: str = Depends(get_current_user)
):
    """List files, folders, breadcrumbs, and disk statistics inside storage vault."""
    target_dir = safe_resolve_vault_path(path)
    if not target_dir.exists() or not target_dir.is_dir():
        raise HTTPException(status_code=404, detail="Direktori tidak ditemukan.")

    vault_resolved = STORAGE_VAULT_DIR.resolve()
    rel_from_vault = target_dir.relative_to(vault_resolved)
    rel_str = str(rel_from_vault).replace("\\", "/")
    if rel_str == ".":
        rel_str = ""

    parts = rel_str.split("/") if rel_str else []
    breadcrumbs = [{"name": "Storage Vault", "path": ""}]
    acc = ""
    for part in parts:
        acc = f"{acc}/{part}" if acc else part
        breadcrumbs.append({"name": part, "path": acc})

    items = []
    total_files_count = 0
    total_photos_count = 0

    try:
        with os.scandir(target_dir) as entries:
            for entry in entries:
                is_dir = entry.is_dir(follow_symlinks=False)
                ext = Path(entry.name).suffix.lower() if not is_dir else ""
                stat = entry.stat(follow_symlinks=False)
                size_bytes = stat.st_size if not is_dir else 0
                is_img = ext in IMAGE_EXTENSIONS
                is_vid = ext in VIDEO_EXTENSIONS
                
                if not is_dir:
                    total_files_count += 1
                    if is_img:
                        total_photos_count += 1

                item_rel_path = f"{rel_str}/{entry.name}".lstrip("/")

                items.append({
                    "name": entry.name,
                    "path": item_rel_path,
                    "is_dir": is_dir,
                    "size": size_bytes,
                    "size_formatted": format_bytes(size_bytes) if not is_dir else "--",
                    "mtime": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "mtime_ts": stat.st_mtime,
                    "ext": ext.replace(".", ""),
                    "is_image": is_img,
                    "is_video": is_vid,
                    "is_doc": ext in DOC_EXTENSIONS,
                    "is_archive": ext in ARCHIVE_EXTENSIONS,
                    "preview_url": f"/api/storage/preview?path={urllib.parse.quote(item_rel_path)}" if (is_img or is_vid) else None,
                    "download_url": f"/api/storage/download?path={urllib.parse.quote(item_rel_path)}" if not is_dir else None,
                })
    except PermissionError:
        raise HTTPException(status_code=403, detail="Izin akses direktori ditolak.")

    # Sort: folders first (alphabetical), then files (alphabetical)
    items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))

    # Disk usage stats
    disk = shutil.disk_usage(str(STORAGE_VAULT_DIR))
    vault_used_bytes = get_dir_size(STORAGE_VAULT_DIR)

    return {
        "current_path": rel_str,
        "breadcrumbs": breadcrumbs,
        "items": items,
        "total_items": len(items),
        "total_files": total_files_count,
        "total_photos": total_photos_count,
        "disk": {
            "vault_used_bytes": vault_used_bytes,
            "vault_used_formatted": format_bytes(vault_used_bytes),
            "disk_total_bytes": disk.total,
            "disk_total_gb": round(disk.total / (1024**3), 1),
            "disk_used_bytes": disk.used,
            "disk_used_gb": round(disk.used / (1024**3), 1),
            "disk_free_bytes": disk.free,
            "disk_free_gb": round(disk.free / (1024**3), 1),
            "disk_percent": round((disk.used / disk.total) * 100, 1),
        }
    }

@app.post("/api/storage/upload")
async def upload_files(
    path: str = Form(default=""),
    files: List[UploadFile] = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload one or multiple files/photos into the specified vault folder."""
    target_dir = safe_resolve_vault_path(path)
    if not target_dir.exists() or not target_dir.is_dir():
        raise HTTPException(status_code=404, detail="Direktori tujuan tidak ditemukan.")

    uploaded_names = []
    for file in files:
        safe_filename = Path(file.filename or f"upload_{int(time.time())}").name
        dest_path = target_dir / safe_filename
        
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while (target_dir / f"{stem}_{counter}{suffix}").exists():
                counter += 1
            dest_path = target_dir / f"{stem}_{counter}{suffix}"
            safe_filename = dest_path.name

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        uploaded_names.append(safe_filename)

    trigger_ws_event("storage_updated", {"path": path})

    return {
        "status": "success",
        "message": f"{len(uploaded_names)} file berhasil diupload.",
        "uploaded_files": uploaded_names
    }

@app.post("/api/storage/mkdir")
def create_folder(
    payload: CreateFolderRequest,
    current_user: str = Depends(get_current_user)
):
    """Create a new folder inside the storage vault."""
    parent_dir = safe_resolve_vault_path(payload.path)
    clean_folder_name = Path(payload.folder_name.strip()).name
    if not clean_folder_name or clean_folder_name in (".", ".."):
        raise HTTPException(status_code=400, detail="Nama folder tidak valid.")

    new_dir = parent_dir / clean_folder_name
    if new_dir.exists():
        raise HTTPException(status_code=400, detail="Folder dengan nama tersebut sudah ada.")

    new_dir.mkdir(parents=True, exist_ok=False)
    trigger_ws_event("storage_updated", {"path": payload.path})
    return {"status": "success", "message": f"Folder '{clean_folder_name}' berhasil dibuat."}

@app.post("/api/storage/rename")
def rename_item(
    payload: RenameItemRequest,
    current_user: str = Depends(get_current_user)
):
    """Rename a file or folder inside the storage vault."""
    parent_dir = safe_resolve_vault_path(payload.path)
    old_target = parent_dir / Path(payload.old_name).name
    new_name_clean = Path(payload.new_name.strip()).name

    if not old_target.exists():
        raise HTTPException(status_code=404, detail="File atau folder yang akan diubah tidak ditemukan.")
    if not new_name_clean or new_name_clean in (".", ".."):
        raise HTTPException(status_code=400, detail="Nama baru tidak valid.")

    new_target = parent_dir / new_name_clean
    if new_target.exists():
        raise HTTPException(status_code=400, detail="File atau folder dengan nama tersebut sudah ada.")

    old_target.rename(new_target)
    trigger_ws_event("storage_updated", {"path": payload.path})
    return {"status": "success", "message": f"Berhasil diubah menjadi '{new_name_clean}'."}

@app.delete("/api/storage/delete")
def delete_item(
    payload: DeleteItemRequest,
    current_user: str = Depends(get_current_user)
):
    """Delete a file or directory from the storage vault."""
    target = safe_resolve_vault_path(payload.path)
    if target == STORAGE_VAULT_DIR.resolve():
        raise HTTPException(status_code=400, detail="Folder utama Storage Vault tidak boleh dihapus.")

    if not target.exists():
        raise HTTPException(status_code=404, detail="File atau folder tidak ditemukan.")

    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()

    trigger_ws_event("storage_updated", {"path": str(Path(payload.path).parent)})
    return {"status": "success", "message": "Berhasil dihapus."}

@app.get("/api/storage/preview")
def preview_file(
    path: str = Query(..., description="Subpath to media file"),
    current_user: str = Depends(get_current_user)
):
    """Preview / stream media file (images, videos, PDFs) with cache headers."""
    target = safe_resolve_vault_path(path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    mime, _ = mimetypes.guess_type(str(target))
    mime = mime or "application/octet-stream"
    
    response = FileResponse(str(target), media_type=mime)
    response.headers["Cache-Control"] = "private, max-age=3600"
    return response

@app.get("/api/storage/download")
def download_file(
    path: str = Query(..., description="Subpath to file"),
    current_user: str = Depends(get_current_user)
):
    """Download a specific file from the vault."""
    target = safe_resolve_vault_path(path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    return FileResponse(
        str(target),
        filename=target.name,
        media_type="application/octet-stream"
    )

# --- Serve React SPA UI ---
DIST_DIR = HOME_DIR / "dashboard" / "dist"
STATIC_DIR = HOME_DIR / "dashboard" / "static"

if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/favicon.ico")
def serve_favicon():
    fav = (DIST_DIR / "favicon.svg") if (DIST_DIR / "favicon.svg").exists() else (STATIC_DIR / "favicon.svg")
    if fav.exists():
        return FileResponse(str(fav), media_type="image/svg+xml")
    return Response(status_code=404)

@app.get("/manifest.json")
def serve_manifest():
    mf = (DIST_DIR / "manifest.json") if (DIST_DIR / "manifest.json").exists() else (STATIC_DIR / "manifest.json")
    if mf.exists():
        return FileResponse(str(mf), media_type="application/json")
    return Response(status_code=404)

@app.get("/")
def serve_index():
    index_file = (DIST_DIR / "index.html") if (DIST_DIR / "index.html").exists() else (STATIC_DIR / "index.html")
    if index_file.exists():
        response = FileResponse(str(index_file))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
    return HTMLResponse("<h1>Arusuka Dashboard Backend Ready.</h1>")

@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # If the file exists directly in dist
    file_path = DIST_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))
    # Fallback to SPA index.html for client-side routing
    index_file = (DIST_DIR / "index.html") if (DIST_DIR / "index.html").exists() else (STATIC_DIR / "index.html")
    if index_file.exists():
        response = FileResponse(str(index_file))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        return response
    return HTMLResponse("<h1>Arusuka Dashboard Ready</h1>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)
