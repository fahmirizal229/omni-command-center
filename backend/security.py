"""
Authentication, Password Hashing, Session Token Management, and Rate Limiting.
"""

import os
import json
import time
import hashlib
import hmac
import secrets
from typing import Optional, Dict, List
from fastapi import Request, HTTPException, status, Cookie
from backend.config import CONFIG_DIR, AUTH_FILE

# In-Memory IP Sliding Window Limiter
LOGIN_ATTEMPTS: Dict[str, List[float]] = {}

def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Hash password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    if not salt:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${dk.hex()}"

def verify_password(password: str, hashed: str) -> bool:
    """Verify plain password against PBKDF2 hash using constant-time comparison."""
    if "$" not in hashed:
        return False
    salt, dk_hex = hashed.split("$", 1)
    test_dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return hmac.compare_digest(test_dk.hex(), dk_hex)

def load_or_init_auth_config() -> dict:
    """Load auth configuration or initialize default master credentials."""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if not AUTH_FILE.exists():
        secret_key = secrets.token_hex(32)
        default_pwd_hash = hash_password("arusuka123")
        config = {
            "username": "arusuka",
            "password_hash": default_pwd_hash,
            "secret_key": secret_key,
            "session_expire_days": 30
        }
        AUTH_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")
        try:
            os.chmod(AUTH_FILE, 0o600)
        except Exception:
            pass
        return config
    try:
        data = json.loads(AUTH_FILE.read_text(encoding="utf-8"))
        if "secret_key" not in data:
            data["secret_key"] = secrets.token_hex(32)
            AUTH_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
        return data
    except Exception:
        secret_key = secrets.token_hex(32)
        default_pwd_hash = hash_password("arusuka123")
        config = {
            "username": "arusuka",
            "password_hash": default_pwd_hash,
            "secret_key": secret_key,
            "session_expire_days": 30
        }
        AUTH_FILE.write_text(json.dumps(config, indent=2), encoding="utf-8")
        return config

def create_session_token(username: str) -> str:
    """Create signed HMAC-SHA256 session token with nonce and expiration timestamp."""
    config = load_or_init_auth_config()
    secret = config["secret_key"].encode("utf-8")
    expire_days = config.get("session_expire_days", 30)
    expire_ts = int(time.time()) + (expire_days * 86400)
    nonce = secrets.token_hex(8)
    payload = f"{username}:{expire_ts}:{nonce}"
    sig = hmac.new(secret, payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_session_token(token: Optional[str]) -> Optional[str]:
    """Validate token signature and expiration, returning authenticated username."""
    if not token or ":" not in token:
        return None
    try:
        parts = token.split(":")
        if len(parts) != 4:
            return None
        username, expire_ts_str, nonce, sig = parts
        expire_ts = int(expire_ts_str)
        if time.time() > expire_ts:
            return None
        config = load_or_init_auth_config()
        secret = config["secret_key"].encode("utf-8")
        expected_payload = f"{username}:{expire_ts_str}:{nonce}"
        expected_sig = hmac.new(secret, expected_payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if hmac.compare_digest(sig, expected_sig):
            return username
        return None
    except Exception:
        return None

def get_current_user(
    request: Request,
    arusuka_session: Optional[str] = Cookie(default=None)
) -> str:
    """FastAPI Dependency to authenticate request via cookie or Bearer header."""
    # 1. Check cookie
    user = verify_session_token(arusuka_session)
    if user:
        return user
    
    # 2. Check Authorization header (Bearer token)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        user = verify_session_token(token)
        if user:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Autentikasi diperlukan. Silakan login terlebih dahulu."
    )

def check_login_rate_limit(request: Request, max_attempts: int = 5, window_seconds: int = 60):
    """Enforce maximum login attempts per IP within sliding time window."""
    client_ip = request.headers.get("x-real-ip")
    if not client_ip:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
    if not client_ip and request.client:
        client_ip = request.client.host
    client_ip = client_ip or "unknown"

    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(client_ip, [])
    recent_attempts = [t for t in attempts if now - t < window_seconds]

    if len(recent_attempts) >= max_attempts:
        retry_after = int(window_seconds - (now - recent_attempts[0])) + 1
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan login (maksimal {max_attempts}x dalam {window_seconds} detik). Silakan coba lagi dalam {max(1, retry_after)} detik.",
            headers={"Retry-After": str(max(1, retry_after))}
        )

    recent_attempts.append(now)
    LOGIN_ATTEMPTS[client_ip] = recent_attempts
