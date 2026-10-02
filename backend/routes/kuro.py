"""
Kuro Team Autonomous Multi-Agent Swarm API routes (/api/kuro-team).
Provides telemetry for the 4-Knight AI Engineering Squad, SQLite task history, sprint logs, auto-detection, and lead switching.
"""

import os
import re
import sys
import json
import glob
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.security import get_current_user

sys.path.insert(0, "/home/arusuka/scripts")
try:
    import kuro_db
except ImportError:
    kuro_db = None

router = APIRouter(prefix="/api/kuro-team", tags=["Kuro Team Multi-Agent Swarm"])

POOL_STATE_FILE = Path("/home/arusuka/.config/antigravity_pool/pool_state.json")
SPRINTS_DIR = Path("/home/arusuka/second-brain/Projects/kuro_sprints")
KNOWLEDGE_BASE_FILE = Path("/home/arusuka/second-brain/Rules/kuro_skills_knowledge_base.md")

KURO_SQUAD_SPEC = [
    {
        "id": 1,
        "name": "Taisho",
        "user": "arusuka",
        "title": "",
        "title_id": "",
        "icon": "🏯",
        "role": "",
        "role_id": "",
        "color": "amber",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Taisho&backgroundColor=f59e0b",
        "skills": ["Clean Architecture", "Fullstack Systems", "REST API & Backend", "Frontend UI/UX", "Security & QA"],
        "description": "Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.",
        "descriptionEn": "Computing node powered by Google One AI Pro with full capacity and equal load."
    },
    {
        "id": 2,
        "name": "Tetsu",
        "user": "arusuka2",
        "title": "",
        "title_id": "",
        "icon": "⚒️",
        "role": "",
        "role_id": "",
        "color": "emerald",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Tetsu&backgroundColor=10b981",
        "skills": ["Clean Architecture", "Fullstack Systems", "REST API & Backend", "Frontend UI/UX", "Security & QA"],
        "description": "Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.",
        "descriptionEn": "Computing node powered by Google One AI Pro with full capacity and equal load."
    },
    {
        "id": 3,
        "name": "Sora",
        "user": "arusuka3",
        "title": "",
        "title_id": "",
        "icon": "🌸",
        "role": "",
        "role_id": "",
        "color": "indigo",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Sora&backgroundColor=6366f1",
        "skills": ["Clean Architecture", "Fullstack Systems", "REST API & Backend", "Frontend UI/UX", "Security & QA"],
        "description": "Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.",
        "descriptionEn": "Computing node powered by Google One AI Pro with full capacity and equal load."
    },
    {
        "id": 4,
        "name": "Kensei",
        "user": "arusuka4",
        "title": "",
        "title_id": "",
        "icon": "⚔️",
        "role": "",
        "role_id": "",
        "color": "rose",
        "avatar": "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Kensei&backgroundColor=f43f5e",
        "skills": ["Clean Architecture", "Fullstack Systems", "REST API & Backend", "Frontend UI/UX", "Security & QA"],
        "description": "Node komputasi bertenaga Google One AI Pro dengan kapasitas penuh & beban setara.",
        "descriptionEn": "Computing node powered by Google One AI Pro with full capacity and equal load."
    }
]

SWARM_PATTERNS = [
    r"(bikin|buat|tambah|tambahin|buatkan|bikinin|create|add|build)\s+(menu|fitur|feature|halaman|page|view|service|modul|module|system|sistem|proyek|project|pipeline|dashboard|flow)",
    r"(fullstack|full-stack|frontend\s+(dan|sampai|hingga|and|to)\s+backend|backend\s+(dan|sampai|hingga|and|to)\s+frontend)",
    r"(redesign|rombak|refactor\s+(besar|total|seluruh)|arsitektur|architecture|microservice)",
    r"(evaluasi\s+loker|analisis\s+(kontrak|loker|gaji|bisnis|pasar)|riset\s+bisnis|market\s+research)",
    r"(kuro\s*team|swarm|multi[-\s]*agent|tim\s+kuro)",
]

class PromptAnalysisRequest(BaseModel):
    prompt: str

class SwitchLeadRequest(BaseModel):
    lead_id: int

@router.get("")
def get_kuro_team_telemetry(current_user: str = Depends(get_current_user)):
    """Retrieve full live telemetry of Kuro Team, squad roster, sqlite metrics, sprints, and knowledge base."""
    active_lead = 1
    rotation_mode = "least_used"
    db_members = {}
    metrics = {
        "total_recorded_tasks": 0,
        "success_rate": 100.0,
        "avg_duration_seconds": 0.0,
        "tasks_last_24h": 0
    }

    if kuro_db:
        try:
            active_lead = int(kuro_db.get_config("active_account", "1"))
            rotation_mode = kuro_db.get_config("rotation_mode", "least_used")
            members_list = kuro_db.get_all_members()
            for m in members_list:
                db_members[str(m["id"])] = m
            metrics = kuro_db.get_squad_metrics()
        except Exception:
            pass

    # Fallback to pool_state.json if db unavailable
    if not db_members and POOL_STATE_FILE.exists():
        try:
            state = json.loads(POOL_STATE_FILE.read_text(encoding="utf-8"))
            active_lead = state.get("active_account", 1)
            rotation_mode = state.get("rotation_mode", "least_used")
            db_members = state.get("accounts", {})
        except Exception:
            pass

    # Build squad members list with real metrics, live task, and history
    members = []
    total_squad_tasks = 0
    for spec in KURO_SQUAD_SPEC:
        m_id_int = spec["id"]
        m_id = str(m_id_int)
        acc = db_members.get(m_id, {})
        tasks = acc.get("total_tasks", 0)
        total_squad_tasks += tasks
        is_quarantined = bool(acc.get("quarantined_until"))

        # Fetch live task, recent task history, and last completed action
        live_task = None
        recent_member_tasks = []
        last_action = None
        if kuro_db:
            try:
                live_task = kuro_db.get_member_live_task(m_id_int)
                recent_member_tasks = kuro_db.get_member_recent_history(m_id_int, limit=6)
                last_action = kuro_db.get_member_last_action(m_id_int) if hasattr(kuro_db, "get_member_last_action") else (recent_member_tasks[0] if recent_member_tasks else None)
            except Exception:
                pass
        
        is_monitoring = bool(live_task and live_task.get("is_monitoring"))
        member_status = "quarantined" if is_quarantined else ("busy" if (live_task and live_task.get("is_running")) else ("monitoring" if is_monitoring else "online"))
        
        member_data = {
            **spec,
            "tasks": tasks,
            "errors": acc.get("errors_count", 0),
            "last_used": acc.get("last_used"),
            "status": member_status,
            "is_monitoring": is_monitoring,
            "is_active_lead": (spec["id"] == active_lead),
            "live_task": live_task,
            "last_action": last_action,
            "recent_tasks": recent_member_tasks
        }
        members.append(member_data)

    # Determine active on-duty executor slot (for least_used / manual rotation)
    on_duty_id = active_lead
    if rotation_mode == "least_used" and members:
        healthy_members = [m for m in members if m["status"] != "quarantined"]
        if healthy_members:
            healthy_members.sort(key=lambda m: (m["tasks"], m["errors"]))
            on_duty_id = healthy_members[0]["id"]

    for m in members:
        m["is_on_duty"] = (m["id"] == on_duty_id)

    # Read recent sprints from Second Brain
    sprints = []
    if SPRINTS_DIR.exists():
        try:
            files = sorted(SPRINTS_DIR.glob("*.md"), key=lambda f: f.stat().st_mtime, reverse=True)
            for f in files[:10]:
                content = f.read_text(encoding="utf-8")
                title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
                date_match = re.search(r"\*\*Tanggal\*\*:\s*(.+)$", content, re.MULTILINE)
                title = title_match.group(1) if title_match else f.stem
                date_str = date_match.group(1) if date_match else datetime.fromtimestamp(f.stat().st_mtime).strftime("%d %b %Y")
                
                sprints.append({
                    "filename": f.name,
                    "title": title.replace("⚔️ Kuro Team Sprint: ", "").replace("⚔️ ", ""),
                    "date": date_str,
                    "content_preview": content[:300]
                })
        except Exception:
            pass

    # Recent tasks from DB
    recent_tasks = []
    if kuro_db:
        try:
            recent_tasks = kuro_db.get_recent_tasks(limit=10)
        except Exception:
            pass

    return {
        "status": "online",
        "team_name": "Kuro Team",
        "active_lead": active_lead,
        "on_duty_id": on_duty_id,
        "rotation_mode": rotation_mode,
        "total_squad_tasks": total_squad_tasks,
        "total_members": len(members),
        "health_score": 100,
        "metrics": metrics,
        "members": members,
        "recent_tasks": recent_tasks,
        "recent_sprints": sprints,
        "knowledge_base_available": KNOWLEDGE_BASE_FILE.exists()
    }

@router.get("/tasks")
def get_kuro_tasks(
    limit: int = Query(50, ge=1, le=200),
    member_id: Optional[int] = Query(None, ge=1, le=4),
    current_user: str = Depends(get_current_user)
):
    """Retrieve detailed granular task history from SQLite."""
    if not kuro_db:
        return {"tasks": [], "count": 0}
    try:
        tasks = kuro_db.get_recent_tasks(limit=limit, member_id=member_id)
        return {"tasks": tasks, "count": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
def get_kuro_metrics(current_user: str = Depends(get_current_user)):
    """Retrieve aggregate performance and execution metrics."""
    if not kuro_db:
        return {}
    try:
        return kuro_db.get_squad_metrics()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auto-detect")
def auto_detect_prompt(payload: PromptAnalysisRequest, current_user: str = Depends(get_current_user)):
    """Evaluate prompt and determine optimal least-used node allocation."""
    least_used_id = 1
    least_used_name = "Taisho"
    least_used_tasks = 999999
    
    if kuro_db:
        try:
            members_list = kuro_db.get_all_members()
            for m in members_list:
                if not m.get("quarantined_until") and m.get("total_tasks", 0) < least_used_tasks:
                    least_used_tasks = m.get("total_tasks", 0)
                    least_used_id = m["id"]
                    least_used_name = m["name"]
        except Exception:
            pass

    action_text = kuro_db.synthesize_member_action(least_used_id, payload.prompt) if kuro_db else "Mengeksekusi instruksi tugas teknis"

    return {
        "mode": "least_used",
        "matched_pattern": "Least-Used Load Balancing",
        "recommended_node": least_used_name,
        "recommended_node_id": least_used_id,
        "confidence": 0.98,
        "action_summary": action_text,
        "squad_allocation": {
            "assigned_agent": f"Dialokasikan ke {least_used_name} (Utilisasi terendah: {least_used_tasks if least_used_tasks != 999999 else 0} tasks)"
        }
    }

@router.get("/events")
def get_kuro_events(
    limit: int = Query(30, ge=1, le=100),
    agent_id: Optional[int] = Query(None, ge=1, le=4),
    current_user: str = Depends(get_current_user)
):
    """Retrieve real-time event-driven audit trail and telemetry events."""
    if not kuro_db or not hasattr(kuro_db, "get_recent_agent_events"):
        return {"events": [], "count": 0}
    try:
        events = kuro_db.get_recent_agent_events(limit=limit, agent_id=agent_id)
        return {"events": events, "count": len(events)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/switch-lead")
def switch_kuro_lead(payload: SwitchLeadRequest, current_user: str = Depends(get_current_user)):
    """Switch active Kuro Team lead account."""
    if payload.lead_id not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Invalid Kuro Member ID (Must be 1-4)")
    
    if kuro_db:
        try:
            kuro_db.set_config("active_account", str(payload.lead_id))
        except Exception:
            pass

    if POOL_STATE_FILE.exists():
        try:
            state = json.loads(POOL_STATE_FILE.read_text(encoding="utf-8"))
            state["active_account"] = payload.lead_id
            if str(payload.lead_id) in state.get("accounts", {}):
                state["accounts"][str(payload.lead_id)]["last_used"] = datetime.now().isoformat()
            POOL_STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
        except Exception:
            pass
    
    names_map = {1: "Taisho", 2: "Tetsu", 3: "Sora", 4: "Kensei"}
    target_name = names_map.get(payload.lead_id, f"Kuro-{payload.lead_id}")
    return {"status": "success", "active_lead": payload.lead_id, "message": f"Active Lead switched to {target_name}"}

