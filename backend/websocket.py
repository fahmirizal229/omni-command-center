"""
WebSocket Real-time Manager & Telemetry Loop.
"""

import sys
import json
import time
import shutil
import asyncio
from datetime import datetime
from typing import Set, Any
import psutil
from fastapi import WebSocket

sys.path.insert(0, "/home/arusuka/scripts")
try:
    import kuro_db
except ImportError:
    kuro_db = None

try:
    import shiro_db
except ImportError:
    shiro_db = None

class WebSocketConnectionManager:
    """Thread-safe WebSocket client manager for event broadcasting."""
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


def clean_process_prompt(raw_text: str, member_id: int = 1) -> str:
    """Extracts a short, readable prompt summary from process arguments."""
    if not raw_text:
        return "Active Engineering Task"
    if kuro_db and hasattr(kuro_db, "clean_prompt_summary"):
        return kuro_db.clean_prompt_summary(raw_text, member_id=member_id)
    import re
    if '[CURRENT USER REQUEST]:' in raw_text:
        req_part = raw_text.split('[CURRENT USER REQUEST]:')[1]
        req_part = req_part.split('[PETUNJUK KEAMANAN')[0].strip()
        lines = [l.strip() for l in req_part.split('\n') if l.strip() and not l.strip().startswith('<')]
        meaningful = [l for l in lines if not (l.startswith('[Replying to') or l.startswith('[BUTTON:') or l.startswith('[PETUNJUK'))]
        if meaningful:
            return meaningful[0][:100]
        if lines:
            return lines[0][:100]
    lines = [l.strip() for l in raw_text.split('\n') if l.strip() and not l.strip().startswith('[') and not l.strip().startswith('<')]
    if lines:
        return lines[0][:100]
    return raw_text[:100].strip() or "Active Engineering Task"


def get_live_swarm_state():
    """Detects realtime busy/active execution state for Kuro and Shiro agents backed by SQLite DB & Linux processes."""
    # Email and account metadata mappings
    kuro_account_meta = {
        1: {
            "name": "Taisho", "user": "arusuka", "email": "fahmijapan4@gmail.com",
            "account_name": "Google One Pro (Knight 1)", "account_tier": "Google One AI Premium (2TB)",
            "title": "Heavy Engineering (Equal Knight)", "title_id": "Taisho — Heavy Engineering (Equal Knight)",
            "role": "Generalist Heavy Engineering (Architecture, Fullstack, Systems & QA)", "icon": "🏯", "color": "amber",
            "domains": ["architecture", "backend", "frontend", "systems", "database", "security", "qa", "devops"]
        },
        2: {
            "name": "Tetsu", "user": "arusuka2", "email": "mfahmirizal48@gmail.com",
            "account_name": "Google One Pro (Knight 2)", "account_tier": "Google One AI Premium (2TB)",
            "title": "Heavy Engineering (Equal Knight)", "title_id": "Tetsu — Heavy Engineering (Equal Knight)",
            "role": "Generalist Heavy Engineering (Architecture, Fullstack, Systems & QA)", "icon": "⚒️", "color": "emerald",
            "domains": ["architecture", "backend", "frontend", "systems", "database", "security", "qa", "devops"]
        },
        3: {
            "name": "Sora", "user": "arusuka3", "email": "shinhajiru@gmail.com",
            "account_name": "Google One Pro (Knight 3)", "account_tier": "Google One AI Premium (2TB)",
            "title": "Heavy Engineering (Equal Knight)", "title_id": "Sora — Heavy Engineering (Equal Knight)",
            "role": "Generalist Heavy Engineering (Architecture, Fullstack, Systems & QA)", "icon": "🌸", "color": "indigo",
            "domains": ["architecture", "backend", "frontend", "systems", "database", "security", "qa", "devops"]
        },
        4: {
            "name": "Kensei", "user": "arusuka4", "email": "fahmirizal25248@gmail.com",
            "account_name": "Google One Pro (Knight 4)", "account_tier": "Google One AI Premium (2TB)",
            "title": "Heavy Engineering (Equal Knight)", "title_id": "Kensei — Heavy Engineering (Equal Knight)",
            "role": "Generalist Heavy Engineering (Architecture, Fullstack, Systems & QA)", "icon": "⚔️", "color": "rose",
            "domains": ["architecture", "backend", "frontend", "systems", "database", "security", "qa", "devops"]
        }
    }

    # 1. Base Kuro State initialized from DB & Metadata
    kuro_state = {}
    for m_id, meta in kuro_account_meta.items():
        email = kuro_db.get_member_email(m_id) if kuro_db else meta["email"]
        kuro_state[m_id] = {
            "id": m_id,
            "name": meta["name"],
            "user": meta["user"],
            "email": email or meta["email"],
            "account_id": f"account_{m_id}",
            "account_name": meta["account_name"],
            "account_tier": meta["account_tier"],
            "account_provider": "Google DeepMind / Google One AI Premium",
            "quota_tier": "2TB Google One AI Pro",
            "title": meta["title"],
            "title_id": meta["title_id"],
            "role": meta["role"],
            "icon": meta["icon"],
            "color": meta["color"],
            "domains": meta["domains"],
            "busy": False,
            "load_percent": 0,
            "task": "Siap siaga (Idle)",
            "pid": None,
            "started_at": None,
            "tasks": 0,
            "errors": 0,
            "last_used": None,
            "status": "online",
            "token_status": "Valid & Pro",
            "is_lead": False,
            "recent_tasks": [],
            "live_task": None
        }

    # 2. Base Shiro State initialized from DB & Metadata
    shiro_state = {
        1: {
            "id": 1, "name": "Kokoro", "engine": "DeepSeek-V3", "user": "arusuka",
            "email": "DeepSeek API (Primary)", "account_name": "DeepSeek-V3 Official",
            "title": "Curhat, Moral Companion & Light Chat", "icon": "💬", "color": "rose",
            "busy": False, "load_percent": 0, "task": "Siap siaga (Idle)",
            "pid": None, "started_at": None, "tasks": 0, "last_used": None, "status": "online",
            "recent_tasks": [], "live_task": None
        },
        2: {
            "id": 2, "name": "Hayate", "engine": "Qwen 3.8B", "user": "arusuka",
            "email": "Local Engine (0-Token)", "account_name": "Qwen 3.8B & Crawl4AI",
            "title": "Fast Web & Text Extraction Worker", "icon": "⚡", "color": "sky",
            "busy": False, "load_percent": 0, "task": "Siap siaga (Idle)",
            "pid": None, "started_at": None, "tasks": 0, "last_used": None, "status": "online",
            "recent_tasks": [], "live_task": None
        },
        3: {
            "id": 3, "name": "Musubi", "engine": "Hermes Local", "user": "arusuka",
            "email": "Local Daemon (0-Token)", "account_name": "Hermes 0-Token Autonomous",
            "title": "Personal Finance, Health & BMKG Radar", "icon": "🕊️", "color": "emerald",
            "busy": False, "load_percent": 0, "task": "Siap siaga (Idle)",
            "pid": None, "started_at": None, "tasks": 0, "last_used": None, "status": "online",
            "recent_tasks": [], "live_task": None
        }
    }

    kuro_metrics = {}
    kuro_recent_tasks = []
    kuro_recent_sprints = []
    kuro_events = []
    active_lead = 1

    if kuro_db:
        try:
            active_lead = int(kuro_db.get_config("active_account", "1"))
            members = kuro_db.get_all_members()
            for m in members:
                m_id = m["id"]
                if m_id in kuro_state:
                    kuro_state[m_id]["tasks"] = m["total_tasks"]
                    kuro_state[m_id]["errors"] = m.get("errors_count", 0)
                    kuro_state[m_id]["last_used"] = m.get("last_used")
                    if m.get("email"):
                        kuro_state[m_id]["email"] = m["email"]
                    if m.get("quarantined_until"):
                        kuro_state[m_id]["status"] = "quarantined"
                        kuro_state[m_id]["token_status"] = "Quarantined"

            for m_id in [1, 2, 3, 4]:
                kuro_state[m_id]["is_lead"] = (m_id == active_lead)
                live = kuro_db.get_member_live_task(m_id)
                recent = kuro_db.get_member_recent_history(m_id, limit=6)
                last_act = kuro_db.get_member_last_action(m_id) if hasattr(kuro_db, "get_member_last_action") else (recent[0] if recent else None)
                kuro_state[m_id]["recent_tasks"] = recent
                kuro_state[m_id]["live_task"] = live
                kuro_state[m_id]["last_action"] = last_act
                if live and live.get("is_running"):
                    kuro_state[m_id]["busy"] = True
                    kuro_state[m_id]["load_percent"] = 70
                    kuro_state[m_id]["task"] = live.get("prompt_summary") or "Active Execution"
                    kuro_state[m_id]["status"] = "busy"
                elif live and live.get("prompt_summary") and live.get("prompt_summary") != "Siap menerima tugas (Idle & Healthy)":
                    kuro_state[m_id]["task"] = live.get("prompt_summary")
                    kuro_state[m_id]["busy"] = False
                    kuro_state[m_id]["load_percent"] = 0
                elif last_act and last_act.get("prompt_summary"):
                    kuro_state[m_id]["task"] = f"Terakhir: {last_act.get('prompt_summary')}"
                    kuro_state[m_id]["busy"] = False
                    kuro_state[m_id]["load_percent"] = 0

            kuro_metrics = kuro_db.get_squad_metrics()
            kuro_recent_tasks = kuro_db.get_recent_tasks(limit=30)
            if hasattr(kuro_db, "get_recent_sprints"):
                kuro_recent_sprints = kuro_db.get_recent_sprints(limit=10)
            if hasattr(kuro_db, "get_recent_agent_events"):
                kuro_events = kuro_db.get_recent_agent_events(limit=15)
        except Exception:
            pass

    shiro_metrics = {}
    shiro_recent_tasks = []
    if shiro_db:
        try:
            s_members = shiro_db.get_all_members()
            for sm in s_members:
                s_id = sm["id"]
                if s_id in shiro_state:
                    shiro_state[s_id]["tasks"] = sm.get("total_tasks", 0)
                    shiro_state[s_id]["last_used"] = sm.get("last_used")

            for s_id in [1, 2, 3]:
                s_live = shiro_db.get_member_live_task(s_id)
                s_recent = shiro_db.get_member_recent_history(s_id, limit=6) if hasattr(shiro_db, "get_member_recent_history") else []
                shiro_state[s_id]["recent_tasks"] = s_recent
                shiro_state[s_id]["live_task"] = s_live
                if s_live and s_live.get("is_running"):
                    shiro_state[s_id]["busy"] = True
                    shiro_state[s_id]["load_percent"] = 65
                    shiro_state[s_id]["task"] = s_live.get("prompt_summary") or "Active Local Execution"
                    shiro_state[s_id]["status"] = "busy"
                elif s_live and s_live.get("prompt_summary"):
                    shiro_state[s_id]["task"] = s_live.get("prompt_summary")
                    shiro_state[s_id]["busy"] = False
                    shiro_state[s_id]["load_percent"] = 0

            shiro_metrics = shiro_db.get_squad_metrics()
            shiro_recent_tasks = shiro_db.get_recent_tasks(limit=30)
        except Exception:
            pass

    # 3. Live Linux OS Process Detection (Strict Genuine Process Filtering)
    try:
        active_kuro_pids = {}
        ignored_names = {'bash', 'sh', 'zsh', 'dash', 'grep', 'ps', 'head', 'tail', 'cat', 'sleep', 'find', 'systemd', 'node', 'npm', 'vite', 'uvicorn', 'python3'}
        for p in psutil.process_iter(['pid', 'name', 'username', 'cmdline', 'cpu_percent', 'create_time']):
            try:
                cmdline = p.info.get('cmdline') or []
                if not cmdline:
                    continue
                cmd_str = ' '.join(cmdline)
                if 'python3 -c' in cmd_str or 'process_iter' in cmd_str or 'grep' in cmd_str:
                    continue
                u = p.info.get('username') or ''
                pname = p.info.get('name') or ''
                p_first = cmdline[0] if len(cmdline) > 0 else ''

                # Filter: Ignore regular shells that merely reference antigravity paths in trap/env
                if pname in ignored_names and not ('agy' in p_first or 'antigravity' in p_first or 'agy_pool' in cmd_str or 'agy_wrapper' in cmd_str):
                    continue

                # A. Genuine Antigravity Kuro Swarm Nodes
                is_agy = False
                if any(x in pname or x in p_first for x in ['agy-real', 'antigravity-cli', 'agy_wrapper']):
                    is_agy = True
                elif (pname == 'agy' or p_first.endswith('/agy') or p_first == 'agy') and not pname.endswith('.sh'):
                    is_agy = True
                elif 'agy-pool' in cmd_str and ('worker' in cmd_str or 'run' in cmd_str):
                    is_agy = True

                if is_agy:
                    m_id = 1
                    if u == 'arusuka2' or 'arusuka2' in cmd_str or '/home/arusuka2' in cmd_str: m_id = 2
                    elif u == 'arusuka3' or 'arusuka3' in cmd_str or '/home/arusuka3' in cmd_str: m_id = 3
                    elif u == 'arusuka4' or 'arusuka4' in cmd_str or '/home/arusuka4' in cmd_str: m_id = 4
                    
                    prompt = 'Active Engineering Task'
                    for arg in cmdline:
                        if len(arg) > 15 and not arg.startswith('-') and not arg.startswith('/'):
                            prompt = clean_process_prompt(arg, member_id=m_id)
                            break
                    
                    cpu_p = p.info.get('cpu_percent') or 0.0
                    kuro_state[m_id]["busy"] = True
                    kuro_state[m_id]["load_percent"] = max(35, min(95, int(cpu_p) if cpu_p > 0 else 70))
                    kuro_state[m_id]["task"] = prompt
                    kuro_state[m_id]["pid"] = p.info['pid']
                    kuro_state[m_id]["started_at"] = p.info.get('create_time')
                    kuro_state[m_id]["status"] = "busy"
                    kuro_state[m_id]["live_task"] = {
                        "is_running": True,
                        "prompt_summary": prompt,
                        "started_at": datetime.fromtimestamp(p.info.get('create_time', time.time())).isoformat(),
                        "duration_seconds": max(0.0, time.time() - (p.info.get('create_time') or time.time()))
                    }
                    active_kuro_pids[m_id] = p.info['pid']

                # B. Shiro-3: Hermes Local Engines
                elif any(k in p_first or (k in p_first and p_first.endswith('.py')) or (k in cmd_str and 'python' in p_first) for k in ['bmkg_guardian.py', 'debt_engine.py', 'pkhex-cli', 'nutrition_engine.py', 'ssh_login_alert.py', 'daily_routine.py']):
                    shiro_state[3]["busy"] = True
                    shiro_state[3]["load_percent"] = 65
                    shiro_state[3]["task"] = "0-Token Local Autonomous Routine"
                    shiro_state[3]["pid"] = p.info['pid']
                    shiro_state[3]["started_at"] = p.info.get('create_time')
                    shiro_state[3]["status"] = "busy"

                # C. Shiro-2: Fast Text / Crawl4AI / Qwen
                elif any(k in p_first or (k in cmd_str and 'python' in p_first) for k in ['crawl-web.py', 'crawl4ai', 'url_clipper.py']):
                    shiro_state[2]["busy"] = True
                    shiro_state[2]["load_percent"] = 75
                    shiro_state[2]["task"] = "Fast Web & Text Extraction Worker"
                    shiro_state[2]["pid"] = p.info['pid']
                    shiro_state[2]["started_at"] = p.info.get('create_time')
                    shiro_state[2]["status"] = "busy"

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
    except Exception:
        pass

    # Check if active lead should be in 'monitoring' state
    other_members_busy = any(kuro_state[m]["busy"] for m in kuro_state if m != active_lead)
    if other_members_busy and not kuro_state[active_lead]["busy"] and kuro_state[active_lead]["status"] != "quarantined":
        kuro_state[active_lead]["status"] = "monitoring"
        kuro_state[active_lead]["is_monitoring"] = True
        kuro_state[active_lead]["load_percent"] = 15
        kuro_state[active_lead]["task"] = "Siaga memantau eksekusi tim (Tetsu, Sora, Kensei)"
        kuro_state[active_lead]["live_task"] = {
            "status": "MONITORING",
            "is_running": False,
            "is_monitoring": True,
            "prompt_summary": "Siaga memantau eksekusi tim (Tetsu, Sora, Kensei)",
            "started_at": None,
            "duration_seconds": 0.0,
            "execution_mode": "swarm"
        }

    total_kuro_tasks = sum(k["tasks"] for k in kuro_state.values())

    # Build account breakdown dictionary for WebSocket consumers
    accounts_summary = {}
    for m_id, k in kuro_state.items():
        accounts_summary[str(m_id)] = {
            "id": m_id,
            "name": k["name"],
            "account_id": f"account_{m_id}",
            "account_name": k["account_name"],
            "account_tier": k["account_tier"],
            "email": k["email"],
            "user": k["user"],
            "role": k["role"],
            "status": k["status"],
            "is_lead": k["is_lead"],
            "is_monitoring": k.get("is_monitoring", False),
            "total_tasks": k["tasks"],
            "load_percent": k["load_percent"],
            "busy": k["busy"]
        }

    return {
        "kuro": list(kuro_state.values()),
        "shiro": list(shiro_state.values()),
        "active_lead": active_lead,
        "active_lead_account": accounts_summary.get(str(active_lead)),
        "accounts": accounts_summary,
        "total_squad_tasks": total_kuro_tasks,
        "kuro_metrics": kuro_metrics,
        "recent_tasks": kuro_recent_tasks,
        "recent_sprints": kuro_recent_sprints,
        "events": kuro_events,
        "shiro_metrics": shiro_metrics,
        "shiro_recent_tasks": shiro_recent_tasks,
        "has_active_work": any(k["busy"] for k in kuro_state.values()) or any(s["busy"] for s in shiro_state.values()) or any(k.get("status") == "monitoring" for k in kuro_state.values())
    }

async def realtime_telemetry_loop():
    """Background worker broadcasting CPU, RAM, Disk, Network, and Live Swarm state every 1.5 seconds."""
    prev_net = psutil.net_io_counters()
    prev_time = time.time()
    loop_counter = 0

    while True:
        try:
            await asyncio.sleep(1.5)
            loop_counter += 1
            if not ws_manager.active_connections:
                continue

            if loop_counter % 10 == 0 and kuro_db:
                try:
                    await asyncio.to_thread(kuro_db.sync_tasks_from_transcripts)
                except Exception:
                    pass

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

            swarm_state = get_live_swarm_state()

            telemetry = {
                "type": "telemetry",
                "timestamp": datetime.now().isoformat(),
                "system": {
                    "cpu_percent": cpu_pct,
                    "cpu_cores": cpu_cores,
                    "ram_percent": mem.percent,
                    "ram_used_gb": round(mem.used / (1024**3), 2),
                    "ram_total_gb": round(mem.total / (1024**3), 2),
                    "disk_percent": round((disk.used / disk.total) * 100, 1),
                    "disk_free_gb": round(disk.free / (1024**3), 1),
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
                },
                "swarm": swarm_state
            }
            await ws_manager.broadcast(telemetry)
        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(2)
