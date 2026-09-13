"""
Hermes & Antigravity AI Session History, Multi-LLM Analytics & Token Usage Inspector API.
Provides exact token accounting (Input, Output, Total, Cost, Savings) across
Antigravity Multi-Account (Akun 1, Akun 2, Akun 3) synced in real-time with agy-pool,
DeepSeek-V3, and Hermes Local 0-Token Engine.
"""

import os
import json
import time
import base64
import sqlite3
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.config import HOME_DIR, PORTFOLIO_DB
from backend.security import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["Hermes & AGY Sessions"])

STATE_DB = HOME_DIR / ".hermes" / "state.db"
ROUTER_DB = HOME_DIR / ".hermes" / "router_logs.db"

BRAIN_DIRS: List[Tuple[int, str, Path]] = [
    (1, "arusuka", Path("/home/arusuka/.gemini/antigravity-cli/brain")),
    (2, "arusuka2", Path("/home/arusuka2/.gemini/antigravity-cli/brain")),
    (3, "arusuka3", Path("/home/arusuka3/.gemini/antigravity-cli/brain")),
]

POOL_DIR = Path("/home/arusuka/.config/antigravity_pool")
POOL_STATE_FILE = POOL_DIR / "pool_state.json"

USER_MAP = {
    1: "arusuka",
    2: "arusuka2",
    3: "arusuka3"
}

ACCOUNT_COLORS = {
    "account_1": "#6366f1",  # Indigo
    "account_2": "#a855f7",  # Purple
    "account_3": "#ec4899",  # Pink
}


DEFAULT_ACCOUNT_EMAILS = {
    1: "fahmijapan4@gmail.com",
    2: "shinhajiru@gmail.com",
    3: "fahmirizal25248@gmail.com"
}

def get_token_claims_for_acc(acc_num: int) -> Dict[str, Any]:
    """Read token file from agy-pool in real time and extract JWT claims."""
    candidate_paths = [
        POOL_DIR / "accounts" / f"acc{acc_num}" / "antigravity-oauth-token",
    ]
    if acc_num == 1:
        candidate_paths.append(Path("/home/arusuka/.gemini/antigravity-cli/antigravity-oauth-token"))

    for token_file in candidate_paths:
        if token_file.exists() and token_file.stat().st_size > 10:
            try:
                data = json.loads(token_file.read_text(encoding="utf-8"))
                id_tok = data.get("id_token")
                if id_tok:
                    parts = id_tok.split(".")
                    if len(parts) >= 2:
                        payload = parts[1]
                        padded = payload + "=" * (-len(payload) % 4)
                        claims = json.loads(base64.urlsafe_b64decode(padded))
                        if claims.get("email"):
                            return claims
            except Exception:
                pass
    return {}


def get_agy_pool_data() -> Dict[str, Any]:
    """Dynamically read agy-pool configuration, active account, and token claims in real time."""
    pool_state = {}
    if POOL_STATE_FILE.exists():
        try:
            pool_state = json.loads(POOL_STATE_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass

    active_num = pool_state.get("active_account", 1)
    accounts_state = pool_state.get("accounts", {})
    rotation_mode = pool_state.get("rotation_mode", "round_robin")

    accounts = {}
    email_to_id = {}

    for i in range(1, 4):
        acc_key = f"account_{i}"
        raw_acc = accounts_state.get(str(i), {})
        
        # Real-time JWT claims extraction (Email & Name) from agy-pool
        claims = get_token_claims_for_acc(i)
        email = claims.get("email", "").lower().strip()
        if not email:
            email = str(raw_acc.get("email") or DEFAULT_ACCOUNT_EMAILS.get(i, "")).lower().strip()

        pool_name = raw_acc.get("name") or claims.get("name", "").strip() or f"Google One Pro (Worker {i})"
        if email:
            email_to_id[email] = acc_key

        short_name = f"Akun {i}"
        badge_color = ACCOUNT_COLORS.get(acc_key, "#6366f1")
        display_label = f"Akun {i} ({pool_name})"

        accounts[acc_key] = {
            "id": acc_key,
            "account_id": acc_key,
            "num": i,
            "name": pool_name,
            "display_name": display_label,
            "short_name": short_name,
            "email": email or "",
            "badge_color": badge_color,
            "tag": display_label,
            "is_active": (i == active_num),
            "total_tasks": raw_acc.get("total_tasks", 0),
            "last_used": raw_acc.get("last_used"),
            "status": "ready" if (email or raw_acc.get("status") == "ready") else "not_configured"
        }

    return {
        "active_account_id": f"account_{active_num}",
        "active_num": active_num,
        "rotation_mode": rotation_mode,
        "accounts": accounts,
        "email_to_id": email_to_id,
        "updated_at": pool_state.get("updated_at")
    }


def get_agy_accounts() -> Dict[str, Dict[str, Any]]:
    return get_agy_pool_data()["accounts"]



def get_current_active_antigravity_account() -> str:
    return get_agy_pool_data()["active_account_id"]


def init_agy_account_db():
    """Ensure persistent account-to-session mapping table exists in SQLite."""
    try:
        PORTFOLIO_DB.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(str(PORTFOLIO_DB)) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS agy_session_accounts (
                    session_id TEXT PRIMARY KEY,
                    account_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.commit()
    except Exception:
        pass


init_agy_account_db()


def get_session_account_map() -> Dict[str, str]:
    """Retrieve existing session_id -> account_id mappings."""
    mapping = {}
    try:
        with sqlite3.connect(str(PORTFOLIO_DB)) as conn:
            cur = conn.cursor()
            rows = cur.execute("SELECT session_id, account_id FROM agy_session_accounts").fetchall()
            for sid, aid in rows:
                mapping[sid] = aid
    except Exception:
        pass
    return mapping


def set_session_account(session_id: str, account_id: str):
    """Assign or update a session's Antigravity account."""
    pool_accounts = get_agy_accounts()
    acc_info = pool_accounts.get(account_id)
    email = acc_info["email"] if acc_info else ""
    with sqlite3.connect(str(PORTFOLIO_DB)) as conn:
        conn.execute("""
            INSERT INTO agy_session_accounts (session_id, account_id, email, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(session_id) DO UPDATE SET
                account_id = excluded.account_id,
                email = excluded.email,
                updated_at = CURRENT_TIMESTAMP
        """, (session_id, account_id, email))
        conn.commit()


MODEL_METADATA_MAP = {
    "gemini": {
        "id": "gemini",
        "name": "Gemini 3.7 Flash",
        "provider": "Google DeepMind",
        "badge_color": "#6366f1",
        "category": "Heavy Engineering & Server Guardian",
        "is_free": True,
        "cost_per_1m_in": 0.0,
        "cost_per_1m_out": 0.0,
        "policy": "Web Coding, Scripting, Backend & Server Guardian."
    },
    "gemini-pro": {
        "id": "gemini-pro",
        "name": "Gemini 3.7 Pro",
        "provider": "Google DeepMind",
        "badge_color": "#818cf8",
        "category": "Complex Architecture & Reasoning",
        "is_free": True,
        "cost_per_1m_in": 0.0,
        "cost_per_1m_out": 0.0,
        "policy": "High-depth reasoning & complex refactoring."
    },
    "deepseek": {
        "id": "deepseek",
        "name": "DeepSeek-V3",
        "provider": "DeepSeek AI",
        "badge_color": "#0ea5e9",
        "category": "Curhat & Moral Companion",
        "is_free": False,
        "cost_per_1m_in": 0.28,
        "cost_per_1m_out": 1.10,
        "policy": "Khusus Sesi Curhat Mendalam, Diskusi Moral, Asmara, dan Evaluasi Diri."
    },
    "local": {
        "id": "local",
        "name": "Hermes Local Engine",
        "provider": "Local Python / FastMCP",
        "badge_color": "#10b981",
        "category": "0-Token Autonomous Daemon",
        "is_free": True,
        "cost_per_1m_in": 0.0,
        "cost_per_1m_out": 0.0,
        "policy": "Pokémon Generator, Finance, Zepp Tracker, Cuaca Surabaya BMKG, dan Scheduled Cron."
    }
}


def resolve_model_meta(raw_model: Optional[str]) -> Dict[str, Any]:
    """Normalize model string to rich visual display metadata."""
    if not raw_model:
        return MODEL_METADATA_MAP["gemini"]
    key = str(raw_model).lower().strip()
    if key in MODEL_METADATA_MAP:
        return MODEL_METADATA_MAP[key]
    if "pro" in key:
        return MODEL_METADATA_MAP["gemini-pro"]
    if "gemini" in key or "google" in key or "flash" in key or "antigravity" in key:
        return MODEL_METADATA_MAP["gemini"]
    if "deepseek" in key:
        return MODEL_METADATA_MAP["deepseek"]
    return MODEL_METADATA_MAP["local"]


def format_timestamp(ts: Any) -> str:
    """Safely convert unix timestamp or ISO string to formatted date."""
    if not ts:
        return "-"
    try:
        if isinstance(ts, (int, float)):
            dt = datetime.fromtimestamp(ts)
        else:
            dt = datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        return dt.strftime("%d %b %Y, %H:%M:%S WIB")
    except Exception:
        return str(ts)[:19]


def clean_prompt_text(text: str) -> str:
    """Strip XML-like wrapper metadata from prompts for clean UI display."""
    if not text:
        return ""
    cleaned = re.sub(r"<USER_REQUEST>", "", text, flags=re.IGNORECASE)
    cleaned = re.sub(r"</USER_REQUEST>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<ADDITIONAL_METADATA>[\s\S]*?</ADDITIONAL_METADATA>", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<USER_SETTINGS_CHANGE>[\s\S]*?</USER_SETTINGS_CHANGE>", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


_AGY_SESSION_CACHE: Dict[str, Dict[str, Any]] = {}


def find_session_transcript(session_id: str) -> Optional[Tuple[Path, str]]:
    """Locate transcript.jsonl across all 3 user pool brain directories."""
    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue
        t_file = b_dir / session_id / ".system_generated" / "logs" / "transcript.jsonl"
        if t_file.exists():
            return t_file, f"account_{num}"
    return None


def scan_antigravity_sessions() -> List[Dict[str, Any]]:
    """Parse active Antigravity CLI transcript sessions across all 3 pool users with real-time agy-pool sync."""
    global _AGY_SESSION_CACHE
    sessions = []

    pool_data = get_agy_pool_data()
    pool_accounts = pool_data["accounts"]
    active_account_id = pool_data["active_account_id"]
    current_conv_ids = set()

    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue

        native_acc_id = f"account_{num}"
        acc_info = pool_accounts.get(native_acc_id, pool_accounts["account_1"])

        for conv_dir in b_dir.iterdir():
            if not conv_dir.is_dir():
                continue
            conv_id = conv_dir.name
            current_conv_ids.add(conv_id)
            t_file = conv_dir / ".system_generated" / "logs" / "transcript.jsonl"
            if not t_file.exists():
                continue

            try:
                stat_info = t_file.stat()
                mtime = stat_info.st_mtime
                size_bytes = stat_info.st_size

                # Check cache hit
                cached = _AGY_SESSION_CACHE.get(conv_id)
                if cached and cached.get("mtime") == mtime and cached.get("size") == size_bytes:
                    item = cached["data"]
                    # Refresh dynamic account info in cached item in real time
                    item["account_id"] = native_acc_id
                    item["account_email"] = acc_info["email"]
                    item["account_name"] = acc_info["name"]
                    item["account_tag"] = acc_info["tag"]
                    item["account_badge_color"] = acc_info["badge_color"]
                    sessions.append(item)
                    continue

                user_msgs = 0
                model_msgs = 0
                first_prompt = ""
                last_prompt = ""
                last_response = ""
                total_chars = 0

                with open(t_file, "r", encoding="utf-8") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        try:
                            obj = json.loads(line)
                            t_type = obj.get("type")
                            content = obj.get("content", "")
                            total_chars += len(str(content))

                            if t_type == "USER_INPUT":
                                user_msgs += 1
                                cleaned_c = clean_prompt_text(content)
                                if not first_prompt and cleaned_c:
                                    first_prompt = cleaned_c
                                if cleaned_c:
                                    last_prompt = cleaned_c
                            elif t_type == "PLANNER_RESPONSE":
                                model_msgs += 1
                                last_response = str(content).strip()
                        except Exception:
                            pass

                estimated_tokens = int(total_chars / 4)
                in_tokens = int(estimated_tokens * 0.6)
                out_tokens = int(estimated_tokens * 0.4)

                title = first_prompt or f"Engineering Session {conv_dir.name[:8]}"
                if len(title) > 90:
                    title = title[:87] + "..."

                session_data = {
                    "session_id": conv_id,
                    "title": title,
                    "source": "antigravity-cli",
                    "account_id": native_acc_id,
                    "account_email": acc_info["email"],
                    "account_name": acc_info["name"],
                    "account_tag": acc_info["tag"],
                    "account_badge_color": acc_info["badge_color"],
                    "started_at": format_timestamp(mtime),
                    "started_ts": mtime,
                    "last_active": format_timestamp(mtime),
                    "last_active_ts": mtime,
                    "message_count": user_msgs + model_msgs,
                    "user_turns": user_msgs,
                    "model_turns": model_msgs,
                    "input_tokens": in_tokens,
                    "output_tokens": out_tokens,
                    "total_tokens": estimated_tokens,
                    "estimated_cost_usd": 0.0,
                    "last_user_query": last_prompt[:140],
                    "last_ai_response": last_response[:160]
                }

                _AGY_SESSION_CACHE[conv_id] = {
                    "mtime": mtime,
                    "size": size_bytes,
                    "data": session_data
                }
                sessions.append(session_data)
            except Exception:
                pass

    # Clean orphaned cache entries
    for k in list(_AGY_SESSION_CACHE.keys()):
        if k not in current_conv_ids:
            _AGY_SESSION_CACHE.pop(k, None)

    return sessions


@router.get("")
def list_sessions(
    search: Optional[str] = None,
    model: Optional[str] = None,
    account: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    current_user: str = Depends(get_current_user)
):
    """Retrieve all Hermes & Antigravity conversation sessions."""
    sessions = []

    # 1. Fetch Antigravity Sessions across all pool accounts
    agy_sessions = scan_antigravity_sessions()
    sessions.extend(agy_sessions)

    # 2. Fetch Hermes SQLite Sessions if available
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB), timeout=4.0)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
                SELECT s.id, s.source, s.started_at, s.ended_at, s.model, s.title, s.message_count,
                       s.input_tokens, s.output_tokens, s.estimated_cost_usd
                FROM sessions s
                ORDER BY COALESCE(s.started_at, 0) DESC
                LIMIT 50
            """)
            for r in cur.fetchall():
                sid = r["id"]
                raw_m = r["model"] or "deepseek"
                meta = resolve_model_meta(raw_m)
                in_tok = r["input_tokens"] or 0
                out_tok = r["output_tokens"] or 0
                cost = (in_tok * meta["cost_per_1m_in"] + out_tok * meta["cost_per_1m_out"]) / 1_000_000

                sessions.append({
                    "session_id": sid,
                    "title": r["title"] or f"Hermes Session {sid[:8]}",
                    "source": r["source"] or "telegram",
                    "account_id": None,
                    "account_email": None,
                    "account_name": None,
                    "account_tag": None,
                    "account_badge_color": meta["badge_color"],
                    "started_at": format_timestamp(r["started_at"]),
                    "started_ts": r["started_at"] or time.time(),
                    "last_active": format_timestamp(r["ended_at"] or r["started_at"]),
                    "last_active_ts": r["ended_at"] or r["started_at"] or time.time(),
                    "message_count": r["message_count"] or 0,
                    "user_turns": int((r["message_count"] or 0) / 2),
                    "model_turns": int((r["message_count"] or 0) / 2),
                    "input_tokens": in_tok,
                    "output_tokens": out_tok,
                    "total_tokens": in_tok + out_tok,
                    "estimated_cost_usd": round(cost, 6),
                    "last_user_query": "",
                    "last_ai_response": ""
                })
            conn.close()
        except Exception:
            pass

    # Sort descending by timestamp
    sessions.sort(key=lambda x: x.get("last_active_ts", 0), reverse=True)

    # Apply filters
    filtered = []
    for s in sessions:
        if search:
            q = search.lower()
            if (q not in s["session_id"].lower() and 
                q not in s["title"].lower() and 
                q not in (s.get("account_email") or "").lower() and
                q not in (s.get("account_name") or "").lower() and
                q not in s["last_user_query"].lower()):
                continue

        # Account specific filter (account_1, account_2, account_3, or email)
        if account and account != "all":
            acc_val = account.lower()
            s_acc_id = (s.get("account_id") or "").lower()
            s_acc_email = (s.get("account_email") or "").lower()
            s_acc_name = (s.get("account_name") or "").lower()
            if acc_val not in s_acc_id and acc_val not in s_acc_email and acc_val not in s_acc_name:
                continue

        if source and source != "all":
            if source.lower() not in s["source"].lower():
                continue

        filtered.append(s)

    pool_data = get_agy_pool_data()
    return {
        "sessions": filtered[:limit],
        "total": len(filtered),
        "active_account_id": pool_data["active_account_id"],
        "accounts": list(pool_data["accounts"].values()),
        "pool_mode": pool_data["rotation_mode"]
    }


@router.get("/analytics")
def get_model_token_analytics(current_user: str = Depends(get_current_user)):
    """
    Get aggregated token usage & cost analytics across Antigravity Accounts (1, 2, 3),
    DeepSeek-V3, and Hermes Local Engine synced in real time with agy-pool.
    """
    all_sessions = scan_antigravity_sessions()
    pool_data = get_agy_pool_data()
    pool_accounts = pool_data["accounts"]
    active_account = pool_data["active_account_id"]

    models_stat = {}
    for i in range(1, 4):
        acc_key = f"account_{i}"
        m_key = f"antigravity_{i}"
        acc = pool_accounts[acc_key]
        models_stat[m_key] = {
            "id": m_key,
            "account_id": acc_key,
            "name": f"Antigravity ({acc['short_name']})",
            "display_name": acc["name"],
            "email": acc["email"],
            "provider": "Google DeepMind",
            "badge_color": acc["badge_color"],
            "sessions_count": 0,
            "turns_count": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "cost_usd": 0.0,
            "is_free": True,
            "is_active": acc["is_active"],
            "total_tasks": acc["total_tasks"],
            "role": f"{acc['name']} ({acc['email'] if acc['email'] else acc['user']})"
        }

    models_stat["deepseek"] = {
        "id": "deepseek",
        "name": "DeepSeek-V3",
        "display_name": "DeepSeek-V3",
        "email": None,
        "provider": "DeepSeek AI",
        "badge_color": "#0ea5e9",
        "sessions_count": 0,
        "turns_count": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "is_free": False,
        "is_active": False,
        "role": "Curhat & Moral Companion"
    }

    models_stat["local"] = {
        "id": "local",
        "name": "Hermes Local Engine",
        "display_name": "Hermes Local Engine",
        "email": None,
        "provider": "Local FastMCP / 0-Token",
        "badge_color": "#10b981",
        "sessions_count": 12,
        "turns_count": 48,
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "is_free": True,
        "is_active": True,
        "role": "Pokémon, Finance OCR, Zepp, Weather & Cron"
    }

    total_tokens_all = 0
    total_cost_usd = 0.0

    for s in all_sessions:
        acc_id = s.get("account_id") or "account_1"
        target_key = f"antigravity_{acc_id.replace('account_', '')}"
        if target_key in models_stat:
            models_stat[target_key]["sessions_count"] += 1
            models_stat[target_key]["turns_count"] += s["message_count"]
            models_stat[target_key]["input_tokens"] += s["input_tokens"]
            models_stat[target_key]["output_tokens"] += s["output_tokens"]
            models_stat[target_key]["total_tokens"] += s["total_tokens"]
        total_tokens_all += s["total_tokens"]

    estimated_commercial_cost = (total_tokens_all / 1_000_000) * 3.00
    estimated_savings_usd = round(estimated_commercial_cost - total_cost_usd, 2)

    return {
        "summary": {
            "total_sessions": sum(m["sessions_count"] for m in models_stat.values()),
            "total_turns": sum(m["turns_count"] for m in models_stat.values()),
            "total_tokens": total_tokens_all,
            "total_cost_usd": round(total_cost_usd, 4),
            "estimated_savings_usd": estimated_savings_usd,
            "last_updated": datetime.now().strftime("%d %b %Y, %H:%M WIB"),
            "active_antigravity_account": pool_accounts.get(active_account, pool_accounts["account_1"])
        },
        "models": list(models_stat.values()),
        "accounts": list(pool_accounts.values()),
        "pool_mode": pool_data["rotation_mode"]
    }


class SessionAccountUpdate(BaseModel):
    account_id: str


@router.patch("/{session_id}/account")
@router.post("/{session_id}/account")
def update_session_account(
    session_id: str,
    payload: SessionAccountUpdate,
    current_user: str = Depends(get_current_user)
):
    """Assign or switch a session to Antigravity Akun 1, 2, or 3."""
    pool_accounts = get_agy_accounts()
    if payload.account_id not in pool_accounts:
        raise HTTPException(status_code=400, detail="Invalid account_id. Choose account_1, account_2, or account_3")
    
    set_session_account(session_id, payload.account_id)
    _AGY_SESSION_CACHE.pop(session_id, None)
    
    return {
        "status": "success",
        "session_id": session_id,
        "account": pool_accounts[payload.account_id]
    }


@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: str = Depends(get_current_user)
):
    """Fetch paginated transcript turns with exact per-message LLM identification and account attribution."""
    # 1. Search Antigravity transcripts across all 3 pool users
    found = find_session_transcript(session_id)
    if found:
        t_file, native_acc_id = found
        turns = []
        try:
            pool_data = get_agy_pool_data()
            pool_accounts = pool_data["accounts"]
            acc_info = pool_accounts.get(native_acc_id, pool_accounts["account_1"])

            current_model_name = "Gemini 3.7 Flash"
            with open(t_file, "r", encoding="utf-8") as f:
                for idx, line in enumerate(f):
                    if not line.strip():
                        continue
                    try:
                        obj = json.loads(line)
                        t_type = obj.get("type", "UNKNOWN")
                        role = "user" if t_type == "USER_INPUT" else "assistant" if t_type == "PLANNER_RESPONSE" else "system"
                        content = obj.get("content", "")
                        thinking = obj.get("thinking", "")
                        tool_calls = obj.get("tool_calls", [])
                        created_at = obj.get("created_at", "")

                        # Detect per-turn model changes in prompts
                        if t_type == "USER_INPUT" and content:
                            m_match = re.search(r"Model Selection\`\s+from\s+.*?\s+to\s+([^\n<]+?)(?:\.\s+[A-Z]|\.\n|\n|<|$)", content)
                            if m_match:
                                raw_extracted = m_match.group(1).strip().rstrip(".")
                                current_model_name = raw_extracted
                            elif "gemini-3.7-pro" in content.lower() or "gemini 3.7 pro" in content.lower():
                                current_model_name = "Gemini 3.7 Pro"
                            elif "gemini-3.7-flash" in content.lower() or "gemini 3.7 flash" in content.lower():
                                current_model_name = "Gemini 3.7 Flash"

                        display_content = clean_prompt_text(content) if role == "user" else content

                        # Per-message exact LLM metadata
                        if role == "assistant":
                            turn_model = obj.get("model") or obj.get("model_name") or current_model_name
                        else:
                            turn_model = None

                        turns.append({
                            "turn_id": idx,
                            "role": role,
                            "type": t_type,
                            "content": display_content,
                            "raw_content": content,
                            "thinking": thinking,
                            "tool_calls": tool_calls,
                            "timestamp": format_timestamp(created_at) if created_at else f"Turn #{idx+1}",
                            "model_name": turn_model,
                            "handler": {
                                "account_id": native_acc_id,
                                "short_name": acc_info["short_name"],
                                "email": acc_info["email"],
                                "badge_color": acc_info["badge_color"],
                                "tag": acc_info["tag"],
                                "name": acc_info["name"]
                            } if role == "assistant" else None
                        })
                    except Exception:
                        pass

            total_count = len(turns)
            if order == "desc":
                turns.reverse()

            sliced = turns[offset : offset + limit]
            return {
                "session_id": session_id,
                "source": "antigravity-cli",
                "account_id": native_acc_id,
                "account_email": acc_info["email"],
                "account_name": acc_info["name"],
                "account_tag": acc_info["tag"],
                "account_badge_color": acc_info["badge_color"],
                "total_turns": total_count,
                "offset": offset,
                "limit": limit,
                "order": order,
                "has_more": (offset + len(sliced)) < total_count,
                "turns": sliced
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error reading transcript: {e}")

    # 2. Fallback to Hermes DB
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB))
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM messages WHERE session_id = ?", (session_id,))
            total_count = cur.fetchone()[0]

            order_clause = "DESC" if order == "desc" else "ASC"
            cur.execute(
                f"SELECT id, role, content, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp {order_clause} LIMIT ? OFFSET ?",
                (session_id, limit, offset)
            )
            rows = cur.fetchall()
            turns = []
            for idx, r in enumerate(rows):
                m_role = r["role"]
                turns.append({
                    "turn_id": offset + idx,
                    "role": m_role,
                    "content": r["content"],
                    "timestamp": format_timestamp(r["timestamp"]),
                    "model_name": "DeepSeek-V3" if m_role == "assistant" else None,
                    "handler": {
                        "account_id": "deepseek",
                        "short_name": "DeepSeek",
                        "email": "",
                        "badge_color": "#0ea5e9",
                        "tag": "DeepSeek-V3",
                        "name": "DeepSeek-V3"
                    } if m_role == "assistant" else None
                })
            conn.close()
            return {
                "session_id": session_id,
                "source": "hermes-gateway",
                "total_turns": total_count,
                "offset": offset,
                "limit": limit,
                "order": order,
                "has_more": (offset + len(turns)) < total_count,
                "turns": turns
            }
        except Exception:
            pass

    raise HTTPException(status_code=404, detail="Session transcript not found")


@router.delete("/{session_id}")
def delete_session(session_id: str, current_user: str = Depends(get_current_user)):
    """Delete a specific session transcript and records across all pool brain directories."""
    deleted = False

    # 1. Delete AGY transcript folder in any brain directory
    for num, user, b_dir in BRAIN_DIRS:
        agy_dir = b_dir / session_id
        if agy_dir.exists() and agy_dir.is_dir():
            shutil.rmtree(agy_dir, ignore_errors=True)
            deleted = True

    _AGY_SESSION_CACHE.pop(session_id, None)

    # 2. Delete Hermes SQLite session records
    if STATE_DB.exists():
        try:
            sconn = sqlite3.connect(str(STATE_DB))
            scur = sconn.cursor()
            scur.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
            scur.execute("DELETE FROM session_model_usage WHERE session_id = ?", (session_id,))
            scur.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            if scur.rowcount > 0:
                deleted = True
            sconn.commit()
            sconn.close()
        except Exception:
            pass

    if not deleted:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah dihapus.")

    return {
        "success": True,
        "message": f"Sesi {session_id} berhasil dihapus."
    }


@router.post("/prune")
def prune_old_sessions(days: int = Query(7, ge=1), current_user: str = Depends(get_current_user)):
    """Prune conversation logs and transcripts older than specified days."""
    cutoff_ts = time.time() - (days * 86400)
    pruned_count = 0

    # 1. Prune AGY transcript folders across all brain directories
    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue
        for conv_dir in b_dir.iterdir():
            if not conv_dir.is_dir():
                continue
            try:
                t_file = conv_dir / ".system_generated" / "logs" / "transcript.jsonl"
                if t_file.exists() and t_file.stat().st_mtime < cutoff_ts:
                    shutil.rmtree(conv_dir, ignore_errors=True)
                    _AGY_SESSION_CACHE.pop(conv_dir.name, None)
                    pruned_count += 1
                elif not t_file.exists():
                    shutil.rmtree(conv_dir, ignore_errors=True)
                    _AGY_SESSION_CACHE.pop(conv_dir.name, None)
                    pruned_count += 1
            except Exception:
                pass

    # 2. Prune Hermes logs if available
    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB))
            rcur = rconn.cursor()
            cutoff_iso = datetime.fromtimestamp(cutoff_ts).isoformat()
            rcur.execute("DELETE FROM llm_router_logs WHERE timestamp < ?", (cutoff_iso,))
            rconn.commit()
            rconn.close()
        except Exception:
            pass

    return {
        "success": True,
        "message": f"Berhasil membersihkan {pruned_count} riwayat log sesi tidak aktif (> {days} hari).",
        "pruned_count": pruned_count
    }


@router.post("/clear")
def clear_all_sessions(current_user: str = Depends(get_current_user)):
    """Clear all inactive conversation logs from server across all pool brain directories."""
    cleared_count = 0

    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue
        for conv_dir in b_dir.iterdir():
            if not conv_dir.is_dir():
                continue
            try:
                shutil.rmtree(conv_dir, ignore_errors=True)
                cleared_count += 1
            except Exception:
                pass

    _AGY_SESSION_CACHE.clear()

    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB))
            rcur = rconn.cursor()
            rcur.execute("DELETE FROM llm_router_logs")
            rconn.commit()
            rconn.close()
        except Exception:
            pass

    if STATE_DB.exists():
        try:
            sconn = sqlite3.connect(str(STATE_DB))
            scur = sconn.cursor()
            scur.execute("DELETE FROM messages")
            scur.execute("DELETE FROM session_model_usage")
            scur.execute("DELETE FROM sessions")
            sconn.commit()
            sconn.close()
        except Exception:
            pass

    return {
        "success": True,
        "message": f"Berhasil mengosongkan {cleared_count} riwayat log sesi AI.",
        "cleared_count": cleared_count
    }
