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

export function WeatherView({ weatherData }) {
  if (!weatherData) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500 text-xs">
        Memuat data cuaca Surabaya dan gempa BMKG...
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
                  Terasa seperti <strong className="text-zinc-200">{current.feels_like_c !== undefined ? `${current.feels_like_c}°C` : '--'}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <Wind className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">Kecepatan Angin</p>
                  <p className="font-medium text-zinc-200">{current.wind_speed_kmh || '--'} km/h</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center space-x-2.5">
                <Droplets className="w-4 h-4 text-zinc-400" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono">Kelembaban</p>
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
            <h4 className="font-semibold text-zinc-100 text-sm">Kualitas Udara (AQI)</h4>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
              Surabaya
            </span>
          </div>

          <div className="space-y-2 text-center py-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">{aqi.icon || '🟡'}</span>
              <p className="text-4xl sm:text-5xl font-bold text-zinc-100 font-mono">
                {aqi.us_aqi !== undefined ? aqi.us_aqi : (aqi.aqi || '--')}
              </p>
            </div>
            <p className="text-xs font-semibold text-emerald-400">{aqi.category || 'Sedang (Moderate)'}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">{aqi.health_advice || 'Kualitas udara dapat diterima untuk sebagian besar orang.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono text-center pt-2 border-t border-zinc-900">
            <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span>PM2.5: <strong className="text-zinc-200">{aqi.pm2_5 ?? '--'}</strong> µg/m³</span>
            </div>
            <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
              <span>PM10: <strong className="text-zinc-200">{aqi.pm10 ?? '--'}</strong> µg/m³</span>
            </div>
            {aqi.carbon_monoxide !== undefined && (
              <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span>CO: <strong className="text-zinc-200">{aqi.carbon_monoxide}</strong> µg/m³</span>
              </div>
            )}
            {aqi.nitrogen_dioxide !== undefined && (
              <div className="p-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                <span>NO₂: <strong className="text-zinc-200">{aqi.nitrogen_dioxide}</strong> µg/m³</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Forecast */}
      {forecast.length > 0 && (
        <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h4 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span>Prakiraan Cuaca Surabaya 7 Hari ke Depan</span>
            </h4>
            <span className="text-xs text-zinc-500 font-mono">Open-Meteo API</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {forecast.map((day, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center space-y-1.5 flex flex-col justify-between"
              >
                <p className="text-xs font-medium text-zinc-300 font-mono">{day.day_name || day.date}</p>
                <span className="text-2xl my-1">{day.icon || '🌤️'}</span>
                <p className="text-[11px] text-zinc-400">{day.condition || 'Berawan'}</p>
                <p className="text-xs font-semibold text-zinc-200 font-mono">
                  {day.temp_max_c}° / <span className="text-zinc-500">{day.temp_min_c}°</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BMKG Earthquake Guardian Card */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h4 className="font-semibold text-zinc-100 text-sm sm:text-base">Pemantauan Gempa BMKG Real-Time</h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
              Pusat Data TEWS BMKG
            </span>
          </div>
        </div>

        {/* Latest Major Earthquake Highlight */}
        {latestQuake ? (
          <div className="p-5 rounded-xl bg-zinc-950 border border-amber-500/20 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                Gempa Terbaru Terdeteksi
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {latestQuake.tanggal} • {latestQuake.jam}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-lg bg-[#121215] border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-mono">Magnitudo</p>
                <p className="text-2xl font-bold text-amber-400 mt-0.5 font-mono">M {latestQuake.magnitude || '--'}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#121215] border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-mono">Kedalaman</p>
                <p className="text-lg font-bold text-zinc-200 mt-0.5">{latestQuake.kedalaman || latestQuake.depth || '--'}</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#121215] border border-zinc-800 sm:col-span-2">
                <p className="text-[10px] text-zinc-500 font-mono">Pusat Gempa / Lokasi</p>
                <p className="text-xs font-medium text-zinc-200 mt-0.5 leading-snug">{latestQuake.wilayah || latestQuake.location || '--'}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-zinc-400 font-mono mt-1">
                  <span>{latestQuake.potensi || 'Tidak Berpotensi Tsunami'}</span>
                  {latestQuake.distance_to_surabaya_km && (
                    <span className="text-amber-400">
                      • Jarak: ~{latestQuake.distance_to_surabaya_km} km dari Surabaya
                    </span>
                  )}
                </div>
              </div>
            </div>

            {(latestQuake.shakemap_url || latestQuake.shakemap) && (
              <div className="pt-1 flex items-center justify-between text-xs">
                <a
                  href={latestQuake.shakemap_url || latestQuake.shakemap}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-200 hover:underline inline-flex items-center gap-1.5 font-mono"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat Foto Shakemap Resmi BMKG</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-zinc-400 py-2">Tidak ada data gempa terbaru.</div>
        )}

        {/* 5 Recent Earthquakes List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-semibold text-zinc-300 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span>5 Data Gempa Terakhir BMKG (Dirasakan & Terkini)</span>
            </h5>
            <span className="text-[10px] text-zinc-500 font-mono">Real-Time Data</span>
          </div>

          {recentQuakes && recentQuakes.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5">
              {recentQuakes.slice(0, 5).map((q, idx) => {
                const mag = parseFloat(q.magnitude) || 0;
                const magColor = mag >= 5.0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : mag >= 4.0
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700';

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <div className={`px-2.5 py-1 rounded-md border font-mono font-bold text-xs text-center shrink-0 ${magColor}`}>
                        M {q.magnitude}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-medium text-zinc-200 truncate leading-snug">
                          {q.wilayah}
                        </p>
                        <p className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono">
                          <span>{q.tanggal}</span>
                          <span>•</span>
                          <span>{q.jam}</span>
                          <span>•</span>
                          <span>Kedalaman {q.kedalaman}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                      {q.distance_to_surabaya_km !== null && q.distance_to_surabaya_km !== undefined ? (
                        <span className="text-[11px] font-mono font-medium text-zinc-300">
                          ~{q.distance_to_surabaya_km} km <span className="text-zinc-500 text-[10px]">dari SBY</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-zinc-500">{q.coordinates || '--'}</span>
                      )}
                      <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]" title={q.dirasakan || q.potensi || ''}>
                        {q.dirasakan ? `Skala: ${q.dirasakan}` : (q.potensi || 'Tidak berpotensi tsunami')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-500 text-center">
              Tidak ada data riwayat gempa yang tersedia saat ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
