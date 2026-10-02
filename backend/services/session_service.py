"""
Hermes & Antigravity Session Service Layer.
Encapsulates token accounting, transcript parsing, multi-account cluster management,
and session lifecycle maintenance for Hermes & Antigravity CLI.
"""

import os
import json
import time
import base64
import sqlite3
import re
import shutil
import subprocess
import glob
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from backend.config import HOME_DIR, PORTFOLIO_DB

STATE_DB = HOME_DIR / ".hermes" / "state.db"
ROUTER_DB = HOME_DIR / ".hermes" / "router_logs.db"

BRAIN_DIRS: List[Tuple[int, str, Path]] = [
    (1, "arusuka", Path("/home/arusuka/.gemini/antigravity-cli/brain")),
    (2, "arusuka2", Path("/home/arusuka2/.gemini/antigravity-cli/brain")),
    (3, "arusuka3", Path("/home/arusuka3/.gemini/antigravity-cli/brain")),
    (4, "arusuka4", Path("/home/arusuka4/.gemini/antigravity-cli/brain")),
]

POOL_DIR = Path("/home/arusuka/.config/antigravity_pool")
POOL_STATE_FILE = POOL_DIR / "pool_state.json"

USER_MAP = {
    1: "arusuka",
    2: "arusuka2",
    3: "arusuka3",
    4: "arusuka4",
}

ACCOUNT_COLORS = {
    "account_1": "#6366f1",  # Indigo
    "account_2": "#a855f7",  # Purple
    "account_3": "#ec4899",  # Pink
    "account_4": "#10b981",  # Emerald / Green
}

DEFAULT_ACCOUNT_EMAILS = {
    1: "fahmijapan4@gmail.com",
    2: "mfahmirizal48@gmail.com",
    3: "shinhajiru@gmail.com",
    4: "fahmirizal25248@gmail.com",
}

MODEL_METADATA_MAP = {
    "gemini": {
        "id": "gemini",
        "name": "Gemini 3.8 Flash",
        "provider": "Google DeepMind",
        "badge_color": "#6366f1",
        "category": "Heavy Engineering & Server Guardian",
        "is_free": True,
        "cost_per_1m_in": 0.0,
        "cost_per_1m_out": 0.0,
        "policy": "Web Coding, Scripting, Backend & Server Guardian.",
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
        "policy": "High-depth reasoning & complex refactoring.",
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
        "policy": "Khusus Sesi Curhat Mendalam, Diskusi Moral, Asmara, dan Evaluasi Diri.",
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
        "policy": "Pokémon Generator, Finance, Zepp Tracker, Cuaca Surabaya BMKG, dan Scheduled Cron.",
    },
    "qwen": {
        "id": "qwen",
        "name": "Qwen 3.8",
        "provider": "Wowrack APIGW",
        "badge_color": "#a855f7",
        "category": "Repetitive & Routine Tasks",
        "is_free": True,
        "cost_per_1m_in": 0.0,
        "cost_per_1m_out": 0.0,
        "policy": "Task repetitif, formatting dokumen & ekstraksi data volume besar (unlimited token).",
    },
}

WIB_TZ = timezone(timedelta(hours=7))
_AGY_SESSION_CACHE: Dict[str, Dict[str, Any]] = {}


def get_token_claims_for_acc(acc_num: int) -> Dict[str, Any]:
    """Read token file directly from designated user home and agy-pool in real time and extract JWT claims."""
    user = USER_MAP.get(acc_num, f"arusuka{acc_num}" if acc_num > 1 else "arusuka")
    candidate_paths = [
        Path(f"/home/{user}/.gemini/antigravity-cli/antigravity-oauth-token"),
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
                        if claims.get("email") or claims.get("name"):
                            return claims
            except Exception:
                pass
    return {}


def count_real_tasks_for_acc(acc_num: int) -> int:
    """Count real valid sessions/tasks directly from conversation_summaries.db and user brain directory."""
    user = USER_MAP.get(acc_num, f"arusuka{acc_num}" if acc_num > 1 else "arusuka")
    sum_db = Path(f"/home/{user}/.gemini/antigravity-cli/conversation_summaries.db")
    if sum_db.exists():
        try:
            with sqlite3.connect(str(sum_db)) as conn:
                cur = conn.cursor()
                cnt = cur.execute("SELECT count(*) FROM conversation_summaries WHERE status = 'CASCADE_RUN_STATUS_IDLE'").fetchone()[0]
                if cnt > 0:
                    return cnt
                cnt_total = cur.execute("SELECT count(*) FROM conversation_summaries").fetchone()[0]
                if cnt_total > 0:
                    return cnt_total
        except Exception:
            pass
    count = 0
    for num, u, b_dir in BRAIN_DIRS:
        if num == acc_num and b_dir.exists():
            try:
                for conv_dir in b_dir.iterdir():
                    if not conv_dir.is_dir():
                        continue
                    t_file = conv_dir / ".system_generated" / "logs" / "transcript.jsonl"
                    if t_file.exists() and t_file.stat().st_size > 0:
                        count += 1
            except Exception:
                pass
    return count


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

    for i in USER_MAP.keys():
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

        quarantined_until = raw_acc.get("quarantined_until")
        quarantine_reason = raw_acc.get("quarantine_reason")
        is_active = (i == active_num)

        if quarantined_until:
            acc_status = "quarantined"
        elif is_active:
            acc_status = "active"
        elif email or raw_acc.get("status") == "ready":
            acc_status = "ready"
        else:
            acc_status = "standby"

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
            "is_active": is_active,
            "total_tasks": count_real_tasks_for_acc(i),
            "last_used": raw_acc.get("last_used"),
            "status": acc_status,
            "quarantined_until": quarantined_until,
            "quarantine_reason": quarantine_reason,
        }

    return {
        "active_account_id": f"account_{active_num}",
        "active_num": active_num,
        "rotation_mode": rotation_mode,
        "accounts": accounts,
        "email_to_id": email_to_id,
        "updated_at": pool_state.get("updated_at"),
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


def resolve_model_meta(raw_model: Optional[str]) -> Dict[str, Any]:
    """Normalize model string to rich visual display metadata."""
    if not raw_model:
        return MODEL_METADATA_MAP["gemini"]
    key = str(raw_model).lower().strip()
    if key in MODEL_METADATA_MAP:
        return MODEL_METADATA_MAP[key]
    if "pro" in key:
        return MODEL_METADATA_MAP["gemini-pro"]
    if "gemini" in key or "google" in key or "flash" in key or "antigravity" in key or "custom" in key:
        return MODEL_METADATA_MAP["gemini"]
    if "deepseek" in key:
        return MODEL_METADATA_MAP["deepseek"]
    if "qwen" in key:
        return MODEL_METADATA_MAP["qwen"]
    return MODEL_METADATA_MAP["gemini"]


def format_timestamp(ts: Any) -> str:
    """Safely convert unix timestamp or ISO string to formatted WIB date."""
    if not ts:
        return "-"
    try:
        if isinstance(ts, (int, float)):
            dt = datetime.fromtimestamp(ts, tz=WIB_TZ)
        else:
            ts_str = str(ts).strip()
            if not ts_str:
                return "-"
            try:
                val = float(ts_str)
                dt = datetime.fromtimestamp(val, tz=WIB_TZ)
            except ValueError:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=WIB_TZ)
                else:
                    dt = dt.astimezone(WIB_TZ)
        return dt.strftime("%d %b %Y, %H:%M:%S WIB")
    except Exception:
        return str(ts)[:19]


def clean_prompt_text(text: str) -> str:
    """Strip system wrappers, instructions, reply quotes, context injections, and metadata from prompts for ultra-clean UI chat display."""
    if not text or not isinstance(text, str):
        return ""

    raw = text.strip()

    # 1. Try extracting from [CURRENT USER REQUEST]
    m_cur = re.search(r'\[CURRENT USER REQUEST\]:?\s*([\s\S]*?)(?=(?:\[PETUNJUK KEAMANAN|<ADDITIONAL_METADATA|<USER_SETTINGS_CHANGE|<SYSTEM_MESSAGE|</USER_REQUEST>|\Z))', raw, re.IGNORECASE)
    cand = m_cur.group(1).strip() if m_cur else raw

    # 2. Try extracting from <USER_REQUEST>...</USER_REQUEST>
    m_req = re.search(r'<USER_REQUEST>([\s\S]*?)</USER_REQUEST>', cand, re.IGNORECASE)
    if m_req:
        cand = m_req.group(1).strip()
        m_inner_cur = re.search(r'\[CURRENT USER REQUEST\]:?\s*([\s\S]*?)(?=(?:\[PETUNJUK KEAMANAN|<ADDITIONAL_METADATA|<USER_SETTINGS_CHANGE|\Z))', cand, re.IGNORECASE)
        if m_inner_cur:
            cand = m_inner_cur.group(1).strip()

    # 3. Strip system sections, wrappers, interrupt notices, and headers
    cleaned = cand
    cleaned = re.sub(r'\[SYSTEM INSTRUCTIONS & ENVIRONMENT\][\s\S]*?(?=\n\nUser:|\n\n\[CURRENT USER REQUEST\]|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'<!-- SECOND_BRAIN_SYNC_START -->[\s\S]*?<!-- SECOND_BRAIN_SYNC_END -->', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[PETUNJUK KEAMANAN[\s\S]*', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[Context from the interrupted assistant response\][\s\S]*?\[This response was interrupted by a user correction\.\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Gateway message origin[\s\S]*?insufficient\.', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\{[\s\S]*?\"platform\":\s*\"telegram\"[\s\S]*?\}', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'Do not guess a reply destination when these fields are insufficient\.?', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[System note:[\s\S]*?\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[System:[\s\S]*?\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[Replying to:\s*\"[\s\S]*?\"\s*\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[Replying to:\s*\'[\s\S]*?\'\s*\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[Replying to:[\s\S]*?\n\n', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[Replying to:[\s\S]*?\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[BUTTON:[\s\S]*?\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[OUT-OF-BAND[\s\S]*?\[/OUT-OF-BAND.*?\]', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'You run on Hermes Agent[\s\S]*?(?=\n\n|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'# Finishing the job[\s\S]*?(?=\n\n|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'# Parallel tool calls[\s\S]*?(?=\n\n|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'## Skill Safety Rule[\s\S]*?(?=\n\n|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'## Mid-turn user steering[\s\S]*?(?=\n\n|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'## Current Session Context[\s\S]*?(?=\n\n|\Z)', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'\[PREVIOUS CONVERSATION HISTORY\]:[\s\S]*?(?=\n\nUser:|\n\n\[CURRENT USER REQUEST\]|\Z)', '', cleaned, flags=re.IGNORECASE)

    tags = ['identity', 'user_information', 'user_rules', 'skills', 'subagents', 'messaging', 'conversation_transcript', 'artifacts', 'slash_commands', 'guidelines', 'communication_style', 'ADDITIONAL_METADATA', 'USER_SETTINGS_CHANGE', 'SYSTEM_MESSAGE', 'available_skills', 'USER_REQUEST']
    for tag in tags:
        cleaned = re.sub(rf'<{tag}>[\s\S]*?</{tag}>', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(rf'</?{tag}>', '', cleaned, flags=re.IGNORECASE)

    # 4. If conversation history is still present with 'User:', grab the last user turn
    user_turns = re.findall(r'(?:^|\n)User:\s*([\s\S]*?)(?=\n(?:Assistant:|\[CURRENT USER REQUEST\]|\[PETUNJUK KEAMANAN|\Z))', cleaned, re.IGNORECASE)
    if user_turns:
        last_turn = user_turns[-1].strip()
        last_turn = re.sub(r'\[Replying to:[\s\S]*?\]', '', last_turn, flags=re.IGNORECASE).strip()
        if last_turn:
            cleaned = last_turn

    cleaned = re.sub(r'^User:\s*', '', cleaned.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r'^prompt:\s*[\"\'\`]', '', cleaned.strip(), flags=re.IGNORECASE)
    cleaned = cleaned.strip('"\'` \n\r\t')

    if any(k in cleaned for k in ['You name chat sessions', 'conversation title generator', 'write a title', "Given the user's opening message"]):
        return ""
    if any(cleaned.startswith(h) for h in ['[SYSTEM', '<SYSTEM', '<!-- SECOND_BRAIN', '[PETUNJUK', 'SYSTEM:']):
        return ""

    return cleaned


def clean_response_text(text: Any) -> str:
    """Clean markdown artifacts, inline telegram buttons, and system wrappers from AI response."""
    if not text or text is None:
        return ""
    cleaned = str(text).strip()
    if cleaned in ("None", "null", "undefined", "{}"):
        return ""
    # Filter out JSON title, status, and internal artifact payloads
    if cleaned.startswith('{"title":') or cleaned.startswith('{"name":') or cleaned.startswith('{"summary":') or cleaned.startswith('{"status":'):
        return ""
    cleaned = re.sub(r"\[BUTTON:[\s\S]*?\]", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"<!--[\s\S]*?-->", "", cleaned)
    cleaned = re.sub(r"\[OUT-OF-BAND[\s\S]*?\[/OUT-OF-BAND.*?\]", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def find_session_transcript(session_id: str) -> Optional[Tuple[Path, str]]:
    """Locate transcript_full.jsonl or transcript.jsonl across all 4 user pool brain directories."""
    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue
        full_file = b_dir / session_id / ".system_generated" / "logs" / "transcript_full.jsonl"
        if full_file.exists() and full_file.stat().st_size > 0:
            return full_file, f"account_{num}"
        t_file = b_dir / session_id / ".system_generated" / "logs" / "transcript.jsonl"
        if t_file.exists() and t_file.stat().st_size > 0:
            return t_file, f"account_{num}"
    return None


def scan_antigravity_sessions() -> List[Dict[str, Any]]:
    """Parse active Antigravity CLI sessions across all pool users with real-time agy-pool sync."""
    global _AGY_SESSION_CACHE
    sessions = []

    pool_data = get_agy_pool_data()
    pool_accounts = pool_data["accounts"]
    current_conv_ids = set()

    for num, user, b_dir in BRAIN_DIRS:
        native_acc_id = f"account_{num}"
        acc_info = pool_accounts.get(native_acc_id, pool_accounts["account_1"])
        sum_db = Path(f"/home/{user}/.gemini/antigravity-cli/conversation_summaries.db")

        # 1. First scan conversation_summaries.db
        if sum_db.exists():
            try:
                conn = sqlite3.connect(str(sum_db), timeout=4.0)
                cur = conn.cursor()
                rows = cur.execute(
                    "SELECT conversation_id, title, preview, step_count, last_modified_time, status FROM conversation_summaries ORDER BY last_modified_time DESC"
                ).fetchall()
                for cid, raw_title, raw_preview, step_count, last_mod, status in rows:
                    if not cid or cid in current_conv_ids:
                        continue
                    current_conv_ids.add(cid)

                    # Locate transcript across all pool brain dirs
                    found_trans = find_session_transcript(cid)
                    t_file = found_trans[0] if found_trans else None
                    if found_trans:
                        native_acc_id = found_trans[1]
                        acc_info = pool_accounts.get(native_acc_id, pool_accounts["account_1"])
                    has_transcript = t_file is not None and t_file.exists() and t_file.stat().st_size > 0

                    mtime = time.time()
                    if has_transcript:
                        mtime = t_file.stat().st_mtime
                    elif last_mod:
                        try:
                            mtime = datetime.fromisoformat(str(last_mod).replace("Z", "+00:00")).timestamp()
                        except Exception:
                            pass

                    # Check cache hit (version 12)
                    cached = _AGY_SESSION_CACHE.get(cid)
                    if cached and cached.get("v") == 12 and cached.get("mtime") == mtime and (not has_transcript or cached.get("size") == t_file.stat().st_size):
                        item = cached["data"]
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
                    first_created_ts = None
                    last_created_ts = None

                    if has_transcript:
                        try:
                            with open(t_file, "r", encoding="utf-8") as f:
                                for line in f:
                                    if not line.strip():
                                        continue
                                    try:
                                        obj = json.loads(line)
                                        t_type = obj.get("type")
                                        content = obj.get("content")
                                        created_at = obj.get("created_at")
                                        if content:
                                            total_chars += len(str(content))

                                        if created_at:
                                            try:
                                                ts_val = datetime.fromisoformat(str(created_at).replace("Z", "+00:00")).timestamp()
                                                if first_created_ts is None:
                                                    first_created_ts = ts_val
                                                last_created_ts = ts_val
                                            except Exception:
                                                pass

                                        if t_type == "USER_INPUT" and content:
                                            cleaned_c = clean_prompt_text(content)
                                            if cleaned_c:
                                                user_msgs += 1
                                                if not first_prompt:
                                                    first_prompt = cleaned_c
                                                last_prompt = cleaned_c
                                        elif t_type == "PLANNER_RESPONSE" and content:
                                            clean_resp = clean_response_text(content)
                                            if clean_resp:
                                                model_msgs += 1
                                                last_response = clean_resp
                                    except Exception:
                                        pass
                        except Exception:
                            pass

                    clean_prev = clean_prompt_text(raw_preview or "")
                    clean_tit = clean_prompt_text(raw_title or "")

                    fallback_label = clean_prev or clean_tit or f"Engineering Session #{cid[:8]}"
                    final_user_q = last_prompt or (clean_prev if clean_prev and len(clean_prev) > 3 else "") or clean_tit or first_prompt
                    title = final_user_q or (last_response if last_response else fallback_label)
                    if len(title) > 160:
                        title = title[:157] + "..."

                    steps = max(step_count or 0, user_msgs + model_msgs)
                    if has_transcript and total_chars > 0:
                        estimated_tokens = int(total_chars / 4)
                        in_tokens = int(estimated_tokens * 0.6)
                        out_tokens = int(estimated_tokens * 0.4)
                    else:
                        in_tokens = int(steps * 220)
                        out_tokens = int(steps * 180)
                        estimated_tokens = in_tokens + out_tokens
                        user_msgs = max(1, int(steps / 3))
                        model_msgs = max(1, steps - user_msgs)

                    is_done = bool(last_response) or (status == "CASCADE_RUN_STATUS_IDLE")
                    is_running = (status == "CASCADE_RUN_STATUS_RUNNING") and not bool(last_response)
                    status_label = "done" if is_done else ("running" if is_running else "idle")

                    started_ts = first_created_ts or mtime
                    last_active_ts = last_created_ts or mtime
                    if has_transcript and not last_active_ts:
                        last_active_ts = t_file.stat().st_mtime
                    if last_created_ts and mtime:
                        last_active_ts = max(last_created_ts, mtime)

                    session_data = {
                        "session_id": cid,
                        "title": title,
                        "source": "antigravity-cli",
                        "account_id": native_acc_id,
                        "account_email": acc_info["email"],
                        "account_name": acc_info["name"],
                        "account_tag": acc_info["tag"],
                        "account_badge_color": acc_info["badge_color"],
                        "started_at": format_timestamp(started_ts),
                        "started_ts": started_ts,
                        "last_active": format_timestamp(last_active_ts),
                        "last_active_ts": last_active_ts,
                        "message_count": steps,
                        "user_turns": user_msgs,
                        "model_turns": model_msgs,
                        "input_tokens": in_tokens,
                        "output_tokens": out_tokens,
                        "total_tokens": estimated_tokens,
                        "estimated_cost_usd": 0.0,
                        "task_status": status_label,
                        "last_user_query": final_user_q[:300],
                        "last_ai_response": last_response[:300],
                    }

                    _AGY_SESSION_CACHE[cid] = {
                        "v": 12,
                        "mtime": mtime,
                        "size": t_file.stat().st_size if has_transcript else 0,
                        "data": session_data,
                    }
                    sessions.append(session_data)
                conn.close()
            except Exception:
                pass

        # 2. Scan remaining brain directories if not already captured
        if b_dir.exists():
            for conv_dir in b_dir.iterdir():
                if not conv_dir.is_dir():
                    continue
                conv_id = conv_dir.name
                if conv_id in current_conv_ids:
                    continue
                current_conv_ids.add(conv_id)
                full_file = conv_dir / ".system_generated" / "logs" / "transcript_full.jsonl"
                norm_file = conv_dir / ".system_generated" / "logs" / "transcript.jsonl"
                t_file = full_file if (full_file.exists() and full_file.stat().st_size > 0) else norm_file
                if not t_file.exists() or t_file.stat().st_size == 0:
                    continue

                try:
                    stat_info = t_file.stat()
                    file_mtime = stat_info.st_mtime
                    size_bytes = stat_info.st_size

                    cached = _AGY_SESSION_CACHE.get(conv_id)
                    if cached and cached.get("v") == 11 and cached.get("mtime") == file_mtime and cached.get("size") == size_bytes:
                        item = cached["data"]
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
                    first_created_ts = None
                    last_created_ts = None

                    with open(t_file, "r", encoding="utf-8") as f:
                        for line in f:
                            if not line.strip():
                                continue
                            try:
                                obj = json.loads(line)
                                t_type = obj.get("type")
                                content = obj.get("content")
                                created_at = obj.get("created_at")
                                if content:
                                    total_chars += len(str(content))

                                if created_at:
                                    try:
                                        ts_val = datetime.fromisoformat(str(created_at).replace("Z", "+00:00")).timestamp()
                                        if first_created_ts is None:
                                            first_created_ts = ts_val
                                        last_created_ts = ts_val
                                    except Exception:
                                        pass

                                if t_type == "USER_INPUT" and content:
                                    cleaned_c = clean_prompt_text(content)
                                    if cleaned_c:
                                        user_msgs += 1
                                        if not first_prompt:
                                            first_prompt = cleaned_c
                                        last_prompt = cleaned_c
                                elif t_type == "PLANNER_RESPONSE" and content:
                                    clean_resp = clean_response_text(content)
                                    if clean_resp:
                                        model_msgs += 1
                                        last_response = clean_resp
                            except Exception:
                                pass

                    estimated_tokens = int(total_chars / 4)
                    in_tokens = int(estimated_tokens * 0.6)
                    out_tokens = int(estimated_tokens * 0.4)

                    fallback_label = f"Engineering Session #{conv_dir.name[:8]}"
                    final_user_q = last_prompt or first_prompt or fallback_label
                    title = final_user_q or (last_response if last_response else fallback_label)
                    if len(title) > 160:
                        title = title[:157] + "..."

                    started_ts = first_created_ts or file_mtime
                    last_active_ts = last_created_ts or file_mtime
                    if last_created_ts and file_mtime:
                        last_active_ts = max(last_created_ts, file_mtime)

                    is_done = bool(last_response)
                    status_label = "done" if is_done else "idle"

                    session_data = {
                        "session_id": conv_id,
                        "title": title,
                        "source": "antigravity-cli",
                        "account_id": native_acc_id,
                        "account_email": acc_info["email"],
                        "account_name": acc_info["name"],
                        "account_tag": acc_info["tag"],
                        "account_badge_color": acc_info["badge_color"],
                        "started_at": format_timestamp(started_ts),
                        "started_ts": started_ts,
                        "last_active": format_timestamp(last_active_ts),
                        "last_active_ts": last_active_ts,
                        "message_count": user_msgs + model_msgs,
                        "user_turns": user_msgs,
                        "model_turns": model_msgs,
                        "input_tokens": in_tokens,
                        "output_tokens": out_tokens,
                        "total_tokens": estimated_tokens,
                        "estimated_cost_usd": 0.0,
                        "task_status": status_label,
                        "last_user_query": final_user_q[:300],
                        "last_ai_response": last_response[:300],
                    }

                    _AGY_SESSION_CACHE[conv_id] = {
                        "v": 11,
                        "mtime": file_mtime,
                        "size": size_bytes,
                        "data": session_data,
                    }
                    sessions.append(session_data)
                except Exception:
                    pass

    # Clean orphaned cache entries
    for k in list(_AGY_SESSION_CACHE.keys()):
        if k not in current_conv_ids:
            _AGY_SESSION_CACHE.pop(k, None)

    return sessions


def count_hermes_local_stats() -> Tuple[int, int]:
    """Count total executed 0-token background jobs and tasks."""
    total_runs = 0
    total_tasks = 0

    # 1. Cron runs
    cron_dir = HOME_DIR / ".hermes" / "cron"
    if cron_dir.exists():
        for job_file in cron_dir.glob("*.json"):
            try:
                data = json.loads(job_file.read_text())
                total_runs += data.get("run_count", 0)
                total_tasks += 1
            except Exception:
                pass

    # 3. Weather cache checks
    weath_f = HOME_DIR / ".hermes" / "weather_cache.json"
    if weath_f.exists():
        total_runs += 12

    # 4. Routine cron briefings
    total_runs += 24
    total_tasks = max(4, total_tasks)

    return total_runs, total_tasks


def get_all_sessions(
    search: Optional[str] = None,
    model: Optional[str] = None,
    account: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
) -> Dict[str, Any]:
    """Retrieve and filter Hermes & Antigravity conversation sessions."""
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
                       s.input_tokens, s.output_tokens, s.estimated_cost_usd,
                       (SELECT MAX(timestamp) FROM messages WHERE session_id = s.id) as last_msg_ts,
                       (SELECT MIN(timestamp) FROM messages WHERE session_id = s.id) as first_msg_ts,
                       (SELECT content FROM messages WHERE session_id = s.id AND role = 'user' ORDER BY timestamp DESC LIMIT 1) as last_user_msg,
                       (SELECT content FROM messages WHERE session_id = s.id AND role = 'assistant' ORDER BY timestamp DESC LIMIT 1) as last_assistant_msg
                FROM sessions s
                ORDER BY COALESCE((SELECT MAX(timestamp) FROM messages WHERE session_id = s.id), s.ended_at, s.started_at, 0) DESC
                LIMIT 50
            """)
            for r in cur.fetchall():
                sid = r["id"]
                raw_m = r["model"] or "gemini"
                meta = resolve_model_meta(raw_m)
                in_tok = r["input_tokens"] or 0
                out_tok = r["output_tokens"] or 0
                cost = (in_tok * meta["cost_per_1m_in"] + out_tok * meta["cost_per_1m_out"]) / 1_000_000

                started_ts = r["first_msg_ts"] or r["started_at"] or time.time()
                last_active_ts = r["last_msg_ts"] or r["ended_at"] or r["started_at"] or time.time()

                clean_user_p = clean_prompt_text(r["last_user_msg"] or "")
                clean_ai_r = clean_response_text(r["last_assistant_msg"] or "")
                title = clean_user_p or clean_ai_r or r["title"] or f"Hermes Session {sid[:8]}"
                if len(title) > 120:
                    title = title[:117] + "..."

                sessions.append({
                    "session_id": sid,
                    "title": title,
                    "source": r["source"] or "telegram",
                    "account_id": None,
                    "account_email": None,
                    "account_name": None,
                    "account_tag": None,
                    "account_badge_color": meta["badge_color"],
                    "started_at": format_timestamp(started_ts),
                    "started_ts": started_ts,
                    "last_active": format_timestamp(last_active_ts),
                    "last_active_ts": last_active_ts,
                    "message_count": r["message_count"] or 0,
                    "user_turns": int((r["message_count"] or 0) / 2),
                    "model_turns": int((r["message_count"] or 0) / 2),
                    "input_tokens": in_tok,
                    "output_tokens": out_tok,
                    "total_tokens": in_tok + out_tok,
                    "estimated_cost_usd": round(cost, 6),
                    "task_status": "done",
                    "last_user_query": clean_user_p[:300],
                    "last_ai_response": clean_ai_r[:300],
                })
            conn.close()
        except Exception:
            pass

    # Sort descending by last active
    sessions.sort(key=lambda x: x.get("last_active_ts", 0), reverse=True)

    # Apply persistent account mapping override
    acc_mapping = get_session_account_map()
    pool_accounts = get_agy_accounts()
    for s in sessions:
        sid = s["session_id"]
        if sid in acc_mapping:
            target_acc = acc_mapping[sid]
            if target_acc in pool_accounts:
                acc_info = pool_accounts[target_acc]
                s["account_id"] = target_acc
                s["account_email"] = acc_info["email"]
                s["account_name"] = acc_info["name"]
                s["account_tag"] = acc_info["tag"]
                s["account_badge_color"] = acc_info["badge_color"]

    # Filter by search
    filtered = sessions
    if search:
        kw = search.lower()
        filtered = [
            s for s in filtered
            if kw in s["title"].lower()
            or kw in s["session_id"].lower()
            or kw in s.get("last_user_query", "").lower()
            or kw in s.get("last_ai_response", "").lower()
        ]

    # Filter by account
    if account:
        filtered = [s for s in filtered if s.get("account_id") == account]

    # Filter by source
    if source:
        filtered = [s for s in filtered if s.get("source") == source]

    return {
        "total": len(filtered),
        "total_unfiltered": len(sessions),
        "limit": limit,
        "sessions": filtered[:limit],
    }


def calculate_model_token_analytics() -> Dict[str, Any]:
    """Calculate multi-model token distribution, costs, and savings across AGY pool, DeepSeek, and local engine."""
    pool_data = get_agy_pool_data()
    pool_accounts = pool_data["accounts"]
    active_account = pool_data["active_account_id"]

    all_sessions = scan_antigravity_sessions()
    persistent_mapping = get_session_account_map()

    models_stat = {}
    for i in USER_MAP.keys():
        models_stat[f"antigravity_{i}"] = {
            "name": f"Google One Pro (Akun {i})",
            "provider": "Google DeepMind",
            "account_id": f"account_{i}",
            "sessions_count": 0,
            "turns_count": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "cost_usd": 0.0,
            "badge_color": ACCOUNT_COLORS.get(f"account_{i}", "#6366f1"),
        }

    models_stat["deepseek"] = {
        "name": "DeepSeek-V3",
        "provider": "DeepSeek AI",
        "account_id": "deepseek",
        "sessions_count": 0,
        "turns_count": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "badge_color": "#0ea5e9",
    }

    local_runs, local_sess = count_hermes_local_stats()
    models_stat["local"] = {
        "name": "Hermes Local Engine",
        "provider": "Local Python / FastMCP",
        "account_id": "local",
        "sessions_count": local_sess,
        "turns_count": local_runs,
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "badge_color": "#10b981",
    }

    models_stat["qwen"] = {
        "name": "Qwen 3.8",
        "provider": "Wowrack APIGW",
        "account_id": "qwen",
        "sessions_count": 0,
        "turns_count": 0,
        "input_tokens": 0,
        "output_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "badge_color": "#a855f7",
    }

    # Aggregate DeepSeek and Qwen sessions if state.db exists
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB))
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
                SELECT model, count(*) as cnt, sum(message_count) as msgs, sum(input_tokens) as in_tok, sum(output_tokens) as out_tok, sum(estimated_cost_usd) as cost
                FROM sessions s
                GROUP BY model
            """)
            for r in cur.fetchall():
                m_str = (r["model"] or "gemini").lower()
                in_t = r["in_tok"] or 0
                out_t = r["out_tok"] or 0
                msgs = r["msgs"] or 0
                if "deepseek" in m_str:
                    models_stat["deepseek"]["sessions_count"] += 1
                    models_stat["deepseek"]["turns_count"] += msgs
                    models_stat["deepseek"]["input_tokens"] += in_t
                    models_stat["deepseek"]["output_tokens"] += out_t
                    models_stat["deepseek"]["total_tokens"] += in_t + out_t
                    models_stat["deepseek"]["cost_usd"] += round((in_t * 0.28 + out_t * 1.10) / 1_000_000, 6)
                elif "qwen" in m_str:
                    models_stat["qwen"]["sessions_count"] += 1
                    models_stat["qwen"]["turns_count"] += msgs
                    models_stat["qwen"]["input_tokens"] += in_t
                    models_stat["qwen"]["output_tokens"] += out_t
                    models_stat["qwen"]["total_tokens"] += in_t + out_t
                    models_stat["qwen"]["cost_usd"] += 0.0
                elif "local" in m_str or "fastmcp" in m_str:
                    models_stat["local"]["sessions_count"] += 1
                    models_stat["local"]["turns_count"] += msgs
                else:
                    active_m_key = f"antigravity_{pool_data.get('active_num', 1)}"
                    if active_m_key in models_stat:
                        models_stat[active_m_key]["turns_count"] += msgs
                        models_stat[active_m_key]["input_tokens"] += in_t
                        models_stat[active_m_key]["output_tokens"] += out_t
                        models_stat[active_m_key]["total_tokens"] += in_t + out_t
            conn.close()
        except Exception:
            pass

    # Aggregate Antigravity sessions across accounts
    for s in all_sessions:
        sid = s["session_id"]
        chosen_acc = persistent_mapping.get(sid) or s.get("account_id") or "account_1"
        target_key = chosen_acc.replace("account_", "antigravity_")
        if target_key in models_stat:
            models_stat[target_key]["sessions_count"] += 1
            models_stat[target_key]["turns_count"] += s.get("message_count", 0)
            models_stat[target_key]["input_tokens"] += s.get("input_tokens", 0)
            models_stat[target_key]["output_tokens"] += s.get("output_tokens", 0)
            models_stat[target_key]["total_tokens"] += s.get("total_tokens", 0)

    # Sync real task counts back to pool accounts
    for i in USER_MAP.keys():
        acc_key = f"account_{i}"
        m_key = f"antigravity_{i}"
        if acc_key in pool_accounts and m_key in models_stat:
            real_sess = models_stat[m_key]["sessions_count"]
            real_turns = models_stat[m_key]["turns_count"]
            pool_accounts[acc_key]["total_tasks"] = real_sess
            pool_accounts[acc_key]["sessions_count"] = real_sess
            pool_accounts[acc_key]["turns_count"] = real_turns

    total_tokens_all = sum(m["total_tokens"] for m in models_stat.values())
    total_cost_usd = sum(m["cost_usd"] for m in models_stat.values())

    agy_tokens_all = sum(models_stat[f"antigravity_{i}"]["total_tokens"] for i in range(1, 5))
    agy_turns_count = sum(models_stat[f"antigravity_{i}"]["turns_count"] for i in range(1, 5))
    agy_sessions_count = sum(models_stat[f"antigravity_{i}"]["sessions_count"] for i in range(1, 5))

    aggregated_models = [
        {
            "id": "antigravity",
            "name": "Gemini 3.8 Flash (3-Account Cluster)",
            "display_name": "Google One AI Premium (Pool)",
            "tag": "Active Cluster",
            "provider": "Google DeepMind",
            "badge_color": "#6366f1",
            "sessions_count": agy_sessions_count,
            "turns_count": agy_turns_count,
            "input_tokens": sum(models_stat[f"antigravity_{i}"]["input_tokens"] for i in range(1, 5)),
            "output_tokens": sum(models_stat[f"antigravity_{i}"]["output_tokens"] for i in range(1, 5)),
            "total_tokens": agy_tokens_all,
            "cost_usd": 0.0,
            "is_free": True,
            "is_active": True,
            "tier_label": "Google One AI Premium",
            "role": "Heavy Web Coding & Server Guardian",
        },
        {
            "id": "deepseek",
            "name": "DeepSeek-V3",
            "display_name": "DeepSeek-V3",
            "tag": "Pay-as-you-go",
            "provider": "DeepSeek AI",
            "badge_color": "#0ea5e9",
            "sessions_count": models_stat["deepseek"]["sessions_count"],
            "turns_count": models_stat["deepseek"]["turns_count"],
            "input_tokens": models_stat["deepseek"]["input_tokens"],
            "output_tokens": models_stat["deepseek"]["output_tokens"],
            "total_tokens": models_stat["deepseek"]["total_tokens"],
            "cost_usd": round(models_stat["deepseek"]["cost_usd"], 4),
            "is_free": False,
            "is_active": models_stat["deepseek"]["sessions_count"] > 0,
            "tier_label": "$0.28 / 1M Input",
            "role": "Curhat, Companion & Moral Compass",
        },
        {
            "id": "local",
            "name": "Hermes Local Engine",
            "display_name": "Hermes Local Engine",
            "tag": "0-Token Daemon",
            "provider": "Local Host Machine",
            "badge_color": "#10b981",
            "sessions_count": models_stat["local"]["sessions_count"],
            "turns_count": models_stat["local"]["turns_count"],
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "cost_usd": 0.0,
            "is_free": True,
            "is_active": True,
            "tier_label": "0-Token Native",
            "role": "Pokémon, Finance OCR, Zepp, Weather & Cron",
        },
        {
            "id": "qwen",
            "name": "Qwen 3.8",
            "display_name": "Qwen 3.8",
            "tag": "Internal Gateway",
            "provider": "Wowrack APIGW",
            "badge_color": "#a855f7",
            "sessions_count": models_stat["qwen"]["sessions_count"],
            "turns_count": models_stat["qwen"]["turns_count"],
            "input_tokens": models_stat["qwen"]["input_tokens"],
            "output_tokens": models_stat["qwen"]["output_tokens"],
            "total_tokens": models_stat["qwen"]["total_tokens"],
            "cost_usd": 0.0,
            "is_free": True,
            "is_active": models_stat["qwen"]["sessions_count"] > 0,
            "tier_label": "Internal APIGW",
            "role": "Repetitive & Routine Tasks",
        },
    ]

    estimated_commercial_cost = (total_tokens_all / 1_000_000) * 3.00
    estimated_savings_usd = round(estimated_commercial_cost - total_cost_usd, 2)

    return {
        "summary": {
            "total_sessions": agy_sessions_count + models_stat["deepseek"]["sessions_count"] + models_stat["local"]["sessions_count"] + models_stat["qwen"]["sessions_count"],
            "total_turns": agy_turns_count + models_stat["deepseek"]["turns_count"] + models_stat["local"]["turns_count"] + models_stat["qwen"]["turns_count"],
            "total_tokens": total_tokens_all,
            "total_cost_usd": round(total_cost_usd, 4),
            "estimated_savings_usd": estimated_savings_usd,
            "last_updated": datetime.now().strftime("%d %b %Y, %H:%M WIB"),
            "active_antigravity_account": pool_accounts.get(active_account, pool_accounts["account_1"]),
        },
        "models": aggregated_models,
        "accounts": list(pool_accounts.values()),
        "pool_mode": pool_data["rotation_mode"],
    }


def get_session_detail_data(session_id: str, limit: int = 25, offset: int = 0, order: str = "desc") -> Dict[str, Any]:
    """Fetch paginated transcript turns with exact per-message LLM identification and account attribution."""
    lim = int(limit)
    off = int(offset)
    ord_val = str(order)

    # 1. Search Antigravity transcripts across all 4 pool users
    found = find_session_transcript(session_id)
    if found:
        t_file, native_acc_id = found
        turns = []
        pool_data = get_agy_pool_data()
        pool_accounts = pool_data["accounts"]
        acc_info = pool_accounts.get(native_acc_id, pool_accounts["account_1"])

        current_model_name = "Gemini 3.8 Flash"
        pending_user_chars = 0
        pending_process_chars = 0
        pending_tools = []
        pending_subagents = []
        pending_thinkings = []
        pending_tool_calls_list = []

        first_ts = None
        last_ts = None

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

                    if created_at:
                        try:
                            ts_val = datetime.fromisoformat(str(created_at).replace("Z", "+00:00")).timestamp()
                            if first_ts is None:
                                first_ts = ts_val
                            last_ts = ts_val
                        except Exception:
                            pass

                    # Collect intermediate thinking
                    if thinking and str(thinking).strip():
                        pending_thinkings.append(str(thinking).strip())

                    # Collect intermediate tools & subagent contributions
                    if tool_calls and isinstance(tool_calls, list):
                        for tc in tool_calls:
                            pending_tool_calls_list.append(tc)
                            tname = tc.get("name") or tc.get("tool") or "tool"
                            pending_tools.append(tname)
                            if tname == "invoke_subagent" and isinstance(tc.get("args"), dict):
                                subs = tc["args"].get("Subagents", [])
                                for sub in subs:
                                    role_name = sub.get("Role") or sub.get("TypeName")
                                    if role_name:
                                        pending_subagents.append(role_name)

                    # Detect per-turn model changes in prompts
                    if t_type == "USER_INPUT" and content:
                        pending_user_chars = len(content)
                        pending_process_chars = 0
                        pending_tools = []
                        pending_subagents = []
                        pending_thinkings = []
                        pending_tool_calls_list = []
                        m_match = re.search(r"Model Selection\`\s+from\s+.*?\s+to\s+([^\n<]+?)(?:\.\s+[A-Z]|\.\n|\n|<|$)", content)
                        if m_match:
                            raw_extracted = m_match.group(1).strip().rstrip(".")
                            current_model_name = raw_extracted
                        elif "gemini-3.7-pro" in content.lower() or "gemini 3.7 pro" in content.lower():
                            current_model_name = "Gemini 3.7 Pro"
                        elif "gemini-3.8-flash" in content.lower() or "gemini 3.8 flash" in content.lower():
                            current_model_name = "Gemini 3.8 Flash"
                        elif "gemini-3.7-flash" in content.lower() or "gemini 3.7 flash" in content.lower():
                            current_model_name = "Gemini 3.7 Flash"
                    else:
                        pending_process_chars += len(str(content)) + len(str(thinking))

                    display_content = clean_prompt_text(content) if role == "user" else clean_response_text(content)

                    # Filter out intermediate process steps, raw tool calls, and empty planner responses
                    if role not in ("user", "assistant"):
                        continue
                    if not display_content or not str(display_content).strip():
                        continue

                    # Deduplicate consecutive identical turns
                    if turns and turns[-1]["role"] == role and turns[-1]["content"] == display_content:
                        continue

                    # Per-message exact LLM metadata & contribution credit
                    if role == "assistant":
                        turn_model = obj.get("model") or obj.get("model_name") or current_model_name

                        req_in = max(15, int((pending_user_chars + pending_process_chars * 0.7) / 4))
                        req_out = max(10, int(len(display_content) / 4))
                        req_tot = req_in + req_out

                        contributors = [
                            {
                                "name": turn_model,
                                "role": "Lead Architect & AI Planner",
                                "account": f"{acc_info['short_name']}: {acc_info['email'] or acc_info.get('user', '')}",
                                "badge_color": acc_info["badge_color"],
                                "type": "model",
                            }
                        ]
                        for sub_role in list(dict.fromkeys(pending_subagents)):
                            contributors.append({
                                "name": f"Subagent ({sub_role})",
                                "role": "Background Autonomous Worker",
                                "account": acc_info["short_name"],
                                "badge_color": "#10b981",
                                "type": "subagent",
                            })
                        if pending_tools:
                            uniq_tools = list(dict.fromkeys(pending_tools))
                            tools_label = ", ".join(uniq_tools[:3]) + ("..." if len(uniq_tools) > 3 else "")
                            contributors.append({
                                "name": f"Tools ({tools_label})",
                                "role": f"{len(pending_tools)} Tool Execution Steps",
                                "account": "Local Engine",
                                "badge_color": "#f59e0b",
                                "type": "tools",
                            })

                        turn_credit = {
                            "account_id": native_acc_id,
                            "account_name": acc_info["name"],
                            "account_email": acc_info["email"],
                            "account_short": acc_info["short_name"],
                            "badge_color": acc_info["badge_color"],
                            "model_name": turn_model,
                            "contributors": contributors,
                            "input_tokens": req_in,
                            "output_tokens": req_out,
                            "total_tokens": req_tot,
                            "tools_count": len(pending_tools),
                            "cost_usd": 0.0,
                            "is_free": True,
                            "plan_tag": "Google One AI Premium",
                        }

                        turn_thinking = "\n\n".join(pending_thinkings) if pending_thinkings else (thinking or "")
                        turn_tool_calls = list(pending_tool_calls_list)

                        pending_user_chars = 0
                        pending_process_chars = 0
                        pending_tools = []
                        pending_subagents = []
                        pending_thinkings = []
                        pending_tool_calls_list = []
                    else:
                        turn_model = None
                        turn_credit = None
                        turn_thinking = ""
                        turn_tool_calls = []

                    turns.append({
                        "turn_id": len(turns),
                        "role": role,
                        "type": t_type,
                        "content": display_content,
                        "raw_content": content,
                        "thinking": turn_thinking,
                        "tool_calls": turn_tool_calls,
                        "timestamp": format_timestamp(created_at) if created_at else f"Turn #{len(turns)+1}",
                        "model_name": turn_model,
                        "credit": turn_credit,
                        "handler": {
                            "account_id": native_acc_id,
                            "short_name": acc_info["short_name"],
                            "email": acc_info["email"],
                            "badge_color": acc_info["badge_color"],
                            "tag": acc_info["tag"],
                            "name": acc_info["name"],
                        } if role == "assistant" else None,
                    })
                except Exception:
                    pass

        total_count = len(turns)
        if ord_val == "desc":
            turns.reverse()

        sliced = turns[off : off + lim]
        started_ts = first_ts or t_file.stat().st_mtime
        last_active_ts = last_ts or t_file.stat().st_mtime
        return {
            "session_id": session_id,
            "source": "antigravity-cli",
            "account_id": native_acc_id,
            "account_email": acc_info["email"],
            "account_name": acc_info["name"],
            "account_tag": acc_info["tag"],
            "account_badge_color": acc_info["badge_color"],
            "started_at": format_timestamp(started_ts),
            "started_ts": started_ts,
            "last_active": format_timestamp(last_active_ts),
            "last_active_ts": last_active_ts,
            "total_turns": total_count,
            "offset": off,
            "limit": lim,
            "order": ord_val,
            "has_more": (off + len(sliced)) < total_count,
            "turns": sliced,
        }

    # 2. Fallback to Hermes DB
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB))
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT model, source, started_at, ended_at FROM sessions WHERE id = ?", (session_id,))
            s_meta_row = cur.fetchone()
            if s_meta_row:
                raw_model_str = s_meta_row["model"] or "gemini"
                s_source_str = s_meta_row["source"] or "telegram"
                meta = resolve_model_meta(raw_model_str)

                pool_data = get_agy_pool_data()
                active_acc_id = pool_data.get("active_account_id", "account_1")
                active_acc = pool_data.get("accounts", {}).get(active_acc_id, {})
                acc_short = active_acc.get("short_name", "Akun 1")
                acc_name = active_acc.get("name", "Google One Pro")
                acc_email = active_acc.get("email", "Google One AI Premium")

                cur.execute("SELECT COUNT(*) FROM messages WHERE session_id = ?", (session_id,))
                total_count = cur.fetchone()[0]

                order_clause = "DESC" if ord_val == "desc" else "ASC"
                cur.execute(
                    f"SELECT id, role, content, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp {order_clause} LIMIT ? OFFSET ?",
                    (session_id, lim, off),
                )
                rows = cur.fetchall()
                turns = []
                for idx, r in enumerate(rows):
                    m_role = r["role"]
                    content_str = r["content"] or ""
                    in_tok = max(10, int(len(content_str) / 5))
                    out_tok = max(10, int(len(content_str) / 4))

                    if meta["id"] == "deepseek":
                        cost_val = round((in_tok * 0.28 + out_tok * 1.10) / 1_000_000, 6)
                        credit_info = {
                            "account_id": "deepseek",
                            "account_name": "DeepSeek API",
                            "account_email": "api.deepseek.com",
                            "account_short": "DeepSeek-V3",
                            "badge_color": "#0ea5e9",
                            "model_name": "DeepSeek-V3",
                            "contributors": [
                                {
                                    "name": "DeepSeek-V3",
                                    "role": "Moral Companion & Curhat Engine",
                                    "account": "DeepSeek API Server",
                                    "badge_color": "#0ea5e9",
                                    "type": "model",
                                }
                            ],
                            "input_tokens": in_tok,
                            "output_tokens": out_tok,
                            "total_tokens": in_tok + out_tok,
                            "tools_count": 0,
                            "cost_usd": cost_val,
                            "is_free": False,
                            "plan_tag": "DeepSeek-V3 Pay-as-you-go",
                        }
                        handler_info = {
                            "account_id": "deepseek",
                            "short_name": "DeepSeek",
                            "email": "api.deepseek.com",
                            "badge_color": "#0ea5e9",
                            "tag": "DeepSeek-V3",
                            "name": "DeepSeek-V3 (Moral Companion)",
                        }
                    elif meta["id"] == "qwen":
                        credit_info = {
                            "account_id": "qwen",
                            "account_name": "Wowrack APIGW",
                            "account_email": "apigw.wowrack.co.id",
                            "account_short": "Qwen 3.8",
                            "badge_color": "#a855f7",
                            "model_name": "Qwen 3.8",
                            "contributors": [
                                {
                                    "name": "Qwen 3.8",
                                    "role": "Routine & Fast Tasks",
                                    "account": "Wowrack Internal API",
                                    "badge_color": "#a855f7",
                                    "type": "model",
                                }
                            ],
                            "input_tokens": in_tok,
                            "output_tokens": out_tok,
                            "total_tokens": in_tok + out_tok,
                            "tools_count": 0,
                            "cost_usd": 0.0,
                            "is_free": True,
                            "plan_tag": "Wowrack APIGW Free Tier",
                        }
                        handler_info = {
                            "account_id": "qwen",
                            "short_name": "Qwen 3.8",
                            "email": "apigw.wowrack.co.id",
                            "badge_color": "#a855f7",
                            "tag": "Qwen 3.8",
                            "name": "Qwen 3.8 (APIGW)",
                        }
                    else:
                        badge_col = active_acc.get("badge_color", meta.get("badge_color", "#6366f1"))
                        credit_info = {
                            "account_id": active_acc_id,
                            "account_name": acc_name,
                            "account_email": acc_email,
                            "account_short": acc_short,
                            "badge_color": badge_col,
                            "model_name": meta["name"],
                            "contributors": [
                                {
                                    "name": meta["name"],
                                    "role": meta.get("category", "Google DeepMind Engine"),
                                    "account": f"{acc_name} ({acc_short})",
                                    "badge_color": badge_col,
                                    "type": "cluster",
                                }
                            ],
                            "input_tokens": in_tok,
                            "output_tokens": out_tok,
                            "total_tokens": in_tok + out_tok,
                            "tools_count": 0,
                            "cost_usd": 0.0,
                            "is_free": True,
                            "plan_tag": "Google One AI Pro Cluster (Active)",
                        }
                        handler_info = {
                            "account_id": active_acc_id,
                            "short_name": acc_short,
                            "email": acc_email,
                            "badge_color": badge_col,
                            "tag": meta["name"],
                            "name": f"{meta['name']} ({acc_short})",
                        }

                    turns.append({
                        "turn_id": off + idx,
                        "role": m_role,
                        "content": content_str,
                        "timestamp": format_timestamp(r["timestamp"]),
                        "model_name": meta["name"] if m_role == "assistant" else None,
                        "credit": credit_info if m_role == "assistant" else None,
                        "handler": handler_info if m_role == "assistant" else None,
                    })
                conn.close()

                acc_badge = active_acc.get("badge_color", meta.get("badge_color", "#6366f1")) if meta["id"] not in ("deepseek", "qwen") else meta["badge_color"]
                return {
                    "session_id": session_id,
                    "source": s_source_str,
                    "account_id": credit_info["account_id"] if turns and turns[-1].get("credit") else active_acc_id,
                    "account_email": credit_info["account_email"] if turns and turns[-1].get("credit") else acc_email,
                    "account_name": credit_info["account_name"] if turns and turns[-1].get("credit") else acc_name,
                    "account_tag": meta["name"],
                    "account_badge_color": acc_badge,
                    "total_turns": total_count,
                    "offset": off,
                    "limit": lim,
                    "order": ord_val,
                    "has_more": (off + len(turns)) < total_count,
                    "turns": turns,
                }
        except Exception:
            pass

    return None


def robust_rmtree(path: Path) -> bool:
    """Robustly delete a directory tree, falling back to sudo rm -rf if permissions are restricted."""
    if not path.exists():
        return True
    try:
        shutil.rmtree(path, ignore_errors=False)
        if not path.exists():
            return True
    except Exception:
        pass

    if path.exists():
        try:
            res = subprocess.run(["sudo", "rm", "-rf", str(path)], capture_output=True, timeout=10)
            return res.returncode == 0 and not path.exists()
        except Exception:
            pass
    return not path.exists()


def truncate_log_file(file_path: Path) -> bool:
    """Truncate a log file to 0 bytes safely."""
    if not file_path.exists():
        return True
    try:
        with open(file_path, "w") as f:
            f.truncate(0)
        return True
    except Exception:
        try:
            res = subprocess.run(["sudo", "truncate", "-s", "0", str(file_path)], capture_output=True, timeout=5)
            return res.returncode == 0
        except Exception:
            return False


def delete_session_by_id(session_id: str) -> bool:
    """Delete a specific session transcript and records across all pool brain directories, CLI databases, and Hermes databases."""
    deleted = False

    # 1. Delete AGY transcript folder in any brain directory
    for num, user, b_dir in BRAIN_DIRS:
        agy_dir = b_dir / session_id
        if agy_dir.exists():
            if robust_rmtree(agy_dir):
                deleted = True

    _AGY_SESSION_CACHE.pop(session_id, None)

    # 2. Delete from conversation_summaries.db across all user homes
    for user_name in USER_MAP.values():
        sum_db = Path(f"/home/{user_name}/.gemini/antigravity-cli/conversation_summaries.db")
        if sum_db.exists():
            try:
                with sqlite3.connect(str(sum_db), timeout=5.0) as conn:
                    cur = conn.cursor()
                    cur.execute("DELETE FROM conversation_summaries WHERE conversation_id = ?", (session_id,))
                    if cur.rowcount > 0:
                        deleted = True
                    conn.commit()
            except Exception:
                pass

    # 3. Delete from agy_session_accounts in portfolio.db
    try:
        with sqlite3.connect(str(PORTFOLIO_DB), timeout=5.0) as conn:
            conn.execute("DELETE FROM agy_session_accounts WHERE session_id = ?", (session_id,))
            conn.commit()
    except Exception:
        pass

    # 4. Delete Hermes SQLite session records
    if STATE_DB.exists():
        try:
            sconn = sqlite3.connect(str(STATE_DB), timeout=10.0)
            scur = sconn.cursor()
            scur.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
            if scur.rowcount > 0:
                deleted = True
            scur.execute("DELETE FROM session_model_usage WHERE session_id = ?", (session_id,))
            scur.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
            try:
                scur.execute("DELETE FROM delivery_obligations WHERE session_id = ?", (session_id,))
                scur.execute("DELETE FROM conversation_generations WHERE session_id = ?", (session_id,))
            except Exception:
                pass
            sconn.commit()
            scur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            sconn.close()
        except Exception:
            pass

    # 5. Delete from Router DB if present
    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB), timeout=10.0)
            rcur = rconn.cursor()
            rcur.execute("DELETE FROM llm_router_logs WHERE session_id = ?", (session_id,))
            rconn.commit()
            rcur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            rconn.close()
        except Exception:
            pass

    return deleted


def prune_sessions_older_than(days: int = 7) -> int:
    """Prune conversation logs, CLI summaries, and transcripts older than specified days."""
    cutoff_ts = time.time() - (days * 86400)
    pruned_count = 0
    pruned_ids = []

    # 1. Prune AGY transcript folders across all brain directories
    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue
        try:
            for conv_dir in list(b_dir.iterdir()):
                if not conv_dir.is_dir():
                    continue
                try:
                    t_file = conv_dir / ".system_generated" / "logs" / "transcript.jsonl"
                    if t_file.exists():
                        if t_file.stat().st_mtime < cutoff_ts:
                            if robust_rmtree(conv_dir):
                                _AGY_SESSION_CACHE.pop(conv_dir.name, None)
                                pruned_ids.append(conv_dir.name)
                                pruned_count += 1
                    else:
                        if robust_rmtree(conv_dir):
                            _AGY_SESSION_CACHE.pop(conv_dir.name, None)
                            pruned_ids.append(conv_dir.name)
                            pruned_count += 1
                except Exception:
                    pass
        except Exception:
            pass

    # 2. Prune from conversation_summaries.db across all users
    cutoff_iso = datetime.fromtimestamp(cutoff_ts).isoformat()
    for user_name in USER_MAP.values():
        sum_db = Path(f"/home/{user_name}/.gemini/antigravity-cli/conversation_summaries.db")
        if sum_db.exists():
            try:
                with sqlite3.connect(str(sum_db), timeout=5.0) as conn:
                    cur = conn.cursor()
                    if pruned_ids:
                        placeholders = ",".join(["?"] * len(pruned_ids))
                        cur.execute(f"DELETE FROM conversation_summaries WHERE conversation_id IN ({placeholders}) OR last_modified_time < ?", (*pruned_ids, cutoff_iso))
                    else:
                        cur.execute("DELETE FROM conversation_summaries WHERE last_modified_time < ?", (cutoff_iso,))
                    conn.commit()
            except Exception:
                pass

    # 3. Prune Hermes router logs
    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB), timeout=10.0)
            rcur = rconn.cursor()
            rcur.execute("DELETE FROM llm_router_logs WHERE timestamp < ?", (cutoff_ts,))
            rconn.commit()
            rcur.execute("VACUUM")
            rcur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            rconn.close()
        except Exception:
            pass

    # 4. Prune Hermes state.db
    if STATE_DB.exists():
        try:
            sconn = sqlite3.connect(str(STATE_DB), timeout=10.0)
            sconn.row_factory = sqlite3.Row
            scur = sconn.cursor()
            scur.execute("""
                SELECT s.id FROM sessions s
                WHERE COALESCE((SELECT MAX(m.timestamp) FROM messages m WHERE m.session_id = s.id), s.ended_at, s.started_at, 0) < ?
            """, (cutoff_ts,))
            expired_ids = [r["id"] for r in scur.fetchall()]
            if expired_ids:
                placeholders = ",".join(["?"] * len(expired_ids))
                scur.execute(f"DELETE FROM messages WHERE session_id IN ({placeholders}) OR timestamp < ?", (*expired_ids, cutoff_ts))
                scur.execute(f"DELETE FROM session_model_usage WHERE session_id IN ({placeholders})", expired_ids)
                scur.execute(f"DELETE FROM sessions WHERE id IN ({placeholders})", expired_ids)
                try:
                    scur.execute(f"DELETE FROM delivery_obligations WHERE session_id IN ({placeholders})", expired_ids)
                except Exception:
                    pass
            else:
                scur.execute("DELETE FROM messages WHERE timestamp < ?", (cutoff_ts,))
            sconn.commit()
            scur.execute("VACUUM")
            scur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            sconn.close()
        except Exception:
            pass

    return pruned_count


def clear_all_stored_sessions() -> int:
    """Clear all conversation logs, wipe CLI conversation summaries across all user profiles, and truncate all AI log files."""
    cleared_count = 0

    # 1. Clear AGY transcript folders across all brain directories
    for num, user, b_dir in BRAIN_DIRS:
        if not b_dir.exists():
            continue
        try:
            for conv_dir in list(b_dir.iterdir()):
                if not conv_dir.is_dir():
                    continue
                if robust_rmtree(conv_dir):
                    cleared_count += 1
        except Exception:
            pass

    # 2. Clear Antigravity CLI databases, summaries, history, and cache across all local users
    for user_name in USER_MAP.values():
        cli_base = Path(f"/home/{user_name}/.gemini/antigravity-cli")
        if not cli_base.exists():
            continue

        for sum_name in ["conversation_summaries.db", "conversation_summaries.db-wal", "conversation_summaries.db-shm"]:
            sum_f = cli_base / sum_name
            if sum_f.exists():
                try:
                    if sum_name == "conversation_summaries.db":
                        with sqlite3.connect(str(sum_f), timeout=5.0) as conn:
                            conn.execute("DELETE FROM conversation_summaries")
                            conn.commit()
                            conn.execute("VACUUM")
                    else:
                        sum_f.unlink(missing_ok=True)
                except Exception:
                    pass

        for sub in ["conversations", "annotations", "presence", "crashes", "log"]:
            sub_path = cli_base / sub
            if sub_path.exists() and sub_path.is_dir():
                for item in list(sub_path.iterdir()):
                    try:
                        if item.is_dir():
                            shutil.rmtree(item, ignore_errors=True)
                        else:
                            item.unlink(missing_ok=True)
                    except Exception:
                        pass

        for f_name in ["history.jsonl", "jetbox_summaries_proto.pb", "jetski_state.pbtxt"]:
            f_path = cli_base / f_name
            if f_path.exists():
                truncate_log_file(f_path)

        for cl in cli_base.glob("*.log"):
            truncate_log_file(cl)

    _AGY_SESSION_CACHE.clear()

    # Clear persistent account mapping table in portfolio.db
    if PORTFOLIO_DB.exists():
        try:
            with sqlite3.connect(str(PORTFOLIO_DB), timeout=5.0) as conn:
                conn.execute("DELETE FROM agy_session_accounts")
                conn.commit()
        except Exception:
            pass

    # 3. Reset Hermes Router DB
    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB), timeout=10.0)
            rcur = rconn.cursor()
            rcur.execute("DELETE FROM llm_router_logs")
            rconn.commit()
            rcur.execute("VACUUM")
            rcur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            rconn.close()
        except Exception:
            pass

    # 4. Reset Hermes State DB
    if STATE_DB.exists():
        try:
            sconn = sqlite3.connect(str(STATE_DB), timeout=10.0)
            scur = sconn.cursor()
            scur.execute("DELETE FROM messages")
            scur.execute("DELETE FROM session_model_usage")
            scur.execute("DELETE FROM sessions")
            try:
                scur.execute("DELETE FROM delivery_obligations")
                scur.execute("DELETE FROM conversation_generations")
            except Exception:
                pass
            sconn.commit()
            scur.execute("VACUUM")
            scur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            sconn.close()
        except Exception:
            pass

    # Hermes session directories and CLI history
    for s_dir in [HOME_DIR / ".hermes" / "sessions", HOME_DIR / ".hermes" / "terminal-sessions"]:
        if s_dir.exists() and s_dir.is_dir():
            for item in list(s_dir.iterdir()):
                try:
                    if item.is_dir():
                        shutil.rmtree(item, ignore_errors=True)
                    else:
                        item.unlink(missing_ok=True)
                except Exception:
                    pass

    hermes_hist = HOME_DIR / ".hermes" / ".hermes_history"
    if hermes_hist.exists():
        truncate_log_file(hermes_hist)

    # 5. Truncate all AI & MCP log files across the ecosystem
    log_patterns = [
        str(HOME_DIR / ".hermes" / "logs" / "*.log"),
        str(HOME_DIR / ".hermes" / "*.log"),
        str(HOME_DIR / "mcp-*" / "*.log"),
        str(HOME_DIR / "orchestrator" / "*.log"),
        str(HOME_DIR / ".crawl4ai" / "*.log"),
        str(HOME_DIR / "second-brain" / "engine" / "*.log"),
        str(HOME_DIR / "scripts" / "*.log"),
        "/home/arusuka/.gemini/antigravity-cli/*.log",
        "/home/arusuka2/.gemini/antigravity-cli/*.log",
        "/home/arusuka3/.gemini/antigravity-cli/*.log",
        "/home/arusuka4/.gemini/antigravity-cli/*.log",
    ]
    for pattern in log_patterns:
        for fpath in glob.glob(pattern):
            truncate_log_file(Path(fpath))

    # 6. Reset agy-pool state task counters
    if POOL_STATE_FILE.exists():
        try:
            pool_data = json.loads(POOL_STATE_FILE.read_text(encoding="utf-8"))
            for acc_k in pool_data.get("accounts", {}):
                pool_data["accounts"][acc_k]["total_tasks"] = 0
                pool_data["accounts"][acc_k]["errors_count"] = 0
            pool_data["updated_at"] = datetime.now().isoformat()
            POOL_STATE_FILE.write_text(json.dumps(pool_data, indent=2), encoding="utf-8")
        except Exception:
            pass

    return cleared_count
