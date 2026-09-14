#!/usr/bin/env python3
"""
Hermes AI Log & Session Auto-Retention Cleaner
Automatically purges inactive chat sessions, message transcripts, and usage logs
older than a configurable retention period (default: 7 days).
"""

import sys
import time
import argparse
import sqlite3
from pathlib import Path
from datetime import datetime

STATE_DB = Path.home() / ".hermes" / "state.db"
ROUTER_DB = Path.home() / ".hermes" / "router_logs.db"


def clean_retention(days: int = 7, verbose: bool = True) -> dict:
    cutoff_ts = time.time() - (days * 86400)
    cutoff_date_str = datetime.fromtimestamp(cutoff_ts).strftime("%Y-%m-%d %H:%M:%S")
    
    if verbose:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting Hermes Retention Cleaner (Retention: {days} days, Cutoff: {cutoff_date_str})")
        
    stats = {
        "days": days,
        "cutoff_ts": cutoff_ts,
        "cutoff_date": cutoff_date_str,
        "deleted_sessions": 0,
        "deleted_messages": 0,
        "deleted_usage": 0,
        "deleted_router_logs": 0,
        "success": True,
        "error": None
    }

    # 1. Clean ~/.hermes/state.db
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB), timeout=10.0)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()

            # Find sessions where last message timestamp OR started_at is older than cutoff
            cur.execute("""
                SELECT s.id 
                FROM sessions s
                WHERE COALESCE((SELECT MAX(m.timestamp) FROM messages m WHERE m.session_id = s.id), s.ended_at, s.started_at, 0) < ?
            """, (cutoff_ts,))
            
            expired_session_ids = [r["id"] for r in cur.fetchall()]
            
            if expired_session_ids:
                # Delete messages belonging to expired sessions OR messages strictly older than cutoff
                placeholders = ",".join(["?"] * len(expired_session_ids))
                cur.execute(f"DELETE FROM messages WHERE session_id IN ({placeholders}) OR timestamp < ?", (*expired_session_ids, cutoff_ts))
                stats["deleted_messages"] = cur.rowcount
                
                # Delete session model usage
                cur.execute(f"DELETE FROM session_model_usage WHERE session_id IN ({placeholders})", expired_session_ids)
                stats["deleted_usage"] = cur.rowcount

                # Delete expired sessions
                cur.execute(f"DELETE FROM sessions WHERE id IN ({placeholders})", expired_session_ids)
                stats["deleted_sessions"] = cur.rowcount
            else:
                # Still check orphaned or old messages
                cur.execute("DELETE FROM messages WHERE timestamp < ?", (cutoff_ts,))
                stats["deleted_messages"] = cur.rowcount

            # Delete old delivery obligations older than cutoff
            try:
                cur.execute("DELETE FROM delivery_obligations WHERE created_at < ?", (cutoff_ts,))
            except Exception:
                pass

            conn.commit()
            cur.execute("VACUUM")
            conn.close()
            
            if verbose:
                print(f"  state.db cleaned: {stats['deleted_sessions']} sessions, {stats['deleted_messages']} messages pruned.")
        except Exception as e:
            stats["success"] = False
            stats["error"] = str(e)
            if verbose:
                print(f"  Error cleaning state.db: {e}", file=sys.stderr)

    # 2. Clean ~/.hermes/router_logs.db
    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB), timeout=10.0)
            rcur = rconn.cursor()
            rcur.execute("DELETE FROM llm_router_logs WHERE timestamp < ?", (cutoff_ts,))
            stats["deleted_router_logs"] = rcur.rowcount
            rconn.commit()
            rcur.execute("VACUUM")
            try:
                rcur.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            except Exception:
                pass
            rconn.close()
            if verbose:
                print(f"  router_logs.db cleaned: {stats['deleted_router_logs']} logs pruned.")
        except Exception as e:
            if verbose:
                print(f"  Error cleaning router_logs.db: {e}", file=sys.stderr)

    return stats


def reset_all_logs(verbose: bool = True) -> dict:
    """Hard reset: clear all sessions, messages, and router logs to start completely from scratch."""
    stats = {
        "deleted_sessions": 0,
        "deleted_messages": 0,
        "deleted_usage": 0,
        "deleted_router_logs": 0,
        "success": True,
        "error": None
    }
    
    if STATE_DB.exists():
        try:
            conn = sqlite3.connect(str(STATE_DB), timeout=10.0)
            cur = conn.cursor()
            cur.execute("DELETE FROM messages")
            stats["deleted_messages"] = cur.rowcount
            cur.execute("DELETE FROM sessions")
            stats["deleted_sessions"] = cur.rowcount
            cur.execute("DELETE FROM session_model_usage")
            stats["deleted_usage"] = cur.rowcount
            try:
                cur.execute("DELETE FROM delivery_obligations")
                cur.execute("DELETE FROM conversation_generations")
            except Exception:
                pass
            conn.commit()
            cur.execute("VACUUM")
            conn.close()
        except Exception as e:
            stats["success"] = False
            stats["error"] = str(e)

    if ROUTER_DB.exists():
        try:
            rconn = sqlite3.connect(str(ROUTER_DB), timeout=10.0)
            rcur = rconn.cursor()
            rcur.execute("DELETE FROM llm_router_logs")
            stats["deleted_router_logs"] = rcur.rowcount
            rconn.commit()
            rcur.execute("VACUUM")
            rconn.close()
        except Exception:
            pass

    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Hermes Log & Session Retention Cleaner")
    parser.add_argument("--days", type=int, default=7, help="Retention period in days (default: 7)")
    parser.add_argument("--reset-all", action="store_true", help="Clear all sessions and messages completely")
    args = parser.parse_args()

    if args.reset_all:
        res = reset_all_logs(verbose=True)
        print(f"Reset complete: {res}")
    else:
        res = clean_retention(days=args.days, verbose=True)
        print(f"Retention clean complete: {res}")
