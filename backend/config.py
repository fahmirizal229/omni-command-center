"""
Arusuka Command Center - Core Configuration & Paths
"""

import sys
from pathlib import Path

# Base Paths
HOME_DIR = Path("/home/arusuka")
CONFIG_DIR = HOME_DIR / ".config"
AUTH_FILE = CONFIG_DIR / "dashboard_auth.json"
TASK_DB = HOME_DIR / "dashboard" / "tasks.db"
JOB_DB = HOME_DIR / "mcp-job-hunter" / "job_hunter.db"
GRAPH_DB = HOME_DIR / "mcp-graph-memory" / "graph_memory.db"
BRAIN_DIR = HOME_DIR / "second-brain"
BMKG_DB = HOME_DIR / "mcp-weather" / "bmkg_alerts.db"
POKEMON_QUEUE = CONFIG_DIR / "pokemon_queue.json"
STORAGE_VAULT_DIR = HOME_DIR / "storage_vault"

# Ensure storage directories exist
STORAGE_VAULT_DIR.mkdir(parents=True, exist_ok=True)
for sub in ["Photos", "Documents", "Backups"]:
    (STORAGE_VAULT_DIR / sub).mkdir(parents=True, exist_ok=True)

# Strict Privacy Blacklist: Zero Finance & Debt Visibility on Dashboard
FINANCE_BLACKLIST = {"finance", "debt", "pinjol", "tagihan", "rekening", "wallet", "dompet", "cicilan", "paylater", "ocr", "receipt"}

def is_finance_related(text: str) -> bool:
    if not text:
        return False
    lower = str(text).lower()
    return any(keyword in lower for keyword in FINANCE_BLACKLIST)

# Weather API helper
sys.path.append(str(HOME_DIR / "mcp-weather"))
try:
    from weather_api import fetch_weather_and_aqi, fetch_latest_earthquake, fetch_recent_earthquakes
except Exception:
    fetch_weather_and_aqi = None
    fetch_latest_earthquake = None
    fetch_recent_earthquakes = None

# Zepp API helper
sys.path.append(str(HOME_DIR / ".hermes" / "mcp-zepp"))
try:
    from server import ZeppClient
    zepp_client_instance = ZeppClient()
except Exception:
    zepp_client_instance = None
