"""
Portfolio & Profile CMS API router (/api/profile/* and /api/public/profile).
Provides both public read-only endpoint for arusuka.my.id and authenticated CRUD endpoints for dashboard.
"""

from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse

from backend.database import get_portfolio_profile, save_portfolio_profile, reset_portfolio_profile
from backend.security import get_current_user

router = APIRouter(tags=["Portfolio & Profile CMS"])


@router.get("/api/public/profile")
@router.head("/api/public/profile")
def get_public_profile():
    """Public read-only profile data endpoint for https://arusuka.my.id."""
    data = get_portfolio_profile()
    return JSONResponse(
        content=data,
        headers={
            "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
            "Access-Control-Allow-Origin": "*",
        }
    )


@router.get("/api/profile")
def get_admin_profile(current_user: str = Depends(get_current_user)):
    """Fetch current editable profile data for Dashboard CMS."""
    return {"status": "success", "data": get_portfolio_profile()}


@router.put("/api/profile")
def update_admin_profile(payload: Dict[str, Any], current_user: str = Depends(get_current_user)):
    """Save updated profile data from Dashboard CMS."""
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Invalid profile payload format.")
    
    # Basic sanity checks
    if not payload.get("name") or not payload.get("contact"):
        raise HTTPException(status_code=400, detail="Profile name and contact details are required.")
    
    updated_data = save_portfolio_profile(payload)
    return {"status": "success", "message": "Profile updated successfully.", "data": updated_data}


@router.post("/api/profile/reset")
def reset_admin_profile(current_user: str = Depends(get_current_user)):
    """Reset profile data to original initial defaults."""
    reset_data = reset_portfolio_profile()
    return {"status": "success", "message": "Profile reset to default successfully.", "data": reset_data}
