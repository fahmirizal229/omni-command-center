import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Kanban,
  Table as TableIcon,
  Plus,
  Search,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  X,
  Briefcase,
  Layers,
  Sparkles,
  Trophy,
  XCircle,
  Filter,
  ArrowUpDown,
  MoreVertical,
} from 'lucide-react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { playClickSound, playSuccessSound, playAlertSound } from '../utils/soundEffects';

export function CareerKanbanView({ isDark = true, onNavigate }) {
  const { showToast } = useToast();
  const { language } = useLanguage();

  const [kanbanData, setKanbanData] = useState({ columns: {}, stats: {}, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('board'); // 'board' or 'table'
  const [activeStatusTab, setActiveStatusTab] = useState('all'); // 'all', 'active', 'wishlist', 'applied', 'interview', 'offering', 'rejected'

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    location: 'Remote / Surabaya',
    salary: '',
    job_url: '',
    status: 'wishlist',
    applied_date: '',
    next_schedule: '',
    notes: '',
  });

  // Columns Configuration
  const columnsConfig = [
    {
      id: 'wishlist',
      label: 'Wishlist',
      color: 'slate',
      badge: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
      dotColor: 'bg-slate-400',
    },
    {
      id: 'applied',
      label: 'Applied',
      color: 'indigo',
      badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
      dotColor: 'bg-indigo-400',
    },
    {
      id: 'screening',
      label: 'Screening HR',
      color: 'cyan',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
      dotColor: 'bg-cyan-400',
    },
    {
      id: 'tech_test',
      label: 'Tech Test',
      color: 'amber',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
      dotColor: 'bg-amber-400',
    },
    {
      id: 'interview',
      label: 'Interview',
      color: 'purple',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
      dotColor: 'bg-purple-400',
    },
    {
      id: 'offering',
      label: 'Offering',
      color: 'emerald',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
      dotColor: 'bg-emerald-400',
    },
    {
      id: 'rejected',
      label: 'Closed / Evaluated',
      color: 'rose',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
      dotColor: 'bg-rose-400',
    },
  ];

  // Fetch Pipeline Data
  const fetchKanbanJobs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getJobs();
      if (res && res.columns) {
        setKanbanData(res);
      }
    } catch (err) {
      console.error('Error fetching kanban jobs:', err);
      showToast('Gagal memuat pipeline karir.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchKanbanJobs();
  }, [fetchKanbanJobs]);

  // Open Modal for Add
  const handleOpenAdd = (defaultStatus = 'wishlist') => {
    playClickSound();
    setIsEditing(false);
    setCurrentJobId(null);
    setFormData({
      company: '',
      role: '',
      location: 'Remote / Surabaya',
      salary: '',
      job_url: '',
      status: defaultStatus,
      applied_date: defaultStatus !== 'wishlist' ? new Date().toISOString().split('T')[0] : '',
      next_schedule: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (job) => {
    playClickSound();
    setIsEditing(true);
    setCurrentJobId(job.id);
    setFormData({
      company: job.company || '',
      role: job.role || '',
      location: job.location || '',
      salary: job.salary || '',
      job_url: job.job_url || '',
      status: job.status || 'wishlist',
      applied_date: job.applied_date || '',
      next_schedule: job.next_schedule || '',
      notes: job.notes || '',
    });
    setIsModalOpen(true);
  };

  // Submit Form (Create or Update)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) {
      showToast('Nama perusahaan dan posisi wajib diisi.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      if (isEditing && currentJobId) {
        await api.updateJob(currentJobId, formData);
        showToast(`Lamaran di ${formData.company} berhasil diperbarui.`, 'success');
      } else {
        await api.createJob(formData);
        showToast(`Lamaran di ${formData.company} berhasil dicatat.`, 'success');
      }
      playSuccessSound();
      setIsModalOpen(false);
      fetchKanbanJobs();
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal menyimpan lamaran.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move Column Quick Action
  const handleMoveStatus = async (jobId, newStatus) => {
    playClickSound();
    try {
      await api.updateJobStatus(jobId, { status: newStatus });
      playSuccessSound();
      showToast(`Status dipindahkan ke ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
      fetchKanbanJobs();
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal memindahkan status.', 'error');
    }
  };

  // Delete Job
  const handleDeleteJob = async (jobId) => {
    try {
      await api.deleteJob(jobId);
      playSuccessSound();
      showToast('Lamaran berhasil dihapus.', 'info');
      setDeleteConfirmId(null);
      fetchKanbanJobs();
    } catch (err) {
      playAlertSound();
      showToast(err.message || 'Gagal menghapus lamaran.', 'error');
    }
  };

  // Flattened All Jobs for Table View & Quick Search
  const allJobsFlat = useMemo(() => {
    const list = [];
    if (!kanbanData?.columns) return list;
    Object.keys(kanbanData.columns).forEach((statusKey) => {
      const items = kanbanData.columns[statusKey] || [];
      items.forEach((item) => {
        list.push({ ...item, status: statusKey });
      });
    });
    return list;
  }, [kanbanData]);

  // Filter jobs by search query & status filter
  const filteredFlatJobs = useMemo(() => {
    return allJobsFlat.filter((j) => {
      // Search check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (j.company && j.company.toLowerCase().includes(q)) ||
          (j.role && j.role.toLowerCase().includes(q)) ||
          (j.location && j.location.toLowerCase().includes(q)) ||
          (j.notes && j.notes.toLowerCase().includes(q));
        if (!match) return false;
      }
      // Status Tab filter
      if (activeStatusTab === 'all') return true;
      if (activeStatusTab === 'active') return j.status !== 'rejected' && j.status !== 'offering';
      if (activeStatusTab === 'interview') return ['screening', 'tech_test', 'interview'].includes(j.status);
      return j.status === activeStatusTab;
    });
  }, [allJobsFlat, searchQuery, activeStatusTab]);

  // Helper get status info
  const getStatusBadge = (statusKey) => {
    const col = columnsConfig.find((c) => c.id === statusKey);
    return col || { label: statusKey, badge: 'bg-slate-800 text-slate-300 border-slate-700', dotColor: 'bg-slate-400' };
  };

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-4 pb-16 font-sans select-none animate-viewCrossfade">
      {/* ========================================================= */}
      {/* 1. COMPACT TOP HEADER BAR (Zero Bloat, Viewport-Fit)      */}
      {/* ========================================================= */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border backdrop-blur-xl transition-all duration-200 ${
          isDark
            ? 'bg-[#0b0f19]/95 border-slate-800/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
            : 'bg-white border-slate-200/90 shadow-xs'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Quick Counter Badges */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_16px_rgba(16,185,129,0.35)] shrink-0">
              <Kanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  CAREER PIPELINE
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {kanbanData.total_count || 0} TOTAL
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                  {kanbanData.stats?.active || 0} AKTIF
                </span>
                {(kanbanData.stats?.offering || 0) > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🎉 {kanbanData.stats.offering} OFFERING
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'id' ? 'Pelacakan siklus lamaran, tes koding, dan wawancara.' : 'Track application stages, code tests, and interview schedules.'}
              </p>
            </div>
          </div>

          {/* Controls: Search, View Switcher & Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari perusahaan / posisi..."
                className={`w-full pl-8 pr-7 py-1.5 rounded-xl border text-xs font-mono outline-hidden transition-all ${
                  isDark
                    ? 'bg-slate-900/90 border-slate-800 text-slate-200 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-emerald-500'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* View Mode Toggle: Board vs Table */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setViewMode('board');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'board'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Board</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setViewMode('table');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel / List</span>
              </button>
            </div>

            {/* Link to Radar Loker */}
            {onNavigate && (
              <button
                onClick={() => {
                  playClickSound();
                  onNavigate('jobs');
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                }`}
                title="Buka Saran Lowongan Sentinel"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden md:inline">Radar Loker</span>
              </button>
            )}

            {/* Add Application Button */}
            <button
              onClick={() => handleOpenAdd('wishlist')}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Lamaran</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Status Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-inherit overflow-x-auto text-xs font-mono">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          {[
            { id: 'all', label: `Semua (${allJobsFlat.length})` },
            { id: 'active', label: `Aktif Berjalan (${kanbanData.stats?.active || 0})` },
            { id: 'wishlist', label: `Wishlist (${kanbanData.stats?.wishlist || 0})` },
            { id: 'applied', label: `Applied (${kanbanData.stats?.applied || 0})` },
            {
              id: 'interview',
              label: `Tes & Interview (${(kanbanData.stats?.screening || 0) + (kanbanData.stats?.tech_test || 0) + (kanbanData.stats?.interview || 0)})`,
            },
            { id: 'offering', label: `Offering (${kanbanData.stats?.offering || 0})` },
            { id: 'rejected', label: `Closed (${kanbanData.stats?.rejected || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound();
                setActiveStatusTab(tab.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                activeStatusTab === tab.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2A. VIEW MODE: TABLE / LIST VIEW (Clean, Flat, No-Scroll) */}
      {/* ========================================================= */}
      {viewMode === 'table' && (
        <div
          className={`rounded-2xl border overflow-hidden backdrop-blur-md transition-all ${
            isDark ? 'bg-[#0b0f19]/90 border-slate-800/90 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className={`border-b ${isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-100/70 border-slate-200 text-slate-600'}`}>
                  <th className="py-3 px-4 font-semibold">Perusahaan & Role</th>
                  <th className="py-3 px-4 font-semibold">Status Tahapan</th>
                  <th className="py-3 px-4 font-semibold">Lokasi</th>
                  <th className="py-3 px-4 font-semibold">Estimasi Gaji</th>
                  <th className="py-3 px-4 font-semibold">Jadwal / Deadline</th>
                  <th className="py-3 px-4 font-semibold">Tanggal Submit</th>
                  <th className="py-3 px-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {filteredFlatJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Tidak ada lamaran yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredFlatJobs.map((job) => {
                    const statusObj = getStatusBadge(job.status);
                    return (
                      <tr
                        key={job.id}
                        className={`transition-colors ${
                          isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Company & Role */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-bold text-slate-200 text-sm">{job.role}</div>
                          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>{job.company}</span>
                            {job.job_url && (
                              <a
                                href={job.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 ml-1"
                                title="Buka tautan loker"
                              >
                                <ExternalLink className="w-3 h-3 inline" />
                              </a>
                            )}
                          </div>
                          {job.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1 max-w-sm line-clamp-1">
                              "{job.notes}"
                            </p>
                          )}
                        </td>

                        {/* Interactive Status Selector */}
                        <td className="py-3.5 px-4">
                          <select
                            value={job.status}
                            onChange={(e) => handleMoveStatus(job.id, e.target.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border outline-hidden cursor-pointer transition-all ${
                              statusObj.badge
                            } ${isDark ? 'bg-slate-900' : 'bg-white'}`}
                          >
                            {columnsConfig.map((col) => (
                              <option key={col.id} value={col.id} className="bg-slate-900 text-slate-200 font-sans">
                                {col.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{job.location || '-'}</span>
                          </div>
                        </td>

                        {/* Salary */}
                        <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                          {job.salary || '-'}
                        </td>

                        {/* Next Schedule */}
                        <td className="py-3.5 px-4 font-mono">
                          {job.next_schedule ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                              {job.next_schedule}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Applied Date */}
                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {job.applied_date || 'Belum'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(job)}
                              className="p-1.5 rounded-lg border border-slate-700/80 hover:border-slate-600 text-slate-300 hover:text-white cursor-pointer"
                              title="Edit lamaran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {deleteConfirmId === job.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                >
                                  Hapus
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-[10px] text-slate-400 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(job.id)}
                                className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-500/40 text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="Hapus lamaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2B. VIEW MODE: BOARD VIEW (Sleek, Compact Columns)        */}
      {/* ========================================================= */}
      {viewMode === 'board' && (
        <div className="w-full overflow-x-auto pb-4 pt-1">
          <div className="flex gap-3.5 min-w-[1550px] items-start">
            {columnsConfig
              .filter((c) => {
                if (activeStatusTab === 'all') return true;
                if (activeStatusTab === 'active') return c.id !== 'rejected' && c.id !== 'offering';
                if (activeStatusTab === 'interview') return ['screening', 'tech_test', 'interview'].includes(c.id);
                return c.id === activeStatusTab;
              })
              .map((col) => {
                const rawJobs = kanbanData?.columns?.[col.id] || [];
                const jobs = rawJobs.filter((j) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (j.company && j.company.toLowerCase().includes(q)) ||
                    (j.role && j.role.toLowerCase().includes(q)) ||
                    (j.location && j.location.toLowerCase().includes(q)) ||
                    (j.notes && j.notes.toLowerCase().includes(q))
                  );
                });

                return (
                  <div
                    key={col.id}
                    className={`flex-1 min-w-[240px] max-w-[270px] rounded-2xl border flex flex-col transition-all backdrop-blur-md shadow-xs ${
                      isDark ? 'bg-[#0a0e17]/90 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {/* Compact Column Header */}
                    <div className={`px-3.5 py-2.5 border-b flex items-center justify-between ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                        <h2 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                          {col.label}
                        </h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold border ${col.badge}`}>
                          {jobs.length}
                        </span>
                        <button
                          onClick={() => handleOpenAdd(col.id)}
                          className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                          title={`Tambah di ${col.label}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Column Content */}
                    <div className="p-2.5 space-y-2.5 max-h-[680px] overflow-y-auto">
                      {jobs.length === 0 ? (
                        <div className="py-6 text-center text-[11px] font-mono border border-dashed rounded-xl border-slate-800 text-slate-600">
                          0 Lamaran
                        </div>
                      ) : (
                        jobs.map((job) => (
                          <div
                            key={job.id}
                            className={`p-3 rounded-xl border relative transition-all duration-150 hover:-translate-y-0.5 ${
                              isDark
                                ? 'bg-[#111726]/95 border-slate-800/90 hover:border-slate-700 shadow-xs hover:shadow-md'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                            }`}
                          >
                            {/* Role & Company */}
                            <div className="font-sans">
                              <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider block truncate">
                                {job.company}
                              </span>
                              <h3 className={`text-xs font-bold mt-0.5 line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {job.role}
                              </h3>
                            </div>

                            {/* Location & Salary */}
                            {(job.location || job.salary) && (
                              <div className="mt-2 space-y-0.5 text-[10px] font-mono">
                                {job.location && (
                                  <div className="flex items-center gap-1 text-slate-400 truncate">
                                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                    <span className="truncate">{job.location}</span>
                                  </div>
                                )}
                                {job.salary && (
                                  <div className="flex items-center gap-1 text-emerald-400 font-semibold truncate">
                                    <DollarSign className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="truncate">{job.salary}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Schedule Alert */}
                            {job.next_schedule && (
                              <div className="mt-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-amber-400 shrink-0" />
                                <span className="truncate font-semibold">{job.next_schedule}</span>
                              </div>
                            )}

                            {/* Card Footer Actions */}
                            <div className="mt-2.5 pt-2 border-t border-inherit flex items-center justify-between">
                              {/* Move Left / Right */}
                              <div className="flex items-center gap-0.5">
                                {col.id !== 'wishlist' && (
                                  <button
                                    onClick={() => {
                                      const idx = columnsConfig.findIndex((c) => c.id === col.id);
                                      if (idx > 0) handleMoveStatus(job.id, columnsConfig[idx - 1].id);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
                                    title="Pindah ke tahap sebelumnya"
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </button>
                                )}

                                {col.id !== 'rejected' && col.id !== 'offering' && (
                                  <button
                                    onClick={() => {
                                      const idx = columnsConfig.findIndex((c) => c.id === col.id);
                                      if (idx < columnsConfig.length - 1) handleMoveStatus(job.id, columnsConfig[idx + 1].id);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[9px] font-mono font-semibold flex items-center gap-0.5 cursor-pointer"
                                    title="Lanjut ke tahap berikutnya"
                                  >
                                    <span>Lanjut</span>
                                    <ChevronRight className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>

                              {/* Edit & Delete */}
                              <div className="flex items-center gap-1">
                                {job.job_url && (
                                  <a
                                    href={job.job_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 text-indigo-400 hover:text-indigo-300 cursor-pointer"
                                    title="Buka URL lowongan"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleOpenEdit(job)}
                                  className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                                  title="Edit lamaran"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteJob(job.id)}
                                  className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                  title="Hapus lamaran"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL: ADD / EDIT JOB APPLICATION                      */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative transition-all ${
              isDark ? 'bg-[#0f1422] border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <div className="flex items-center space-x-2">
                <Kanban className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">
                  {isEditing ? 'Edit Informasi Lamaran' : 'Catat Lamaran Kerja Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 mt-4 text-xs font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Perusahaan (Company) *</label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Contoh: Majura.ai, Proxify"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Posisi / Role *</label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Contoh: Senior Golang Engineer"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Lokasi</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Remote / Surabaya / Jakarta"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Estimasi Gaji / Rate</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="Contoh: $4,500/mo atau 20jt"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">URL Lowongan Kerja</label>
                <input
                  type="url"
                  value={formData.job_url}
                  onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Status Kolom</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {columnsConfig.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tanggal Submit</label>
                  <input
                    type="date"
                    value={formData.applied_date}
                    onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Jadwal Berikutnya</label>
                  <input
                    type="text"
                    value={formData.next_schedule}
                    onChange={(e) => setFormData({ ...formData, next_schedule: e.target.value })}
                    placeholder="Contoh: Interview 3 Okt"
                    className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Catatan Wawancara / Review</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Catatan recruiter, pertanyaan wawancara, target teknis..."
                  className={`w-full px-3 py-2 rounded-xl border outline-hidden ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-inherit flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Catat Lamaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
