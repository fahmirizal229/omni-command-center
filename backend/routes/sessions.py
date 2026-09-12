"""
Hermes AI Session History & Multi-LLM Performance Inspector API
Provides session listing, full turn transcripts with exact LLM model attribution,
and multi-LLM comparative analytics across Antigravity, DeepSeek, Groq, Mistral, OpenRouter & Google AI.
"""

import os
import json
import time
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from backend.config import HOME_DIR
from backend.security import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["Hermes Sessions & LLM Analytics"])

STATE_DB = HOME_DIR / ".hermes" / "state.db"
ROUTER_DB = HOME_DIR / ".hermes" / "router_logs.db"

MODEL_METADATA_MAP = {
    "antigravity": {
        "name": "Antigravity (Gemini 3.7 Flash)",
        "provider": "Google DeepMind / AGY",
        "badge_color": "#6366f1",
        "category": "Heavy Engineering & Server Guardian",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "100% eksklusif untuk Web Coding, Scripting, Arsitektur Backend, Modifikasi File & Server Guardian."
    },
    "deepseek": {
        "name": "DeepSeek-V3",
        "provider": "DeepSeek AI",
        "badge_color": "#0ea5e9",
        "category": "Paid Curhat & Moral Companion",
        "is_free": False,
        "cost_per_1k": 0.00028,
        "policy": "Khusus Sesi Curhat Mendalam, Diskusi Moral, Asmara, dan Evaluasi Diri (Strict Economized)."
    },
    "deepseek-chat": {
        "name": "DeepSeek-V3",
        "provider": "DeepSeek AI",
        "badge_color": "#0ea5e9",
        "category": "Paid Curhat & Moral Companion",
        "is_free": False,
        "cost_per_1k": 0.00028,
        "policy": "Khusus Sesi Curhat Mendalam, Diskusi Moral, Asmara, dan Evaluasi Diri."
    },
    "groq": {
        "name": "Groq LPU (Llama 3.3 70B)",
        "provider": "Groq LPU",
        "badge_color": "#f59e0b",
        "category": "100% Free Fast Inference",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Daily small talk, sapaan pagi/malam, tanya jawab kilat, dan transkrip Voice Note Telegram."
    },
    "openai/gpt-oss-120b": {
        "name": "Groq LPU (Fast Inference)",
        "provider": "Groq LPU",
        "badge_color": "#f59e0b",
        "category": "100% Free Fast Inference",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Fast casual Q&A dan voice transcription."
    },
    "mistral": {
        "name": "Mistral Small Latest",
        "provider": "Mistral AI",
        "badge_color": "#ef4444",
        "category": "Structured Reasoning & Content",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Rangkuman teks panjang, penalaran multibahasa, dan pembuatan konten terstruktur."
    },
    "mistral-small-latest": {
        "name": "Mistral Small Latest",
        "provider": "Mistral AI",
        "badge_color": "#ef4444",
        "category": "Structured Reasoning & Content",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Rangkuman teks panjang & konten terstruktur."
    },
    "openrouter": {
        "name": "Nemotron 3.5 Lightning (Free)",
        "provider": "OpenRouter / NVIDIA",
        "badge_color": "#10b981",
        "category": "General Intelligence & Reasoning",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Penalaran umum (general intelligence), backup obrolan bebas non-coding tanpa biaya."
    },
    "nvidia/nemotron-3.5-lightning:free": {
        "name": "Nemotron 3.5 Lightning",
        "provider": "OpenRouter / NVIDIA",
        "badge_color": "#10b981",
        "category": "General Intelligence & Reasoning",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Penalaran umum & backup obrolan bebas."
    },
    "google_ai": {
        "name": "Gemini 2.0 Flash Lite",
        "provider": "Google AI Studio",
        "badge_color": "#8b5cf6",
        "category": "Free Multimodal & Long Context",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Analisis dokumen panjang, ringkasan artikel web, dan tugas multimodal (gambar/PDF)."
    },
    "gemini-3.5-flash-lite": {
        "name": "Gemini 2.0 Flash Lite",
        "provider": "Google AI Studio",
        "badge_color": "#8b5cf6",
        "category": "Free Multimodal & Long Context",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Dokumen panjang & tugas multimodal."
    }
}

def resolve_model_meta(raw_model: Optional[str]) -> Dict[str, Any]:
    """Normalize model string to rich visual display metadata."""
    if not raw_model:
        return MODEL_METADATA_MAP["antigravity"]
    
    key = str(raw_model).lower().strip()
    if key in MODEL_METADATA_MAP:
        return MODEL_METADATA_MAP[key]
    
    for k, meta in MODEL_METADATA_MAP.items():
        if k in key:
            return meta
            
    # Default fallback
    return {
        "name": raw_model,
        "provider": "Custom LLM Provider",
        "badge_color": "#a855f7",
        "category": "Custom Inference",
        "is_free": True,
        "cost_per_1k": 0.0,
        "policy": "Custom routed LLM turn."
    }

def format_timestamp(ts: Any) -> str:
    """Safely convert unix timestamp or string to formatted date."""
    if not ts:
        return "-"
    try:
        val = float(ts)
        dt = datetime.fromtimestamp(val)
        return dt.strftime("%d %b %Y, %H:%M:%S")
    except Exception:
        return str(ts)

@router.get("")
def list_sessions(
    search: Optional[str] = None,
    model: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 60,
    current_user: str = Depends(get_current_user)
):
    """Retrieve all Hermes conversation sessions with summarized LLM metrics."""
    sessions = []
    
    # Clean up non-string query defaults when invoked directly
    search_str = search if isinstance(search, str) and search.strip() else None
    model_str = model if isinstance(model, str) and model.strip() else None
    source_str = source if isinstance(source, str) and source.strip() else None
    limit_val = limit if isinstance(limit, int) and limit > 0 else 60
    
    if not STATE_DB.exists():
        return {"sessions": [], "total": 0}
        
    try:
        conn = sqlite3.connect(str(STATE_DB), timeout=5.0)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Load model usage map
        usage_map = {}
        try:
            cur.execute("""
                SELECT session_id, model, SUM(input_tokens) as in_tok, SUM(output_tokens) as out_tok, 
                       SUM(estimated_cost_usd) as cost, COUNT(*) as api_calls
                FROM session_model_usage
                GROUP BY session_id, model
            """)
            for r in cur.fetchall():
                sid = r["session_id"]
                usage_map.setdefault(sid, []).append(dict(r))
        except Exception:
            pass

        # Load router logs map if available
        router_map = {}
        if ROUTER_DB.exists():
            try:
                rconn = sqlite3.connect(str(ROUTER_DB), timeout=5.0)
                rconn.row_factory = sqlite3.Row
                rcur = rconn.cursor()
                rcur.execute("SELECT session_id, route, model, category, latency_ms FROM llm_router_logs")
                for r in rcur.fetchall():
                    sid = r["session_id"]
                    if sid:
                        router_map.setdefault(sid, []).append(dict(r))
                rconn.close()
            except Exception:
                pass

        # Query main sessions table
        query = """
            SELECT s.id, s.source, s.started_at, s.ended_at, s.model, s.title, s.message_count,
                   s.input_tokens, s.output_tokens, s.estimated_cost_usd, s.actual_cost_usd,
                   (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as real_msg_count,
                   (SELECT content FROM messages m WHERE m.session_id = s.id AND m.role = 'user' ORDER BY m.timestamp DESC LIMIT 1) as last_user_query,
                   (SELECT content FROM messages m WHERE m.session_id = s.id AND m.role = 'assistant' ORDER BY m.timestamp DESC LIMIT 1) as last_ai_response,
                   (SELECT timestamp FROM messages m WHERE m.session_id = s.id ORDER BY m.timestamp DESC LIMIT 1) as last_msg_time
            FROM sessions s
            ORDER BY COALESCE(s.started_at, 0) DESC
        """
        cur.execute(query)
        rows = cur.fetchall()
        
        for r in rows:
            sid = r["id"]
            raw_model = r["model"] or "antigravity"
            
            # Check models used from router logs and session_model_usage
            distinct_models = set()
            if raw_model:
                distinct_models.add(raw_model)
                
            if sid in usage_map:
                for u in usage_map[sid]:
                    if u.get("model"):
                        distinct_models.add(u["model"])
                        
            if sid in router_map:
                for rm in router_map[sid]:
                    if rm.get("model"):
                        distinct_models.add(rm["model"])
                    elif rm.get("route"):
                        distinct_models.add(rm["route"])

            models_info = [resolve_model_meta(m) for m in distinct_models]
            primary_meta = models_info[0] if models_info else resolve_model_meta(raw_model)
            
            # Formulate user preview
            last_q = (r["last_user_query"] or "").strip()
            if len(last_q) > 140:
                last_q = last_q[:137] + "..."
                
            last_ans = (r["last_ai_response"] or "").strip()
            if len(last_ans) > 160:
                last_ans = last_ans[:157] + "..."
                
            started_ts = r["started_at"]
            last_ts = r["last_msg_time"] or started_ts
            
            sess_source = r["source"] or "telegram"
            if sid.startswith("cron_"):
                sess_source = "cron"

            title = r["title"] or last_q or f"Session {sid[:12]}"
            
            # Filter checks
            if search_str:
                s_lower = search_str.lower()
                if s_lower not in sid.lower() and s_lower not in title.lower() and s_lower not in last_q.lower() and s_lower not in last_ans.lower():
                    continue
                    
            if model_str:
                m_lower = model_str.lower()
                matched = any(m_lower in m["name"].lower() or m_lower in m["provider"].lower() for m in models_info)
                if not matched:
                    continue
                    
            if source_str:
                if source_str.lower() not in sess_source.lower():
                    continue

            sessions.append({
                "session_id": sid,
                "title": title,
                "source": sess_source,
                "started_at": format_timestamp(started_ts),
                "started_ts": started_ts,
                "last_active": format_timestamp(last_ts),
                "last_active_ts": last_ts,
                "message_count": max(r["message_count"] or 0, r["real_msg_count"] or 0),
                "primary_model": primary_meta,
                "models_used": models_info,
                "total_tokens": (r["input_tokens"] or 0) + (r["output_tokens"] or 0),
                "input_tokens": r["input_tokens"] or 0,
                "output_tokens": r["output_tokens"] or 0,
                "estimated_cost_usd": r["estimated_cost_usd"] or 0.0,
                "last_user_query": last_q,
                "last_ai_response": last_ans,
            })
            
            if len(sessions) >= limit_val:
                break
                
        conn.close()
    except Exception as e:
        print(f"Error loading sessions: {e}")
        return {"sessions": [], "error": str(e), "total": 0}

    return {
        "sessions": sessions,
        "total": len(sessions)
    }

@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    current_user: str = Depends(get_current_user)
):
    """Retrieve full message history and LLM metadata for a specific session."""
    if not STATE_DB.exists():
        raise HTTPException(status_code=404, detail="Hermes database not found.")
        
    try:
        conn = sqlite3.connect(str(STATE_DB), timeout=5.0)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # 1. Fetch Session Info
        cur.execute("SELECT * FROM sessions WHERE id = ?", (session_id,))
        sess_row = cur.fetchone()
        if not sess_row:
            # Check if messages exist anyway
            cur.execute("SELECT COUNT(*) FROM messages WHERE session_id = ?", (session_id,))
            if cur.fetchone()[0] == 0:
                conn.close()
                raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found.")
            sess_dict = {"id": session_id, "model": "antigravity", "title": f"Session {session_id[:12]}"}
        else:
            sess_dict = dict(sess_row)

        # 2. Fetch Router Logs for Turn Attribution
        router_turns = []
        if ROUTER_DB.exists():
            try:
                rconn = sqlite3.connect(str(ROUTER_DB), timeout=5.0)
                rconn.row_factory = sqlite3.Row
                rcur = rconn.cursor()
                rcur.execute("SELECT * FROM llm_router_logs WHERE session_id = ? ORDER BY timestamp ASC", (session_id,))
                router_turns = [dict(r) for r in rcur.fetchall()]
                rconn.close()
            except Exception:
                pass

        # 3. Fetch Messages
        cur.execute("""
            SELECT id, role, content, tool_name, tool_call_id, tool_calls, timestamp,
                   token_count, finish_reason, reasoning, reasoning_content, display_kind
            FROM messages
            WHERE session_id = ?
            ORDER BY timestamp ASC, id ASC
        """, (session_id,))
        msg_rows = cur.fetchall()
        
        messages = []
        turn_idx = 0
        
        for m in msg_rows:
            role = m["role"]
            content = m["content"] or ""
            ts = m["timestamp"]
            
            meta = None
            latency_ms = None
            category = None
            
            # Match assistant turn with router logs
            if role == "assistant":
                if turn_idx < len(router_turns):
                    rt = router_turns[turn_idx]
                    meta = resolve_model_meta(rt.get("model") or rt.get("route"))
                    latency_ms = rt.get("latency_ms")
                    category = rt.get("category")
                    turn_idx += 1
                else:
                    meta = resolve_model_meta(sess_dict.get("model") or "antigravity")
                    category = meta.get("category")
            
            # Parse tool calls
            parsed_tools = []
            if m["tool_calls"]:
                try:
                    raw_tc = json.loads(m["tool_calls"])
                    if isinstance(raw_tc, list):
                        parsed_tools = raw_tc
                except Exception:
                    pass

            messages.append({
                "id": m["id"],
                "role": role,
                "content": content,
                "timestamp": format_timestamp(ts),
                "raw_timestamp": ts,
                "token_count": m["token_count"] or 0,
                "reasoning": m["reasoning"] or m["reasoning_content"] or "",
                "tool_name": m["tool_name"],
                "tool_calls": parsed_tools,
                "model_info": meta,
                "latency_ms": latency_ms,
                "category": category,
            })
            
        conn.close()
        
        primary_meta = resolve_model_meta(sess_dict.get("model") or "antigravity")
        
        return {
            "session": {
                "id": session_id,
                "title": sess_dict.get("title") or f"Session {session_id[:12]}",
                "started_at": format_timestamp(sess_dict.get("started_at")),
                "source": sess_dict.get("source") or "telegram",
                "primary_model": primary_meta,
                "message_count": len(messages),
                "input_tokens": sess_dict.get("input_tokens") or 0,
                "output_tokens": sess_dict.get("output_tokens") or 0,
                "estimated_cost_usd": sess_dict.get("estimated_cost_usd") or 0.0,
            },
            "messages": messages,
            "total_messages": len(messages)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching session detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/models")
def get_model_analytics(
    current_user: str = Depends(get_current_user)
):
    """Aggregate multi-LLM routing telemetry and model evaluation statistics."""
    model_stats = {
        "antigravity": {
            **MODEL_METADATA_MAP["antigravity"],
            "key": "antigravity",
            "calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "avg_latency_ms": 0,
            "total_cost_usd": 0.0,
            "status": "Active (Protected Quota)"
        },
        "deepseek": {
            **MODEL_METADATA_MAP["deepseek"],
            "key": "deepseek",
            "calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "avg_latency_ms": 0,
            "total_cost_usd": 0.0,
            "status": "Active (Paid Economized)"
        },
        "groq": {
            **MODEL_METADATA_MAP["groq"],
            "key": "groq",
            "calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "avg_latency_ms": 0,
            "total_cost_usd": 0.0,
            "status": "Active (100% Free)"
        },
        "mistral": {
            **MODEL_METADATA_MAP["mistral"],
            "key": "mistral",
            "calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "avg_latency_ms": 0,
            "total_cost_usd": 0.0,
            "status": "Active (Cloud Open-Source)"
        },
        "openrouter": {
            **MODEL_METADATA_MAP["openrouter"],
            "key": "openrouter",
            "calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "avg_latency_ms": 0,
            "total_cost_usd": 0.0,
            "status": "Active (Free Open-Source)"
        },
        "google_ai": {
            **MODEL_METADATA_MAP["google_ai"],
            "key": "google_ai",
            "calls": 0,
            "total_tokens": 0,
            "total_latency_ms": 0,
            "avg_latency_ms": 0,
            "total_cost_usd": 0.0,
            "status": "Active (Free Multimodal)"
        }
    }

    # 1. Aggregate from Router Logs DB
    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB), timeout=5.0)
            rconn.row_factory = sqlite3.Row
            rcur = rconn.cursor()
            rcur.execute("""
                SELECT route, model, COUNT(*) as cnt, AVG(latency_ms) as avg_lat,
                       SUM(prompt_tokens + completion_tokens) as tok, SUM(cost_usd) as cost
                FROM llm_router_logs
                GROUP BY route
            """)
            for r in rcur.fetchall():
                route = (r["route"] or "").lower()
                target_key = "antigravity"
                for k in model_stats:
                    if k in route:
                        target_key = k
                        break
                st = model_stats[target_key]
                st["calls"] += r["cnt"] or 0
                st["total_tokens"] += r["tok"] or 0
                st["total_cost_usd"] += r["cost"] or 0.0
                st["avg_latency_ms"] = round(r["avg_lat"] or 0)
            rconn.close()
        except Exception as e:
            print(f"Error reading router analytics: {e}")

    # 2. Aggregate from Session Model Usage (state.db)
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB), timeout=5.0)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
                SELECT model, SUM(api_call_count) as calls, SUM(input_tokens + output_tokens) as tokens, SUM(estimated_cost_usd) as cost
                FROM session_model_usage
                GROUP BY model
            """)
            for r in cur.fetchall():
                m_name = (r["model"] or "").lower()
                target_key = "antigravity"
                for k in model_stats:
                    if k in m_name:
                        target_key = k
                        break
                st = model_stats[target_key]
                st["calls"] += r["calls"] or 0
                st["total_tokens"] += r["tokens"] or 0
                st["total_cost_usd"] += r["cost"] or 0.0
            conn.close()
        except Exception as e:
            print(f"Error reading state.db usage: {e}")

    # Calculate overall total calls
    total_calls = sum(m["calls"] for m in model_stats.values())
    
    analytics_list = list(model_stats.values())
    for item in analytics_list:
        if total_calls > 0:
            item["usage_share_percent"] = round((item["calls"] / total_calls) * 100, 1)
        else:
            item["usage_share_percent"] = 0.0

    return {
        "models": analytics_list,
        "total_requests": total_calls,
        "policy_rule": "LLM Workload Allocation & Quota Protection Policy",
        "last_synced": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }


@router.post("/prune")
def prune_inactive_sessions(
    days: int = Query(7, ge=1, le=365),
    current_user: str = Depends(get_current_user)
):
    """Purge chat sessions and logs older than N days (default: 7 days)."""
    from backend.retention_cleaner import clean_retention
    result = clean_retention(days=days, verbose=False)
    return {
        "success": result["success"],
        "message": f"Berhasil membersihkan data chat & log yang tidak aktif lebih dari {days} hari.",
        "stats": result
    }


@router.post("/reset")
def hard_reset_sessions(
    current_user: str = Depends(get_current_user)
):
    """Completely clear all session histories, message transcripts, and router logs."""
    from backend.retention_cleaner import reset_all_logs
    result = reset_all_logs(verbose=False)
    return {
        "success": result["success"],
        "message": "Seluruh riwayat obrolan dan log LLM telah di-reset ke nol.",
        "stats": result
    }

