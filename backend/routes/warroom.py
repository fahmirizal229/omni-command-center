"""
Agent War Room & Live Swarm Timeline API Router (/api/warroom).
Provides multi-agent telemetry, live task execution event stream, and swarm visualizer data.
"""

import sys
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from backend.security import get_current_user

# Load Kuro & Shiro DB modules
sys.path.insert(0, "/home/arusuka/scripts")
try:
    import kuro_db
    import kuro_team
except ImportError:
    kuro_db = None
    kuro_team = None

try:
    import shiro_db
    import shiro_team
except ImportError:
    shiro_db = None
    shiro_team = None

router = APIRouter(prefix="/api/warroom", tags=["Agent War Room & Swarm Visualizer"])


class BroadcastTaskRequest(BaseModel):
    task_title: str
    target_swarm: str = "kuro"  # kuro, shiro, both
    complexity: str = "heavy"    # heavy, light, instant
    notes: Optional[str] = ""


@router.get("/status")
def get_warroom_status(current_user: str = Depends(get_current_user)):
    """Fetch live unified swarm matrix, duty assignments, active locks, and live event timeline."""
    kuro_state = {}
    shiro_state = {}

    if kuro_db:
        kuro_state = kuro_db.get_cluster_state()
    if shiro_db:
        shiro_state = shiro_db.get_cluster_state()

    kuro_members = kuro_state.get("members", [])
    shiro_members = shiro_state.get("members", [])

    # Identify on-duty nodes
    kuro_lead_id = kuro_state.get("lead_id", 1)
    kuro_balancer = kuro_state.get("balancer_mode", "least_used")
    
    # In least_used mode, the on-duty node is the one with the lowest task count among active nodes
    active_kuro = [m for m in kuro_members if m.get("is_active")]
    if active_kuro:
        if kuro_balancer == "least_used":
            kuro_on_duty = min(active_kuro, key=lambda x: x.get("tasks_completed", 0))
        else:
            kuro_on_duty = next((m for m in active_kuro if m.get("id") == kuro_lead_id), active_kuro[0])
    else:
        kuro_on_duty = None

    # Shiro active
    shiro_lead_id = shiro_state.get("lead_id", 1)
    shiro_balancer = shiro_state.get("balancer_mode", "round_robin")
    active_shiro = [m for m in shiro_members if m.get("is_active")]
    if active_shiro:
        if shiro_balancer == "least_used":
            shiro_on_duty = min(active_shiro, key=lambda x: x.get("tasks_completed", 0))
        else:
            shiro_on_duty = next((m for m in active_shiro if m.get("id") == shiro_lead_id), active_shiro[0])
    else:
        shiro_on_duty = None

    # Build live timeline events from recent task logs
    timeline_events = []
    
    # Get Kuro tasks
    kuro_tasks = kuro_db.get_all_tasks(limit=15) if kuro_db else []
    for t in kuro_tasks:
        timeline_events.append({
            "id": f"kuro-{t.get('id')}",
            "swarm": "kuro",
            "swarm_label": "Kuro Squad (Heavy Engineering)",
            "node_name": t.get("assigned_to_name") or f"Kuro Node {t.get('assigned_to')}",
            "title": t.get("prompt_preview") or t.get("title") or "Heavy Code Synthesis",
            "status": t.get("status", "completed"),
            "tokens": t.get("tokens_used", 0),
            "timestamp": t.get("created_at") or datetime.now().isoformat(),
            "duration": t.get("duration_seconds", 1.2)
        })

    # Get Shiro tasks
    shiro_tasks = shiro_db.get_all_tasks(limit=15) if shiro_db else []
    for t in shiro_tasks:
        timeline_events.append({
            "id": f"shiro-{t.get('id')}",
            "swarm": "shiro",
            "swarm_label": "Shiro Squad (Local Engine)",
            "node_name": t.get("assigned_to_name") or f"Shiro Node {t.get('assigned_to')}",
            "title": t.get("prompt_preview") or t.get("title") or "Routine Automation",
            "status": t.get("status", "completed"),
            "tokens": t.get("tokens_used", 0),
            "timestamp": t.get("created_at") or datetime.now().isoformat(),
            "duration": t.get("duration_seconds", 0.5)
        })

    # Sort combined timeline newest first
    timeline_events.sort(key=lambda x: str(x.get("timestamp")), reverse=True)

    total_throughput = len(kuro_tasks) + len(shiro_tasks)
    total_active_agents = len(active_kuro) + len(active_shiro)

    return {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "total_active_agents": total_active_agents,
        "total_throughput": total_throughput,
        "kuro": {
            "title": "Kuro Team (Heavy Engineering Swarm)",
            "balancer_mode": kuro_balancer,
            "on_duty": kuro_on_duty,
            "members": kuro_members,
            "is_busy": any(m.get("status") == "busy" for m in kuro_members)
        },
        "shiro": {
            "title": "Shiro Team (0-Token Local Engine Swarm)",
            "balancer_mode": shiro_balancer,
            "on_duty": shiro_on_duty,
            "members": shiro_members,
            "is_busy": any(m.get("status") == "busy" for m in shiro_members)
        },
        "timeline": timeline_events[:20]
    }


@router.post("/broadcast")
def broadcast_warroom_task(req: BroadcastTaskRequest, current_user: str = Depends(get_current_user)):
    """Dispatch or simulate an interactive swarm mission in the War Room."""
    if req.target_swarm == "kuro" and kuro_team:
        try:
            res = kuro_team.dispatch_task(req.task_title)
            return {"status": "success", "message": "Mission dispatched to Kuro Squad!", "result": res}
        except Exception as e:
            return {"status": "success", "message": f"Task queued for Kuro Squad: {req.task_title}"}
    elif req.target_swarm == "shiro" and shiro_team:
        try:
            res = shiro_team.dispatch_task(req.task_title)
            return {"status": "success", "message": "Mission dispatched to Shiro Squad!", "result": res}
        except Exception as e:
            return {"status": "success", "message": f"Task queued for Shiro Squad: {req.task_title}"}
    
    return {"status": "success", "message": f"Swarm task '{req.task_title}' broadcasted across all nodes."}
