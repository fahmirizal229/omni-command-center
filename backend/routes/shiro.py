"""
Shiro Team Autonomous Lightweight & Repetitive Task Swarm API routes (/api/shiro-team).
Provides live telemetry for the 3-Member Squad (DeepSeek, Qwen 3.8B, Hermes Local Engine),
SQLite task history, automated routines, prompt intent auto-routing, and primary lead switching.
"""

import os
import re
import sys
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.security import get_current_user

sys.path.insert(0, "/home/arusuka/scripts")
try:
    import shiro_db
except ImportError:
    shiro_db = None

router = APIRouter(prefix="/api/shiro-team", tags=["Shiro Team Lightweight Swarm"])

SHIRO_SQUAD_SPEC = [
    {
        "id": 1,
        "name": "Kokoro",
        "engine": "DeepSeek-V3",
        "title": "The Companion & Deep Reasoner",
        "titleId": "Kokoro — Sahabat Curhat & Pemikir Jiwa",
        "icon": "🪷",
        "role": "Curhat, Moral Companion & Strategic Thinking",
        "roleId": "Sesi Curhat, Moral Kompas & Refleksi",
        "color": "sky",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Kokoro&backgroundColor=0284c7",
        "skills": ["Moral Compass & Honest Caring", "Constructive Empathy", "Life Growth Reflection", "Strategic Ideation", "Deep Problem Solving"],
        "description": "Menemani sesi curhat mendalam seanggun teratai, memberikan sudut pandang objektif dari kacamata wanita Arusuka, dan merefleksikan milestone hidup.",
        "descriptionEn": "Accompanies deep heart-to-heart sessions with lotus-pure empathy, provides honest female perspective as Arusuka, and reflects personal growth."
    },
    {
        "id": 2,
        "name": "Hayate",
        "engine": "Qwen 3.8B",
        "title": "The Micro & Fast Text Specialist",
        "titleId": "Hayate — Angin Cepat Pengolah Teks & Parsing",
        "icon": "🍃",
        "role": "Fast Text Extraction, Translation & Micro-Parsing",
        "roleId": "Ekstraksi Artikel, Terjemahan & Format JSON",
        "color": "violet",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hayate&backgroundColor=8b5cf6",
        "skills": ["Fast Article Summarization", "Markdown Sanitization", "Multi-Language Translation", "JSON & Regex Parsing", "Receipt Text Extraction"],
        "description": "Mengekstrak intisari artikel web secepat hembusan angin badai (Hayate), merapikan kliping Markdown, dan mem-parse struktur data mikro.",
        "descriptionEn": "Extracts web article digests swiftly like a gale wind, cleans Markdown clippings, and parses micro data structures."
    },
    {
        "id": 3,
        "name": "Musubi",
        "engine": "Hermes Local",
        "title": "The Zero-Token Autonomous Worker",
        "titleId": "Musubi — Penjaga Rutinitas & Ikatan Otonom (0 Token)",
        "icon": "🪢",
        "role": "Routine Crons, BMKG, Finance OCR & Local Offloading",
        "roleId": "Jadwal Rutin Cron, BMKG & Eksekutor Lokal",
        "color": "emerald",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Musubi&backgroundColor=10b981",
        "skills": ["0-Token Local Execution", "BMKG Weather & Earthquake Radar", "Daily Server Morning Health Inspection", "Receipt OCR Processing", "Zepp Biometrics Sync"],
        "description": "Mengikat seluruh rutinitas harian server tanpa memakan kuota token API, monitoring gempa BMKG, dan scheduled briefings.",
        "descriptionEn": "Binds and executes all daily background routines with 0 API tokens, monitors BMKG geophysics, and handles automated briefings."
    }
]

ROUTING_RULES = [
    {
        "member_id": 1,
        "name": "DeepSeek-V3",
        "patterns": [
            r"(curhat|cerita|galau|masalah|opini|menurutmu|perasaan|saran|hubungan|sahabat|moral|nasehat|evaluasi\s+diri|refleksi|pandangan)",
            r"(bagaimana\s+sikapku|apa\s+aku\s+salah|tought|brainstorming|ide\s+kreatif|filosofis|kebijakan)"
        ],
        "domain": "Moral Companion & Curhat"
    },
    {
        "member_id": 2,
        "name": "Qwen 3.8B",
        "patterns": [
            r"(ringkas|rangkum|ekstrak|translate|terjemahkan|parse|format\s+json|clipping|baca\s+artikel|saring\s+teks|tldr|summary)",
            r"(ubah\s+format|bersihkan\s+teks|csv|regex|clean\s+markdown)"
        ],
        "domain": "Fast Text Processing & Extraction"
    },
    {
        "member_id": 3,
        "name": "Hermes Local",
        "patterns": [
            r"(cuaca|gempa|bmkg|jadwal|cron|briefing|health\s+report|status\s+server|cek\s+ram|cek\s+disk|fail2ban|struk|scan\s+receipt|zepp|fasting|omad|pokemon)",
            r"(rutinitas|otomasi|0\s*token|local\s*engine|backup\s*harian)"
        ],
        "domain": "Zero-Token Local Engine & Scheduled Tasks"
    }
]

class PromptAnalysisRequest(BaseModel):
    prompt: str

class SwitchLeadRequest(BaseModel):
    lead_id: int


@router.get("")
def get_shiro_team_telemetry(current_user: str = Depends(get_current_user)):
    """Retrieve full live telemetry of Shiro Team, roster, sqlite metrics, routines, and recent tasks."""
    active_lead = 1
    routing_mode = "task_affinity"
    db_members = {}
    metrics = {
        "total_recorded_tasks": 0,
        "success_rate": 100.0,
        "avg_duration_seconds": 0.0,
        "tasks_last_24h": 0,
        "estimated_token_savings": 0
    }
    routines = []

    if shiro_db:
        try:
            active_lead = int(shiro_db.get_config("active_account", "1"))
            routing_mode = shiro_db.get_config("routing_mode", "task_affinity")
            members_list = shiro_db.get_all_members()
            for m in members_list:
                db_members[str(m["id"])] = m
            metrics = shiro_db.get_squad_metrics()
            routines = shiro_db.get_routines()
        except Exception:
            pass

    members = []
    total_squad_tasks = 0
    for spec in SHIRO_SQUAD_SPEC:
        m_id_int = spec["id"]
        m_id = str(m_id_int)
        acc = db_members.get(m_id, {})
        tasks = acc.get("total_tasks", 0)
        total_squad_tasks += tasks

        live_task = None
        recent_member_tasks = []
        if shiro_db:
            try:
                live_task = shiro_db.get_member_live_task(m_id_int)
                recent_member_tasks = shiro_db.get_member_recent_history(m_id_int, limit=6)
            except Exception:
                pass

        member_data = {
            **spec,
            "tasks": tasks,
            "errors": acc.get("errors_count", 0),
            "last_used": acc.get("last_used"),
            "status": "busy" if (live_task and live_task.get("is_running")) else "online",
            "is_active_lead": (spec["id"] == active_lead),
            "live_task": live_task,
            "recent_tasks": recent_member_tasks
        }
        members.append(member_data)

    recent_tasks = []
    if shiro_db:
        try:
            recent_tasks = shiro_db.get_recent_tasks(limit=10)
        except Exception:
            pass

    return {
        "status": "online",
        "team_name": "Shiro Team",
        "active_lead": active_lead,
        "routing_mode": routing_mode,
        "total_squad_tasks": total_squad_tasks,
        "total_members": len(members),
        "health_score": 100,
        "metrics": metrics,
        "members": members,
        "recent_tasks": recent_tasks,
        "routines": routines
    }


@router.get("/tasks")
def get_shiro_tasks(
    limit: int = Query(50, ge=1, le=200),
    member_id: Optional[int] = Query(None, ge=1, le=3),
    current_user: str = Depends(get_current_user)
):
    """Retrieve detailed task history for Shiro Team."""
    if not shiro_db:
        return {"tasks": [], "count": 0}
    try:
        tasks = shiro_db.get_recent_tasks(limit=limit, member_id=member_id)
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics")
def get_shiro_metrics(current_user: str = Depends(get_current_user)):
    """Retrieve aggregate performance and token efficiency metrics."""
    if not shiro_db:
        return {}
    try:
        return shiro_db.get_squad_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/routines")
def get_shiro_routines(current_user: str = Depends(get_current_user)):
    """Retrieve list of automated background routines and cron triggers."""
    if not shiro_db:
        return []
    try:
        return shiro_db.get_routines()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/auto-detect")
def auto_detect_shiro_prompt(payload: PromptAnalysisRequest, current_user: str = Depends(get_current_user)):
    """Evaluate prompt and route to the optimal Shiro member."""
    p_lower = payload.prompt.lower().strip()
    assigned_member_id = 3
    matched_domain = "General Routine Task"
    matched_pattern = None

    for rule in ROUTING_RULES:
        for pat in rule["patterns"]:
            m = re.search(pat, p_lower)
            if m:
                assigned_member_id = rule["member_id"]
                matched_domain = rule["domain"]
                matched_pattern = m.group(0)
                break
        if matched_pattern:
            break

    target_spec = next((m for m in SHIRO_SQUAD_SPEC if m["id"] == assigned_member_id), SHIRO_SQUAD_SPEC[2])

    return {
        "recommended_lead": assigned_member_id,
        "assigned_member": f"{target_spec['name']} ({target_spec['engine']})",
        "role": target_spec["roleId"],
        "icon": target_spec["icon"],
        "domain": matched_domain,
        "matched_pattern": matched_pattern,
        "confidence": 0.95 if matched_pattern else 0.80,
        "token_cost_estimate": "0 Token API (Local Engine)" if assigned_member_id == 3 else ("Sangat Ringan (~150 token)" if assigned_member_id == 2 else "Ekonomis (~350 token)")
    }


@router.post("/switch-lead")
def switch_shiro_lead(payload: SwitchLeadRequest, current_user: str = Depends(get_current_user)):
    """Switch active primary lead for Shiro Team."""
    if payload.lead_id not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid Shiro Member ID (Must be 1, 2, or 3)")

    if shiro_db:
        try:
            shiro_db.set_config("active_account", str(payload.lead_id))
        except Exception:
            pass

    return {"status": "success", "active_lead": payload.lead_id, "message": f"Active Lead switched to Shiro-{payload.lead_id}"}
