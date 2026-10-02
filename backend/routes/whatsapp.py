import json
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, JSONResponse

from backend.security import get_current_user

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp Secretary"])

WA_SECRETARY_URL = "http://127.0.0.1:8100"
INBOX_MD_PATH = Path("/home/arusuka/second-brain/Entities/secretary_inbox.md")

RECRUITER_KEYWORDS = [
    "hr ", "hrd", "interview", "recruiter", "pt ", "beone", "lowongan", "pelamar",
    "golang developer", "php golang", "outsourcing", "klien bank", "form registrasi",
    "proses lamaran", "tahapan selanjutnya", "idstar", "entrust"
]


def parse_secretary_inbox(limit: int = 50) -> List[Dict[str, Any]]:
    """Parse logged messages from Obsidian Second Brain secretary inbox markdown table."""
    if not INBOX_MD_PATH.exists():
        return []
    
    messages = []
    try:
        lines = INBOX_MD_PATH.read_text(encoding="utf-8").splitlines()
        for line in lines:
            line = line.strip()
            if not line.startswith("|") or line.startswith("| Waktu") or line.startswith("| :---"):
                continue
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 5:
                waktu, pengirim, phone, kategori, ringkasan = parts[0], parts[1], parts[2], parts[3], parts[4]
                clean_sender = pengirim.replace("**", "").strip()
                clean_phone = phone.replace("`", "").strip()
                
                is_recruiter = any(k in ringkasan.lower() or k in clean_sender.lower() for k in RECRUITER_KEYWORDS)
                is_pokemon = any(k in ringkasan.lower() or k in kategori.lower() for k in ["pokemon", "pkhex", "pk9", "pk8", "shiny"])
                
                if is_recruiter:
                    cat_label = "Career & Recruiter"
                elif is_pokemon:
                    cat_label = "Pokemon Order"
                else:
                    cat_label = "General Message"
                
                messages.append({
                    "id": len(messages) + 1,
                    "time": waktu,
                    "sender": clean_sender,
                    "phone": clean_phone,
                    "category": cat_label,
                    "raw_category": kategori,
                    "summary": ringkasan,
                    "is_recruiter": is_recruiter,
                    "is_pokemon": is_pokemon
                })
        messages.reverse()
        return messages[:limit]
    except Exception as e:
        return []


@router.get("/status")
def get_whatsapp_status(current_user: str = Depends(get_current_user)):
    """Fetch live status of WhatsApp Secretary daemon."""
    try:
        req = urllib.request.Request(f"{WA_SECRETARY_URL}/", headers={"User-Agent": "ArusukaDashboard/1.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode('utf-8'))
                return {
                    "service": "active",
                    "status": data.get("status", "unknown"),
                    "connected_user": data.get("user"),
                    "has_qr": data.get("has_qr", False),
                    "cached_messages": data.get("cached_messages", 0),
                    "cooldown": data.get("cooldown", "1_day (Reset 00:00 WIB)"),
                    "pause_mins": data.get("pause_mins", 15),
                    "anti_delete_enabled": data.get("anti_delete_enabled", True),
                    "anti_view_once_enabled": data.get("anti_view_once_enabled", True),
                    "server_port": 8100
                }
            return {
                "service": "error",
                "status": f"http_error_{resp.status}",
                "connected_user": None,
                "has_qr": False
            }
    except Exception as e:
        return {
            "service": "offline",
            "status": "disconnected",
            "connected_user": None,
            "has_qr": False,
            "error": str(e)
        }


@router.get("/overview")
def get_whatsapp_overview(current_user: str = Depends(get_current_user)):
    """Fetch comprehensive secretary overview, daemon telemetry, and recent message radar."""
    status_data = get_whatsapp_status(current_user=current_user)
    messages = parse_secretary_inbox(limit=30)
    
    recruiter_count = sum(1 for m in messages if m.get("is_recruiter"))
    pokemon_count = sum(1 for m in messages if m.get("is_pokemon"))
    general_count = len(messages) - recruiter_count - pokemon_count
    
    return {
        "daemon": status_data,
        "stats": {
            "total_logged": len(messages),
            "recruiters_detected": recruiter_count,
            "pokemon_orders": pokemon_count,
            "general_messages": general_count,
            "anti_delete_active": status_data.get("anti_delete_enabled", True),
            "cooldown_policy": "1 Reply / Contact / Day (Reset 00:00 WIB)"
        },
        "messages": messages,
        "assistant": {
            "name": "Arusuka",
            "role": "Executive Personal Assistant to Mas Fahmi",
            "auto_reply_strategy": "Warm, polite, and professional notification when Mas Fahmi is offline",
            "manual_pause_window": "15 minutes automatic silence when Mas Fahmi chats manually",
            "vip_alert_channel": "Telegram VIP Alert Forwarding"
        }
    }


@router.get("/inbox")
def get_whatsapp_inbox(limit: int = 50, current_user: str = Depends(get_current_user)):
    """Fetch structured incoming messages recorded by the secretary."""
    return parse_secretary_inbox(limit=limit)


@router.get("/qr")
def get_whatsapp_qr(current_user: str = Depends(get_current_user)):
    """Proxy live QR code image from WhatsApp Secretary or return connected status."""
    try:
        req = urllib.request.Request(f"{WA_SECRETARY_URL}/qr", headers={"User-Agent": "ArusukaDashboard/1.0"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            content_type = resp.headers.get("Content-Type", "")
            content = resp.read()
            if "image" in content_type:
                return Response(
                    content=content,
                    media_type="image/png",
                    headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
                )
            try:
                data = json.loads(content.decode('utf-8'))
                return JSONResponse(status_code=resp.status, content=data)
            except Exception:
                return JSONResponse(status_code=200, content={"status": "connected", "message": "WhatsApp is already connected."})
    except urllib.error.HTTPError as e:
        # If 404, it means WhatsApp is already connected or no QR active
        return JSONResponse(
            status_code=e.code,
            content={"status": "already_connected", "message": "WhatsApp is already connected. No QR code needed."}
        )
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "offline", "message": f"WhatsApp Secretary daemon offline: {str(e)}"}
        )

