"""
System Overview & Telemetry API endpoints (/api/overview & /api/system).
"""

import os
import json
import time
import shutil
import subprocess
from datetime import datetime, timedelta
import psutil
from fastapi import APIRouter, Depends

from backend.config import (
    HOME_DIR,
    TASK_DB,
    JOB_DB,
    GRAPH_DB,
    BRAIN_DIR,
    POKEMON_QUEUE,
    is_finance_related,
    fetch_weather_and_aqi,
    zepp_client_instance,
)
from backend.database import get_db_connection
from backend.security import get_current_user

router = APIRouter(prefix="/api", tags=["Overview & System"])

def format_uptime(seconds: float) -> str:
    """Format seconds into human readable duration string."""
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

@router.get("/overview")
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

    # 7. Quick Zepp Fitness Snippet
    zepp_snippet = {
        "today": {
            "steps": 0,
            "goal": 8000,
            "distance_km": 0,
            "calorie": 0,
            "calories_kcal": 0,
        },
        "last_sleep": {
            "sleep_hours": "--",
            "sleep_mins": 0,
        }
    }
    if zepp_client_instance:
        try:
            today_str = now.strftime("%Y-%m-%d")
            week_ago_str = (now - timedelta(days=6)).strftime("%Y-%m-%d")
            records = zepp_client_instance.get_band_data_summary(week_ago_str, today_str)
            for rec in records:
                summary = rec.get("summary", {})
                stp = summary.get("stp", {})
                slp = summary.get("slp", {})
                ttl_steps = stp.get("ttl", 0) or 0
                goal = summary.get("goal", 8000) or 8000
                dis_m = stp.get("dis", 0) or 0
                cal = stp.get("cal", 0) or 0
                
                dp = slp.get("dp", 0) or 0
                lt = slp.get("lt", 0) or 0
                ss = slp.get("ss", 0) or 0
                total_sleep = dp + lt + ss

                if total_sleep > 0:
                    zepp_snippet["last_sleep"] = {
                        "sleep_hours": f"{total_sleep // 60}j {total_sleep % 60}m",
                        "sleep_mins": total_sleep,
                    }

                if rec.get("date") == today_str:
                    zepp_snippet["today"] = {
                        "steps": ttl_steps,
                        "goal": goal,
                        "distance_km": round(dis_m / 1000.0, 2),
                        "calorie": cal,
                        "calories": cal,
                        "calories_kcal": cal,
                    }
        except Exception as e:
            print(f"Error fetching zepp overview: {e}")

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
        "zepp": zepp_snippet,
        "pokemon_queue": pokemon_queue_count
    }

@router.get("/system")
def get_system_metrics(current_user: str = Depends(get_current_user)):
    """Detailed System health & Fail2ban security statistics."""
    mem = psutil.virtual_memory()
    swap = psutil.swap_memory()
    disk_root = shutil.disk_usage("/")
    disk_home = shutil.disk_usage(str(HOME_DIR))
    boot_time = psutil.boot_time()
    uptime_sec = time.time() - boot_time
    load_1, load_5, load_15 = os.getloadavg()

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


@router.get("/public/status")
def get_public_system_status():
    """
    Lightweight public health & system status endpoint.
    Zero sensitive data exposure. Safe for landing page or public uptime monitoring.
    """
    boot_time = psutil.boot_time()
    uptime_sec = time.time() - boot_time
    mem = psutil.virtual_memory()

    return {
        "status": "operational",
        "service": "Arusuka Core Infrastructure",
        "timestamp": datetime.now().isoformat(),
        "uptime": format_uptime(uptime_sec),
        "uptime_seconds": int(uptime_sec),
        "nodes": {
            "web_gateway": "online",
            "api_server": "online",
            "database_engine": "online",
            "realtime_telemetry": "online"
        },
        "metrics": {
            "cpu_percent": psutil.cpu_percent(interval=0.05),
            "memory_percent": mem.percent
        }
    }
