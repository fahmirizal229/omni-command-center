import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Calendar,
  Trash2,
  Edit2,
  X,
  FileText,
  Search,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
  Clock
} from 'lucide-react';
import Sortable from 'sortablejs';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export function JobsView({ jobsData, onRefresh }) {
  const { t } = useLanguage();
  const [activeMobileCol, setActiveMobileCol] = useState('applied');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [initialColForAdd, setInitialColForAdd] = useState('wishlist');
  const { showToast } = useToast();
  const columnsRef = useRef({});

  const JOB_COLUMNS = [
    { id: 'wishlist', label: t('jobs_col_wishlist', 'Wishlist'), color: 'border-zinc-800 bg-[#121215]' },
    { id: 'applied', label: t('jobs_col_applied', 'Applied'), color: 'border-zinc-800 bg-[#121215]' },
    { id: 'screening', label: t('jobs_col_screening', 'Screening HR'), color: 'border-zinc-800 bg-[#121215]' },
    { id: 'tech_test', label: t('jobs_col_tech_test', 'Tech Test'), color: 'border-zinc-800 bg-[#121215]' },
    { id: 'interview', label: t('jobs_col_interview', 'Interview'), color: 'border-zinc-800 bg-[#121215]' },
    { id: 'offering', label: t('jobs_col_offering', 'Offering'), color: 'border-zinc-800 bg-[#121215]' },
    { id: 'rejected', label: t('jobs_col_rejected', 'Rejected'), color: 'border-zinc-800 bg-[#121215]' },
  ];

  const columns = jobsData?.columns || {
    wishlist: [],
    applied: [],
    screening: [],
    tech_test: [],
    interview: [],
    offering: [],
    rejected: [],
  };

  useEffect(() => {
    const sortables = [];

    JOB_COLUMNS.forEach((col) => {
      const el = columnsRef.current[col.id];
      if (el) {
        const s = new Sortable(el, {
          group: 'career-jobs-kanban',
          animation: 180,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          handle: '.job-card',
          fallbackTolerance: 3,
          onEnd: async (evt) => {
            const jobId = evt.item.getAttribute('data-job-id');
            const targetStatus = evt.to.getAttribute('data-status');
            const sourceStatus = evt.from.getAttribute('data-status');

            if (!jobId || targetStatus === sourceStatus) return;

            try {
              await api.updateJobStatus(jobId, { status: targetStatus });
              showToast(t('jobs_status_updated', `Status lamaran dipindahkan ke "${targetStatus}".`), 'success', t('jobs_title', 'Karir Diperbarui'));
              if (onRefresh) onRefresh();
            } catch {
              showToast(t('jobs_error_update', 'Gagal memindahkan status lamaran.'), 'error', 'Error');
              if (onRefresh) onRefresh();
            }
          },
        });
        sortables.push(s);
      }
    });

    return () => {
      sortables.forEach((s) => s.destroy());
    };
  }, [jobsData, onRefresh, showToast, t]);

  const handleDelete = async (jobId, company) => {
    if (!confirm(t('confirm_delete_title', `Hapus lamaran di ${company}?`))) return;
    try {
      await api.deleteJob(jobId);
      showToast(t('jobs_deleted_msg', 'Lamaran berhasil dihapus.'), 'info', t('delete', 'Dihapus'));
      if (onRefresh) onRefresh();
    } catch {
      showToast(t('jobs_error_delete', 'Gagal menghapus lamaran.'), 'error', 'Error');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] p-4 rounded-xl border border-zinc-800">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
            <Briefcase className="w-5 h-5 text-zinc-300" />
            <span>{t('jobs_title', 'Pelacak Lamaran Kerja & Karir')}</span>
          </h2>
          <p className="text-xs text-zinc-400">
            {t('jobs_subtitle', 'Pantau pipeline lamaran kerja, tahapan seleksi, dan jadwal interview secara terstruktur.')}
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/60 text-indigo-200 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cari Lowongan Live (AI Match)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInitialColForAdd('wishlist');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-all shadow-sm flex items-center justify-center space-x-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('jobs_new_btn', 'Tambah Lamaran')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher */}
      <div className="lg:hidden flex items-center space-x-1 bg-[#121215] p-1.5 rounded-lg border border-zinc-800 overflow-x-auto">
        {JOB_COLUMNS.map((col) => {
          const count = columns[col.id]?.length || 0;
          const isActive = activeMobileCol === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setActiveMobileCol(col.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0 ${
                isActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span>{col.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-900 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-start">
        {JOB_COLUMNS.map((col) => {
          const list = columns[col.id] || [];
          const isMobileActive = activeMobileCol === col.id;

          return (
            <div
              key={col.id}
              className={`rounded-xl bg-[#121215] border border-zinc-800 p-3 flex flex-col min-h-[500px] ${
                isMobileActive ? 'block' : 'hidden lg:flex'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-zinc-800/80 px-1">
                <h4 className="font-semibold text-zinc-200 text-xs truncate max-w-[110px]">
                  {col.label}
                </h4>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {list.length}
                </span>
              </div>

              {/* Dropzone */}
              <div
                ref={(el) => (columnsRef.current[col.id] = el)}
                data-status={col.id}
                className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-0.5 min-h-[120px]"
              >
                {list.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-center p-2 border border-dashed border-zinc-800/60 rounded-lg text-zinc-600 text-[11px]">
                    <span>{t('jobs_empty_column', 'Kosong')}</span>
                  </div>
                ) : (
                  list.map((job) => (
                    <div
                      key={job.id}
                      data-job-id={job.id}
                      className="job-card group relative rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3.5 transition-all shadow-sm cursor-grab active:cursor-grabbing space-y-2"
                    >
                      {/* Company & Role */}
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <h5 className="font-bold text-zinc-100 text-xs flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{job.company}</span>
                          </h5>
                          <p className="text-[11px] text-zinc-300 font-medium mt-0.5">
                            {job.role}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDelete(job.id, job.company)}
                          className="p-1 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Location & Salary */}
                      <div className="space-y-1 text-[10px] text-zinc-400">
                        {job.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        )}
                        {job.salary && (
                          <div className="flex items-center space-x-1 text-emerald-400 font-mono">
                            <DollarSign className="w-2.5 h-2.5 shrink-0" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                      </div>

                      {/* Next Schedule / Notes */}
                      {job.next_schedule && (
                        <div className="p-1.5 rounded bg-zinc-900/80 border border-zinc-800 text-[10px] text-amber-300 flex items-center space-x-1 font-mono">
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{job.next_schedule}</span>
                        </div>
                      )}

                      {/* Notes snippet */}
                      {job.notes && (
                        <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">
                          {job.notes}
                        </p>
                      )}

                      {/* Footer URL Link */}
                      {job.job_url && (
                        <div className="pt-1 border-t border-zinc-900 flex justify-end">
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center space-x-1"
                          >
                            <span>Link Job</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Quick Add */}
              <button
                type="button"
                onClick={() => {
                  setInitialColForAdd(col.id);
                  setIsModalOpen(true);
                }}
                className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all flex items-center justify-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>{t('create', 'Tambah')}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Live Job Search & AI Match Modal */}
      {isSearchModalOpen && (
        <LiveJobSearchModal
          onClose={() => setIsSearchModalOpen(false)}
          onAddJob={async (jobData) => {
            try {
              await api.createJob(jobData);
              showToast(`Lamaran untuk ${jobData.company} (${jobData.status}) berhasil ditambahkan!`, 'success', 'Karir Diperbarui');
              if (onRefresh) onRefresh();
            } catch (err) {
              showToast(err.message || 'Gagal menambahkan lamaran.', 'error', 'Error');
            }
          }}
        />
      )}

      {/* Add Job Modal */}
      {isModalOpen && (
        <JobFormModal
          isOpen={isModalOpen}
          initialStatus={initialColForAdd}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

function JobFormModal({ isOpen, initialStatus = 'wishlist', onClose, onSuccess }) {
  const { t } = useLanguage();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Jawa / Remote');
  const [salary, setSalary] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [nextSchedule, setNextSchedule] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setLoading(true);
    const payload = {
      company,
      role,
      location,
      salary,
      job_url: jobUrl,
      status,
      next_schedule: nextSchedule,
      notes,
    };

    try {
      await api.createJob(payload);
      showToast(t('jobs_created_msg', `Lamaran untuk ${company} berhasil ditambahkan!`), 'success', t('create', 'Lamaran Ditambahkan'));
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan lamaran.', 'error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-100 text-base">
            {t('jobs_new_btn', 'Tambah Lamaran Baru')}
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_company', 'Nama Perusahaan')} *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Google / Tokopedia"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_role', 'Posisi / Role')} *</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Backend Engineer"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_location', 'Lokasi')}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Jawa / Remote"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_salary', 'Estimasi Gaji')}</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="IDR 15jt - 25jt"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('status', 'Tahap Pipeline')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="wishlist">{t('jobs_col_wishlist', 'Wishlist')}</option>
                <option value="applied">{t('jobs_col_applied', 'Applied')}</option>
                <option value="screening">{t('jobs_col_screening', 'Screening HR')}</option>
                <option value="tech_test">{t('jobs_col_tech_test', 'Tech Test')}</option>
                <option value="interview">{t('jobs_col_interview', 'Interview')}</option>
                <option value="offering">{t('jobs_col_offering', 'Offering')}</option>
                <option value="rejected">{t('jobs_col_rejected', 'Rejected')}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_next_schedule', 'Jadwal Berikutnya')}</label>
              <input
                type="text"
                value={nextSchedule}
                onChange={(e) => setNextSchedule(e.target.value)}
                placeholder="Senin, 14:00 WIB"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_url', 'Link Lowongan')}</label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/..."
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">{t('jobs_form_notes', 'Catatan Interview / Follow-up')}</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Fokus pertanyaan tentang arsitektur microservices dan DB..."
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
            >
              {t('cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? t('loading', 'Menyimpan...') : t('create', 'Tambah Lamaran')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LiveJobSearchModal({ onClose, onAddJob }) {
  const [query, setQuery] = useState('backend');
  const [jobType, setJobType] = useState('remote'); // 'remote' | 'local'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [analyzingJob, setAnalyzingJob] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setPage(1);
    handleSearch(query, 1);
  }, [jobType]);

  const handleSearch = async (customQ, customPage) => {
    const q = customQ !== undefined ? customQ : query;
    const targetPage = customPage !== undefined ? customPage : page;
    setLoading(true);
    setAnalyzingJob(null);
    setAnalysisResult(null);
    try {
      const res = await api.searchLiveJobs(q || 'backend', jobType, 'Jawa / Indonesia', 12, targetPage);
      const fetchedJobs = res.jobs || [];
      setResults(fetchedJobs);
      setPage(res.page || targetPage);
      setTotalCount(res.count || fetchedJobs.length);
      setHasMore(res.has_more ?? (fetchedJobs.length >= 12));
    } catch (err) {
      setResults([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || loading) return;
    setPage(newPage);
    handleSearch(query, newPage);
  };

  const handleAnalyzeMatch = async (job) => {
    setAnalyzingJob(job);
    setAnalyzing(true);
    setAnalysisResult(null);
    const roleTitle = job.title || job.role || 'Backend Engineer';
    try {
      const res = await api.analyzeJobMatch({
        role: roleTitle,
        job_description: job.description_snippet || job.snippet || roleTitle,
        tech_stack: job.tags || []
      });
      setAnalysisResult(res.analysis);
    } catch (err) {
      setAnalysisResult({ error: 'Gagal menganalisis kecocokan CV.' });
    } finally {
      setAnalyzing(false);
    }
  };

  const QUICK_KEYWORDS = ['Golang Backend', 'PHP Laravel', 'Node.js TypeScript', 'Python FastAPI', 'Microservices'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="max-w-4xl w-full bg-[#121215] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="font-bold text-zinc-100 text-base flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Cari Lowongan Kerja Live & Analisis Kecocokan CV</span>
            </h3>
            <p className="text-[11px] text-zinc-400">
              Cari lowongan real-time (LinkedIn Jobs, Glints, Remotive, RemoteOK) di seluruh Jawa / Indonesia & Global Remote USD.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Controls Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5 items-center">
            {/* Type selector */}
            <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 shrink-0">
              <button
                type="button"
                onClick={() => setJobType('remote')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  jobType === 'remote' ? 'bg-indigo-950 border border-indigo-700/60 text-indigo-200' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Global Remote (USD)
              </button>
              <button
                type="button"
                onClick={() => setJobType('local')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  jobType === 'local' ? 'bg-indigo-950 border border-indigo-700/60 text-indigo-200' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Indonesia / Seluruh Jawa
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    handleSearch(query, 1);
                  }
                }}
                placeholder="Cari posisi (misal: Go, PHP, Laravel, Node.js, Cloud)..."
                className="w-full pl-9 pr-24 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  handleSearch(query, 1);
                }}
                disabled={loading}
                className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? 'Mencari...' : 'Cari'}
              </button>
            </div>
          </div>

          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Cepat:</span>
            {QUICK_KEYWORDS.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  setQuery(kw);
                  setPage(1);
                  handleSearch(kw, 1);
                }}
                className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-300 font-mono transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center text-xs text-zinc-500 space-y-2">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
              <p>Mencari lowongan live dan menganalisis kecocokan skill...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
              Tidak ada lowongan ditemukan untuk kata kunci "{query}".
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {results.map((job, idx) => {
                const isSelected = analyzingJob?.url === job.url;
                const matchScore = job.match_score || 80;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-4 space-y-3 transition-all ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-700/60 ring-1 ring-indigo-700/50'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-zinc-100 text-sm">
                            {job.title || job.role}
                          </h4>
                          {/* Match Score Badge */}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            matchScore >= 85
                              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                              : 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                          }`}>
                            {matchScore}% Match
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                            {job.platform || job.source || 'Aggregator'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                          <span className="flex items-center space-x-1 font-medium text-zinc-300">
                            <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{job.company}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{job.location}</span>
                          </span>
                          {job.salary && (
                            <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{job.salary}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0 pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleAnalyzeMatch(job)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-xs font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span>AI Match</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAddJob({
                              company: job.company,
                              role: job.title || job.role,
                              location: job.location,
                              salary: job.salary || '',
                              job_url: job.url || '',
                              status: 'wishlist',
                              notes: `Match score: ${matchScore}%. Source: ${job.platform || job.source || 'Aggregator'}`
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                        >
                          + Wishlist
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAddJob({
                              company: job.company,
                              role: job.title || job.role,
                              location: job.location,
                              salary: job.salary || '',
                              job_url: job.url || '',
                              status: 'applied',
                              notes: `Match score: ${matchScore}%. Source: ${job.platform || job.source || 'Aggregator'}`
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-colors shadow-sm"
                        >
                          + Applied
                        </button>
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Matched Tags */}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.tags.map((t, idx2) => (
                          <span
                            key={idx2}
                            className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Match Analysis Drawer / Card */}
                    {isSelected && (
                      <div className="p-4 rounded-xl bg-[#121215] border border-indigo-800/60 space-y-3.5 animate-fadeIn mt-3">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="font-bold text-zinc-100 text-xs">
                              Hasil Analisis CV vs Job Desk ({job.company})
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">Arusuka Career AI</span>
                        </div>

                        {analyzing ? (
                          <div className="py-6 text-center text-xs text-zinc-400">
                            Mencocokkan pengalaman Cloudraya V2, Suramadu IoT, dan tech stack...
                          </div>
                        ) : analysisResult?.error ? (
                          <div className="text-red-400 text-xs">{analysisResult.error}</div>
                        ) : analysisResult ? (
                          <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                              <span className="text-zinc-400 font-medium">Skor Kesesuaian Profil:</span>
                              <span className="text-emerald-400 font-bold font-mono text-sm">
                                {analysisResult.match_score || matchScore}%
                              </span>
                            </div>

                            {/* Matched Skills */}
                            {analysisResult.matched_skills?.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold text-zinc-400">Skill yang Cocok dengan Pengalamanmu:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {analysisResult.matched_skills.map((s, idx3) => (
                                    <span key={idx3} className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-[10px] font-mono">
                                      ✓ {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Relevant Projects */}
                            {(analysisResult.relevant_projects?.length > 0) && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold text-zinc-400">Bukti Proyek Nyata yang Relevan:</p>
                                <div className="space-y-1.5">
                                  {analysisResult.relevant_projects.map((p, idx4) => (
                                    <div key={idx4} className="p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-300">
                                      <p className="font-semibold text-indigo-300">{p.company_project || p.title}</p>
                                      <p className="text-zinc-400 mt-0.5">{p.evidence || p.proof || (typeof p === 'string' ? p : '')}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tailored CV Bullets */}
                            {((analysisResult.tailored_cv_bullets || analysisResult.cv_bullet_points)?.length > 0) && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold text-zinc-400">Poin CV yang Direkomendasikan:</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px] bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                  {(analysisResult.tailored_cv_bullets || analysisResult.cv_bullet_points).map((b, idx5) => (
                                    <li key={idx5} className="leading-relaxed">{b}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Interview Talking Points */}
                            {((analysisResult.interview_talking_points || analysisResult.interview_tips)?.length > 0) && (
                              <div className="space-y-1">
                                <p className="text-[11px] font-semibold text-zinc-400">Tips Jawaban Interview:</p>
                                <ul className="list-disc list-inside space-y-1 text-zinc-300 text-[11px] bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                                  {(analysisResult.interview_talking_points || analysisResult.interview_tips).map((tip, idx6) => (
                                    <li key={idx6} className="leading-relaxed">{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer with Pagination */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="flex items-center space-x-2">
            <span>Ditemukan {results.length} lowongan pada halaman {page}</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Pagination buttons */}
            <div className="flex items-center space-x-1 mr-2">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || loading}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 text-zinc-300 flex items-center space-x-1 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              <span className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs">
                Hal {page}
              </span>

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={!hasMore || loading}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed border border-zinc-800 text-zinc-300 flex items-center space-x-1 transition-colors"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
