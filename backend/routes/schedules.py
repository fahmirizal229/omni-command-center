"""
Automated Schedules, Daemons & Routines Inspector API router (/api/schedules).
"""

import json
from fastapi import APIRouter, Depends

from backend.config import HOME_DIR
from backend.security import get_current_user

router = APIRouter(prefix="/api/schedules", tags=["Schedules & Daemons"])


@router.get("")
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
