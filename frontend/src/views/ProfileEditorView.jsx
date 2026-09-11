import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Layers,
  Server,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Cpu,
  Database,
  Cloud,
  ChevronRight
} from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";

export function ProfileEditorView() {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("vitals");
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch initial profile data
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getProfile();
      if (res && res.data) {
        setProfile(res.data);
        setHasChanges(false);
      }
    } catch (err) {
      showToast(err.message || "Gagal memuat data profil", "error", "Profile Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Save
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await api.updateProfile(profile);
      if (res && res.data) {
        setProfile(res.data);
        setHasChanges(false);
        showToast("Data profil dan CV berhasil diperbarui secara live!", "success", "Tersimpan");
      }
    } catch (err) {
      showToast(err.message || "Gagal menyimpan perubahan", "error", "Save Error");
    } finally {
      setSaving(false);
    }
  };

  // Handle Reset
  const handleReset = async () => {
    if (!confirm("Apakah kamu yakin ingin mengembalikan data profil ke default bawaan awal?")) return;
    setSaving(true);
    try {
      const res = await api.resetProfile();
      if (res && res.data) {
        setProfile(res.data);
        setHasChanges(false);
        showToast("Data profil berhasil di-reset ke default", "info", "Reset Berhasil");
      }
    } catch (err) {
      showToast(err.message || "Gagal me-reset data profil", "error", "Reset Error");
    } finally {
      setSaving(false);
    }
  };

  const updateVitals = (key, val) => {
    setProfile((prev) => ({ ...prev, [key]: val }));
    setHasChanges(true);
  };

  const updateNested = (parentKey, subKey, val) => {
    setProfile((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [subKey]: val,
      },
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono text-zinc-400">Memuat editor profil & portfolio...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center space-y-4 bg-[#121215] border border-zinc-800 rounded-xl">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-zinc-300">Gagal memuat data profil.</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const SUB_TABS = [
    { id: "vitals", label: "📞 Kontak & Vitals", icon: User },
    { id: "highlights", label: "🌟 Pilar Eksekutif", icon: Sparkles },
    { id: "metrics", label: "📊 Metrik Kunci", icon: ShieldCheck },
    { id: "skills", label: "⚡ Keahlian & Tech Stack", icon: Cpu },
    { id: "experiences", label: "💼 Pengalaman Kerja", icon: Briefcase },
    { id: "education_projects", label: "🎓 Pendidikan & Proyek", icon: GraduationCap },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Banner & Actions Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl bg-[#121215] border border-zinc-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
              Profile & Portfolio CMS Editor
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Kelola data profil, kontak, keahlian, dan riwayat karir yang tampil di{" "}
            <a
              href="https://arusuka.my.id"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline font-mono inline-flex items-center gap-1"
            >
              https://arusuka.my.id <ExternalLink className="w-2.5 h-2.5" />
            </a>{" "}
            secara langsung dan real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 text-xs font-medium transition-all flex items-center space-x-1.5"
            title="Kembalikan ke data default bawaan awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          <a
            href="https://arusuka.my.id"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Lihat Live Web</span>
            <ExternalLink className="w-3 h-3 text-zinc-500" />
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Save className="w-4 h-4 text-white" />
            )}
            <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center space-x-1.5 bg-[#121215] border border-zinc-800 p-1.5 rounded-xl overflow-x-auto custom-scrollbar">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center space-x-2 whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Panels */}
      <div className="space-y-6">
        {/* ================= TAB 1: VITALS & KONTAK ================= */}
        {activeSubTab === "vitals" && (
          <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2 pb-3 border-b border-zinc-800">
              <User className="w-4 h-4 text-emerald-400" />
              <span>Identitas & Informasi Kontak Utama</span>
            </h3>

            {/* Basic Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Nama Lengkap</label>
                <input
                  type="text"
                  value={profile.name || ""}
                  onChange={(e) => updateVitals("name", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Alias / Nickname</label>
                <input
                  type="text"
                  value={profile.alias || ""}
                  onChange={(e) => updateVitals("alias", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Title / Jabatan</label>
                <input
                  type="text"
                  value={profile.title || ""}
                  onChange={(e) => updateVitals("title", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Lokasi</label>
                <input
                  type="text"
                  value={profile.location || ""}
                  onChange={(e) => updateVitals("location", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Status Ketersediaan (EN)</label>
                <input
                  type="text"
                  value={profile.availability?.status || ""}
                  onChange={(e) => updateNested("availability", "status", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Status Ketersediaan (ID)</label>
                <input
                  type="text"
                  value={profile.availability?.statusId || ""}
                  onChange={(e) => updateNested("availability", "statusId", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Direct Contact Links */}
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 pt-3 border-t border-zinc-800/80">
              Link Kontak & Media Sosial
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nomor Telepon</span>
                </label>
                <input
                  type="text"
                  value={profile.contact?.phone || ""}
                  onChange={(e) => updateNested("contact", "phone", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Alamat Email</span>
                </label>
                <input
                  type="email"
                  value={profile.contact?.email || ""}
                  onChange={(e) => updateNested("contact", "email", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium flex items-center space-x-1.5">
                  <span className="text-emerald-400 font-bold">WA</span>
                  <span>WhatsApp Direct URL</span>
                </label>
                <input
                  type="text"
                  value={profile.contact?.whatsapp || ""}
                  onChange={(e) => updateNested("contact", "whatsapp", e.target.value)}
                  placeholder="https://wa.me/62821..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium flex items-center space-x-1.5">
                  <span className="text-blue-400 font-bold">in</span>
                  <span>LinkedIn URL</span>
                </label>
                <input
                  type="text"
                  value={profile.contact?.linkedin || ""}
                  onChange={(e) => updateNested("contact", "linkedin", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium flex items-center space-x-1.5">
                  <span className="text-zinc-300 font-bold">GH</span>
                  <span>GitHub URL</span>
                </label>
                <input
                  type="text"
                  value={profile.contact?.github || ""}
                  onChange={(e) => updateNested("contact", "github", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium flex items-center space-x-1.5">
                  <span className="text-sky-400 font-bold">TG</span>
                  <span>Telegram URL</span>
                </label>
                <input
                  type="text"
                  value={profile.contact?.telegram || ""}
                  onChange={(e) => updateNested("contact", "telegram", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Headline & Summary Lead */}
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 pt-3 border-t border-zinc-800/80">
              Headline & Lead Summary (Bilingual)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Headline (English)</label>
                <textarea
                  rows={2}
                  value={profile.headline?.en || ""}
                  onChange={(e) => updateNested("headline", "en", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Headline (Indonesia)</label>
                <textarea
                  rows={2}
                  value={profile.headline?.id || ""}
                  onChange={(e) => updateNested("headline", "id", e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Summary Lead (English)</label>
                <textarea
                  rows={3}
                  value={profile.summary?.lead?.en || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      summary: {
                        ...(prev.summary || {}),
                        lead: { ...(prev.summary?.lead || {}), en: e.target.value },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-medium">Summary Lead (Indonesia)</label>
                <textarea
                  rows={3}
                  value={profile.summary?.lead?.id || ""}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      summary: {
                        ...(prev.summary || {}),
                        lead: { ...(prev.summary?.lead || {}), id: e.target.value },
                      },
                    }))
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: HIGHLIGHTS (4 PILLARS) ================= */}
        {activeSubTab === "highlights" && (
          <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pilar Eksekutif & Sorotan Keahlian (4 Pillar Cards)</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(profile.summary?.highlights || []).map((h, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Pilar #{idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Icon: {h.icon}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-zinc-400">Judul (EN)</label>
                      <input
                        type="text"
                        value={h.titleEn || ""}
                        onChange={(e) => {
                          const updated = [...profile.summary.highlights];
                          updated[idx].titleEn = e.target.value;
                          setProfile((prev) => ({
                            ...prev,
                            summary: { ...prev.summary, highlights: updated },
                          }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Judul (ID)</label>
                      <input
                        type="text"
                        value={h.titleId || ""}
                        onChange={(e) => {
                          const updated = [...profile.summary.highlights];
                          updated[idx].titleId = e.target.value;
                          setProfile((prev) => ({
                            ...prev,
                            summary: { ...prev.summary, highlights: updated },
                          }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Deskripsi (EN)</label>
                      <textarea
                        rows={2}
                        value={h.descEn || ""}
                        onChange={(e) => {
                          const updated = [...profile.summary.highlights];
                          updated[idx].descEn = e.target.value;
                          setProfile((prev) => ({
                            ...prev,
                            summary: { ...prev.summary, highlights: updated },
                          }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-zinc-400">Deskripsi (ID)</label>
                      <textarea
                        rows={2}
                        value={h.descId || ""}
                        onChange={(e) => {
                          const updated = [...profile.summary.highlights];
                          updated[idx].descId = e.target.value;
                          setProfile((prev) => ({
                            ...prev,
                            summary: { ...prev.summary, highlights: updated },
                          }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:border-zinc-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: KEY METRICS ================= */}
        {activeSubTab === "metrics" && (
          <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span>Metrik Utama & Statistik Karir</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(profile.keyMetrics || []).map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <span className="text-xs font-mono font-bold text-sky-400">Stat #{idx + 1}</span>
                  <div className="space-y-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-zinc-400">Nilai (Angka/Stat)</label>
                      <input
                        type="text"
                        value={m.value || ""}
                        onChange={(e) => {
                          const updated = [...profile.keyMetrics];
                          updated[idx].value = e.target.value;
                          setProfile((prev) => ({ ...prev, keyMetrics: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400">Label (EN)</label>
                      <input
                        type="text"
                        value={m.labelEn || ""}
                        onChange={(e) => {
                          const updated = [...profile.keyMetrics];
                          updated[idx].labelEn = e.target.value;
                          setProfile((prev) => ({ ...prev, keyMetrics: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400">Label (ID)</label>
                      <input
                        type="text"
                        value={m.labelId || ""}
                        onChange={(e) => {
                          const updated = [...profile.keyMetrics];
                          updated[idx].labelId = e.target.value;
                          setProfile((prev) => ({ ...prev, keyMetrics: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400">Highlight Tag</label>
                      <input
                        type="text"
                        value={m.highlight || ""}
                        onChange={(e) => {
                          const updated = [...profile.keyMetrics];
                          updated[idx].highlight = e.target.value;
                          setProfile((prev) => ({ ...prev, keyMetrics: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: SKILLS & CATEGORIES ================= */}
        {activeSubTab === "skills" && (
          <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Matriks Keahlian & Kategori Tech Stack</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Kelola kategori teknologi dan daftar skill yang dikuasai.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newCat = {
                    nameEn: "New Category",
                    nameId: "Kategori Baru",
                    icon: "Server",
                    skills: [{ name: "Skill Name", level: "Advanced", desc: "Short description" }],
                  };
                  setProfile((prev) => ({
                    ...prev,
                    skillCategories: [...(prev.skillCategories || []), newCat],
                  }));
                  setHasChanges(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kategori</span>
              </button>
            </div>

            <div className="space-y-6">
              {(profile.skillCategories || []).map((cat, catIdx) => (
                <div key={catIdx} className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/70">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                      <input
                        type="text"
                        value={cat.nameEn || ""}
                        onChange={(e) => {
                          const updated = [...profile.skillCategories];
                          updated[catIdx].nameEn = e.target.value;
                          setProfile((prev) => ({ ...prev, skillCategories: updated }));
                          setHasChanges(true);
                        }}
                        placeholder="Category Name (EN)"
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-100"
                      />
                      <input
                        type="text"
                        value={cat.nameId || ""}
                        onChange={(e) => {
                          const updated = [...profile.skillCategories];
                          updated[catIdx].nameId = e.target.value;
                          setProfile((prev) => ({ ...prev, skillCategories: updated }));
                          setHasChanges(true);
                        }}
                        placeholder="Nama Kategori (ID)"
                        className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus kategori "${cat.nameEn}"?`)) {
                          const updated = profile.skillCategories.filter((_, idx) => idx !== catIdx);
                          setProfile((prev) => ({ ...prev, skillCategories: updated }));
                          setHasChanges(true);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Skill Items in Category */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">Daftar Skill:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...profile.skillCategories];
                          updated[catIdx].skills.push({
                            name: "New Skill",
                            level: "Advanced",
                            desc: "Skill description",
                          });
                          setProfile((prev) => ({ ...prev, skillCategories: updated }));
                          setHasChanges(true);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Item Skill</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(cat.skills || []).map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-start justify-between gap-2"
                        >
                          <div className="space-y-1.5 flex-1 text-xs">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={s.name || ""}
                                onChange={(e) => {
                                  const updated = [...profile.skillCategories];
                                  updated[catIdx].skills[sIdx].name = e.target.value;
                                  setProfile((prev) => ({ ...prev, skillCategories: updated }));
                                  setHasChanges(true);
                                }}
                                placeholder="Skill Name"
                                className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded font-bold text-zinc-100 flex-1"
                              />
                              <select
                                value={s.level || "Advanced"}
                                onChange={(e) => {
                                  const updated = [...profile.skillCategories];
                                  updated[catIdx].skills[sIdx].level = e.target.value;
                                  setProfile((prev) => ({ ...prev, skillCategories: updated }));
                                  setHasChanges(true);
                                }}
                                className="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-emerald-400 font-mono text-[11px]"
                              >
                                <option value="Expert">Expert</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Proficient">Proficient</option>
                                <option value="Intermediate">Intermediate</option>
                              </select>
                            </div>
                            <input
                              type="text"
                              value={s.desc || ""}
                              onChange={(e) => {
                                const updated = [...profile.skillCategories];
                                updated[catIdx].skills[sIdx].desc = e.target.value;
                                setProfile((prev) => ({ ...prev, skillCategories: updated }));
                                setHasChanges(true);
                              }}
                              placeholder="Deskripsi singkat penggunaan"
                              className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-400"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...profile.skillCategories];
                              updated[catIdx].skills = updated[catIdx].skills.filter(
                                (_, idx) => idx !== sIdx
                              );
                              setProfile((prev) => ({ ...prev, skillCategories: updated }));
                              setHasChanges(true);
                            }}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: WORK EXPERIENCES ================= */}
        {activeSubTab === "experiences" && (
          <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>Riwayat Pengalaman Kerja Profesional</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Kelola riwayat perusahaan, role, modul fitur, link sistem, dan tech stack.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newExp = {
                    company: "Company Name",
                    role: "Software Engineer",
                    period: "2024 – Present",
                    location: "Surabaya, Indonesia",
                    type: "Full-time",
                    highlightEn: "Key engineering accomplishments",
                    highlightId: "Pencapaian rekayasa utama",
                    platformUrl: "",
                    modules: [
                      {
                        title: "Core Service",
                        descEn: "Engineered high-scale systems",
                        descId: "Membangun sistem skala tinggi",
                      },
                    ],
                    techStack: ["PHP", "Go", "PostgreSQL"],
                  };
                  setProfile((prev) => ({
                    ...prev,
                    experiences: [newExp, ...(prev.experiences || [])],
                  }));
                  setHasChanges(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center space-x-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pengalaman</span>
              </button>
            </div>

            <div className="space-y-6">
              {(profile.experiences || []).map((exp, expIdx) => (
                <div key={expIdx} className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-4">
                  <div className="flex items-start justify-between gap-4 pb-3 border-b border-zinc-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 text-xs">
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-medium">Perusahaan</label>
                        <input
                          type="text"
                          value={exp.company || ""}
                          onChange={(e) => {
                            const updated = [...profile.experiences];
                            updated[expIdx].company = e.target.value;
                            setProfile((prev) => ({ ...prev, experiences: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400 font-medium">Role / Posisi</label>
                        <input
                          type="text"
                          value={exp.role || ""}
                          onChange={(e) => {
                            const updated = [...profile.experiences];
                            updated[expIdx].role = e.target.value;
                            setProfile((prev) => ({ ...prev, experiences: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-emerald-400 font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400 font-medium">Periode Kerja</label>
                        <input
                          type="text"
                          value={exp.period || ""}
                          onChange={(e) => {
                            const updated = [...profile.experiences];
                            updated[expIdx].period = e.target.value;
                            setProfile((prev) => ({ ...prev, experiences: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 font-mono text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-zinc-400 font-medium">Website / Platform URL</label>
                        <input
                          type="text"
                          value={exp.platformUrl || exp.url || ""}
                          onChange={(e) => {
                            const updated = [...profile.experiences];
                            updated[expIdx].platformUrl = e.target.value;
                            updated[expIdx].url = e.target.value;
                            setProfile((prev) => ({ ...prev, experiences: updated }));
                            setHasChanges(true);
                          }}
                          placeholder="https://panel.cloudraya.com/"
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 font-mono text-[11px]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Hapus pengalaman di "${exp.company}"?`)) {
                          const updated = profile.experiences.filter((_, idx) => idx !== expIdx);
                          setProfile((prev) => ({ ...prev, experiences: updated }));
                          setHasChanges(true);
                        }
                      }}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Hapus Pengalaman"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-zinc-400">Ringkasan Utama (EN)</label>
                      <textarea
                        rows={2}
                        value={exp.highlightEn || ""}
                        onChange={(e) => {
                          const updated = [...profile.experiences];
                          updated[expIdx].highlightEn = e.target.value;
                          setProfile((prev) => ({ ...prev, experiences: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 resize-none text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-zinc-400">Ringkasan Utama (ID)</label>
                      <textarea
                        rows={2}
                        value={exp.highlightId || ""}
                        onChange={(e) => {
                          const updated = [...profile.experiences];
                          updated[expIdx].highlightId = e.target.value;
                          setProfile((prev) => ({ ...prev, experiences: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 resize-none text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Modules */}
                  <div className="space-y-2 pt-2 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-zinc-400">Modul & Fitur Proyek:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...profile.experiences];
                          if (!updated[expIdx].modules) updated[expIdx].modules = [];
                          updated[expIdx].modules.push({
                            title: "New Module",
                            descEn: "Module description",
                            descId: "Deskripsi modul",
                          });
                          setProfile((prev) => ({ ...prev, experiences: updated }));
                          setHasChanges(true);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Tambah Modul</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {(exp.modules || []).map((m, mIdx) => (
                        <div key={mIdx} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={m.title || ""}
                              onChange={(e) => {
                                const updated = [...profile.experiences];
                                updated[expIdx].modules[mIdx].title = e.target.value;
                                setProfile((prev) => ({ ...prev, experiences: updated }));
                                setHasChanges(true);
                              }}
                              placeholder="Module Title"
                              className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded font-bold text-zinc-100 flex-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...profile.experiences];
                                updated[expIdx].modules = updated[expIdx].modules.filter(
                                  (_, idx) => idx !== mIdx
                                );
                                setProfile((prev) => ({ ...prev, experiences: updated }));
                                setHasChanges(true);
                              }}
                              className="p-1 text-zinc-500 hover:text-rose-400 ml-2"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={m.descEn || ""}
                            onChange={(e) => {
                              const updated = [...profile.experiences];
                              updated[expIdx].modules[mIdx].descEn = e.target.value;
                              setProfile((prev) => ({ ...prev, experiences: updated }));
                              setHasChanges(true);
                            }}
                            placeholder="Desc (EN)"
                            className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-300 resize-none"
                          />
                          <textarea
                            rows={2}
                            value={m.descId || ""}
                            onChange={(e) => {
                              const updated = [...profile.experiences];
                              updated[expIdx].modules[mIdx].descId = e.target.value;
                              setProfile((prev) => ({ ...prev, experiences: updated }));
                              setHasChanges(true);
                            }}
                            placeholder="Deskripsi (ID)"
                            className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-300 resize-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tech Stack Comma String */}
                  <div className="space-y-1 pt-2 border-t border-zinc-900 text-xs">
                    <label className="text-zinc-400 font-medium">Tech Stack (Pisahkan dengan koma):</label>
                    <input
                      type="text"
                      value={Array.isArray(exp.techStack) ? exp.techStack.join(", ") : exp.techStack || ""}
                      onChange={(e) => {
                        const updated = [...profile.experiences];
                        updated[expIdx].techStack = e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setProfile((prev) => ({ ...prev, experiences: updated }));
                        setHasChanges(true);
                      }}
                      className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-200 text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: EDUCATION & PROJECTS ================= */}
        {activeSubTab === "education_projects" && (
          <div className="space-y-6">
            {/* Featured Projects */}
            <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span>Proyek Arsitektur Unggulan (Featured Projects)</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newProj = {
                      title: "Project Title",
                      tagline: "High-Performance System",
                      role: "Lead Architect",
                      descEn: "Project architecture and impact",
                      descId: "Deskripsi arsitektur dan dampak proyek",
                      tech: ["Laravel", "PostgreSQL", "Docker"],
                      badge: "Production Platform",
                      link: "",
                    };
                    setProfile((prev) => ({
                      ...prev,
                      projects: [...(prev.projects || []), newProj],
                    }));
                    setHasChanges(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Proyek</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(profile.projects || []).map((proj, pIdx) => (
                  <div key={pIdx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={proj.badge || ""}
                        onChange={(e) => {
                          const updated = [...profile.projects];
                          updated[pIdx].badge = e.target.value;
                          setProfile((prev) => ({ ...prev, projects: updated }));
                          setHasChanges(true);
                        }}
                        placeholder="Badge"
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono text-zinc-400"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus proyek "${proj.title}"?`)) {
                            const updated = profile.projects.filter((_, idx) => idx !== pIdx);
                            setProfile((prev) => ({ ...prev, projects: updated }));
                            setHasChanges(true);
                          }
                        }}
                        className="p-1 text-zinc-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={proj.title || ""}
                        onChange={(e) => {
                          const updated = [...profile.projects];
                          updated[pIdx].title = e.target.value;
                          setProfile((prev) => ({ ...prev, projects: updated }));
                          setHasChanges(true);
                        }}
                        placeholder="Project Title"
                        className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded font-bold text-zinc-100"
                      />
                      <input
                        type="text"
                        value={proj.tagline || ""}
                        onChange={(e) => {
                          const updated = [...profile.projects];
                          updated[pIdx].tagline = e.target.value;
                          setProfile((prev) => ({ ...prev, projects: updated }));
                          setHasChanges(true);
                        }}
                        placeholder="Tagline"
                        className="w-full px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] text-zinc-400"
                      />
                      <input
                        type="text"
                        value={proj.link || ""}
                        onChange={(e) => {
                          const updated = [...profile.projects];
                          updated[pIdx].link = e.target.value;
                          setProfile((prev) => ({ ...prev, projects: updated }));
                          setHasChanges(true);
                        }}
                        placeholder="Live URL (optional)"
                        className="w-full px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[10px] text-emerald-400"
                      />
                    </div>

                    <textarea
                      rows={2}
                      value={proj.descEn || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[pIdx].descEn = e.target.value;
                        setProfile((prev) => ({ ...prev, projects: updated }));
                        setHasChanges(true);
                      }}
                      placeholder="Desc (EN)"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] text-zinc-300 resize-none"
                    />
                    <textarea
                      rows={2}
                      value={proj.descId || ""}
                      onChange={(e) => {
                        const updated = [...profile.projects];
                        updated[pIdx].descId = e.target.value;
                        setProfile((prev) => ({ ...prev, projects: updated }));
                        setHasChanges(true);
                      }}
                      placeholder="Deskripsi (ID)"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-[11px] text-zinc-300 resize-none"
                    />

                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 font-mono">Tech Stack (koma):</label>
                      <input
                        type="text"
                        value={Array.isArray(proj.tech) ? proj.tech.join(", ") : proj.tech || ""}
                        onChange={(e) => {
                          const updated = [...profile.projects];
                          updated[pIdx].tech = e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          setProfile((prev) => ({ ...prev, projects: updated }));
                          setHasChanges(true);
                        }}
                        className="w-full px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded font-mono text-[10px] text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education History */}
            <div className="rounded-xl bg-[#121215] border border-zinc-800 p-6 space-y-6 shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-100 flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4 text-sky-400" />
                  <span>Riwayat Pendidikan (Education)</span>
                </h3>
              </div>

              <div className="space-y-4">
                {(profile.education || []).map((edu, eduIdx) => (
                  <div key={eduIdx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Institusi / Universitas</label>
                        <input
                          type="text"
                          value={edu.institution || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].institution = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Gelar & Jurusan (EN)</label>
                        <input
                          type="text"
                          value={edu.degreeEn || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].degreeEn = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Gelar & Jurusan (ID)</label>
                        <input
                          type="text"
                          value={edu.degreeId || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].degreeId = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Periode</label>
                        <input
                          type="text"
                          value={edu.period || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].period = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded font-mono text-zinc-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Lokasi</label>
                        <input
                          type="text"
                          value={edu.location || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].location = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-300"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-zinc-400">Deskripsi Fokus (EN)</label>
                        <textarea
                          rows={2}
                          value={edu.descEn || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].descEn = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 resize-none text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400">Deskripsi Fokus (ID)</label>
                        <textarea
                          rows={2}
                          value={edu.descId || ""}
                          onChange={(e) => {
                            const updated = [...profile.education];
                            updated[eduIdx].descId = e.target.value;
                            setProfile((prev) => ({ ...prev, education: updated }));
                            setHasChanges(true);
                          }}
                          className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 resize-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
