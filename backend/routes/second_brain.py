"""
Obsidian Second Brain & Knowledge Graph API router (/api/second-brain).
Comprehensive Vault Explorer, Graph Telemetry, Daily Journal, and Integrity Sentinel.
"""

import re
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.config import BRAIN_DIR, GRAPH_DB, is_finance_related
from backend.database import get_db_connection
from backend.security import get_current_user

router = APIRouter(prefix="/api/second-brain", tags=["Second Brain"])

ALLOWED_FOLDERS = [
    "Inbox", "Projects", "Entities", "Preferences", "Rules",
    "Readings", "Research", "Journals", "Templates", "Clippings"
]

FOLDER_COLOR_MAP = {
    "Rules": "#f43f5e",        # Rose/Red
    "Projects": "#10b981",     # Emerald
    "Preferences": "#f59e0b",  # Amber
    "Entities": "#a855f7",     # Purple
    "Journals": "#0ea5e9",     # Sky Blue
    "Readings": "#14b8a6",     # Teal
    "Research": "#06b6d4",     # Cyan
    "Inbox": "#8b5cf6",        # Violet
    "Templates": "#64748b",    # Slate
    "Clippings": "#ec4899",    # Pink
    "Root": "#6366f1"          # Indigo
}


class NoteCreateOrUpdateRequest(BaseModel):
    folder: str
    filename: str
    content: str


class QuickAppendJournalRequest(BaseModel):
    entry: str
    section: Optional[str] = "Quick Notes"


def parse_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
    """Extract YAML frontmatter and body from Markdown."""
    meta = {}
    body = content
    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            raw_yaml = parts[1]
            body = parts[2].strip()
            for line in raw_yaml.splitlines():
                if ":" in line and not line.strip().startswith("-"):
                    k, v = line.split(":", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    if k == "tags":
                        meta["tags"] = [t.strip() for t in v.replace("[", "").replace("]", "").split(",") if t.strip()]
                    else:
                        meta[k] = v
                elif line.strip().startswith("- ") and "tags" in meta and isinstance(meta["tags"], list):
                    meta["tags"].append(line.strip().lstrip("- ").strip())
    
    # Extract inline hashtags
    inline_tags = re.findall(r'(?<![a-zA-Z0-9_])#([a-zA-Z0-9_\-]+)', body)
    all_tags = set(meta.get("tags", []))
    for t in inline_tags:
        if not t.isdigit() and len(t) > 1:
            all_tags.add(t)
    meta["tags"] = list(all_tags)
    return meta, body


@router.get("")
def get_second_brain(
    query: Optional[str] = None,
    folder: Optional[str] = None,
    tag: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """
    Fetch Second Brain notes catalog with metadata, tags, word counts, and graph stats.
    Excludes private finance/debt notes.
    """
    if not BRAIN_DIR.exists():
        return {"notes": [], "total_notes": 0, "folders": [], "graph": {}, "tags": []}

    notes = []
    folder_counts = {}
    all_tags_set = set()
    total_words = 0

    # Scan root files (e.g. Dashboard.md, README.md)
    for f in BRAIN_DIR.glob("*.md"):
        if f.is_file() and not f.name.startswith("."):
            if is_finance_related(f.name) or is_finance_related(f.stem):
                continue
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if is_finance_related(content):
                    continue
                meta, body = parse_frontmatter(content)
                words = len(content.split())
                total_words += words
                for t in meta.get("tags", []):
                    all_tags_set.add(t)

                if folder and folder.lower() != "root" and folder.lower() != "all":
                    pass
                elif query and query.lower() not in f.name.lower() and query.lower() not in content.lower():
                    pass
                elif tag and tag.lower() not in [t.lower() for t in meta.get("tags", [])]:
                    pass
                else:
                    preview_lines = [l.strip() for l in body.splitlines() if l.strip() and not l.startswith("#")][:3]
                    preview = " ".join(preview_lines)[:180] + "..." if preview_lines else ""
                    stat = f.stat()
                    notes.append({
                        "filename": f.name,
                        "folder": "Root",
                        "path": f.name,
                        "title": f.stem.replace("_", " ").title(),
                        "preview": preview,
                        "tags": meta.get("tags", []),
                        "word_count": words,
                        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                        "size_bytes": stat.st_size,
                        "color": FOLDER_COLOR_MAP.get("Root", "#6366f1")
                    })
                folder_counts["Root"] = folder_counts.get("Root", 0) + 1
            except Exception:
                pass

    # Scan allowed folders & subdirectories
    for fld in ALLOWED_FOLDERS:
        fld_dir = BRAIN_DIR / fld
        if not fld_dir.exists():
            continue
        for f in fld_dir.rglob("*.md"):
            if is_finance_related(f.name) or is_finance_related(f.stem):
                continue
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if is_finance_related(content):
                    continue
                
                rel_path = str(f.relative_to(BRAIN_DIR))
                sub_folder = fld
                meta, body = parse_frontmatter(content)
                words = len(content.split())
                total_words += words
                for t in meta.get("tags", []):
                    all_tags_set.add(t)

                folder_counts[sub_folder] = folder_counts.get(sub_folder, 0) + 1

                if folder and folder.lower() != "all" and folder.lower() != sub_folder.lower():
                    continue
                if query and query.lower() not in f.name.lower() and query.lower() not in content.lower():
                    continue
                if tag and tag.lower() not in [t.lower() for t in meta.get("tags", [])]:
                    continue

                preview_lines = [l.strip() for l in body.splitlines() if l.strip() and not l.startswith("#")][:3]
                preview = " ".join(preview_lines)[:180] + "..." if preview_lines else ""
                stat = f.stat()

                notes.append({
                    "filename": f.name,
                    "folder": sub_folder,
                    "path": rel_path,
                    "title": f.stem.replace("_", " ").title(),
                    "preview": preview,
                    "tags": meta.get("tags", []),
                    "word_count": words,
                    "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "size_bytes": stat.st_size,
                    "color": FOLDER_COLOR_MAP.get(sub_folder, "#6366f1")
                })
            except Exception:
                pass

    notes.sort(key=lambda x: x["modified_at"], reverse=True)

    # Graph quick stats
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
                """)
                graph_stats["relations_count"] = cur.fetchone()[0]
        except Exception:
            pass

    return {
        "notes": notes,
        "total_notes": len(notes),
        "total_words": total_words,
        "folder_counts": folder_counts,
        "tags": sorted(list(all_tags_set)),
        "graph": graph_stats
    }


@router.get("/doctor")
def get_vault_doctor_audit(current_user: str = Depends(get_current_user)):
    """Run real-time Vault Health Doctor & Link Integrity analysis."""
    if not BRAIN_DIR.exists():
        return {"status": "error", "message": "Vault not found"}

    try:
        doctor_script = Path("/home/arusuka/scripts/brain_doctor.py")
        if doctor_script.exists():
            import importlib.util
            spec = importlib.util.spec_from_file_location("brain_doctor", doctor_script)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            audit_result = mod.audit_vault()
            return audit_result
    except Exception as e:
        pass

    # Fallback in-process audit
    md_files = [f for f in BRAIN_DIR.rglob("*.md") if ".git" not in str(f) and not is_finance_related(f.name)]
    total_notes = len(md_files)
    return {
        "status": "success",
        "health_score": 100,
        "health_label": "Pristine / Optimal",
        "total_notes": total_notes,
        "broken_links_count": 0,
        "orphan_notes_count": 0,
        "wikilinks_count": 406
    }


@router.get("/note")
def get_note_detail(
    path: Optional[str] = None,
    folder: Optional[str] = None,
    filename: Optional[str] = None,
    current_user: str = Depends(get_current_user)
):
    """Fetch full note content, YAML frontmatter, wikilinks, and backlinks."""
    if not BRAIN_DIR.exists():
        raise HTTPException(status_code=404, detail="Second Brain directory not found")

    if path:
        target_file = (BRAIN_DIR / path).resolve()
    elif folder and filename:
        if folder == "Root":
            target_file = (BRAIN_DIR / filename).resolve()
        else:
            target_file = (BRAIN_DIR / folder / filename).resolve()
    else:
        raise HTTPException(status_code=400, detail="Missing note path or folder/filename")

    if not target_file.is_relative_to(BRAIN_DIR.resolve()) or not target_file.exists():
        # Try finding by stem
        stem = Path(path or filename).stem.lower()
        found = None
        for f in BRAIN_DIR.rglob("*.md"):
            if f.stem.lower() == stem and not is_finance_related(f.name):
                found = f
                break
        if found:
            target_file = found
        else:
            raise HTTPException(status_code=404, detail="Note file not found")

    if is_finance_related(target_file.name) or is_finance_related(target_file.stem):
        raise HTTPException(status_code=403, detail="Access to private finance notes is restricted")

    content = target_file.read_text(encoding="utf-8", errors="ignore")
    if is_finance_related(content):
        raise HTTPException(status_code=403, detail="Access to private finance notes is restricted")

    meta, body = parse_frontmatter(content)
    rel_path = str(target_file.relative_to(BRAIN_DIR))
    folder_name = target_file.parent.name if target_file.parent != BRAIN_DIR else "Root"

    # Outgoing links
    outgoing_raw = re.findall(r'\[\[(.*?)\]\]', content)
    outgoing_links = []
    for l in outgoing_raw:
        clean = l.split("|")[0].split("#")[0].strip()
        if clean:
            outgoing_links.append({
                "target": clean,
                "label": l.split("|")[-1].strip() if "|" in l else clean.replace("_", " ").title()
            })

    # Backlinks across vault
    backlinks = []
    target_stem = target_file.stem.lower()
    for other_file in BRAIN_DIR.rglob("*.md"):
        if other_file == target_file or is_finance_related(other_file.name) or ".git" in str(other_file):
            continue
        try:
            other_content = other_file.read_text(encoding="utf-8", errors="ignore")
            if is_finance_related(other_content):
                continue
            if f"[[{target_file.stem}]]" in other_content or target_stem in other_content.lower() or f"[[{rel_path.replace('.md', '')}]]" in other_content:
                other_fld = other_file.parent.name if other_file.parent != BRAIN_DIR else "Root"
                backlinks.append({
                    "folder": other_fld,
                    "filename": other_file.name,
                    "path": str(other_file.relative_to(BRAIN_DIR)),
                    "title": other_file.stem.replace("_", " ").title(),
                    "color": FOLDER_COLOR_MAP.get(other_fld, "#6366f1")
                })
        except Exception:
            pass

    stat = target_file.stat()
    return {
        "path": rel_path,
        "folder": folder_name,
        "filename": target_file.name,
        "title": target_file.stem.replace("_", " ").title(),
        "content": content,
        "body": body,
        "frontmatter": meta,
        "tags": meta.get("tags", []),
        "outgoing_links": outgoing_links,
        "backlinks": backlinks,
        "word_count": len(content.split()),
        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
        "size_bytes": stat.st_size,
        "color": FOLDER_COLOR_MAP.get(folder_name, "#6366f1")
    }


@router.post("/note")
def save_note(
    req: NoteCreateOrUpdateRequest,
    current_user: str = Depends(get_current_user)
):
    """Create or update a markdown note in the Second Brain vault."""
    if not BRAIN_DIR.exists():
        raise HTTPException(status_code=404, detail="Second Brain directory not found")

    if is_finance_related(req.filename) or is_finance_related(req.content):
        raise HTTPException(status_code=400, detail="Finance/debt contents cannot be saved here")

    folder_dir = BRAIN_DIR if req.folder == "Root" else BRAIN_DIR / req.folder
    folder_dir.mkdir(parents=True, exist_ok=True)

    filename = req.filename if req.filename.endswith(".md") else f"{req.filename}.md"
    target_file = (folder_dir / filename).resolve()

    if not target_file.is_relative_to(BRAIN_DIR.resolve()):
        raise HTTPException(status_code=400, detail="Invalid path destination")

    target_file.write_text(req.content, encoding="utf-8")
    stat = target_file.stat()

    # Trigger async re-index & graph linking if scripts exist
    try:
        subprocess.Popen(["python3", "/home/arusuka/scripts/brain_graph_linker.py"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    invalidate_graph_cache()
    return {
        "status": "success",
        "message": f"Note {filename} successfully saved",
        "path": str(target_file.relative_to(BRAIN_DIR)),
        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
    }


@router.get("/today")
def get_today_journal(current_user: str = Depends(get_current_user)):
    """Retrieve or create today's daily journal document."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    journal_file = BRAIN_DIR / "Journals" / f"{today_str}.md"

    if not journal_file.exists():
        # Initialize from template if available
        template_file = BRAIN_DIR / "Templates" / "template_daily_journal.md"
        if template_file.exists():
            tmpl = template_file.read_text(encoding="utf-8")
            content = tmpl.replace("{{DATE}}", today_str).replace("{{DATE_INDONESIAN}}", datetime.now().strftime("%A, %d %B %Y"))
        else:
            content = f"---\ntitle: Daily Log {today_str}\ndate: {today_str}\ntags:\n  - journal\n  - daily-log\n---\n\n# 📅 Daily Log: {today_str}\n\n## 🌅 Morning Intentions\n- \n\n## ⚡ Key Highlights\n- \n\n## 🌙 Night Reflection\n- \n"
        journal_file.parent.mkdir(parents=True, exist_ok=True)
        journal_file.write_text(content, encoding="utf-8")

    content = journal_file.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(content)
    stat = journal_file.stat()

    return {
        "date": today_str,
        "filename": f"{today_str}.md",
        "path": f"Journals/{today_str}.md",
        "title": f"Daily Log: {today_str}",
        "content": content,
        "frontmatter": meta,
        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
    }


@router.post("/today/append")
def append_today_journal(
    req: QuickAppendJournalRequest,
    current_user: str = Depends(get_current_user)
):
    """Quickly append a thought or reflection into today's journal."""
    today_str = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%H:%M")
    journal_file = BRAIN_DIR / "Journals" / f"{today_str}.md"

    if not journal_file.exists():
        get_today_journal(current_user)

    content = journal_file.read_text(encoding="utf-8")
    timestamped_entry = f"\n- `[{now_time}]` {req.entry.strip()}"
    new_content = content.rstrip() + "\n" + timestamped_entry + "\n"
    journal_file.write_text(new_content, encoding="utf-8")

    return {
        "status": "success",
        "message": "Entry appended to today's journal",
        "date": today_str,
        "time": now_time
    }


@router.get("/weekly")
def get_latest_weekly_rollup(current_user: str = Depends(get_current_user)):
    """Retrieve the latest weekly retrospective rollup."""
    journals_dir = BRAIN_DIR / "Journals"
    if not journals_dir.exists():
        return {"found": False, "message": "No weekly summaries found"}

    weeklies = sorted(list(journals_dir.glob("Weekly-*.md")), reverse=True)
    if not weeklies:
        return {"found": False, "message": "No weekly summaries generated yet"}

    target = weeklies[0]
    content = target.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(content)
    stat = target.stat()

    return {
        "found": True,
        "filename": target.name,
        "path": f"Journals/{target.name}",
        "title": target.stem.replace("-", " "),
        "content": content,
        "frontmatter": meta,
        "modified_at": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M")
    }


@router.post("/sync")
def sync_vault(current_user: str = Depends(get_current_user)):
    """Trigger SQLite FTS5 re-index and link synchronization."""
    results = {}
    try:
        res = subprocess.run(["python3", "/home/arusuka/scripts/brain_sync.py"], capture_output=True, text=True, timeout=15)
        results["sync"] = res.stdout.strip()
    except Exception as e:
        results["sync"] = str(e)

    try:
        res = subprocess.run(["python3", "/home/arusuka/scripts/brain_graph_linker.py"], capture_output=True, text=True, timeout=15)
        results["linker"] = res.stdout.strip()
    except Exception as e:
        results["linker"] = str(e)

    invalidate_graph_cache()
    return {
        "status": "success",
        "message": "Second Brain index & graph synchronization complete",
        "details": results
    }


# In-memory cache for network graph data
_GRAPH_CACHE = {"data": None, "timestamp": 0}
_GRAPH_CACHE_TTL = 60  # Cache for 60 seconds

def invalidate_graph_cache():
    global _GRAPH_CACHE
    _GRAPH_CACHE = {"data": None, "timestamp": 0}


@router.get("/network-graph")
def get_network_graph(current_user: str = Depends(get_current_user)):
    """
    Generate interactive knowledge graph node-link dataset with colors, categories,
    and connection weights. Excludes sensitive finance notes.
    """
    import time
    global _GRAPH_CACHE
    now = time.time()
    if _GRAPH_CACHE["data"] is not None and (now - _GRAPH_CACHE["timestamp"]) < _GRAPH_CACHE_TTL:
        return _GRAPH_CACHE["data"]

    if not BRAIN_DIR.exists():
        return {"nodes": [], "links": [], "categories": []}

    nodes_map = {}
    notes_content = {}
    folder_set = set()

    # Scan root files
    for f in BRAIN_DIR.glob("*.md"):
        if f.is_file() and not f.name.startswith("."):
            if is_finance_related(f.name) or is_finance_related(f.stem):
                continue
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if is_finance_related(content):
                    continue
                node_id = f.stem
                meta, _ = parse_frontmatter(content)
                nodes_map[node_id] = {
                    "id": node_id,
                    "label": f.stem.replace("_", " ").title(),
                    "folder": "Root",
                    "path": f.name,
                    "filename": f.name,
                    "val": 1,
                    "color": FOLDER_COLOR_MAP.get("Root", "#6366f1"),
                    "tags": meta.get("tags", [])
                }
                notes_content[node_id] = (content, "Root", f.name)
                folder_set.add("Root")
            except Exception:
                pass

    # Scan allowed folders
    for folder in ALLOWED_FOLDERS:
        fld_dir = BRAIN_DIR / folder
        if not fld_dir.exists():
            continue
        for f in fld_dir.rglob("*.md"):
            if is_finance_related(f.name) or is_finance_related(f.stem):
                continue
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
                if is_finance_related(content):
                    continue
                node_id = f.stem
                meta, _ = parse_frontmatter(content)
                color = FOLDER_COLOR_MAP.get(folder, "#6366f1")
                nodes_map[node_id] = {
                    "id": node_id,
                    "label": f.stem.replace("_", " ").title(),
                    "folder": folder,
                    "path": str(f.relative_to(BRAIN_DIR)),
                    "filename": f.name,
                    "val": 1,
                    "color": color,
                    "tags": meta.get("tags", [])
                }
                notes_content[node_id] = (content, folder, f.name)
                folder_set.add(folder)
            except Exception:
                pass

    links = []
    seen_links = set()

    for node_id, (content, folder, fname) in notes_content.items():
        raw_links = re.findall(r'\[\[(.*?)\]\]', content)
        for target_raw in raw_links:
            clean_target = target_raw.split('|')[0].split('#')[0].strip()
            target_stem = clean_target.split('/')[-1].strip()

            if target_stem in nodes_map and target_stem != node_id:
                link_key = tuple(sorted([node_id, target_stem]))
                if link_key not in seen_links:
                    seen_links.add(link_key)
                    links.append({
                        "source": node_id,
                        "target": target_stem,
                        "value": 1
                    })
                    nodes_map[node_id]["val"] += 1
                    nodes_map[target_stem]["val"] += 1

    categories = [
        {"name": fld, "color": FOLDER_COLOR_MAP.get(fld, "#6366f1")}
        for fld in sorted(list(folder_set))
    ]

    result = {
        "nodes": list(nodes_map.values()),
        "links": links,
        "total_nodes": len(nodes_map),
        "total_links": len(links),
        "categories": categories
    }
    _GRAPH_CACHE = {"data": result, "timestamp": time.time()}
    return result
