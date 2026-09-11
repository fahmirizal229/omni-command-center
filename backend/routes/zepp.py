"""
Zepp & Amazfit Fitness Metrics API router (/api/zepp).
"""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends

from backend.config import zepp_client_instance
from backend.security import get_current_user

router = APIRouter(prefix="/api/zepp", tags=["Zepp Fitness"])


@router.get("")
def get_zepp_fitness_data(current_user: str = Depends(get_current_user)):
    """Fetch live Amazfit / Zepp step, calories, distance, and sleep metrics."""
    if not zepp_client_instance:
        return {"status": "unconfigured", "message": "Modul Zepp MCP belum diinisialisasi."}

    today_str = datetime.now().strftime("%Y-%m-%d")
    week_ago_str = (datetime.now() - timedelta(days=6)).strftime("%Y-%m-%d")

    try:
        records = zepp_client_instance.get_band_data_summary(week_ago_str, today_str)
        history = []
        last_valid_sleep = None
        today_data = None

        for rec in records:
            summary = rec.get("summary", {})
            stp = summary.get("stp", {})
            slp = summary.get("slp", {})
            
            ttl_steps = stp.get("ttl", 0) or 0
            goal = summary.get("goal", 8000) or 8000
            dis_m = stp.get("dis", 0) or 0
            cal = stp.get("cal", 0) or 0
            wk = stp.get("wk", 0) or 0
            rn = stp.get("rn", 0) or 0
            
            dp = slp.get("dp", 0) or 0
            lt = slp.get("lt", 0) or 0
            ss = slp.get("ss", 0) or 0
            awake = slp.get("wk", 0) or 0
            total_sleep = dp + lt + ss

            item = {
                "date": rec.get("date"),
                "steps": ttl_steps,
                "goal": goal,
                "goal_percent": min(100, round((ttl_steps / goal) * 100, 1)) if goal > 0 else 0,
                "distance_km": round(dis_m / 1000.0, 2),
                "calories_kcal": cal,
                "calorie": cal,
                "calories": cal,
                "active_calories": cal,
                "active_mins": wk + rn,
                "sleep_mins": total_sleep,
                "sleep_hours": f"{total_sleep // 60}j {total_sleep % 60}m" if total_sleep > 0 else "0j",
                "deep_sleep_mins": dp,
                "light_sleep_mins": lt,
                "rem_mins": ss,
                "awake_mins": awake,
            }
            history.append(item)
            if total_sleep > 0:
                last_valid_sleep = item
            if rec.get("date") == today_str:
                today_data = item

        if not today_data and history:
            today_data = history[-1]

        return {
            "status": "synced",
            "today": today_data or {
                "date": today_str,
                "steps": 0,
                "goal": 8000,
                "goal_percent": 0,
                "distance_km": 0,
                "calories_kcal": 0,
                "calorie": 0,
                "calories": 0,
                "active_mins": 0,
                "sleep_mins": 0,
                "sleep_hours": "0j"
            },
            "last_sleep": last_valid_sleep,
            "history_7days": history
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
