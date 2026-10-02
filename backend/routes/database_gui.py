"""
Database Web GUI API Router for Arusuka Command Center.
Allows inspection, querying, schema exploration, and data export across all system SQLite databases.
"""

import os
import time
import sqlite3
import csv
import io
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.security import get_current_user

router = APIRouter(
    prefix="/api/database",
    tags=["Database Explorer"]
)

DATABASE_REGISTRY = [
    {
        "id": "kuro_team",
        "name": "Kuro Team Swarm",
        "category": "AI & Agent Swarm",
        "icon": "Swords",
        "description": "Multi-agent squad state, role tasks, monitoring, and sprint logs",
        "path": "/home/arusuka/.config/antigravity_pool/kuro_team.db",
    },
    {
        "id": "shiro_team",
        "name": "Shiro Team Swarm",
        "category": "AI & Agent Swarm",
        "icon": "Feather",
        "description": "Background routine swarm, daily tasks, and automated jobs",
        "path": "/home/arusuka/.config/antigravity_pool/shiro_team.db",
    },
    {
        "id": "orchestrator",
        "name": "Multi-Agent Orchestrator",
        "category": "AI & Agent Swarm",
        "icon": "Bot",
        "description": "Multi-agent contract definitions, shared locks, and coordination tasks",
        "path": "/home/arusuka/orchestrator/orchestrator.db",
    },
    {
        "id": "conversation_summaries",
        "name": "AGY Conversation Summaries",
        "category": "AI & Agent Swarm",
        "icon": "MessageSquare",
        "description": "Long-term conversation abstracts and memory continuity",
        "path": "/home/arusuka/.gemini/antigravity-cli/conversation_summaries.db",
    },
    {
        "id": "login_session_summaries",
        "name": "AGY Pool Login Sessions",
        "category": "AI & Agent Swarm",
        "icon": "MessageSquare",
        "description": "Antigravity multi-account session pool memory and history",
        "path": "/home/arusuka/.config/antigravity_pool/login_session/.gemini/antigravity-cli/conversation_summaries.db",
    },
    {
        "id": "nutrition",
        "name": "Nutrition & OMAD Tracker",
        "category": "Personal & Life",
        "icon": "HeartPulse",
        "description": "Fasting sessions (23:1), meal calorie/macros, weight, and pokewalker",
        "path": "/home/arusuka/nutrition/nutrition.db",
    },
    {
        "id": "habits",
        "name": "Habits & RPG Profile",
        "category": "Personal & Life",
        "icon": "Sparkles",
        "description": "Habit logs, RPG leveling XP, and achievement badges",
        "path": "/home/arusuka/second-brain/habits.db",
    },
    {
        "id": "personal_tasks",
        "name": "Dashboard Kanban Tasks",
        "category": "System Core",
        "icon": "CheckSquare",
        "description": "Personal task kanban boards and workflow cards",
        "path": "/home/arusuka/dashboard/tasks.db",
    },
    {
        "id": "portfolio",
        "name": "Portfolio & AGY Accounts",
        "category": "System Core",
        "icon": "UserCheck",
        "description": "User CV profile data and 3-Account AGY cluster sessions",
        "path": "/home/arusuka/dashboard/portfolio.db",
    },
    {
        "id": "second_brain_fts",
        "name": "Second Brain FTS5 Index",
        "category": "Knowledge Base",
        "icon": "Brain",
        "description": "Full-text search SQLite index across all Obsidian notes",
        "path": "/home/arusuka/second-brain/brain_index.db",
    },
    {
        "id": "tech_radar",
        "name": "Tech Radar & Clippings",
        "category": "Knowledge Base",
        "icon": "Radar",
        "description": "Saved technology articles, web clippings, and architecture notes",
        "path": "/home/arusuka/second-brain/tech_radar.db",
    },
    {
        "id": "graph_memory",
        "name": "Knowledge Graph Memory",
        "category": "Knowledge Base",
        "icon": "Network",
        "description": "Entities, observations, and semantic memory graph for AI",
        "path": "/home/arusuka/mcp-graph-memory/graph_memory.db",
    },
    {
        "id": "job_hunter",
        "name": "Job Hunter Pipeline",
        "category": "Automation & Tools",
        "icon": "Briefcase",
        "description": "Matched career jobs, application tracker, and fit scores",
        "path": "/home/arusuka/mcp-job-hunter/job_hunter.db",
    },
    {
        "id": "bmkg_alerts",
        "name": "BMKG Weather & Earthquake",
        "category": "Automation & Tools",
        "icon": "CloudSun",
        "description": "Earthquake cache and early warning alert logs",
        "path": "/home/arusuka/mcp-weather/bmkg_alerts.db",
    },
    {
        "id": "uptime_kuma",
        "name": "Uptime Kuma Health",
        "category": "Automation & Tools",
        "icon": "Activity",
        "description": "Heartbeat monitors, uptime stats, and incident records",
        "path": "/home/arusuka/uptime-kuma/data/kuma.db",
    },
    {
        "id": "n8n_workflows",
        "name": "n8n Automation Engine",
        "category": "Automation & Tools",
        "icon": "Workflow",
        "description": "Automated workflow nodes, executions, credentials, and webhooks",
        "path": "/home/arusuka/n8n/data/database.sqlite",
    },
    {
        "id": "robots_cache",
        "name": "Crawl4AI Robots Cache",
        "category": "Automation & Tools",
        "icon": "Globe",
        "description": "Crawler robots.txt permission cache and scraping policy logs",
        "path": "/home/arusuka/.crawl4ai/.crawl4ai/robots/robots_cache.db",
    }
]

def format_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def get_db_path(db_id: str) -> str:
    for db in DATABASE_REGISTRY:
        if db["id"] == db_id:
            if not os.path.exists(db["path"]):
                raise HTTPException(status_code=404, detail=f"Database file not found at {db['path']}")
            return db["path"]
    raise HTTPException(status_code=404, detail=f"Unknown database ID: {db_id}")

def open_sqlite(path: str, readonly: bool = True) -> sqlite3.Connection:
    """Connect to SQLite database safely, handling readonly permissions and WAL files."""
    if readonly:
        try:
            return sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        except Exception:
            try:
                return sqlite3.connect(f"file:{path}?immutable=1", uri=True)
            except Exception:
                return sqlite3.connect(path)
    return sqlite3.connect(path)

@router.get("/list")
async def list_databases(current_user: str = Depends(get_current_user)):
    """Return list of all registered databases with live size and table counts."""
    result = []
    for db in DATABASE_REGISTRY:
        exists = os.path.exists(db["path"])
        size_bytes = os.path.getsize(db["path"]) if exists else 0
        tables = []
        if exists:
            try:
                conn = open_sqlite(db["path"], readonly=True)
                cur = conn.cursor()
                cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
                tables = [r[0] for r in cur.fetchall()]
                conn.close()
            except Exception:
                tables = []

        result.append({
            **db,
            "exists": exists,
            "size_bytes": size_bytes,
            "size_formatted": format_size(size_bytes),
            "table_count": len(tables),
            "tables": tables,
        })
    return {"databases": result}

@router.get("/tables")
async def get_tables(
    db_id: str = Query(...),
    current_user: str = Depends(get_current_user)
):
    """Return all tables in a specific database with row counts and column previews."""
    path = get_db_path(db_id)
    try:
        conn = open_sqlite(path, readonly=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
        table_names = [r[0] for r in cur.fetchall()]
        
        tables_info = []
        for tname in table_names:
            try:
                cur.execute(f"SELECT COUNT(*) FROM `{tname}`")
                row_count = cur.fetchone()[0]
            except Exception:
                row_count = 0
            
            try:
                cur.execute(f"PRAGMA table_info(`{tname}`)")
                columns = [dict(r) for r in cur.fetchall()]
            except Exception:
                columns = []
            
            tables_info.append({
                "name": tname,
                "row_count": row_count,
                "column_count": len(columns),
                "columns": columns
            })
        conn.close()
        return {"db_id": db_id, "tables": tables_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/schema")
async def get_table_schema(
    db_id: str = Query(...),
    table: str = Query(...),
    current_user: str = Depends(get_current_user)
):
    """Return column specifications, primary keys, and foreign keys for a table."""
    path = get_db_path(db_id)
    try:
        conn = open_sqlite(path, readonly=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        cur.execute(f"PRAGMA table_info(`{table}`)")
        columns = [dict(r) for r in cur.fetchall()]
        
        cur.execute(f"PRAGMA index_list(`{table}`)")
        indexes = [dict(r) for r in cur.fetchall()]
        
        cur.execute(f"PRAGMA foreign_key_list(`{table}`)")
        foreign_keys = [dict(r) for r in cur.fetchall()]
        
        try:
            cur.execute(f"SELECT COUNT(*) FROM `{table}`")
            row_count = cur.fetchone()[0]
        except Exception:
            row_count = 0
        
        conn.close()
        return {
            "db_id": db_id,
            "table": table,
            "row_count": row_count,
            "columns": columns,
            "indexes": indexes,
            "foreign_keys": foreign_keys
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data")
async def get_table_data(
    db_id: str = Query(...),
    table: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    sort_col: Optional[str] = Query(None),
    sort_dir: Optional[str] = Query("asc"),
    current_user: str = Depends(get_current_user)
):
    """Fetch paginated table records with optional search filter and sorting."""
    path = get_db_path(db_id)
    try:
        conn = open_sqlite(path, readonly=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Get column names
        cur.execute(f"PRAGMA table_info(`{table}`)")
        cols_info = cur.fetchall()
        column_names = [c["name"] for c in cols_info]
        
        where_clauses = []
        params = []
        if search and search.strip():
            s_term = f"%{search.strip()}%"
            search_conds = [f"CAST(`{c}` AS TEXT) LIKE ?" for c in column_names]
            if search_conds:
                where_clauses.append("(" + " OR ".join(search_conds) + ")")
                params.extend([s_term] * len(search_conds))
            
        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        
        # Count total matching rows
        cur.execute(f"SELECT COUNT(*) FROM `{table}` {where_sql}", params)
        total_rows = cur.fetchone()[0]
        
        # Order by
        order_sql = ""
        if sort_col and sort_col in column_names:
            direction = "DESC" if sort_dir and sort_dir.lower() == "desc" else "ASC"
            order_sql = f"ORDER BY `{sort_col}` {direction}"
        
        offset = (page - 1) * limit
        query_sql = f"SELECT * FROM `{table}` {where_sql} {order_sql} LIMIT {limit} OFFSET {offset}"
        
        start_t = time.perf_counter()
        cur.execute(query_sql, params)
        rows_raw = cur.fetchall()
        latency_ms = round((time.perf_counter() - start_t) * 1000, 2)
        
        rows = [dict(r) for r in rows_raw]
        conn.close()
        
        total_pages = max(1, (total_rows + limit - 1) // limit)
        return {
            "db_id": db_id,
            "table": table,
            "columns": column_names,
            "rows": rows,
            "total_rows": total_rows,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "latency_ms": latency_ms
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExecuteQueryRequest(BaseModel):
    db_id: str
    sql: str

@router.post("/query")
async def execute_custom_query(
    req: ExecuteQueryRequest,
    current_user: str = Depends(get_current_user)
):
    """Execute raw SQL query safely with execution timing and row caps."""
    path = get_db_path(req.db_id)
    sql = req.sql.strip()
    if not sql:
        raise HTTPException(status_code=400, detail="SQL query cannot be empty")
        
    is_select = sql.upper().startswith(("SELECT", "PRAGMA", "EXPLAIN", "WITH"))
    
    try:
        conn = open_sqlite(path, readonly=is_select)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        start_t = time.perf_counter()
        cur.execute(sql)
        
        if is_select:
            rows_raw = cur.fetchmany(500)
            columns = [desc[0] for desc in cur.description] if cur.description else []
            rows = [dict(r) for r in rows_raw]
            affected_rows = len(rows)
        else:
            conn.commit()
            columns = []
            rows = []
            affected_rows = cur.rowcount
            
        latency_ms = round((time.perf_counter() - start_t) * 1000, 2)
        conn.close()
        
        return {
            "success": True,
            "columns": columns,
            "rows": rows,
            "affected_rows": affected_rows,
            "latency_ms": latency_ms,
            "is_capped": len(rows) == 500 if is_select else False
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "columns": [],
            "rows": [],
            "affected_rows": 0,
            "latency_ms": 0
        }

@router.get("/export")
async def export_table_data(
    db_id: str = Query(...),
    table: str = Query(...),
    format: str = Query("csv"),
    current_user: str = Depends(get_current_user)
):
    """Export table data as CSV or JSON stream."""
    path = get_db_path(db_id)
    try:
        conn = open_sqlite(path, readonly=True)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(f"SELECT * FROM `{table}`")
        rows_raw = cur.fetchall()
        columns = [desc[0] for desc in cur.description] if cur.description else []
        rows = [dict(r) for r in rows_raw]
        conn.close()
        
        if format.lower() == "json":
            json_str = json.dumps(rows, indent=2, default=str)
            return StreamingResponse(
                io.StringIO(json_str),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename={db_id}_{table}.json"}
            )
        else:
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(columns)
            for r in rows_raw:
                writer.writerow([r[c] for c in columns])
            output.seek(0)
            return StreamingResponse(
                output,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={db_id}_{table}.csv"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
