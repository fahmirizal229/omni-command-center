"""
Storage Vault & Cloud Drive 20TB Aggregator API router (/api/storage/*).
Supports Dual-Vault Architecture:
1. Local NVMe SSD Vault (/home/arusuka/storage_vault) with sub-millisecond local I/O.
2. Encrypted Cloud Vault (20TB 4x Google Drive Aggregated Cluster via Rclone AES-256 Crypt).
"""

import os
import shutil
import time
import json
import mimetypes
import urllib.parse
import subprocess
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse

from backend.config import STORAGE_VAULT_DIR, is_finance_related
from backend.security import get_current_user
from backend.websocket import trigger_ws_event

from concurrent.futures import ThreadPoolExecutor

router = APIRouter(prefix="/api/storage", tags=["Storage Vault"])

RCLONE_CONFIG = os.environ.get("RCLONE_CONFIG_PATH", "/home/arusuka3/.config/rclone/rclone.conf")
REMOTE_VAULT = "vault_secure:"
REMOTE_POOL = "drive_pool:"

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.heic', '.avif'}
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv'}
DOC_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv', '.json', '.py', '.js', '.sh'}
ARCHIVE_EXTENSIONS = {'.zip', '.tar', '.gz', '.bz2', '.7z', '.rar'}

import threading

DEFAULT_CLOUD_STATS = {
    "cluster": {
        "vault_type": "cloud",
        "name": "4x Google Drive 20TB Cluster",
        "encryption": "AES-256 (Zero-Knowledge Crypt)",
        "policy": "Most Free Space (MFS)",
        "total_bytes": 21990232555520,
        "total_formatted": "20.0 TB",
        "used_bytes": 1756048320,
        "used_formatted": "1.6 GB",
        "free_bytes": 21974371241785,
        "free_formatted": "20.0 TB",
        "percent": 0.1,
        "drives": [
            {"id": "gdrive1", "name": "Drive 1", "total_bytes": 5497558138880, "total_formatted": "5.0 TB", "used_bytes": 439012080, "used_formatted": "439 MB", "free_bytes": 5497119126800, "free_formatted": "5.0 TB", "percent": 0.1, "status": "online"},
            {"id": "gdrive2", "name": "Drive 2", "total_bytes": 5497558138880, "total_formatted": "5.0 TB", "used_bytes": 439012080, "used_formatted": "439 MB", "free_bytes": 5497119126800, "free_formatted": "5.0 TB", "percent": 0.1, "status": "online"},
            {"id": "gdrive3", "name": "Drive 3", "total_bytes": 5497558138880, "total_formatted": "5.0 TB", "used_bytes": 439012080, "used_formatted": "439 MB", "free_bytes": 5497119126800, "free_formatted": "5.0 TB", "percent": 0.1, "status": "online"},
            {"id": "gdrive4", "name": "Drive 4", "total_bytes": 5497558138880, "total_formatted": "5.0 TB", "used_bytes": 439012080, "used_formatted": "439 MB", "free_bytes": 5497119126800, "free_formatted": "5.0 TB", "percent": 0.1, "status": "online"},
        ]
    },
    "disk": {
        "vault_used_bytes": 1756048320,
        "vault_used_formatted": "1.6 GB",
        "disk_total_bytes": 21990232555520,
        "disk_total_gb": 20480.0,
        "disk_used_bytes": 1756048320,
        "disk_used_gb": 1.6,
        "disk_free_bytes": 21974371241785,
        "disk_free_gb": 20464.0,
        "disk_percent": 0.1,
    }
}

# =========================================================================
# HIGH-SPEED IN-MEMORY CACHE (Eliminates Google OAuth Latency for Cloud)
# =========================================================================
_cluster_stats_cache = {
    "timestamp": time.time(),
    "data": DEFAULT_CLOUD_STATS,
    "updating": False
}
_dir_cache = {}  # { path: {"timestamp": float, "items": list, "total_files": int, "total_photos": int} }


def invalidate_storage_cache(path: str = None):
    """Invalidate directory cache on upload, mkdir, rename, or delete."""
    global _dir_cache
    if path is not None:
        clean = (path or "").strip().strip("/")
        _dir_cache.pop(clean, None)
        parent = str(Path(clean).parent).strip(".")
        if parent:
            _dir_cache.pop(parent, None)
        _dir_cache.pop("", None)  # invalidate root as well
    else:
        _dir_cache.clear()


def run_rclone(args: list) -> subprocess.CompletedProcess:
    """Run an rclone command with explicit config file."""
    cmd = ["rclone", "--config", RCLONE_CONFIG] + args
    return subprocess.run(cmd, capture_output=True, text=True, timeout=60)


def format_bytes(size: int) -> str:
    """Format bytes to human readable string (KB, MB, GB, TB)."""
    size_float = float(size)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_float < 1024.0:
            return f"{size_float:.1f} {unit}" if unit != 'B' else f"{int(size_float)} B"
        size_float /= 1024.0
    return f"{size_float:.1f} PB"


def resolve_local_path(rel_path: str) -> Path:
    """Safely resolve path within STORAGE_VAULT_DIR preventing path traversal."""
    clean = (rel_path or "").strip().strip("/")
    target = (STORAGE_VAULT_DIR / clean).resolve()
    if not (target == STORAGE_VAULT_DIR or STORAGE_VAULT_DIR in target.parents):
        raise HTTPException(status_code=400, detail="Invalid path traversal detected.")
    return target


def get_local_vault_stats() -> dict:
    """Get local NVMe SSD storage capacity and usage stats."""
    try:
        usage = shutil.disk_usage(STORAGE_VAULT_DIR)
        total_b = usage.total
        used_b = usage.used
        free_b = usage.free
    except Exception:
        total_b = 512 * (1024**3)
        used_b = 64 * (1024**3)
        free_b = total_b - used_b

    percent = round((used_b / total_b) * 100, 1) if total_b else 0

    return {
        "cluster": {
            "vault_type": "local",
            "name": "Local NVMe SSD Vault",
            "encryption": "Local Filesystem (Direct I/O)",
            "policy": "Ultra-Fast NVMe SSD",
            "total_bytes": total_b,
            "total_formatted": format_bytes(total_b),
            "used_bytes": used_b,
            "used_formatted": format_bytes(used_b),
            "free_bytes": free_b,
            "free_formatted": format_bytes(free_b),
            "percent": percent,
            "drives": [
                {
                    "id": "nvme_local",
                    "name": "Local NVMe SSD (/home/arusuka/storage_vault)",
                    "total_bytes": total_b,
                    "total_formatted": format_bytes(total_b),
                    "used_bytes": used_b,
                    "used_formatted": format_bytes(used_b),
                    "free_bytes": free_b,
                    "free_formatted": format_bytes(free_b),
                    "percent": percent,
                    "status": "online"
                }
            ]
        },
        "disk": {
            "vault_used_bytes": used_b,
            "vault_used_formatted": format_bytes(used_b),
            "disk_total_bytes": total_b,
            "disk_total_gb": round(total_b / (1024**3), 1),
            "disk_used_bytes": used_b,
            "disk_used_gb": round(used_b / (1024**3), 1),
            "disk_free_bytes": free_b,
            "disk_free_gb": round(free_b / (1024**3), 1),
            "disk_percent": percent,
        }
    }


def _background_refresh_cloud_stats():
    """Background worker to fetch latest Google Drive quota without blocking API requests."""
    global _cluster_stats_cache
    if _cluster_stats_cache.get("updating", False):
        return
    _cluster_stats_cache["updating"] = True

    def fetch_pool():
        pool_total = 21990232555520
        pool_used = 1756048320
        try:
            p = run_rclone(["about", REMOTE_POOL, "--json"])
            if p.returncode == 0 and p.stdout.strip():
                data = json.loads(p.stdout)
                pool_total = data.get("total", pool_total)
                pool_used = data.get("used", pool_used)
        except Exception as e:
            print(f"Pool stats fetch error: {e}")
        return pool_total, pool_used

    def fetch_drive(d_name, d_label):
        d_total = 5497558138880
        d_used = 439012080
        d_status = "online"
        try:
            p = run_rclone(["about", f"{d_name}:", "--json"])
            if p.returncode == 0 and p.stdout.strip():
                dj = json.loads(p.stdout)
                d_total = dj.get("total", d_total)
                d_used = dj.get("used", d_used)
            else:
                d_status = "offline"
        except Exception:
            d_status = "error"

        d_free = d_total - d_used
        return {
            "id": d_name,
            "name": d_label,
            "total_bytes": d_total,
            "total_formatted": format_bytes(d_total),
            "used_bytes": d_used,
            "used_formatted": format_bytes(d_used),
            "free_bytes": d_free,
            "free_formatted": format_bytes(d_free),
            "percent": round((d_used / d_total) * 100, 1) if d_total else 0,
            "status": d_status
        }

    targets = [
        ("gdrive1", "Drive 1"),
        ("gdrive2", "Drive 2"),
        ("gdrive3", "Drive 3"),
        ("gdrive4", "Drive 4"),
    ]

    try:
        with ThreadPoolExecutor(max_workers=5) as executor:
            pool_future = executor.submit(fetch_pool)
            drive_futures = [executor.submit(fetch_drive, name, label) for name, label in targets]
            
            pool_total, pool_used = pool_future.result(timeout=20)
            drives_status = [f.result(timeout=20) for f in drive_futures]

        pool_free = pool_total - pool_used
        percent_used = round((pool_used / pool_total) * 100, 1) if pool_total else 0

        _cluster_stats_cache["data"] = {
            "cluster": {
                "vault_type": "cloud",
                "name": "4x Google Drive 20TB Cluster",
                "encryption": "AES-256 (Zero-Knowledge Crypt)",
                "policy": "Most Free Space (MFS)",
                "total_bytes": pool_total,
                "total_formatted": format_bytes(pool_total),
                "used_bytes": pool_used,
                "used_formatted": format_bytes(pool_used),
                "free_bytes": pool_free,
                "free_formatted": format_bytes(pool_free),
                "percent": percent_used,
                "drives": drives_status
            },
            "disk": {
                "vault_used_bytes": pool_used,
                "vault_used_formatted": format_bytes(pool_used),
                "disk_total_bytes": pool_total,
                "disk_total_gb": round(pool_total / (1024**3), 1),
                "disk_used_bytes": pool_used,
                "disk_used_gb": round(pool_used / (1024**3), 1),
                "disk_free_bytes": pool_free,
                "disk_free_gb": round(pool_free / (1024**3), 1),
                "disk_percent": percent_used,
            }
        }
        _cluster_stats_cache["timestamp"] = time.time()
    except Exception as e:
        print(f"Background refresh cloud stats failed: {e}")
    finally:
        _cluster_stats_cache["updating"] = False


def get_cloud_cluster_stats(force_refresh: bool = False) -> dict:
    """Instantly return cached 4-Drive cluster statistics and refresh in background if stale."""
    global _cluster_stats_cache
    now = time.time()
    
    # If stale (>10 min) or forced, trigger background refresh thread
    if force_refresh or (now - _cluster_stats_cache["timestamp"] > 600):
        if not _cluster_stats_cache.get("updating", False):
            threading.Thread(target=_background_refresh_cloud_stats, daemon=True).start()

    return _cluster_stats_cache.get("data") or DEFAULT_CLOUD_STATS


def _prewarm_cloud_cache():
    """Pre-warm cloud stats and root directory listing on startup."""
    try:
        get_cloud_cluster_stats(force_refresh=True)
        # Also pre-warm root files
        proc = run_rclone(["lsjson", "--fast-list", REMOTE_VAULT])
        if proc.returncode == 0 and proc.stdout.strip():
            raw_items = json.loads(proc.stdout)
            items = []
            total_files = 0
            total_photos = 0
            for entry in raw_items:
                is_dir = entry.get("IsDir", False)
                name = entry.get("Name", "")
                if is_finance_related(name):
                    continue
                ext = Path(name).suffix.lower() if not is_dir else ""
                size_bytes = entry.get("Size", 0) if not is_dir else 0
                is_img = ext in IMAGE_EXTENSIONS
                is_vid = ext in VIDEO_EXTENSIONS
                if not is_dir:
                    total_files += 1
                    if is_img:
                        total_photos += 1
                items.append({
                    "name": name,
                    "path": name,
                    "is_dir": is_dir,
                    "size": size_bytes,
                    "size_formatted": format_bytes(size_bytes) if not is_dir else "--",
                    "mtime": "--",
                    "mtime_ts": 0,
                    "ext": ext.replace(".", ""),
                    "is_image": is_img,
                    "is_video": is_vid,
                    "is_doc": ext in DOC_EXTENSIONS,
                    "is_archive": ext in ARCHIVE_EXTENSIONS,
                    "preview_url": f"/api/storage/preview?path={urllib.parse.quote(name)}&vault=cloud" if (is_img or is_vid or ext in DOC_EXTENSIONS) else None,
                    "download_url": f"/api/storage/download?path={urllib.parse.quote(name)}&vault=cloud" if not is_dir else None,
                })
            _dir_cache[""] = {
                "timestamp": time.time(),
                "items": items,
                "total_files": total_files,
                "total_photos": total_photos,
            }
    except Exception as e:
        print(f"Cloud prewarm error: {e}")

# Spawn background pre-warmer
threading.Thread(target=_prewarm_cloud_cache, daemon=True).start()


class CreateFolderRequest(BaseModel):
    path: str = ""
    folder_name: str
    vault: str = "local"


class RenameItemRequest(BaseModel):
    path: str = ""
    old_name: str
    new_name: str
    vault: str = "local"


class DeleteItemRequest(BaseModel):
    path: str
    vault: str = "local"


@router.get("/files")
def list_storage_files(
    path: str = Query(default="", description="Subpath relative to storage vault"),
    vault: str = Query(default="local", description="Vault mode: 'local' | 'cloud'"),
    refresh: bool = Query(default=False, description="Force refresh cache"),
    current_user: str = Depends(get_current_user)
):
    """List files, folders, breadcrumbs, and stats from either Local NVMe SSD Vault or Cloud 20TB Vault."""
    clean_path = (path or "").strip().strip("/")
    vault_mode = "cloud" if vault == "cloud" else "local"
    root_title = "Local NVMe Vault" if vault_mode == "local" else "Cloud 20TB Vault"

    # 1. Breadcrumbs
    parts = clean_path.split("/") if clean_path else []
    breadcrumbs = [{"name": root_title, "path": ""}]
    acc = ""
    for part in parts:
        acc = f"{acc}/{part}" if acc else part
        breadcrumbs.append({"name": part, "path": acc})

    items = []
    total_files_count = 0
    total_photos_count = 0

    if vault_mode == "local":
        # Direct high-speed local filesystem
        target_dir = resolve_local_path(clean_path)
        if not target_dir.exists():
            target_dir.mkdir(parents=True, exist_ok=True)

        try:
            for entry in target_dir.iterdir():
                if is_finance_related(entry.name):
                    continue

                is_dir = entry.is_dir()
                name = entry.name
                ext = entry.suffix.lower() if not is_dir else ""
                
                try:
                    stat = entry.stat()
                    size_bytes = stat.st_size if not is_dir else 0
                    mtime_ts = stat.st_mtime
                    dt = datetime.fromtimestamp(mtime_ts)
                    formatted_mtime = dt.strftime("%Y-%m-%d %H:%M")
                except Exception:
                    size_bytes = 0
                    mtime_ts = 0
                    formatted_mtime = "--"

                is_img = ext in IMAGE_EXTENSIONS
                is_vid = ext in VIDEO_EXTENSIONS

                if not is_dir:
                    total_files_count += 1
                    if is_img:
                        total_photos_count += 1

                item_rel_path = f"{clean_path}/{name}".strip("/")

                items.append({
                    "name": name,
                    "path": item_rel_path,
                    "is_dir": is_dir,
                    "size": size_bytes,
                    "size_formatted": format_bytes(size_bytes) if not is_dir else "--",
                    "mtime": formatted_mtime,
                    "mtime_ts": mtime_ts,
                    "ext": ext.replace(".", ""),
                    "is_image": is_img,
                    "is_video": is_vid,
                    "is_doc": ext in DOC_EXTENSIONS,
                    "is_archive": ext in ARCHIVE_EXTENSIONS,
                    "preview_url": f"/api/storage/preview?path={urllib.parse.quote(item_rel_path)}&vault=local" if (is_img or is_vid or ext in DOC_EXTENSIONS) else None,
                    "download_url": f"/api/storage/download?path={urllib.parse.quote(item_rel_path)}&vault=local" if not is_dir else None,
                })
        except Exception as e:
            print(f"Error listing local storage: {e}")

        items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
        stats = get_local_vault_stats()

    else:
        # Cloud 20TB Encrypted Vault
        remote_target = f"{REMOTE_VAULT}{clean_path}" if clean_path else REMOTE_VAULT
        now = time.time()

        if not refresh and clean_path in _dir_cache and (now - _dir_cache[clean_path]["timestamp"] < 600):
            cached = _dir_cache[clean_path]
            items = cached["items"]
            total_files_count = cached["total_files"]
            total_photos_count = cached["total_photos"]
        else:
            try:
                proc = run_rclone(["lsjson", "--fast-list", "--drive-pacer-min-sleep", "10ms", remote_target])
                if proc.returncode == 0 and proc.stdout.strip():
                    raw_items = json.loads(proc.stdout)
                    for entry in raw_items:
                        is_dir = entry.get("IsDir", False)
                        name = entry.get("Name", "")
                        if is_finance_related(name):
                            continue

                        ext = Path(name).suffix.lower() if not is_dir else ""
                        size_bytes = entry.get("Size", 0) if not is_dir else 0
                        is_img = ext in IMAGE_EXTENSIONS
                        is_vid = ext in VIDEO_EXTENSIONS

                        if not is_dir:
                            total_files_count += 1
                            if is_img:
                                total_photos_count += 1

                        item_rel_path = f"{clean_path}/{name}".strip("/")

                        mod_time_str = entry.get("ModTime", "")
                        formatted_mtime = "--"
                        mtime_ts = 0
                        if mod_time_str:
                            try:
                                dt = datetime.fromisoformat(mod_time_str.replace("Z", "+00:00"))
                                formatted_mtime = dt.strftime("%Y-%m-%d %H:%M")
                                mtime_ts = dt.timestamp()
                            except Exception:
                                formatted_mtime = mod_time_str[:16]

                        items.append({
                            "name": name,
                            "path": item_rel_path,
                            "is_dir": is_dir,
                            "size": size_bytes,
                            "size_formatted": format_bytes(size_bytes) if not is_dir else "--",
                            "mtime": formatted_mtime,
                            "mtime_ts": mtime_ts,
                            "ext": ext.replace(".", ""),
                            "is_image": is_img,
                            "is_video": is_vid,
                            "is_doc": ext in DOC_EXTENSIONS,
                            "is_archive": ext in ARCHIVE_EXTENSIONS,
                            "preview_url": f"/api/storage/preview?path={urllib.parse.quote(item_rel_path)}&vault=cloud" if (is_img or is_vid or ext in DOC_EXTENSIONS) else None,
                            "download_url": f"/api/storage/download?path={urllib.parse.quote(item_rel_path)}&vault=cloud" if not is_dir else None,
                        })
            except Exception as e:
                print(f"Error reading rclone files: {e}")

            items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
            _dir_cache[clean_path] = {
                "timestamp": now,
                "items": items,
                "total_files": total_files_count,
                "total_photos": total_photos_count,
            }

        stats = get_cloud_cluster_stats(force_refresh=refresh)

    return {
        "vault": vault_mode,
        "current_path": clean_path,
        "breadcrumbs": breadcrumbs,
        "items": items,
        "total_items": len(items),
        "total_files": total_files_count,
        "total_photos": total_photos_count,
        "cluster": stats["cluster"],
        "disk": stats["disk"]
    }


@router.post("/upload")
async def upload_files(
    path: str = Form(default=""),
    vault: str = Form(default="local"),
    files: List[UploadFile] = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload one or multiple files to either Local NVMe SSD Vault or Cloud 20TB Vault."""
    clean_path = (path or "").strip().strip("/")
    vault_mode = "cloud" if vault == "cloud" else "local"
    uploaded_names = []

    if vault_mode == "local":
        target_dir = resolve_local_path(clean_path)
        target_dir.mkdir(parents=True, exist_ok=True)

        for file in files:
            safe_filename = Path(file.filename or f"upload_{int(time.time())}").name
            dest_file = target_dir / safe_filename
            with open(dest_file, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            uploaded_names.append(safe_filename)

        msg = f"{len(uploaded_names)} file berhasil disimpan di Local NVMe SSD."
    else:
        target_remote_dir = f"{REMOTE_VAULT}{clean_path}" if clean_path else REMOTE_VAULT
        tmp_dir = Path("/tmp/dashboard_uploads")
        tmp_dir.mkdir(parents=True, exist_ok=True)

        for file in files:
            safe_filename = Path(file.filename or f"upload_{int(time.time())}").name
            tmp_file = tmp_dir / f"{int(time.time() * 1000)}_{safe_filename}"
            try:
                with open(tmp_file, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                dest_target = f"{target_remote_dir}/{safe_filename}" if clean_path else f"{REMOTE_VAULT}{safe_filename}"
                proc = run_rclone(["copyto", str(tmp_file), dest_target])
                if proc.returncode == 0:
                    uploaded_names.append(safe_filename)
                else:
                    print(f"Failed to upload {safe_filename}: {proc.stderr}")
            finally:
                if tmp_file.exists():
                    tmp_file.unlink()

        invalidate_storage_cache(clean_path)
        msg = f"{len(uploaded_names)} file berhasil diunggah dan dienkripsi ke Cloud 20TB Vault."

    trigger_ws_event("storage_updated", {"path": path, "vault": vault_mode})

    return {
        "status": "success",
        "message": msg,
        "uploaded_files": uploaded_names
    }


@router.post("/mkdir")
def create_folder(
    payload: CreateFolderRequest,
    current_user: str = Depends(get_current_user)
):
    """Create a new folder inside local or cloud storage vault."""
    clean_path = (payload.path or "").strip().strip("/")
    folder_name = Path(payload.folder_name.strip()).name
    if not folder_name or folder_name in (".", ".."):
        raise HTTPException(status_code=400, detail="Nama folder tidak valid.")

    vault_mode = "cloud" if payload.vault == "cloud" else "local"

    if vault_mode == "local":
        target_dir = resolve_local_path(clean_path) / folder_name
        target_dir.mkdir(parents=True, exist_ok=True)
    else:
        folder_target = f"{REMOTE_VAULT}{clean_path}/{folder_name}".rstrip("/") if clean_path else f"{REMOTE_VAULT}{folder_name}"
        proc = run_rclone(["mkdir", folder_target])
        if proc.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Gagal membuat folder di Cloud: {proc.stderr}")
        invalidate_storage_cache(clean_path)

    trigger_ws_event("storage_updated", {"path": payload.path, "vault": vault_mode})
    return {"status": "success", "message": f"Folder '{folder_name}' berhasil dibuat."}


@router.post("/rename")
def rename_item(
    payload: RenameItemRequest,
    current_user: str = Depends(get_current_user)
):
    """Rename a file or folder inside the storage vault."""
    clean_path = (payload.path or "").strip().strip("/")
    old_clean = Path(payload.old_name.strip()).name
    new_clean = Path(payload.new_name.strip()).name

    if not old_clean or not new_clean or new_clean in (".", ".."):
        raise HTTPException(status_code=400, detail="Nama berkas tidak valid.")

    vault_mode = "cloud" if payload.vault == "cloud" else "local"

    if vault_mode == "local":
        base_dir = resolve_local_path(clean_path)
        src = base_dir / old_clean
        dst = base_dir / new_clean
        if not src.exists():
            raise HTTPException(status_code=404, detail="File atau folder lama tidak ditemukan.")
        src.rename(dst)
    else:
        src = f"{REMOTE_VAULT}{clean_path}/{old_clean}".rstrip("/") if clean_path else f"{REMOTE_VAULT}{old_clean}"
        dst = f"{REMOTE_VAULT}{clean_path}/{new_clean}".rstrip("/") if clean_path else f"{REMOTE_VAULT}{new_clean}"
        proc = run_rclone(["moveto", src, dst])
        if proc.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Gagal mengubah nama di Cloud: {proc.stderr}")
        invalidate_storage_cache(clean_path)

    trigger_ws_event("storage_updated", {"path": payload.path, "vault": vault_mode})
    return {"status": "success", "message": f"Berhasil diubah menjadi '{new_clean}'."}


@router.delete("/delete")
def delete_item(
    payload: DeleteItemRequest,
    current_user: str = Depends(get_current_user)
):
    """Delete a file or directory from local or cloud storage vault."""
    clean_path = (payload.path or "").strip().strip("/")
    if not clean_path:
        raise HTTPException(status_code=400, detail="Folder utama Vault tidak boleh dihapus.")

    vault_mode = "cloud" if payload.vault == "cloud" else "local"

    if vault_mode == "local":
        target = resolve_local_path(clean_path)
        if target == STORAGE_VAULT_DIR:
            raise HTTPException(status_code=400, detail="Root vault tidak boleh dihapus.")
        if target.is_dir():
            shutil.rmtree(target)
        elif target.exists():
            target.unlink()
        else:
            raise HTTPException(status_code=404, detail="Item tidak ditemukan.")
    else:
        target = f"{REMOTE_VAULT}{clean_path}"
        proc = run_rclone(["deletefile", target])
        if proc.returncode != 0:
            proc = run_rclone(["purge", target])
            if proc.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Gagal menghapus item dari Cloud: {proc.stderr}")
        invalidate_storage_cache(clean_path)

    trigger_ws_event("storage_updated", {"path": str(Path(clean_path).parent), "vault": vault_mode})
    return {"status": "success", "message": "Berhasil dihapus."}


@router.get("/preview")
def preview_file(
    path: str = Query(..., description="Subpath to media file"),
    vault: str = Query(default="local", description="Vault mode: 'local' | 'cloud'"),
    current_user: str = Depends(get_current_user)
):
    """Preview / stream media file (images, videos, PDFs, code)."""
    clean_path = (path or "").strip().strip("/")
    if not clean_path:
        raise HTTPException(status_code=400, detail="Path file diperlukan.")

    mime, _ = mimetypes.guess_type(clean_path)
    mime = mime or "application/octet-stream"
    file_name = Path(clean_path).name

    vault_mode = "cloud" if vault == "cloud" else "local"

    if vault_mode == "local":
        target = resolve_local_path(clean_path)
        if not target.exists() or target.is_dir():
            raise HTTPException(status_code=404, detail="File tidak ditemukan.")
        return FileResponse(str(target), media_type=mime, filename=file_name)

    target = f"{REMOTE_VAULT}{clean_path}"
    proc = subprocess.Popen(
        ["rclone", "--config", RCLONE_CONFIG, "cat", target],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=64 * 1024
    )

    def iter_file():
        try:
            while True:
                chunk = proc.stdout.read(64 * 1024)
                if not chunk:
                    break
                yield chunk
        finally:
            proc.stdout.close()
            proc.kill()

    headers = {
        "Content-Disposition": f'inline; filename="{urllib.parse.quote(file_name)}"',
        "Cache-Control": "private, max-age=3600"
    }

    return StreamingResponse(iter_file(), media_type=mime, headers=headers)


@router.get("/download")
def download_file(
    path: str = Query(..., description="Subpath to file"),
    vault: str = Query(default="local", description="Vault mode: 'local' | 'cloud'"),
    current_user: str = Depends(get_current_user)
):
    """Download a specific file from either local or cloud vault."""
    clean_path = (path or "").strip().strip("/")
    if not clean_path:
        raise HTTPException(status_code=400, detail="Path file diperlukan.")

    file_name = Path(clean_path).name
    vault_mode = "cloud" if vault == "cloud" else "local"

    if vault_mode == "local":
        target = resolve_local_path(clean_path)
        if not target.exists() or target.is_dir():
            raise HTTPException(status_code=404, detail="File tidak ditemukan.")
        return FileResponse(str(target), media_type="application/octet-stream", filename=file_name)

    target = f"{REMOTE_VAULT}{clean_path}"
    proc = subprocess.Popen(
        ["rclone", "--config", RCLONE_CONFIG, "cat", target],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=64 * 1024
    )

    def iter_file():
        try:
            while True:
                chunk = proc.stdout.read(64 * 1024)
                if not chunk:
                    break
                yield chunk
        finally:
            proc.stdout.close()
            proc.kill()

    headers = {
        "Content-Disposition": f'attachment; filename="{urllib.parse.quote(file_name)}"'
    }

    return StreamingResponse(iter_file(), media_type="application/octet-stream", headers=headers)
