import React, { useState, useEffect } from 'react';
import {
  Brain,
  Search,
  BookOpen,
  Network,
  FileText,
  Sparkles,
  Folder,
  Tag,
  Layers,
  Share2,
  X,
  Link as LinkIcon,
  AlertCircle,
  ExternalLink,
  Calendar,
  Eye
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

export function SecondBrainView({ brainData }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'orphans'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [orphans, setOrphans] = useState([]);
  const [loadingOrphans, setLoadingOrphans] = useState(false);

  // Note Detail Modal State
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteContent, setNoteContent] = useState(null);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    if (activeTab === 'orphans' && orphans.length === 0) {
      loadOrphans();
    }
  }, [activeTab]);

  const loadOrphans = async () => {
    setLoadingOrphans(true);
    try {
      const res = await api.getOrphanNotes();
      setOrphans(res.orphans || []);
    } catch {
      setOrphans([]);
    } finally {
      setLoadingOrphans(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const res = await api.getSecondBrain(searchQuery.trim());
      setSearchResults(res.notes || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const openNoteDetail = async (folder, filename, title) => {
    setSelectedNote({ folder, filename, title });
    setLoadingNote(true);
    setNoteContent(null);
    try {
      const res = await api.getNoteDetail(folder, filename);
      setNoteContent(res);
    } catch (err) {
      setNoteContent({ error: 'Gagal memuat isi catatan.' });
    } finally {
      setLoadingNote(false);
    }
  };

  const FINANCE_FILTER = ['finance', 'debt', 'pinjol', 'tagihan', 'wallet', 'dompet', 'cicilan', 'paylater'];
  const rawNotes = searchResults !== null ? searchResults : brainData?.notes || [];
  const notesList = rawNotes.filter((n) => {
    const text = `${n.title || ''} ${n.filename || ''} ${n.preview || ''}`.toLowerCase();
    return !FINANCE_FILTER.some((f) => text.includes(f));
  });
  const graph = brainData?.graph || {};
  const topEntities = (graph.top_entities || []).filter((e) => {
    const name = (e.name || '').toLowerCase();
    return !FINANCE_FILTER.some((f) => name.includes(f));
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center space-x-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <span>{t('brain_title', 'Second Brain & Knowledge Base')}</span>
            </h3>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {t('brain_subtitle', 'Catatan Obsidian Vault lokal, aturan preferensi, dan jaringan relasi pengetahuan mandiri.')}
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center min-w-[85px]">
              <p className="text-xl font-bold text-zinc-100 font-mono">{brainData?.total_notes || notesList.length}</p>
              <p className="text-[10px] text-zinc-500">{t('brain_stat_total_notes', 'Total Catatan')}</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center min-w-[85px]">
              <p className="text-xl font-bold text-zinc-300 font-mono">{graph.entities_count || 0}</p>
              <p className="text-[10px] text-zinc-500">{t('brain_stat_entities', 'Entitas Graf')}</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center min-w-[85px]">
              <p className="text-xl font-bold text-zinc-300 font-mono">{graph.relations_count || 0}</p>
              <p className="text-[10px] text-zinc-500">{t('brain_stat_relations', 'Relasi')}</p>
            </div>
          </div>
        </div>

        {/* Search Bar & Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value) setSearchResults(null);
              }}
              placeholder={t('brain_search_placeholder', 'Cari catatan Obsidian (misal: persona, rules, server)...')}
              className="w-full pl-10 pr-24 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-md transition-colors shadow-sm"
            >
              {searching ? t('loading', 'Mencari...') : t('search_placeholder', 'Cari')}
            </button>
          </form>

          {/* Tab Filter */}
          <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'all' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua Catatan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orphans')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'orphans' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Orphan Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Knowledge Entities Graph Tags */}
      {topEntities.length > 0 && activeTab === 'all' && (
        <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t('brain_top_entities', 'Entitas Pengetahuan Utama')}</span>
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">Knowledge Graph Links</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {topEntities.map((ent, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs flex items-center space-x-1.5 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => {
                  setSearchQuery(ent.name);
                  api.getSecondBrain(ent.name).then((res) => setSearchResults(res.notes || []));
                }}
              >
                <span className="font-medium text-zinc-200">{ent.name}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({ent.connection_count || 0})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Notes List or Orphan Notes */}
      {activeTab === 'orphans' ? (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200/90 space-y-1">
            <p className="font-semibold flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Orphan Notes (Catatan yang belum memiliki tautan masuk)</span>
            </p>
            <p className="text-[11px] text-amber-300/70">
              Catatan di bawah ini berdiri sendiri dan belum di-link oleh catatan lain menggunakan syntax [[wikilinks]]. Hubungkan catatan ini ke entitas lain agar grafik pengetahuan semakin padu.
            </p>
          </div>

          {loadingOrphans ? (
            <div className="p-12 text-center text-xs text-zinc-500">Menganalisis orphan notes...</div>
          ) : orphans.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-400 text-xs space-y-1">
              <p className="font-semibold text-emerald-400">✨ Luar biasa! Tidak ada orphan notes.</p>
              <p className="text-[11px] text-zinc-500">Semua catatan di Second Brain sudah saling terhubung dengan baik.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {orphans.map((note, idx) => (
                <div
                  key={idx}
                  onClick={() => openNoteDetail(note.folder, note.filename, note.title)}
                  className="group rounded-xl bg-[#121215] border border-amber-900/30 hover:border-amber-700/60 p-4 space-y-3 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-amber-400/90 font-mono flex items-center space-x-1">
                        <Folder className="w-2.5 h-2.5 text-amber-500" />
                        <span>{note.folder}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{note.modified_at}</span>
                    </div>

                    <h5 className="font-bold text-zinc-100 text-xs group-hover:text-amber-200 transition-colors flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </h5>
                  </div>

                  <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono flex justify-between items-center">
                    <span>{note.filename}</span>
                    <span className="text-amber-400 text-[10px] flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>Baca</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5 px-1">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t('brain_recent_notes', 'Catatan & Dokumen Obsidian')}</span>
          </h4>

          {notesList.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs space-y-1">
              <p>{t('brain_no_notes_found', 'Tidak ada catatan ditemukan.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {notesList.map((note, idx) => (
                <div
                  key={idx}
                  onClick={() => openNoteDetail(note.folder, note.filename, note.title)}
                  className="group rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 p-4 space-y-3 transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono flex items-center space-x-1">
                        <Folder className="w-2.5 h-2.5 text-zinc-500" />
                        <span>{note.folder}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{note.modified_at}</span>
                    </div>

                    <h5 className="font-bold text-zinc-100 text-xs group-hover:text-white transition-colors flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </h5>

                    {note.preview && (
                      <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                        {note.preview}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-900 text-[10px] text-zinc-500 font-mono flex justify-between items-center">
                    <span>{note.filename}</span>
                    <span className="text-zinc-400 text-[10px] flex items-center space-x-1 group-hover:text-zinc-200">
                      <Eye className="w-3 h-3" />
                      <span>Baca Catatan</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/50">
              <div className="space-y-1 truncate">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono">
                    {selectedNote.folder}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">{selectedNote.filename}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 truncate">
                  {selectedNote.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs leading-relaxed flex-1">
              {loadingNote ? (
                <div className="py-16 text-center text-zinc-500">Memuat isi dokumen markdown...</div>
              ) : noteContent?.error ? (
                <div className="p-4 rounded-lg bg-red-950/30 border border-red-800 text-red-300">
                  {noteContent.error}
                </div>
              ) : (
                <>
                  {/* Wikilinks & Backlinks Bar */}
                  {((noteContent?.outgoing_links && noteContent.outgoing_links.length > 0) ||
                    (noteContent?.backlinks && noteContent.backlinks.length > 0)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-400 flex items-center space-x-1 mb-1.5">
                          <LinkIcon className="w-3 h-3 text-indigo-400" />
                          <span>Tautan Keluar (Outgoing [[links]]):</span>
                        </p>
                        {noteContent.outgoing_links?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {noteContent.outgoing_links.map((lnk, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-indigo-300 font-mono"
                              >
                                [[{lnk}]]
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-600 italic">Tidak ada link keluar</p>
                        )}
                      </div>

                      <div>
                        <p className="text-[10px] font-semibold text-zinc-400 flex items-center space-x-1 mb-1.5">
                          <Share2 className="w-3 h-3 text-emerald-400" />
                          <span>Disebut Oleh (Backlinks):</span>
                        </p>
                        {noteContent.backlinks?.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {noteContent.backlinks.map((b, i) => (
                              <span
                                key={i}
                                onClick={() => openNoteDetail(b.folder, b.filename, b.title)}
                                className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-emerald-300 font-mono cursor-pointer hover:border-emerald-600"
                              >
                                {b.title}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-600 italic">Tidak ada catatan lain yang me-link catatan ini</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Raw Markdown Content */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {noteContent?.content}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
