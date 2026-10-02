"""
Web Terminal WebSocket & Multi-User PTY Handler for Arusuka Command Center.
Provides high-performance interactive pseudo-terminal (PTY) bash sessions with
dynamic window resizing, multi-user switching (arusuka, root, arusuka2-4), and telemetry.
"""

import os
import pty
import pwd
import fcntl
import termios
import struct
import signal
import asyncio
import json
import subprocess
from pathlib import Path
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException

from backend.config import HOME_DIR
from backend.security import verify_session_token

router = APIRouter(prefix="/api/terminal", tags=["Web Terminal"])

# Standard available accounts on this node
KNOWN_ACCOUNTS = [
    {
        "username": "arusuka",
        "label": "arusuka",
        "uid": 1000,
        "home": "/home/arusuka",
        "role": "Primary Operator",
        "badge": "primary",
        "color": "emerald",
        "description": "Default non-root interactive shell for primary operations & services."
    },
    {
        "username": "root",
        "label": "root",
        "uid": 0,
        "home": "/root",
        "role": "Superuser Admin",
        "badge": "danger",
        "color": "rose",
        "description": "Full system administrator shell for kernel, packages, and network."
    },
    {
        "username": "arusuka2",
        "label": "arusuka2",
        "uid": 1001,
        "home": "/home/arusuka2",
        "role": "AGY Cluster #2",
        "badge": "info",
        "color": "indigo",
        "description": "Antigravity AI cluster worker #2 dedicated workspace."
    },
    {
        "username": "arusuka3",
        "label": "arusuka3",
        "uid": 1002,
        "home": "/home/arusuka3",
        "role": "AGY Cluster #3",
        "badge": "info",
        "color": "cyan",
        "description": "Antigravity AI cluster worker #3 dedicated workspace."
    },
    {
        "username": "arusuka4",
        "label": "arusuka4",
        "uid": 1003,
        "home": "/home/arusuka4",
        "role": "AGY Cluster #4",
        "badge": "info",
        "color": "amber",
        "description": "Antigravity AI cluster worker #4 dedicated workspace."
    }
]


@router.get("/users")
async def list_terminal_users():
    """
    List available system users that can be selected for terminal sessions.
    Cross-checks with system /etc/passwd to ensure validity.
    """
    valid_users = []
    for acc in KNOWN_ACCOUNTS:
        try:
            p = pwd.getpwnam(acc["username"])
            valid_users.append({
                "username": acc["username"],
                "label": acc["label"],
                "uid": p.pw_uid,
                "gid": p.pw_gid,
                "home": p.pw_dir,
                "shell": p.pw_shell,
                "role": acc["role"],
                "badge": acc["badge"],
                "color": acc["color"],
                "description": acc["description"]
            })
        except KeyError:
            continue

    return {
        "status": "success",
        "users": valid_users,
        "default_user": "arusuka"
    }


async def _handle_pty_session(websocket: WebSocket, target_user: str = "arusuka"):
    """Core PTY WebSocket handler supporting custom target user and window resizing."""
    token = websocket.query_params.get("token")
    if not token:
        token = websocket.cookies.get("arusuka_session")

    if not token or not verify_session_token(token):
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # Validate target user in /etc/passwd
    target_user_str = str(target_user).strip().lower()
    try:
        user_info = pwd.getpwnam(target_user_str)
    except KeyError:
        target_user_str = "arusuka"
        try:
            user_info = pwd.getpwnam("arusuka")
        except KeyError:
            user_info = pwd.getpwuid(os.getuid())

    await websocket.accept()

    # Open pseudo-terminal pair
    master_fd, slave_fd = pty.openpty()

    # Configure terminal environment
    env = os.environ.copy()
    env["TERM"] = "xterm-256color"
    env["COLORTERM"] = "truecolor"
    env["HOME"] = user_info.pw_dir
    env["USER"] = user_info.pw_name
    env["LOGNAME"] = user_info.pw_name
    env["LANG"] = "en_US.UTF-8"
    env["LC_ALL"] = "en_US.UTF-8"

    # Default terminal size
    cols = int(websocket.query_params.get("cols", 80))
    rows = int(websocket.query_params.get("rows", 24))

    def set_winsize(fd, r, c):
        try:
            r = max(4, min(int(r), 300))
            c = max(10, min(int(c), 600))
            winsize = struct.pack("HHHH", r, c, 0, 0)
            fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)
        except Exception:
            pass

    set_winsize(master_fd, rows, cols)

    # Spawn command: use sudo -u <user> -i for clean login environment
    current_uid = os.getuid()
    if current_uid == user_info.pw_uid:
        cmd = [user_info.pw_shell or "/bin/bash", "--login"]
    else:
        cmd = ["sudo", "-u", user_info.pw_name, "-i"]

    proc = None
    try:
        proc = subprocess.Popen(
            cmd,
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            cwd=user_info.pw_dir if Path(user_info.pw_dir).exists() else str(HOME_DIR),
            env=env,
            preexec_fn=os.setsid,
            close_fds=True
        )
    except Exception as e:
        error_msg = f"\r\n\x1b[31m[Error launching shell for user {target_user_str}: {e}]\x1b[0m\r\n"
        await websocket.send_text(error_msg)
        await websocket.close(code=1011)
        os.close(master_fd)
        os.close(slave_fd)
        return

    # Slave FD is now owned by child process; master_fd is used for communication
    os.close(slave_fd)

    # Make master FD non-blocking
    flags = fcntl.fcntl(master_fd, fcntl.F_GETFL)
    fcntl.fcntl(master_fd, fcntl.F_SETFL, flags | os.O_NONBLOCK)

    loop = asyncio.get_running_loop()
    output_queue = asyncio.Queue()

    def pty_read_callback():
        try:
            data = os.read(master_fd, 8192)
            if data:
                output_queue.put_nowait(data)
            else:
                # EOF
                output_queue.put_nowait(None)
        except (BlockingIOError, InterruptedError):
            pass
        except Exception:
            output_queue.put_nowait(None)

    loop.add_reader(master_fd, pty_read_callback)

    async def forward_pty_to_ws():
        """Read data from PTY output queue and send to WebSocket client."""
        try:
            while True:
                data = await output_queue.get()
                if data is None:
                    break
                await websocket.send_bytes(data)
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass
        except Exception:
            pass

    forward_task = asyncio.create_task(forward_pty_to_ws())

    try:
        while True:
            message = await websocket.receive()
            if message["type"] == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"]:
                os.write(master_fd, message["bytes"])
            elif "text" in message and message["text"]:
                text_data = message["text"]
                # Check for JSON control messages (resize / ping)
                if text_data.startswith("{") and ("resize" in text_data or "ping" in text_data or "input" in text_data):
                    try:
                        payload = json.loads(text_data)
                        msg_type = payload.get("type")
                        if msg_type == "resize":
                            r = int(payload.get("rows", 24))
                            c = int(payload.get("cols", 80))
                            set_winsize(master_fd, r, c)
                            continue
                        elif msg_type == "ping":
                            await websocket.send_text(json.dumps({"type": "pong"}))
                            continue
                        elif msg_type == "input" and "data" in payload:
                            input_val = payload["data"]
                            if isinstance(input_val, str):
                                os.write(master_fd, input_val.encode("utf-8"))
                            continue
                    except Exception:
                        pass
                os.write(master_fd, text_data.encode("utf-8"))
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        pass
    finally:
        forward_task.cancel()
        try:
            loop.remove_reader(master_fd)
        except Exception:
            pass

        try:
            os.close(master_fd)
        except Exception:
            pass

        if proc:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            except Exception:
                pass
            try:
                proc.terminate()
                proc.wait(timeout=1)
            except Exception:
                pass


@router.websocket("/pty")
@router.websocket("/ws")
@router.websocket("")
async def terminal_ws_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for terminal sessions.
    Accepts query param ?user=<username> (e.g. arusuka, root, arusuka2, etc.).
    """
    target_user = websocket.query_params.get("user", "arusuka")
    await _handle_pty_session(websocket, target_user=target_user)
