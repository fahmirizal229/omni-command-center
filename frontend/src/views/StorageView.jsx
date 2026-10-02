import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  FolderPlus,
  Upload,
  HardDrive,
  Cloud,
  Server,
  FileText,
  FileArchive,
  Image as ImageIcon,
  Video,
  FileCode,
  File as FileGeneric,
  Download,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
  Home,
  Search,
  Grid,
  List,
  RefreshCw,
  X,
  Eye,
  Loader2,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Play,
} from "lucide-react";
import { api, getAuthToken } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico", "tiff", "heic", "avif"]);
const VIDEO_EXTS = new Set(["mp4", "mkv", "webm", "mov", "avi", "flv"]);
const PDF_EXTS = new Set(["pdf"]);
const CODE_TEXT_EXTS = new Set([
  "py", "js", "jsx", "ts", "tsx", "json", "md", "txt", "html", "css",
  "sh", "yaml", "yml", "xml", "log", "env", "sql", "conf", "toml", "ini", "c", "cpp", "go", "rs", "java"
]);
const ARCHIVE_EXTS = new Set(["zip", "tar", "gz", "bz2", "7z", "rar"]);

function getFormatBadgeStyle(ext) {
  const cleanExt = (ext || "").toLowerCase().replace(".", "");
  if (IMAGE_EXTS.has(cleanExt)) {
    return {
      label: cleanExt.toUpperCase(),
      className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      lightClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
  }
  if (VIDEO_EXTS.has(cleanExt)) {
    return {
      label: cleanExt.toUpperCase(),
      className: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      lightClass: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }
  if (PDF_EXTS.has(cleanExt)) {
    return {
      label: "PDF",
      className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      lightClass: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
  if (CODE_TEXT_EXTS.has(cleanExt)) {
    return {
      label: cleanExt.toUpperCase(),
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      lightClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (ARCHIVE_EXTS.has(cleanExt)) {
    return {
      label: cleanExt.toUpperCase(),
      className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      lightClass: "bg-sky-50 text-sky-700 border-sky-200",
    };
  }
  return {
    label: cleanExt ? cleanExt.toUpperCase() : "FILE",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    lightClass: "bg-slate-100 text-slate-700 border-slate-200",
  };
}

function getFileIcon(item, isDark = true) {
  if (item.is_dir) {
    return <Folder className="w-5 h-5 text-amber-500 fill-amber-500/20 shrink-0" />;
  }
  const ext = (item.ext || "").toLowerCase();
  if (IMAGE_EXTS.has(ext)) {
    return <ImageIcon className="w-5 h-5 text-indigo-400 shrink-0" />;
  }
  if (VIDEO_EXTS.has(ext)) {
    return <Video className="w-5 h-5 text-purple-400 shrink-0" />;
  }
  if (PDF_EXTS.has(ext)) {
    return <FileText className="w-5 h-5 text-rose-400 shrink-0" />;
  }
  if (CODE_TEXT_EXTS.has(ext)) {
    return <FileCode className="w-5 h-5 text-emerald-400 shrink-0" />;
  }
  if (ARCHIVE_EXTS.has(ext)) {
    return <FileArchive className="w-5 h-5 text-sky-400 shrink-0" />;
  }
  return <FileGeneric className="w-5 h-5 text-slate-400 shrink-0" />;
}

function getNonMediaVisual(item, isDark = true) {
  if (item.is_dir) {
    return {
      bg: isDark
        ? "bg-gradient-to-br from-amber-500/15 via-amber-950/25 to-slate-950"
        : "bg-gradient-to-br from-amber-100/70 via-amber-50/40 to-slate-50",
      iconBox: isDark
        ? "bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-amber-500/10"
        : "bg-amber-100 border-amber-200 text-amber-600",
      icon: <Folder className="w-8 h-8 fill-current" />,
      sub: "Folder",
      badge: {
        label: "DIR",
        className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        lightClass: "bg-amber-100 text-amber-700 border-amber-200",
      },
    };
  }

  const ext = (item.ext || "").toLowerCase();

  if (PDF_EXTS.has(ext)) {
    return {
      bg: isDark
        ? "bg-gradient-to-br from-rose-500/15 via-rose-950/25 to-slate-950"
        : "bg-gradient-to-br from-rose-100/70 via-rose-50/40 to-slate-50",
      iconBox: isDark
        ? "bg-rose-500/20 border-rose-500/30 text-rose-400 shadow-rose-500/10"
        : "bg-rose-100 border-rose-200 text-rose-600",
      icon: <FileText className="w-8 h-8" />,
      sub: "Document",
      badge: {
        label: "PDF",
        className: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        lightClass: "bg-rose-100 text-rose-700 border-rose-200",
      },
    };
  }

  if (CODE_TEXT_EXTS.has(ext)) {
    return {
      bg: isDark
        ? "bg-gradient-to-br from-emerald-500/15 via-emerald-950/25 to-slate-950"
        : "bg-gradient-to-br from-emerald-100/70 via-emerald-50/40 to-slate-50",
      iconBox: isDark
        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10"
        : "bg-emerald-100 border-emerald-200 text-emerald-600",
      icon: <FileCode className="w-8 h-8" />,
      sub: "Code & Config",
      badge: {
        label: ext.toUpperCase(),
        className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        lightClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
      },
    };
  }

  if (ARCHIVE_EXTS.has(ext)) {
    return {
      bg: isDark
        ? "bg-gradient-to-br from-sky-500/15 via-sky-950/25 to-slate-950"
        : "bg-gradient-to-br from-sky-100/70 via-sky-50/40 to-slate-50",
      iconBox: isDark
        ? "bg-sky-500/20 border-sky-500/30 text-sky-400 shadow-sky-500/10"
        : "bg-sky-100 border-sky-200 text-sky-600",
      icon: <FileArchive className="w-8 h-8" />,
      sub: "Archive",
      badge: {
        label: ext.toUpperCase(),
        className: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        lightClass: "bg-sky-100 text-sky-700 border-sky-200",
      },
    };
  }

  return {
    bg: isDark
      ? "bg-gradient-to-br from-indigo-500/15 via-slate-900/40 to-slate-950"
      : "bg-gradient-to-br from-slate-100/90 via-slate-50 to-slate-100/40",
    iconBox: isDark
      ? "bg-slate-800/80 border-slate-700 text-slate-300 shadow-indigo-500/5"
      : "bg-slate-100 border-slate-200 text-slate-700",
    icon: <FileGeneric className="w-8 h-8" />,
    sub: "Binary File",
    badge: {
      label: ext ? ext.toUpperCase() : "FILE",
      className: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      lightClass: "bg-slate-100 text-slate-700 border-slate-200",
    },
  };
}


export function StorageView({ isDark = true }) {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const fileInputRef = useRef(null);

  // Active Storage Vault Tab: 'local' | 'cloud'
  const [activeVault, setActiveVault] = useState("local");

  // Independent directory paths for each vault so browsing state is preserved
  const [vaultPaths, setVaultPaths] = useState({
    local: "",
    cloud: "",
  });

  const currentPath = vaultPaths[activeVault] || "";
  const setCurrentPath = (newPath) => {
    setVaultPaths((prev) => ({
      ...prev,
      [activeVault]: newPath,
    }));
  };

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

  // Universal QuickLook Inspector Modal
  const [quickLookIndex, setQuickLookIndex] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const isLocal = activeVault === "local";

  const fetchFiles = useCallback(
    async (path = currentPath, vault = activeVault, forceRefresh = false) => {
      setLoading(true);
      try {
        const res = await api.getStorageFiles(path, forceRefresh, vault);
        setData(res);
      } catch (err) {
        showToast(err.message || `Couldn't load your ${vault === "cloud" ? "Cloud Drive" : "Local Vault"} files.`, "error");
      } finally {
        setLoading(false);
      }
    },
    [currentPath, activeVault, showToast]
  );

  useEffect(() => {
    fetchFiles(currentPath, activeVault);
  }, [currentPath, activeVault]);

  const handleTabSwitch = (vaultKey) => {
    if (activeVault === vaultKey) return;
    setActiveVault(vaultKey);
    setSearchQuery("");
    setFilterType("all");
    setQuickLookIndex(null);
  };

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
    const targetLabel = isLocal ? "Local Vault" : "Cloud Drive";
    try {
      await api.uploadStorageFiles(
        currentPath,
        files,
        (percent) => {
          setUploadProgress(percent);
        },
        activeVault
      );
      showToast(`${files.length} file(s) uploaded to your ${targetLabel}.`, "success");
      fetchFiles(currentPath, activeVault, true);
    } catch (err) {
      showToast(err.message || `Failed to upload file(s) to ${targetLabel}.`, "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const targetLabel = isLocal ? "Local Vault" : "Cloud Drive";
    try {
      await api.createStorageFolder(currentPath, newFolderName.trim(), activeVault);
      showToast(`Folder "${newFolderName}" created in ${targetLabel}.`, "success");
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      fetchFiles(currentPath, activeVault, true);
    } catch (err) {
      showToast(err.message || "Failed to create folder.", "error");
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await api.renameStorageItem(currentPath, renameTarget.name, renameValue.trim(), activeVault);
      showToast(`Renamed to "${renameValue.trim()}".`, "success");
      setRenameTarget(null);
      setRenameValue("");
      fetchFiles(currentPath, activeVault, true);
    } catch (err) {
      showToast(err.message || "Failed to rename item.", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteStorageItem(deleteTarget.path, activeVault);
      showToast(`"${deleteTarget.name}" deleted.`, "success");
      setDeleteTarget(null);
      fetchFiles(currentPath, activeVault, true);
    } catch (err) {
      showToast(err.message || "Failed to delete item.", "error");
    }
  };

  // Filter & Search
  const filteredItems = (data?.items || []).filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q)) return false;
    }
    const ext = (item.ext || "").toLowerCase();
    if (filterType === "photos") return item.is_dir || IMAGE_EXTS.has(ext);
    if (filterType === "videos") return item.is_dir || VIDEO_EXTS.has(ext);
    if (filterType === "docs") return item.is_dir || PDF_EXTS.has(ext) || CODE_TEXT_EXTS.has(ext);
    if (filterType === "backups") return item.is_dir || ARCHIVE_EXTS.has(ext);
    return true;
  });

  const previewableFiles = useMemo(() => {
    return filteredItems.filter((item) => !item.is_dir);
  }, [filteredItems]);

  const closeQuickLook = useCallback(() => {
    setQuickLookIndex(null);
    setTextContent(null);
    setLoadingText(false);
    setCopiedText(false);
  }, []);

  const openQuickLook = (item) => {
    const idx = previewableFiles.findIndex((f) => f.path === item.path);
    if (idx !== -1) {
      setTextContent(null);
      setLoadingText(false);
      setCopiedText(false);
      setQuickLookIndex(idx);
    }
  };

  const currentPreviewFile = quickLookIndex !== null ? previewableFiles[quickLookIndex] : null;

  const token = getAuthToken();
  const getMediaUrlWithToken = (url) => {
    if (!url) return "";
    return token ? `${url}&t=${encodeURIComponent(token.slice(-8))}` : url;
  };

  // Fetch text/code content with AbortController to immediately cancel on close or switch
  useEffect(() => {
    if (!currentPreviewFile) {
      setTextContent(null);
      setLoadingText(false);
      return;
    }
    const ext = (currentPreviewFile.ext || "").toLowerCase();
    if (!CODE_TEXT_EXTS.has(ext) || !currentPreviewFile.download_url) {
      setTextContent(null);
      setLoadingText(false);
      return;
    }

    const controller = new AbortController();
    setLoadingText(true);
    setTextContent(null);
    setCopiedText(false);

    const url = getMediaUrlWithToken(currentPreviewFile.download_url);
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load file preview");
        return res.text();
      })
      .then((txt) => {
        setTextContent(txt);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setTextContent(`Error reading file: ${err.message}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingText(false);
        }
      });

    return () => {
      controller.abort();
      setTextContent(null);
      setLoadingText(false);
    };
  }, [quickLookIndex, currentPreviewFile?.path]);

  // Keyboard navigation for QuickLook Inspector
  useEffect(() => {
    if (quickLookIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeQuickLook();
      if (e.key === "ArrowLeft") {
        setTextContent(null);
        setQuickLookIndex((prev) => (prev > 0 ? prev - 1 : previewableFiles.length - 1));
      }
      if (e.key === "ArrowRight") {
        setTextContent(null);
        setQuickLookIndex((prev) => (prev < previewableFiles.length - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickLookIndex, previewableFiles.length, closeQuickLook]);

  const handleCopyTextContent = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
    showToast("File content copied to clipboard.", "success");
  };

  return (
    <div
      className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 1. Header & Segmented Switcher (Matching Overview Palette) */}
      <section
        className={`rounded-2xl p-6 sm:p-7 border transition-colors relative overflow-hidden shadow-sm ${
          isDark
            ? "bg-[#0e121d] border-slate-800/90 text-slate-100"
            : "bg-white/95 border-slate-200 shadow-xs text-slate-900"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Header Title & Switcher */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors ${
                  isDark
                    ? "bg-slate-800/80 border-slate-700/60 text-indigo-400"
                    : "bg-indigo-50 border-indigo-200 text-indigo-600"
                }`}
              >
                {isLocal ? <HardDrive className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h1 className={`text-base sm:text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                    {t("storage_banner_title") || "Personal Vault & Drive"}
                  </h1>
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${
                      isDark
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>{isLocal ? (language === "id" ? "Penyimpanan Cepat Server" : "Fast Server Storage") : (language === "id" ? "Ruang Cloud 20 TB" : "20 TB Cloud Space")}</span>
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  {isLocal
                    ? (language === "id" ? "Ruang privat untuk berkas cepat, proyek aktif, dan media harian" : "Your private space for quick files, active projects, and daily media")
                    : (language === "id" ? "Arsip cloud raksasa untuk cadangan besar dan memori jangka panjang" : "Your massive cloud archive for large backups and long-term memories")}
                </p>
              </div>
            </div>

            {/* Switcher Tabs (Consistent Indigo / Slate Palette) */}
            <div
              className={`relative inline-grid grid-cols-2 p-1 rounded-xl border ${
                isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-100/90 border-slate-200"
              }`}
            >
              {/* Sliding Background Pill */}
              <div
                className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-lg transition-all duration-250 ease-out pointer-events-none ${
                  isLocal ? "left-1" : "left-[calc(50%+2px)]"
                } ${
                  isDark
                    ? "bg-indigo-600 shadow-sm shadow-indigo-500/20"
                    : "bg-white shadow-xs"
                }`}
              />

              <button
                type="button"
                onClick={() => handleTabSwitch("local")}
                className={`relative z-10 flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  isLocal
                    ? isDark
                      ? "text-white"
                      : "text-indigo-600"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>{t("storage_tab_local") || "Local Vault"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono transition-colors duration-200 ${
                    isLocal
                      ? isDark
                        ? "bg-indigo-700/70 text-indigo-100"
                        : "bg-indigo-50 text-indigo-700"
                      : isDark
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  Fast
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch("cloud")}
                className={`relative z-10 flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  !isLocal
                    ? isDark
                      ? "text-white"
                      : "text-indigo-600"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{t("storage_tab_cloud") || "Cloud Drive"}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono transition-colors duration-200 ${
                    !isLocal
                      ? isDark
                        ? "bg-indigo-700/70 text-indigo-100"
                        : "bg-indigo-50 text-indigo-700"
                      : isDark
                      ? "bg-slate-800 text-slate-400"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  20 TB
                </span>
              </button>
            </div>
          </div>

          {/* Action Buttons (Consistent Indigo & Slate Style) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleUploadFiles(e.target.files)}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold font-mono transition-all flex items-center space-x-2 shadow-sm disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>{t("storage_btn_upload") || "Upload Files"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateFolderOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium border transition-all flex items-center space-x-2 cursor-pointer active:scale-95 ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
                  : "bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FolderPlus className="w-4 h-4" />
              <span>{t("storage_btn_new_folder") || "New Folder"}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchFiles(currentPath, activeVault, true)}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700"
                  : "bg-slate-100/90 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
              title={language === "id" ? "Segarkan" : "Refresh"}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Capacity & Usage Bar */}
        {data?.disk && (
          <div
            className={`mt-6 pt-4 border-t flex flex-col gap-4 font-mono text-xs ${
              isDark ? "border-slate-800/80 text-slate-400" : "border-slate-200 text-slate-600"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 max-w-xl space-y-1.5">
                <div className="flex justify-between text-xs tabular-nums">
                  <span>
                    {t("storage_used_space") || "Used"}:{" "}
                    <strong className={isDark ? "text-slate-200" : "text-slate-800"}>
                      {data.disk.vault_used_formatted || `${data.disk.disk_used_gb} GB`}
                    </strong>
                  </span>
                  <span>
                    {t("storage_free_space") || "Available"}:{" "}
                    <strong className={isDark ? "text-slate-200" : "text-slate-800"}>
                      {data.cluster?.free_formatted || `${data.disk.disk_free_gb} GB remaining`}
                    </strong>
                  </span>
                </div>
                <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div
                    className="h-2 rounded-full transition-[width] duration-150 ease-out bg-indigo-600"
                    style={{ width: `${Math.min(data.disk.disk_percent || data.cluster?.percent || 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs tabular-nums">
                <div>
                  {t("storage_total_files") || "Total Files"}:{" "}
                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {data.total_files}
                  </span>
                </div>
                <div>
                  {language === "id" ? "Foto & Media" : "Photos & Media"}:{" "}
                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    {data.total_photos}
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Connected Drives Pills */}
            {!isLocal && data.cluster?.drives && data.cluster.drives.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/40 flex-wrap">
                <span className="text-[11px] text-slate-500">{language === "id" ? "Drive Terhubung:" : "Connected Drives:"}</span>
                {data.cluster.drives.map((d) => (
                  <div
                    key={d.id}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center space-x-2 tabular-nums ${
                      isDark ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        d.status === "online" ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    />
                    <span className="font-medium">{d.name}</span>
                    <span className="text-slate-500 text-[10px]">
                      ({d.used_formatted} / {d.total_formatted})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Uploading Progress Banner */}
      {uploading && (
        <div
          className={`border rounded-2xl p-4 flex items-center space-x-4 ${
            isDark
              ? "bg-indigo-950/40 border-indigo-500/30 text-indigo-300"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
          }`}
        >
          <Loader2 className="w-5 h-5 animate-spin shrink-0 text-indigo-500" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono font-medium mb-1 tabular-nums">
              <span>{language === "id" ? `Mengunggah ke ${isLocal ? "Drive Lokal" : "Cloud Drive"}...` : `Uploading to your ${isLocal ? "Local Vault" : "Cloud Drive"}...`}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200"}`}>
              <div
                className="h-2 rounded-full transition-[width] duration-150 ease-out bg-indigo-600"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Drag & Drop Overlay Alert */}
      {isDragOver && (
        <div
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2 transition-all duration-150 ${
            isDark
              ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-[0_0_24px_rgba(99,102,241,0.2)]"
              : "border-indigo-400 bg-indigo-50 text-indigo-800 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
          }`}
        >
          <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold">{language === "id" ? "Tarik dan lepas berkas ke sini untuk mengunggah" : "Drop your files here to upload"}</p>
        </div>
      )}

      {/* 2. Navigation, Breadcrumb & Controls */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 border transition-colors ${
          isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white/95 border-slate-200 shadow-xs"
        }`}
      >
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs font-mono">
          {(data?.breadcrumbs || [{ name: isLocal ? (t("storage_tab_local") || "Local Vault") : (t("storage_tab_cloud") || "Cloud Drive"), path: "" }]).map((crumb, idx, arr) => {
            const isLast = idx === arr.length - 1;
            return (
              <React.Fragment key={crumb.path}>
                <button
                  type="button"
                  onClick={() => setCurrentPath(crumb.path)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isLast
                      ? isDark
                        ? "text-slate-100 font-semibold bg-slate-800/90"
                        : "text-slate-900 font-semibold bg-slate-100"
                      : isDark
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  {idx === 0 && (
                    isLocal ? (
                      <Home className="w-3.5 h-3.5 mr-0.5 text-indigo-400" />
                    ) : (
                      <Cloud className="w-3.5 h-3.5 mr-0.5 text-indigo-400" />
                    )
                  )}
                  <span>{crumb.name}</span>
                </button>
                {!isLast && <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("storage_search_placeholder") || "Search files..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`border rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:border-indigo-500 w-32 sm:w-44 transition-colors ${
                isDark
                  ? "bg-slate-900/90 border-slate-800 text-slate-200 placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`border rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors ${
              isDark
                ? "bg-slate-900/90 border-slate-800 text-slate-300"
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <option value="all">{t("storage_filter_all") || "All Files"}</option>
            <option value="photos">🖼️ {t("storage_filter_photos") || "Photos"}</option>
            <option value="videos">🎬 {t("storage_filter_videos") || "Videos"}</option>
            <option value="docs">📄 {t("storage_filter_docs") || "Documents & Code"}</option>
            <option value="backups">📦 {t("storage_filter_backups") || "Archives & ZIPs"}</option>
          </select>

          {/* Toggle View Mode */}
          <div
            className={`relative inline-grid grid-cols-2 border rounded-xl p-0.5 ${
              isDark ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
            }`}
          >
            {/* Sliding Indicator Pill */}
            <div
              className={`absolute inset-y-0.5 w-[calc(50%-2px)] rounded-lg transition-all duration-200 ease-out pointer-events-none ${
                viewMode === "grid" ? "left-0.5" : "left-[calc(50%+1px)]"
              } ${
                isDark
                  ? "bg-slate-800 shadow-sm"
                  : "bg-white shadow-2xs"
              }`}
            />

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`relative z-10 flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                viewMode === "grid"
                  ? isDark
                    ? "text-slate-100"
                    : "text-slate-900"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid view"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`relative z-10 flex items-center justify-center p-1.5 rounded-lg transition-colors duration-200 cursor-pointer ${
                viewMode === "list"
                  ? isDark
                    ? "text-slate-100"
                    : "text-slate-900"
                  : isDark
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main File / Gallery Content */}
      <div key={`${activeVault}-${viewMode}-${currentPath}`} className="animate-viewCrossfade">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400 font-mono text-xs">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <p>{language === "id" ? `Memuat isi ${isLocal ? "Drive Lokal" : "Cloud Drive"}...` : `Loading your ${isLocal ? "Local Vault" : "Cloud Drive"}...`}</p>
          </div>
        ) : filteredItems.length === 0 ? (
        <div
          className={`border rounded-2xl py-16 px-4 text-center ${
            isDark ? "bg-[#0e121d] border-slate-800/90 text-slate-400" : "bg-white/90 border-slate-200 text-slate-600 shadow-xs"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 ${
              isDark ? "bg-slate-800/60 border-slate-700/50 text-indigo-400" : "bg-slate-100 border-slate-200 text-indigo-600"
            }`}
          >
            {isLocal ? <Folder className="w-6 h-6 text-indigo-400" /> : <Cloud className="w-6 h-6 text-indigo-400" />}
          </div>
          <h3 className={`text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
            {t("storage_empty_title") || "Nothing here yet"}
          </h3>
          <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {t("storage_empty_desc") || "Drop files anywhere to upload, or tap the Upload button above."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ======================================================== */
        /* ENHANCED GRID / CARD VIEW                                 */
        /* ======================================================== */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredItems.map((item) => {
            const ext = (item.ext || "").toLowerCase();
            const badge = getFormatBadgeStyle(ext);
            const isVisualMedia = !item.is_dir && (IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext));

            // 1. Visual Media Card (Photos / Videos)
            if (isVisualMedia) {
              return (
                <div
                  key={item.path}
                  onClick={() => openQuickLook(item)}
                  className={`group border rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg relative cursor-pointer ${
                    isDark
                      ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700 hover:bg-[#121624]"
                      : "bg-white/95 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                  }`}
                >
                  <div
                    className={`relative aspect-square w-full overflow-hidden flex items-center justify-center border-b ${
                      isDark ? "bg-slate-950 border-slate-800/60" : "bg-slate-100 border-slate-100"
                    }`}
                  >
                    {IMAGE_EXTS.has(ext) ? (
                      <img
                        src={getMediaUrlWithToken(item.preview_url)}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-md">
                          <Play className="w-6 h-6 ml-0.5 fill-purple-400" />
                        </div>
                        <span className="text-[10px] font-mono text-purple-300/70 font-medium">Video</span>
                      </div>
                    )}

                    {/* Hover Quick Action Dock */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickLook(item);
                        }}
                        className="p-2 bg-slate-900/90 hover:bg-indigo-600 text-slate-100 rounded-xl text-xs backdrop-blur-sm shadow-md cursor-pointer transition-colors"
                        title="QuickLook"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <a
                        href={item.download_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-100 rounded-xl text-xs backdrop-blur-sm shadow-md cursor-pointer transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Format Badge */}
                    <span
                      className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border ${
                        isDark ? badge.className : badge.lightClass
                      } backdrop-blur-md bg-black/50`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="p-2.5 flex items-center justify-between">
                    <div className="truncate pr-1">
                      <h4
                        className={`text-xs font-medium truncate ${
                          isDark ? "text-slate-200 group-hover:text-indigo-400" : "text-slate-800 group-hover:text-indigo-600"
                        } transition-colors`}
                        title={item.name}
                      >
                        {item.name}
                      </h4>
                      <p className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {item.size_formatted}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameTarget(item);
                          setRenameValue(item.name);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                        }`}
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(item);
                        }}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          isDark ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800" : "text-slate-500 hover:text-rose-600 hover:bg-slate-200/60"
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // 2. Rich Non-Media / Document / Folder Card (Unified Aspect-Square Hero Canvas)
            const visual = getNonMediaVisual(item, isDark);

            return (
              <div
                key={item.path}
                onClick={() => {
                  if (item.is_dir) setCurrentPath(item.path);
                  else openQuickLook(item);
                }}
                className={`group border rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-lg relative cursor-pointer ${
                  isDark
                    ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700 hover:bg-[#121624]"
                    : "bg-white/95 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs"
                }`}
              >
                {/* Visual Canvas matching media cards */}
                <div
                  className={`relative aspect-square w-full overflow-hidden flex flex-col items-center justify-center border-b ${
                    isDark ? "border-slate-800/60" : "border-slate-100"
                  } ${visual.bg}`}
                >
                  {/* Glowing Centered Icon */}
                  <div
                    className={`w-13 h-13 rounded-2xl border flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 ${visual.iconBox}`}
                  >
                    {visual.icon}
                  </div>

                  {/* Sub-label */}
                  <span
                    className={`text-[10px] font-mono mt-2 font-medium ${
                      isDark ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {visual.sub}
                  </span>

                  {/* Hover Quick Action Dock */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    {!item.is_dir && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickLook(item);
                        }}
                        className="p-2 bg-slate-900/90 hover:bg-indigo-600 text-slate-100 rounded-xl text-xs backdrop-blur-sm shadow-md cursor-pointer transition-colors"
                        title="QuickLook"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {!item.is_dir && (
                      <a
                        href={item.download_url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-100 rounded-xl text-xs backdrop-blur-sm shadow-md cursor-pointer transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget(item);
                        setRenameValue(item.name);
                      }}
                      className="p-2 bg-slate-900/90 hover:bg-slate-800 text-slate-100 rounded-xl text-xs backdrop-blur-sm shadow-md cursor-pointer transition-colors"
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className="p-2 bg-slate-900/90 hover:bg-rose-600 text-slate-100 rounded-xl text-xs backdrop-blur-sm shadow-md cursor-pointer transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Format Badge */}
                  <span
                    className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold border backdrop-blur-md ${
                      isDark ? visual.badge.className : visual.badge.lightClass
                    }`}
                  >
                    {visual.badge.label}
                  </span>
                </div>

                {/* Bottom Meta Bar */}
                <div className="p-2.5 flex items-center justify-between">
                  <div className="truncate pr-1">
                    <h4
                      className={`text-xs font-medium truncate ${
                        isDark ? "text-slate-200 group-hover:text-indigo-400" : "text-slate-800 group-hover:text-indigo-600"
                      } transition-colors`}
                      title={item.name}
                    >
                      {item.name}
                    </h4>
                    <p className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {item.is_dir ? "Folder" : item.size_formatted}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameTarget(item);
                        setRenameValue(item.name);
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
                      }`}
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isDark ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800" : "text-slate-500 hover:text-rose-600 hover:bg-slate-200/60"
                      }`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================================== */
        /* ENHANCED LIST / COMPACT TABLE VIEW                        */
        /* ======================================================== */
        <div
          className={`border rounded-2xl overflow-hidden shadow-sm transition-colors ${
            isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`border-b font-semibold ${
                  isDark ? "bg-slate-900/70 text-slate-400 border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Modified</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-slate-800/60" : "divide-slate-100"}`}>
                {filteredItems.map((item) => {
                  const ext = (item.ext || "").toLowerCase();
                  const badge = getFormatBadgeStyle(ext);

                  return (
                    <tr
                      key={item.path}
                      onClick={() => {
                        if (item.is_dir) setCurrentPath(item.path);
                        else openQuickLook(item);
                      }}
                      className={`transition-colors cursor-pointer ${
                        isDark ? "hover:bg-slate-800/40" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <div
                          className={`p-1.5 rounded-lg border shrink-0 ${
                            item.is_dir
                              ? "bg-amber-500/10 border-amber-500/20"
                              : isDark
                              ? "bg-slate-800/80 border-slate-700/60"
                              : "bg-slate-100 border-slate-200"
                          }`}
                        >
                          {getFileIcon(item, isDark)}
                        </div>
                        <span
                          className={`font-medium truncate max-w-sm ${
                            isDark ? "text-slate-200" : "text-slate-800"
                          }`}
                        >
                          {item.name}
                        </span>
                      </td>

                      <td className={isDark ? "text-slate-400" : "text-slate-600"}>
                        {item.size_formatted}
                      </td>

                      <td>
                        {item.is_dir ? (
                          <span className="text-slate-500 font-medium">Folder</span>
                        ) : (
                          <span
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                              isDark ? badge.className : badge.lightClass
                            }`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>

                      <td className={isDark ? "text-slate-500" : "text-slate-400"}>
                        {item.mtime}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        {!item.is_dir && (
                          <a
                            href={item.download_url}
                            download
                            className={`inline-block p-1.5 rounded-lg transition-colors ${
                              isDark
                                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setRenameTarget(item);
                            setRenameValue(item.name);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          }`}
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isDark
                              ? "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                              : "text-slate-500 hover:text-rose-600 hover:bg-slate-100"
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* ========================================================= */}
      {/* 4. UNIVERSAL QUICKLOOK INSPECTOR MODAL (RESPONSIVE DIALOG) */}
      {/* ========================================================= */}
      {currentPreviewFile && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8 animate-fadeIn select-none"
          onClick={closeQuickLook}
        >
          <div
            className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all animate-scaleUp ${
              isDark ? "bg-[#0e121d] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar */}
            <div
              className={`px-4 sm:px-5 py-3 border-b flex items-center justify-between gap-3 shrink-0 ${
                isDark ? "border-slate-800/80 bg-slate-900/50" : "border-slate-200 bg-slate-50/80"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div
                  className={`p-2 rounded-xl border shrink-0 ${
                    isDark ? "bg-slate-800/80 border-slate-700/60" : "bg-white border-slate-200 shadow-2xs"
                  }`}
                >
                  {getFileIcon(currentPreviewFile, isDark)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isDark ? "text-slate-100" : "text-slate-900"
                      }`}
                      title={currentPreviewFile.name}
                    >
                      {currentPreviewFile.name}
                    </h3>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border shrink-0 ${
                        isDark
                          ? getFormatBadgeStyle(currentPreviewFile.ext).className
                          : getFormatBadgeStyle(currentPreviewFile.ext).lightClass
                      }`}
                    >
                      {getFormatBadgeStyle(currentPreviewFile.ext).label}
                    </span>
                  </div>
                  <p className={`text-[10px] sm:text-[11px] font-mono mt-0.5 truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    {currentPreviewFile.size_formatted} · {isLocal ? "Local Vault" : "Cloud Drive"}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                {CODE_TEXT_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) && textContent && (
                  <button
                    type="button"
                    onClick={handleCopyTextContent}
                    className={`p-2 rounded-xl text-xs font-mono transition-colors flex items-center space-x-1.5 cursor-pointer border ${
                      copiedText
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : isDark
                        ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Copy File Content"
                  >
                    {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden md:inline">{copiedText ? "Copied!" : "Copy"}</span>
                  </button>
                )}

                {currentPreviewFile.download_url && (
                  <a
                    href={getMediaUrlWithToken(currentPreviewFile.download_url)}
                    target="_blank"
                    rel="noreferrer"
                    className={`p-2 rounded-xl text-xs transition-colors border ${
                      isDark
                        ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Open Original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {currentPreviewFile.download_url && (
                  <a
                    href={getMediaUrlWithToken(currentPreviewFile.download_url)}
                    download={currentPreviewFile.name}
                    className={`p-2 rounded-xl text-xs transition-colors border ${
                      isDark
                        ? "bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300"
                        : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                    }`}
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={closeQuickLook}
                  className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                    isDark
                      ? "bg-slate-800/80 border-slate-700 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 text-slate-400"
                      : "bg-slate-100 border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                  }`}
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Stage Body */}
            <div className={`relative flex-1 min-h-[260px] max-h-[64vh] flex items-center justify-center overflow-auto p-4 sm:p-6 ${
              isDark ? "bg-[#06080e]" : "bg-slate-100/70"
            }`}>
              {/* Image Preview */}
              {IMAGE_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) && currentPreviewFile.download_url && (
                <img
                  src={getMediaUrlWithToken(currentPreviewFile.download_url)}
                  alt={currentPreviewFile.name}
                  className="max-h-[58vh] max-w-full object-contain rounded-lg shadow-md"
                />
              )}

              {/* Video Preview */}
              {VIDEO_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) && currentPreviewFile.download_url && (
                <video
                  src={getMediaUrlWithToken(currentPreviewFile.download_url)}
                  controls
                  autoPlay
                  className="max-h-[58vh] max-w-full rounded-lg shadow-md bg-black"
                />
              )}

              {/* PDF Preview */}
              {PDF_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) && currentPreviewFile.download_url && (
                <iframe
                  src={getMediaUrlWithToken(currentPreviewFile.download_url)}
                  title={currentPreviewFile.name}
                  className="w-full h-[58vh] rounded-lg border-0 bg-white"
                />
              )}

              {/* Code & Text Preview */}
              {CODE_TEXT_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) && (
                <div className="w-full h-full max-h-[58vh] flex flex-col">
                  {loadingText ? (
                    <div className="my-auto flex flex-col items-center justify-center space-y-3 py-12">
                      <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                      <span className="text-xs font-mono text-slate-400">Loading file content...</span>
                    </div>
                  ) : textContent !== null ? (
                    <pre
                      className={`w-full h-full overflow-auto p-4 rounded-xl font-mono text-xs leading-relaxed select-text border ${
                        isDark
                          ? "bg-[#0a0d14] text-indigo-200/90 border-slate-800/80 selection:bg-indigo-500/30"
                          : "bg-white text-slate-800 border-slate-200 selection:bg-indigo-100"
                      }`}
                    >
                      {textContent}
                    </pre>
                  ) : (
                    <div className="my-auto flex flex-col items-center justify-center space-y-2 py-12">
                      <FileText className="w-10 h-10 text-slate-500" />
                      <span className="text-xs font-mono text-slate-400">Empty or unreadable text file</span>
                    </div>
                  )}
                </div>
              )}

              {/* Binary / Other / Archive Fallback */}
              {!IMAGE_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) &&
                !VIDEO_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) &&
                !PDF_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) &&
                !CODE_TEXT_EXTS.has((currentPreviewFile.ext || "").toLowerCase()) && (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-md space-y-4">
                    <div className={`p-4 rounded-2xl border ${
                      isDark ? "bg-slate-800/60 border-slate-700/60" : "bg-white border-slate-200 shadow-sm"
                    }`}>
                      {getFileIcon(currentPreviewFile, isDark)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-1">{currentPreviewFile.name}</h4>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        No inline preview available for this file type. You can download the file to inspect it locally.
                      </p>
                    </div>
                    {currentPreviewFile.download_url && (
                      <a
                        href={getMediaUrlWithToken(currentPreviewFile.download_url)}
                        download={currentPreviewFile.name}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-sm cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download ({currentPreviewFile.size_formatted})</span>
                      </a>
                    )}
                  </div>
                )}

              {/* Prev / Next Navigation Controls */}
              {previewableFiles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickLookIndex((prev) => (prev > 0 ? prev - 1 : previewableFiles.length - 1));
                    }}
                    className="absolute left-2.5 sm:left-4 p-2.5 rounded-full bg-black/60 hover:bg-indigo-600 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg active:scale-90"
                    title="Previous item (←)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickLookIndex((prev) => (prev < previewableFiles.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-2.5 sm:right-4 p-2.5 rounded-full bg-black/60 hover:bg-indigo-600 text-white backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-lg active:scale-90"
                    title="Next item (→)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Footer Bar */}
            <div
              className={`px-4 sm:px-5 py-2.5 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
                isDark ? "border-slate-800/80 bg-slate-900/40 text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-500"
              }`}
            >
              <span>
                {quickLookIndex + 1} of {previewableFiles.length} items
              </span>
              <span className="hidden sm:inline text-slate-500">
                Tip: Use ← / → to browse, Esc to close
              </span>
              <span>
                {currentPreviewFile.mtime}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 5. CREATE FOLDER MODAL */}
      {isCreateFolderOpen && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleUp ${
              isDark ? "bg-[#0f1422] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              {language === "id" ? "Buat Folder Baru" : "Create New Folder"}
            </h3>
            <p className={`text-xs font-mono mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {language === "id" ? "Lokasi:" : "Inside:"} <code className="text-indigo-400 font-semibold">{currentPath || (isLocal ? (t("storage_tab_local") || "Local Vault") : (t("storage_tab_cloud") || "Cloud Drive"))}</code>
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder={language === "id" ? "Nama folder (misal: Liburan, Proyek, Musik)" : "Folder name (e.g. Vacation, Projects, Music)"}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                }`}
              />
              <div className="flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderOpen(false)}
                  className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {t("create") || "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 6. RENAME MODAL */}
      {renameTarget && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleUp ${
              isDark ? "bg-[#0f1422] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-indigo-400" />
              {language === "id" ? "Ubah Nama Berkas/Folder" : "Rename Item"}
            </h3>
            <p className={`text-xs font-mono mb-4 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {language === "id" ? "Nama saat ini:" : "Current name:"} <span className="font-semibold text-indigo-400">{renameTarget.name}</span>
            </p>

            <form onSubmit={handleRename} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder={language === "id" ? "Ketik nama baru" : "Enter new name"}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 ${
                  isDark
                    ? "bg-slate-900 border-slate-700 text-slate-100"
                    : "bg-slate-50 border-slate-200 text-slate-900"
                }`}
              />
              <div className="flex justify-end gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setRenameTarget(null)}
                  className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={!renameValue.trim()}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {t("save") || "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deleteTarget && createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={`border rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-scaleUp ${
              isDark ? "bg-[#0f1422] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">{t("storage_delete_confirm_title") || "Delete Item"}</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {t("storage_delete_confirm_desc") || "This action cannot be undone."}
                </p>
              </div>
            </div>

            <p className={`text-xs mb-5 font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              {language === "id" ? "Apakah kamu yakin ingin menghapus " : "Are you sure you want to delete "}
              <strong className="text-rose-500 font-semibold">"{deleteTarget.name}"</strong>?
            </p>

            <div className="flex justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className={`px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                  isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
              >
                {t("delete") || "Delete"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
