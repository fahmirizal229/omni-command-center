"""
Arusuka Command Center & Storage Vault - FastAPI Application Server
Modular APIRouter Architecture with WebSocket Telemetry & Static SPA Serving.
"""

import os
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse

from backend.config import HOME_DIR
from backend.database import init_task_db
from backend.websocket import ws_manager, realtime_telemetry_loop
from backend.security import verify_session_token

# Import modular routes
from backend.routes.auth import router as auth_router
from backend.routes.overview import router as overview_router
from backend.routes.storage import router as storage_router
from backend.routes.tasks import router as tasks_router
from backend.routes.jobs import router as jobs_router
from backend.routes.second_brain import router as second_brain_router
from backend.routes.weather import router as weather_router
from backend.routes.zepp import router as zepp_router
from backend.routes.schedules import router as schedules_router
from backend.routes.portfolio import router as portfolio_router
from backend.routes.sessions import router as sessions_router
from backend.routes.miniapp import router as miniapp_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for application startup and background tasks."""
    init_task_db()
    telemetry_task = asyncio.create_task(realtime_telemetry_loop())
    yield
    telemetry_task.cancel()
    try:
        await telemetry_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Arusuka Command Center & Storage Vault API",
    description="Modular, high-performance dashboard & personal storage API backend",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration (Strict Whitelist)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dashboard.arusuka.my.id",
        "https://arusuka.my.id",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8888"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(miniapp_router)
app.include_router(auth_router)
app.include_router(overview_router)
app.include_router(storage_router)
app.include_router(tasks_router)
app.include_router(jobs_router)
app.include_router(second_brain_router)
app.include_router(weather_router)
app.include_router(zepp_router)
app.include_router(schedules_router)
app.include_router(portfolio_router)
app.include_router(sessions_router)


# --- Real-Time WebSocket Endpoints ---

@app.websocket("/ws")
@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Real-time WebSocket endpoint for telemetry and live dashboard push updates.
    Protected via query token or session cookie.
    """
    token = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("arusuka_session")

    if not token or not verify_session_token(token):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


# --- SPA Static Assets & Frontend Serving ---

DIST_DIR = HOME_DIR / "dashboard" / "frontend" / "dist"
if not DIST_DIR.exists():
    DIST_DIR = HOME_DIR / "dashboard" / "dist"
STATIC_DIR = HOME_DIR / "dashboard" / "static"

if (DIST_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")
elif (STATIC_DIR / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="assets")


@app.get("/favicon.ico")
def favicon():
    if (DIST_DIR / "favicon.ico").exists():
        return FileResponse(str(DIST_DIR / "favicon.ico"))
    return HTMLResponse("", status_code=204)


@app.get("/manifest.json")
def manifest():
    if (DIST_DIR / "manifest.json").exists():
        return FileResponse(str(DIST_DIR / "manifest.json"))
    return HTMLResponse("", status_code=404)


@app.get("/")
def serve_root():
    """Serve built React SPA frontend index.html."""
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return HTMLResponse("<h1>Arusuka Command Center</h1><p>Frontend build not found.</p>")


@app.get("/{full_path:path}")
def catch_all_spa(full_path: str):
    """SPA fallback: Serve static file if exists, otherwise fallback to index.html for client-side routing."""
    target_file = DIST_DIR / full_path
    if target_file.is_file():
        return FileResponse(str(target_file))
    
    index_file = DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return HTMLResponse("<h1>Arusuka Command Center</h1><p>Frontend build not found.</p>", status_code=404)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8888, reload=True)
