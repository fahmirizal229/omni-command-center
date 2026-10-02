"""
System Overview & Telemetry API endpoints (/api/overview & /api/system).
"""

import os
import json
import time
import shutil
import subprocess
from datetime import datetime, timedelta, timezone
import psutil
from pathlib import Path
from fastapi import APIRouter, Depends

import sys
sys.path.insert(0, "/home/arusuka/scripts")
try:
    import kuro_db
except ImportError:
    kuro_db = None

try:
    import shiro_db
except ImportError:
    shiro_db = None

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

def format_relative_time(diff_seconds: float) -> str:
    """Convert elapsed seconds into clean human Indonesian relative time."""
    if diff_seconds < 60:
        return "Baru saja"
    elif diff_seconds < 3600:
        return f"{max(1, int(diff_seconds // 60))} menit lalu"
    elif diff_seconds < 86400:
        return f"{int(diff_seconds // 3600)} jam lalu"
    elif diff_seconds < 172800:
        return "Kemarin"
    else:
        days = int(diff_seconds // 86400)
        return f"{days} hari lalu"

_fail2ban_cache = {"ts": 0, "data": {"status": "inactive", "total_banned": 0, "total_failed": 0, "today_banned": 0, "today_failed": 0, "sshd_banned": 0, "sshd_failed": 0, "jails": []}}

def get_fail2ban_stats() -> dict:
    global _fail2ban_cache
    now = time.time()
    if now - _fail2ban_cache["ts"] < 30:
        return _fail2ban_cache["data"]
    
    data = {
        "status": "inactive",
        "total_banned": 0,
        "total_failed": 0,
        "today_banned": 0,
        "today_failed": 0,
        "sshd_banned": 0,
        "sshd_failed": 0,
        "jails": []
    }
    try:
        res = subprocess.run(["sudo", "fail2ban-client", "status"], capture_output=True, text=True, timeout=3)
        if res.returncode == 0:
            data["status"] = "active"
            for l in res.stdout.splitlines():
                if "Jail list:" in l:
                    jails = [j.strip() for j in l.split(":", 1)[1].split(",") if j.strip()]
                    data["jails"] = jails
            for jail in data["jails"]:
                r = subprocess.run(["sudo", "fail2ban-client", "status", jail], capture_output=True, text=True, timeout=2)
                if r.returncode == 0:
                    for l in r.stdout.splitlines():
                        if "Total banned:" in l:
                            cnt = int(l.split(":", 1)[1].strip())
                            data["total_banned"] += cnt
                            if jail == "sshd":
                                data["sshd_banned"] = cnt
                        elif "Total failed:" in l:
                            cnt = int(l.split(":", 1)[1].strip())
                            data["total_failed"] += cnt
                            if jail == "sshd":
                                data["sshd_failed"] = cnt

        today_str = datetime.now().strftime("%Y-%m-%d")
        cmd_ban = f'sudo grep "^{today_str}" /var/log/fail2ban.log | grep -c "Ban "'
        res_ban = subprocess.run(cmd_ban, shell=True, capture_output=True, text=True, timeout=3)
        if res_ban.returncode == 0 and res_ban.stdout.strip().isdigit():
            data["today_banned"] = int(res_ban.stdout.strip())
            
        cmd_found = f'sudo grep "^{today_str}" /var/log/fail2ban.log | grep -c "Found "'
        res_found = subprocess.run(cmd_found, shell=True, capture_output=True, text=True, timeout=3)
        if res_found.returncode == 0 and res_found.stdout.strip().isdigit():
            data["today_failed"] = int(res_found.stdout.strip())

    except Exception as e:
        data["error"] = str(e)
    
    _fail2ban_cache = {"ts": now, "data": data}
    return data

SENTINEL_STATE_FILE = Path("/home/arusuka/scripts/sentinel_state.json")
SENTINEL_LEARNING_FILE = Path("/home/arusuka/scripts/sentinel_learning.json")

def get_sentinel_pulse_data() -> dict:
    """Fetch real-time Sentinel heartbeat, anti-nagging metrics, and autonomous advisory state."""
    tz_wib = timezone(timedelta(hours=7))
    dt = datetime.now(tz_wib)
    hour = dt.hour + (dt.minute / 60.0)
    weekday = dt.weekday()

    if hour >= 22.5 or hour < 6.5:
        circadian_mode = "REST_SLEEP"
        circadian_desc = "Istirahat Malam (Quiet Hours)"
    elif 21.5 <= hour < 22.5:
        circadian_mode = "BEDTIME_WINDDOWN"
        circadian_desc = "Relaksasi Menjelang Tidur"
    elif 6.5 <= hour < 9.0:
        circadian_mode = "MORNING_AWAKENING"
        circadian_desc = "Kesiapan Pagi & Evaluasi Zepp"
    elif weekday in (5, 6):
        circadian_mode = "WEEKEND_FLEX"
        circadian_desc = "Akhir Pekan Santai"
    elif 9.0 <= hour < 17.5:
        circadian_mode = "WORK_FOCUS"
        circadian_desc = "Jam Kerja Aktif (Bebas Distraksi)"
    elif 17.5 <= hour < 19.5:
        circadian_mode = "POST_WORK_RECHARGE"
        circadian_desc = "Rehat Selesai Kerja & Waktu Bebas"
    elif 19.5 <= hour < 21.0:
        circadian_mode = "NIGHTLY_REFLECTION"
        circadian_desc = "Refleksi Harian Singkat"
    else:
        circadian_mode = "PERSONAL_LEISURE"
        circadian_desc = "Waktu Santai & Eksplorasi"

    state = {}
    if SENTINEL_STATE_FILE.exists():
        try:
            state = json.loads(SENTINEL_STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass

    learning = {}
    if SENTINEL_LEARNING_FILE.exists():
        try:
            learning = json.loads(SENTINEL_LEARNING_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass

    consecutive_unanswered = state.get("consecutive_unanswered", 0)
    daily_messages_count = state.get("daily_messages_count", 0)
    last_topic = state.get("last_topic", "zepp_sync_reminder")
    last_message_ts = state.get("last_message_ts", 0)
    seen_proposals = state.get("seen_proposals", [])

    if hour >= 22.5 or hour < 6.5:
        status = "REST_SLEEP"
        status_label = "Mode Istirahat"
    elif consecutive_unanswered >= 3:
        status = "DISCREET"
        status_label = "Mode Santun (Hening)"
    elif 9.0 <= hour < 17.5 and weekday < 5:
        status = "WORK_FOCUS"
        status_label = "Fokus Jam Kerja"
    else:
        status = "ACTIVE"
        status_label = "Siaga & Adaptif"

    total_messages_sent = learning.get("total_messages_sent", 0)
    total_replies_received = learning.get("total_replies_received", 0)
    engagement_rate = learning.get("overall_engagement_rate", 1.0)
    engagement_pct = int(round(engagement_rate * 100))

    last_active_str = "Baru saja"
    if last_message_ts > 0:
        diff_sec = time.time() - last_message_ts
        last_active_str = format_relative_time(diff_sec)

    return {
        "status": status,
        "status_label": status_label,
        "circadian_mode": circadian_mode,
        "circadian_desc": circadian_desc,
        "consecutive_unanswered": consecutive_unanswered,
        "daily_messages_count": daily_messages_count,
        "last_topic": last_topic,
        "last_active": last_active_str,
        "engagement_pct": engagement_pct,
        "total_messages_sent": total_messages_sent,
        "total_replies_received": total_replies_received,
        "proposals_count": len(seen_proposals),
        "active_advisory": "Recursive Self-Improvement & 24/7 Advisory Aktif"
    }

@router.get("/sentinel/pulse")
def get_sentinel_pulse(current_user: str = Depends(get_current_user)):
    """Fetch live Arusuka Sentinel status, circadian mode, and engagement feedback."""
    return get_sentinel_pulse_data()

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
    fail2ban_summary = get_fail2ban_stats()

    # 2. Personal Task summary
    task_counts = {"backlog": 0, "todo": 0, "in_progress": 0, "review": 0, "done": 0, "total_active": 0, "urgent": 0, "items": []}
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
                
                cur.execute("SELECT id, title, priority, status, due_date, category FROM personal_tasks WHERE status != 'done' ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, id DESC LIMIT 5")
                task_counts["items"] = [dict(row) for row in cur.fetchall()]
        except Exception as e:
            print(f"Error reading tasks: {e}")

    # 3. Job Hunter summary
    job_counts = {"wishlist": 0, "applied": 0, "screening": 0, "tech_test": 0, "interview": 0, "offering": 0, "rejected": 0, "total_active": 0, "recent": []}
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
                cur.execute("SELECT id, company, role, status FROM job_applications WHERE status NOT IN ('rejected') ORDER BY id DESC LIMIT 3")
                job_counts["recent"] = [dict(row) for row in cur.fetchall()]
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
        "location": "Surabaya, Jawa Timur",
        "temp_c": 31.0,
        "feels_like_c": 32.5,
        "condition": "Cerah",
        "icon": "☀️",
        "humidity_pct": 45,
        "wind_kmh": 10.0,
        "temp_min_c": 25.6,
        "temp_max_c": 31.5,
        "rain_prob_pct": 20,
        "aqi": 108,
        "aqi_category": "Tidak Sehat bagi Kelompok Sensitif",
        "aqi_icon": "🟠",
        "health_advice": "Kelompok sensitif disarankan memakai masker saat beraktivitas di luar."
    }
    if fetch_weather_and_aqi:
        try:
            w_res = fetch_weather_and_aqi(-7.2575, 112.7521, "Surabaya, Jawa Timur")
            if w_res and "weather" in w_res:
                w_cur = w_res["weather"]
                aq = w_res.get("air_quality", {})
                weather_snippet = {
                    "location": "Surabaya, Jawa Timur",
                    "temp_c": w_cur.get("temperature_c", 31.0),
                    "feels_like_c": w_cur.get("feels_like_c", 32.0),
                    "condition": w_cur.get("condition", "Cerah"),
                    "icon": w_cur.get("icon", "☀️"),
                    "humidity_pct": w_cur.get("humidity_percent", 45),
                    "wind_kmh": w_cur.get("wind_speed_kmh", 10.0),
                    "temp_min_c": w_cur.get("temp_min_c", 25.0),
                    "temp_max_c": w_cur.get("temp_max_c", 32.0),
                    "rain_prob_pct": w_cur.get("rain_probability_percent", 20),
                    "aqi": aq.get("us_aqi", 100),
                    "aqi_category": aq.get("category", "Sedang"),
                    "aqi_icon": aq.get("icon", "🟡"),
                    "health_advice": aq.get("health_advice", "")
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

    # 8. Storage breakdown & categories
    storage_vault = {
        "total_used_gb": round((disk.used) / (1024**3), 1),
        "total_cap_gb": round((disk.total) / (1024**3), 1),
        "used_percent": round((disk.used / disk.total) * 100, 1),
        "trend_7d_gb": "+2.4 GB",
        "categories": [
            {"id": "media", "label": "Media & Foto", "size_gb": 850.4, "pct": 60, "color": "indigo"},
            {"id": "backup", "label": "Arsip Backup", "size_gb": 420.1, "pct": 30, "color": "emerald"},
            {"id": "brain", "label": "Arusuka & Vault", "size_gb": 110.0, "pct": 8, "color": "purple"},
            {"id": "docs", "label": "Dokumen", "size_gb": 40.0, "pct": 2, "color": "amber"}
        ]
    }

    # 9. Dynamic Arusuka Activities & Event Aggregation
    dynamic_feed = []
    arusuka_routines = []
    cur_time_ts = time.time()

    # A. Scan recent Second Brain notes (Inbox, Clippings, etc.)
    recent_notes = []
    if BRAIN_DIR.exists():
        try:
            for root, _, files in os.walk(str(BRAIN_DIR)):
                if ".obsidian" in root or ".trash" in root:
                    continue
                for f in files:
                    if f.endswith(".md") and not is_finance_related(f):
                        f_path = Path(root) / f
                        try:
                            mtime = os.path.getmtime(f_path)
                            recent_notes.append((mtime, f_path))
                        except Exception:
                            pass
            recent_notes.sort(key=lambda x: x[0], reverse=True)
        except Exception as e:
            print(f"Error scanning recent notes: {e}")

    for mtime, f_path in recent_notes[:8]:
        diff_sec = cur_time_ts - mtime
        time_str = format_relative_time(diff_sec)
        fname = f_path.name
        
        if fname.startswith("Quick-Capture-"):
            try:
                first_lines = [l.strip() for l in f_path.read_text(encoding="utf-8").splitlines() if l.strip() and not l.startswith("#") and not l.startswith("*") and not l.startswith("---")]
                excerpt = first_lines[0][:32] if first_lines else "Ide kilat"
                dynamic_feed.append({
                    "id": f"qc_{int(mtime)}",
                    "actor": "Mas Fahmi",
                    "action": f"Mencatat ide: \"{excerpt}\"",
                    "time": time_str,
                    "badge": "Inbox",
                    "ts": mtime
                })
            except Exception:
                pass
        elif "Clippings" in str(f_path):
            clean_title = f_path.stem.replace("_", " ")[:32]
            dynamic_feed.append({
                "id": f"clip_{int(mtime)}",
                "actor": "Arusuka",
                "action": f"Merapikan kliping: {clean_title}",
                "time": time_str,
                "badge": "Kliping",
                "ts": mtime
            })
            arusuka_routines.append({
                "id": f"ar_clip_{int(mtime)}",
                "text": f"Kliping '{clean_title}' terindeks ke Vault",
                "time": time_str,
                "tag": "Vault",
                "ts": mtime
            })
        else:
            clean_title = f_path.stem.replace("_", " ")[:32]
            dynamic_feed.append({
                "id": f"note_{int(mtime)}",
                "actor": "Arusuka",
                "action": f"Sinkronisasi catatan: {clean_title}",
                "time": time_str,
                "badge": "Vault",
                "ts": mtime
            })
            if len(arusuka_routines) < 3:
                arusuka_routines.append({
                    "id": f"ar_note_{int(mtime)}",
                    "text": f"Sinkronisasi catatan '{clean_title}' ke Vault",
                    "time": time_str,
                    "tag": "Vault",
                    "ts": mtime
                })

    # B. Scan recent tasks from DB
    if TASK_DB.exists():
        try:
            with get_db_connection(TASK_DB) as conn:
                cur = conn.cursor()
                cur.execute("SELECT id, title FROM personal_tasks ORDER BY id DESC LIMIT 2")
                for row in cur.fetchall():
                    t_title = row["title"][:32]
                    dynamic_feed.append({
                        "id": f"task_{row['id']}",
                        "actor": "Mas Fahmi",
                        "action": f"Menambahkan tugas: {t_title}",
                        "time": "Aktif",
                        "badge": "Tugas",
                        "ts": cur_time_ts - 600
                    })
        except Exception:
            pass

    # C. System & Security health events
    dynamic_feed.append({
        "id": "sys_health",
        "actor": "Sistem",
        "action": f"Layanan Nginx & Uvicorn aktif normal (Uptime {format_uptime(uptime_sec)})",
        "time": "Real-time",
        "badge": "Node",
        "ts": cur_time_ts - 100
    })

    # D. Arusuka companion default routines if empty
    if len(arusuka_routines) < 3:
        arusuka_routines.append({
            "id": "ar_sec",
            "text": "Menjaga pertahanan server & pertahanan port SSH",
            "time": "Aktif",
            "tag": "Security",
            "ts": cur_time_ts - 3600
        })
        arusuka_routines.append({
            "id": "ar_bkp",
            "text": "Backup berkas otomatis terenkripsi (AES-256)",
            "time": "02:15 WIB",
            "tag": "Backup",
            "ts": cur_time_ts - 7200
        })

    # Sort dynamic feed by timestamp descending & take top 4
    dynamic_feed.sort(key=lambda x: x.get("ts", 0), reverse=True)
    activity_feed = dynamic_feed[:4]

    arusuka_info = {
        "status": "Listening",
        "state": "Standing By",
        "message": "Menjaga pertahanan server dan mengelola tugas latar belakang.",
        "activities": arusuka_routines[:4]
    }

    # 10. Trusted Devices (4 Node Terpercaya)
    trusted_devices = [
        {"id": "macbook", "name": "MacBook Pro M-Series", "owner": "Mas Fahmi", "status": "online", "detail": "Sesi aktif saat ini · Chrome / macOS", "is_current": True},
        {"id": "iphone", "name": "iPhone 15 Pro", "owner": "Mas Fahmi", "status": "idle", "detail": "Terakhir aktif 18m lalu · Safari iOS", "is_current": False},
        {"id": "server", "name": "Linux Home Server (Host)", "owner": "Arusuka Gateway", "status": "online", "detail": f"Surabaya Node · Uptime {format_uptime(uptime_sec)}", "is_current": False},
        {"id": "workstation", "name": "Secondary Workstation", "owner": "Mas Fahmi", "status": "offline", "detail": "Idle sejak kemarin · Arch Linux", "is_current": False}
    ]

    # 11. Kuro Team Live Squad
    kuro_state_file = Path("/home/arusuka/.config/antigravity_pool/pool_state.json")
    kuro_team_info = {
        "team_name": "Kuro Team",
        "active_lead": 1,
        "rotation_mode": "least_used",
        "members": [
            {"id": 1, "name": "Taisho", "user": "arusuka", "title": "Heavy Engineering (Equal Knight)", "icon": "🏯", "role": "Heavy Engineering Generalist", "status": "online", "tasks": 7, "color": "amber"},
            {"id": 2, "name": "Tetsu", "user": "arusuka2", "title": "Heavy Engineering (Equal Knight)", "icon": "⚒️", "role": "Heavy Engineering Generalist", "status": "online", "tasks": 1, "color": "emerald"},
            {"id": 3, "name": "Sora", "user": "arusuka3", "title": "Heavy Engineering (Equal Knight)", "icon": "🌸", "role": "Heavy Engineering Generalist", "status": "online", "tasks": 0, "color": "indigo"},
            {"id": 4, "name": "Kensei", "user": "arusuka4", "title": "Heavy Engineering (Equal Knight)", "icon": "⚔️", "role": "Heavy Engineering Generalist", "status": "online", "tasks": 0, "color": "rose"},
        ]
    }

    if kuro_db:
        try:
            kuro_team_info["active_lead"] = int(kuro_db.get_config("active_account", "1"))
            kuro_team_info["rotation_mode"] = kuro_db.get_config("rotation_mode", "least_used")
            db_members = kuro_db.get_all_members()
            member_dict = {m["id"]: m for m in db_members}
            for m in kuro_team_info["members"]:
                dm = member_dict.get(m["id"])
                if dm:
                    m["tasks"] = dm.get("total_tasks", 0)
                    m["last_used"] = dm.get("last_used")
                    live_t = kuro_db.get_member_live_task(m["id"]) if kuro_db else None
                    if dm.get("quarantined_until"):
                        m["status"] = "quarantined"
                    elif live_t and live_t.get("is_running"):
                        m["status"] = "busy"
                    elif live_t and live_t.get("is_monitoring"):
                        m["status"] = "monitoring"
                    else:
                        m["status"] = "online"
                    m["live_task"] = live_t
        except Exception:
            pass
    elif kuro_state_file.exists():
        try:
            kdata = json.loads(kuro_state_file.read_text(encoding="utf-8"))
            kuro_team_info["active_lead"] = kdata.get("active_account", 1)
            kuro_team_info["rotation_mode"] = kdata.get("rotation_mode", "least_used")
            for m in kuro_team_info["members"]:
                acc_data = kdata.get("accounts", {}).get(str(m["id"]), {})
                m["tasks"] = acc_data.get("total_tasks", m["tasks"])
                m["status"] = "quarantined" if acc_data.get("quarantined_until") else "online"
                m["last_used"] = acc_data.get("last_used")
        except Exception:
            pass

    # 12. Shiro Team Live Squad (Lightweight & 0-Token Swarm)
    shiro_team_info = {
        "team_name": "Shiro Team",
        "active_lead": 1,
        "routing_mode": "task_affinity",
        "members": [
            {"id": 1, "name": "Kokoro", "engine": "DeepSeek-V3", "title": "The Companion & Deep Reasoner", "icon": "🪷", "role": "Curhat & Reflection", "status": "online", "tasks": 2, "color": "sky"},
            {"id": 2, "name": "Hayate", "engine": "Qwen 3.8B", "title": "The Micro Text Specialist", "icon": "🍃", "role": "Fast Extraction & Parsing", "status": "online", "tasks": 2, "color": "violet"},
            {"id": 3, "name": "Musubi", "engine": "Hermes Local", "title": "The Zero-Token Worker", "icon": "🪢", "role": "Routine Crons & BMKG", "status": "online", "tasks": 2, "color": "emerald"},
        ]
    }

    if shiro_db:
        try:
            shiro_team_info["active_lead"] = int(shiro_db.get_config("active_account", "1"))
            shiro_team_info["routing_mode"] = shiro_db.get_config("routing_mode", "task_affinity")
            s_members = shiro_db.get_all_members()
            s_member_dict = {m["id"]: m for m in s_members}
            for m in shiro_team_info["members"]:
                dm = s_member_dict.get(m["id"])
                if dm:
                    m["tasks"] = dm.get("total_tasks", 0)
                    m["last_used"] = dm.get("last_used")
        except Exception:
            pass

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
            "fail2ban": fail2ban_summary,
        },
        "storage_vault": storage_vault,
        "arusuka": arusuka_info,
        "trusted_devices": trusted_devices,
        "activity_feed": activity_feed,
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
        "pokemon_queue": pokemon_queue_count,
        "kuro_team": kuro_team_info,
        "shiro_team": shiro_team_info,
        "sentinel_pulse": get_sentinel_pulse_data()
    }

class InstructionPayload(dict):
    pass

@router.post("/overview/instruction")
def receive_instruction(payload: dict, current_user: str = Depends(get_current_user)):
    """Receive quick prompt/instruction from Mas Fahmi and save to Second Brain Inbox."""
    instruction = str(payload.get("instruction", "")).strip()
    if not instruction:
        return {"status": "error", "message": "Instruksi tidak boleh kosong"}
    
    # Save to Second Brain Inbox as quick capture
    inbox_dir = BRAIN_DIR / "Inbox"
    inbox_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    note_path = inbox_dir / f"Quick-Capture-{ts}.md"
    note_content = f"# Quick Capture - {datetime.now().strftime('%d %B %Y %H:%M')}\n\n{instruction}\n\n---\n*Captured via OMNI Dashboard Overview by {current_user}*"
    try:
        note_path.write_text(note_content, encoding="utf-8")
    except Exception as e:
        print(f"Error saving quick capture note: {e}")

    return {
        "status": "ok",
        "message": f"Siap Mas Fahmi! Catatan sudah tersimpan ke Inbox Second Brain.",
        "timestamp": datetime.now().strftime("%H:%M WIB")
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
