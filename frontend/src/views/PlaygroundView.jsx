import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Layers,
  Copy,
  Check,
  Code2,
  Eye,
  Sliders,
  MousePointerClick,
  Layout,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Zap,
  Star,
  Flame,
  ArrowRight,
  Bell,
  Search,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { playClickSound, playSuccessSound } from '../utils/soundEffects';

const DESIGN_ARCHETYPES = [
  {
    id: 'minimal-saas',
    name: 'Minimalist SaaS',
    subtitle: 'Slate / Zinc • Inter • Clean Modern Architecture',
    accentColor: 'indigo',
    palette: {
      primary: '#6366f1',
      secondary: '#475569',
      bg: '#0f172a',
      surface: '#1e293b',
      border: 'border-slate-800',
    },
    badge: 'Standard Default',
  },
  {
    id: 'fintech-pro',
    name: 'Fintech & Data High-Density',
    subtitle: 'Emerald / Cyan • JetBrains Mono • High Legibility',
    accentColor: 'emerald',
    palette: {
      primary: '#10b981',
      secondary: '#06b6d4',
      bg: '#061a14',
      surface: '#0d281e',
      border: 'border-emerald-900/60',
    },
    badge: 'Data Intensive',
  },
  {
    id: 'neo-spatial',
    name: 'Neo-Spatial Cyberpunk',
    subtitle: 'Violet / Fuchsia • Glassmorphism • Glow & Depth',
    accentColor: 'violet',
    palette: {
      primary: '#8b5cf6',
      secondary: '#d946ef',
      bg: '#0f0c1b',
      surface: '#18132b',
      border: 'border-violet-800/60',
    },
    badge: 'Creative & Dynamic',
  },
  {
    id: 'warm-editorial',
    name: 'Warm Editorial & Craft',
    subtitle: 'Amber / Rose • Soft Warmth • High Elegance',
    accentColor: 'amber',
    palette: {
      primary: '#f59e0b',
      secondary: '#f43f5e',
      bg: '#1c1917',
      surface: '#292524',
      border: 'border-stone-800',
    },
    badge: 'High Taste',
  },
];

const COMPONENT_CATEGORIES = ['All', 'Buttons', 'Cards & Surfaces', 'Inputs & Controls', 'Badges & Status'];

export function PlaygroundView({ isDark = true }) {
  const { showToast } = useToast();
  const [activeArchetype, setActiveArchetype] = useState(DESIGN_ARCHETYPES[0]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [activeToggle, setActiveToggle] = useState(true);
  const [activeSegment, setActiveSegment] = useState('Daily');
  const [sliderVal, setSliderVal] = useState(75);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleCopyCode = (id, codeSnippet, name) => {
    navigator.clipboard.writeText(codeSnippet);
    setCopiedCodeId(id);
    playSuccessSound();
    showToast(`Code for ${name} copied to clipboard!`, 'success');
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2500);
  };

  const handleSimulateAction = () => {
    playClickSound();
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      playSuccessSound();
      showToast('Interactive micro-interaction triggered successfully!', 'success');
    }, 800);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20 font-sans animate-fadeIn select-none">
      {/* 1. Header Banner */}
      <section
        className={`rounded-3xl p-6 sm:p-8 border relative overflow-hidden transition-all duration-300 ${
          isDark
            ? 'bg-gradient-to-br from-[#0c0f1d] via-[#101426] to-[#0a0d18] border-slate-800/80 shadow-2xl'
            : 'bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border-slate-200 shadow-sm'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span>Zero-Slop Design Engineering</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Design Playground & Component Gallery</h1>
            <p className="text-sm max-w-2xl text-slate-400">
              Koleksi komponen UI interaktif berstandar industri (*high-taste, anti-slop*) yang dioptimalkan untuk performa tinggi. Pilih archetype gaya, uji interaksi, dan langsung salin kodenya.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                const dnaText = `/* Design DNA Snapshot - ${activeArchetype.name} */\nPrimary: ${activeArchetype.palette.primary}\nSecondary: ${activeArchetype.palette.secondary}\nSurface: ${activeArchetype.palette.surface}\nBorder: ${activeArchetype.palette.border}`;
                handleCopyCode('dna-full', dnaText, 'Design DNA Token');
              }}
              className="px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center space-x-2 transition-all bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95"
            >
              <Palette className="w-4 h-4" />
              <span>Export Design DNA</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Archetype Selector Matrix */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold tracking-wider uppercase text-slate-400 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Active Design Archetype</span>
          </h2>
          <span className="text-xs text-slate-500">Pilih palet & standar visual</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DESIGN_ARCHETYPES.map((arch) => {
            const isSelected = activeArchetype.id === arch.id;
            return (
              <div
                key={arch.id}
                onClick={() => {
                  playClickSound();
                  setActiveArchetype(arch);
                }}
                className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
                  isSelected
                    ? isDark
                      ? 'bg-[#13182b] border-indigo-500/70 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30'
                      : 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : isDark
                    ? 'bg-[#0d101c] border-slate-800 hover:border-slate-700 hover:bg-[#111627]'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: arch.palette.primary }}
                    />
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: arch.palette.secondary }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {arch.badge}
                  </span>
                </div>
                <div className="font-semibold text-sm mb-1">{arch.name}</div>
                <div className="text-xs text-slate-400 line-clamp-2">{arch.subtitle}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Category Filter Tabs */}
      <section className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {COMPONENT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              playClickSound();
              setActiveCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isDark
                ? 'bg-[#0e121d] border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* 4. Interactive Components Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Component 1: Action Buttons Showcase */}
        {(activeCategory === 'All' || activeCategory === 'Buttons') && (
          <div
            className={`p-6 rounded-2xl border space-y-5 transition-all ${
              isDark ? 'bg-[#0d101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center space-x-2">
                <MousePointerClick className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm">Interactive Button Family</h3>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    'btn-code',
                    `<button className="px-4 py-2.5 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95 transition-all">\n  Primary Action\n</button>`,
                    'Primary Button'
                  )
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy JSX Snippet"
              >
                {copiedCodeId === 'btn-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={handleSimulateAction}
                disabled={buttonLoading}
                className="px-4 py-2.5 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 active:scale-95 transition-all flex items-center space-x-2"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{buttonLoading ? 'Processing...' : 'Primary Action'}</span>
              </button>

              <button
                onClick={playClickSound}
                className={`px-4 py-2.5 rounded-xl font-medium text-xs border transition-all active:scale-95 ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
              >
                Secondary Subtle
              </button>

              <button
                onClick={playClickSound}
                className="px-4 py-2.5 rounded-xl font-medium text-xs border border-dashed border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10 active:scale-95 transition-all"
              >
                Dashed Ghost
              </button>
            </div>
          </div>
        )}

        {/* Component 2: High-Density Metric Card */}
        {(activeCategory === 'All' || activeCategory === 'Cards & Surfaces') && (
          <div
            className={`p-6 rounded-2xl border space-y-4 transition-all ${
              isDark ? 'bg-[#0d101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center space-x-2">
                <Layout className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm">Telemetry Metric Card</h3>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    'metric-card',
                    `<div className="p-4 rounded-xl border bg-slate-900/80 border-slate-800 flex items-center justify-between">\n  <div>\n    <div className="text-xs text-slate-400">Memory Usage</div>\n    <div className="text-xl font-bold font-mono">1.4 GB / 8 GB</div>\n  </div>\n  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">+2.4%</div>\n</div>`,
                    'Metric Card'
                  )
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy JSX Snippet"
              >
                {copiedCodeId === 'metric-card' ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4" />}
              </button>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                isDark ? 'bg-[#121626] border-slate-800/90' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Memory Allocation</span>
                <div className="text-xl font-bold font-mono mt-0.5">1.42 GB <span className="text-xs text-slate-500 font-sans font-normal">/ 8 GB</span></div>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                NORMAL
              </div>
            </div>
          </div>
        )}

        {/* Component 3: Modern Inputs & Segmented Controls */}
        {(activeCategory === 'All' || activeCategory === 'Inputs & Controls') && (
          <div
            className={`p-6 rounded-2xl border space-y-5 transition-all ${
              isDark ? 'bg-[#0d101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm">Inputs & Segmented Controls</h3>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    'input-code',
                    `<div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">\n  {['Daily', 'Weekly', 'Monthly'].map(item => (\n    <button className="flex-1 py-1.5 rounded-lg text-xs font-medium font-sans">{item}</button>\n  ))}\n</div>`,
                    'Segmented Control'
                  )
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy JSX Snippet"
              >
                {copiedCodeId === 'input-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Segmented Switcher */}
            <div
              className={`p-1 rounded-xl border flex items-center ${
                isDark ? 'bg-[#121626] border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {['Daily', 'Weekly', 'Monthly', 'Annual'].map((segment) => (
                <button
                  key={segment}
                  onClick={() => {
                    playClickSound();
                    setActiveSegment(segment);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeSegment === segment
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {segment}
                </button>
              ))}
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-medium text-slate-300">Auto-Sync Second Brain</span>
              <button
                onClick={() => {
                  playClickSound();
                  setActiveToggle(!activeToggle);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  activeToggle ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    activeToggle ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Component 4: Status Badges & Pills */}
        {(activeCategory === 'All' || activeCategory === 'Badges & Status') && (
          <div
            className={`p-6 rounded-2xl border space-y-4 transition-all ${
              isDark ? 'bg-[#0d101c] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-800/60">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-sm">Status Badges & Tokens</h3>
              </div>
              <button
                onClick={() =>
                  handleCopyCode(
                    'badge-code',
                    `<span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">\n  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />\n  <span>ONLINE</span>\n</span>`,
                    'Status Badge'
                  )
                }
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Copy JSX Snippet"
              >
                {copiedCodeId === 'badge-code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Code2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE 24/7</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>DEGRADED</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>OFFLINE</span>
              </span>

              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <span>⚡ AGY CLUSTER</span>
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
