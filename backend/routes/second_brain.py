"""
Obsidian Second Brain & Knowledge Graph API router (/api/second-brain).
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends

from backend.config import BRAIN_DIR, GRAPH_DB, is_finance_related
from backend.database import get_db_connection
from backend.security import get_current_user

router = APIRouter(prefix="/api/second-brain", tags=["Second Brain"])


@router.get("")
def get_second_brain(query: Optional[str] = None, current_user: str = Depends(get_current_user)):
    """Fetch Second Brain note feed and Knowledge Graph statistics (Excluding private finance data)."""
    notes = []
    if BRAIN_DIR.exists():
        for folder in ["Inbox", "Projects", "Entities", "Preferences", "Rules"]:
            target_dir = BRAIN_DIR / folder
            if not target_dir.exists():
                continue
            for f in target_dir.glob("*.md"):
                # Strict Privacy Filter: Skip any finance/debt files
                if is_finance_related(f.name) or is_finance_related(f.stem):
                    continue

                try:
                    stat = f.stat()
                    content = f.read_text(encoding="utf-8", errors="ignore")
                    
                    # Privacy: exclude any note containing finance keywords
                    if is_finance_related(content):
                        continue

                    if query and query.lower() not in f.name.lower() and query.lower() not in content.lower():
                        continue
                    
                    preview_lines = [l.strip() for l in content.splitlines() if l.strip() and not l.startswith("#")][:3]
                    preview = " ".join(preview_lines)[:180] + "..." if preview_lines else ""

                    notes.append({
                        "filename": f.name,
                        "folder": folder,
                        "title": f.stem.replace("_", " ").title(),
                        "preview": preview,
                        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                        "size_bytes": stat.st_size
                    })
                except Exception:
                    pass

    notes.sort(key=lambda x: x["modified_at"], reverse=True)

    # Graph stats (Strict Privacy Filter)
    graph_stats = {"entities_count": 0, "relations_count": 0, "top_entities": []}
    if GRAPH_DB.exists():
        try:
            with get_db_connection(GRAPH_DB) as conn:
                cur = conn.cursor()
                cur.execute("""
                    SELECT COUNT(*) FROM entities
                    WHERE LOWER(name) NOT LIKE '%finance%'
                      AND LOWER(name) NOT LIKE '%debt%'
                      AND LOWER(name) NOT LIKE '%pinjol%'
                      AND LOWER(name) NOT LIKE '%tagihan%'
                      AND LOWER(name) NOT LIKE '%wallet%'
                      AND LOWER(name) NOT LIKE '%dompet%'
                      AND LOWER(name) NOT LIKE '%cicilan%'
                      AND LOWER(name) NOT LIKE '%paylater%'
                """)
                graph_stats["entities_count"] = cur.fetchone()[0]
                cur.execute("""
                    SELECT COUNT(*) FROM relations
                    WHERE LOWER(source_entity) NOT LIKE '%finance%'
                      AND LOWER(target_entity) NOT LIKE '%finance%'
                      AND LOWER(source_entity) NOT LIKE '%debt%'
                      AND LOWER(target_entity) NOT LIKE '%debt%'
                """)
                graph_stats["relations_count"] = cur.fetchone()[0]
                
                cur.execute("""
                    SELECT name, entity_type, COUNT(r.id) as connection_count
                    FROM entities e
                    LEFT JOIN relations r ON e.name = r.source_entity OR e.name = r.target_entity
                    WHERE LOWER(e.name) NOT LIKE '%finance%'
                      AND LOWER(e.name) NOT LIKE '%debt%'
                      AND LOWER(e.name) NOT LIKE '%pinjol%'
                      AND LOWER(e.name) NOT LIKE '%tagihan%'
                      AND LOWER(e.name) NOT LIKE '%wallet%'
                      AND LOWER(e.name) NOT LIKE '%dompet%'
                      AND LOWER(e.name) NOT LIKE '%cicilan%'
                      AND LOWER(e.name) NOT LIKE '%paylater%'
                    GROUP BY e.name
                    ORDER BY connection_count DESC
                    LIMIT 10
                """)
                graph_stats["top_entities"] = [dict(r) for r in cur.fetchall()]
        except Exception as e:
            print(f"Error reading graph stats: {e}")

    return {
        "notes": notes[:30],
        "total_notes": len(notes),
        "graph": graph_stats
    }
