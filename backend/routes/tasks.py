"""
Personal Tasks & Kanban Board API router (/api/tasks/*).
"""

from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from backend.config import TASK_DB
from backend.database import get_db_connection, init_task_db
from backend.security import get_current_user
from backend.websocket import trigger_ws_event

router = APIRouter(prefix="/api/tasks", tags=["Personal Tasks"])


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    status: Optional[str] = "todo"
    priority: Optional[str] = "medium"
    category: Optional[str] = "General"
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None


@router.get("")
def get_tasks(
    search: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Fetch personal tasks grouped by Kanban columns + stats."""
    if not TASK_DB.exists():
        init_task_db()

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        query = "SELECT * FROM personal_tasks WHERE 1=1"
        params = []
        
        if search:
            query += " AND (title LIKE ? OR description LIKE ? OR category LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param])
        if category and category.lower() != "all":
            query += " AND category = ?"
            params.append(category)
        if priority and priority.lower() != "all":
            query += " AND priority = ?"
            params.append(priority)
        if status:
            query += " AND status = ?"
            params.append(status)
            
        query += """
            ORDER BY 
            CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
                ELSE 5 
            END ASC,
            updated_at DESC, id DESC
        """
        
        cur.execute(query, params)
        all_tasks = [dict(r) for r in cur.fetchall()]

    columns = {
        "backlog": [],
        "todo": [],
        "in_progress": [],
        "review": [],
        "done": []
    }
    for t in all_tasks:
        st = t["status"]
        if st in columns:
            columns[st].append(t)
        else:
            columns["todo"].append(t)

    stats = {k: len(v) for k, v in columns.items()}
    stats["total"] = len(all_tasks)
    stats["active"] = sum(len(v) for k, v in columns.items() if k != "done")
    stats["urgent"] = sum(1 for t in all_tasks if t.get("priority") in ("urgent", "high") and t.get("status") != "done")

    # Categories list
    categories = []
    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT category FROM personal_tasks WHERE category != '' ORDER BY category ASC")
        categories = [r[0] for r in cur.fetchall()]

    return {
        "columns": columns,
        "stats": stats,
        "categories": categories,
        "total_count": len(all_tasks)
    }


@router.post("")
def create_task(task: TaskCreate, current_user: str = Depends(get_current_user)):
    """Add a new personal task."""
    if not TASK_DB.exists():
        init_task_db()

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO personal_tasks (title, description, status, priority, category, due_date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (task.title, task.description, task.status, task.priority, task.category, task.due_date))
        conn.commit()
        new_id = cur.lastrowid

    trigger_ws_event("tasks_updated", {"action": "created", "id": new_id, "title": task.title})
    return {"status": "success", "id": new_id, "message": f"Task '{task.title}' berhasil ditambahkan"}


@router.patch("/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, current_user: str = Depends(get_current_user)):
    """Update personal task status, priority, description, etc."""
    if not TASK_DB.exists():
        raise HTTPException(status_code=404, detail="Task database not found")

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT * FROM personal_tasks WHERE id=?", (task_id,))
        task = cur.fetchone()
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        updates = ["updated_at = CURRENT_TIMESTAMP"]
        params = []

        if payload.title is not None:
            updates.append("title = ?")
            params.append(payload.title)
        if payload.description is not None:
            updates.append("description = ?")
            params.append(payload.description)
        if payload.status is not None:
            updates.append("status = ?")
            params.append(payload.status)
        if payload.priority is not None:
            updates.append("priority = ?")
            params.append(payload.priority)
        if payload.category is not None:
            updates.append("category = ?")
            params.append(payload.category)
        if payload.due_date is not None:
            updates.append("due_date = ?")
            params.append(payload.due_date)

        params.append(task_id)
        cur.execute(f"UPDATE personal_tasks SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    trigger_ws_event("tasks_updated", {"action": "updated", "id": task_id})
    return {"status": "success", "message": f"Task #{task_id} berhasil diperbarui"}


@router.delete("/{task_id}")
def delete_task(task_id: int, current_user: str = Depends(get_current_user)):
    """Delete a personal task."""
    if not TASK_DB.exists():
        raise HTTPException(status_code=404, detail="Task database not found")

    with get_db_connection(TASK_DB) as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM personal_tasks WHERE id=?", (task_id,))
        conn.commit()

    trigger_ws_event("tasks_updated", {"action": "deleted", "id": task_id})
    return {"status": "success", "message": f"Task #{task_id} berhasil dihapus"}
