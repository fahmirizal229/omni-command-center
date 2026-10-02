import React, { useState, useEffect, useCallback } from "react";
import {
  HeartPulse,
  Flame,
  Footprints,
  Moon,
  Timer,
  Utensils,
  TrendingUp,
  Droplets,
  Scale,
  RefreshCw,
  ShieldCheck,
  BedDouble,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

function FitnessSkeleton({ isDark = true }) {
  const shimmer = isDark ? "bg-slate-800/60 animate-pulse" : "bg-slate-200/80 animate-pulse";
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      {/* Banner Skeleton */}
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? "bg-[#0b0f19] border-slate-800/80" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
              <div className={`h-7 w-56 rounded-xl ${shimmer}`} />
              <div className={`h-5 w-36 rounded-md ${shimmer}`} />
            </div>
            <div className={`h-4 w-96 max-w-full rounded-lg ${shimmer}`} />
          </div>
          <div className={`h-9 w-28 rounded-xl ${shimmer}`} />
        </div>
      </section>

      {/* 4 Cards Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border space-y-4 ${
              isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
                <div className="space-y-1.5">
                  <div className={`h-3.5 w-20 rounded ${shimmer}`} />
                  <div className={`h-2.5 w-16 rounded ${shimmer}`} />
                </div>
              </div>
              <div className={`h-4 w-8 rounded ${shimmer}`} />
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <div className={`h-6 w-24 rounded ${shimmer}`} />
                <div className={`h-4 w-12 rounded ${shimmer}`} />
              </div>
              <div className={`h-2 w-full rounded-full ${shimmer}`} />
            </div>
          </div>
        ))}
      </section>

      {/* 2 Deep Architecture Cards Skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={`p-6 rounded-2xl border space-y-5 ${
              isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-xl ${shimmer}`} />
                <div className="space-y-1.5">
                  <div className={`h-4 w-36 rounded ${shimmer}`} />
                  <div className={`h-3 w-48 rounded ${shimmer}`} />
                </div>
              </div>
              <div className={`h-5 w-24 rounded-md ${shimmer}`} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className={`p-3 rounded-xl border space-y-2 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`h-2.5 w-14 rounded ${shimmer}`} />
                  <div className={`h-5 w-16 rounded ${shimmer}`} />
                  <div className={`h-2 w-12 rounded ${shimmer}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* 7-Day Table Skeleton */}
      <section className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"}`}>
        <div className="p-4 sm:p-5 border-b border-inherit flex items-center justify-between">
          <div className={`h-4 w-44 rounded ${shimmer}`} />
          <div className={`h-3 w-28 rounded ${shimmer}`} />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-inherit last:border-0">
              <div className={`h-3.5 w-20 rounded ${shimmer}`} />
              <div className={`h-3.5 w-24 rounded ${shimmer}`} />
              <div className={`h-2 w-28 rounded-full ${shimmer}`} />
              <div className={`h-3.5 w-16 rounded ${shimmer}`} />
              <div className={`h-3.5 w-16 rounded ${shimmer}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function FitnessView({ isDark = true }) {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zeppData, setZeppData] = useState(null);
  const [dietData, setDietData] = useState(null);

  const fetchFitnessData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const [zeppRes, dietRes] = await Promise.allSettled([
        api.getZeppFitness(),
        api.getDietSummary(),
      ]);

      if (zeppRes.status === "fulfilled" && zeppRes.value) {
        setZeppData(zeppRes.value);
      }
      if (dietRes.status === "fulfilled" && dietRes.value) {
        setDietData(dietRes.value);
      }

      if (isManual) {
        showToast(language === "id" ? "Data kebugaran berhasil diperbarui." : "Biometrics & fitness telemetry updated.", "success");
      }
    } catch (err) {
      showToast(err.message || (language === "id" ? "Gagal memuat data kebugaran." : "Failed to load biometrics data."), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, language]);

  useEffect(() => {
    fetchFitnessData();
    const interval = setInterval(() => fetchFitnessData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchFitnessData]);

  if (loading && !zeppData && !dietData) {
    return <FitnessSkeleton isDark={isDark} />;
  }

  // Real Zepp metrics mapping with graceful defaults
  const todayZepp = zeppData?.today || {
    steps: 6420,
    goal: 8000,
    distance_km: 4.62,
    calories_kcal: 342,
    active_mins: 48,
    sleep_hours: "7h 15m",
    deep_sleep_mins: 105,
    light_sleep_mins: 260,
    rem_mins: 70,
    awake_mins: 15,
    sleep_mins: 435,
  };

  const lastSleep = zeppData?.last_sleep || todayZepp;
  const history = zeppData?.history_7days || zeppData?.history || [
    { date: "2026-09-17", steps: 6420, goal: 8000, calories: 342, sleep_hours: "7h 15m" },
    { date: "2026-09-16", steps: 8350, goal: 8000, calories: 410, sleep_hours: "6h 50m" },
    { date: "2026-09-15", steps: 9120, goal: 8000, calories: 460, sleep_hours: "7h 40m" },
    { date: "2026-09-14", steps: 7800, goal: 8000, calories: 380, sleep_hours: "8h 10m" },
    { date: "2026-09-13", steps: 8900, goal: 8000, calories: 430, sleep_hours: "7h 05m" },
    { date: "2026-09-12", steps: 10240, goal: 8000, calories: 510, sleep_hours: "6h 30m" },
    { date: "2026-09-11", steps: 7600, goal: 8000, calories: 365, sleep_hours: "7h 25m" },
  ];

  // Real User Profile & SQLite Metrics Mapping
  const userProfile = dietData?.profile || {};
  const weightKg = Number(userProfile.weight_kg || 84.5);
  const targetWeightKg = Number(userProfile.target_weight_kg || 79.0);

  const rawSummary = dietData?.summary || {};
  const dietSummary = {
    total_calories: Number(rawSummary.total_calories ?? 0),
    target_calories: Number(rawSummary.target_calories ?? 1500),
    total_protein: Number(rawSummary.total_protein ?? 0),
    target_protein: Number(rawSummary.target_protein ?? 140),
    total_carbs: Number(rawSummary.total_carbs ?? 0),
    total_fat: Number(rawSummary.total_fat ?? 0),
    water_ml: Number(rawSummary.water_ml ?? 0),
    target_water_ml: Number(rawSummary.target_water_ml ?? Math.round(weightKg * 35)),
    zepp_active_calories: todayZepp.calories_kcal || 342,
  };

  const fastingRaw = dietData?.fasting || {};
  const fastingState = {
    is_fasting: Boolean(fastingRaw.active || fastingRaw.is_fasting),
    protocol: fastingRaw.protocol || fastingRaw.protocol_name || "OMAD (23:1)",
    elapsed_hours: Number(fastingRaw.elapsed_hours ?? 0),
    target_hours: Number(fastingRaw.target_hours ?? 23.0),
    progress_percent: Number(fastingRaw.progress_percent ?? (fastingRaw.elapsed_hours ? Math.min(100, Math.round((fastingRaw.elapsed_hours / (fastingRaw.target_hours || 23.0)) * 100)) : 0)),
    current_stage: fastingRaw.current_stage || "Fasting in Progress",
    status: fastingRaw.status || (fastingRaw.active ? "active" : "idle"),
  };

  // Calculation Ring Percentages
  const stepGoal = todayZepp.goal || 8000;
  const stepPct = Math.min(Math.round(((todayZepp.steps || 0) / stepGoal) * 100), 100);
  
  const activeCalories = Number(todayZepp.calories_kcal ?? todayZepp.calorie ?? todayZepp.calories ?? 342);
  const calPct = Math.min(Math.round((activeCalories / 500) * 100), 100);

  const deepSleepMins = lastSleep.deep_sleep_mins || 105;
  const lightSleepMins = lastSleep.light_sleep_mins || 260;
  const awakeMins = lastSleep.awake_mins || 15;
  const totalSleepMins = lastSleep.sleep_mins || (deepSleepMins + lightSleepMins);
  const sleepDisplayHours = lastSleep.sleep_hours || `${Math.floor(totalSleepMins / 60)}h ${totalSleepMins % 60}m`;
  const sleepPct = Math.min(Math.round((deepSleepMins / 120) * 100), 100);

  const totalProtein = Number(dietSummary.total_protein);
  const targetProtein = Number(dietSummary.target_protein);
  const proteinPct = targetProtein > 0 ? Math.min(Math.round((totalProtein / targetProtein) * 100), 100) : 0;

  const fastingHours = Number(fastingState.elapsed_hours).toFixed(1);
  const targetFastingHours = Number(fastingState.target_hours).toFixed(0);
  const fastingPct = Math.min(Math.round(fastingState.progress_percent), 100);

  const totalCalories = Number(dietSummary.total_calories);
  const targetCalories = Number(dietSummary.target_calories);
  const caloriePct = targetCalories > 0 ? Math.min(Math.round((totalCalories / targetCalories) * 100), 100) : 0;

  const waterMl = Number(dietSummary.water_ml);
  const targetWaterMl = Number(dietSummary.target_water_ml);
  const waterPct = targetWaterMl > 0 ? Math.min(Math.round((waterMl / targetWaterMl) * 100), 100) : 0;

  // Determine current Fasting Stage
  const elapsed = Number(fastingState.elapsed_hours);
  let fastingStageTitle = t("fitness_fasting_stage_1", "Anabolic Phase (Digestion)");
  let fastingStageDesc = t("fitness_fasting_desc_1", "Nutrient absorption & insulin peak");
  let fastingStageColor = "sky";
  if (elapsed >= 18) {
    fastingStageTitle = t("fitness_fasting_stage_4", "Autophagy & Cellular Renewal");
    fastingStageDesc = t("fitness_fasting_desc_4", "Deep cellular clean-up & longevity");
    fastingStageColor = "emerald";
  } else if (elapsed >= 12) {
    fastingStageTitle = t("fitness_fasting_stage_3", "Ketosis & Fat Burning");
    fastingStageDesc = t("fitness_fasting_desc_3", "Glycogen depleted, body burns stored fat");
    fastingStageColor = "amber";
  } else if (elapsed >= 4) {
    fastingStageTitle = t("fitness_fasting_stage_2", "Blood Sugar Stabilization");
    fastingStageDesc = t("fitness_fasting_desc_2", "Insulin drops, transitioning to fasting");
    fastingStageColor = "indigo";
  }

  const isZeppSynced = zeppData?.status === "synced";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* 1. HERO HEADER BANNER: BIOMETRICS & FITNESS OVERVIEW       */}
      {/* ========================================================= */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all animate-stagger-1 ${
          isDark
            ? "bg-[#0b0f19] border-slate-800/80 shadow-xl text-slate-100"
            : "bg-white border-slate-200/90 shadow-sm text-slate-900"
        }`}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isDark ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-emerald-50 border-emerald-300 text-emerald-700"
              }`}>
                <HeartPulse className="w-5 h-5" />
              </div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                {t("fitness_banner_title", "Biometrics & Diet Protocol")}
              </h1>
              <span
                className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                  isZeppSynced
                    ? isDark
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : isDark
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isZeppSynced ? t("fitness_badge_zepp", "Amazfit / Zepp Active") : t("fitness_badge_omad", "OMAD Protocol Active")}</span>
              </span>
            </div>

            <p className={`text-xs sm:text-sm max-w-2xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>
              {t("fitness_banner_sub", "Real-time smartwatch telemetry, OMAD (23:1) fasting tracker, sleep stages, and high-protein nutrition budget.")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => fetchFitnessData(true)}
              disabled={refreshing}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl border transition-all cursor-pointer active:scale-95 text-xs font-mono font-bold shadow-xs ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-emerald-500" : isDark ? "text-slate-400" : "text-slate-600"}`} />
              <span>{refreshing ? t("loading", "Syncing...") : (language === "id" ? "Sinkron Data" : "Sync Telemetry")}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. FOUR CORE ACTIVITY & METRIC SCORE CARDS                */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger-2">
        {/* Step Telemetry */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-105 ${
                isDark ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400" : "bg-emerald-50 border-emerald-300 text-emerald-700"
              }`}>
                <Footprints className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  {t("fitness_card_steps", "Daily Steps")}
                </span>
                <span className={`text-[11px] font-mono ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>
                  {t("fitness_target_label", "Goal")}: {stepGoal.toLocaleString()}
                </span>
              </div>
            </div>
            <span className={`text-xs font-mono font-extrabold tabular-nums ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
              {stepPct}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5 font-mono">
              <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>
                {(todayZepp.steps || 0).toLocaleString()}
              </span>
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {todayZepp.distance_km || 0} km
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200/90"}`}>
              <div
                className="h-full rounded-full bg-emerald-500 transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${stepPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Calories */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-105 ${
                isDark ? "bg-indigo-500/15 border-indigo-500/25 text-indigo-400" : "bg-indigo-50 border-indigo-300 text-indigo-700"
              }`}>
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  {t("fitness_card_calories", "Active Burn")}
                </span>
                <span className={`text-[11px] font-mono ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>
                  {t("fitness_card_calories_sub", "Active")}: {todayZepp.active_mins || 0} m
                </span>
              </div>
            </div>
            <span className={`text-xs font-mono font-extrabold tabular-nums ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>
              {calPct}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5 font-mono">
              <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>
                {activeCalories} <span className="text-xs font-normal">kcal</span>
              </span>
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {t("fitness_target_label", "Target")} 500
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200/90"}`}>
              <div
                className="h-full rounded-full bg-indigo-500 transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${calPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sleep Recovery */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-105 ${
                isDark ? "bg-purple-500/15 border-purple-500/25 text-purple-400" : "bg-purple-50 border-purple-300 text-purple-700"
              }`}>
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  {t("fitness_card_sleep", "Sleep Time")}
                </span>
                <span className={`text-[11px] font-mono ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>
                  {t("fitness_sleep_deep", "Deep")}: {deepSleepMins} m
                </span>
              </div>
            </div>
            <span className={`text-xs font-mono font-extrabold tabular-nums ${isDark ? "text-purple-400" : "text-purple-700"}`}>
              {sleepPct}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5 font-mono">
              <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>
                {sleepDisplayHours}
              </span>
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Score {Math.min(95, 75 + Math.round(deepSleepMins / 5))}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200/90"}`}>
              <div
                className="h-full rounded-full bg-purple-500 transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${sleepPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Protein Intake (OMAD) */}
        <div
          className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group ${
            isDark
              ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700"
              : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-105 ${
                isDark ? "bg-amber-500/15 border-amber-500/25 text-amber-400" : "bg-amber-50 border-amber-300 text-amber-800"
              }`}>
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block ${isDark ? "text-slate-200" : "text-slate-900"}`}>
                  {t("fitness_card_protein", "Protein Intake")}
                </span>
                <span className={`text-[11px] font-mono ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>
                  {t("fitness_target_label", "Target")}: {targetProtein}g
                </span>
              </div>
            </div>
            <span className={`text-xs font-mono font-extrabold tabular-nums ${isDark ? "text-amber-400" : "text-amber-800"}`}>
              {proteinPct}%
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1.5 font-mono">
              <span className={`text-2xl font-extrabold tracking-tight tabular-nums ${isDark ? "text-white" : "text-slate-900"}`}>
                {totalProtein} <span className="text-xs font-normal">grams</span>
              </span>
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {proteinPct >= 100 ? (language === "id" ? "Target Tercapai" : "Goal Met") : `${Math.max(0, targetProtein - totalProtein)}g ${language === "id" ? "tersisa" : "left"}`}
              </span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200/90"}`}>
              <div
                className="h-full rounded-full bg-amber-500 transition-[width] duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${proteinPct}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. DETAILED SPLIT: SLEEP ARCHITECTURE & OMAD FASTING      */}
      {/* ========================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-stagger-3">
        {/* Sleep Quality Architecture */}
        <div
          className={`p-6 rounded-2xl border space-y-5 transition-all ${
            isDark ? "bg-[#0e121d] border-slate-800/90 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between border-b pb-4 border-inherit">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isDark ? "bg-purple-500/15 border-purple-500/25 text-purple-400" : "bg-purple-50 border-purple-300 text-purple-700"
              }`}>
                <BedDouble className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("fitness_sleep_title", "Sleep Stages")}</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                  {language === "id" ? "Rincian waktu tidur nyenyak, ringan, dan terjaga" : "Deep, light, and awake sleep breakdown"}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                isDark ? "bg-purple-500/10 text-purple-400 border-purple-500/20" : "bg-purple-50 text-purple-800 border-purple-300"
              }`}
            >
              {language === "id" ? "Istirahat Malam" : "Night Rest"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              <span className={`text-[11px] font-bold block ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t("fitness_sleep_deep", "Deep Sleep")}</span>
              <p className={`text-lg font-black mt-1 ${isDark ? "text-purple-400" : "text-purple-700"}`}>{deepSleepMins} m</p>
              <span className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-600"}`}>{language === "id" ? "Pemulihan fisik" : "Physical rest"}</span>
            </div>
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              <span className={`text-[11px] font-bold block ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t("fitness_sleep_light", "Light Sleep")}</span>
              <p className={`text-lg font-black mt-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>{lightSleepMins} m</p>
              <span className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-600"}`}>{language === "id" ? "Pemulihan pikiran" : "Mental recovery"}</span>
            </div>
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              <span className={`text-[11px] font-bold block ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t("fitness_sleep_awake", "Awake Time")}</span>
              <p className={`text-lg font-black mt-1 ${isDark ? "text-slate-300" : "text-slate-800"}`}>{awakeMins} m</p>
              <span className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-600"}`}>{language === "id" ? "Waktu bangun" : "Interruptions"}</span>
            </div>
          </div>
        </div>

        {/* OMAD Fasting Protocol & Stage Visualizer */}
        <div
          className={`p-6 rounded-2xl border space-y-5 transition-all ${
            isDark ? "bg-[#0e121d] border-slate-800/90 text-slate-100" : "bg-white border-slate-200 text-slate-900 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between border-b pb-4 border-inherit">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                isDark ? "bg-amber-500/15 border-amber-500/25 text-amber-400" : "bg-amber-50 border-amber-300 text-amber-800"
              }`}>
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t("fitness_fasting_title", "OMAD Fasting Protocol")}</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                  {t("fitness_fasting_sub", "One Meal A Day (23:1 Target)")}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-300"
              }`}
            >
              {fastingPct >= 100 ? (language === "id" ? "Target Selesai" : "Goal Completed") : (language === "id" ? "Sedang Puasa" : "Fasting in Progress")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-center">
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              <span className={`text-[11px] font-bold block ${isDark ? "text-slate-400" : "text-slate-700"}`}>{language === "id" ? "Jendela Puasa" : "Fasting Window"}</span>
              <p className={`text-base sm:text-lg font-black mt-1 ${isDark ? "text-amber-400" : "text-amber-800"}`}>{fastingHours}h / {targetFastingHours}h</p>
              <span className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-600"}`}>{fastingPct}% {t("fitness_elapsed_label", "Elapsed")}</span>
            </div>
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              <span className={`text-[11px] font-bold block ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t("fitness_diet_title", "Calorie Budget")}</span>
              <p className={`text-base sm:text-lg font-black mt-1 ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>{totalCalories} / {targetCalories}</p>
              <span className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-600"}`}>1.5k {t("fitness_target_label", "Target")}</span>
            </div>
            <div className={`p-3.5 rounded-xl border transition-colors ${
              isDark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              <span className={`text-[11px] font-bold block ${isDark ? "text-slate-400" : "text-slate-700"}`}>{t("fitness_water_title", "Hydration")}</span>
              <p className={`text-base sm:text-lg font-black mt-1 ${isDark ? "text-sky-400" : "text-sky-700"}`}>{waterMl} ml</p>
              <span className={`text-[10px] font-semibold ${isDark ? "text-slate-500" : "text-slate-600"}`}>{t("fitness_target_label", "Target")} {targetWaterMl} ml</span>
            </div>
          </div>

          {/* Current Metabolic Fasting Stage Callout */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
            isDark ? "bg-slate-900/50 border-slate-800/80 text-slate-300" : "bg-indigo-50/60 border-indigo-200/80 text-indigo-950"
          }`}>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ring-4 ${
                fastingStageColor === "emerald"
                  ? "bg-emerald-500 ring-emerald-500/20"
                  : fastingStageColor === "amber"
                  ? "bg-amber-500 ring-amber-500/20"
                  : "bg-indigo-500 ring-indigo-500/20"
              }`} />
              <div>
                <span className="font-bold">{fastingStageTitle}</span>
                <span className={`hidden sm:inline text-[11px] ml-1.5 ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>— {fastingStageDesc}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-[11px] tabular-nums shrink-0">{fastingHours}h mark</span>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SEVEN-DAY BIO-TREND HISTORY TABLE                      */}
      {/* ========================================================= */}
      <section
        className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
          isDark ? "bg-[#0e121d] border-slate-800/90 text-slate-200" : "bg-white border-slate-200 text-slate-800"
        }`}
      >
        <div className={`p-4 sm:p-5 border-b border-inherit flex items-center justify-between ${
          isDark ? "bg-slate-950/40" : "bg-slate-50/70"
        }`}>
          <div className="flex items-center space-x-2.5">
            <TrendingUp className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
            <h3 className={`text-xs sm:text-sm font-bold font-mono tracking-tight uppercase ${
              isDark ? "text-white" : "text-slate-900"
            }`}>
              {t("fitness_history_title", "7-Day Activity & Biometrics History")}
            </h3>
          </div>
          <span className={`text-[11px] font-mono font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {language === "id" ? "Catatan Telemetri Harian" : "Daily Telemetry Log"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b font-bold ${
              isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-100/90 border-slate-200 text-slate-800"
            }`}>
              <tr>
                <th className="py-3 px-4">{language === "id" ? "Tanggal" : "Date"}</th>
                <th className="py-3 px-4">{language === "id" ? "Langkah Kaki" : "Daily Steps"}</th>
                <th className="py-3 px-4">{language === "id" ? "Progres Target" : "Goal Progress"}</th>
                <th className="py-3 px-4">{language === "id" ? "Kalori Terbakar" : "Active Burn"}</th>
                <th className="py-3 px-4">{language === "id" ? "Tidur Semalam" : "Sleep Recovery"}</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-200/80"}`}>
              {history.map((row) => {
                const targetG = row.goal || 8000;
                const pct = Math.min(Math.round(((row.steps || 0) / targetG) * 100), 100);
                const calVal = row.calories_kcal ?? row.calories ?? row.calorie ?? 0;
                const sleepStr = row.sleep_hours || (row.sleep_mins ? `${Math.floor(row.sleep_mins / 60)}h ${row.sleep_mins % 60}m` : "-");
                return (
                  <tr key={row.date} className={`transition-colors ${isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"}`}>
                    <td className={`py-3 px-4 font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>{row.date}</td>
                    <td className={`py-3 px-4 font-extrabold tabular-nums ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                      {(row.steps || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className={`w-20 h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-[10px] font-bold ${isDark ? "text-slate-400" : "text-slate-700"}`}>{pct}%</span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 tabular-nums font-semibold ${isDark ? "text-slate-300" : "text-slate-800"}`}>{calVal} kcal</td>
                    <td className={`py-3 px-4 tabular-nums font-bold ${isDark ? "text-purple-400" : "text-purple-700"}`}>{sleepStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
