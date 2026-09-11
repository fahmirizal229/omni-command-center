"""
Database connection helpers and initialization.
"""

import sqlite3
from pathlib import Path
from backend.config import TASK_DB

def get_db_connection(db_path: Path) -> sqlite3.Connection:
    """Open SQLite connection with row factory and standard busy timeout."""
    conn = sqlite3.connect(str(db_path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_task_db():
    """Initialize tasks database table schema if it does not exist (zero auto-seeding)."""
    TASK_DB.parent.mkdir(parents=True, exist_ok=True)
    with get_db_connection(TASK_DB) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS personal_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT "",
                status TEXT NOT NULL DEFAULT "todo",
                priority TEXT NOT NULL DEFAULT "medium",
                category TEXT DEFAULT "Personal",
                due_date TEXT DEFAULT "",
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

init_task_db()
