import React from 'react';
import {
  CloudSun,
  Wind,
  Droplets,
  Gauge,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Compass,
  Thermometer,
  Calendar,
  Activity,
  Radio,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function WeatherView({ weatherData }) {
  const { t } = useLanguage();

  if (!weatherData) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-xs">
        {t('loading', 'Memuat data cuaca Surabaya dan gempa BMKG...')}
      </div>
    );
  }

  const wData = weatherData.weather || weatherData || {};
  const current = wData.weather || wData.current || {};
  const aqi = wData.air_quality || weatherData.air_quality || {};
  const forecast = wData.forecast_7days || [];
  const latestQuake = weatherData.earthquake?.latest || (weatherData.earthquake?.magnitude ? weatherData.earthquake : null);
  const recentQuakes = weatherData.recent_earthquakes || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Surabaya Live Weather & AQI Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Weather Card (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-zinc-400" />
              <h3 className="font-semibold text-zinc-100 text-base">{wData.location || 'Surabaya, Jawa Timur'}</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">Live Weather & Radar</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <span className="text-6xl">{current.icon || '🌤️'}</span>
              <div>
                <p className="text-4xl sm:text-5xl font-bold text-zinc-100 font-mono">
                  {current.temperature_c !== undefined ? `${current.temperature_c}°C` : '--'}
                </p>
                <p className="text-xs font-medium text-zinc-300 mt-1">{current.condition || 'Cerah Berawan'}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {t('weather_feels_like', 'Terasa seperti')} <strong className="text-zinc-200">{current.feels_like_c !== undefined ? `${current.feels_like_c}°C` : '--'}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <Wind className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">{t('weather_wind_speed', 'Kecepatan Angin')}</p>
                  <p className="font-medium text-zinc-200">{current.wind_speed_kmh || '--'} km/h</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <Droplets className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">{t('weather_humidity', 'Kelembaban')}</p>
                  <p className="font-medium text-zinc-200">{current.humidity_percent || '--'}%</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <Compass className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">Arah Angin</p>
                  <p className="font-medium text-zinc-200">{current.wind_direction || 'Tenggara'}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <Gauge className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">Tekanan Udara</p>
                  <p className="font-medium text-zinc-200">{current.pressure_hpa || 1011} hPa</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AQI Card (1 col) */}
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-semibold text-zinc-100 text-sm">{t('weather_aqi_title', 'Indeks Kualitas Udara (AQI)')}</h4>
            <span className="text-[10px] text-zinc-500 font-mono">Surabaya Center</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline space-x-3">
              <p className="text-4xl font-bold text-zinc-100 font-mono">{aqi.aqi || 45}</p>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                {aqi.status || t('weather_aqi_good', 'Baik / Aman')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {aqi.advice || 'Kualitas udara sangat baik untuk beraktivitas di luar ruangan.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono flex justify-between">
            <span>PM2.5: {aqi.pm25 || 12.4} µg/m³</span>
            <span>PM10: {aqi.pm10 || 24.1} µg/m³</span>
          </div>
        </div>
      </div>

      {/* BMKG Real-time Earthquake Alert */}
      {latestQuake && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              <h4 className="font-bold text-zinc-100 text-sm tracking-wide">
                {t('weather_earthquake_title', 'Peringatan Dini Gempa BMKG')}
              </h4>
            </div>
            <span className="text-xs font-mono text-zinc-400">BMKG TEWS Realtime</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-500">{t('weather_quake_magnitude', 'Magnitudo')}</p>
              <p className="text-3xl font-bold text-rose-400 font-mono">{latestQuake.magnitude || '--'} M</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-500">{t('weather_quake_depth', 'Kedalaman')}</p>
              <p className="text-2xl font-bold text-zinc-100 font-mono">{latestQuake.depth || '--'}</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-500">{t('weather_quake_potential', 'Potensi Tsunami')}</p>
              <p className="text-sm font-semibold text-emerald-400 mt-2">{latestQuake.tsunami_potential || 'Tidak Berpotensi'}</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-500">{t('weather_quake_distance', 'Jarak ke Surabaya')}</p>
              <p className="text-2xl font-bold text-zinc-300 font-mono">{latestQuake.distance_surabaya_km || '--'} km</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-1">
            <p><strong className="text-zinc-200">{t('weather_quake_epicenter', 'Pusat Gempa')}:</strong> {latestQuake.epicenter || '--'}</p>
            <p className="text-zinc-400 font-mono text-[11px]">Waktu: {latestQuake.datetime || '--'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
