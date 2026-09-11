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
  FileText
} from 'lucide-react';
import Sortable from 'sortablejs';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export function JobsView({ jobsData, onRefresh }) {
  const { t } = useLanguage();
  const [activeMobileCol, setActiveMobileCol] = useState('applied');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [location, setLocation] = useState('Surabaya / Remote');
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
                placeholder="Surabaya / Remote"
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
