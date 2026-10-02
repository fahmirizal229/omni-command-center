import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  Sparkles,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Tag,
  BookOpen,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Code2,
  Cpu,
  Server,
  Cloud
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';

const CATEGORY_COLORS = {
  'Go': {
    badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-500',
    icon: Code2
  },
  'PHP / Laravel': {
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    dot: 'bg-amber-500',
    icon: Server
  },
  'Architecture / Cloud': {
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    dot: 'bg-sky-500',
    icon: Cloud
  },
  'DevOps / Architecture': {
    badge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    dot: 'bg-indigo-500',
    icon: Cpu
  },
  'Node.js': {
    badge: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    dot: 'bg-teal-500',
    icon: Layers
  }
};

export function TechRadarView({ isDark = true }) {
  const { showToast } = useToast ? useToast() : { showToast: () => {} };

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [curatedOnly, setCuratedOnly] = useState(true); // Default to curated/interesting articles!
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchArticles = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await api.getTechRadarArticles({
        category: selectedCategory,
        search: searchQuery,
        curated_only: curatedOnly,
        page,
        limit: 15
      });
      if (res && res.status === 'success') {
        setArticles(res.articles || []);
        setCategories(res.categories || []);
        setTotalCount(res.total || 0);
        setTotalPages(res.total_pages || 1);
        setCurrentPage(res.page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch tech radar articles:', err);
      showToast('Gagal memuat artikel Tech Radar', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, curatedOnly, showToast]);

  useEffect(() => {
    fetchArticles(1);
  }, [fetchArticles]);

  const handleSyncFeeds = async () => {
    playClickSound();
    setIsSyncing(true);
    try {
      const res = await api.syncTechRadarFeed();
      if (res && res.status === 'success') {
        playSuccessSound();
        showToast('Feed Tech Radar berhasil diperbarui!', 'success');
        fetchArticles(1);
      } else {
        showToast(res.message || 'Gagal sinkronisasi feed', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat sinkronisasi feed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleBookmark = async (articleId, e) => {
    e.stopPropagation();
    playClickSound();
    try {
      const res = await api.bookmarkTechRadarArticle(articleId);
      if (res && res.status === 'success') {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? { ...a, is_saved: res.is_saved } : a))
        );
        showToast(res.message, 'success');
      }
    } catch (err) {
      showToast('Gagal mengubah status simpan artikel', 'error');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 animate-fadeIn font-sans">
      {/* Header Banner */}
      <section
        className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border transition-all ${
          isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border-slate-800/80 shadow-xl'
            : 'bg-gradient-to-br from-white via-indigo-50/20 to-slate-50 border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              <Globe className="w-3.5 h-3.5" />
              <span>ENGINEERING RADAR & KNOWLEDGE FEED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Tech Radar & Curated Reads
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Kompilasi artikel teknis, arsitektur distributed cloud, Go, PHP/Laravel, dan praktik terbaik engineering yang dikurasi Arusuka untuk referensi Mas Fahmi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncFeeds}
              disabled={isSyncing}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                isSyncing ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
              } ${
                isDark
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Tarik Feed Baru'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Control Bar: Categories, Search, Curated Switch */}
      <section
        className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between ${
          isDark ? 'bg-slate-900/60 border-slate-800/80 backdrop-blur-md' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => {
              playClickSound();
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? isDark
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs font-semibold'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Semua ({totalCount})
          </button>

          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => {
                playClickSound();
                setSelectedCategory(c.name);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === c.name
                  ? isDark
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs font-semibold'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{c.name}</span>
              <span className="text-[10px] opacity-70 font-mono">({c.count})</span>
            </button>
          ))}
        </div>

        {/* Search & Curated Filter */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playClickSound();
              setCuratedOnly(!curatedOnly);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              curatedOnly
                ? isDark
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold'
                : isDark
                ? 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:text-slate-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Kurasi Menarik</span>
          </button>

          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-slate-800/60 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl border animate-pulse space-y-4 ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="h-4 bg-slate-700/40 rounded w-1/3" />
              <div className="h-6 bg-slate-700/50 rounded w-4/5" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-700/30 rounded w-full" />
                <div className="h-3 bg-slate-700/30 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div
          className={`p-12 text-center rounded-2xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-60" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Tidak ada artikel ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba ganti filter kategori atau matikan filter "Kurasi Menarik" untuk menampilkan semua artikel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((art) => {
            const catCfg = CATEGORY_COLORS[art.category] || {
              badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
              dot: 'bg-slate-500',
              icon: BookOpen
            };
            const CatIcon = catCfg.icon;

            return (
              <div
                key={art.id}
                className={`group flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                  isDark
                    ? 'bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90'
                    : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-indigo-50'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Category badge & Bookmark */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${catCfg.badge}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{art.category}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {art.is_curated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Kurasi</span>
                        </span>
                      )}

                      <button
                        onClick={(e) => handleToggleBookmark(art.id, e)}
                        title={art.is_saved ? 'Tersimpan di Vault' : 'Simpan ke Vault'}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          art.is_saved
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {art.is_saved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group-hover:text-indigo-400 transition-colors"
                  >
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {art.title}
                    </h3>
                  </a>

                  {/* Summary */}
                  {art.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  )}
                </div>

                {/* Footer: Source, Date, Link */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {art.source}
                    </span>
                    {art.published_at && (
                      <>
                        <span>•</span>
                        <span className="truncate">{art.published_at.slice(0, 16)}</span>
                      </>
                    )}
                  </div>

                  <a
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
                  >
                    <span>Baca</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            Halaman {currentPage} dari {totalPages} ({totalCount} total artikel)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound();
                fetchArticles(currentPage - 1);
              }}
              disabled={currentPage <= 1}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                currentPage <= 1
                  ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                  : 'cursor-pointer hover:bg-slate-800/40 text-slate-300 border-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                playClickSound();
                fetchArticles(currentPage + 1);
              }}
              disabled={currentPage >= totalPages}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                currentPage >= totalPages
                  ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                  : 'cursor-pointer hover:bg-slate-800/40 text-slate-300 border-slate-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
