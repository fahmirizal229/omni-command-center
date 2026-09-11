"""
Storage Vault & Photo Backup API router (/api/storage/*).
"""

import os
import shutil
import time
import mimetypes
import urllib.parse
from pathlib import Path
from typing import List
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import FileResponse

from backend.config import STORAGE_VAULT_DIR
from backend.security import get_current_user
from backend.websocket import trigger_ws_event

router = APIRouter(prefix="/api/storage", tags=["Storage Vault"])

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico', '.tiff', '.heic', '.avif'}
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.webm', '.mov', '.avi', '.flv'}
DOC_EXTENSIONS = {'.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv'}
ARCHIVE_EXTENSIONS = {'.zip', '.tar', '.gz', '.bz2', '.7z', '.rar'}


def safe_resolve_vault_path(subpath: str) -> Path:
    """Resolve subpath securely inside STORAGE_VAULT_DIR, preventing path traversal."""
    cleaned = (subpath or "").strip().lstrip("/")
    resolved = (STORAGE_VAULT_DIR / cleaned).resolve()
    vault_resolved = STORAGE_VAULT_DIR.resolve()
    if not str(resolved).startswith(str(vault_resolved)):
        raise HTTPException(status_code=403, detail="Akses di luar Storage Vault dilarang!")
    return resolved


def get_dir_size(path: Path) -> int:
    """Calculate total size of directory in bytes recursively."""
    total = 0
    try:
        for entry in os.scandir(path):
            try:
                if entry.is_file(follow_symlinks=False):
                    total += entry.stat(follow_symlinks=False).st_size
                elif entry.is_dir(follow_symlinks=False):
                    total += get_dir_size(Path(entry.path))
            except Exception:
                pass
    except Exception:
        pass
    return total


def format_bytes(size: int) -> str:
    """Format bytes to human readable string (KB, MB, GB, etc.)."""
    size_float = float(size)
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_float < 1024.0:
            return f"{size_float:.1f} {unit}" if unit != 'B' else f"{int(size_float)} B"
        size_float /= 1024.0
    return f"{size_float:.1f} PB"


class CreateFolderRequest(BaseModel):
    path: str = ""
    folder_name: str


class RenameItemRequest(BaseModel):
    path: str = ""
    old_name: str
    new_name: str


class DeleteItemRequest(BaseModel):
    path: str


@router.get("/files")
def list_storage_files(
    path: str = Query(default="", description="Subpath relative to storage vault"),
    current_user: str = Depends(get_current_user)
):
    """List files, folders, breadcrumbs, and disk statistics inside storage vault."""
    target_dir = safe_resolve_vault_path(path)
    if not target_dir.exists() or not target_dir.is_dir():
        raise HTTPException(status_code=404, detail="Direktori tidak ditemukan.")

    vault_resolved = STORAGE_VAULT_DIR.resolve()
    rel_from_vault = target_dir.relative_to(vault_resolved)
    rel_str = str(rel_from_vault).replace("\\", "/")
    if rel_str == ".":
        rel_str = ""

    parts = rel_str.split("/") if rel_str else []
    breadcrumbs = [{"name": "Storage Vault", "path": ""}]
    acc = ""
    for part in parts:
        acc = f"{acc}/{part}" if acc else part
        breadcrumbs.append({"name": part, "path": acc})

    items = []
    total_files_count = 0
    total_photos_count = 0

    try:
        with os.scandir(target_dir) as entries:
            for entry in entries:
                is_dir = entry.is_dir(follow_symlinks=False)
                ext = Path(entry.name).suffix.lower() if not is_dir else ""
                stat = entry.stat(follow_symlinks=False)
                size_bytes = stat.st_size if not is_dir else 0
                is_img = ext in IMAGE_EXTENSIONS
                is_vid = ext in VIDEO_EXTENSIONS
                
                if not is_dir:
                    total_files_count += 1
                    if is_img:
                        total_photos_count += 1

                item_rel_path = f"{rel_str}/{entry.name}".lstrip("/")

                items.append({
                    "name": entry.name,
                    "path": item_rel_path,
                    "is_dir": is_dir,
                    "size": size_bytes,
                    "size_formatted": format_bytes(size_bytes) if not is_dir else "--",
                    "mtime": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "mtime_ts": stat.st_mtime,
                    "ext": ext.replace(".", ""),
                    "is_image": is_img,
                    "is_video": is_vid,
                    "is_doc": ext in DOC_EXTENSIONS,
                    "is_archive": ext in ARCHIVE_EXTENSIONS,
                    "preview_url": f"/api/storage/preview?path={urllib.parse.quote(item_rel_path)}" if (is_img or is_vid) else None,
                    "download_url": f"/api/storage/download?path={urllib.parse.quote(item_rel_path)}" if not is_dir else None,
                })
    except PermissionError:
        raise HTTPException(status_code=403, detail="Izin akses direktori ditolak.")

    # Sort: folders first (alphabetical), then files (alphabetical)
    items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))

    # Disk usage stats
    disk = shutil.disk_usage(str(STORAGE_VAULT_DIR))
    vault_used_bytes = get_dir_size(STORAGE_VAULT_DIR)

    return {
        "current_path": rel_str,
        "breadcrumbs": breadcrumbs,
        "items": items,
        "total_items": len(items),
        "total_files": total_files_count,
        "total_photos": total_photos_count,
        "disk": {
            "vault_used_bytes": vault_used_bytes,
            "vault_used_formatted": format_bytes(vault_used_bytes),
            "disk_total_bytes": disk.total,
            "disk_total_gb": round(disk.total / (1024**3), 1),
            "disk_used_bytes": disk.used,
            "disk_used_gb": round(disk.used / (1024**3), 1),
            "disk_free_bytes": disk.free,
            "disk_free_gb": round(disk.free / (1024**3), 1),
            "disk_percent": round((disk.used / disk.total) * 100, 1),
        }
    }


@router.post("/upload")
async def upload_files(
    path: str = Form(default=""),
    files: List[UploadFile] = File(...),
    current_user: str = Depends(get_current_user)
):
    """Upload one or multiple files/photos into the specified vault folder."""
    target_dir = safe_resolve_vault_path(path)
    if not target_dir.exists() or not target_dir.is_dir():
        raise HTTPException(status_code=404, detail="Direktori tujuan tidak ditemukan.")

    uploaded_names = []
    for file in files:
        safe_filename = Path(file.filename or f"upload_{int(time.time())}").name
        dest_path = target_dir / safe_filename
        
        if dest_path.exists():
            stem = dest_path.stem
            suffix = dest_path.suffix
            counter = 1
            while (target_dir / f"{stem}_{counter}{suffix}").exists():
                counter += 1
            dest_path = target_dir / f"{stem}_{counter}{suffix}"
            safe_filename = dest_path.name

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        uploaded_names.append(safe_filename)

    trigger_ws_event("storage_updated", {"path": path})

    return {
        "status": "success",
        "message": f"{len(uploaded_names)} file berhasil diupload.",
        "uploaded_files": uploaded_names
    }


@router.post("/mkdir")
def create_folder(
    payload: CreateFolderRequest,
    current_user: str = Depends(get_current_user)
):
    """Create a new folder inside the storage vault."""
    parent_dir = safe_resolve_vault_path(payload.path)
    clean_folder_name = Path(payload.folder_name.strip()).name
    if not clean_folder_name or clean_folder_name in (".", ".."):
        raise HTTPException(status_code=400, detail="Nama folder tidak valid.")

    new_dir = parent_dir / clean_folder_name
    if new_dir.exists():
        raise HTTPException(status_code=400, detail="Folder dengan nama tersebut sudah ada.")

    new_dir.mkdir(parents=True, exist_ok=False)
    trigger_ws_event("storage_updated", {"path": payload.path})
    return {"status": "success", "message": f"Folder '{clean_folder_name}' berhasil dibuat."}


@router.post("/rename")
def rename_item(
    payload: RenameItemRequest,
    current_user: str = Depends(get_current_user)
):
    """Rename a file or folder inside the storage vault."""
    parent_dir = safe_resolve_vault_path(payload.path)
    old_target = parent_dir / Path(payload.old_name).name
    new_name_clean = Path(payload.new_name.strip()).name

    if not old_target.exists():
        raise HTTPException(status_code=404, detail="File atau folder yang akan diubah tidak ditemukan.")
    if not new_name_clean or new_name_clean in (".", ".."):
        raise HTTPException(status_code=400, detail="Nama baru tidak valid.")

    new_target = parent_dir / new_name_clean
    if new_target.exists():
        raise HTTPException(status_code=400, detail="File atau folder dengan nama tersebut sudah ada.")

    old_target.rename(new_target)
    trigger_ws_event("storage_updated", {"path": payload.path})
    return {"status": "success", "message": f"Berhasil diubah menjadi '{new_name_clean}'."}


@router.delete("/delete")
def delete_item(
    payload: DeleteItemRequest,
    current_user: str = Depends(get_current_user)
):
    """Delete a file or directory from the storage vault."""
    target = safe_resolve_vault_path(payload.path)
    if target == STORAGE_VAULT_DIR.resolve():
        raise HTTPException(status_code=400, detail="Folder utama Storage Vault tidak boleh dihapus.")

    if not target.exists():
        raise HTTPException(status_code=404, detail="File atau folder tidak ditemukan.")

    if target.is_dir():
        shutil.rmtree(target)
    else:
        target.unlink()

    trigger_ws_event("storage_updated", {"path": str(Path(payload.path).parent)})
    return {"status": "success", "message": "Berhasil dihapus."}


@router.get("/preview")
def preview_file(
    path: str = Query(..., description="Subpath to media file"),
    current_user: str = Depends(get_current_user)
):
    """Preview / stream media file (images, videos, PDFs) with cache headers."""
    target = safe_resolve_vault_path(path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    mime, _ = mimetypes.guess_type(str(target))
    mime = mime or "application/octet-stream"
    
    response = FileResponse(str(target), media_type=mime)
    response.headers["Cache-Control"] = "private, max-age=3600"
    return response


@router.get("/download")
def download_file(
    path: str = Query(..., description="Subpath to file"),
    current_user: str = Depends(get_current_user)
):
    """Download a specific file from the vault."""
    target = safe_resolve_vault_path(path)
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")

    return FileResponse(
        str(target),
        filename=target.name,
        media_type="application/octet-stream"
    )
