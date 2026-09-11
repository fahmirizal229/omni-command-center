import React, { useState } from 'react';
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
  ExternalLink,
  Eye,
  X,
  Clock,
  CloudRain
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function WeatherView({ weatherData }) {
  const { t, language } = useLanguage();
  const [selectedShakemap, setSelectedShakemap] = useState(null);

  if (!weatherData) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-xs">
        {t('loading', 'Memuat data cuaca Surabaya dan gempa BMKG...')}
      </div>
    );
  }

  const wData = weatherData.weather || weatherData || {};
  const current = wData.current || wData.weather || {};
  const aqi = wData.air_quality || weatherData.air_quality || {};
  const forecast = wData.forecast_7days || [];
  const latestQuake = weatherData.earthquake?.latest || (weatherData.earthquake?.magnitude ? weatherData.earthquake : null);
  const recentQuakes = weatherData.recent_earthquakes || [];

  // AQI color helper
  const getAqiBadgeColor = (val) => {
    const num = Number(val) || 0;
    if (num <= 50) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (num <= 100) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    if (num <= 150) return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    if (num <= 200) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (num <= 300) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-red-950 text-red-300 border-red-700/50';
  };

  // Magnitude color helper
  const getMagColor = (mag) => {
    const m = parseFloat(mag) || 0;
    if (m >= 6.0) return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    if (m >= 5.0) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Surabaya Live Weather & AQI Banner */}
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
                  {t('weather_feels_like', 'Terasa seperti')}{' '}
                  <strong className="text-zinc-200">
                    {current.feels_like_c !== undefined ? `${current.feels_like_c}°C` : '--'}
                  </strong>
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
                <Thermometer className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">Min / Max</p>
                  <p className="font-medium text-zinc-200">
                    {current.temp_min_c !== undefined ? `${current.temp_min_c}°` : '--'} /{' '}
                    {current.temp_max_c !== undefined ? `${current.temp_max_c}°` : '--'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <CloudRain className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">Peluang Hujan</p>
                  <p className="font-medium text-zinc-200">{current.rain_probability_percent || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AQI Card (1 col) */}
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h4 className="font-semibold text-zinc-100 text-sm">{t('weather_aqi_title', 'Indeks Kualitas Udara (AQI)')}</h4>
            <span className="text-[10px] text-zinc-500 font-mono">US AQI Standard</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline space-x-3">
              <p className="text-4xl font-bold text-zinc-100 font-mono">{aqi.us_aqi || aqi.aqi || '--'}</p>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getAqiBadgeColor(aqi.us_aqi || aqi.aqi)}`}>
                {aqi.category || aqi.status || t('weather_aqi_good', 'Baik / Aman')}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {aqi.health_advice || aqi.advice || 'Kualitas udara aman untuk beraktivitas.'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-400 font-mono flex justify-between">
            <span>PM2.5: {aqi.pm2_5 || aqi.pm25 || '--'} µg/m³</span>
            <span>PM10: {aqi.pm10 || '--'} µg/m³</span>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Forecast Carousel */}
      {forecast.length > 0 && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <h4 className="font-semibold text-zinc-100 text-sm">
                {language === 'en' ? '7-Day Weather Forecast' : 'Prakiraan Cuaca 7 Hari'}
              </h4>
            </div>
            <span className="text-xs font-mono text-zinc-500">Open-Meteo API</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {forecast.map((f, idx) => (
              <div
                key={f.date || idx}
                className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col items-center text-center space-y-1.5"
              >
                <p className="text-xs font-semibold text-zinc-300">{f.day_name}</p>
                <p className="text-[10px] text-zinc-500 font-mono">{f.date ? f.date.slice(5) : ''}</p>
                <span className="text-2xl my-1">{f.icon || '☀️'}</span>
                <p className="text-[11px] text-zinc-300 font-medium truncate max-w-[90px]">{f.condition}</p>
                <p className="text-xs font-mono text-zinc-200 mt-1">
                  <span className="text-zinc-100 font-bold">{f.temp_max_c}°</span>{' '}
                  <span className="text-zinc-500">{f.temp_min_c}°</span>
                </p>
                {f.rain_probability_percent > 0 && (
                  <p className="text-[10px] text-sky-400 font-mono">🌧️ {f.rain_probability_percent}%</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BMKG Real-time Earthquake Alert */}
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
              <p className="text-2xl font-bold text-zinc-100 font-mono">{latestQuake.kedalaman || latestQuake.depth || '--'}</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-500">{t('weather_quake_potential', 'Potensi Tsunami')}</p>
              <p className={`text-xs font-semibold mt-2 ${latestQuake.is_tsunami_danger ? 'text-rose-400' : 'text-emerald-400'}`}>
                {latestQuake.tsunami_status || latestQuake.tsunami_potential || 'Tidak Berpotensi'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1">
              <p className="text-xs text-zinc-500">{t('weather_quake_distance', 'Jarak ke Surabaya')}</p>
              <p className="text-2xl font-bold text-zinc-300 font-mono">
                {latestQuake.distance_to_surabaya_km || latestQuake.distance_surabaya_km || '--'} km
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <p>
                <strong className="text-zinc-200">{t('weather_quake_epicenter', 'Pusat Gempa')}:</strong>{' '}
                {latestQuake.wilayah || latestQuake.epicenter || '--'}
              </p>
              <p className="text-zinc-400 font-mono text-[11px]">
                <Clock className="w-3 h-3 inline mr-1 text-zinc-500" />
                {latestQuake.tanggal || ''} {latestQuake.jam || ''} ({latestQuake.datetime || '--'})
              </p>
              {latestQuake.raw_potensi && latestQuake.raw_potensi !== 'Tidak berpotensi TSUNAMI' && (
                <p className="text-zinc-400 text-[11px]">
                  <strong className="text-zinc-300">Catatan Diseminasi BMKG:</strong> {latestQuake.raw_potensi}
                </p>
              )}
              {latestQuake.dirasakan && (
                <p className="text-amber-400/90 text-[11px]">
                  <strong>Skala Dirasakan:</strong> {latestQuake.dirasakan}
                </p>
              )}
            </div>

            {/* Shakemap Preview Button / Image */}
            {latestQuake.shakemap_url && (
              <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-200">BMKG Shakemap</p>
                  <p className="text-[10px] text-zinc-500">Peta visual guncangan gempa</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedShakemap(latestQuake.shakemap_url)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center space-x-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Peta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Recent Earthquakes List */}
      {recentQuakes.length > 0 && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-zinc-400" />
              <h4 className="font-semibold text-zinc-100 text-sm">
                {t('weather_quake_recent', 'Gempa Terkini di Indonesia')}
              </h4>
            </div>
            <span className="text-xs font-mono text-zinc-500">BMKG Auto-feed</span>
          </div>

          <div className="divide-y divide-zinc-800/60 border border-zinc-800 rounded-lg overflow-hidden">
            {recentQuakes.map((q, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-zinc-950/60 hover:bg-zinc-900/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${getMagColor(q.magnitude)}`}>
                    {q.magnitude} M
                  </span>
                  <div>
                    <p className="font-medium text-zinc-200">{q.wilayah || q.epicenter}</p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {q.tanggal} {q.jam} • Kedalaman: {q.kedalaman || q.depth}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  {q.distance_to_surabaya_km && (
                    <span className="text-xs text-zinc-400 font-mono">
                      {q.distance_to_surabaya_km} km ke SBY
                    </span>
                  )}
                  {q.dirasakan && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                      {q.dirasakan.slice(0, 20)}...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shakemap Modal Lightbox */}
      {selectedShakemap && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedShakemap(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-100">BMKG Shakemap - Peta Guncangan Gempa</h3>
              <button
                type="button"
                onClick={() => setSelectedShakemap(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-zinc-950">
              <img
                src={selectedShakemap}
                alt="BMKG Shakemap"
                className="max-h-[70vh] rounded-lg object-contain border border-zinc-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

