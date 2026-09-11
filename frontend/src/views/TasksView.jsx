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
import { useLanguage } from '../context/LanguageContext';

export function TasksView({ tasksData, onRefresh }) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMobileCol, setActiveMobileCol] = useState('todo');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialStatusForCreate, setInitialStatusForCreate] = useState('todo');
  const [editingTask, setEditingTask] = useState(null);
  const { showToast } = useToast();

  const columnsRef = useRef({});

  const TASK_COLUMNS = [
    { id: 'backlog', label: t('tasks_col_backlog', 'Backlog / Ide'), icon: Lightbulb, color: 'border-zinc-800 bg-[#121215] text-zinc-400' },
    { id: 'todo', label: t('tasks_col_todo', 'To Do'), icon: Circle, color: 'border-zinc-800 bg-[#121215] text-zinc-300' },
    { id: 'in_progress', label: t('tasks_col_in_progress', 'In Progress'), icon: Clock, color: 'border-zinc-800 bg-[#121215] text-zinc-200' },
    { id: 'review', label: t('tasks_col_review', 'Review / Hold'), icon: PauseCircle, color: 'border-zinc-800 bg-[#121215] text-zinc-400' },
    { id: 'done', label: t('tasks_col_done', 'Selesai'), icon: CheckCircle2, color: 'border-zinc-800 bg-[#121215] text-emerald-400' },
  ];

  const PRIORITY_CONFIG = {
    urgent: { label: t('tasks_priority_urgent', 'Urgent'), badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: Flame },
    high: { label: t('tasks_priority_high', 'High'), badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Zap },
    medium: { label: t('tasks_priority_medium', 'Medium'), badge: 'bg-zinc-800 text-zinc-300 border-zinc-700', icon: Circle },
    low: { label: t('tasks_priority_low', 'Low'), badge: 'bg-zinc-900 text-zinc-400 border-zinc-800', icon: Circle },
  };

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
              showToast(t('tasks_status_updated', 'Status tugas berhasil diperbarui.'), 'success', t('tasks_updated_title', 'Tugas Diperbarui'));
              if (onRefresh) onRefresh();
            } catch (err) {
              showToast(t('tasks_error_update', 'Gagal memindahkan status tugas.'), 'error', 'Error');
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
  }, [tasksData, onRefresh, showToast, t]);

  const handleDeleteTask = async (taskId, title) => {
    if (!confirm(t('tasks_delete_confirm', `Hapus tugas "${title}"?`))) return;
    try {
      await api.deleteTask(taskId);
      showToast(t('tasks_deleted_msg', 'Tugas berhasil dihapus.'), 'info', t('tasks_deleted_title', 'Tugas Dihapus'));
      if (onRefresh) onRefresh();
    } catch {
      showToast(t('tasks_error_delete', 'Gagal menghapus tugas.'), 'error', 'Error');
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
                ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {t('tasks_filter_all_categories', 'Semua Kategori')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
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
          className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold transition-all shadow-sm flex items-center justify-center space-x-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('tasks_new_btn', 'Tugas Baru')}</span>
        </button>
      </div>

      {/* Mobile Column Switcher */}
      <div className="md:hidden flex items-center space-x-1 bg-[#121215] p-1.5 rounded-lg border border-zinc-800 overflow-x-auto">
        {TASK_COLUMNS.map((col) => {
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

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start">
        {TASK_COLUMNS.map((col) => {
          const rawTasks = columns[col.id] || [];
          const taskList =
            selectedCategory === 'all'
              ? rawTasks
              : rawTasks.filter((t) => t.category === selectedCategory);

          const isMobileVisible = activeMobileCol === col.id;

          return (
            <div
              key={col.id}
              className={`rounded-xl bg-[#121215] border border-zinc-800 p-3 flex flex-col min-h-[500px] ${
                isMobileVisible ? 'block' : 'hidden md:flex'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/80 px-1">
                <div className="flex items-center space-x-2">
                  <col.icon className="w-3.5 h-3.5 text-zinc-400" />
                  <h4 className="font-semibold text-zinc-200 text-xs tracking-wide">{col.label}</h4>
                </div>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                  {taskList.length}
                </span>
              </div>

              {/* Task Cards Dropzone Area */}
              <div
                ref={(el) => (columnsRef.current[col.id] = el)}
                data-status={col.id}
                className="flex-1 space-y-2.5 overflow-y-auto custom-scrollbar pr-0.5 min-h-[120px]"
              >
                {taskList.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-zinc-800/60 rounded-lg text-zinc-600 text-[11px]">
                    <span>{t('tasks_empty_column', 'Belum ada tugas')}</span>
                  </div>
                ) : (
                  taskList.map((task) => {
                    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    const PriorityIcon = priorityConfig.icon;

                    return (
                      <div
                        key={task.id}
                        data-task-id={task.id}
                        className="task-card group relative rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3.5 transition-all shadow-sm cursor-grab active:cursor-grabbing space-y-2.5"
                      >
                        {/* Title & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="font-medium text-zinc-100 text-xs leading-snug break-words flex-1">
                            {task.title}
                          </h5>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => setEditingTask(task)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Description (if any) */}
                        {task.description && (
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Metadata Footer: Category, Due Date, Priority */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[10px]">
                          <div className="flex items-center space-x-1.5 text-zinc-400">
                            {task.category && (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-medium">
                                {task.category}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center space-x-1 font-mono text-zinc-400">
                                <Calendar className="w-2.5 h-2.5" />
                                <span>{task.due_date}</span>
                              </span>
                            )}
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold flex items-center space-x-1 ${priorityConfig.badge}`}
                          >
                            <PriorityIcon className="w-2.5 h-2.5" />
                            <span>{priorityConfig.label}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Add Button at bottom of column */}
              <button
                type="button"
                onClick={() => {
                  setInitialStatusForCreate(col.id);
                  setIsCreateModalOpen(true);
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
  const { t } = useLanguage();
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
        showToast(t('tasks_saved_msg', 'Tugas berhasil diperbarui!'), 'success', t('save', 'Berhasil'));
      } else {
        await api.createTask(payload);
        showToast(t('tasks_created_msg', 'Tugas baru berhasil ditambahkan!'), 'success', t('create', 'Tugas Dibuat'));
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
            {isEditing ? t('tasks_modal_edit_title', 'Edit Tugas') : t('tasks_modal_create_title', 'Tambah Tugas Baru')}
          </h3>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-zinc-300 mb-1">{t('tasks_form_title', 'Judul Tugas')}</label>
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
            <label className="block font-medium text-zinc-300 mb-1">{t('tasks_form_desc', 'Deskripsi / Catatan')}</label>
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
              <label className="block font-medium text-zinc-300 mb-1">{t('status', 'Status Kolom')}</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="backlog">{t('tasks_col_backlog', 'Backlog / Ide')}</option>
                <option value="todo">{t('tasks_col_todo', 'To Do')}</option>
                <option value="in_progress">{t('tasks_col_in_progress', 'In Progress')}</option>
                <option value="review">{t('tasks_col_review', 'Review / Hold')}</option>
                <option value="done">{t('tasks_col_done', 'Selesai')}</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('priority', 'Prioritas')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                <option value="low">{t('tasks_priority_low', 'Rendah (Low)')}</option>
                <option value="medium">{t('tasks_priority_medium', 'Sedang (Medium)')}</option>
                <option value="high">{t('tasks_priority_high', 'Tinggi (High)')}</option>
                <option value="urgent">{t('tasks_priority_urgent', 'Mendesak (Urgent)')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-300 mb-1">{t('category', 'Kategori')}</label>
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
              <label className="block font-medium text-zinc-300 mb-1">{t('tasks_form_due', 'Tenggat Waktu')}</label>
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
              {t('cancel', 'Batal')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? t('loading', 'Menyimpan...') : isEditing ? t('save', 'Simpan') : t('create', 'Buat')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
