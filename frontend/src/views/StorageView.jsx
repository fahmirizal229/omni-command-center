import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Folder,
  FolderPlus,
  Upload,
  HardDrive,
  FileText,
  FileArchive,
  Image as ImageIcon,
  Video,
  File as FileGeneric,
  Download,
  Trash2,
  Edit2,
  ChevronRight,
  Home,
  Search,
  Grid,
  List,
  RefreshCw,
  X,
  ChevronLeft,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  Maximize2
} from "lucide-react";
import { api, getAuthToken } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

export function StorageView() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [currentPath, setCurrentPath] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [filterType, setFilterType] = useState("all"); // "all" | "photos" | "videos" | "docs" | "backups"
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Modals state
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fetchFiles = useCallback(async (path = currentPath) => {
    setLoading(true);
    try {
      const res = await api.getStorageFiles(path);
      setData(res);
      setCurrentPath(res.current_path || "");
    } catch (err) {
      showToast(err.message || t('error_boundary_title', "Gagal memuat daftar file."), "error");
    } finally {
      setLoading(false);
    }
  }, [currentPath, showToast, t]);

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  // Handle Drag & Drop Upload
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await api.uploadStorageFiles(currentPath, files, (percent) => {
        setUploadProgress(percent);
      });
      showToast(t('vault_upload_success', `${files.length} file berhasil diunggah.`), "success");
      fetchFiles(currentPath);
    } catch (err) {
      showToast(err.message || t('error_boundary_title', "Gagal mengunggah file."), "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createStorageFolder(currentPath, newFolderName.trim());
      showToast(t('vault_folder_created', `Folder "${newFolderName}" berhasil dibuat.`), "success");
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      fetchFiles(currentPath);
    } catch (err) {
      showToast(err.message || "Gagal membuat folder.", "error");
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await api.renameStorageItem(currentPath, renameTarget.name, renameValue.trim());
      showToast(t('vault_renamed_success', `Berhasil diubah menjadi "${renameValue.trim()}".`), "success");
      setRenameTarget(null);
      setRenameValue("");
      fetchFiles(currentPath);
    } catch (err) {
      showToast(err.message || "Gagal mengubah nama file.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteStorageItem(deleteTarget.path);
      showToast(t('vault_deleted_success', `"${deleteTarget.name}" berhasil dihapus.`), "success");
      setDeleteTarget(null);
      fetchFiles(currentPath);
    } catch (err) {
      showToast(err.message || "Gagal menghapus.", "error");
    }
  };

  // Filter & Search
  const filteredItems = (data?.items || []).filter((item) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q)) return false;
    }

    // 2. Filter Type
    if (filterType === "photos") return item.is_image || item.is_dir;
    if (filterType === "videos") return item.is_video || item.is_dir;
    if (filterType === "docs") return item.is_doc || item.is_dir;
    if (filterType === "backups") return item.is_archive || item.is_dir;
    return true;
  });

  // Lightbox navigation
  const mediaItems = filteredItems.filter((i) => i.is_image || i.is_video);
  const openLightbox = (item) => {
    const idx = mediaItems.findIndex((m) => m.path === item.path);
    if (idx !== -1) setLightboxIndex(idx);
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1));
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, mediaItems.length]);

  const token = getAuthToken();
  const getMediaUrlWithToken = (url) => {
    if (!url) return "";
    return token ? `${url}&t=${encodeURIComponent(token.slice(-8))}` : url;
  };

  return (
    <div
      className="space-y-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header & Disk Stats */}
      <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  {t('vault_title', 'Storage Vault & Backup Foto')}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {t('vault_badge', 'Khusus & Terisolasi')}
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t('vault_subtitle', 'Folder aman di /home/arusuka/storage_vault')}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleUploadFiles(e.target.files)}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-all flex items-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{t('vault_upload_btn', 'Unggah File / Foto')}</span>
            </button>

            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-medium transition-all flex items-center space-x-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>{t('vault_new_folder', 'Folder Baru')}</span>
            </button>

            <button
              onClick={() => fetchFiles(currentPath)}
              className="p-2 bg-zinc-800/80 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 rounded-xl text-xs transition-all"
              title={t('btn_refresh', 'Refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Storage Meter Bar */}
        {data?.disk && (
          <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                <span>{t('vault_used_space', 'Ruang Terpakai Vault')}: <strong className="text-zinc-200">{data.disk.vault_used_formatted}</strong></span>
                <span>{t('vault_vps_free', 'Sisa Kapasitas VPS')}: <strong className="text-zinc-200">{data.disk.disk_free_gb} GB</strong></span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.disk.disk_percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <div>
                {t('vault_total_files', 'Total File')}: <span className="font-semibold text-zinc-200">{data.total_files}</span>
              </div>
              <div>
                {t('vault_total_media', 'Foto & Media')}: <span className="font-semibold text-zinc-200">{data.total_photos}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Uploading Progress Banner */}
      {uploading && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center space-x-4 animate-pulse">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs text-blue-300 font-medium mb-1">
              <span>{t('vault_uploading', 'Mengunggah berkas ke Storage Vault...')}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-950/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay Alert */}
      {isDragOver && (
        <div className="border-2 border-dashed border-blue-500 bg-blue-500/10 rounded-2xl p-8 text-center text-blue-300 flex flex-col items-center justify-center space-y-2">
          <Upload className="w-8 h-8 text-blue-400 animate-bounce" />
          <p className="text-sm font-semibold">{t('vault_drop_zone', 'Lepaskan file di sini untuk langsung mengunggah')}</p>
        </div>
      )}

      {/* Navigation, Breadcrumb & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#121215] border border-zinc-800/80 rounded-2xl p-3.5">
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto custom-scrollbar text-xs">
          {(data?.breadcrumbs || [{ name: "Storage Vault", path: "" }]).map((crumb, idx, arr) => {
            const isLast = idx === arr.length - 1;
            return (
              <React.Fragment key={crumb.path}>
                <button
                  type="button"
                  onClick={() => setCurrentPath(crumb.path)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all ${
                    isLast
                      ? "text-zinc-100 font-semibold bg-zinc-800/90"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
                >
                  {idx === 0 && <Home className="w-3.5 h-3.5 mr-0.5 text-zinc-400" />}
                  <span>{crumb.name}</span>
                </button>
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('search_placeholder', 'Cari file...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-850 border border-zinc-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-32 sm:w-44"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-850 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">{t('vault_filter_all', 'Semua Tipe')}</option>
            <option value="photos">{t('vault_filter_photos', '🖼️ Foto Saja')}</option>
            <option value="videos">{t('vault_filter_videos', '🎬 Video Saja')}</option>
            <option value="docs">{t('vault_filter_docs', '📄 Dokumen')}</option>
            <option value="backups">{t('vault_filter_backups', '📦 Backup / ZIP')}</option>
          </select>

          {/* Toggle View Mode */}
          <div className="flex items-center bg-zinc-850 border border-zinc-700/80 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "grid" ? "bg-zinc-700 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
              title={t('vault_view_gallery', 'Gallery Mode')}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "list" ? "bg-zinc-700 text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              }`}
              title={t('vault_view_list', 'List Mode')}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main File / Gallery Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-zinc-500">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
          <p className="text-xs">{t('loading', 'Memuat berkas Storage Vault...')}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Folder className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-300">{t('vault_empty_title', 'Folder ini masih kosong')}</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {t('vault_empty_desc', 'Tarik dan lepas file foto atau dokumen ke sini, atau klik tombol Unggah di atas.')}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID / GALLERY VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredItems.map((item) => {
            if (item.is_dir) {
              return (
                <div
                  key={item.path}
                  onClick={() => setCurrentPath(item.path)}
                  className="group bg-[#121215] hover:bg-[#18181d] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                      <Folder className="w-5 h-5 fill-amber-500/20" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameTarget(item);
                          setRenameValue(item.name);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg"
                        title={t('edit', 'Ubah Nama')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded-lg"
                        title={t('delete', 'Hapus')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Folder</p>
                  </div>
                </div>
              );
            }

            // Image / Video Card
            if (item.is_image || item.is_video) {
              return (
                <div
                  key={item.path}
                  className="group bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg relative"
                >
                  <div
                    onClick={() => openLightbox(item)}
                    className="relative aspect-square w-full bg-zinc-900 overflow-hidden cursor-pointer flex items-center justify-center"
                  >
                    {item.is_image ? (
                      <img
                        src={getMediaUrlWithToken(item.preview_url)}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-500 space-y-1">
                        <Video className="w-8 h-8 text-indigo-400" />
                        <span className="text-[10px] uppercase font-bold text-zinc-400">{item.ext}</span>
                      </div>
                    )}

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(item);
                        }}
                        className="p-2 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs backdrop-blur-sm shadow-md"
                        title={t('view_details', 'Lihat Media')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={item.download_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-100 rounded-xl text-xs backdrop-blur-sm shadow-md"
                        title={t('download', 'Unduh')}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Format badge */}
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[9px] uppercase font-semibold text-zinc-300">
                      {item.ext}
                    </span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <div className="truncate pr-1">
                      <h4 className="text-xs font-medium text-zinc-200 truncate" title={item.name}>
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.size_formatted}</p>
                    </div>

                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 rounded-lg transition-opacity"
                      title={t('delete', 'Hapus')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            }

            // General Document / Archive Card
            return (
              <div
                key={item.path}
                className="group bg-[#121215] hover:bg-[#18181d] border border-zinc-800/80 hover:border-zinc-700 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-md relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                    {item.is_archive ? (
                      <FileArchive className="w-5 h-5 text-emerald-400" />
                    ) : item.is_doc ? (
                      <FileText className="w-5 h-5 text-sky-400" />
                    ) : (
                      <FileGeneric className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <a
                      href={item.download_url}
                      download
                      className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg"
                      title={t('download', 'Unduh')}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setRenameTarget(item);
                        setRenameValue(item.name);
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 rounded-lg"
                      title={t('edit', 'Ubah Nama')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700/50 rounded-lg"
                      title={t('delete', 'Hapus')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200 truncate group-hover:text-white" title={item.name}>
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-0.5">
                    <span>{item.size_formatted}</span>
                    <span className="uppercase">{item.ext}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-850/60 text-zinc-400 border-b border-zinc-800 font-medium">
                <tr>
                  <th className="py-3 px-4">{t('vault_col_name', 'Nama Berkas')}</th>
                  <th className="py-3 px-4">{t('vault_col_size', 'Ukuran')}</th>
                  <th className="py-3 px-4">{t('category', 'Tipe')}</th>
                  <th className="py-3 px-4">{t('vault_col_mtime', 'Terakhir Diubah')}</th>
                  <th className="py-3 px-4 text-right">{t('actions', 'Aksi')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredItems.map((item) => (
                  <tr
                    key={item.path}
                    onClick={() => {
                      if (item.is_dir) setCurrentPath(item.path);
                      else if (item.is_image || item.is_video) openLightbox(item);
                    }}
                    className={`hover:bg-zinc-800/40 transition-colors ${
                      item.is_dir || item.is_image || item.is_video ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="py-3 px-4 flex items-center space-x-3">
                      {item.is_dir ? (
                        <Folder className="w-4 h-4 text-amber-400 fill-amber-500/20 shrink-0" />
                      ) : item.is_image ? (
                        <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : item.is_video ? (
                        <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                      ) : item.is_archive ? (
                        <FileArchive className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                      <span className="font-medium text-zinc-200 truncate max-w-xs">{item.name}</span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{item.size_formatted}</td>
                    <td className="py-3 px-4 text-zinc-400 uppercase">{item.is_dir ? "Folder" : item.ext || "--"}</td>
                    <td className="py-3 px-4 text-zinc-500">{item.mtime}</td>
                    <td className="py-3 px-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                      {!item.is_dir && (
                        <a
                          href={item.download_url}
                          download
                          className="inline-block p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                          title={t('download', 'Unduh')}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setRenameTarget(item);
                          setRenameValue(item.name);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                        title={t('edit', 'Ubah')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        title={t('delete', 'Hapus')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL (Full Resolution Photo / Video Preview) */}
      {lightboxIndex !== null && mediaItems[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full flex items-center justify-between text-zinc-300 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <span className="text-xs font-semibold text-zinc-400">
                {lightboxIndex + 1} / {mediaItems.length}
              </span>
              <span className="text-sm font-medium text-white truncate max-w-sm">
                {mediaItems[lightboxIndex].name}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <a
                href={mediaItems[lightboxIndex].download_url}
                download
                className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-xl text-xs transition-colors flex items-center space-x-1.5"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('download', 'Unduh')}</span>
              </a>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Center Stage */}
          <div
            className="flex-1 w-full max-h-[82vh] flex items-center justify-center p-2 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {mediaItems[lightboxIndex].is_image ? (
              <img
                src={getMediaUrlWithToken(mediaItems[lightboxIndex].preview_url)}
                alt={mediaItems[lightboxIndex].name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all"
              />
            ) : (
              <video
                src={getMediaUrlWithToken(mediaItems[lightboxIndex].preview_url)}
                controls
                autoPlay
                className="max-w-full max-h-full rounded-lg shadow-2xl"
              />
            )}

            {/* Left / Right Nav Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : mediaItems.length - 1))
                  }
                  className="absolute left-2 sm:left-4 p-3 bg-zinc-900/70 hover:bg-zinc-800 text-white rounded-2xl backdrop-blur-md transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setLightboxIndex((prev) => (prev < mediaItems.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 sm:right-4 p-3 bg-zinc-900/70 hover:bg-zinc-800 text-white rounded-2xl backdrop-blur-md transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div
            className="text-xs text-zinc-400 flex items-center space-x-4 bg-zinc-900/60 px-4 py-1.5 rounded-full border border-zinc-800/80"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{t('vault_col_size', 'Ukuran')}: {mediaItems[lightboxIndex].size_formatted}</span>
            <span>{t('vault_col_mtime', 'Diunggah')}: {mediaItems[lightboxIndex].mtime}</span>
          </div>
        </div>
      )}

      {/* CREATE FOLDER MODAL */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181d] border border-zinc-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-400" />
              {t('vault_create_folder_title', 'Buat Folder Baru')}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Lokasi: <code className="text-zinc-300">{currentPath || "Root Vault"}</code>
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder={t('vault_create_folder_label', 'Nama folder (misal: Liburan 2026)')}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  {t('cancel', 'Batal')}
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {t('create', 'Buat')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181d] border border-zinc-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-400" />
              {t('vault_rename_title', 'Ubah Nama')}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              {t('vault_col_name', 'Nama saat ini')}: <span className="text-zinc-200 font-medium">{renameTarget.name}</span>
            </p>

            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  {t('cancel', 'Batal')}
                </button>
                <button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {t('save', 'Simpan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181d] border border-zinc-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t('confirm_delete_title', 'Konfirmasi Hapus')}</h3>
                <p className="text-xs text-zinc-400">{t('confirm_delete_desc', 'Tindakan ini tidak dapat dibatalkan.')}</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 mb-5">
              {t('vault_delete_confirm', 'Apakah kamu yakin ingin menghapus')} {deleteTarget.is_dir ? "folder" : "file"}{" "}
              <strong className="text-white font-semibold">"{deleteTarget.name}"</strong>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                {t('cancel', 'Batal')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                {t('delete', 'Hapus')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
