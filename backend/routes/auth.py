"""
Authentication API endpoints (/api/auth).
"""

import json
import secrets
from typing import Optional
from fastapi import APIRouter, Request, Response, Depends, HTTPException, status, Cookie
from pydantic import BaseModel

from backend.config import AUTH_FILE
from backend.security import (
    load_or_init_auth_config,
    verify_password,
    hash_password,
    create_session_token,
    verify_session_token,
    get_current_user,
    check_login_rate_limit
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@router.get("/status")
def auth_status(request: Request, arusuka_session: Optional[str] = Cookie(default=None)):
    """Check if current session is authenticated via cookie or header."""
    user = verify_session_token(arusuka_session)
    if not user:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            user = verify_session_token(token)
    return {
        "authenticated": bool(user),
        "username": user or ""
    }

@router.post("/login")
def login(payload: LoginRequest, request: Request, response: Response):
    """Authenticate user and issue session cookie with rate limiting."""
    check_login_rate_limit(request, max_attempts=5, window_seconds=60)

    config = load_or_init_auth_config()
    stored_username = config.get("username", "arusuka")
    stored_pwd_hash = config.get("password_hash", "")

    if payload.username != stored_username or not verify_password(payload.password, stored_pwd_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah."
        )

    token = create_session_token(payload.username)
    expire_days = config.get("session_expire_days", 30)
    
    is_secure = (
        request.url.scheme == "https"
        or request.headers.get("x-forwarded-proto") == "https"
    )

    response.set_cookie(
        key="arusuka_session",
        value=token,
        max_age=expire_days * 86400,
        httponly=True,
        samesite="lax",
        secure=is_secure
    )

    return {
        "status": "success",
        "message": "Login berhasil!",
        "username": payload.username,
        "token": token
    }

@router.post("/logout")
def logout(response: Response):
    """Clear session cookie."""
    response.delete_cookie(key="arusuka_session")
    return {"status": "success", "message": "Logout berhasil."}

@router.post("/change-password")
def change_password(payload: ChangePasswordRequest, current_user: str = Depends(get_current_user)):
    """Change dashboard master password."""
    config = load_or_init_auth_config()
    stored_pwd_hash = config.get("password_hash", "")

    if not verify_password(payload.old_password, stored_pwd_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password lama tidak sesuai."
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password baru minimal 6 karakter."
        )

    new_hash = hash_password(payload.new_password)
    config["password_hash"] = new_hash
    config["secret_key"] = secrets.token_hex(32)
    AUTH_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")

    return {
        "status": "success",
        "message": "Password berhasil diperbarui. Silakan login kembali dengan password baru."
    }
