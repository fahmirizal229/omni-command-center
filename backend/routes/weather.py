"""
Weather, Air Quality (AQI), and BMKG Earthquake Alerts API router (/api/weather).
"""

from fastapi import APIRouter, Depends

from backend.config import fetch_weather_and_aqi, fetch_latest_earthquake, fetch_recent_earthquakes
from backend.security import get_current_user

router = APIRouter(prefix="/api/weather", tags=["Weather & BMKG"])


def parse_tsunami_status(raw_potensi: str) -> tuple[str, bool]:
    """Parse raw BMKG Potensi field into clear tsunami status and danger boolean."""
    if not raw_potensi:
        return "Tidak Berpotensi", False
    lower = raw_potensi.lower()
    if "berpotensi tsunami" in lower and "tidak" not in lower:
        return "Berpotensi Tsunami", True
    if "tidak berpotensi" in lower:
        return "Tidak Berpotensi", False
    if "dirasakan" in lower:
        return "Tidak Berpotensi (Darat)", False
    return raw_potensi, False


@router.get("")
def get_weather_detail(current_user: str = Depends(get_current_user)):
    """Detailed live weather, AQI, and BMKG Earthquake alerts for Surabaya & Indonesia."""
    weather_data = {}
    earthquake_data = {}
    recent_earthquakes = []

    if fetch_weather_and_aqi:
        try:
            raw_w = fetch_weather_and_aqi(-7.2575, 112.7521, "Surabaya, Jawa Timur")
            if raw_w and not raw_w.get("error"):
                aq = raw_w.get("air_quality", {})
                w_current = raw_w.get("weather", {})

                # Normalize air quality
                normalized_aq = {
                    **aq,
                    "aqi": aq.get("us_aqi", 0),
                    "us_aqi": aq.get("us_aqi", 0),
                    "status": aq.get("category", "Baik (Good)"),
                    "category": aq.get("category", "Baik (Good)"),
                    "pm25": aq.get("pm2_5", 0.0),
                    "pm2_5": aq.get("pm2_5", 0.0),
                    "pm10": aq.get("pm10", 0.0),
                    "co": aq.get("carbon_monoxide", 0.0),
                    "no2": aq.get("nitrogen_dioxide", 0.0),
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

    if fetch_latest_earthquake:
        try:
            raw_eq = fetch_latest_earthquake()
            if raw_eq and not raw_eq.get("error"):
                potensi_raw = raw_eq.get("potensi", "")
                tsunami_label, is_tsunami_danger = parse_tsunami_status(potensi_raw)
                earthquake_data = {
                    **raw_eq,
                    "depth": raw_eq.get("kedalaman", ""),
                    "epicenter": raw_eq.get("wilayah", ""),
                    "tsunami_potential": tsunami_label,
                    "tsunami_status": tsunami_label,
                    "is_tsunami_danger": is_tsunami_danger,
                    "raw_potensi": potensi_raw,
                    "distance_surabaya_km": raw_eq.get("distance_to_surabaya_km"),
                    "distance_km": raw_eq.get("distance_to_surabaya_km"),
                }
            else:
                earthquake_data = raw_eq
        except Exception as e:
            earthquake_data = {"error": str(e)}

    if fetch_recent_earthquakes:
        try:
            raw_recent = fetch_recent_earthquakes(limit=5)
            if isinstance(raw_recent, list):
                recent_earthquakes = []
                for item in raw_recent:
                    potensi_item = item.get("potensi", "")
                    tsunami_lbl, is_danger = parse_tsunami_status(potensi_item)
                    recent_earthquakes.append({
                        **item,
                        "depth": item.get("kedalaman", ""),
                        "epicenter": item.get("wilayah", ""),
                        "tsunami_potential": tsunami_lbl,
                        "tsunami_status": tsunami_lbl,
                        "is_tsunami_danger": is_danger,
                        "raw_potensi": potensi_item,
                        "distance_surabaya_km": item.get("distance_to_surabaya_km"),
                        "distance_km": item.get("distance_to_surabaya_km"),
                    })
            else:
                recent_earthquakes = []
        except Exception as e:
            recent_earthquakes = []

    return {
        "weather": weather_data,
        "earthquake": earthquake_data,
        "recent_earthquakes": recent_earthquakes,
    }
