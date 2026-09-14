"""
WebSocket Real-time Manager & Telemetry Loop.
"""

import json
import time
import shutil
import asyncio
from datetime import datetime
from typing import Set, Any
import psutil
from fastapi import WebSocket

class WebSocketConnectionManager:
    """Thread-safe WebSocket client manager for event broadcasting."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.active_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        async with self.lock:
            if not self.active_connections:
                return
            connections = list(self.active_connections)

        payload = json.dumps(message)
        for ws in connections:
            try:
                await ws.send_text(payload)
            except Exception:
                async with self.lock:
                    self.active_connections.discard(ws)

ws_manager = WebSocketConnectionManager()

def trigger_ws_event(event_type: str, data: Any = None):
    """Trigger an event broadcast to all connected WebSocket clients."""
    try:
        loop = asyncio.get_running_loop()
        asyncio.create_task(ws_manager.broadcast({
            "type": event_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }))
    except RuntimeError:
        pass

async def realtime_telemetry_loop():
    """Background worker broadcasting CPU, RAM, Disk, and Network telemetry every 2 seconds."""
    prev_net = psutil.net_io_counters()
    prev_time = time.time()

    while True:
        try:
            await asyncio.sleep(2)
            if not ws_manager.active_connections:
                continue

            cpu_pct = psutil.cpu_percent(interval=None)
            cpu_cores = psutil.cpu_percent(percpu=True)
            mem = psutil.virtual_memory()
            disk = shutil.disk_usage("/")
            curr_net = psutil.net_io_counters()
            curr_time = time.time()

            dt = max(curr_time - prev_time, 0.1)
            bytes_sent_per_sec = (curr_net.bytes_sent - prev_net.bytes_sent) / dt
            bytes_recv_per_sec = (curr_net.bytes_recv - prev_net.bytes_recv) / dt
            prev_net = curr_net
            prev_time = curr_time

            boot_time = psutil.boot_time()
            uptime_sec = curr_time - boot_time
            load_avg = [round(x, 2) for x in psutil.getloadavg()] if hasattr(psutil, "getloadavg") else [0.0, 0.0, 0.0]

            days, rem = divmod(int(uptime_sec), 86400)
            hours, rem = divmod(rem, 3600)
            mins, _ = divmod(rem, 60)
            up_parts = []
            if days > 0:
                up_parts.append(f"{days}h")
            if hours > 0:
                up_parts.append(f"{hours}j")
            up_parts.append(f"{mins}m")
            formatted_uptime = " ".join(up_parts)

            telemetry = {
                "type": "telemetry",
                "timestamp": datetime.now().isoformat(),
                "system": {
                    "cpu_percent": cpu_pct,
                    "cpu_cores": cpu_cores,
                    "ram_percent": mem.percent,
                    "ram_used_gb": round(mem.used / (1024**3), 2),
                    "ram_total_gb": round(mem.total / (1024**3), 2),
                    "disk_percent": round((disk.used / disk.total) * 100, 1),
                    "disk_free_gb": round(disk.free / (1024**3), 1),
                    "memory": {
                        "percent": mem.percent,
                        "used_gb": round(mem.used / (1024**3), 2),
                        "total_gb": round(mem.total / (1024**3), 2),
                        "available_gb": round(mem.available / (1024**3), 2),
                    },
                    "disk": {
                        "percent": round((disk.used / disk.total) * 100, 1),
                        "used_gb": round(disk.used / (1024**3), 1),
                        "total_gb": round(disk.total / (1024**3), 1),
                        "free_gb": round(disk.free / (1024**3), 1),
                    },
                    "uptime": formatted_uptime,
                    "uptime_sec": int(uptime_sec),
                    "load_avg": load_avg,
                    "network": {
                        "bytes_sent_sec": round(bytes_sent_per_sec, 1),
                        "bytes_recv_sec": round(bytes_recv_per_sec, 1),
                        "total_sent_mb": round(curr_net.bytes_sent / (1024**2), 1),
                        "total_recv_mb": round(curr_net.bytes_recv / (1024**2), 1),
                    }
                }
            }
            await ws_manager.broadcast(telemetry)
        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(2)
