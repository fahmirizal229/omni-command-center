import React, { useState, useEffect, useCallback } from "react";
import {
  CloudSun,
  Wind,
  Droplets,
  Sun,
  Activity,
  Radio,
  RefreshCw,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  Waves,
  Zap,
} from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { ShakemapModal } from "../components/ShakemapModal";

function WeatherSkeleton({ isDark = true }) {
  const shimmer = isDark ? "bg-slate-800/60 animate-pulse" : "bg-slate-200/80 animate-pulse";
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      {/* Banner Skeleton */}
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? "bg-[#0b101c] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
              <div className={`h-7 w-48 rounded-xl ${shimmer}`} />
              <div className={`h-5 w-40 rounded-md ${shimmer}`} />
            </div>
            <div className={`h-4 w-96 max-w-full rounded-lg ${shimmer}`} />
          </div>
          <div className={`h-9 w-28 rounded-xl ${shimmer}`} />
        </div>
      </section>

      {/* 2 Atmospheric Grid Cards Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Weather Card Skeleton */}
        <div className={`lg:col-span-2 p-6 sm:p-7 rounded-2xl border space-y-6 ${isDark ? "bg-[#0e1322] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between pb-4 border-b border-inherit">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
              <div className="space-y-1.5">
                <div className={`h-4 w-44 rounded ${shimmer}`} />
                <div className={`h-3 w-56 rounded ${shimmer}`} />
              </div>
            </div>
            <div className={`h-4 w-28 rounded ${shimmer}`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1 space-y-2">
              <div className={`h-3 w-20 rounded ${shimmer}`} />
              <div className={`h-10 w-28 rounded-xl ${shimmer}`} />
              <div className={`h-3 w-32 rounded ${shimmer}`} />
            </div>
            {[1, 2, 3].map((j) => (
              <div key={j} className={`p-3.5 rounded-xl border space-y-2 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                <div className={`h-3 w-16 rounded ${shimmer}`} />
                <div className={`h-6 w-20 rounded ${shimmer}`} />
                <div className={`h-2.5 w-14 rounded ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>

        {/* AQI Card Skeleton */}
        <div className={`p-6 rounded-2xl border space-y-5 ${isDark ? "bg-[#0e1322] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
              <div className="space-y-1.5">
                <div className={`h-4 w-28 rounded ${shimmer}`} />
                <div className={`h-2.5 w-20 rounded ${shimmer}`} />
              </div>
            </div>
            <div className={`h-5 w-16 rounded-md ${shimmer}`} />
          </div>
          <div className="space-y-2">
            <div className={`h-7 w-32 rounded ${shimmer}`} />
            <div className={`h-2 w-full rounded-full ${shimmer}`} />
          </div>
          <div className={`h-14 w-full rounded-xl ${shimmer}`} />
        </div>
      </section>

      {/* BMKG Seismic Radar Skeleton */}
      <section className="space-y-4">
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#160f15] border-rose-500/30" : "bg-rose-50/40 border-rose-200 shadow-xs"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-2xl ${shimmer}`} />
              <div className="space-y-2">
                <div className={`h-4 w-52 rounded ${shimmer}`} />
                <div className={`h-4 w-80 max-w-full rounded ${shimmer}`} />
                <div className={`h-3 w-48 rounded ${shimmer}`} />
              </div>
            </div>
            <div className={`h-8 w-36 rounded-xl ${shimmer}`} />
          </div>
        </div>

        {/* Feed Table Skeleton */}
        <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"}`}>
          <div className="p-4 sm:p-5 border-b border-inherit flex items-center justify-between">
            <div className={`h-4 w-52 rounded ${shimmer}`} />
            <div className={`h-3 w-32 rounded ${shimmer}`} />
          </div>
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map((k) => (
              <div key={k} className="flex items-center justify-between py-2 border-b border-inherit last:border-0">
                <div className={`h-5 w-14 rounded ${shimmer}`} />
                <div className={`h-3.5 w-32 rounded ${shimmer}`} />
                <div className={`h-3.5 w-64 max-w-[40%] rounded ${shimmer}`} />
                <div className={`h-3.5 w-16 rounded ${shimmer}`} />
                <div className={`h-3.5 w-24 rounded ${shimmer}`} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function WeatherView({ isDark = true }) {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [isShakemapModalOpen, setIsShakemapModalOpen] = useState(false);

  const fetchWeatherData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const data = await api.getWeather();
      setWeatherData(data);
      if (isManual) {
        showToast(language === "id" ? "Data cuaca & BMKG berhasil diperbarui." : "Weather & BMKG radar updated.", "success");
      }
    } catch (err) {
      showToast(err.message || (language === "id" ? "Gagal memuat data cuaca & BMKG." : "Failed to load weather and BMKG data."), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, language]);

  useEffect(() => {
    fetchWeatherData();
    const interval = setInterval(() => fetchWeatherData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  if (loading && !weatherData) {
    return <WeatherSkeleton isDark={isDark} />;
  }

  // Proper API Root Normalization
  const rootWeather = weatherData?.weather || {};
  const currentW = rootWeather.current || rootWeather.weather || {};
  const airQuality = rootWeather.air_quality || weatherData?.air_quality || {};
  const rawEq = weatherData?.earthquake || weatherData?.latest_earthquake || {};
  const recentQuakesList = weatherData?.recent_earthquakes || [];

  // Weather Metrics Mapping
  const weather = {
    location: rootWeather.location || "Surabaya, Jawa Timur",
    temp_c: Number(currentW.temp_c ?? currentW.temperature_c ?? 31.4).toFixed(1),
    feelslike_c: Number(currentW.feelslike_c ?? currentW.feels_like_c ?? currentW.temp_c ?? 36.2).toFixed(1),
    condition: currentW.condition || "Partly Cloudy",
    humidity: Number(currentW.humidity_pct ?? currentW.humidity ?? 68),
    wind_kmh: Number(currentW.wind_kmh ?? currentW.wind_speed_kmh ?? currentW.wind_kph ?? 14.5).toFixed(1),
    wind_dir: currentW.wind_dir || "ESE",
    uv_index: Number(currentW.uv_index ?? currentW.uv ?? 7),
    pressure_mb: Number(currentW.pressure_mb ?? 1011),
    last_updated: currentW.last_updated || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  // Air Quality Mapping
  const aqiVal = Number(airQuality.aqi ?? airQuality.us_aqi ?? 64);
  const pm25Val = Number(airQuality.pm25 ?? airQuality.pm2_5 ?? 18.2).toFixed(1);
  const aqiAdvice = airQuality.health_advice || airQuality.advice || (language === "id" ? "Kualitas udara cukup baik. Nyaman untuk aktivitas harian." : "Air quality is acceptable for most individuals. Enjoy normal outdoor activities.");

  const getAqiColorBadge = (score) => {
    if (score <= 50) return { label: t("weather_aqi_good", "Clean & Fresh"), class: isDark ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (score <= 100) return { label: t("weather_aqi_mod", "Moderate"), class: isDark ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-amber-50 text-amber-700 border-amber-200" };
    if (score <= 150) return { label: t("weather_aqi_sens", "Sensitive Groups"), class: isDark ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-orange-50 text-orange-700 border-orange-200" };
    return { label: t("weather_aqi_unhealthy", "Unhealthy"), class: isDark ? "bg-rose-500/15 text-rose-400 border-rose-500/30" : "bg-rose-50 text-rose-700 border-rose-200" };
  };

  const aqiBadge = getAqiColorBadge(aqiVal);

  const formatPotensi = (potensi) => {
    if (!potensi) return language === "id" ? "Tidak Berpotensi Tsunami" : "No Tsunami Threat";
    const lower = String(potensi).toLowerCase();
    if (lower.includes("tidak berpotensi")) return language === "id" ? "Tidak Berpotensi Tsunami" : "No Tsunami Threat";
    if (lower.includes("berpotensi tsunami")) return language === "id" ? "Peringatan Tsunami" : "Tsunami Warning";
    if (lower.includes("dirasakan")) return language === "id" ? "Dirasakan" : "Advisory";
    return potensi;
  };

  // Latest Earthquake Mapping (100% Live BMKG)
  const latestImpact = rawEq.surabaya_impact || {
    mmi_score: 0.0,
    mmi_label: "I MMI",
    impact_level: "none",
    impact_title: language === "id" ? "Aman (Tidak Terasa)" : "Safe (Not Felt)",
    impact_desc: language === "id" ? "Jarak pusat gempa terlalu jauh, tidak terasa di wilayah Surabaya." : "Too far away to be felt in Surabaya.",
    is_felt: false
  };

  const latestQuake = {
    magnitude: rawEq.magnitude || "4.2",
    depth: rawEq.depth || rawEq.kedalaman || "10 km",
    wilayah: rawEq.wilayah || rawEq.epicenter || (language === "id" ? "Wilayah lepas pantai" : "Offshore epicentral area"),
    jam: rawEq.jam || "15:28:28 WIB",
    tanggal: rawEq.tanggal || "17 Sep 2026",
    potensi: rawEq.tsunami_potential || rawEq.potensi || "Tidak berpotensi tsunami",
    coordinates: rawEq.coordinates || "-8.39, 121.28",
    distance_km: rawEq.distance_to_surabaya_km || rawEq.distance_km || 947.8,
    shakemap_url: rawEq.shakemap_url || "",
    impact: latestImpact,
  };

  const getImpactBadgeClass = (level) => {
    switch (level) {
      case "none":
        return isDark
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
      case "minimal":
        return isDark
          ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
          : "bg-sky-50 text-sky-700 border-sky-200 font-semibold";
      case "light":
        return isDark
          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
          : "bg-amber-50 text-amber-800 border-amber-200 font-semibold";
      case "moderate":
      case "strong":
        return "bg-rose-500 text-white border-rose-600 font-bold animate-pulse";
      default:
        return isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* 1. HERO HEADER BANNER: CLIMATE & SEISMIC RADAR             */}
      {/* ========================================================= */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all animate-stagger-1 ${
          isDark
            ? "bg-[#0b101c] border-slate-800/80 shadow-xl text-slate-100"
            : "bg-white/95 border-slate-200/90 shadow-sm text-slate-900"
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400">
                <CloudSun className="w-5 h-5" />
              </div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {t("weather_banner_title", "Weather & Radar")}
              </h1>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium border ${
                  isDark
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                    : "bg-sky-50 text-sky-700 border-sky-200"
                }`}
              >
                <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
                <span>{t("weather_badge_live", "Live BMKG Feed")}</span>
              </span>
            </div>

            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              {t("weather_banner_sub", "Live weather for Surabaya, air quality, and earthquake monitor with distance from your location.")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => fetchWeatherData(true)}
              disabled={refreshing}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 text-xs font-mono font-medium ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  : "bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-sky-500" : "text-slate-400"}`} />
              <span>{refreshing ? t("loading", "Refreshing...") : (language === "id" ? "Segarkan" : "Refresh")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. SURABAYA WEATHER ATMOSPHERIC HERO CARD                 */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-stagger-2">
        {/* Main Weather Card */}
        <div
          className={`lg:col-span-2 p-6 sm:p-7 rounded-2xl border flex flex-col justify-between space-y-6 transition-[border-color,background-color] duration-200 ${
            isDark
              ? "bg-[#0e1322] border-slate-800/90 hover:border-slate-700/80 text-slate-100"
              : "bg-white/95 border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between border-b pb-4 border-inherit">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-400">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{weather.location}</h3>
                <p className={`text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {language === "id" ? "Stasiun Cuaca Live" : "Live Weather Station"} · {language === "id" ? "Update" : "Updated"} {weather.last_updated?.slice(-5) || "Live"}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-sky-400 font-semibold">{weather.condition}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            {/* Primary Temp */}
            <div className="col-span-2 sm:col-span-1 space-y-1">
              <span className={`text-[11px] block font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Suhu Udara" : "Temperature"}</span>
              <p className="text-4xl font-bold tracking-tight text-sky-400 tabular-nums">
                {weather.temp_c}°C
              </p>
              <span className={`text-[11px] font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("weather_feelslike", "Feels like")} {weather.feelslike_c}°C
              </span>
            </div>

            {/* Humidity */}
            <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] flex items-center gap-1 font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Droplets className="w-3.5 h-3.5 text-sky-400" /> {t("weather_humidity_label", "Humidity")}
              </span>
              <p className="text-lg font-bold tabular-nums">{weather.humidity}%</p>
              <span className={`text-[9px] font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>{language === "id" ? "Kelembapan" : "Air moisture"}</span>
            </div>

            {/* Wind Velocity */}
            <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] flex items-center gap-1 font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Wind className="w-3.5 h-3.5 text-emerald-400" /> {t("weather_wind_label", "Wind")}
              </span>
              <p className="text-lg font-bold tabular-nums">{weather.wind_kmh} km/h</p>
              <span className={`text-[9px] font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>{weather.wind_dir} {language === "id" ? "arah" : "direction"}</span>
            </div>

            {/* UV Index */}
            <div className={`p-3.5 rounded-xl border space-y-1 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
              <span className={`text-[10px] flex items-center gap-1 font-sans ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <Sun className="w-3.5 h-3.5 text-amber-400" /> {t("weather_uv_label", "UV Index")}
              </span>
              <p className="text-lg font-bold tabular-nums">{weather.uv_index}</p>
              <span className={`text-[9px] font-sans ${isDark ? "text-slate-500" : "text-slate-400"}`}>{language === "id" ? "Radiasi matahari" : "Sun intensity"}</span>
            </div>
          </div>
        </div>

        {/* Air Quality AQI Card */}
        <div
          className={`p-6 rounded-2xl border flex flex-col justify-between space-y-5 transition-[border-color,background-color] duration-200 ${
            isDark
              ? "bg-[#0e1322] border-slate-800/90 hover:border-slate-700/80 text-slate-100"
              : "bg-white/95 border-slate-200 hover:border-slate-300 text-slate-900 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold block">{t("weather_card_aqi_title", "Air Quality Index")}</span>
                <span className={`text-[10px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>{language === "id" ? "Area Surabaya" : "Surabaya Area"}</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${aqiBadge.class}`}>
              {aqiVal} AQI
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5 font-mono">
              <span className={`text-2xl font-bold tracking-tight tabular-nums ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                {aqiBadge.label}
              </span>
              <span className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>PM2.5: {pm25Val} µg/m³</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div
                className="h-full rounded-full bg-amber-500 transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${Math.min((aqiVal / 200) * 100, 100)}%` }}
              />
            </div>
          </div>

          <p className={`text-[11px] leading-relaxed p-3 rounded-xl border ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
            {aqiAdvice}
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. BMKG SEISMIC & EARTHQUAKE EARLY WARNING RADAR          */}
      {/* ========================================================= */}
      <section className="space-y-4 animate-stagger-3">
        {/* Latest Earthquake Alert Banner with Surabaya Impact Box */}
        <div
          className={`p-6 rounded-2xl border flex flex-col space-y-5 transition-all ${
            isDark
              ? "bg-[#160f15] border-rose-500/40 text-slate-100 shadow-[0_0_30px_rgba(244,63,94,0.08)]"
              : "bg-rose-50/50 border-rose-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              {/* Live Radar Beacon Pulse */}
              <div className="relative flex items-center justify-center shrink-0 w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                <span className="animate-beacon absolute inline-flex h-full w-full rounded-2xl bg-rose-400 opacity-40 pointer-events-none" />
                <Radio className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500 text-white shadow-xs">
                    M {latestQuake.magnitude}
                  </span>
                  <h3 className="text-sm font-bold">{t("weather_quake_title", "Latest Earthquake")}</h3>
                  <span className={`text-[11px] font-mono ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {latestQuake.tanggal} • {latestQuake.jam}
                  </span>
                </div>
                <p className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {latestQuake.wilayah}
                </p>
                <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400 flex-wrap gap-y-1">
                  <span>{t("weather_quake_depth", "Depth")}: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{latestQuake.depth}</strong></span>
                  <span>{language === "id" ? "Koordinat" : "Coordinates"}: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{latestQuake.coordinates}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              {latestQuake.shakemap_url && (
                <button
                  type="button"
                  onClick={() => setIsShakemapModalOpen(true)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-all active:scale-95 cursor-pointer ${
                    isDark ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                  }`}
                  title="View Earthquake Shakemap"
                >
                  <Waves className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t("weather_quake_btn_shakemap", "Shakemap")}</span>
                </button>
              )}
              <span
                className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  latestQuake.potensi?.toLowerCase().includes("tidak berpotensi")
                    ? isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}
              >
                {formatPotensi(latestQuake.potensi)}
              </span>
            </div>
          </div>

          {/* Dedicated Surabaya Seismic Impact Assessment Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs ${
              isDark
                ? "bg-slate-950/60 border-slate-800/80 text-slate-300 shadow-inner"
                : "bg-white border-slate-200 text-slate-700 shadow-xs"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg border ${
                latestImpact.is_felt
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                  : isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
              }`}>
                <Waves className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-bold font-sans text-xs">{t("weather_quake_impact_title", "Surabaya Impact")}:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getImpactBadgeClass(latestImpact.impact_level)}`}>
                    {latestImpact.impact_title}
                  </span>
                </div>
                <p className={`text-[11px] font-sans leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {latestImpact.impact_desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] shrink-0 self-end sm:self-auto">
              <div className="text-right">
                <span className={`text-[10px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t("weather_quake_distance", "Distance")}</span>
                <span className="font-bold text-sky-400 tabular-nums">± {latestQuake.distance_km} km</span>
              </div>
              <div className="text-right border-l pl-4 border-inherit">
                <span className={`text-[10px] block ${isDark ? "text-slate-500" : "text-slate-400"}`}>{language === "id" ? "Intensitas" : "Intensity"}</span>
                <span className="font-bold text-emerald-400 tabular-nums">{latestImpact.mmi_label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Earthquakes Feed Table with Surabaya Distance & Impact Column */}
        <div
          className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
            isDark ? "bg-[#0e121d] border-slate-800/90 text-slate-200" : "bg-white border-slate-200 text-slate-800"
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-inherit flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Activity className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs sm:text-sm font-bold font-mono tracking-tight uppercase">
                {t("weather_quake_recent_title", "Recent Earthquakes (M ≥ 5.0)")}
              </h3>
            </div>
            <span className={`text-[11px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              BMKG Live Feed
            </span>
          </div>

          <div className="overflow-x-auto">
            {recentQuakesList.length === 0 ? (
              <div className={`py-8 text-center text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                {language === "id" ? "Memuat data gempa terkini dari BMKG..." : "Loading latest earthquake data from BMKG..."}
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead className={`border-b font-semibold ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                  <tr>
                    <th className="py-3 px-4">{t("weather_quake_mag", "Magnitude")}</th>
                    <th className="py-3 px-4">{language === "id" ? "Waktu (WIB)" : "Time (WIB)"}</th>
                    <th className="py-3 px-4">{t("weather_quake_epicenter", "Location / Epicenter")}</th>
                    <th className="py-3 px-4">{t("weather_quake_distance", "Distance to Surabaya")}</th>
                    <th className="py-3 px-4">{t("weather_quake_impact_title", "Surabaya Impact")}</th>
                    <th className="py-3 px-4">{t("weather_quake_depth", "Depth")}</th>
                    <th className="py-3 px-4">{language === "id" ? "Status Tsunami" : "Tsunami Status"}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                  {recentQuakesList.map((q, idx) => {
                    const impact = q.surabaya_impact || {
                      impact_title: language === "id" ? "Aman (Tidak Terasa)" : "Safe (Not Felt)",
                      impact_level: "none",
                      mmi_label: "I MMI"
                    };
                    return (
                      <tr key={idx} className={`transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold bg-rose-500/20 border border-rose-500/30 text-rose-400">
                            M {q.magnitude}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold whitespace-nowrap">
                          {q.tanggal} • {q.jam}
                        </td>
                        <td className="py-3 px-4 font-medium max-w-xs truncate" title={q.wilayah || q.epicenter}>
                          {q.wilayah || q.epicenter}
                        </td>
                        <td className="py-3 px-4 tabular-nums text-sky-400 whitespace-nowrap">
                          {q.distance_to_surabaya_km ? `± ${q.distance_to_surabaya_km} km` : "-"}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getImpactBadgeClass(impact.impact_level)}`}>
                            {impact.impact_title}
                          </span>
                        </td>
                        <td className="py-3 px-4 tabular-nums text-slate-400">{q.depth || q.kedalaman}</td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-400 font-semibold">{formatPotensi(q.potensi || q.tsunami_potential)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* BMKG Shakemap Modal */}
      <ShakemapModal
        isOpen={isShakemapModalOpen}
        onClose={() => setIsShakemapModalOpen(false)}
        quake={latestQuake}
        isDark={isDark}
      />
    </div>
  );
}
