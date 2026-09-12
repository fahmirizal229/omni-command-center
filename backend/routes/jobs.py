"""
Job Hunter Career Tracker API router (/api/jobs/*).
"""

from typing import Optional
from datetime import date
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from backend.config import JOB_DB
from backend.database import get_db_connection, init_job_db
from backend.security import get_current_user
from backend.websocket import trigger_ws_event

router = APIRouter(prefix="/api/jobs", tags=["Job Hunter"])


import sys
from pathlib import Path

JOB_HUNTER_DIR = Path("/home/arusuka/mcp-job-hunter")
if str(JOB_HUNTER_DIR) not in sys.path:
    sys.path.insert(0, str(JOB_HUNTER_DIR))

try:
    import job_engine
except ImportError:
    job_engine = None


class JobCreate(BaseModel):
    company: str
    role: str
    location: Optional[str] = "Jawa / Remote"
    salary: Optional[str] = ""
    job_url: Optional[str] = ""
    status: Optional[str] = "wishlist"
    applied_date: Optional[str] = None
    next_schedule: Optional[str] = None
    notes: Optional[str] = ""


class JobStatusUpdate(BaseModel):
    status: str
    next_schedule: Optional[str] = None
    notes: Optional[str] = None


class JobAnalyzeRequest(BaseModel):
    role: str
    job_description: str
    tech_stack: Optional[list] = None


@router.get("")
def get_jobs(
    search: Optional[str] = None,
    status: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Fetch job applications grouped by Kanban columns + stats."""
    if not JOB_DB.exists():
        init_job_db()

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


@router.post("")
def create_job(job: JobCreate, current_user: str = Depends(get_current_user)):
    """Add a new job application."""
    if not JOB_DB.exists():
        init_job_db()

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


@router.patch("/{job_id}/status")
def update_job_status(job_id: int, payload: JobStatusUpdate, current_user: str = Depends(get_current_user)):
    """Advance or update the status of a job application."""
    if not JOB_DB.exists():
        init_job_db()

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


@router.delete("/{job_id}")
def delete_job(job_id: int, current_user: str = Depends(get_current_user)):
    """Remove a job application."""
    if not JOB_DB.exists():
        init_job_db()

    with get_db_connection(JOB_DB) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM job_applications WHERE id=?", (job_id,))
        conn.commit()

    trigger_ws_event("jobs_updated", {"action": "deleted", "id": job_id})
    return {"status": "success", "message": f"Job #{job_id} deleted"}


@router.get("/live-search")
def live_search_jobs(
    query: str = "backend",
    job_type: str = "remote",
    location: str = "Jawa / Indonesia",
    page: int = 1,
    limit: int = 12,
    current_user: str = Depends(get_current_user)
):
    """Search live remote or local job openings with AI tech stack matching and pagination."""
    if not job_engine:
        raise HTTPException(status_code=500, detail="Job hunting engine not available")

    safe_page = max(1, page)
    if job_type == "local":
        results = job_engine.search_local_jobs(query=query, location=location, limit=limit, page=safe_page)
    else:
        results = job_engine.search_remote_jobs(query=query, limit=limit, page=safe_page)

    return {
        "query": query,
        "type": job_type,
        "page": safe_page,
        "limit": limit,
        "count": len(results),
        "has_more": len(results) >= limit,
        "jobs": results
    }


@router.post("/analyze-match")
def analyze_job_cv_match(
    payload: JobAnalyzeRequest,
    current_user: str = Depends(get_current_user)
):
    """Deep analysis of Job Description vs User's actual CV/Experience."""
    if not job_engine:
        raise HTTPException(status_code=500, detail="Job hunting engine not available")

    try:
        analysis = job_engine.analyze_job_match(
            role=payload.role,
            job_description=payload.job_description,
            tech_stack=payload.tech_stack
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis kecocokan: {str(e)}")

    return {
        "status": "success",
        "analysis": analysis
    }
