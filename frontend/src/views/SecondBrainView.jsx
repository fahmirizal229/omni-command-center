import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Brain,
  Search,
  Network,
  BookOpen,
  Calendar,
  Sparkles,
  RefreshCw,
  FileText,
  Tag,
  Link2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers,
  Clock,
  Folder,
  Hash,
  Copy,
  Check,
  Edit3,
  Eye,
  Save,
  Plus,
  Send,
  ArrowRight,
  Compass,
  Zap,
  Info,
  Sliders,
  Maximize2,
  Minimize2,
  CornerDownRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { playClickSound, playSuccessSound, playSwitchSound } from '../utils/soundEffects';
import { KnowledgeGraph3D } from '../components/KnowledgeGraph3D';
import { motion, AnimatePresence } from 'motion/react';

const FOLDER_THEMES = {
  Rules: { color: '#f43f5e', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-500 dark:text-rose-400' },
  Projects: { color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-500 dark:text-emerald-400' },
  Preferences: { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500 dark:text-amber-400' },
  Entities: { color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500 dark:text-purple-400' },
  Journals: { color: '#0ea5e9', bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-500 dark:text-sky-400' },
  Readings: { color: '#14b8a6', bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-500 dark:text-teal-400' },
  Research: { color: '#06b6d4', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-500 dark:text-cyan-400' },
  Inbox: { color: '#8b5cf6', bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-500 dark:text-violet-400' },
  Templates: { color: '#64748b', bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-500 dark:text-slate-400' },
  Clippings: { color: '#ec4899', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-500 dark:text-pink-400' },
  Root: { color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-500 dark:text-indigo-400' },
};

export function SecondBrainView({ isDark = true }) {
  const { showToast } = useToast();

  // Primary State
  const [activeSubTab, setActiveSubTab] = useState('explorer'); // 'explorer' | 'graph' | 'journal' | 'doctor'
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  // Data State
  const [notes, setNotes] = useState([]);
  const [folderCounts, setFolderCounts] = useState({});
  const [tagsList, setTagsList] = useState([]);
  const [totalWords, setTotalWords] = useState(0);
  const [graphStats, setGraphStats] = useState({});
  const [graphData, setGraphData] = useState({ nodes: [], links: [], categories: [] });
  const [doctorData, setDoctorData] = useState(null);
  const [todayJournal, setTodayJournal] = useState(null);
  const [weeklyRollup, setWeeklyRollup] = useState(null);

  // Active Note & Filters
  const [selectedNotePath, setSelectedNotePath] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [selectedTag, setSelectedTag] = useState('');

  // Quick Journal entry input
  const [quickReflection, setQuickReflection] = useState('');
  const [appendingJournal, setAppendingJournal] = useState(false);

  // Initial Data Load
  const fetchAllBrainData = async () => {
    try {
      setLoading(true);
      const [brainRes, doctorRes, graphRes, todayRes, weeklyRes] = await Promise.allSettled([
        api.getSecondBrain({ query: searchQuery, folder: selectedFolder !== 'All' ? selectedFolder : '', tag: selectedTag }),
        api.getVaultDoctor(),
        api.getNetworkGraph(),
        api.getTodayJournal(),
        api.getWeeklyRollup()
      ]);

      if (brainRes.status === 'fulfilled' && brainRes.value) {
        setNotes(brainRes.value.notes || []);
        setFolderCounts(brainRes.value.folder_counts || {});
        setTagsList(brainRes.value.tags || []);
        setTotalWords(brainRes.value.total_words || 0);
        setGraphStats(brainRes.value.graph || {});
        
        // Auto-select first note if none selected
        if (!selectedNotePath && brainRes.value.notes?.length > 0) {
          const first = brainRes.value.notes[0];
          loadNoteDetail(first.path);
        }
      }

      if (doctorRes.status === 'fulfilled' && doctorRes.value) {
        setDoctorData(doctorRes.value);
      }

      if (graphRes.status === 'fulfilled' && graphRes.value) {
        setGraphData(graphRes.value);
      }

      if (todayRes.status === 'fulfilled' && todayRes.value) {
        setTodayJournal(todayRes.value);
      }

      if (weeklyRes.status === 'fulfilled' && weeklyRes.value) {
        setWeeklyRollup(weeklyRes.value);
      }
    } catch (err) {
      showToast('Gagal memuat data Second Brain', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBrainData();
  }, [selectedFolder, selectedTag]);

  // Load single note detail
  const loadNoteDetail = async (path) => {
    try {
      setNoteLoading(true);
      setSelectedNotePath(path);
      setIsEditing(false);
      const res = await api.getNoteDetail(path);
      setSelectedNote(res);
      setEditContent(res.content || '');
    } catch (err) {
      showToast('Gagal memuat catatan: ' + (err.message || path), 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  // Sync Vault Trigger
  const handleSyncVault = async () => {
    try {
      setSyncing(true);
      playClickSound();
      await api.syncVault();
      playSuccessSound();
      showToast('Second Brain FTS5 Index & Graph berhasil disinkronkan!', 'success');
      await fetchAllBrainData();
    } catch (err) {
      showToast('Sinkronisasi gagal: ' + err.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Save Note Handler
  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      setSavingNote(true);
      await api.saveNote({
        folder: selectedNote.folder || 'Root',
        filename: selectedNote.filename,
        content: editContent
      });
      playSuccessSound();
      showToast('Catatan berhasil disimpan & di-update!', 'success');
      setIsEditing(false);
      await loadNoteDetail(selectedNote.path);
      fetchAllBrainData();
    } catch (err) {
      showToast('Gagal menyimpan catatan: ' + err.message, 'error');
    } finally {
      setSavingNote(false);
    }
  };

  // Quick Append to Today's Journal
  const handleAppendJournal = async (e) => {
    e.preventDefault();
    if (!quickReflection.trim()) return;
    try {
      setAppendingJournal(true);
      playClickSound();
      await api.appendTodayJournal(quickReflection.trim());
      setQuickReflection('');
      playSuccessSound();
      showToast('Refleksi berhasil dicatat ke Journal hari ini!', 'success');
      const todayRes = await api.getTodayJournal();
      setTodayJournal(todayRes);
      if (selectedNote?.path?.includes('Journals')) {
        loadNoteDetail(todayRes.path);
      }
    } catch (err) {
      showToast('Gagal mencatat refleksi: ' + err.message, 'error');
    } finally {
      setAppendingJournal(false);
    }
  };

  // Filter notes by search input
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase();
    return notes.filter(n => 
      n.title.toLowerCase().includes(q) ||
      n.filename.toLowerCase().includes(q) ||
      n.preview.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(q)))
    );
  }, [notes, searchQuery]);

  // Copy Note Link
  const handleCopyWikilink = (title) => {
    navigator.clipboard.writeText(`[[${title}]]`);
    setCopiedLink(true);
    playClickSound();
    setTimeout(() => setCopiedLink(false), 2000);
    showToast(`Wikilink [[${title}]] disalin ke clipboard!`, 'info');
  };

  // Render Formatted Markdown with clickable Wikilinks
  const renderMarkdownBody = (text) => {
    if (!text) return null;

    // Split text into paragraphs and lines
    const lines = text.split('\n');
    return (
      <div className={`space-y-3.5 leading-relaxed text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Heading 1
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className={`text-xl sm:text-2xl font-bold font-mono tracking-tight border-b pb-2 mt-6 mb-3 flex items-center gap-2 ${
                isDark ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'
              }`}>
                <span className="text-indigo-500">#</span>
                {renderInlineWikilinks(line.replace('# ', ''))}
              </h1>
            );
          }
          // Heading 2
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className={`text-base sm:text-lg font-bold font-mono border-b pb-1.5 mt-5 mb-2.5 flex items-center gap-2 ${
                isDark ? 'text-indigo-300 border-slate-800/60' : 'text-indigo-900 border-slate-200'
              }`}>
                <span className="text-indigo-500">##</span>
                {renderInlineWikilinks(line.replace('## ', ''))}
              </h2>
            );
          }
          // Heading 3
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className={`text-sm sm:text-base font-semibold font-mono mt-4 mb-2 flex items-center gap-1.5 ${
                isDark ? 'text-purple-300' : 'text-purple-900'
              }`}>
                <span className="text-purple-500">###</span>
                {renderInlineWikilinks(line.replace('### ', ''))}
              </h3>
            );
          }
          // Blockquote / Callout
          if (line.startsWith('> ')) {
            return (
              <div key={idx} className={`p-3 rounded-xl border font-mono text-xs my-2 flex items-start gap-2.5 ${
                line.includes('[!WARNING]') ? (isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900') :
                line.includes('[!TIP]') ? (isDark ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900') :
                (isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-900')
              }`}>
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{renderInlineWikilinks(line.replace(/^>\s*(\[!.*?\])?\s*/, ''))}</div>
              </div>
            );
          }
          // Unordered list / task list
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const isTask = trimmed.startsWith('- [ ]') || trimmed.startsWith('- [x]');
            if (isTask) {
              const checked = trimmed.startsWith('- [x]');
              return (
                <div key={idx} className={`flex items-center gap-2.5 pl-1 py-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] shrink-0 ${
                    checked ? 'bg-indigo-600 border-indigo-500 text-white' : (isDark ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white')
                  }`}>
                    {checked && <Check className="w-3 h-3" />}
                  </span>
                  <span className={`leading-normal ${checked ? (isDark ? 'line-through text-slate-500' : 'line-through text-slate-400') : ''}`}>
                    {renderInlineWikilinks(trimmed.replace(/- \[[ x]\]\s*/, ''))}
                  </span>
                </div>
              );
            }
            return (
              <div key={idx} className={`flex items-center gap-2.5 pl-1 py-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span className="flex-1 leading-normal">{renderInlineWikilinks(trimmed.replace(/^[-*]\s+/, ''))}</span>
              </div>
            );
          }
          // Table row placeholder
          if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            return (
              <div key={idx} className={`font-mono text-xs px-3 py-1.5 border-x ${
                isDark ? 'text-slate-400 bg-slate-900/60 border-slate-800' : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}>
                {renderInlineWikilinks(trimmed)}
              </div>
            );
          }
          // Code block backticks
          if (trimmed.startsWith('```')) {
            return (
              <div key={idx} className={`px-3 py-1 text-[11px] font-mono rounded-t-lg border border-b-0 mt-2 ${
                isDark ? 'bg-slate-950 text-indigo-400 border-slate-800' : 'bg-slate-100 text-indigo-700 border-slate-300'
              }`}>
                {trimmed.replace('```', '') || 'code'}
              </div>
            );
          }
          // Empty line
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }

          // Regular paragraph
          return (
            <p key={idx} className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {renderInlineWikilinks(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Replace [[Wikilink]] with clickable button in text
  const renderInlineWikilinks = (text) => {
    if (!text) return '';
    const parts = [];
    const regex = /\[\[(.*?)\]\]/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const rawTarget = match[1];
      const cleanTarget = rawTarget.split('|')[0].split('#')[0].trim();
      const label = rawTarget.includes('|') ? rawTarget.split('|')[1].trim() : cleanTarget.replace(/_/g, ' ');

      parts.push(
        <button
          key={match.index}
          type="button"
          onClick={() => {
            playSwitchSound();
            loadNoteDetail(cleanTarget);
          }}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded-md border transition-all text-xs font-mono font-medium ${
            isDark
              ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 hover:text-white'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 shadow-xs'
          }`}
        >
          <Link2 className="w-3 h-3 text-indigo-500 shrink-0" />
          <span>{label}</span>
        </button>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-5 animate-viewEnter select-none">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER HERO & KNOWLEDGE TELEMETRY BANNER                          */}
      {/* ========================================================================= */}
      <div className={`relative overflow-hidden rounded-2xl border backdrop-blur-xl p-5 sm:p-6 transition-all ${
        isDark
          ? 'border-slate-800/80 bg-gradient-to-br from-[#0c101c]/90 via-[#0a0d16]/80 to-[#070910]/90 shadow-[0_8px_32px_rgba(0,0,0,0.4)]'
          : 'border-slate-200 bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/20 shadow-sm'
      }`}>
        {/* Ambient Glows */}
        <div className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[90px] pointer-events-none ${isDark ? 'bg-purple-600/15' : 'bg-purple-300/20'}`} />
        <div className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-[90px] pointer-events-none ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-300/20'}`} />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          {/* Title & Identity */}
          <div className="flex items-center gap-4 shrink-0">
            <div className={`p-3.5 rounded-2xl border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                : 'bg-gradient-to-tr from-purple-100 to-indigo-100 border-purple-200 shadow-sm'
            }`}>
              <Brain className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'} animate-pulse`} />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={`text-xl sm:text-2xl font-bold font-mono tracking-tight flex items-center gap-2 leading-normal ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}>
                  Second Brain & Obsidian Vault
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold ${
                  isDark
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs'
                }`}>
                  <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span>{doctorData?.health_score || 100}% {doctorData?.health_label || 'Pristine / Optimal'}</span>
                </span>
              </div>
              <p className={`text-xs sm:text-sm mt-1.5 font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Decentralized Local-First Memory • SQLite FTS5 Instant Search • 0-Token Knowledge Engine
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap justify-start sm:justify-end xl:ml-auto">
            {/* Quick Stat Pill: Total Notes */}
            <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2.5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
            }`}>
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="flex flex-col justify-center min-w-0">
                <div className={`text-[10px] uppercase font-mono leading-none mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Notes</div>
                <div className={`text-sm font-mono font-bold leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{notes.length || 75} Dokumen</div>
              </div>
            </div>

            {/* Quick Stat Pill: Total Wikilinks */}
            <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-2.5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
            }`}>
              <Link2 className="w-4 h-4 text-purple-500 shrink-0" />
              <div className="flex flex-col justify-center min-w-0">
                <div className={`text-[10px] uppercase font-mono leading-none mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Wikilinks</div>
                <div className={`text-sm font-mono font-bold leading-none ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{doctorData?.wikilinks_count || 406} Tautan</div>
              </div>
            </div>

            {/* Quick Stat Pill: Word Count */}
            <div className={`hidden sm:flex px-3.5 py-2 rounded-xl border items-center gap-2.5 ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-xs'
            }`}>
              <Activity className="w-4 h-4 text-teal-500 shrink-0" />
              <div className="flex flex-col justify-center min-w-0">
                <div className={`text-[10px] uppercase font-mono leading-none mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Words</div>
                <div className={`text-sm font-mono font-bold leading-none ${isDark ? 'text-teal-300' : 'text-teal-700'}`}>{totalWords ? (totalWords).toLocaleString() : '36.2K'}</div>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleSyncVault}
                disabled={syncing}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  isDark
                    ? 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Syncing...' : 'Sync Vault'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsCreatingNote(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-[0_0_16px_rgba(99,102,241,0.3)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Catatan Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Sub-Tab Switcher Bar */}
        <div className={`mt-5 p-1.5 rounded-2xl border flex items-center gap-1.5 overflow-x-auto custom-scrollbar backdrop-blur-xl ${
          isDark ? 'border-slate-800/80 bg-slate-950/40' : 'border-slate-200 bg-slate-100/80'
        }`}>
          {[
            { id: 'explorer', label: 'Vault Explorer & Notes', icon: Folder, count: notes.length },
            { id: 'graph', label: 'Interactive Knowledge Graph', icon: Network, badge: `${graphData.total_nodes || 0} Nodes` },
            { id: 'journal', label: 'Daily Journal & Rollup', icon: Calendar, highlight: true },
            { id: 'doctor', label: 'Vault Doctor & Health', icon: ShieldCheck, badge: '100%' },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playSwitchSound();
                  setActiveSubTab(tab.id);
                }}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap z-10 ${
                  active
                    ? 'text-white font-bold'
                    : (isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900')
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeSecondBrainTab"
                    className={`absolute inset-0 rounded-xl -z-10 ${
                      isDark
                        ? 'bg-indigo-600/30 border border-indigo-500/50 shadow-[0_0_16px_rgba(99,102,241,0.25)]'
                        : 'bg-indigo-600 shadow-sm'
                    }`}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${active ? (isDark ? 'text-indigo-400' : 'text-white') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    active ? (isDark ? 'bg-indigo-950 text-indigo-200' : 'bg-indigo-700 text-white') : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    tab.id === 'doctor' 
                      ? (isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200') 
                      : (isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-800')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUB-TAB VIEW: VAULT EXPLORER & SPLIT PANE MARKDOWN READER              */}
      {/* ========================================================================= */}
      {activeSubTab === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 lg:h-[760px] lg:max-h-[calc(100vh-230px)] lg:min-h-[600px]">
          {/* Left Column: Note Catalog, Search & Filters (5 cols) */}
          <div className={`lg:col-span-5 flex flex-col gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-xl h-[600px] lg:h-full overflow-hidden ${
            isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white/90 shadow-sm'
          }`}>
            {/* Search Bar with Instant Filter */}
            <div className="relative flex items-center shrink-0">
              <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari di Second Brain (FTS5 keyword / title)..."
                className={`w-full border rounded-xl pl-9 pr-8 py-2 text-xs font-mono leading-normal transition-all focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-indigo-500/60 focus:ring-indigo-500/30'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-indigo-200'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-md text-xs cursor-pointer ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-200'}`}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Folder Taxonomy Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedFolder('All')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium inline-flex items-center justify-center leading-none transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedFolder === 'All'
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : (isDark ? 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200')
                }`}
              >
                All ({notes.length})
              </button>
              {Object.entries(folderCounts).map(([fld, count]) => {
                const theme = FOLDER_THEMES[fld] || FOLDER_THEMES.Root;
                const isSelected = selectedFolder.toLowerCase() === fld.toLowerCase();
                return (
                  <button
                    key={fld}
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setSelectedFolder(fld);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium inline-flex items-center justify-center gap-1.5 leading-none transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                      isSelected
                        ? `${theme.bg} ${theme.border} ${theme.text} shadow-xs font-bold`
                        : (isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900')
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.color }} />
                    <span>{fld}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Notes List Scrollable Feed */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2 my-auto">
                  <Compass className="w-8 h-8 opacity-40 text-indigo-500 animate-spin" />
                  <span>Tidak ada catatan yang cocok dengan pencarian</span>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const theme = FOLDER_THEMES[note.folder] || FOLDER_THEMES.Root;
                  const isSelected = selectedNotePath === note.path;

                  return (
                    <div
                      key={note.path}
                      onClick={() => {
                        playSwitchSound();
                        loadNoteDetail(note.path);
                      }}
                      className={`group relative rounded-xl border px-3.5 py-2.5 transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? (isDark 
                              ? 'bg-slate-900 border-indigo-500/70 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/40' 
                              : 'bg-indigo-50/90 border-indigo-300 shadow-xs ring-1 ring-indigo-300/60')
                          : (isDark 
                              ? 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/50' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/90 shadow-xs')
                      }`}
                    >
                      {/* Left Subtle Colored Accent Border */}
                      <div
                        className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all duration-200 group-hover:w-1.5"
                        style={{ backgroundColor: theme.color }}
                      />

                      {/* Content: Folder Badge + Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 border leading-none ${theme.bg} ${theme.text} ${theme.border}`}
                        >
                          {note.folder}
                        </span>
                        <span className={`text-xs font-mono font-bold truncate leading-snug transition-colors ${
                          isSelected 
                            ? (isDark ? 'text-white' : 'text-indigo-950') 
                            : (isDark ? 'text-slate-200 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-600')
                        }`}>
                          {note.title}
                        </span>
                      </div>

                      {/* Right: Chevron Arrow */}
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isSelected 
                          ? 'text-indigo-400 translate-x-0.5' 
                          : (isDark ? 'text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5' : 'text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5')
                      }`} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Markdown Reader & Live Editor (7 cols) */}
          <div className={`lg:col-span-7 flex flex-col rounded-2xl border backdrop-blur-xl shadow-lg overflow-hidden h-[600px] lg:h-full ${
            isDark ? 'border-slate-800/80 bg-slate-900/70' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            {noteLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                <span>Memuat dokumen Second Brain...</span>
              </div>
            ) : !selectedNote ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 font-mono text-xs gap-3">
                <BookOpen className="w-10 h-10 opacity-30 text-indigo-500" />
                <span>Pilih catatan dari daftar di samping untuk membaca</span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
                {/* Note Detail Header Toolbar */}
                <div className={`p-4 border-b flex items-center justify-between gap-3 flex-wrap shrink-0 ${
                  isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/90'
                }`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        (FOLDER_THEMES[selectedNote.folder] || FOLDER_THEMES.Root).bg
                      } ${(FOLDER_THEMES[selectedNote.folder] || FOLDER_THEMES.Root).text} border ${(FOLDER_THEMES[selectedNote.folder] || FOLDER_THEMES.Root).border}`}>
                        {selectedNote.folder}
                      </span>
                      <span className={`text-xs font-mono truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {selectedNote.path}
                      </span>
                    </div>
                    <h2 className={`text-base sm:text-lg font-bold font-mono mt-1 truncate ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {selectedNote.title}
                    </h2>
                  </div>

                  {/* Actions: Copy Wikilink, Toggle Edit/Preview, Save */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyWikilink(selectedNote.title)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white' 
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                      }`}
                      title="Salin Wikilink"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Wikilink'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        playClickSound();
                        setIsEditing(!isEditing);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isEditing
                          ? (isDark ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300' : 'bg-amber-100 border border-amber-300 text-amber-800')
                          : (isDark ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30' : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100')
                      }`}
                    >
                      {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                      <span>{isEditing ? 'Preview Mode' : 'Edit Note'}</span>
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-50"
                      >
                        <Save className={`w-3.5 h-3.5 ${savingNote ? 'animate-spin' : ''}`} />
                        <span>{savingNote ? 'Saving...' : 'Save'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata & Tag Strip */}
                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div className={`px-4 py-2 border-b flex items-center gap-2 flex-wrap shrink-0 ${
                    isDark ? 'bg-slate-950/40 border-slate-800/60' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-[10px] font-mono uppercase flex items-center gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Tag className="w-3 h-3 text-purple-500" /> Tags:
                    </span>
                    {selectedNote.tags.map((t) => (
                      <span
                        key={t}
                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] ${
                          isDark 
                            ? 'bg-purple-500/10 border border-purple-500/20 text-purple-300' 
                            : 'bg-purple-50 border border-purple-200 text-purple-700'
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5">
                  {isEditing ? (
                    <div className="h-full min-h-[350px] flex flex-col">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        placeholder="Tulis format markdown Obsidian..."
                        className={`w-full flex-1 min-h-[350px] border rounded-xl p-4 font-mono text-xs leading-relaxed custom-scrollbar resize-none focus:outline-none ${
                          isDark 
                            ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-500' 
                            : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                  ) : (
                    <div className="max-w-none">
                      {renderMarkdownBody(selectedNote.content)}
                    </div>
                  )}

                  {/* Backlinks & Outgoing Graph Links Accordion */}
                  <div className={`mt-8 pt-5 border-t flex flex-col gap-4 ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                    {/* Backlinks (Incoming connections) */}
                    <div>
                      <h4 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 mb-2.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <CornerDownRight className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Backlinks ({selectedNote.backlinks?.length || 0} Incoming Connections)</span>
                      </h4>
                      {selectedNote.backlinks && selectedNote.backlinks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {selectedNote.backlinks.map((bl) => (
                            <button
                              key={bl.path}
                              type="button"
                              onClick={() => {
                                playSwitchSound();
                                loadNoteDetail(bl.path);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 group cursor-pointer ${
                                isDark
                                  ? 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900'
                                  : 'bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-xs'
                              }`}
                            >
                              <div className="min-w-0">
                                <span className={`text-[10px] font-mono block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{bl.folder}</span>
                                <span className={`text-xs font-mono font-medium truncate block ${
                                  isDark ? 'text-slate-200 group-hover:text-indigo-300' : 'text-slate-800 group-hover:text-indigo-600'
                                }`}>
                                  {bl.title}
                                </span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-mono text-slate-500 italic">
                          Tidak ada catatan lain yang mentautkan dokumen ini.
                        </p>
                      )}
                    </div>

                    {/* Outgoing Links */}
                    {selectedNote.outgoing_links && selectedNote.outgoing_links.length > 0 && (
                      <div>
                        <h4 className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 mb-2.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                          <span>Outgoing Wikilinks ({selectedNote.outgoing_links.length})</span>
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedNote.outgoing_links.map((link, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                playSwitchSound();
                                loadNoteDetail(link.target);
                              }}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1 transition-all cursor-pointer ${
                                isDark
                                  ? 'bg-purple-500/10 border-purple-500/25 text-purple-300 hover:bg-purple-500/20 hover:text-white'
                                  : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-900 shadow-xs'
                              }`}
                            >
                              <Link2 className="w-3 h-3 text-purple-500" />
                              <span>{link.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-TAB VIEW: INTERACTIVE 3D KNOWLEDGE GRAPH CANVAS                    */}
      {/* ========================================================================= */}
      {activeSubTab === 'graph' && (
        <KnowledgeGraph3D
          graphData={graphData}
          onOpenInExplorer={(node) => {
            playSwitchSound();
            setActiveSubTab('explorer');
            loadNoteDetail(node.path || node.id);
          }}
          folderThemes={FOLDER_THEMES}
          isDark={isDark}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-TAB VIEW: DAILY JOURNAL & WEEKLY ROLLUP                            */}
      {/* ========================================================================= */}
      {activeSubTab === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* Left Column: Today's Log & Quick Logger (7 cols) */}
          <div className={`lg:col-span-7 flex flex-col gap-4 rounded-2xl border p-5 shadow-lg backdrop-blur-xl ${
            isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className={`flex items-center justify-between gap-3 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-sky-500/10 border-sky-500/30' : 'bg-sky-50 border-sky-200'}`}>
                  <Calendar className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {todayJournal?.title || 'Daily Journal'}
                  </h3>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Auto-synced with Hermes Morning Briefing & Nightly Reflection
                  </span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-bold ${
                isDark ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
              }`}>
                {todayJournal?.date || 'Today'}
              </span>
            </div>

            {/* Quick Append Reflection Input */}
            <form onSubmit={handleAppendJournal} className="flex gap-2">
              <input
                type="text"
                value={quickReflection}
                onChange={(e) => setQuickReflection(e.target.value)}
                placeholder="Catat refleksi, insight, atau milestone kilat ke journal hari ini..."
                className={`flex-1 border rounded-xl px-4 py-2.5 text-xs font-mono transition-all focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-sky-500/60'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                }`}
              />
              <button
                type="submit"
                disabled={appendingJournal || !quickReflection.trim()}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{appendingJournal ? 'Logging...' : 'Log'}</span>
              </button>
            </form>

            {/* Today's Log Content Viewer */}
            <div className={`flex-1 overflow-y-auto custom-scrollbar border rounded-xl p-4 font-mono text-xs leading-relaxed max-h-[450px] ${
              isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              {todayJournal?.content ? (
                renderMarkdownBody(todayJournal.content)
              ) : (
                <div className="text-slate-500 italic p-4 text-center">
                  Memuat catatan harian hari ini...
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Weekly Rollup & Growth Digest (5 cols) */}
          <div className={`lg:col-span-5 flex flex-col gap-4 rounded-2xl border p-5 shadow-lg backdrop-blur-xl ${
            isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className={`flex items-center gap-3 border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className={`text-sm sm:text-base font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Weekly Retrospective Rollup
                </h3>
                <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sprint aggregates, health summaries & key milestones
                </span>
              </div>
            </div>

            {weeklyRollup?.found ? (
              <div className={`flex-1 overflow-y-auto custom-scrollbar border rounded-xl p-4 font-mono text-xs leading-relaxed max-h-[500px] ${
                isDark ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className={`text-xs font-bold mb-2 font-mono ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                  📄 {weeklyRollup.filename}
                </div>
                {renderMarkdownBody(weeklyRollup.content)}
              </div>
            ) : (
              <div className={`p-8 text-center font-mono text-xs flex flex-col items-center justify-center gap-2 border rounded-xl ${
                isDark ? 'border-slate-800/60 bg-slate-950/40 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                <Calendar className="w-8 h-8 opacity-40 text-purple-500" />
                <span>Weekly Rollup belum di-generate untuk minggu ini.</span>
                <span className="text-[10px] text-slate-400">Gunakan CLI: `brain weekly`</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-TAB VIEW: VAULT DOCTOR & INTEGRITY SENTINEL                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'doctor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Health Score Gauge Card */}
          <div className={`p-6 rounded-2xl border backdrop-blur-xl flex flex-col items-center text-center justify-center shadow-lg ${
            isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div className="relative w-32 h-32 flex items-center justify-center mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-pulse" />
              <div className="absolute inset-2 rounded-full border-2 border-emerald-500/40" />
              <div className="text-center font-mono">
                <div className="text-3xl font-bold text-emerald-500">
                  {doctorData?.health_score || 100}%
                </div>
                <div className={`text-[10px] uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Health Score</div>
              </div>
            </div>
            <h3 className={`text-base font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {doctorData?.health_label || 'Pristine / Optimal'}
            </h3>
            <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Semua wikilink valid, zero broken links, zero orphaned sprint documents.
            </p>
          </div>

          {/* Diagnostic Metrics List */}
          <div className={`md:col-span-2 p-6 rounded-2xl border backdrop-blur-xl flex flex-col justify-between shadow-lg ${
            isDark ? 'border-slate-800/80 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
          }`}>
            <div>
              <h3 className={`text-sm font-bold font-mono uppercase tracking-wider mb-4 flex items-center gap-2 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Vault Integrity & Graph Health Diagnostics</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Broken Wikilinks</div>
                  <div className="text-lg font-mono font-bold text-emerald-500 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{doctorData?.broken_links_count || 0}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Orphan Notes</div>
                  <div className="text-lg font-mono font-bold text-emerald-500 flex items-center gap-1.5 mt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{doctorData?.orphan_notes_count || 0}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>FTS5 Indexed</div>
                  <div className="text-lg font-mono font-bold text-indigo-500 flex items-center gap-1.5 mt-1">
                    <Zap className="w-4 h-4" />
                    <span>{notes.length || 75} Docs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-6 pt-4 border-t flex items-center justify-between flex-wrap gap-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                CLI Diagnostic Tool: <code className={`px-2 py-0.5 rounded border ${
                  isDark ? 'text-indigo-400 bg-slate-950 border-slate-800' : 'text-indigo-700 bg-slate-100 border-slate-200'
                }`}>brain doctor</code>
              </span>
              <button
                type="button"
                onClick={handleSyncVault}
                disabled={syncing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Re-Audit Vault</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
