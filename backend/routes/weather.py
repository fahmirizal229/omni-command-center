"""
Weather, Air Quality (AQI), and BMKG Earthquake Alerts API router (/api/weather).
"""

import urllib.request
import urllib.parse
import json
import math
import time
from typing import Any, List, Dict
from fastapi import APIRouter, Depends

from backend.config import fetch_weather_and_aqi, fetch_latest_earthquake, fetch_recent_earthquakes
from backend.security import get_current_user

router = APIRouter(prefix="/api/weather", tags=["Weather & BMKG"])

BMKG_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 ArusukaWeather/2.0",
    "Accept": "application/json, text/plain, */*"
}

SURABAYA_LAT = -7.2575
SURABAYA_LON = 112.7521


def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great circle distance between two coordinates in km."""
    r = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 1)


def parse_coords(coord_str: str) -> tuple[float, float] | None:
    if not coord_str:
        return None
    try:
        parts = [p.strip() for p in coord_str.split(",")]
        if len(parts) == 2:
            return float(parts[0]), float(parts[1])
    except Exception:
        pass
    return None


def parse_depth_km(depth_str: str) -> float:
    if not depth_str:
        return 10.0
    cleaned = "".join(c for c in str(depth_str) if c.isdigit() or c == ".")
    try:
        return float(cleaned) if cleaned else 10.0
    except ValueError:
        return 10.0


def calculate_surabaya_seismic_impact(magnitude_raw: Any, depth_raw: Any, dist_km: float | None) -> dict[str, Any]:
    """
    Hitung estimasi intensitas getaran Modified Mercalli Intensity (MMI) di Surabaya
    berdasarkan Ground Motion Prediction Equation (GMPE) atenuasi gelombang seismik Indonesia.
    Hypocentral distance R = sqrt(dist_km^2 + depth_km^2)
    """
    try:
        mag = float(str(magnitude_raw).replace(",", "."))
    except Exception:
        mag = 5.0

    depth = parse_depth_km(depth_raw)

    if dist_km is None:
        return {
            "mmi_score": 0.0,
            "mmi_label": "N/A",
            "impact_level": "unknown",
            "impact_title": "Data Tidak Lengkap",
            "impact_desc": "Koordinat episentrum tidak tersedia",
            "is_felt": False
        }

    # Jarak hiposentrum (R)
    hypo_dist = math.sqrt((dist_km ** 2) + (depth ** 2))
    hypo_dist = max(hypo_dist, 5.0)

    # Formula Atenuasi Intensitas Gempa BMKG / Gutenberg-Richter adaptasi Jawa-Nusantara:
    # I = 1.5 * M - 3.5 * log10(R) + 3.0
    raw_mmi = (1.5 * mag) - (3.5 * math.log10(hypo_dist)) + 3.0
    mmi_score = max(0.0, round(raw_mmi, 1))

    if mmi_score < 1.5:
        return {
            "mmi_score": mmi_score,
            "mmi_label": "I MMI",
            "impact_level": "none",
            "impact_title": "Safe (Not Felt)",
            "impact_desc": f"At {dist_km:,.0f} km away, this earthquake is too far to be felt in Surabaya.",
            "is_felt": False
        }
    elif mmi_score < 2.5:
        return {
            "mmi_score": mmi_score,
            "mmi_label": "I - II MMI",
            "impact_level": "minimal",
            "impact_title": "Very Slight (High Floors)",
            "impact_desc": "Extremely faint tremor, may only be felt by people on upper floors of tall buildings in Surabaya.",
            "is_felt": True
        }
    elif mmi_score < 3.5:
        return {
            "mmi_score": mmi_score,
            "mmi_label": "II - III MMI",
            "impact_level": "light",
            "impact_title": "Light Tremor in Surabaya",
            "impact_desc": "Mild vibration like a light truck passing by, hanging lamps may swing gently in Surabaya.",
            "is_felt": True
        }
    elif mmi_score < 4.5:
        return {
            "mmi_score": mmi_score,
            "mmi_label": "III - IV MMI",
            "impact_level": "moderate",
            "impact_title": "Noticeable in Surabaya",
            "impact_desc": "Felt by many indoors across Surabaya. Windows and doors may rattle.",
            "is_felt": True
        }
    else:
        return {
            "mmi_score": mmi_score,
            "mmi_label": "≥ IV MMI",
            "impact_level": "strong",
            "impact_title": "Strong Shaking — Take Caution",
            "impact_desc": "Strong shaking felt clearly across Surabaya. Stay alert and stay safe.",
            "is_felt": True
        }


def fetch_live_bmkg_m5_quakes(limit: int = 10) -> list[dict[str, Any]]:
    """Fetch live M 5.0+ earthquakes directly from BMKG TEWS."""
    url = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
    results = []
    try:
        req = urllib.request.Request(url, headers=BMKG_HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("Infogempa", {}).get("gempa", [])
                if isinstance(items, dict):
                    items = [items]
                for item in items:
                    coords = parse_coords(item.get("Coordinates", ""))
                    dist_km = calculate_distance_km(SURABAYA_LAT, SURABAYA_LON, coords[0], coords[1]) if coords else None
                    impact = calculate_surabaya_seismic_impact(item.get("Magnitude"), item.get("Kedalaman"), dist_km)
                    results.append({
                        "tanggal": item.get("Tanggal"),
                        "jam": item.get("Jam"),
                        "datetime": item.get("DateTime"),
                        "magnitude": item.get("Magnitude"),
                        "kedalaman": item.get("Kedalaman"),
                        "depth": item.get("Kedalaman"),
                        "wilayah": item.get("Wilayah"),
                        "epicenter": item.get("Wilayah"),
                        "potensi": item.get("Potensi", "Tidak berpotensi tsunami"),
                        "tsunami_potential": item.get("Potensi", "Tidak berpotensi tsunami"),
                        "tsunami_status": item.get("Potensi", "Tidak berpotensi tsunami"),
                        "coordinates": item.get("Coordinates"),
                        "distance_to_surabaya_km": dist_km,
                        "distance_km": dist_km,
                        "surabaya_impact": impact,
                        "type": "m5_plus"
                    })
                return results[:limit]
    except Exception:
        pass
    return results


def fetch_live_bmkg_latest_quake() -> dict[str, Any] | None:
    """Fetch the latest official earthquake from BMKG autogempa.json."""
    url = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json"
    try:
        req = urllib.request.Request(url, headers=BMKG_HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                gempa = data.get("Infogempa", {}).get("gempa", {})
                if gempa:
                    shakemap_file = gempa.get("Shakemap", "")
                    shakemap_url = f"https://data.bmkg.go.id/DataMKG/TEWS/{shakemap_file}" if shakemap_file else ""
                    coords = parse_coords(gempa.get("Coordinates", ""))
                    dist_km = calculate_distance_km(SURABAYA_LAT, SURABAYA_LON, coords[0], coords[1]) if coords else None
                    impact = calculate_surabaya_seismic_impact(gempa.get("Magnitude"), gempa.get("Kedalaman"), dist_km)
                    return {
                        "tanggal": gempa.get("Tanggal"),
                        "jam": gempa.get("Jam"),
                        "datetime": gempa.get("DateTime"),
                        "magnitude": gempa.get("Magnitude"),
                        "kedalaman": gempa.get("Kedalaman"),
                        "depth": gempa.get("Kedalaman"),
                        "wilayah": gempa.get("Wilayah"),
                        "epicenter": gempa.get("Wilayah"),
                        "potensi": gempa.get("Potensi"),
                        "tsunami_potential": gempa.get("Potensi"),
                        "tsunami_status": gempa.get("Potensi"),
                        "dirasakan": gempa.get("Dirasakan"),
                        "coordinates": gempa.get("Coordinates"),
                        "distance_to_surabaya_km": dist_km,
                        "distance_km": dist_km,
                        "shakemap_url": shakemap_url,
                        "surabaya_impact": impact,
                    }
    except Exception:
        pass
    return None


@router.get("")
def get_weather_detail(current_user: str = Depends(get_current_user)):
    """Detailed live weather, AQI, and BMKG Earthquake alerts for Surabaya & Indonesia."""
    weather_data = {}

    # 1. Weather & AQI
    if fetch_weather_and_aqi:
        try:
            raw_w = fetch_weather_and_aqi(SURABAYA_LAT, SURABAYA_LON, "Surabaya, Jawa Timur")
            if raw_w and not raw_w.get("error"):
                aq = raw_w.get("air_quality", {})
                w_current = raw_w.get("weather", {})

                normalized_aq = {
                    **aq,
                    "aqi": aq.get("us_aqi", 0),
                    "us_aqi": aq.get("us_aqi", 0),
                    "status": aq.get("category", "Baik (Good)"),
                    "category": aq.get("category", "Baik (Good)"),
                    "pm25": aq.get("pm2_5", 0.0),
                    "pm2_5": aq.get("pm2_5", 0.0),
                    "pm10": aq.get("pm10", 0.0),
                    "advice": aq.get("health_advice", ""),
                    "health_advice": aq.get("health_advice", ""),
                }

                weather_data = {
                    **raw_w,
                    "air_quality": normalized_aq,
                    "current": w_current,
                }
            else:
                weather_data = raw_w
        except Exception as e:
            weather_data = {"error": str(e)}

    # 2. Latest Earthquake (Live BMKG Direct with fallback)
    earthquake_data = fetch_live_bmkg_latest_quake()
    if not earthquake_data and fetch_latest_earthquake:
        try:
            earthquake_data = fetch_latest_earthquake()
        except Exception:
            pass

    # 3. Recent M 5.0+ Earthquakes (Live BMKG Direct with fallback)
    recent_earthquakes = fetch_live_bmkg_m5_quakes(limit=10)
    if not recent_earthquakes and fetch_recent_earthquakes:
        try:
            recent_earthquakes = fetch_recent_earthquakes(limit=10)
        except Exception:
            pass

    return {
        "weather": weather_data,
        "earthquake": earthquake_data or {},
        "recent_earthquakes": recent_earthquakes or [],
    }

