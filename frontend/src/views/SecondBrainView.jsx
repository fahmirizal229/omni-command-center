import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';
import { useLanguage } from '../context/LanguageContext';

const FOLDER_COLORS = {
  Rules: '#f43f5e',       // Rose
  Preferences: '#818cf8', // Indigo
  Projects: '#34d399',    // Emerald
  Entities: '#38bdf8',    // Sky
  Readings: '#fbbf24',    // Amber
  Inbox: '#a78bfa',       // Purple
  Research: '#2dd4bf',    // Teal
  default: '#94a3b8'      // Slate
};

export function SecondBrainView({ brainData }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'graph' | 'orphans'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [orphans, setOrphans] = useState([]);
  const [loadingOrphans, setLoadingOrphans] = useState(false);

  // Graph Data State
  const [graphData, setGraphData] = useState(null);
  const [loadingGraph, setLoadingGraph] = useState(false);

  // Note Detail Modal State
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteContent, setNoteContent] = useState(null);
  const [loadingNote, setLoadingNote] = useState(false);

  useEffect(() => {
    if (activeTab === 'orphans' && orphans.length === 0) {
      loadOrphans();
    } else if (activeTab === 'graph' && !graphData) {
      loadGraph();
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

  const loadGraph = async () => {
    setLoadingGraph(true);
    try {
      const res = await api.getNetworkGraph();
      setGraphData(res || { nodes: [], links: [] });
    } catch (err) {
      console.error('Failed to load network graph:', err);
      setGraphData({ nodes: [], links: [] });
    } finally {
      setLoadingGraph(false);
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
      <div className="p-6 rounded-xl bg-[#121215] border border-zinc-800 space-y-5 shadow-xl">
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
                activeTab === 'all' ? 'bg-zinc-800 text-zinc-100 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua Catatan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'graph' ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Interactive Graph</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orphans')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'orphans' ? 'bg-zinc-800 text-amber-300 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Orphan Notes</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE KNOWLEDGE GRAPH CANVAS */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#121215] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-zinc-100 font-mono uppercase tracking-wider">
                  Obsidian Wikilink Graph Explorer
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {graphData?.nodes?.length || 0} Nodes • {graphData?.links?.length || 0} Relations
                </span>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                {Object.entries(FOLDER_COLORS).filter(([k]) => k !== 'default').map(([fld, color]) => (
                  <span key={fld} className="flex items-center gap-1 text-zinc-400">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span>{fld}</span>
                  </span>
                ))}
              </div>
            </div>

            {loadingGraph ? (
              <div className="h-96 flex items-center justify-center text-xs text-zinc-500 font-mono animate-pulse">
                Membangun simpul graf relasi Second Brain...
              </div>
            ) : (
              <KnowledgeGraphCanvas
                data={graphData}
                onNodeClick={(node) => openNoteDetail(node.folder, node.filename, node.label)}
              />
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ALL NOTES LIST & ENTITIES */}
      {activeTab === 'all' && (
        <>
          {topEntities.length > 0 && (
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {notesList.map((note, idx) => (
              <div
                key={idx}
                onClick={() => openNoteDetail(note.folder, note.filename, note.title)}
                className="group rounded-xl bg-[#121215] border border-zinc-800/90 hover:border-zinc-700 p-4 space-y-3 transition-all flex flex-col justify-between cursor-pointer shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-400 font-mono flex items-center space-x-1">
                      <Folder className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{note.folder}</span>
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">{note.modified_at}</span>
                  </div>

                  <h5 className="font-bold text-zinc-100 text-xs group-hover:text-indigo-300 transition-colors flex items-center space-x-1.5">
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
                  <span>{(note.size_bytes / 1024).toFixed(1)} KB</span>
                  <span className="text-indigo-400 flex items-center gap-1 group-hover:underline">
                    <Eye className="w-3 h-3" />
                    <span>Baca Detail</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* VIEW 3: ORPHAN NOTES */}
      {activeTab === 'orphans' && (
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
                    <span>Klik untuk buka</span>
                    <span className="text-amber-400">Hubungkan Catatan</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTE DETAIL MODAL */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="space-y-1 overflow-hidden pr-4">
                <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-indigo-300">
                    {selectedNote.folder}
                  </span>
                  <span>/ {selectedNote.filename}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 truncate">{selectedNote.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar text-xs leading-relaxed text-zinc-300">
              {loadingNote ? (
                <div className="p-12 text-center text-zinc-500 font-mono">Memuat konten catatan...</div>
              ) : noteContent?.error ? (
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300">
                  {noteContent.error}
                </div>
              ) : (
                <>
                  {/* Note Body */}
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-zinc-200 selection:bg-indigo-500/30">
                    {noteContent?.content}
                  </div>

                  {/* Wikilinks & Backlinks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Outgoing Links */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                      <p className="font-bold text-zinc-300 text-[11px] flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Outgoing Links ({noteContent?.outgoing_links?.length || 0})</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(noteContent?.outgoing_links || []).length === 0 ? (
                          <span className="text-[10px] text-zinc-500 italic">Tidak ada tautan keluar</span>
                        ) : (
                          noteContent.outgoing_links.map((link, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-indigo-300">
                              [[{link}]]
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Incoming Backlinks */}
                    <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                      <p className="font-bold text-zinc-300 text-[11px] flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Incoming Backlinks ({noteContent?.backlinks?.length || 0})</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(noteContent?.backlinks || []).length === 0 ? (
                          <span className="text-[10px] text-zinc-500 italic">Belum ada catatan yang me-link ke sini</span>
                        ) : (
                          noteContent.backlinks.map((b, idx) => (
                            <span
                              key={idx}
                              onClick={() => openNoteDetail(b.folder, b.filename, b.title)}
                              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-emerald-300 hover:border-emerald-600 cursor-pointer"
                            >
                              {b.title}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * High-Performance HTML5 Canvas 2D Force-Directed Knowledge Graph Visualizer
 */
function KnowledgeGraphCanvas({ data, onNodeClick }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data?.nodes?.length) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.parentElement.clientWidth || 800;
    let height = 520;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initialize node positions
    const nodes = data.nodes.map((n, i) => {
      const angle = (i / data.nodes.length) * 2 * Math.PI;
      const radius = 120 + Math.random() * 120;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: Math.max(5, Math.min(14, 5 + (n.val || 1) * 1.5))
      };
    });

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const links = data.links
      .map((l) => ({
        source: nodeById.get(l.source),
        target: nodeById.get(l.target)
      }))
      .filter((l) => l.source && l.target);

    let animationFrameId;
    let draggingNode = null;
    let dragOffset = { x: 0, y: 0 };

    // Simulation loop
    const tick = () => {
      // 1. Repulsive force between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 220) {
            const force = (220 - dist) / dist * 0.25;
            a.vx -= dx * force * 0.05;
            a.vy -= dy * force * 0.05;
            b.vx += dx * force * 0.05;
            b.vy += dy * force * 0.05;
          }
        }
      }

      // 2. Spring force along links
      for (const link of links) {
        const dx = link.target.x - link.source.x;
        const dy = link.target.y - link.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 75;
        const force = (dist - targetDist) * 0.035;
        link.source.vx += (dx / dist) * force;
        link.source.vy += (dy / dist) * force;
        link.target.vx -= (dx / dist) * force;
        link.target.vy -= (dy / dist) * force;
      }

      // 3. Center gravity
      for (const n of nodes) {
        const dx = width / 2 - n.x;
        const dy = height / 2 - n.y;
        n.vx += dx * 0.005;
        n.vy += dy * 0.005;

        // Apply velocity & damping
        n.vx *= 0.88;
        n.vy *= 0.88;
        if (n !== draggingNode) {
          n.x += n.vx;
          n.y += n.vy;
        }
      }

      // Draw
      ctx.clearRect(0, 0, width, height);

      // Draw Links
      ctx.lineWidth = 1;
      for (const link of links) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(link.source.x, link.source.y);
        ctx.lineTo(link.target.x, link.target.y);
        ctx.stroke();
      }

      // Draw Nodes
      for (const n of nodes) {
        const color = FOLDER_COLORS[n.folder] || FOLDER_COLORS.default;
        const isHovered = hoveredNode && hoveredNode.id === n.id;

        // Glow when hovered
        if (isHovered) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isHovered ? n.radius + 3 : n.radius, 0, 2 * Math.PI);
        ctx.fill();

        // Node label text
        ctx.shadowBlur = 0;
        ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
        ctx.font = isHovered ? 'bold 11px monospace' : '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(n.label, n.x, n.y + n.radius + 11);
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Mouse Interactions
    const handleMouseDown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const n of nodes) {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 5) {
          draggingNode = n;
          dragOffset = { x: dx, y: dy };
          break;
        }
      }
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (draggingNode) {
        draggingNode.x = mouseX - dragOffset.x;
        draggingNode.y = mouseY - dragOffset.y;
        draggingNode.vx = 0;
        draggingNode.vy = 0;
      } else {
        let found = null;
        for (const n of nodes) {
          const dx = mouseX - n.x;
          const dy = mouseY - n.y;
          if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 5) {
            found = n;
            break;
          }
        }
        setHoveredNode(found);
        canvas.style.cursor = found ? 'pointer' : 'default';
      }
    };

    const handleMouseUp = () => {
      draggingNode = null;
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      for (const n of nodes) {
        const dx = mouseX - n.x;
        const dy = mouseY - n.y;
        if (Math.sqrt(dx * dx + dy * dy) <= n.radius + 5) {
          onNodeClick(n);
          break;
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('click', handleClick);
    };
  }, [data]);

  return (
    <div className="relative rounded-xl bg-zinc-950 border border-zinc-800/80 overflow-hidden shadow-inner">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '520px', display: 'block' }}
      />

      {/* Hover Info Tag */}
      {hoveredNode && (
        <div className="absolute top-3 left-3 bg-[#121215]/90 backdrop-blur-md border border-zinc-700/80 px-3 py-2 rounded-lg text-xs font-mono shadow-xl animate-fadeIn">
          <p className="font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: FOLDER_COLORS[hoveredNode.folder] || FOLDER_COLORS.default }} />
            <span>{hoveredNode.label}</span>
          </p>
          <p className="text-[10px] text-zinc-400">Folder: {hoveredNode.folder} • {hoveredNode.val - 1} Relasi</p>
        </div>
      )}

      {/* Instruction Helper */}
      <div className="absolute bottom-3 right-3 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-zinc-400">
        💡 Drag node untuk menggeser • Klik node untuk membaca catatan
      </div>
    </div>
  );
}
