"""
Hermes & Antigravity AI Session History, Multi-LLM Analytics & Token Usage Inspector API Routes.
Exposes clean, declarative REST endpoints powered by session_service.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from backend.security import get_current_user
from backend.services.session_service import (
    get_all_sessions,
    calculate_model_token_analytics,
    get_session_detail_data,
    delete_session_by_id,
    prune_sessions_older_than,
    clear_all_stored_sessions,
    get_agy_accounts,
    set_session_account,
    _AGY_SESSION_CACHE,
)

router = APIRouter(prefix="/api/sessions", tags=["Hermes & AGY Sessions"])


class SessionAccountUpdate(BaseModel):
    account_id: str


@router.get("")
def list_sessions(
    search: Optional[str] = None,
    model: Optional[str] = None,
    account: Optional[str] = None,
    source: Optional[str] = None,
    limit: int = 50,
    current_user: str = Depends(get_current_user),
):
    """Retrieve all Hermes & Antigravity conversation sessions with optional filters."""
    return get_all_sessions(
        search=search,
        model=model,
        account=account,
        source=source,
        limit=limit,
    )


@router.get("/analytics")
def get_model_token_analytics(current_user: str = Depends(get_current_user)):
    """Calculate multi-model token distribution, real-time agy-pool allocation, and estimated costs/savings."""
    return calculate_model_token_analytics()


@router.patch("/{session_id}/account")
@router.post("/{session_id}/account")
def update_session_account(
    session_id: str,
    payload: SessionAccountUpdate,
    current_user: str = Depends(get_current_user),
):
    """Assign or switch a session to Antigravity Akun 1, 2, 3, or 4."""
    pool_accounts = get_agy_accounts()
    if payload.account_id not in pool_accounts:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid account_id. Choose from: {', '.join(pool_accounts.keys())}",
        )

    set_session_account(session_id, payload.account_id)
    _AGY_SESSION_CACHE.pop(session_id, None)

    return {
        "status": "success",
        "session_id": session_id,
        "account": pool_accounts[payload.account_id],
    }


@router.get("/{session_id}")
def get_session_detail(
    session_id: str,
    limit: int = Query(25, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: str = Depends(get_current_user),
):
    """Fetch paginated transcript turns with exact per-message LLM identification and account attribution."""
    detail = get_session_detail_data(
        session_id=session_id,
        limit=limit,
        offset=offset,
        order=order,
    )
    if detail is None:
        raise HTTPException(status_code=404, detail="Session transcript not found")
    return detail


@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    current_user: str = Depends(get_current_user),
):
    """Delete a specific session transcript and records across all pool brain directories, CLI databases, and Hermes databases."""
    deleted = delete_session_by_id(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan atau sudah dihapus.")

    return {
        "success": True,
        "message": f"Sesi {session_id} berhasil dihapus dari CLI dan Dashboard.",
    }


@router.post("/prune")
def prune_old_sessions(
    days: int = Query(7, ge=1),
    current_user: str = Depends(get_current_user),
):
    """Prune conversation logs, CLI summaries, and transcripts older than specified days."""
    pruned_count = prune_sessions_older_than(days=days)
    return {
        "success": True,
        "message": f"Berhasil membersihkan {pruned_count} riwayat log sesi tidak aktif (> {days} hari).",
        "pruned_count": pruned_count,
    }


@router.post("/clear")
def clear_all_sessions(current_user: str = Depends(get_current_user)):
    """Clear all conversation logs, wipe CLI conversation summaries across all user profiles, and truncate all AI log files."""
    cleared_count = clear_all_stored_sessions()
    return {
        "success": True,
        "message": f"Berhasil mengosongkan seluruh riwayat sesi AI ({cleared_count} sesi), CLI history, dan seluruh log file.",
        "cleared_count": cleared_count,
    }
