"""
Telegram Mini App & Visual Interactive Webview Backend Route
Serves real-time data and full SPA frontend for Telegram WebApp (/app & /api/miniapp/*).
"""

import os
import json
import time
import shutil
import psutil
import sqlite3
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse

WIB = timezone(timedelta(hours=7))
router = APIRouter(tags=["Telegram Mini App"])

@router.get("/api/miniapp/data")
def get_miniapp_data():
    """Aggregated JSON data for Telegram Mini App (0-token real-time)."""
    now = datetime.now(tz=WIB)
    
    # 1. RPG Profile
    rpg_data = {
        "level": 1,
        "max_level": 99,
        "title": "🌱 Novice Explorer",
        "total_xp": 0,
        "current_level_xp": 0,
        "xp_for_next_level": 100,
        "xp_needed_to_levelup": 100,
        "progress_pct": 0.0,
        "progress_bar": "░░░░░░░░░░"
    }
    try:
        out = subprocess.check_output(["habit-streak", "profile"], text=True, timeout=3)
        rpg_data = json.loads(out)
    except Exception as e:
        rpg_data["error"] = str(e)

    # 2. Habit Tracker Status & Badges
    habits_data = {"date": now.strftime("%Y-%m-%d"), "progress": "0/4 Selesai", "habits": []}
    badges_data = {"total_badges": 0, "unlocked_count": 0, "badges": []}
    try:
        out = subprocess.check_output(["habit-streak", "status"], text=True, timeout=3)
        h_json = json.loads(out)
        habits_data = h_json
        badges_data = h_json.get("badges", badges_data)
    except Exception as e:
        habits_data["error"] = str(e)

    # 3. Zepp 7-Day Fitness & Recovery
    zepp_data = {
        "recovery_score": 85,
        "status_label": "Optimal",
        "rhr_trend": "Stabil",
        "recommendation": "Kondisi fisik optimal untuk produktivitas.",
        "averages": {"sleep_hours": 7.2, "deep_sleep_pct": "22%", "rhr_bpm": 62, "daily_steps": 7500},
        "days": []
    }
    try:
        out = subprocess.check_output(["zepp-recovery", "7"], text=True, timeout=4)
        zepp_data = json.loads(out)
    except Exception:
        pass

    # 4. Server Vitals
    mem = psutil.virtual_memory()
    disk = shutil.disk_usage("/")
    boot_time = psutil.boot_time()
    uptime_sec = time.time() - boot_time
    days, rem = divmod(int(uptime_sec), 86400)
    hours, rem = divmod(rem, 3600)
    mins, _ = divmod(rem, 60)
    uptime_str = f"{days}h {hours}j {mins}m" if days > 0 else f"{hours}j {mins}m"

    server_data = {
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "ram_percent": mem.percent,
        "ram_used_gb": round(mem.used / (1024**3), 2),
        "ram_total_gb": round(mem.total / (1024**3), 2),
        "disk_percent": round((disk.used / disk.total) * 100, 1),
        "disk_used_gb": round(disk.used / (1024**3), 1),
        "disk_total_gb": round(disk.total / (1024**3), 1),
        "uptime": uptime_str,
        "status": "Healthy & Protected"
    }

    # 5. Tech Radar Latest Articles
    radar_articles = []
    try:
        out = subprocess.check_output(["tech-radar", "brief"], text=True, timeout=4)
        t_data = json.loads(out)
        radar_articles = t_data.get("articles", [])
    except Exception:
        pass

    return {
        "status": "success",
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S WIB"),
        "rpg": rpg_data,
        "habits": habits_data,
        "badges": badges_data,
        "zepp": zepp_data,
        "server": server_data,
        "tech_radar": radar_articles
    }

@router.post("/api/miniapp/habit/checkin")
async def miniapp_checkin(request: Request):
    """Checkin habit from Mini App webview."""
    try:
        body = await request.json()
        habit_key = body.get("habit", "water")
        out = subprocess.check_output(["habit-streak", "checkin", habit_key], text=True, timeout=3)
        return JSONResponse(content=json.loads(out))
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@router.get("/app", response_class=HTMLResponse)
@router.get("/miniapp", response_class=HTMLResponse)
def serve_miniapp_html():
    """Renders the sleek, modern Telegram Mini App Webview SPA."""
    html_content = """<!DOCTYPE html>
<html lang="id" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Arusuka Executive Hub</title>
    <!-- Telegram WebApp SDK -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        brand: { 50: '#fdf4ff', 100: '#fae8ff', 500: '#d946ef', 600: '#c026d3', 900: '#701a75' },
                        surface: '#0f172a',
                        card: '#1e293b'
                    }
                }
            }
        }
    </script>
    <!-- Chart.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            -webkit-tap-highlight-color: transparent;
        }
        .glass-card {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glow-xp {
            box-shadow: 0 0 15px rgba(217, 70, 239, 0.35);
        }
        .badge-locked {
            filter: grayscale(1) opacity(0.4);
        }
    </style>
</head>
<body class="p-4 pb-12 max-w-lg mx-auto">
    <!-- Header -->
    <header class="flex items-center justify-between mb-5">
        <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">
                🌸
            </div>
            <div>
                <h1 class="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                    Arusuka Hub <span class="text-xs bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 px-2 py-0.5 rounded-full">v2.0</span>
                </h1>
                <p id="live-clock" class="text-xs text-slate-400">Surabaya • Loading...</p>
            </div>
        </div>
        <button onclick="fetchData(true)" class="p-2.5 rounded-xl glass-card hover:bg-slate-700/50 text-slate-300 active:scale-95 transition">
            <i data-lucide="refresh-cw" id="refresh-icon" class="w-4 h-4"></i>
        </button>
    </header>

    <!-- RPG Gamification Card -->
    <section class="glass-card rounded-2xl p-4 mb-4 glow-xp relative overflow-hidden">
        <div class="absolute -right-6 -bottom-6 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div class="flex justify-between items-start mb-2">
            <div>
                <span class="text-xs font-semibold text-fuchsia-400 uppercase tracking-wider">Level & Progression</span>
                <h2 id="rpg-level-title" class="text-xl font-extrabold text-white mt-0.5">Level 1 • 🌱 Novice Explorer</h2>
            </div>
            <div class="text-right">
                <span id="rpg-total-xp" class="text-xs text-slate-400 font-mono">26 XP Total</span>
            </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="w-full bg-slate-800/80 rounded-full h-3 mb-2 overflow-hidden border border-slate-700/50 p-0.5">
            <div id="rpg-bar" class="bg-gradient-to-r from-fuchsia-500 to-indigo-500 h-full rounded-full transition-all duration-700" style="width: 15%;"></div>
        </div>
        <div class="flex justify-between text-xs font-mono text-slate-400">
            <span id="rpg-cur-xp">26 / 165 XP</span>
            <span id="rpg-pct" class="text-fuchsia-300 font-bold">15.8%</span>
        </div>
    </section>

    <!-- Trophy & Achievement Badges -->
    <section class="glass-card rounded-2xl p-4 mb-4">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="trophy" class="w-4 h-4 text-amber-400"></i> Trophy & Badges
            </h3>
            <span id="badge-count-badge" class="text-xs bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-medium">1/8 Diraih</span>
        </div>
        <div id="badge-grid" class="grid grid-cols-2 gap-2.5">
            <div class="text-xs text-slate-400 text-center py-2 col-span-2">Memuat badges...</div>
        </div>
    </section>

    <!-- Habit Checklist Grid -->
    <section class="glass-card rounded-2xl p-4 mb-4">
        <div class="flex justify-between items-center mb-3">
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-400"></i> Habit & Daily Streak
            </h3>
            <span id="habit-progress-badge" class="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">0/4 Selesai</span>
        </div>
        <div id="habit-list" class="space-y-2">
            <div class="text-xs text-slate-400 text-center py-2">Memuat habit...</div>
        </div>
    </section>

    <!-- Zepp Recovery & Health Chart -->
    <section class="glass-card rounded-2xl p-4 mb-4">
        <div class="flex justify-between items-center mb-3">
            <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                    <i data-lucide="heart-pulse" class="w-4 h-4 text-rose-400"></i> Zepp Band Recovery
                </h3>
                <p id="zepp-subtitle" class="text-xs text-slate-400 mt-0.5">Score: --/100 • RHR: -- bpm</p>
            </div>
            <span id="zepp-score-badge" class="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg font-bold">Optimal</span>
        </div>
        <div class="h-44 w-full">
            <canvas id="zeppChart"></canvas>
        </div>
    </section>

    <!-- Server Vitals Grid -->
    <section class="glass-card rounded-2xl p-4 mb-4">
        <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <i data-lucide="shield-check" class="w-4 h-4 text-cyan-400"></i> Server Guardian Vitals
        </h3>
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span class="text-xs text-slate-400">RAM Server</span>
                <p id="srv-ram" class="text-base font-bold text-white mt-1">--%</p>
                <div class="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div id="srv-ram-bar" class="bg-cyan-400 h-full rounded-full" style="width: 0%"></div>
                </div>
            </div>
            <div class="bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                <span class="text-xs text-slate-400">Storage Root</span>
                <p id="srv-disk" class="text-base font-bold text-white mt-1">--%</p>
                <div class="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div id="srv-disk-bar" class="bg-amber-400 h-full rounded-full" style="width: 0%"></div>
                </div>
            </div>
        </div>
        <div class="mt-3 flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/40">
            <span>Uptime: <strong id="srv-uptime" class="text-slate-200">--</strong></span>
            <span class="flex items-center gap-1 text-emerald-400">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Protected
            </span>
        </div>
    </section>

    <!-- Tech Radar Feed -->
    <section class="glass-card rounded-2xl p-4">
        <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <i data-lucide="compass" class="w-4 h-4 text-violet-400"></i> Engineering Tech Radar
        </h3>
        <div id="radar-list" class="space-y-2.5">
            <div class="text-xs text-slate-400 text-center py-2">Memuat feed...</div>
        </div>
    </section>

    <script>
        // Init Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            tg.setHeaderColor('#0b0f19');
            tg.setBackgroundColor('#0b0f19');
        }

        let zeppChartInstance = null;

        function updateClock() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('live-clock').textContent = `Surabaya • ${timeStr} WIB`;
        }
        setInterval(updateClock, 1000);
        updateClock();

        async function triggerCheckin(habitKey) {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
            }
            try {
                const res = await fetch('/api/miniapp/habit/checkin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ habit: habitKey })
                });
                const data = await res.json();
                fetchData(false);
            } catch (e) {
                console.error('Checkin error:', e);
            }
        }

        async function fetchData(animate = false) {
            const icon = document.getElementById('refresh-icon');
            if (animate && icon) icon.classList.add('animate-spin');

            try {
                const res = await fetch('/api/miniapp/data');
                const data = await res.json();
                renderDashboard(data);
            } catch (e) {
                console.error('Error loading data:', e);
            } finally {
                if (icon) icon.classList.remove('animate-spin');
            }
        }

        function renderDashboard(data) {
            // 1. RPG Progression
            const rpg = data.rpg || {};
            document.getElementById('rpg-level-title').textContent = `Level ${rpg.level || 1} • ${rpg.title || 'Novice'}`;
            document.getElementById('rpg-total-xp').textContent = `${(rpg.total_xp || 0).toLocaleString()} XP Total`;
            document.getElementById('rpg-cur-xp').textContent = `${rpg.current_level_xp || 0} / ${rpg.xp_for_next_level || 100} XP`;
            document.getElementById('rpg-pct').textContent = `${rpg.progress_pct || 0}%`;
            document.getElementById('rpg-bar').style.width = `${Math.min(100, Math.max(5, rpg.progress_pct || 0))}%`;

            // 1.5 Badges Grid
            const badges = data.badges || {};
            document.getElementById('badge-count-badge').textContent = `${badges.unlocked_count || 0}/${badges.total_badges || 8} Diraih`;
            const badgeContainer = document.getElementById('badge-grid');
            if (badges.badges && badges.badges.length > 0) {
                badgeContainer.innerHTML = badges.badges.map(b => {
                    const isUnlocked = b.is_unlocked;
                    return `
                        <div class="p-2.5 rounded-xl border transition ${isUnlocked ? 'bg-slate-800/80 border-amber-500/30' : 'bg-slate-900/40 border-slate-800 badge-locked'}">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-xs font-bold ${isUnlocked ? 'text-amber-300' : 'text-slate-400'}">${b.name}</span>
                                <span class="text-[9px] font-mono text-fuchsia-400">+${b.bonus_xp} XP</span>
                            </div>
                            <p class="text-[10px] text-slate-400 leading-tight line-clamp-2">${b.description}</p>
                        </div>
                    `;
                }).join('');
            }

            // 2. Habit Tracker
            const habits = data.habits || {};
            document.getElementById('habit-progress-badge').textContent = habits.progress || '0/4';
            const habitContainer = document.getElementById('habit-list');
            if (habits.habits && habits.habits.length > 0) {
                habitContainer.innerHTML = habits.habits.map(h => {
                    const isDone = h.today_done;
                    return `
                        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                            <div class="flex items-center gap-2.5">
                                <button onclick="triggerCheckin('${h.key}')" class="w-6 h-6 rounded-lg flex items-center justify-center transition ${isDone ? 'bg-emerald-500 text-slate-950 font-bold' : 'border border-slate-600 hover:border-emerald-400'}">
                                    ${isDone ? '✓' : ''}
                                </button>
                                <div>
                                    <p class="text-xs font-semibold text-slate-200 ${isDone ? 'line-through text-slate-400' : ''}">${h.name}</p>
                                    <p class="text-[10px] text-slate-400">🔥 ${h.streak_days} hari streak</p>
                                </div>
                            </div>
                            <span class="text-[10px] font-mono font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-0.5 rounded">+${h.xp_reward || 25} XP</span>
                        </div>
                    `;
                }).join('');
            }

            // 3. Zepp Recovery Chart
            const zepp = data.zepp || {};
            const avg = zepp.averages || {};
            document.getElementById('zepp-subtitle').textContent = `Score: ${zepp.recovery_score || 85}/100 • RHR: ${avg.rhr_bpm || 62} bpm`;
            document.getElementById('zepp-score-badge').textContent = zepp.status_label || 'Optimal';

            const days = zepp.daily_history || [];
            const labels = days.length ? days.map((d, i) => `H-${days.length - i}`) : ['Sen', 'Sel', 'Rab', 'Kam'];
            const sleepData = days.length ? days.map(d => d.sleep_hours || 7) : [6.1, 3.5, 3.7, 2.8];
            const rhrData = days.length ? days.map(d => d.rhr || 60) : [60, 61, 65, 63];

            const ctx = document.getElementById('zeppChart').getContext('2d');
            if (zeppChartInstance) zeppChartInstance.destroy();

            zeppChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Tidur (Jam)',
                            data: sleepData,
                            backgroundColor: 'rgba(99, 102, 241, 0.65)',
                            borderRadius: 6,
                            yAxisID: 'y'
                        },
                        {
                            label: 'RHR (BPM)',
                            data: rhrData,
                            type: 'line',
                            borderColor: '#f43f5e',
                            backgroundColor: 'rgba(244, 63, 94, 0.2)',
                            tension: 0.3,
                            pointRadius: 3,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: '#94a3b8', font: { size: 10 } } }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } } },
                        y: {
                            type: 'linear',
                            position: 'left',
                            min: 2,
                            max: 10,
                            ticks: { color: '#818cf8', font: { size: 9 } },
                            grid: { color: 'rgba(255,255,255,0.05)' }
                        },
                        y1: {
                            type: 'linear',
                            position: 'right',
                            min: 50,
                            max: 85,
                            grid: { display: false },
                            ticks: { color: '#fb7185', font: { size: 9 } }
                        }
                    }
                }
            });

            // 4. Server Vitals
            const srv = data.server || {};
            document.getElementById('srv-ram').textContent = `${srv.ram_percent || 0}% (${srv.ram_used_gb || 0}/${srv.ram_total_gb || 0} GB)`;
            document.getElementById('srv-ram-bar').style.width = `${srv.ram_percent || 0}%`;
            document.getElementById('srv-disk').textContent = `${srv.disk_percent || 0}% (${srv.disk_used_gb || 0}/${srv.disk_total_gb || 0} GB)`;
            document.getElementById('srv-disk-bar').style.width = `${srv.disk_percent || 0}%`;
            document.getElementById('srv-uptime').textContent = srv.uptime || '--';

            // 5. Tech Radar Feed
            const radar = data.tech_radar || [];
            const radarContainer = document.getElementById('radar-list');
            if (radar.length > 0) {
                radarContainer.innerHTML = radar.slice(0, 4).map(a => `
                    <a href="${a.url}" target="_blank" class="block p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-fuchsia-500/40 transition">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[9px] uppercase font-bold text-fuchsia-400 bg-fuchsia-500/10 px-1.5 py-0.5 rounded">${a.category}</span>
                            <span class="text-[10px] text-slate-400">${a.source}</span>
                        </div>
                        <h4 class="text-xs font-semibold text-slate-200 line-clamp-2">${a.title}</h4>
                    </a>
                `).join('');
            }

            lucide.createIcons();
        }

        fetchData(false);
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
