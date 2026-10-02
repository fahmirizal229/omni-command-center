"""
Tech Radar API Router for Arusuka Command Center.
Provides access to curated engineering articles across Go, PHP/Laravel, Architecture/Cloud, DevOps, and Node.js.
"""

import os
import sys
import sqlite3
import subprocess
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel

from backend.config import HOME_DIR
from backend.security import get_current_user

router = APIRouter(prefix="/api/tech-radar", tags=["Engineering Tech Radar"])

TECH_RADAR_DB = Path("/home/arusuka/second-brain/tech_radar.db")

CURATED_KEYWORDS = [
    "golang", "go ", "laravel", "php", "postgres", "sql", "architecture",
    "microservice", "kubernetes", "k8s", "cloud", "docker", "redis",
    "distributed", "concurrency", "performance", "latency", "scale", "security",
    "copilot", "agentic", "infrastructure", "cloudflare", "workflow"
]

def is_curated_article(title: str, category: str, summary: str) -> bool:
    """Determine if an article is of high curated interest for Mas Fahmi's senior stack."""
    if category in ("Go", "PHP / Laravel", "Architecture / Cloud", "DevOps / Architecture"):
        return True
    combined = f"{title.lower()} {summary.lower()}"
    return any(kw in combined for kw in CURATED_KEYWORDS)

@router.get("")
def get_tech_radar_articles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    curated_only: bool = False,
    page: int = 1,
    limit: int = 18,
    user: str = Depends(get_current_user)
):
    """Retrieve articles from tech_radar.db with category counting, curation badges, and search."""
    if not TECH_RADAR_DB.exists():
        return {
            "status": "success",
            "total": 0,
            "page": page,
            "limit": limit,
            "categories": [],
            "articles": []
        }

    conn = sqlite3.connect(f"file:{TECH_RADAR_DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    # Get category distribution
    cur.execute("SELECT category, count(*) as cnt FROM articles GROUP BY category ORDER BY cnt DESC")
    cat_rows = cur.fetchall()
    categories = [{"name": r["category"], "count": r["cnt"]} for r in cat_rows if r["category"]]

    # Base query
    query_parts = ["SELECT id, title, link, source, category, summary, published_at, is_saved_to_vault FROM articles WHERE 1=1"]
    count_parts = ["SELECT COUNT(*) FROM articles WHERE 1=1"]
    params: List[Any] = []

    if category and category.lower() != "all":
        query_parts.append("AND category = ?")
        count_parts.append("AND category = ?")
        params.append(category)

    if search:
        s_pat = f"%{search.strip()}%"
        query_parts.append("AND (title LIKE ? OR summary LIKE ?)")
        count_parts.append("AND (title LIKE ? OR summary LIKE ?)")
        params.extend([s_pat, s_pat])

    if curated_only:
        curated_clause = """
            AND (
                category IN ('Go', 'PHP / Laravel', 'Architecture / Cloud', 'DevOps / Architecture')
                OR title LIKE '%Golang%' OR title LIKE '%Go %' OR title LIKE '%Laravel%'
                OR title LIKE '%Postgres%' OR title LIKE '%Architecture%' OR title LIKE '%Microservice%'
                OR title LIKE '%Kubernetes%' OR title LIKE '%Cloud%' OR title LIKE '%Scale%'
            )
        """
        query_parts.append(curated_clause)
        count_parts.append(curated_clause)

    # Count total matching
    cur.execute(" ".join(count_parts), params)
    total_count = cur.fetchone()[0]

    # Fetch paginated
    query_parts.append("ORDER BY id DESC LIMIT ? OFFSET ?")
    offset = (page - 1) * limit
    params_with_paging = params + [limit, offset]

    cur.execute(" ".join(query_parts), params_with_paging)
    rows = cur.fetchall()
    conn.close()

    articles = []
    for r in rows:
        title = r["title"] or "Untitled"
        cat = r["category"] or "General"
        sum_text = r["summary"] or ""
        articles.append({
            "id": r["id"],
            "title": title,
            "link": r["link"] or "#",
            "source": r["source"] or "Unknown",
            "category": cat,
            "summary": sum_text,
            "published_at": r["published_at"] or "",
            "is_saved": bool(r["is_saved_to_vault"]),
            "is_curated": is_curated_article(title, cat, sum_text)
        })

    return {
        "status": "success",
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 1,
        "categories": categories,
        "articles": articles
    }

@router.post("/sync")
def sync_tech_radar_feed(user: str = Depends(get_current_user)):
    """Trigger tech-radar CLI to fetch fresh feeds from engineering blogs."""
    try:
        res = subprocess.run(["tech-radar", "fetch"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=25)
        return {
            "status": "success",
            "message": "Sinkronisasi feed Tech Radar berhasil dijalankan.",
            "output": res.stdout.strip()
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Gagal menjalankan sinkronisasi: {str(e)}"
        }

@router.post("/{article_id}/bookmark")
def toggle_bookmark_article(article_id: int, user: str = Depends(get_current_user)):
    """Toggle saved/vault status of an article."""
    if not TECH_RADAR_DB.exists():
        raise HTTPException(status_code=404, detail="Database Tech Radar tidak ditemukan.")

    conn = sqlite3.connect(str(TECH_RADAR_DB))
    cur = conn.cursor()
    cur.execute("SELECT is_saved_to_vault FROM articles WHERE id = ?", (article_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan.")

    current_val = row[0] or 0
    new_val = 0 if current_val == 1 else 1
    cur.execute("UPDATE articles SET is_saved_to_vault = ? WHERE id = ?", (new_val, article_id))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "article_id": article_id,
        "is_saved": bool(new_val),
        "message": "Artikel berhasil ditandai tersimpan ke Vault." if new_val == 1 else "Tanda simpan artikel dicabut."
    }
