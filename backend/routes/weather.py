"""
Weather, Air Quality (AQI), and BMKG Earthquake Alerts API router (/api/weather).
"""

from fastapi import APIRouter, Depends

from backend.config import fetch_weather_and_aqi, fetch_latest_earthquake, fetch_recent_earthquakes
from backend.security import get_current_user

router = APIRouter(prefix="/api/weather", tags=["Weather & BMKG"])


@router.get("")
def get_weather_detail(current_user: str = Depends(get_current_user)):
    """Detailed live weather, AQI, and BMKG Earthquake alerts for Surabaya & Indonesia."""
    weather_data = {}
    earthquake_data = {}
    recent_earthquakes = []

    if fetch_weather_and_aqi:
        try:
            weather_data = fetch_weather_and_aqi(-7.2575, 112.7521, "Surabaya, Jawa Timur")
        except Exception as e:
            weather_data = {"error": str(e)}

    if fetch_latest_earthquake:
        try:
            earthquake_data = fetch_latest_earthquake()
        except Exception as e:
            earthquake_data = {"error": str(e)}

    if fetch_recent_earthquakes:
        try:
            recent_earthquakes = fetch_recent_earthquakes(limit=5)
        except Exception as e:
            recent_earthquakes = []

    return {
        "weather": weather_data,
        "earthquake": earthquake_data,
        "recent_earthquakes": recent_earthquakes
    }
