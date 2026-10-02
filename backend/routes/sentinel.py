"""
Arusuka Sentinel Autonomous Advisory & Approval API Router.
Enables review, approval, rejection, and submission of self-improvement initiatives across:
Server, Dashboard, Portfolio, Arusuka, and Tooling.
"""

import os
import sys
import json
import time
from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

sys.path.insert(0, "/home/arusuka/scripts")
try:
    import smart_notifier
except ImportError:
    smart_notifier = None

from backend.config import HOME_DIR, BRAIN_DIR
from backend.security import get_current_user
from backend.routes.overview import get_sentinel_pulse_data

router = APIRouter(prefix="/api/sentinel", tags=["Arusuka Sentinel & Advisory"])

PROPOSALS_FILE = Path("/home/arusuka/scripts/sentinel_proposals.json")
STATE_FILE = Path("/home/arusuka/scripts/sentinel_state.json")

def load_proposals() -> List[Dict[str, Any]]:
    if PROPOSALS_FILE.exists():
        try:
            return json.loads(PROPOSALS_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return []

def save_proposals(proposals: List[Dict[str, Any]]) -> None:
    try:
        PROPOSALS_FILE.write_text(json.dumps(proposals, indent=2, ensure_ascii=False), encoding="utf-8")
        try:
            os.chmod(PROPOSALS_FILE, 0o666)
        except Exception:
            pass
    except Exception as e:
        print(f"[!] Error saving sentinel proposals: {e}", file=sys.stderr)

class ActionPayload(BaseModel):
    action: str  # approve, reject, snooze, execute
    notes: Optional[str] = None

class RequestPayload(BaseModel):
    title: str
    domain: str = "SERVER"
    description: str
    action_plan: Optional[str] = None

@router.get("/proposals")
def get_proposals(
    status: Optional[str] = "all",
    domain: Optional[str] = "all",
    current_user: str = Depends(get_current_user)
):
    """Retrieve all autonomous proposals with optional status/domain filter."""
    proposals = load_proposals()
    
    filtered = proposals
    if status and status != "all":
        filtered = [p for p in filtered if str(p.get("status", "")).upper() == status.upper()]
    if domain and domain != "all":
        filtered = [p for p in filtered if str(p.get("domain", "")).upper() == domain.upper()]
        
    filtered.sort(key=lambda p: p.get("created_at", 0), reverse=True)
    return {
        "status": "ok",
        "total": len(filtered),
        "proposals": filtered
    }

try:
    import sentinel_executor
except ImportError:
    sentinel_executor = None

@router.post("/proposals/{proposal_id}/action")
def perform_proposal_action(
    proposal_id: str,
    payload: ActionPayload,
    current_user: str = Depends(get_current_user)
):
    """Langsung terapkan (execute), tolak (reject), atau tunda (snooze) inisiatif Sentinel dari Web UI."""
    proposals = load_proposals()
    target = None
    for p in proposals:
        if p.get("id") == proposal_id:
            target = p
            break
            
    if not target:
        raise HTTPException(status_code=404, detail=f"Proposal '{proposal_id}' tidak ditemukan.")

    action = payload.action.lower()
    now_ts = time.time()
    
    if action in ("approve", "execute"):
        # Langsung terapkan tanpa kirim notifikasi awal.
        # Notifikasi Telegram hanya dikirim oleh sentinel_executor saat SUCCESS atau FAILED.
        if sentinel_executor:
            res = sentinel_executor.execute_proposal_by_id(proposal_id, notes=payload.notes)
            return res
        else:
            target["status"] = "EXECUTED"
            target["updated_at"] = now_ts
            target["executed_at"] = now_ts
            if payload.notes:
                target["resolution_notes"] = payload.notes
            save_proposals(proposals)
            return {
                "status": "ok",
                "message": f"Proposal '{target.get('title')}' berhasil diterapkan.",
                "proposal": target
            }

    elif action == "reject":
        target["status"] = "REJECTED"
        target["updated_at"] = now_ts
        if payload.notes:
            target["resolution_notes"] = payload.notes
            
        # Mark as seen in sentinel_state.json so Sentinel will not propose it again
        if STATE_FILE.exists():
            try:
                state = json.loads(STATE_FILE.read_text(encoding="utf-8"))
                seen = state.setdefault("seen_proposals", [])
                if proposal_id not in seen:
                    seen.append(proposal_id)
                STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
            except Exception:
                pass
        save_proposals(proposals)
        return {
            "status": "ok",
            "message": f"Proposal '{target.get('title')}' ditolak.",
            "proposal": target
        }

    elif action == "snooze":
        target["status"] = "SNOOZED"
        target["updated_at"] = now_ts
        if payload.notes:
            target["resolution_notes"] = payload.notes
        save_proposals(proposals)
        return {
            "status": "ok",
            "message": f"Proposal '{target.get('title')}' ditunda.",
            "proposal": target
        }
    else:
        raise HTTPException(status_code=400, detail=f"Action '{action}' tidak valid.")

@router.post("/request")
def submit_user_initiative(
    payload: RequestPayload,
    current_user: str = Depends(get_current_user)
):
    """Mas Fahmi submits a custom improvement idea / challenge directly from the Web."""
    title = payload.title.strip()
    description = payload.description.strip()
    if not title or not description:
        raise HTTPException(status_code=400, detail="Judul dan deskripsi inisiatif tidak boleh kosong.")

    proposals = load_proposals()
    new_id = f"custom_req_{int(time.time())}"
    
    new_proposal = {
        "id": new_id,
        "domain": payload.domain.upper(),
        "title": title,
        "observation": description,
        "action_plan": payload.action_plan or "Dianalisis dan dijadwalkan oleh sistem Arusuka Sentinel.",
        "benefit": "Inisiatif strategis langsung dari Mas Fahmi via Dashboard OMNI.",
        "risk_level": "SAFE",
        "status": "PENDING",
        "source": "user_fahmi",
        "created_at": time.time(),
        "updated_at": time.time(),
        "executed_at": None,
        "resolution_notes": None
    }
    
    proposals.insert(0, new_proposal)
    save_proposals(proposals)

    # Save to Second Brain Inbox as well
    inbox_dir = BRAIN_DIR / "Inbox"
    inbox_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    note_path = inbox_dir / f"Sentinel-Initiative-{ts}.md"
    note_content = (
        f"# Inisiatif Sentinel: {title}\n\n"
        f"- **Domain**: {payload.domain.upper()}\n"
        f"- **Tanggal**: {datetime.now().strftime('%d %B %Y %H:%M WIB')}\n"
        f"- **Deskripsi**: {description}\n"
        f"- **Action Plan**: {new_proposal['action_plan']}\n\n"
        f"---\n*Diajukan oleh {current_user} via OMNI Dashboard Sentinel Center*"
    )
    try:
        note_path.write_text(note_content, encoding="utf-8")
    except Exception as e:
        print(f"[!] Error writing inbox note: {e}", file=sys.stderr)

    # Telegram notification
    if smart_notifier:
        try:
            smart_notifier.notify(
                text=(
                    f"💡 <b>Inisiatif Baru Mas Fahmi via Dashboard Web</b>\n\n"
                    f"<b>{title}</b> ({payload.domain.upper()})\n"
                    f"{description}\n\n"
                    f"<i>Tersimpan di antrean Sentinel & Second Brain Inbox.</i>"
                ),
                priority="NORMAL",
                tag="sentinel"
            )
        except Exception:
            pass

    return {
        "status": "ok",
        "message": f"Inisiatif '{title}' berhasil dicatat dan masuk ke antrean Sentinel.",
        "proposal": new_proposal
    }

@router.get("/telemetry")
def get_sentinel_telemetry(current_user: str = Depends(get_current_user)):
    """Full telemetry bundle including pulse, proposal statistics, and circadian radar."""
    pulse = get_sentinel_pulse_data()
    proposals = load_proposals()
    
    pending_count = sum(1 for p in proposals if str(p.get("status", "")).upper() == "PENDING")
    approved_count = sum(1 for p in proposals if str(p.get("status", "")).upper() == "APPROVED")
    executed_count = sum(1 for p in proposals if str(p.get("status", "")).upper() == "EXECUTED")
    rejected_count = sum(1 for p in proposals if str(p.get("status", "")).upper() == "REJECTED")

    # 24-Hour Circadian Schedule Definition
    circadian_timeline = [
        {"mode": "REST_SLEEP", "time": "22:30 - 06:30 WIB", "name": "Istirahat Tidur", "desc": "Mode Hening & Regenerasi Sel", "color": "indigo"},
        {"mode": "MORNING_AWAKENING", "time": "06:30 - 09:00 WIB", "name": "Bangun Pagi", "desc": "Evaluasi Tidur Zepp & Readiness", "color": "emerald"},
        {"mode": "WORK_FOCUS", "time": "09:00 - 17:30 WIB", "name": "Jam Kerja Fokus", "desc": "Prioritas Kerja Kantor, Bebas Distraksi", "color": "blue"},
        {"mode": "POST_WORK_RECHARGE", "time": "17:30 - 19:30 WIB", "name": "Rehat Selesai Kerja", "desc": "Transisi Lepas Penat Kerja & Waktu Bebas", "color": "amber"},
        {"mode": "NIGHTLY_REFLECTION", "time": "19:30 - 21:00 WIB", "name": "Refleksi Harian", "desc": "Check-in 1 Menit & Life Reflection", "color": "rose"},
        {"mode": "PERSONAL_LEISURE", "time": "21:00 - 22:30 WIB", "name": "Santai & Riset", "desc": "Eksplorasi Teknologi & Diskusi Ringan", "color": "purple"}
    ]

    return {
        "status": "ok",
        "pulse": pulse,
        "stats": {
            "total_proposals": len(proposals),
            "pending": pending_count,
            "approved": approved_count,
            "executed": executed_count,
            "rejected": rejected_count
        },
        "circadian_timeline": circadian_timeline
    }
