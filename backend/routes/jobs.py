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


class JobUpdate(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    job_url: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[str] = None
    next_schedule: Optional[str] = None
    notes: Optional[str] = None


@router.put("/{job_id}")
@router.patch("/{job_id}")
def update_job(job_id: int, payload: JobUpdate, current_user: str = Depends(get_current_user)):
    """Full update of a job application's details."""
    if not JOB_DB.exists():
        init_job_db()

    with get_db_connection(JOB_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM job_applications WHERE id=?", (job_id,))
        job = cur.fetchone()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        updates = ["updated_at = CURRENT_TIMESTAMP"]
        params = []

        fields = ["company", "role", "location", "salary", "job_url", "status", "applied_date", "next_schedule", "notes"]
        for field in fields:
            val = getattr(payload, field, None)
            if val is not None:
                updates.append(f"{field} = ?")
                params.append(val)

        params.append(job_id)
        cur.execute(f"UPDATE job_applications SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    trigger_ws_event("jobs_updated", {"action": "updated", "id": job_id})
    return {"status": "success", "message": f"Job #{job_id} updated"}


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
    elif job_type == "freelance":
        results = job_engine.search_freelance_jobs(query=query, location=location, limit=limit, page=safe_page) if hasattr(job_engine, "search_freelance_jobs") else []
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


@router.get("/freelance")
def get_freelance_opportunities(
    query: str = "backend",
    location: str = "Indonesia",
    page: int = 1,
    limit: int = 12,
    current_user: str = Depends(get_current_user)
):
    """Dedicated endpoint for tech freelance projects and contract gigs."""
    if not job_engine:
        raise HTTPException(status_code=500, detail="Job hunting engine not available")
    safe_page = max(1, page)
    results = job_engine.search_freelance_jobs(query=query, location=location, limit=limit, page=safe_page) if hasattr(job_engine, "search_freelance_jobs") else []
    return {
        "status": "success",
        "query": query,
        "page": safe_page,
        "count": len(results),
        "jobs": results
    }


class JobAnalyzeUrlRequest(BaseModel):
    url: str


class CoverLetterRequest(BaseModel):
    company: str
    role: str
    job_description: Optional[str] = ""
    language: Optional[str] = "id"


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


@router.post("/analyze-url")
def analyze_job_from_url(
    payload: JobAnalyzeUrlRequest,
    current_user: str = Depends(get_current_user)
):
    """Scrape live URL and analyze CV match."""
    if not job_engine:
        raise HTTPException(status_code=500, detail="Job hunting engine not available")

    try:
        result = job_engine.analyze_job_url(payload.url)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mengekstrak atau menganalisis URL: {str(e)}")


@router.post("/generate-cover-letter")
def create_cover_letter(
    payload: CoverLetterRequest,
    current_user: str = Depends(get_current_user)
):
    """Generate tailored cover letter based on user's profile."""
    if not job_engine:
        raise HTTPException(status_code=500, detail="Job hunting engine not available")

    try:
        cl_text = job_engine.generate_cover_letter(
            company=payload.company,
            role=payload.role,
            job_description=payload.job_description or "",
            language=payload.language or "id"
        )
        return {
            "status": "success",
            "cover_letter": cl_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat cover letter: {str(e)}")


def init_curated_jobs_table(conn):
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS curated_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT DEFAULT 'Remote',
        salary TEXT DEFAULT '',
        job_url TEXT UNIQUE,
        match_score INTEGER DEFAULT 0,
        tech_stack_matched TEXT DEFAULT '',
        highlights TEXT DEFAULT '',
        source TEXT DEFAULT 'Scout',
        status TEXT DEFAULT 'NEW',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()


@router.get("/curated")
def get_curated_jobs(
    status: Optional[str] = "all",
    search: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Retrieve background-curated job opportunities discovered by Sentinel."""
    if not JOB_DB.exists():
        init_job_db()

    with get_db_connection(JOB_DB) as conn:
        init_curated_jobs_table(conn)
        cur = conn.cursor()
        query = "SELECT * FROM curated_jobs WHERE 1=1"
        params = []
        if status and status != "all":
            query += " AND status = ?"
            params.append(status.upper())
        if search:
            query += " AND (title LIKE ? OR company LIKE ? OR tech_stack_matched LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param])
        query += " ORDER BY match_score DESC, id DESC"
        cur.execute(query, params)
        jobs = [dict(r) for r in cur.fetchall()]

        # Compute summary stats
        cur.execute("SELECT COUNT(*) FROM curated_jobs WHERE status = 'NEW'")
        new_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM curated_jobs WHERE status = 'SAVED'")
        saved_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM curated_jobs")
        total_count = cur.fetchone()[0]

    return {
        "status": "success",
        "stats": {
            "total": total_count,
            "new": new_count,
            "saved": saved_count
        },
        "jobs": jobs
    }


@router.post("/curated/{job_id}/save")
def save_curated_to_pipeline(job_id: int, current_user: str = Depends(get_current_user)):
    """Save a curated job into the Kanban job applications pipeline."""
    if not JOB_DB.exists():
        init_job_db()

    with get_db_connection(JOB_DB) as conn:
        init_curated_jobs_table(conn)
        cur = conn.cursor()
        cur.execute("SELECT * FROM curated_jobs WHERE id=?", (job_id,))
        job = cur.fetchone()
        if not job:
            raise HTTPException(status_code=404, detail="Curated job not found")

        # Insert to job_applications
        cur.execute("""
            INSERT INTO job_applications (company, role, location, salary, job_url, status, applied_date, notes)
            VALUES (?, ?, ?, ?, ?, 'wishlist', NULL, ?)
        """, (
            job["company"],
            job["title"],
            job["location"],
            job["salary"],
            job["job_url"],
            f"Curated by Sentinel ({job['match_score']}% Match). Tech: {job['tech_stack_matched']}"
        ))
        new_app_id = cur.lastrowid

        # Update curated job status to SAVED
        cur.execute("UPDATE curated_jobs SET status = 'SAVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (job_id,))
        conn.commit()

    trigger_ws_event("jobs_updated", {"action": "saved_curated", "id": new_app_id})
    return {"status": "success", "message": f"Lowongan {job['title']} berhasil disimpan ke Wishlist Kanban.", "application_id": new_app_id}


@router.post("/curated/{job_id}/dismiss")
def dismiss_curated_job(job_id: int, current_user: str = Depends(get_current_user)):
    """Dismiss a curated job recommendation."""
    if not JOB_DB.exists():
        init_job_db()

    with get_db_connection(JOB_DB) as conn:
        init_curated_jobs_table(conn)
        cur = conn.cursor()
        cur.execute("UPDATE curated_jobs SET status = 'DISMISSED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", (job_id,))
        conn.commit()

    return {"status": "success", "message": f"Rekomendasi #{job_id} dilewati."}


@router.post("/curated/scan")
def trigger_curated_scan(current_user: str = Depends(get_current_user)):
    """Trigger background job hunting scan immediately."""
    if not job_engine:
        raise HTTPException(status_code=500, detail="Job hunting engine not available")

    # Run quick scan
    queries = ["golang", "laravel", "backend"]
    newly_added = 0
    with get_db_connection(JOB_DB) as conn:
        init_curated_jobs_table(conn)
        cur = conn.cursor()
        cur.execute("SELECT job_url FROM curated_jobs")
        existing_urls = {r[0] for r in cur.fetchall()}

        for q in queries:
            # 1. Indonesian multi-source local jobs (Kalibrr, Tech in Asia, Glints, JobStreet, LinkedIn ID)
            try:
                if hasattr(job_engine, "search_local_jobs"):
                    local_jobs = job_engine.search_local_jobs(query=q, location="Indonesia", limit=8)
                    for j in local_jobs:
                        u = j.get("url", "")
                        if u and u not in existing_urls:
                            try:
                                analysis = job_engine.analyze_job_match(role=j.get("title", ""), job_description=j.get("description_snippet", ""))
                                score = analysis.get("match_score", 0)
                                if score >= 65:
                                    matched_skills = ", ".join(analysis.get("matching_skills", []))
                                    cur.execute("""
                                        INSERT INTO curated_jobs (title, company, location, salary, job_url, match_score, tech_stack_matched, highlights, source, status)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
                                    """, (
                                        j.get("title", ""),
                                        j.get("company", "Perusahaan Indonesia"),
                                        j.get("location", "Indonesia"),
                                        j.get("salary", "Standar Industri (IDR)"),
                                        u,
                                        score,
                                        matched_skills,
                                        f"Kecocokan Tech Stack: {score}%",
                                        j.get("source", "Indonesia Scout")
                                    ))
                                    existing_urls.add(u)
                                    newly_added += 1
                            except Exception:
                                pass
            except Exception:
                pass

            # 2. Global remote jobs (Himalayas, WWR, RemoteOK)
            try:
                results = job_engine.search_remote_jobs(query=q, limit=4)
                for j in results:
                    u = j.get("url", "")
                    if u and u not in existing_urls:
                        try:
                            analysis = job_engine.analyze_job_match(role=j.get("title", ""), job_description=j.get("description_snippet", ""))
                            score = analysis.get("match_score", 0)
                            if score >= 70:
                                matched_skills = ", ".join(analysis.get("matching_skills", []))
                                cur.execute("""
                                    INSERT INTO curated_jobs (title, company, location, salary, job_url, match_score, tech_stack_matched, highlights, source, status)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'NEW')
                                """, (
                                    j.get("title", ""),
                                    j.get("company", "Tech Company"),
                                    j.get("location", "Remote"),
                                    j.get("salary", "Competitive"),
                                    u,
                                    score,
                                    matched_skills,
                                    f"Compatibility: {score}%",
                                    j.get("source", "Remote Scout")
                                ))
                                existing_urls.add(u)
                                newly_added += 1
                        except Exception:
                            pass
            except Exception:
                pass
        conn.commit()

    return {"status": "success", "message": f"Pemindaian selesai. Ditemukan {newly_added} lowongan baru lintas portal Indonesia & Remote.", "new_count": newly_added}


