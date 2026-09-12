"""
Obsidian Second Brain & Knowledge Graph API router (/api/second-brain).
"""

from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

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
        "notes": notes[:50],
        "total_notes": len(notes),
        "graph": graph_stats
    }


@router.get("/note")
def get_note_detail(folder: str, filename: str, current_user: str = Depends(get_current_user)):
    """Fetch full content, wikilinks, and backlinks of a specific Second Brain note."""
    if not BRAIN_DIR.exists():
        raise HTTPException(status_code=404, detail="Second Brain directory not found")

    target_file = (BRAIN_DIR / folder / filename).resolve()
    if not target_file.is_relative_to(BRAIN_DIR.resolve()) or not target_file.exists():
        raise HTTPException(status_code=404, detail="Note file not found")

    # Strict Privacy Filter
    if is_finance_related(target_file.name) or is_finance_related(target_file.stem):
        raise HTTPException(status_code=403, detail="Access to private finance notes is restricted")

    content = target_file.read_text(encoding="utf-8", errors="ignore")
    if is_finance_related(content):
        raise HTTPException(status_code=403, detail="Access to private finance notes is restricted")

    import re
    # Extract outgoing wikilinks: [[link]] or [[folder/link]]
    outgoing_links = re.findall(r'\[\[(.*?)\]\]', content)

    # Scan for incoming backlinks across the vault
    backlinks = []
    target_stem = target_file.stem.lower()
    for fld in ["Inbox", "Projects", "Entities", "Preferences", "Rules"]:
        fld_dir = BRAIN_DIR / fld
        if not fld_dir.exists():
            continue
        for other_file in fld_dir.glob("*.md"):
            if other_file == target_file or is_finance_related(other_file.name):
                continue
            try:
                other_content = other_file.read_text(encoding="utf-8", errors="ignore")
                if f"[[{target_file.stem}]]" in other_content or f"[[{folder}/{target_file.stem}]]" in other_content or target_stem in other_content.lower():
                    backlinks.append({
                        "folder": fld,
                        "filename": other_file.name,
                        "title": other_file.stem.replace("_", " ").title()
                    })
            except Exception:
                pass

    stat = target_file.stat()
    return {
        "folder": folder,
        "filename": filename,
        "title": target_file.stem.replace("_", " ").title(),
        "content": content,
        "outgoing_links": outgoing_links,
        "backlinks": backlinks,
        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
        "size_bytes": stat.st_size
    }


@router.get("/orphans")
def get_orphan_notes(current_user: str = Depends(get_current_user)):
    """Find notes that have no incoming wikilinks from other notes (Orphan Notes)."""
    if not BRAIN_DIR.exists():
        return {"orphans": [], "total_orphans": 0}

    all_notes = {}
    all_contents = {}

    for folder in ["Inbox", "Projects", "Entities", "Preferences", "Rules"]:
        fld_dir = BRAIN_DIR / folder
        if not fld_dir.exists():
            continue
        for f in fld_dir.glob("*.md"):
            if is_finance_related(f.name) or is_finance_related(f.stem):
                continue
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if is_finance_related(content):
                    continue
                key = (folder, f.name, f.stem)
                all_notes[key] = f
                all_contents[key] = content
            except Exception:
                pass

    orphans = []
    for (folder, filename, stem), f_path in all_notes.items():
        incoming_count = 0
        stem_pattern = f"[[{stem}]]"
        path_pattern = f"[[{folder}/{stem}]]"
        for (other_folder, other_filename, other_stem), other_content in all_contents.items():
            if (other_folder, other_filename) == (folder, filename):
                continue
            if stem_pattern in other_content or path_pattern in other_content:
                incoming_count += 1

        if incoming_count == 0:
            stat = f_path.stat()
            orphans.append({
                "folder": folder,
                "filename": filename,
                "title": stem.replace("_", " ").title(),
                "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
            })

    return {
        "orphans": orphans,
        "total_orphans": len(orphans)
    }


@router.get("/network-graph")
def get_network_graph(current_user: str = Depends(get_current_user)):
    """
    Generate 2D interactive knowledge graph node-link dataset from Obsidian wikilinks.
    Excludes sensitive finance notes.
    """
    import re

    if not BRAIN_DIR.exists():
        return {"nodes": [], "links": []}

    nodes_map = {}
    notes_content = {}
    allowed_folders = ["Inbox", "Projects", "Entities", "Preferences", "Rules", "Readings", "Research"]

    for folder in allowed_folders:
        fld_dir = BRAIN_DIR / folder
        if not fld_dir.exists():
            continue
        for f in fld_dir.glob("*.md"):
            if is_finance_related(f.name) or is_finance_related(f.stem):
                continue
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if is_finance_related(content):
                    continue
                node_id = f.stem
                nodes_map[node_id] = {
                    "id": node_id,
                    "label": f.stem.replace("_", " ").title(),
                    "folder": folder,
                    "filename": f.name,
                    "val": 1
                }
                notes_content[node_id] = (content, folder, f.name)
            except Exception:
                pass

    links = []
    seen_links = set()

    for node_id, (content, folder, fname) in notes_content.items():
        raw_links = re.findall(r'\[\[(.*?)\]\]', content)
        for target_raw in raw_links:
            # Handle aliases like [[target|alias]] or [[folder/target]]
            clean_target = target_raw.split('|')[0].strip()
            target_stem = clean_target.split('/')[-1].strip()

            if target_stem in nodes_map and target_stem != node_id:
                link_key = tuple(sorted([node_id, target_stem]))
                if link_key not in seen_links:
                    seen_links.add(link_key)
                    links.append({
                        "source": node_id,
                        "target": target_stem
                    })
                    nodes_map[node_id]["val"] += 1
                    nodes_map[target_stem]["val"] += 1

    return {
        "nodes": list(nodes_map.values()),
        "links": links,
        "total_nodes": len(nodes_map),
        "total_links": len(links)
    }
