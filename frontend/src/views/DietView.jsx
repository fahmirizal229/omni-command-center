import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Flame,
  Clock,
  Timer,
  PlusCircle,
  TrendingDown,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Scale,
  Apple,
  Trash2,
  Play,
  Square,
  ShieldCheck,
  Droplets,
  HeartPulse,
  Award,
  ChevronRight,
  Info,
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/soundEffects';
import { motion, AnimatePresence } from 'motion/react';

function DietSkeleton({ isDark = true }) {
  const shimmer = isDark ? 'bg-slate-800/60 animate-pulse' : 'bg-slate-200/80 animate-pulse';
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      {/* Banner Skeleton */}
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? 'bg-[#0b0f19] border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-xl ${shimmer}`} />
              <div className="space-y-1.5">
                <div className={`h-6 w-60 rounded-xl ${shimmer}`} />
                <div className={`h-4 w-40 rounded-md ${shimmer}`} />
              </div>
            </div>
          </div>
          <div className={`h-10 w-32 rounded-xl ${shimmer}`} />
        </div>
      </section>

      {/* Hero Timer Box Skeleton */}
      <section className={`p-6 rounded-2xl border ${isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div className="flex items-center space-x-6">
          <div className={`w-28 h-28 rounded-full ${shimmer}`} />
          <div className="space-y-3 flex-1">
            <div className={`h-5 w-36 rounded ${shimmer}`} />
            <div className={`h-8 w-48 rounded ${shimmer}`} />
            <div className={`h-4 w-64 rounded ${shimmer}`} />
          </div>
        </div>
      </section>

      {/* 4 Cards Skeleton */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className={`h-4 w-24 rounded ${shimmer}`} />
            <div className={`h-7 w-20 rounded ${shimmer}`} />
            <div className={`h-2 w-full rounded-full ${shimmer}`} />
          </div>
        ))}
      </section>
    </div>
  );
}

export function DietView({ isDark = true }) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dietData, setDietData] = useState(null);
  const [fastingData, setFastingData] = useState(null);
  const [mealsData, setMealsData] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);

  // Fasting Elapsed Seconds Counter
  const [fastingElapsedSeconds, setFastingElapsedSeconds] = useState(0);

  // Add Meal Modal Form State
  const [showMealModal, setShowMealModal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [mealsFilter, setMealsFilter] = useState('today');

  const fetchDietData = useCallback(async (manual = false, filter = mealsFilter) => {
    if (manual) setIsRefreshing(true);
    try {
      const [dietRes, fastingRes, mealsRes, weightRes] = await Promise.allSettled([
        api.getDietSummary(),
        api.getFastingStatus(),
        api.getMeals(filter === 'all' ? 'all' : undefined),
        api.getWeightHistory(14),
      ]);

      if (dietRes.status === 'fulfilled' && dietRes.value) {
        setDietData(dietRes.value);
      }
      if (fastingRes.status === 'fulfilled' && fastingRes.value) {
        setFastingData(fastingRes.value);
      }
      if (mealsRes.status === 'fulfilled' && mealsRes.value) {
        setMealsData(Array.isArray(mealsRes.value) ? mealsRes.value : mealsRes.value?.meals || []);
      }
      if (weightRes.status === 'fulfilled' && weightRes.value) {
        setWeightHistory(Array.isArray(weightRes.value) ? weightRes.value : weightRes.value?.history || []);
      }

      if (manual) {
        playSuccessSound();
        showToast(language === 'id' ? 'Data nutrisi & puasa OMAD diperbarui.' : 'Nutrition & OMAD telemetry refreshed.', 'success');
      }
    } catch (err) {
      console.error('Error fetching diet data:', err);
      showToast(err.message || (language === 'id' ? 'Gagal memuat data nutrisi.' : 'Failed to load nutrition data.'), 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [language, showToast]);

  useEffect(() => {
    fetchDietData();
    const interval = setInterval(() => fetchDietData(false), 20000);
    return () => clearInterval(interval);
  }, [fetchDietData]);

  // Robust Fasting Start Time Parser
  const parseFastingStartTime = useCallback((data) => {
    if (!data) return null;
    const raw = data.start_time_iso || data.fast_start_time || data.start_time;
    if (!raw) return null;

    // 1. Standard ISO or Timestamp parse
    const standardDate = new Date(raw);
    if (!isNaN(standardDate.getTime())) {
      return standardDate.getTime();
    }

    // 2. Custom Indonesian/English format parse e.g. "17 Sep 01:45 WIB"
    if (typeof raw === 'string') {
      const clean = raw.replace(/\s*WIB/i, '').trim();
      const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, may: 4, jun: 5,
        jul: 6, agu: 7, aug: 7, sep: 8, okt: 9, oct: 9, nov: 10, des: 11, dec: 11
      };
      const parts = clean.split(/\s+/);
      if (parts.length >= 3) {
        const day = parseInt(parts[0], 10);
        const monthStr = parts[1].toLowerCase().slice(0, 3);
        const month = months[monthStr];
        let timePart = parts[2];
        let year = new Date().getFullYear();
        if (parts.length >= 4 && /^\d{4}$/.test(parts[2])) {
          year = parseInt(parts[2], 10);
          timePart = parts[3];
        }
        if (!isNaN(day) && month !== undefined && timePart) {
          const [h, m] = timePart.split(':').map((v) => parseInt(v, 10));
          if (!isNaN(h) && !isNaN(m)) {
            // WIB timezone offset is UTC+7
            const d = new Date(Date.UTC(year, month, day, h - 7, m, 0));
            if (!isNaN(d.getTime())) return d.getTime();
          }
        }
      }
    }

    return null;
  }, []);

  // Fasting live timer ticker (100% NaN-Safe)
  useEffect(() => {
    const isFasting = Boolean(fastingData?.active || fastingData?.is_fasting);
    if (!isFasting) {
      setFastingElapsedSeconds(0);
      return;
    }

    const fallbackSec = Number(fastingData?.elapsed_seconds) ||
      (Number(fastingData?.elapsed_hours) ? Math.round(Number(fastingData.elapsed_hours) * 3600) : 0);
    const startMs = parseFastingStartTime(fastingData);

    if (!startMs) {
      setFastingElapsedSeconds(isNaN(fallbackSec) ? 0 : fallbackSec);
      return;
    }

    const updateTimer = () => {
      const nowMs = Date.now();
      const elapsed = Math.max(0, Math.floor((nowMs - startMs) / 1000));
      setFastingElapsedSeconds(isNaN(elapsed) ? (isNaN(fallbackSec) ? 0 : fallbackSec) : elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [fastingData, parseFastingStartTime]);

  const handleStartFast = async () => {
    try {
      playClickSound();
      await api.startFasting({ target_hours: 23.0, protocol_name: 'OMAD (23:1)' });
      playSuccessSound();
      showToast(language === 'id' ? 'Sesi puasa OMAD (23:1) resmi dimulai! Semangat!' : 'OMAD (23:1) fast started!', 'success');
      fetchDietData(false);
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal memulai puasa', 'error');
    }
  };

  const handleEndFast = async () => {
    try {
      playClickSound();
      await api.endFasting('Sesi makan OMAD');
      playSuccessSound();
      showToast(language === 'id' ? 'Sesi puasa selesai! Selamat menikmati jendela makan sehat.' : 'Fast ended. Enjoy your meal window!', 'success');
      fetchDietData(false);
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal mengakhiri puasa', 'error');
    }
  };

  const handleAddMeal = async (e) => {
    e.preventDefault();
    if (!mealName.trim() || !calories) {
      showToast(language === 'id' ? 'Mohon masukkan nama menu dan estimasi kalori.' : 'Please enter food name and calories.', 'warning');
      return;
    }

    try {
      setIsSubmittingMeal(true);
      await api.addMeal({
        food_name: mealName.trim(),
        calories: parseFloat(calories) || 0,
        protein_g: parseFloat(protein) || 0,
        carbs_g: parseFloat(carbs) || 0,
        fat_g: parseFloat(fat) || 0,
        meal_type: mealType,
        notes: 'Logged via Dashboard',
      });
      playSuccessSound();
      showToast(language === 'id' ? 'Menu makan berhasil dicatat!' : 'Meal logged successfully!', 'success');
      setShowMealModal(false);
      setMealName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      fetchDietData(false);
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal mencatat menu makan', 'error');
    } finally {
      setIsSubmittingMeal(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    try {
      playClickSound();
      await api.deleteMeal(id);
      showToast(language === 'id' ? 'Menu makan dihapus.' : 'Meal removed.', 'info');
      fetchDietData(false);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus menu', 'error');
    }
  };

  if (loading && !dietData && !fastingData) {
    return <DietSkeleton isDark={isDark} />;
  }

  // Real Metrics Extraction (Guaranteed NaN-Free)
  const summary = dietData?.summary || {};
  const targetCalories = Number(summary.target_calories) || 1500;
  const totalCalories = Number(summary.total_calories) || (Array.isArray(mealsData) ? mealsData.reduce((acc, m) => acc + (Number(m.calories) || 0), 0) : 0);
  const caloriePct = targetCalories > 0 ? Math.min(Math.round((totalCalories / targetCalories) * 100), 100) : 0;
  const remainingCalories = Math.max(0, targetCalories - totalCalories);

  const targetProtein = Number(summary.target_protein) || 140;
  const totalProtein = Number(summary.total_protein) || (Array.isArray(mealsData) ? mealsData.reduce((acc, m) => acc + (Number(m.protein_g) || 0), 0) : 0);
  const proteinPct = targetProtein > 0 ? Math.min(Math.round((totalProtein / targetProtein) * 100), 100) : 0;

  const totalCarbs = Number(summary.total_carbs) || (Array.isArray(mealsData) ? mealsData.reduce((acc, m) => acc + (Number(m.carbs_g) || 0), 0) : 0);
  const targetCarbs = 100;
  const carbsPct = targetCarbs > 0 ? Math.min(Math.round((totalCarbs / targetCarbs) * 100), 100) : 0;

  const totalFat = Number(summary.total_fat) || (Array.isArray(mealsData) ? mealsData.reduce((acc, m) => acc + (Number(m.fat_g) || 0), 0) : 0);
  const targetFat = 50;
  const fatPct = targetFat > 0 ? Math.min(Math.round((totalFat / targetFat) * 100), 100) : 0;

  const waterMl = Number(summary.water_ml) || 0;
  const targetWaterMl = Number(summary.target_water_ml) || 2500;
  const waterPct = targetWaterMl > 0 ? Math.min(Math.round((waterMl / targetWaterMl) * 100), 100) : 0;

  // Fasting calculations
  const isFasting = Boolean(fastingData?.active || fastingData?.is_fasting);
  const targetFastingHours = Number(fastingData?.target_hours) || 23.0;
  const targetFastingSeconds = targetFastingHours * 3600;
  const safeElapsedSec = isNaN(fastingElapsedSeconds) || fastingElapsedSeconds < 0 ? 0 : fastingElapsedSeconds;
  
  const fastingProgressPercent = targetFastingSeconds > 0
    ? Math.min(100, Math.max(0, Math.round((safeElapsedSec / targetFastingSeconds) * 100)))
    : 0;

  const formatTimer = (totalSec) => {
    const s = isNaN(totalSec) || totalSec < 0 ? 0 : Math.floor(totalSec);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
  };

  // Determine current Fasting Stage
  const elapsedHours = safeElapsedSec / 3600;
  const remainingHours = Math.max(0, targetFastingHours - elapsedHours);
  let stageTitle = language === 'id' ? 'Fase Anabolik (Pencernaan)' : 'Anabolic Phase (Digestion)';
  let stageDesc = language === 'id' ? 'Penyerapan nutrisi & kestabilan glukosa' : 'Nutrient absorption & insulin peak';
  let stageBadgeColor = 'sky';
  let stageIcon = <Clock className="w-4 h-4 text-sky-400" />;

  if (elapsedHours >= 18) {
    stageTitle = language === 'id' ? 'Autofagi & Regenerasi Sel' : 'Autophagy & Cellular Renewal';
    stageDesc = language === 'id' ? 'Pembersihan sel rusak & peremajaan jaringan' : 'Deep cellular clean-up & longevity';
    stageBadgeColor = 'emerald';
    stageIcon = <Sparkles className="w-4 h-4 text-emerald-400" />;
  } else if (elapsedHours >= 12) {
    stageTitle = language === 'id' ? 'Ketosis & Pembakaran Lemak' : 'Ketosis & Accelerated Fat Burning';
    stageDesc = language === 'id' ? 'Glikogen habis, tubuh membakar lemak aktif' : 'Glycogen depleted, body burns stored fat';
    stageBadgeColor = 'amber';
    stageIcon = <Flame className="w-4 h-4 text-amber-400" />;
  } else if (elapsedHours >= 4) {
    stageTitle = language === 'id' ? 'Stabilisasi Gula Darah' : 'Blood Sugar Stabilization';
    stageDesc = language === 'id' ? 'Insulin menurun, transisi pembakaran energi' : 'Insulin drops, transitioning to fasting';
    stageBadgeColor = 'indigo';
    stageIcon = <Timer className="w-4 h-4 text-indigo-400" />;
  }

  // SVG Gauge calculations
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const safeDashPercent = isNaN(fastingProgressPercent) ? 0 : fastingProgressPercent;
  const strokeDashoffset = circumference - (safeDashPercent / 100) * circumference;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* 1. HERO HEADER BANNER: OMAD PROTOCOL                      */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? 'bg-[#0b0f19] border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/15 via-emerald-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-600 flex items-center justify-center text-white shadow-[0_0_24px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/20 shrink-0">
              <Utensils className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  OMAD & NUTRITION ENGINE
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
                  PROTOKOL 23:1
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  TARGET PROTEIN: 140g
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {language === 'id'
                  ? 'Manajemen puasa OMAD (One Meal A Day), target defisit terukur ~1.500 kcal, dan proteksi massa otot 140g protein.'
                  : 'OMAD fasting protocol, calibrated calorie deficit ~1,500 kcal, and 140g high-protein muscle sparing.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => {
                playClickSound();
                setShowMealModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_16px_rgba(245,158,11,0.35)]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{language === 'id' ? 'Catat Menu Makan' : 'Log New Meal'}</span>
            </button>
            <button
              onClick={() => {
                playClickSound();
                fetchDietData(true);
              }}
              disabled={isRefreshing}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-700/90'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. FASTING HERO RADAR & STAGE BREAKDOWN                   */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Circular Fasting Gauge */}
        <div
          className={`lg:col-span-2 p-6 sm:p-7 rounded-2xl border backdrop-blur-xl relative overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            {/* SVG Ring Gauge */}
            <div className="flex items-center space-x-6">
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-32 h-32 sm:w-36 sm:h-36 transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-slate-800"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    className="stroke-amber-400 transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
                    {fastingProgressPercent}%
                  </span>
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    {language === 'id' ? 'TARGET 23H' : '23H GOAL'}
                  </div>
                </div>
              </div>

              {/* Fasting Telemetry Details */}
              <div className="space-y-2 text-left">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 ${
                      isFasting
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isFasting ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    {isFasting ? (language === 'id' ? 'SEDANG PUASA (FASTING)' : 'FASTING IN PROGRESS') : (language === 'id' ? 'JENDELA MAKAN (FEEDING)' : 'EATING WINDOW')}
                  </span>
                </div>

                <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                  {isFasting ? formatTimer(fastingElapsedSeconds) : '00h 00m 00s'}
                </div>

                <p className="text-xs text-slate-400 max-w-sm">
                  {isFasting
                    ? language === 'id'
                      ? `Sisa waktu puasa: ~${Math.max(0, (23 - elapsedHours)).toFixed(1)} jam menuju target 23 jam.`
                      : `Remaining: ~${Math.max(0, (23 - elapsedHours)).toFixed(1)}h to reach 23h OMAD target.`
                    : language === 'id'
                    ? 'Tekan tombol di samping saat memulai sesi puasa OMAD berikutnya.'
                    : 'Press button below to start your next OMAD fasting session.'}
                </p>
              </div>
            </div>

            {/* Start / End Fast Action Button */}
            <div className="shrink-0 w-full sm:w-auto">
              {isFasting ? (
                <button
                  onClick={handleEndFast}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.35)]"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{language === 'id' ? 'Akhiri Puasa (Buka Puasa)' : 'End Fast (Open Meal)'}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartFast}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{language === 'id' ? 'Mulai Puasa OMAD (23:1)' : 'Start OMAD Fast (23:1)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Fasting Metabolic Stage Info Footer */}
          <div className="mt-6 pt-4 border-t border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              {stageIcon}
              <span className="font-semibold text-slate-200">{stageTitle}</span>
              <span className="text-slate-500">• {stageDesc}</span>
            </div>
            <div className="font-mono text-slate-400 text-[11px]">
              {language === 'id' ? 'Protokol: Puasa 23 Jam / 1 Sesi Makan' : 'Protocol: 23h Fast / 1h Feast'}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Hydration & OMAD Protocol Guidelines */}
        <div
          className={`p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div>
            <div className="flex items-center space-x-3 pb-4 border-b border-inherit">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {language === 'id' ? 'Target Hidrasi Harian' : 'Daily Hydration Target'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'id' ? 'Target: BB × 35 ml' : 'Target: Weight × 35 ml'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-400">
                  {waterMl} <span className="text-sm font-normal text-slate-400">/ {targetWaterMl} ml</span>
                </span>
                <span className="text-xs font-mono font-semibold text-sky-400">
                  {waterPct}%
                </span>
              </div>

              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-sky-400 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(waterPct, 100)}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18 }}
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'id' ? 'Aturan Puasa OMAD Bersih' : 'Clean Fasting Rules'}</span>
                </div>
                <p>
                  {language === 'id'
                    ? 'Hanya konsumsi air putih, kopi hitam polos (tanpa gula/krimer), teh tawar, atau air mineral bergaram untuk menjaga elektrolit.'
                    : 'Zero-calorie intake only during fasting: plain water, black coffee (no sugar/milk), unsweetened tea, or salted water.'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-inherit text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Target kalori harian ~1.500 kcal padat nutrisi</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DAILY MACRONUTRIENT BARS                               */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Kalori Harian' : 'Daily Calories'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {totalCalories}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {targetCalories} kcal</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <motion.div
              className="bg-amber-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(caloriePct, 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-mono">
            {language === 'id' ? `Sisa Kuota: ${remainingCalories} kcal` : `Remaining: ${remainingCalories} kcal`}
          </p>
        </div>

        {/* Protein Card (140g) */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Protein (Muscle Sparing)' : 'Protein Target'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {totalProtein}g
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {targetProtein}g</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <motion.div
              className="bg-emerald-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(proteinPct, 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-mono">
            {language === 'id' ? `Tercapai: ${proteinPct}% dari 140g` : `Achieved: ${proteinPct}% of 140g`}
          </p>
        </div>

        {/* Carbs Card */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Karbohidrat Kompleks' : 'Carbohydrates'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
              <Apple className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-400">
              {totalCarbs}g
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {targetCarbs}g</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <motion.div
              className="bg-sky-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(carbsPct, 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-mono">
            {language === 'id' ? 'Karbo kompleks & serat sayur' : 'Complex carbs & dietary fiber'}
          </p>
        </div>

        {/* Healthy Fat Card */}
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 hover:border-slate-700/80 ${
            isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {language === 'id' ? 'Lemak Sehat' : 'Healthy Fats'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
              {totalFat}g
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {targetFat}g</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <motion.div
              className="bg-rose-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(fatPct, 100)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500 font-mono">
            {language === 'id' ? 'Alpukat, telur & minyak zaitun' : 'Avocado, eggs & olive oil'}
          </p>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. TODAY'S MEAL LOG TIMELINE                              */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-sm sm:text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {mealsFilter === 'today'
                  ? (language === 'id' ? 'Riwayat Menu Makan Hari Ini' : "Today's Meal Timeline")
                  : (language === 'id' ? 'Semua Riwayat Menu Makan' : 'All Meal History')}
              </h3>
              <p className="text-xs text-slate-500">
                {mealsData.length} {language === 'id' ? 'menu tercatat di database' : 'items logged'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Toggle: Hari Ini vs Semua Riwayat */}
            <div className={`p-1 rounded-xl border flex items-center gap-1 text-xs relative ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setMealsFilter('today');
                  fetchDietData(false, 'today');
                }}
                className={`relative px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer z-10 ${
                  mealsFilter === 'today'
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mealsFilter === 'today' && (
                  <motion.div
                    layoutId="activeMealsFilter"
                    className="absolute inset-0 rounded-lg bg-amber-500 shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{language === 'id' ? 'Hari Ini' : 'Today'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setMealsFilter('all');
                  fetchDietData(false, 'all');
                }}
                className={`relative px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer z-10 ${
                  mealsFilter === 'all'
                    ? 'text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mealsFilter === 'all' && (
                  <motion.div
                    layoutId="activeMealsFilter"
                    className="absolute inset-0 rounded-lg bg-amber-500 shadow-xs -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <span>{language === 'id' ? 'Semua Riwayat' : 'All History'}</span>
              </button>
            </div>

            <button
              onClick={() => {
                playClickSound();
                setShowMealModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer w-fit"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{language === 'id' ? 'Tambah Menu' : 'Add Item'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {mealsData.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Utensils className="w-9 h-9 mx-auto text-amber-400/40" />
              <p className="text-xs font-medium text-slate-400">
                {mealsFilter === 'today'
                  ? (language === 'id'
                      ? 'Belum ada menu makan yang dicatat hari ini. Klik "Tambah Menu" untuk mencatat sesi OMAD atau beralih ke "Semua Riwayat" untuk melihat data sebelumnya.'
                      : 'No meals logged yet today. Click "Add Item" or switch to "All History" to view past records.')
                  : (language === 'id'
                      ? 'Belum ada data riwayat menu makan di database.'
                      : 'No meal records found in database.')}
              </p>
            </div>
          ) : (
            mealsData.map((meal) => (
              <div
                key={meal.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isDark
                    ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm text-slate-200">
                        {meal.food_name || meal.name}
                      </h4>
                      {meal.date && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                          {meal.date}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono">
                      <span className="text-amber-400 font-bold">{meal.calories} kcal</span>
                      <span className="text-emerald-400">Protein: {meal.protein_g}g</span>
                      <span className="text-sky-400">Carbs: {meal.carbs_g}g</span>
                      <span className="text-rose-400">Fat: {meal.fat_g}g</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors self-end sm:self-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. ADD MEAL MODAL (CLEAN & ACCESSIBLE)                     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showMealModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowMealModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md p-6 sm:p-7 rounded-2xl border shadow-2xl transition-all ${
                isDark ? 'bg-[#0f1422] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
                <div className="flex items-center space-x-2.5">
                  <Utensils className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold">
                    {language === 'id' ? 'Catat Menu Makan OMAD' : 'Log OMAD Meal'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddMeal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    {language === 'id' ? 'Nama Menu / Makanan' : 'Food Description'}
                  </label>
                  <input
                    type="text"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="Contoh: Dada Ayam 300g + Telur Rebus 3 + Sayur"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-hidden transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    }`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {language === 'id' ? 'Total Kalori (kcal)' : 'Calories (kcal)'}
                    </label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="1200"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {language === 'id' ? 'Protein (g) [Target 140g]' : 'Protein (g)'}
                    </label>
                    <input
                      type="number"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      placeholder="130"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {language === 'id' ? 'Karbohidrat (g)' : 'Carbs (g)'}
                    </label>
                    <input
                      type="number"
                      value={carbs}
                      onChange={(e) => setCarbs(e.target.value)}
                      placeholder="60"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      {language === 'id' ? 'Lemak Sehat (g)' : 'Fat (g)'}
                    </label>
                    <input
                      type="number"
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      placeholder="35"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-white focus:border-amber-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMealModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    {language === 'id' ? 'Batal' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingMeal}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-md"
                  >
                    {isSubmittingMeal ? (language === 'id' ? 'Menyimpan...' : 'Saving...') : (language === 'id' ? 'Simpan Menu' : 'Save Meal')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
