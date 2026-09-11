"""
Arusuka Command Center - Core Configuration & Dynamic Paths
Supports both standalone local deployment and custom environment variable overrides.
"""

import os
import sys
from pathlib import Path

# Base Paths (Defaults to current user's home directory or environment override)
HOME_DIR = Path(os.getenv("DASHBOARD_HOME_DIR", str(Path.home())))
CONFIG_DIR = HOME_DIR / ".config"
AUTH_FILE = CONFIG_DIR / "dashboard_auth.json"

# Databases
TASK_DB = Path(os.getenv("DASHBOARD_TASK_DB", str(HOME_DIR / "dashboard" / "tasks.db")))
PORTFOLIO_DB = Path(os.getenv("DASHBOARD_PORTFOLIO_DB", str(HOME_DIR / "dashboard" / "portfolio.db")))

# Job DB: Use custom path if exists, otherwise fallback to local dashboard/jobs.db
_default_job_db = HOME_DIR / "mcp-job-hunter" / "job_hunter.db"
if _default_job_db.exists():
    JOB_DB = _default_job_db
else:
    JOB_DB = Path(os.getenv("DASHBOARD_JOB_DB", str(HOME_DIR / "dashboard" / "jobs.db")))

# Second Brain & Memory
GRAPH_DB = HOME_DIR / "mcp-graph-memory" / "graph_memory.db"
BRAIN_DIR = Path(os.getenv("DASHBOARD_BRAIN_DIR", str(HOME_DIR / "second-brain")))
BMKG_DB = HOME_DIR / "mcp-weather" / "bmkg_alerts.db"
POKEMON_QUEUE = CONFIG_DIR / "pokemon_queue.json"

# Storage Vault Directory
STORAGE_VAULT_DIR = Path(os.getenv("STORAGE_VAULT_DIR", str(HOME_DIR / "storage_vault")))

# Ensure storage directories exist
try:
    STORAGE_VAULT_DIR.mkdir(parents=True, exist_ok=True)
    for sub in ["Photos", "Documents", "Backups"]:
        (STORAGE_VAULT_DIR / sub).mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# Strict Privacy Blacklist: Zero Finance & Debt Visibility on Dashboard
FINANCE_BLACKLIST = {"finance", "debt", "pinjol", "tagihan", "rekening", "wallet", "dompet", "cicilan", "paylater", "ocr", "receipt"}

def is_finance_related(text: str) -> bool:
    """Check whether text or file name contains sensitive financial keywords."""
    if not text:
        return False
    lower = str(text).lower()
    return any(keyword in lower for keyword in FINANCE_BLACKLIST)

# Weather API helper (Optional integration)
weather_mcp_path = HOME_DIR / "mcp-weather"
if weather_mcp_path.exists():
    sys.path.append(str(weather_mcp_path))
    try:
        from weather_api import fetch_weather_and_aqi, fetch_latest_earthquake, fetch_recent_earthquakes
    except Exception:
        fetch_weather_and_aqi = None
        fetch_latest_earthquake = None
        fetch_recent_earthquakes = None
else:
    fetch_weather_and_aqi = None
    fetch_latest_earthquake = None
    fetch_recent_earthquakes = None

# Zepp API helper (Optional integration)
zepp_mcp_path = HOME_DIR / ".hermes" / "mcp-zepp"
if zepp_mcp_path.exists():
    sys.path.append(str(zepp_mcp_path))
    try:
        from server import ZeppClient
        zepp_client_instance = ZeppClient()
    except Exception:
        zepp_client_instance = None
else:
    zepp_client_instance = None
