import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Plus,
  Trash2,
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Send,
  Zap,
  BookmarkPlus,
  Compass,
  ArrowRight,
  Filter,
  Kanban,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/soundEffects';

export function JobsView({ isDark = true, onNavigate }) {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('curated'); // 'curated', 'kanban', 'live_search'
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Curated Jobs State
  const [curatedJobs, setCuratedJobs] = useState([]);
  const [curatedStats, setCuratedStats] = useState({ total: 0, new: 0, saved: 0 });
  const [curatedFilter, setCuratedFilter] = useState('all'); // 'all', 'NEW', 'SAVED'
  const [curatedSearch, setCuratedSearch] = useState('');

  // Kanban Jobs State
  const [kanbanData, setKanbanData] = useState({ columns: {}, stats: {} });

  // Live Search State
  const [searchQuery, setSearchQuery] = useState('backend');
  const [searchType, setSearchType] = useState('remote');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cover Letter Modal State
  const [selectedJobForLetter, setSelectedJobForLetter] = useState(null);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Fetch Curated Jobs
  const fetchCuratedJobs = useCallback(async () => {
    try {
      const res = await api.getCuratedJobs(curatedFilter, curatedSearch);
      if (res && res.status === 'success') {
        setCuratedJobs(res.jobs || []);
        setCuratedStats(res.stats || { total: 0, new: 0, saved: 0 });
      }
    } catch (err) {
      console.error('Error fetching curated jobs:', err);
    }
  }, [curatedFilter, curatedSearch]);

  // Fetch Kanban Data
  const fetchKanbanData = useCallback(async () => {
    try {
      const res = await api.getJobs();
      if (res) {
        setKanbanData(res);
      }
    } catch (err) {
      console.error('Error fetching kanban jobs:', err);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCuratedJobs(), fetchKanbanData()]);
    setLoading(false);
  }, [fetchCuratedJobs, fetchKanbanData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Manual Scan Trigger
  const handleTriggerScan = async () => {
    playClickSound();
    setIsScanning(true);
    try {
      const res = await api.scanCuratedJobs();
      playSuccessSound();
      showToast(res.message || 'Pemindaian selesai.', 'success');
      fetchCuratedJobs();
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal memindai lowongan.', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Save Curated Job to Kanban
  const handleSaveCurated = async (job) => {
    playClickSound();
    try {
      const res = await api.saveCuratedJob(job.id);
      playSuccessSound();
      showToast(res.message || 'Lowongan disimpan ke Wishlist Kanban.', 'success');
      fetchCuratedJobs();
      fetchKanbanData();
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal menyimpan lowongan.', 'error');
    }
  };

  // Dismiss Curated Job
  const handleDismissCurated = async (jobId) => {
    playClickSound();
    try {
      await api.dismissCuratedJob(jobId);
      showToast(language === 'id' ? 'Rekomendasi dilewati.' : 'Job recommendation dismissed.', 'info');
      fetchCuratedJobs();
    } catch (err) {
      showToast(err.message || 'Gagal melewati lowongan.', 'error');
    }
  };

  // Generate Cover Letter
  const handleOpenCoverLetter = async (job) => {
    playClickSound();
    setSelectedJobForLetter(job);
    setCoverLetterText('');
    setIsGeneratingLetter(true);
    setCopiedLetter(false);

    try {
      const res = await api.generateCoverLetter({
        company: job.company,
        role: job.title || job.role,
        job_description: job.highlights || job.description || '',
        language: 'id'
      });
      if (res && res.cover_letter) {
        setCoverLetterText(res.cover_letter);
        playSuccessSound();
      }
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal membuat cover letter.', 'error');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleCopyLetter = () => {
    if (!coverLetterText) return;
    navigator.clipboard.writeText(coverLetterText);
    setCopiedLetter(true);
    playSuccessSound();
    showToast(language === 'id' ? 'Cover letter berhasil disalin!' : 'Cover letter copied to clipboard!', 'success');
    setTimeout(() => setCopiedLetter(false), 2500);
  };

  // Live Search Handler
  const handleLiveSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    playClickSound();
    setIsSearching(true);
    try {
      const res = await api.searchLiveJobs(searchQuery, searchType);
      if (res && res.jobs) {
        setSearchResults(res.jobs);
        playSuccessSound();
      }
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Pencarian gagal.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const kanbanColumns = [
    { id: 'wishlist', label: 'Wishlist', badge: 'bg-slate-500/20 text-slate-300' },
    { id: 'applied', label: 'Applied', badge: 'bg-indigo-500/20 text-indigo-300' },
    { id: 'screening', label: 'Screening HR', badge: 'bg-cyan-500/20 text-cyan-300' },
    { id: 'tech_test', label: 'Tech Test', badge: 'bg-amber-500/20 text-amber-300' },
    { id: 'interview', label: 'Interview', badge: 'bg-purple-500/20 text-purple-300' },
    { id: 'offering', label: 'Offering 🎉', badge: 'bg-emerald-500/20 text-emerald-300' },
    { id: 'rejected', label: 'Rejected', badge: 'bg-rose-500/20 text-rose-300' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* 1. HERO BANNER: CAREER & JOB RADAR                        */}
      {/* ========================================================= */}
      <section
        className={`p-6 sm:p-7 rounded-2xl border relative overflow-hidden backdrop-blur-xl transition-all duration-300 ${
          isDark
            ? 'bg-[#0b0f19] border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center space-x-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-500 via-cyan-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_24px_rgba(99,102,241,0.45)] ring-2 ring-indigo-400/20 shrink-0">
              <Briefcase className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CAREER & JOB RADAR
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  AI AUTO-SCOUT ACTIVE
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                  CV MATCH ENGINE
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl font-normal ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {language === 'id'
                  ? 'Pusat kurasi karir otonom Sentinel: Memindai loker remote global & lokal di background, evaluasi kecocokan tech stack, dan pelacakan pipeline lamaran.'
                  : 'Sentinel autonomous career radar: Background remote & local job discovery, CV tech stack match evaluation, and application pipeline tracking.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {onNavigate && (
              <button
                onClick={() => {
                  playClickSound();
                  onNavigate('kanban');
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-emerald-600/90 hover:bg-emerald-600 border-emerald-500 text-white shadow-[0_0_16px_rgba(16,185,129,0.35)]'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Buka Board Kanban Lamaran</span>
              </button>
            )}

            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                isDark
                  ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-[0_0_16px_rgba(99,102,241,0.35)]'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? (language === 'id' ? 'Memindai Loker...' : 'Scouting...') : (language === 'id' ? 'Pindai Loker Baru' : 'Scan New Jobs')}</span>
            </button>
          </div>
        </div>

        {/* 3 Overview Mini-Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-inherit">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-mono text-indigo-400">
                {curatedStats.total || 0}
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'id' ? 'Lowongan Terkurasi' : 'Curated Jobs'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                {curatedStats.new || 0}
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'id' ? 'Rekomendasi Baru' : 'New Recommendations'}
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate && onNavigate('kanban')}
            className="flex items-center space-x-3 cursor-pointer group p-1 -m-1 rounded-xl transition-colors hover:bg-slate-800/30"
            title="Klik untuk membuka Kanban Tracker"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold font-mono text-cyan-400 flex items-center gap-1.5">
                <span>{kanbanData.total_count || 0}</span>
                <span className="text-[10px] text-slate-500 font-normal">→ Buka</span>
              </div>
              <p className="text-[11px] text-slate-500 group-hover:text-slate-400">
                {language === 'id' ? 'Pipeline Lamaran Aktif' : 'Active Pipeline'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TAB CONTROLS                                           */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-slate-800 relative">
          {[
            { id: 'curated', label: language === 'id' ? `Saran Sentinel (${curatedStats.total || 0})` : `Sentinel Radar (${curatedStats.total || 0})`, icon: Sparkles },
            { id: 'live_search', label: language === 'id' ? 'Live Scout Search' : 'Live Scout', icon: Search },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  setActiveTab(tab.id);
                }}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer z-10 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeJobTab"
                    className="absolute inset-0 rounded-lg bg-indigo-600 shadow-xs -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'curated' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs">
              {['all', 'NEW', 'SAVED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setCuratedFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    curatedFilter === f
                      ? 'bg-slate-800 text-indigo-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f === 'all' ? (language === 'id' ? 'Semua' : 'All') : f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. TAB CONTENT: CURATED JOBS FEED                         */}
      {/* ========================================================= */}
      {activeTab === 'curated' && (
        <section className="space-y-4">
          {curatedJobs.length === 0 ? (
            <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-[#0e121d] border-slate-800/80' : 'bg-white border-slate-200'}`}>
              <Compass className="w-12 h-12 mx-auto text-slate-500 mb-3" />
              <h3 className="text-sm font-bold text-slate-200">
                {language === 'id' ? 'Belum Ada Lowongan Kurasi' : 'No Curated Jobs Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {language === 'id'
                  ? 'Sentinel akan terus scouting di background secara otonom. Anda juga bisa menekan tombol "Pindai Loker Baru" di atas untuk memindai sekarang.'
                  : 'Sentinel continuously scouts live openings in background. You can also click "Scan New Jobs" above.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {curatedJobs.map((job) => (
                <div
                  key={job.id}
                  className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 hover:border-slate-700 ${
                    isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: Score & Badges */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-inherit">
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400">
                          {job.source || 'Scout Sentinel'}
                        </span>
                        <h3 className={`text-base font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{job.company}</span>
                          <span className="text-slate-600">·</span>
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{job.location}</span>
                        </p>
                      </div>

                      {/* Match Score Gauge */}
                      <div className="flex flex-col items-end shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border flex items-center gap-1 shadow-xs ${
                          job.match_score >= 85
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          {job.match_score}% Match
                        </span>
                        {job.status === 'NEW' && (
                          <span className="mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            NEW
                          </span>
                        )}
                        {job.status === 'SAVED' && (
                          <span className="mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            SAVED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Matched Skills */}
                    {job.tech_stack_matched && (
                      <div className="mt-3">
                        <p className="text-[11px] text-slate-500 font-mono">Matched Stack:</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {job.tech_stack_matched.split(',').map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60"
                            >
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {job.job_url && (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <span>Buka Lowongan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => handleOpenCoverLetter(job)}
                        className="px-3 py-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Cover Letter</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {job.status !== 'SAVED' && (
                        <button
                          onClick={() => handleSaveCurated(job)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <BookmarkPlus className="w-3 h-3" />
                          <span>Simpan ke Pipeline</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDismissCurated(job.id)}
                        className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                        title="Lewati lowongan ini"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 4. TAB CONTENT: LIVE SCOUT SEARCH                         */}
      {/* ========================================================= */}
      {activeTab === 'live_search' && (
        <section className="space-y-4">
          <form onSubmit={handleLiveSearch} className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari posisi (contoh: Golang, Laravel, Backend Engineer)..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs font-mono outline-hidden ${
                  isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200'
                }`}
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-mono outline-hidden cursor-pointer ${
                isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="local">Indonesia (Dealls, Kalibrr, JobStreet, Glints)</option>
              <option value="freelance">Freelance & Proyek (Projects.co.id, Fastwork, Upwork, Dealls)</option>
              <option value="remote">Global Remote (USD / Worldwide)</option>
            </select>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Search className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Mencari...' : 'Cari Lowongan'}</span>
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {searchResults.map((job, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-[#0e121d] border-slate-800/90' : 'bg-white border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400">
                        {job.source || job.platform || 'Scout'}
                      </span>
                      {job.salary && (
                        <span className="text-[10px] font-mono text-emerald-400">
                          {job.salary}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{job.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{job.company} · {job.location || 'Remote'}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {job.description_snippet || job.description || job.snippet}
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between">
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>Lihat Lowongan / Proyek</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 6. MODAL: AI COVER LETTER GENERATOR                       */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedJobForLetter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-2xl rounded-2xl border p-6 space-y-4 shadow-2xl relative ${
                isDark ? 'bg-[#0f1422] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Cover Letter Generator</h3>
                    <p className="text-xs text-slate-400">{selectedJobForLetter.title} @ {selectedJobForLetter.company}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJobForLetter(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {isGeneratingLetter ? (
                <div className="py-16 text-center space-y-3">
                  <Sparkles className="w-8 h-8 mx-auto text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">
                    Menyusun cover letter terpersonalisasi berdasarkan profil CV Mas Fahmi...
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={12}
                    value={coverLetterText}
                    onChange={(e) => setCoverLetterText(e.target.value)}
                    className={`w-full p-4 rounded-xl border text-xs font-mono leading-relaxed outline-hidden ${
                      isDark ? 'bg-slate-900/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={handleCopyLetter}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      {copiedLetter ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLetter ? 'Tersalin ke Clipboard!' : 'Salin Cover Letter'}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
