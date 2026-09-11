import React, { useState } from 'react';
import { Brain, Search, BookOpen, Network, FileText, Sparkles, Folder, Tag, Layers, Share2 } from 'lucide-react';
import { api } from '../api';

export function SecondBrainView({ brainData }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

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
            <h3 className="text-xl font-bold text-zinc-100 tracking-tight">Second Brain & Catatan</h3>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              Catatan Obsidian Vault lokal, aturan preferensi, dan jaringan relasi pengetahuan.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center min-w-[85px]">
              <p className="text-xl font-bold text-zinc-100 font-mono">{brainData?.total_notes || notesList.length}</p>
              <p className="text-[10px] text-zinc-500">Total Catatan</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center min-w-[85px]">
              <p className="text-xl font-bold text-zinc-300 font-mono">{graph.entities_count || 0}</p>
              <p className="text-[10px] text-zinc-500">Entitas Graf</p>
            </div>
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-center min-w-[85px]">
              <p className="text-xl font-bold text-zinc-300 font-mono">{graph.relations_count || 0}</p>
              <p className="text-[10px] text-zinc-500">Relasi</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setSearchResults(null);
            }}
            placeholder="Cari catatan Obsidian (misal: persona, rules, server)..."
            className="w-full pl-10 pr-24 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            disabled={searching}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-md transition-colors shadow-sm"
          >
            {searching ? 'Mencari...' : 'Cari'}
          </button>
        </form>
      </div>

      {/* Top Knowledge Entities Graph Tags */}
      {topEntities.length > 0 && (
        <div className="p-5 rounded-xl bg-[#121215] border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-zinc-400" />
              <span>Entitas Pengetahuan Utama</span>
            </h4>
            <span className="text-[10px] text-zinc-500 font-mono">Knowledge Graph</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {topEntities.map((ent, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono flex items-center space-x-1.5"
              >
                <span className="text-zinc-200 font-medium">[[{ent.name}]]</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-bold">
                  {ent.connection_count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div className="space-y-3">
        <h4 className="font-semibold text-zinc-200 text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <span>
            {searchResults !== null
              ? `Hasil Pencarian (${notesList.length} Catatan)`
              : `Daftar Catatan & Aturan (${notesList.length})`}
          </span>
        </h4>

        {notesList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {notesList.map((note, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#121215] border border-zinc-800 hover:border-zinc-700 hover:bg-[#16161a] transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono flex items-center gap-1">
                      <Folder className="w-2.5 h-2.5" />
                      <span>{note.folder || 'Vault'}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{note.modified_at || note.modified || ''}</span>
                  </div>

                  <h5 className="font-semibold text-zinc-100 text-sm leading-snug">{note.title || note.filename}</h5>

                  {(note.preview || note.snippet) && (
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                      {note.preview || note.snippet}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span>{note.filename}</span>
                  {note.size_bytes && <span>{(note.size_bytes / 1024).toFixed(1)} KB</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-zinc-500 py-8 text-center bg-[#121215] rounded-xl border border-zinc-800">
            Tidak ada catatan yang cocok dengan pencarian "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
