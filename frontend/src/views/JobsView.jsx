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

const JOB_COLUMNS = [
  { id: 'wishlist', label: 'Wishlist', color: 'border-zinc-800 bg-[#121215]' },
  { id: 'applied', label: 'Applied', color: 'border-zinc-800 bg-[#121215]' },
  { id: 'screening', label: 'Screening HR', color: 'border-zinc-800 bg-[#121215]' },
  { id: 'tech_test', label: 'Tech Test', color: 'border-zinc-800 bg-[#121215]' },
  { id: 'interview', label: 'Interview', color: 'border-zinc-800 bg-[#121215]' },
  { id: 'offering', label: 'Offering', color: 'border-zinc-800 bg-[#121215]' },
  { id: 'rejected', label: 'Rejected', color: 'border-zinc-800 bg-[#121215]' },
];

export function JobsView({ jobsData, onRefresh }) {
  const [activeMobileCol, setActiveMobileCol] = useState('applied');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialColForAdd, setInitialColForAdd] = useState('wishlist');
  const { showToast } = useToast();
  const columnsRef = useRef({});

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
              showToast(`Status lamaran dipindahkan ke "${targetStatus}".`, 'success', 'Karir Diperbarui');
              if (onRefresh) onRefresh();
            } catch {
              showToast('Gagal memindahkan status lamaran.', 'error', 'Error');
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
  }, [jobsData, onRefresh, showToast]);

  const handleDelete = async (jobId, company) => {
    if (!confirm(`Hapus lamaran di ${company}?`)) return;
    try {
      await api.deleteJob(jobId);
      showToast('Lamaran berhasil dihapus.', 'info', 'Dihapus');
      if (onRefresh) onRefresh();
    } catch {
      showToast('Gagal menghapus lamaran.', 'error', 'Error');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] p-4 rounded-xl border border-zinc-800">
        <div>
          <h3 className="font-semibold text-zinc-100 text-base">Pelacak Peluang Karir</h3>
          <p className="text-xs text-zinc-400">Pantau proses lamaran kerja, jadwal interview, dan status penawaran.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setInitialColForAdd('wishlist');
            setIsModalOpen(true);
          }}
          className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Peluang</span>
        </button>
      </div>

      {/* Mobile Column Tab */}
      <div className="sm:hidden flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1">
        {JOB_COLUMNS.map((col) => {
          const count = (columns[col.id] || []).length;
          const isActive = activeMobileCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileCol(col.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 ${
                isActive ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'bg-zinc-950 text-zinc-400 border border-zinc-800'
              }`}
            >
              <span>{col.label.split(' ')[0]}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-900 text-zinc-400 font-mono">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
        {JOB_COLUMNS.map((col) => {
          const colJobs = columns[col.id] || [];
          const isHiddenOnMobile = activeMobileCol !== col.id;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl bg-[#121215] border border-zinc-800 p-3 space-y-3 min-h-[480px] ${
                isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <span className="font-semibold text-zinc-200 text-xs truncate">{col.label}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-zinc-950 text-zinc-400 font-mono text-[10px] font-semibold border border-zinc-800">
                  {colJobs.length}
                </span>
              </div>

              {/* Cards Dropzone */}
              <div
                ref={(el) => (columnsRef.current[col.id] = el)}
                data-status={col.id}
                className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar min-h-[200px]"
              >
                {colJobs.map((job) => (
                  <div
                    key={job.id}
                    data-job-id={job.id}
                    className="job-card group relative p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing shadow-sm space-y-2"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <h5 className="font-medium text-zinc-100 text-xs leading-snug">{job.role}</h5>
                        <p className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-zinc-400" />
                          <span>{job.company}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(job.id, job.company);
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{job.location || 'Remote'}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5 text-zinc-400" />
                        <span>{job.salary || 'Kompetitif'}</span>
                      </span>
                    </div>

                    {job.next_schedule && (
                      <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span className="truncate">{job.next_schedule}</span>
                      </div>
                    )}

                    {job.job_url && (
                      <a
                        href={job.job_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 hover:underline flex items-center gap-1 font-mono pt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Link Lowongan</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={() => {
                  setInitialColForAdd(col.id);
                  setIsModalOpen(true);
                }}
                className="w-full py-1.5 rounded-lg bg-zinc-950/40 hover:bg-zinc-950/80 border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[11px] font-medium transition-all flex items-center justify-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <JobModal
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

function JobModal({ isOpen, initialStatus = 'wishlist', onClose, onSuccess }) {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Remote');
  const [salary, setSalary] = useState('Kompetitif');
  const [status, setStatus] = useState(initialStatus);
  const [nextSchedule, setNextSchedule] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setLoading(true);
    try {
      await api.createJob({
        company,
        role,
        location,
        salary,
        status,
        next_schedule: nextSchedule,
        job_url: jobUrl,
        notes,
      });
      showToast('Peluang karir berhasil dicatat!', 'success', 'Tersimpan');
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan lamaran.', 'error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-100 text-base">Tambah Peluang Karir</h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Nama Perusahaan</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Google / PT Wowrack"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Posisi / Role</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="DevOps / Cloud Engineer"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Lokasi / Tipe</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Remote / Surabaya"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Ekspektasi Gaji</label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="IDR 15jt - 25jt / USD"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Status Tahapan</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="wishlist">Wishlist</option>
                <option value="applied">Applied</option>
                <option value="screening">Screening HR</option>
                <option value="tech_test">Tech Test</option>
                <option value="interview">Interview</option>
                <option value="offering">Offering</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Jadwal Agenda</label>
              <input
                type="text"
                value={nextSchedule}
                onChange={(e) => setNextSchedule(e.target.value)}
                placeholder="User Interview (15 Sep)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Link Lowongan (URL)</label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://linkedin.com/jobs/..."
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Peluang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
