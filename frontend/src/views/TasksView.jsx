import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lightbulb,
  PauseCircle,
  Circle,
  Edit2,
  Trash2,
  Calendar,
  Tag,
  Flame,
  Zap,
  MoreVertical,
  X
} from 'lucide-react';
import Sortable from 'sortablejs';
import { api } from '../api';
import { useToast } from '../context/ToastContext';

const TASK_COLUMNS = [
  { id: 'backlog', label: 'Backlog / Ide', icon: Lightbulb, color: 'border-zinc-800 bg-[#121215] text-zinc-400' },
  { id: 'todo', label: 'To Do', icon: Circle, color: 'border-zinc-800 bg-[#121215] text-zinc-300' },
  { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'border-zinc-800 bg-[#121215] text-zinc-200' },
  { id: 'review', label: 'Review / Hold', icon: PauseCircle, color: 'border-zinc-800 bg-[#121215] text-zinc-400' },
  { id: 'done', label: 'Selesai', icon: CheckCircle2, color: 'border-zinc-800 bg-[#121215] text-emerald-400' },
];

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: Flame },
  high: { label: 'High', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Zap },
  medium: { label: 'Medium', badge: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: Circle },
  low: { label: 'Low', badge: 'bg-zinc-900 text-zinc-400 border-zinc-800', icon: Circle },
};

export function TasksView({ tasksData, onRefresh }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMobileCol, setActiveMobileCol] = useState('todo');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialStatusForCreate, setInitialStatusForCreate] = useState('todo');
  const [editingTask, setEditingTask] = useState(null);
  const { showToast } = useToast();

  const columnsRef = useRef({});

  const columns = tasksData?.columns || {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };

  const categories = tasksData?.categories || ['Personal', 'Dev & Server', 'Career', 'Learning'];

  // Initialize SortableJS for each column
  useEffect(() => {
    const sortables = [];

    TASK_COLUMNS.forEach((col) => {
      const el = columnsRef.current[col.id];
      if (el) {
        const sortableInstance = new Sortable(el, {
          group: 'personal-tasks-kanban',
          animation: 180,
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          handle: '.task-card',
          fallbackTolerance: 3,
          onEnd: async (evt) => {
            const taskId = evt.item.getAttribute('data-task-id');
            const targetStatus = evt.to.getAttribute('data-status');
            const sourceStatus = evt.from.getAttribute('data-status');

            if (!taskId || targetStatus === sourceStatus) return;

            try {
              await api.updateTask(taskId, { status: targetStatus });
              showToast(`Status tugas dipindahkan ke "${targetStatus}".`, 'success', 'Tugas Diperbarui');
              if (onRefresh) onRefresh();
            } catch (err) {
              showToast('Gagal memindahkan status tugas.', 'error', 'Error');
              if (onRefresh) onRefresh();
            }
          },
        });
        sortables.push(sortableInstance);
      }
    });

    return () => {
      sortables.forEach((s) => s.destroy());
    };
  }, [tasksData, onRefresh, showToast]);

  const handleDeleteTask = async (taskId, title) => {
    if (!confirm(`Hapus tugas "${title}"?`)) return;
    try {
      await api.deleteTask(taskId);
      showToast('Tugas berhasil dihapus.', 'info', 'Tugas Dihapus');
      if (onRefresh) onRefresh();
    } catch {
      showToast('Gagal menghapus tugas.', 'error', 'Error');
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Controls: Category Tabs & New Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] p-4 rounded-xl border border-zinc-800">
        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Add Task Button */}
        <button
          type="button"
          onClick={() => {
            setInitialStatusForCreate('todo');
            setIsCreateModalOpen(true);
          }}
          className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-lg transition-all flex items-center justify-center space-x-1.5 shrink-0 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tugas</span>
        </button>
      </div>

      {/* Mobile Column Switcher Tab */}
      <div className="sm:hidden flex items-center space-x-1 overflow-x-auto custom-scrollbar pb-1">
        {TASK_COLUMNS.map((col) => {
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

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {TASK_COLUMNS.map((col) => {
          const colTasks = (columns[col.id] || []).filter((task) => {
            if (selectedCategory === 'all') return true;
            return task.category === selectedCategory;
          });

          const IconComponent = col.icon;
          const isHiddenOnMobile = activeMobileCol !== col.id;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl bg-[#121215] border border-zinc-800 p-3.5 space-y-3 min-h-[500px] ${
                isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
                <div className="flex items-center space-x-2">
                  <IconComponent className="w-3.5 h-3.5 text-zinc-400" />
                  <h4 className="font-semibold text-zinc-200 text-xs tracking-tight">{col.label}</h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-400 font-mono text-[11px] font-semibold border border-zinc-800">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Dropzone */}
              <div
                ref={(el) => (columnsRef.current[col.id] = el)}
                data-status={col.id}
                className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar min-h-[200px]"
              >
                {colTasks.map((task) => {
                  const prio = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                  const PrioIcon = prio.icon;

                  return (
                    <div
                      key={task.id}
                      data-task-id={task.id}
                      className="task-card group relative p-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm space-y-2.5"
                    >
                      {/* Card Header & Priority */}
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wider border flex items-center gap-1 ${prio.badge}`}
                        >
                          <PrioIcon className="w-2.5 h-2.5" />
                          <span>{prio.label}</span>
                        </span>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                            }}
                            className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id, task.title);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Title & Description */}
                      <div>
                        <h5 className="font-medium text-zinc-100 text-xs leading-snug">{task.title}</h5>
                        {task.description && (
                          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Card Footer: Category & Due Date */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-900 text-[10px] text-zinc-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                          {task.category || 'Personal'}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span>{task.due_date}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Task Quick Button per Column */}
              <button
                type="button"
                onClick={() => {
                  setInitialStatusForCreate(col.id);
                  setIsCreateModalOpen(true);
                }}
                className="w-full py-2 rounded-lg bg-zinc-950/40 hover:bg-zinc-950/80 border border-dashed border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-all flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tugas</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <TaskFormModal
          isOpen={isCreateModalOpen}
          initialStatus={initialStatusForCreate}
          categories={categories}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskFormModal
          isOpen={Boolean(editingTask)}
          task={editingTask}
          categories={categories}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            setEditingTask(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}

function TaskFormModal({ isOpen, task, initialStatus = 'todo', categories = [], onClose, onSuccess }) {
  const isEditing = Boolean(task);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || initialStatus);
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [category, setCategory] = useState(task?.category || 'Personal');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    const payload = { title, description, status, priority, category, due_date: dueDate };

    try {
      if (isEditing) {
        await api.updateTask(task.id, payload);
        showToast('Tugas berhasil diperbarui!', 'success', 'Berhasil');
      } else {
        await api.createTask(payload);
        showToast('Tugas baru berhasil ditambahkan!', 'success', 'Tugas Dibuat');
      }
      onSuccess();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan tugas.', 'error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#121215] border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h3 className="font-semibold text-zinc-100 text-base">
            {isEditing ? 'Edit Tugas' : 'Tambah Tugas Baru'}
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">Judul Tugas</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Periksa konfigurasi backup server"
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label className="block font-medium text-zinc-300 mb-1">Deskripsi / Catatan</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail atau catatan tambahan..."
              className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Status Kolom</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="backlog">Backlog / Ide</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review / Hold</option>
                <option value="done">Selesai</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Prioritas</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
                <option value="urgent">Mendesak (Urgent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">Kategori</label>
              <input
                type="text"
                list="category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Personal"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
              <datalist id="category-options">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
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
              {loading ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Buat Tugas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
