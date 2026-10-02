"""
Diet & Nutrition API router (/api/diet).
Integrates with local SQLite nutrition.db and nutrition_engine.py.
"""

import sys
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import date
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from backend.security import get_current_user

# Ensure nutrition engine path is importable
NUTRITION_DIR = Path("/home/arusuka/nutrition")
if str(NUTRITION_DIR) not in sys.path:
    sys.path.append(str(NUTRITION_DIR))

try:
    import nutrition_engine as ne
except Exception as e:
    ne = None

router = APIRouter(prefix="/api/diet", tags=["Diet & Nutrition"])


class MealCreateRequest(BaseModel):
    food_name: str
    calories: float
    protein_g: float = 0.0
    carbs_g: float = 0.0
    fat_g: float = 0.0
    meal_type: str = "snack"
    target_date: Optional[str] = None
    notes: str = ""


class WeightLogRequest(BaseModel):
    weight_kg: float
    waist_cm: Optional[float] = None
    notes: str = ""
    target_date: Optional[str] = None


class FastingStartRequest(BaseModel):
    target_hours: float = 23.0
    protocol_name: str = "OMAD (23:1)"


@router.get("/summary")
def get_daily_diet_summary(target_date: Optional[str] = None, current_user: str = Depends(get_current_user)):
    """Fetch daily calorie budget, macro intake, Zepp active calorie balance, and OMAD fasting status."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    
    d_str = target_date or date.today().strftime("%Y-%m-%d")
    raw_summary = ne.get_daily_summary(d_str)
    raw_fasting = ne.get_fast_status()
    raw_profile = ne.get_profile()
    raw_water = ne.get_water_status(d_str)

    intake = raw_summary.get("intake", {})
    target_comp = raw_summary.get("target_comparison", {})
    profile_tdee = raw_profile.get("tdee_analysis", {})
    standard_targets = profile_tdee.get("targets", {})
    standard_macros = profile_tdee.get("macros_standard_cut", {})

    target_cals = standard_targets.get("standard_cut_kcal") or raw_summary.get("profile", {}).get("target_calorie_budget") or 1652
    target_prot = standard_macros.get("protein_g") or target_comp.get("protein_target_g") or 169

    fasting_payload = {
        **raw_fasting,
        "is_fasting": raw_fasting.get("active", False),
        "protocol": raw_fasting.get("protocol", "OMAD (23:1)"),
        "protocol_name": raw_fasting.get("protocol", "OMAD (23:1)"),
        "status": "active" if raw_fasting.get("active") else "idle"
    }

    normalized_summary = {
        "date": d_str,
        "total_calories": intake.get("total_calories", 0),
        "target_calories": target_cals,
        "total_protein": intake.get("protein_g", 0),
        "target_protein": target_prot,
        "total_carbs": intake.get("carbs_g", 0),
        "total_fat": intake.get("fat_g", 0),
        "water_ml": raw_water.get("total_water_ml", 0),
        "target_water_ml": raw_water.get("target_water_ml", round(raw_profile.get("weight_kg", 84.5) * 35)),
        "meals_count": intake.get("meals_count", 0),
        "meals_list": intake.get("meals_list", []),
        "calorie_remaining": target_comp.get("calorie_budget_remaining", target_cals - intake.get("total_calories", 0)),
        "protein_remaining": target_comp.get("protein_remaining_g", target_prot - intake.get("protein_g", 0)),
        "zepp_active_calories": raw_summary.get("energy_expenditure", {}).get("zepp_active_calories", 0),
        "raw": raw_summary
    }
    
    return {
        "date": d_str,
        "summary": normalized_summary,
        "fasting": fasting_payload,
        "profile": raw_profile,
        "water": raw_water
    }


@router.get("/meals")
def get_meals(target_date: Optional[str] = None, current_user: str = Depends(get_current_user)):
    """Fetch meal log for a specific date or all recent history."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    
    with ne.get_db_connection() as conn:
        if target_date == "all":
            rows = conn.execute("SELECT * FROM meals ORDER BY date DESC, id DESC LIMIT 50").fetchall()
        else:
            d_str = target_date or date.today().strftime("%Y-%m-%d")
            rows = conn.execute("SELECT * FROM meals WHERE date = ? ORDER BY id DESC", (d_str,)).fetchall()
        return [dict(r) for r in rows]


@router.post("/meals")
def add_meal(payload: MealCreateRequest, current_user: str = Depends(get_current_user)):
    """Log a new meal or drink."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    
    return ne.log_meal(
        food_name=payload.food_name,
        calories=payload.calories,
        protein_g=payload.protein_g,
        carbs_g=payload.carbs_g,
        fat_g=payload.fat_g,
        meal_type=payload.meal_type,
        target_date=payload.target_date,
        notes=payload.notes
    )


@router.delete("/meals/{meal_id}")
def remove_meal(meal_id: int, current_user: str = Depends(get_current_user)):
    """Delete a logged meal."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    
    success = ne.delete_meal(meal_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meal not found.")
    return {"status": "success", "deleted_id": meal_id}


@router.get("/weight/history")
def get_weight_history(days: int = 30, current_user: str = Depends(get_current_user)):
    """Fetch historical weight logs."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    return ne.get_weight_history(days=days)


@router.post("/weight")
def log_weight(payload: WeightLogRequest, current_user: str = Depends(get_current_user)):
    """Log daily weight check-in."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    return ne.morning_weight_checkin(
        weight_kg=payload.weight_kg,
        waist_cm=payload.waist_cm,
        notes=payload.notes
    )


@router.get("/fasting")
def get_fasting_status(current_user: str = Depends(get_current_user)):
    """Fetch active fasting session status."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    return ne.get_fast_status()


@router.post("/fasting/start")
def start_fasting(payload: FastingStartRequest, current_user: str = Depends(get_current_user)):
    """Start a new fasting window (e.g. OMAD 23:1)."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    return ne.start_fast(target_hours=payload.target_hours, protocol_name=payload.protocol_name)


@router.post("/fasting/end")
def end_fasting(notes: str = "", current_user: str = Depends(get_current_user)):
    """End active fasting session."""
    if not ne:
        raise HTTPException(status_code=500, detail="Modul nutrition_engine tidak ditemukan.")
    return ne.end_fast(notes=notes)
