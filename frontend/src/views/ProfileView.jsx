import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  User,
  Briefcase,
  Layers,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  MapPin,
  Mail,
  Phone,
  Globe,
  Send,
  RefreshCw,
  Edit3,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Server,
  Database,
  Cloud,
  ShieldCheck,
  Code2,
  Cpu,
  ArrowUpRight,
  Printer,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Save,
  Radio,
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Sliders,
  Settings,
  Link as LinkIcon,
  Download,
  Loader2,
} from "lucide-react";
import { api } from "../api";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { motion, AnimatePresence } from "motion/react";

function LinkedInIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.22a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

// Fallback initial data in case API or DB is cold starting
const INITIAL_FALLBACK = {
  name: "Muhammad Fahmi Rizal",
  alias: "arusuka",
  title: "Backend Engineer & Cloud Infrastructure",
  headline: {
    en: "Backend Engineer focused on distributed systems, Go, PHP (Laravel), Node.js, and cloud infrastructure.",
    id: "Backend Engineer yang berfokus pada sistem backend Go, PHP (Laravel), Node.js, dan arsitektur cloud terdistribusi.",
  },
  location: "Surabaya, Jawa Timur, Indonesia",
  contact: {
    phone: "+62 821-3471-5478",
    email: "fahmirizal96@gmail.com",
    whatsapp: "https://wa.me/6282134715478",
    linkedin: "https://www.linkedin.com/in/fahmi-rizal",
    github: "https://github.com/fahmirizal229",
    telegram: "https://t.me/fahmi_rizal",
    website: "https://arusuka.my.id",
    dashboardUrl: "https://dashboard.arusuka.my.id",
  },
  availability: {
    status: "Open to Opportunities & Engineering Consulting",
    statusId: "Terbuka untuk Diskusi & Peluang Kerja",
    badgeColor: "emerald",
  },
  summary: {
    lead: {
      en: "Backend & Cloud Infrastructure Engineer with 6+ years of production experience building distributed systems, IaaS/PaaS cloud platforms, and high-throughput APIs. Directly engineered core microservices for Cloudraya V2 at Wowrack—spanning VM compute orchestration, bare-metal provisioning, S3-compatible storage, managed Kubernetes clusters, and real-time usage billing engines.",
      id: "Backend & Cloud Infrastructure Engineer dengan pengalaman 6+ tahun dalam membangun sistem terdistribusi, platform cloud (IaaS/PaaS), dan API skala produksi.",
    },
    body: {
      en: "Hands-on with Go, PHP (Laravel), Node.js, PostgreSQL, Redis, and event-driven architectures. Experienced in high-throughput IoT telemetry pipelines (Suramadu Bridge), government service portals (Surabaya City Government & Dishub), and enterprise ERP backends.",
      id: "Terbiasa bekerja dengan Go, PHP (Laravel), Node.js, PostgreSQL, Redis, dan event-driven architecture.",
    },
  },
  keyMetrics: [
    { labelEn: "Experience", labelId: "Pengalaman", value: "6+ Years", highlight: "Distributed Systems" },
    { labelEn: "Core Languages", labelId: "Bahasa Inti", value: "Go • PHP • JS", highlight: "Laravel & Node.js" },
    { labelEn: "Cloud Engine", labelId: "Engine Cloud", value: "Cloudraya V2", highlight: "IaaS & PaaS Core" },
    { labelEn: "Base Location", labelId: "Domisili", value: "Surabaya, ID", highlight: "Remote / Hybrid" },
  ],
  skillCategories: [
    {
      nameEn: "Backend & Services",
      nameId: "Backend & Layanan",
      icon: "Server",
      skills: [
        { name: "Go (Golang)", level: "Advanced", desc: "High-performance microservices, concurrency routines, and CLI automation tools." },
        { name: "PHP & Laravel", level: "Expert", desc: "Clean Architecture, Event-Driven patterns, Laravel Reverb WebSockets, and domain services." },
        { name: "Node.js & TypeScript", level: "Advanced", desc: "Asynchronous I/O, REST APIs, Express, NestJS, and background workers." },
        { name: "Python", level: "Proficient", desc: "FastAPI backends, automation scripts, and LLM agent integration tooling." },
      ],
    },
    {
      nameEn: "Databases & Caching",
      nameId: "Database & Caching",
      icon: "Database",
      skills: [
        { name: "PostgreSQL", level: "Expert", desc: "Schema design, indexing strategies, query performance tuning, and JSONB aggregations." },
        { name: "MySQL / MariaDB", level: "Expert", desc: "Relational data modeling, transactions, index optimization, and replication." },
        { name: "Redis", level: "Advanced", desc: "Distributed caching, pub/sub event channels, rate limiters, and session management." },
        { name: "MongoDB", level: "Advanced", desc: "Document storage, flexible indexing, and aggregation pipelines for unstructured data." },
        { name: "S3 Object Storage", level: "Expert", desc: "S3 API protocol, bucket management, presigned URLs, and block storage architectures." },
      ],
    },
    {
      nameEn: "Cloud & Infrastructure",
      nameId: "Cloud & Infrastruktur",
      icon: "Cloud",
      skills: [
        { name: "Kubernetes (K8s)", level: "Advanced", desc: "Automated cluster provisioning, Helm charts, Ingress controllers, and workload scaling." },
        { name: "Docker", level: "Expert", desc: "Multi-stage container builds, Docker Compose orchestration, and minimal production images." },
        { name: "Apache CloudStack", level: "Advanced", desc: "Hypervisor orchestration, VM compute provisioning, and virtual router networking." },
        { name: "Linux Administration", level: "Expert", desc: "Ubuntu/Debian server administration, systemd daemons, security hardening, and UFW/Fail2ban." },
        { name: "CI/CD Pipelines", level: "Advanced", desc: "Bitbucket Pipelines, GitHub Actions, and automated zero-downtime deployment workflows." },
      ],
    },
    {
      nameEn: "Testing & Security",
      nameId: "Testing & Keamanan",
      icon: "ShieldCheck",
      skills: [
        { name: "PHPUnit Automated Testing", level: "Expert", desc: "Unit testing, feature testing, service mocking, and regression test suites." },
        { name: "API Security & Rate Limiting", level: "Expert", desc: "Strict CORS policies, JWT/PASETO token auth, brute-force protection, and input sanitization." },
        { name: "Production L3 Support", level: "Expert", desc: "Root Cause Analysis (RCA), hotfix engineering, live incident triage, and logging telemetry." },
      ],
    },
  ],
  experiences: [
    {
      company: "Wowrack Indonesia",
      product: "Cloudraya V2",
      platformUrl: "https://panel.cloudraya.com/",
      role: "Backend Developer",
      period: "Dec 2021 – Present",
      duration: "4+ years",
      location: "Surabaya, East Java",
      type: "Full-time",
      highlightEn: "Engineered core backend microservices for the Cloudraya V2 enterprise cloud platform, orchestrating VM compute lifecycles, S3 storage, Kubernetes clusters, and automated usage billing pipelines.",
      highlightId: "Mengembangkan engine microservices untuk platform Cloudraya V2, menangani provisioning komputasi, storage, networking, dan billing.",
      modules: [
        {
          title: "Compute & Virtualization Engine",
          descEn: "Engineered microservices for VM provisioning, CloudStack hypervisor orchestration, and bare-metal server lifecycles across multiple regional zones.",
          descId: "Membangun microservices untuk provisioning Virtual Machine, orkestrasi CloudStack hypervisor, dan siklus server Bare-Metal.",
        },
        {
          title: "S3 Object Storage & Bucket DNS",
          descEn: "Designed high-throughput S3-compatible Object Storage services, automated DNS bucket routing, and scalable block storage attachments.",
          descId: "Mengembangkan layanan Object Storage kompatibel S3, routing DNS bucket dinamis, dan pengelolaan block storage.",
        },
        {
          title: "Managed Kubernetes & Cloud Networking",
          descEn: "Built automated services for on-demand Kubernetes cluster provisioning, VPC network creation, public IP pools, and firewall security rules.",
          descId: "Membangun automasi provisioning cluster Kubernetes terkelola dan konfigurasi jaringan cloud (VPC, IP publik, firewall).",
        },
        {
          title: "Real-time Usage Metering & Billing",
          descEn: "Architected real-time usage-based billing pipelines, multi-region resource quota management, and automated monthly invoice generation.",
          descId: "Merancang pipeline kalkulasi billing berbasis pemakaian riil, kuota resource multi-region, dan otomasi invoice bulanan.",
        },
        {
          title: "Telemetry & Live Event Streaming",
          descEn: "Implemented real-time event streaming via Laravel Reverb (WebSockets) for instant UI state synchronization and OS template repository management.",
          descId: "Mengembangkan sistem notifikasi realtime via Laravel Reverb (WebSockets) dan repositori template OS image.",
        },
        {
          title: "Automated Testing, CI/CD & L3 Support",
          descEn: "Maintained platform reliability through rigorous PHPUnit suites, Bitbucket CI/CD pipelines, and resolved critical L3 production escalations.",
          descId: "Menjaga kualitas sistem dengan automated testing PHPUnit menyeluruh, CI/CD ke Kubernetes, serta menangani eskalasi L3 produksi.",
        },
      ],
      techStack: [
        "PHP",
        "Laravel",
        "Go",
        "PostgreSQL",
        "MySQL",
        "Redis",
        "WebSockets (Reverb)",
        "Kubernetes",
        "Docker",
        "Bitbucket CI/CD",
        "CloudStack",
        "S3 API",
        "PHPUnit",
      ],
    },
    {
      company: "Energeek",
      role: "Backend Developer",
      period: "Mar 2019 – Dec 2021",
      duration: "2 years 10 months",
      location: "Surabaya, East Java",
      type: "Full-time",
      highlightEn: "Built backend APIs, enterprise software systems, and telemetry data ingestions for government institutions, state-owned enterprises (BUMN), and IoT networks.",
      highlightId: "Mengembangkan dan mengelola aplikasi web serta backend API untuk instansi pemerintah, BUMN, dan proyek IoT.",
      modules: [
        {
          title: "Municipal & Public Sector Portals",
          descEn: "Built flood-control pump station asset management & infrastructure proposal approval systems for Surabaya City Government and Dishub document registries.",
          descId: "Membangun sistem manajemen aset dan proposal untuk Pemkot Surabaya, serta sistem penomoran registrasi kendaraan Dishub.",
        },
        {
          title: "Enterprise ERP & State-Owned Systems",
          descEn: "Engineered core modules for Petrokimia Gresik NISA market intelligence, PT Wijaya Karya (WIKA SIP) project ERP, and Universitas Pertamina research grant portal.",
          descId: "Mengembangkan modul ERP Petrokimia Gresik (Nisa), sistem informasi proyek PT Wijaya Karya (WIKA SIP), dan portal Universitas Pertamina.",
        },
        {
          title: "IoT Sensor Telemetry Pipelines",
          descEn: "Engineered high-throughput sensor telemetry ingestion backend for Suramadu Bridge to capture and process structural vibration and environmental conditions in real time.",
          descId: "Membangun backend data ingestion untuk proyek sensor telemetri Jembatan Suramadu guna memantau getaran struktural dan cuaca.",
        },
        {
          title: "VM Deployments & Database Query Optimization",
          descEn: "Managed production Virtual Machine deployments, optimized complex PostgreSQL queries, and delivered ongoing system enhancements.",
          descId: "Mengelola deployment server Virtual Machine, optimasi query database PostgreSQL, serta pemeliharaan rutin aplikasi.",
        },
      ],
      techStack: [
        "PHP",
        "Laravel",
        "PostgreSQL",
        "MySQL",
        "REST APIs",
        "JavaScript",
        "Bootstrap",
        "Git",
        "Linux VMs",
      ],
    },
  ],
  education: [
    {
      institution: "Universitas Pembangunan Nasional 'Veteran' Jawa Timur",
      degreeEn: "Bachelor of Computer Science (S.Kom) - Informatics Engineering",
      degreeId: "Sarjana Komputer (S.Kom) - Teknik Informatika",
      period: "2014 – 2018",
      location: "Surabaya, Indonesia",
      descEn: "Focused on Software Engineering, Database Systems, Computer Networks, and Distributed Computing.",
      descId: "Fokus pada Rekayasa Perangkat Lunak, Sistem Basis Data, Jaringan Komputer, dan Komputasi Terdistribusi.",
    },
  ],
  workPreferences: {
    workModel: "Remote / Hybrid (Surabaya/Jakarta)",
    employmentType: "Full-time, Senior/Lead Contract, Consulting",
    noticePeriod: "Standard 1 Month / Negotiable",
    timezone: "WIB (UTC+7) • Flexible Overlap",
    preferredRoles: "Senior Backend Engineer, Lead Software Engineer, Cloud Infrastructure",
    locationPreference: "Surabaya (Onsite/Hybrid), Jakarta (Hybrid/Remote), Worldwide (Full Remote)",
  },
  projects: [
    {
      title: "Cloudraya V2 Cloud Platform",
      tagline: "Enterprise IaaS & PaaS Cloud Engine",
      role: "Core Backend Engineer",
      descEn: "Enterprise multi-region cloud infrastructure platform orchestrating VM and Bare-Metal compute lifecycles, high-performance S3-compatible object storage, managed Kubernetes clusters, and automated real-time usage billing pipelines.",
      tech: ["PHP", "Laravel", "Go", "PostgreSQL", "Redis", "Kubernetes", "CloudStack", "WebSockets"],
      badge: "Cloud Platform",
      link: "https://panel.cloudraya.com/",
    },
    {
      title: "Suramadu Bridge IoT Telemetry",
      tagline: "Real-time Structural & Environmental Ingestion",
      role: "Backend Engineer",
      descEn: "High-throughput data ingestion backend capturing real-time structural vibration and environmental sensor metrics for the Suramadu Bridge to support structural health monitoring.",
      tech: ["PHP", "Laravel", "PostgreSQL", "REST APIs", "Time-Series"],
      badge: "IoT Telemetry",
    },
    {
      title: "Surabaya Pump Station & Heavy Equipment Asset Management",
      tagline: "Asset Monitoring & Flood Control System",
      role: "Backend Programmer",
      descEn: "High-performance RESTful API backend engineered for Surabaya City Government to monitor flood-control water pump stations and municipal heavy equipment fleets across Web & Mobile platforms.",
      tech: ["PHP", "Lumen", "PostgreSQL", "REST APIs", "Mobile Integration"],
      badge: "Government Portal",
    },
    {
      title: "Surabaya Municipal Infrastructure Proposal & Survey System",
      tagline: "Field Survey & Project Approval Workflow",
      role: "Backend API Engineer",
      descEn: "Mobile-focused backend API automating field feasibility surveys, hierarchical approval workflows, and task dispatching to municipal task forces for Surabaya City infrastructure proposals.",
      tech: ["PHP", "Laravel", "MySQL", "REST APIs", "Mobile Integration"],
      badge: "Smart Governance",
    },
    {
      title: "Dishub Surabaya E-Surat Registry Engine",
      tagline: "Centralized Document Registry & Audit Trail",
      role: "Backend API Engineer",
      descEn: "Centralized digital registry and official letter allocation engine integrated with Surabaya Transportation Agency's E-Surat portal, featuring comprehensive usage auditing across departments.",
      tech: ["PHP", "Laravel", "PostgreSQL", "E-Surat Integration", "REST APIs"],
      badge: "Public Sector",
    },
    {
      title: "Petrokimia Gresik NISA - Market Intelligence",
      tagline: "Agricultural Market & Competitor Intelligence",
      role: "Semi Full-Stack Developer",
      descEn: "Market intelligence and competitor monitoring platform for PT Petrokimia Gresik, analyzing regional fertilizer distribution dynamics, pricing movements, and field sales reporting.",
      tech: ["PHP", "Laravel", "PostgreSQL", "JavaScript", "Analytics"],
      badge: "Enterprise Intelligence",
    },
    {
      title: "WIKA SIP - Project Resource & Cashflow Engine",
      tagline: "Project Planning, Logistics & Vendor Disbursement",
      role: "Backend Developer",
      descEn: "Core backend services for PT Wijaya Karya (WIKA) Tbk Project Information System, handling construction material planning, equipment logistics, and multi-tier vendor disbursement workflows.",
      tech: ["PHP", "Laravel", "PostgreSQL", "REST APIs", "ERP Workflow"],
      badge: "Construction ERP",
    },
    {
      title: "CuddleMe Dodolo E-Commerce Back-Office",
      tagline: "Product Catalog & Logistics Automation",
      role: "Semi Full-Stack Developer",
      descEn: "Back-office administration and inventory management system for baby product brand CuddleMe, featuring automated shipping rate calculations via RajaOngkir API and payment reconciliation.",
      tech: ["PHP", "Laravel", "PostgreSQL", "RajaOngkir API", "Order Management"],
      badge: "E-Commerce ERP",
    },
    {
      title: "Universitas Pertamina Research Grant Portal",
      tagline: "Research Grants & Budget Disbursement",
      role: "Backend API Engineer",
      descEn: "RESTful API backend powering Universitas Pertamina's research grant management portal, facilitating grant proposal submissions, peer-review cycles, and budget disbursement tracking.",
      tech: ["PHP", "Laravel", "PostgreSQL", "REST APIs"],
      badge: "Academic System",
    },
    {
      title: "Omni Command Center & Storage Vault",
      tagline: "Personal Server Dashboard & Security Guardian",
      role: "Full-Stack Creator",
      descEn: "Hardened homelab server dashboard and private vault with real-time system telemetry via WebSockets, Obsidian Second Brain sync, and BMKG geophysical warnings.",
      tech: ["FastAPI", "React 19", "SQLite WAL", "Tailwind CSS", "WebSockets"],
      badge: "Private Vault",
      link: "https://dashboard.arusuka.my.id",
    },
  ],
};

function ProfileSkeleton({ isDark = true }) {
  const shimmer = isDark ? "bg-slate-800/60 animate-pulse" : "bg-slate-200/80 animate-pulse";
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans select-none animate-fadeIn">
      <section className={`rounded-2xl p-6 sm:p-8 border ${isDark ? "bg-[#0e121d] border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className={`w-20 h-20 rounded-2xl ${shimmer}`} />
            <div className="space-y-2.5">
              <div className={`h-7 w-64 rounded-xl ${shimmer}`} />
              <div className={`h-4 w-48 rounded-md ${shimmer}`} />
              <div className={`h-4 w-36 rounded-md ${shimmer}`} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-28 rounded-xl ${shimmer}`} />
            <div className={`h-10 w-32 rounded-xl ${shimmer}`} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${isDark ? "bg-[#0e121d] border-slate-800" : "bg-white border-slate-200"}`}>
            <div className={`h-3 w-20 rounded ${shimmer}`} />
            <div className={`h-7 w-28 rounded-lg ${shimmer}`} />
            <div className={`h-3 w-32 rounded ${shimmer}`} />
          </div>
        ))}
      </section>

      <div className={`p-6 rounded-2xl border ${isDark ? "bg-[#0e121d] border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="space-y-4">
          <div className={`h-5 w-40 rounded ${shimmer}`} />
          <div className={`h-4 w-full rounded ${shimmer}`} />
          <div className={`h-4 w-5/6 rounded ${shimmer}`} />
        </div>
      </div>
    </div>
  );
}

function ProjectCardItem({ p, isDark, language = "en" }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const localizedDesc = language === "id" ? (p.descId || p.descEn || "") : (p.descEn || p.descId || "");

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 overflow-hidden group ${
        isDark
          ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700 shadow-xs"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      {/* Jhey Lens Spotlight Glow (Smooth Mouse Tracking) */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: isDark
            ? `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.14), transparent 80%)`
            : `radial-gradient(350px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.08), transparent 80%)`,
        }}
      />

      <div className="space-y-3 relative z-10">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              p.badge === "Cloud Infrastructure"
                ? isDark
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                  : "bg-indigo-50 text-indigo-700 border-indigo-200"
                : p.badge === "Enterprise / IoT"
                ? isDark
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isDark
                ? "bg-slate-800 text-slate-300 border-slate-700"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {p.badge}
          </span>
          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className={`p-1 rounded-md transition-colors ${
                isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          )}
        </div>

        <h3 className={`text-base font-bold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
          {p.title}
        </h3>

        <p className={`text-xs font-semibold ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>
          {p.role} {p.tagline ? `• ${p.tagline}` : ""}
        </p>

        <p className={`text-xs leading-relaxed line-clamp-4 ${isDark ? "text-slate-400" : "text-slate-700 font-normal"}`}>
          {localizedDesc}
        </p>
      </div>

      {p.tech && (
        <div className="relative z-10 flex flex-wrap gap-1.5 pt-2 border-t border-inherit">
          {p.tech.map((t, tIdx) => (
            <span
              key={tIdx}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${
                isDark
                  ? "bg-[#090d16] border-slate-800 text-slate-400"
                  : "bg-slate-100 border-slate-200 text-slate-700 font-medium"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileView({ isDark = true }) {
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const [profile, setProfile] = useState(INITIAL_FALLBACK);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("experiences");
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedExpIndex, setExpandedExpIndex] = useState(0);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");

  // Comprehensive Studio CMS State (Split macOS/Linear Pane Style)
  const [isStudioRendered, setIsStudioRendered] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [studioActiveTab, setStudioActiveTab] = useState("basic"); // basic | metrics | experiences | skills | projects | education
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetConfirmRendered, setIsResetConfirmRendered] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Fetch profile data from live backend
  const fetchProfile = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.getProfile();
      if (res && res.data) {
        setProfile(res.data);
      } else if (res && res.name) {
        setProfile(res);
      }
    } catch (err) {
      console.warn("Could not fetch live profile from API, using fallback data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Copy to clipboard helper
  const handleCopy = (key, value, label) => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    showToast(`${label || "Text"} copied to clipboard!`, "success");
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const resumeRef = useRef(null);

  // Helper: Find lowest pure-white pixel row in a search window to make a clean cut without splitting text
  const findCleanCutY = (canvas, targetY, searchWindowPx = 80) => {
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    if (targetY >= canvas.height) return canvas.height;

    const startY = Math.min(canvas.height - 1, Math.round(targetY));
    const endY = Math.max(0, Math.round(targetY - searchWindowPx));
    const searchHeight = startY - endY + 1;
    if (searchHeight <= 0) return targetY;

    try {
      const imgData = ctx.getImageData(0, endY, width, searchHeight).data;
      // Search from bottom (startY) upwards to endY
      for (let y = startY; y >= endY; y--) {
        const rowOffset = (y - endY) * width * 4;
        let isRowBlank = true;

        // Sample every 4th pixel for speed & accuracy
        for (let x = 0; x < width; x += 4) {
          const idx = rowOffset + x * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          // If pixel is not white background
          if (a > 20 && (r < 240 || g < 240 || b < 240)) {
            isRowBlank = false;
            break;
          }
        }

        if (isRowBlank) {
          return y;
        }
      }
    } catch (e) {
      console.warn("Pixel inspection fallback:", e);
    }

    return targetY;
  };

  // Trigger Direct Download of Dynamic ATS-Compliant PDF Resume with Clean Blank-Line Detection
  const handleGeneratePdf = async () => {
    const container = document.getElementById("ats-resume-container");
    if (!container) return;
    setIsGeneratingPdf(true);

    try {
      showToast("Generating dynamic ATS-compliant PDF resume...", "info");

      // Lazy load heavy PDF libraries on demand (drastically reduces initial bundle size & build time)
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const html2canvasOptions = {
        scale: 2, // 2x High-DPI for crisp ATS typography
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const wrapper = clonedDoc.getElementById("ats-resume-container");
          if (wrapper) {
            wrapper.style.position = "static";
            wrapper.style.left = "0";
            wrapper.style.top = "0";
            wrapper.style.visibility = "visible";
          }
        },
      };

      const fullCanvas = await html2canvas(container, html2canvasOptions);

      const pdfWidthMm = 210;
      const pdfHeightMm = 297;
      const scale = 2;
      const pageWidthPx = fullCanvas.width;
      const pageHeightPx = Math.round((pageWidthPx * pdfHeightMm) / pdfWidthMm);
      const miniHeaderHeightPx = Math.round(36 * scale); // ~36px DOM height (72px at scale 2)
      const footerHeightPx = Math.round(28 * scale);     // ~28px DOM height (56px at scale 2)
      const searchWindowPx = Math.round(65 * scale);     // ~65px DOM search window for blank line

      // 1. Calculate slice cut-points dynamically
      const pageSlices = [];
      let currentSourceY = 0;
      let isFirst = true;

      while (currentSourceY < fullCanvas.height) {
        const availableHeight = isFirst
          ? pageHeightPx - footerHeightPx
          : pageHeightPx - miniHeaderHeightPx - footerHeightPx;

        const targetY = currentSourceY + availableHeight;

        let cutY = targetY;
        if (targetY < fullCanvas.height) {
          // Find clean gap between sentences/bullets
          cutY = findCleanCutY(fullCanvas, targetY, searchWindowPx);
        } else {
          cutY = fullCanvas.height;
        }

        const sliceH = cutY - currentSourceY;
        pageSlices.push({
          sourceY: currentSourceY,
          sliceHeight: sliceH,
          isFirst,
        });

        currentSourceY = cutY;
        isFirst = false;
      }

      const totalPages = Math.max(1, pageSlices.length);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let pIdx = 0; pIdx < pageSlices.length; pIdx++) {
        const slice = pageSlices[pIdx];
        if (pIdx > 0) {
          pdf.addPage();
        }

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = pageWidthPx;
        pageCanvas.height = pageHeightPx;
        const ctx = pageCanvas.getContext("2d");

        // Fill background white
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);

        let contentTopPx = 0;

        // If Page 2+, render Mini Header at top
        if (!slice.isFirst) {
          contentTopPx = miniHeaderHeightPx;

          // Mini Header background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageWidthPx, miniHeaderHeightPx);

          // Header Text
          ctx.fillStyle = "#0f172a";
          ctx.font = `bold ${10 * scale}px sans-serif`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(
            `${(profile.name || "Muhammad Fahmi Rizal").toUpperCase()} — CURRICULUM VITAE`,
            42 * scale,
            miniHeaderHeightPx / 2
          );

          ctx.fillStyle = "#475569";
          ctx.font = `normal ${8.5 * scale}px sans-serif`;
          ctx.textAlign = "right";
          const contactStr = `${profile.contact?.email || ""} • ${profile.contact?.phone || ""}`;
          ctx.fillText(contactStr, pageWidthPx - (42 * scale), miniHeaderHeightPx / 2);

          // Divider line under mini-header
          ctx.strokeStyle = "#0f172a";
          ctx.lineWidth = 1.5 * scale;
          ctx.beginPath();
          ctx.moveTo(42 * scale, miniHeaderHeightPx - (2 * scale));
          ctx.lineTo(pageWidthPx - (42 * scale), miniHeaderHeightPx - (2 * scale));
          ctx.stroke();
        }

        // Draw Content Slice precisely starting at contentTopPx
        ctx.drawImage(
          fullCanvas,
          0,
          slice.sourceY,
          pageWidthPx,
          slice.sliceHeight,
          0,
          contentTopPx,
          pageWidthPx,
          slice.sliceHeight
        );

        // Draw Footer at bottom of every page
        const footerY = pageHeightPx - footerHeightPx;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, footerY, pageWidthPx, footerHeightPx);

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(42 * scale, footerY + (2 * scale));
        ctx.lineTo(pageWidthPx - (42 * scale), footerY + (2 * scale));
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = `500 ${8 * scale}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(
          `${profile.name || "Muhammad Fahmi Rizal"} — Curriculum Vitae`,
          42 * scale,
          footerY + (footerHeightPx / 2)
        );

        ctx.textAlign = "right";
        ctx.fillText(
          `Page ${pIdx + 1} of ${totalPages}`,
          pageWidthPx - (42 * scale),
          footerY + (footerHeightPx / 2)
        );

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidthMm, pdfHeightMm);
      }

      const cleanName = (profile.name || "Muhammad_Fahmi_Rizal").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`CV_${cleanName}_Backend_Engineer.pdf`);
      showToast("ATS-friendly dynamic CV downloaded successfully!", "success");
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      showToast("Failed to generate PDF file.", "error");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Open Studio CMS with specific tab targeted (smooth entrance)
  const handleOpenStudio = (targetTab = "basic") => {
    setEditFormData(JSON.parse(JSON.stringify(profile)));
    setStudioActiveTab(targetTab);
    setIsStudioRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsStudioOpen(true);
      });
    });
  };

  // Close Studio CMS with smooth exit transition
  const handleCloseStudio = () => {
    setIsStudioOpen(false);
    setTimeout(() => {
      setIsStudioRendered(false);
    }, 200);
  };

  // Open Reset Confirmation Dialog
  const handleOpenResetConfirm = () => {
    setIsResetConfirmRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsResetConfirmOpen(true);
      });
    });
  };

  // Close Reset Confirmation Dialog
  const handleCloseResetConfirm = () => {
    setIsResetConfirmOpen(false);
    setTimeout(() => {
      setIsResetConfirmRendered(false);
    }, 200);
  };

  // Handle Save Full Studio Edit
  const handleSaveEdit = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData) return;

    setIsSaving(true);
    try {
      const res = await api.updateProfile(editFormData);
      if (res && res.data) {
        setProfile(res.data);
      } else {
        setProfile(editFormData);
      }
      handleCloseStudio();
      showToast("Full CV & Profile Studio changes synchronized successfully!", "success");
    } catch (err) {
      console.error("Failed to update profile:", err);
      showToast(err.message || "Failed to update profile. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Reset to Default
  const handleResetProfile = async () => {
    setIsSaving(true);
    try {
      const res = await api.resetProfile();
      if (res && res.data) {
        setProfile(res.data);
      } else {
        setProfile(INITIAL_FALLBACK);
      }
      handleCloseResetConfirm();
      handleCloseStudio();
      showToast("Profile reset to original default blueprint!", "success");
    } catch (err) {
      console.error("Failed to reset profile:", err);
      showToast(err.message || "Failed to reset profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // --------------------------------------------------------------------------
  // Studio Form Mutation Helpers
  // --------------------------------------------------------------------------
  
  const addExperience = () => {
    setEditFormData((prev) => ({
      ...prev,
      experiences: [
        {
          company: "New Company",
          product: "",
          platformUrl: "",
          role: "Senior Backend Engineer",
          period: "Jan 2024 – Present",
          duration: "1 year",
          location: "Surabaya, ID",
          type: "Full-time",
          highlightEn: "Engineered scalable microservices and backend data pipelines.",
          highlightId: "Mengembangkan arsitektur microservices dan pipeline data backend.",
          modules: [{ title: "Core Service Engine", descEn: "Built high-performance APIs and database models." }],
          techStack: ["Go", "PHP", "PostgreSQL", "Docker"],
        },
        ...(prev.experiences || []),
      ],
    }));
  };

  const removeExperience = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      experiences: (prev.experiences || []).filter((_, i) => i !== index),
    }));
  };

  const addModuleToExperience = (expIndex) => {
    setEditFormData((prev) => {
      const exps = [...(prev.experiences || [])];
      const targetExp = { ...exps[expIndex] };
      targetExp.modules = [...(targetExp.modules || []), { title: "New Module Title", descEn: "Module description details..." }];
      exps[expIndex] = targetExp;
      return { ...prev, experiences: exps };
    });
  };

  const removeModuleFromExperience = (expIndex, modIndex) => {
    setEditFormData((prev) => {
      const exps = [...(prev.experiences || [])];
      const targetExp = { ...exps[expIndex] };
      targetExp.modules = (targetExp.modules || []).filter((_, i) => i !== modIndex);
      exps[expIndex] = targetExp;
      return { ...prev, experiences: exps };
    });
  };

  const addProject = () => {
    setEditFormData((prev) => ({
      ...prev,
      projects: [
        {
          title: "New Featured System",
          tagline: "High-Throughput Distributed Architecture",
          role: "Lead Backend Developer",
          descEn: "Engineered core backend services, real-time message brokers, and automated CI/CD deployment pipelines.",
          tech: ["Go", "Laravel", "PostgreSQL", "Redis", "Docker"],
          badge: "Enterprise Platform",
          link: "",
        },
        ...(prev.projects || []),
      ],
    }));
  };

  const removeProject = (index) => {
    setEditFormData((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index),
    }));
  };

  const addSkillCategory = () => {
    setEditFormData((prev) => ({
      ...prev,
      skillCategories: [
        ...(prev.skillCategories || []),
        {
          nameEn: "New Category",
          nameId: "Kategori Baru",
          icon: "Server",
          skills: [
            { name: "New Skill", level: "Expert", desc: "Production architecture and implementation." },
          ],
        },
      ],
    }));
  };

  const removeSkillCategory = (catIndex) => {
    setEditFormData((prev) => ({
      ...prev,
      skillCategories: (prev.skillCategories || []).filter((_, i) => i !== catIndex),
    }));
  };

  const addSkillToCategory = (catIndex) => {
    setEditFormData((prev) => {
      const cats = [...(prev.skillCategories || [])];
      const targetCat = { ...cats[catIndex] };
      targetCat.skills = [...(targetCat.skills || []), { name: "Skill Name", level: "Expert", desc: "Hands-on experience with..." }];
      cats[catIndex] = targetCat;
      return { ...prev, skillCategories: cats };
    });
  };

  const removeSkillFromCategory = (catIndex, skillIndex) => {
    setEditFormData((prev) => {
      const cats = [...(prev.skillCategories || [])];
      const targetCat = { ...cats[catIndex] };
      targetCat.skills = (targetCat.skills || []).filter((_, i) => i !== skillIndex);
      cats[catIndex] = targetCat;
      return { ...prev, skillCategories: cats };
    });
  };

  // Filter skills based on query
  const filteredSkillCategories = useMemo(() => {
    if (!profile.skillCategories) return [];
    if (!skillSearchQuery.trim()) return profile.skillCategories;

    const q = skillSearchQuery.toLowerCase();
    return profile.skillCategories
      .map((cat) => {
        const matchingSkills = (cat.skills || []).filter((s) => {
          const name = typeof s === "string" ? s : (s?.name || "");
          const desc = typeof s === "object" ? (s?.desc || "") : "";
          const level = typeof s === "object" ? (s?.level || "") : "";
          return (
            name.toLowerCase().includes(q) ||
            desc.toLowerCase().includes(q) ||
            level.toLowerCase().includes(q)
          );
        });
        return {
          ...cat,
          skills: matchingSkills,
        };
      })
      .filter((cat) => cat.skills.length > 0);
  }, [profile.skillCategories, skillSearchQuery]);

  // Project categories
  const projectCategories = useMemo(() => {
    if (!profile.projects) return ["All"];
    const cats = new Set(["All"]);
    profile.projects.forEach((p) => {
      if (p.badge) cats.add(p.badge);
    });
    return Array.from(cats);
  }, [profile.projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!profile.projects) return [];
    if (projectFilter === "All") return profile.projects;
    return profile.projects.filter((p) => p.badge === projectFilter);
  }, [profile.projects, projectFilter]);

  if (loading) {
    return <ProfileSkeleton isDark={isDark} />;
  }

  const headline = language === "id" ? (profile.headline?.id || profile.headline?.en || profile.headline || "") : (profile.headline?.en || profile.headline?.id || profile.headline || "");
  const leadSummary = language === "id" ? (profile.summary?.lead?.id || profile.summary?.lead?.en || profile.summary?.lead || "") : (profile.summary?.lead?.en || profile.summary?.lead?.id || profile.summary?.lead || "");
  const bodySummary = language === "id" ? (profile.summary?.body?.id || profile.summary?.body?.en || profile.summary?.body || "") : (profile.summary?.body?.en || profile.summary?.body?.id || profile.summary?.body || "");
  const leadSummaryEn = profile.summary?.lead?.en || profile.summary?.lead?.id || profile.summary?.lead || "";
  const bodySummaryEn = profile.summary?.body?.en || profile.summary?.body?.id || profile.summary?.body || "";

  // Studio Sidebar Nav Config
  const studioNavSections = [
    { id: "basic", label: "Identity & Contacts", icon: User },
    { id: "metrics", label: "Metrics & Summary", icon: BarChart3 },
    { id: "experiences", label: "Experiences", icon: Briefcase, count: editFormData?.experiences?.length },
    { id: "skills", label: "Skills Matrix", icon: Cpu, count: editFormData?.skillCategories?.length },
    { id: "projects", label: "Featured Projects", icon: Layers, count: editFormData?.projects?.length },
    { id: "education", label: "Education & Terms", icon: GraduationCap },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. INTERACTIVE WEB DASHBOARD VIEW (Hidden when printing / generating PDF) */}
      {/* ========================================================================= */}
      <div className={`w-full max-w-7xl mx-auto space-y-6 pb-20 font-sans ${isDark ? "text-slate-100" : "text-slate-900"} print:hidden`}>
      {/* Top Banner / Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none print:hidden">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs transition-transform duration-300 hover:scale-105 ${
              isDark
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                : "bg-indigo-50 border-indigo-200 text-indigo-600"
            }`}
          >
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Professional Profile & CV Studio
            </h1>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Full-featured profile CMS, engineering track record, project showcase, and skill intelligence
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchProfile(true)}
            disabled={refreshing}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
              isDark
                ? "bg-[#0e121d] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
            }`}
            title="Refresh profile data from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
              isDark
                ? "bg-[#0e121d] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50 hover:text-slate-900 shadow-xs"
            }`}
            title="Generate & Download ATS-Friendly PDF CV"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                <span className="hidden sm:inline">Generating PDF...</span>
              </>
            ) : (
              <>
                <Download className={`w-3.5 h-3.5 ${isDark ? "text-sky-400" : "text-sky-600"}`} />
                <span className="hidden sm:inline font-semibold">Generate PDF</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleOpenStudio("basic")}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-[0_2px_12px_rgba(99,102,241,0.35)] flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            title="Edit Profile & CV Studio"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO PROFILE CARD                                                      */}
      {/* ========================================================================= */}
      <section
        className={`rounded-2xl border p-6 sm:p-8 relative overflow-hidden transition-all duration-300 ${
          isDark
            ? "bg-gradient-to-b from-[#0e1322] to-[#090d16] border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            : "bg-white border-slate-200/90 shadow-sm"
        } print:border-none print:shadow-none print:p-0`}
      >
        {isDark && (
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/25">
                <div
                  className={`w-full h-full rounded-2xl flex items-center justify-center font-bold text-2xl tracking-wider select-none ${
                    isDark ? "bg-[#0a0d16] text-white" : "bg-white text-indigo-600"
                  }`}
                >
                  FR
                </div>
              </div>
              <div
                className={`absolute -bottom-1.5 -right-1.5 p-1 bg-emerald-500 text-white rounded-full ring-4 shadow-sm ${
                  isDark ? "ring-[#0e1322]" : "ring-white"
                }`}
                title="Verified Profile"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  {profile.name}
                </h2>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border ${
                    isDark
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                      : "bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold"
                  }`}
                >
                  @{profile.alias || "arusuka"}
                </span>
              </div>

              <p
                className={`text-sm sm:text-base font-bold ${
                  isDark
                    ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200"
                    : "text-indigo-600"
                }`}
              >
                {profile.title}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <div className={`flex items-center space-x-1.5 ${isDark ? "text-slate-400" : "text-slate-700 font-medium"}`}>
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{profile.location}</span>
                </div>

                <div
                  className={`inline-flex items-center space-x-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-300 ${
                    isDark
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                  }`}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-4 ring-emerald-500/20" />
                  </span>
                  <span>{profile.availability?.status || "Open to Opportunities"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Contact Action Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 print:hidden">
            {profile.contact?.email && (
              <button
                onClick={() => handleCopy("email", profile.contact.email, "Email address")}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
                  copiedKey === "email"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 font-semibold"
                    : isDark
                    ? "bg-[#131929] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-slate-900 shadow-2xs font-medium"
                }`}
                title="Click to copy email"
              >
                {copiedKey === "email" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Mail className={`w-3.5 h-3.5 ${isDark ? "text-sky-400" : "text-sky-600"}`} />}
                <span>{profile.contact.email}</span>
              </button>
            )}

            {profile.contact?.phone && (
              <button
                onClick={() => handleCopy("phone", profile.contact.phone, "Phone number")}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 ${
                  copiedKey === "phone"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 font-semibold"
                    : isDark
                    ? "bg-[#131929] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100 hover:text-slate-900 shadow-2xs font-medium"
                }`}
                title="Click to copy phone"
              >
                {copiedKey === "phone" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Phone className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />}
                <span>{profile.contact.phone}</span>
              </button>
            )}

            {profile.contact?.linkedin && (
              <a
                href={profile.contact.linkedin}
                target="_blank"
                rel="noreferrer"
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-[#131929] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-sky-400"
                    : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-sky-600 shadow-2xs"
                }`}
                title="Visit LinkedIn Profile"
              >
                <LinkedInIcon className="w-4 h-4" />
              </a>
            )}

            {profile.contact?.github && (
              <a
                href={profile.contact.github}
                target="_blank"
                rel="noreferrer"
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-[#131929] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                }`}
                title="Visit GitHub Profile"
              >
                <GitHubIcon className="w-4 h-4" />
              </a>
            )}

            {profile.contact?.website && (
              <a
                href={profile.contact.website}
                target="_blank"
                rel="noreferrer"
                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-[#131929] border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-indigo-400"
                    : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 shadow-2xs"
                }`}
                title="Visit Portfolio Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {headline && (
          <div className="mt-6 pt-6 border-t border-inherit">
            <p className={`text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700 font-medium"}`}>
              {headline}
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 2. QUICK KEY METRICS                                                      */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        {(profile.keyMetrics || []).map((m, idx) => (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md relative group ${
              isDark
                ? "bg-[#0e121d] border-slate-800/90 hover:border-slate-700 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
            } print:border print:shadow-none`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {language === "id" ? (m.labelId || m.labelEn || m.label) : (m.labelEn || m.labelId || m.label)}
              </span>
            </div>
            <div className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
              {m.value}
            </div>
            <div className={`text-xs font-mono mt-1 flex items-center space-x-1 ${isDark ? "text-indigo-400" : "text-indigo-700 font-semibold"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-indigo-400" : "bg-indigo-600"}`} />
              <span className="truncate">{m.highlight}</span>
            </div>
          </div>
        ))}
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE TAB NAVIGATION (Seamless, No Scrollbar)                     */}
      {/* ========================================================================= */}
      <div className={`flex items-center justify-between border-b pb-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none print:hidden ${
        isDark ? "border-slate-800/80" : "border-slate-200"
      }`}>
        <div className="flex items-center space-x-2 sm:space-x-4 relative">
          {[
            { id: "experiences", label: language === "id" ? "Pengalaman Kerja" : "Experience & Timeline", icon: Briefcase, count: profile.experiences?.length },
            { id: "skills", label: language === "id" ? "Matriks Keahlian" : "Skills Matrix", icon: Cpu, count: profile.skillCategories?.length },
            { id: "projects", label: language === "id" ? "Portofolio Proyek" : "Featured Projects", icon: Layers, count: profile.projects?.length },
            { id: "education", label: language === "id" ? "Pendidikan & Preferensi" : "Education & Preferences", icon: GraduationCap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 px-3.5 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-2 transition-colors cursor-pointer whitespace-nowrap z-10 ${
                  isActive
                    ? isDark
                      ? "text-indigo-300"
                      : "text-indigo-700 font-bold"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900 font-medium"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeProfileTabIndicator"
                    className={`absolute inset-0 rounded-xl shadow-xs -z-10 ${
                      isDark
                        ? "bg-indigo-600/20 border border-indigo-500/40"
                        : "bg-indigo-50 border border-indigo-200"
                    }`}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 ${isActive ? (isDark ? "text-indigo-400" : "text-indigo-600") : ""}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-indigo-600 text-white font-bold"
                        : isDark
                        ? "bg-slate-800 text-slate-400"
                        : "bg-slate-200 text-slate-700 font-semibold"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: EXPERIENCES TIMELINE                                            */}
      {/* ========================================================================= */}
      {(activeTab === "experiences" || typeof window === "undefined") && (
        <section className="space-y-6 animate-fadeIn">
          <div
            className={`p-5 sm:p-6 rounded-2xl border relative group ${
              isDark ? "bg-[#0b0f19] border-slate-800/90 text-slate-300" : "bg-white border-slate-200 text-slate-700 shadow-xs"
            }`}
          >
            <div className={`flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>
              <Sparkles className="w-4 h-4" />
              <span>{language === "id" ? "Ringkasan Latar Belakang Rekayasa" : "Engineering Background Summary"}</span>
            </div>
            <p className={`text-sm leading-relaxed mb-3 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
              {leadSummary}
            </p>
            {bodySummary && (
              <p className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {bodySummary}
              </p>
            )}
          </div>

          <div className="select-none print:hidden">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
              Production Career Track ({profile.experiences?.length || 0} Companies)
            </h3>
          </div>

          <div className="space-y-5">
            {(profile.experiences || []).map((exp, idx) => {
              const isExpanded = expandedExpIndex === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all duration-300 ${
                    isDark
                      ? isExpanded
                        ? "bg-[#0e121d] border-indigo-500/40 shadow-lg shadow-indigo-950/20"
                        : "bg-[#0e121d] border-slate-800 hover:border-slate-700"
                      : isExpanded
                      ? "bg-white border-indigo-300 shadow-md ring-1 ring-indigo-200/50"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div
                    onClick={() => setExpandedExpIndex(isExpanded ? -1 : idx)}
                    className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className={`text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                          {exp.company}
                        </h3>
                        {exp.product && (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${isDark ? "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"}`}>
                            {exp.product}
                          </span>
                        )}
                        {exp.type && (
                          <span className={`text-xs px-2 py-0.5 rounded-md font-mono ${isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-700 border border-slate-200 font-medium"}`}>
                            {exp.type}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>
                        {exp.role} <span className={`${isDark ? "text-slate-500" : "text-slate-600 font-medium"}`}>({exp.duration})</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className={`text-right text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-700 font-medium"}`}>
                        <div>{exp.period}</div>
                        <div className={`text-[11px] ${isDark ? "text-slate-500" : "text-slate-600"}`}>{exp.location}</div>
                      </div>
                      <div className={`p-1.5 rounded-lg border transition-colors ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-300 bg-slate-100"}`}>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isExpanded ? "rotate-180" : "rotate-0"} ${isDark ? "text-slate-400" : "text-slate-700"}`} />
                      </div>
                    </div>
                  </div>

                  {/* Smooth CSS Grid Height Accordion Expansion */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-inherit space-y-5">
                        {exp.highlightEn && (
                          <p className={`text-sm leading-relaxed font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                            {exp.highlightEn}
                          </p>
                        )}

                        {exp.modules && exp.modules.length > 0 && (
                          <div className="space-y-3">
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                              Key Engineering Modules & Deliverables
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(exp.modules || []).map((mod, mIdx) => (
                                <div
                                  key={mIdx}
                                  className={`p-3.5 rounded-xl border space-y-1.5 ${
                                    isDark ? "bg-[#090d16] border-slate-800/80" : "bg-slate-50 border-slate-200 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? "bg-indigo-400" : "bg-indigo-600"}`} />
                                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                                      {mod.title}
                                    </span>
                                  </div>
                                  <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-700 font-normal"}`}>
                                    {language === "id" ? (mod.descId || mod.descEn) : (mod.descEn || mod.descId)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {exp.techStack && exp.techStack.length > 0 && (
                          <div className="space-y-2 pt-2">
                            <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                              Technologies & Tooling
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {(exp.techStack || []).map((tech, tIdx) => (
                                <span
                                  key={tIdx}
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                                    isDark
                                      ? "bg-[#090d16] border-slate-800 text-slate-300"
                                      : "bg-white border-slate-200 text-slate-700 shadow-2xs font-medium"
                                  }`}
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {exp.platformUrl && (
                          <div className="pt-2">
                            <a
                              href={exp.platformUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center space-x-1.5 text-xs font-semibold ${isDark ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-700 hover:text-indigo-800 font-bold"} hover:underline`}
                            >
                              <span>Visit Platform ({exp.platformUrl})</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: SKILLS MATRIX                                                   */}
      {/* ========================================================================= */}
      {activeTab === "skills" && (
        <section className="space-y-6 animate-fadeIn">
          {/* Skill Search Filter Bar */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex-1 flex items-center px-4 py-2.5 rounded-2xl border transition-all ${
                isDark ? "bg-[#0e121d] border-slate-800 focus-within:border-indigo-500" : "bg-white border-slate-200 focus-within:border-indigo-500 shadow-xs"
              }`}
            >
              <Search className={`w-4 h-4 mr-2.5 ${isDark ? "text-slate-500" : "text-slate-600"}`} />
              <input
                type="text"
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                placeholder={language === "id" ? "Cari teknologi, framework, tool (misal: Go, Kubernetes, PostgreSQL)..." : "Filter skills, frameworks, tools (e.g. Go, Kubernetes, PostgreSQL)..."}
                className={`w-full bg-transparent text-xs font-mono focus:outline-none ${
                  isDark ? "text-slate-200 placeholder-slate-600" : "text-slate-800 placeholder-slate-400"
                }`}
              />
              {skillSearchQuery && (
                <button
                  onClick={() => setSkillSearchQuery("")}
                  className={`p-1 rounded-md transition-colors ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSkillCategories.map((cat, idx) => (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-2xl border space-y-4 transition-all duration-300 hover:shadow-md ${
                  isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-inherit">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg border ${isDark ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {language === "id" ? (cat.nameId || cat.nameEn || cat.categoryNameId || cat.categoryName || cat.name) : (cat.nameEn || cat.nameId || cat.categoryNameEn || cat.categoryName || cat.name)}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                  }`}>
                    {cat.skills?.length} items
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {(cat.skills || []).map((skill, sIdx) => {
                    const skillName = typeof skill === "string" ? skill : (skill?.name || "");
                    const skillDesc = typeof skill === "object" ? (skill?.desc || "") : "";
                    const skillLevel = typeof skill === "object" ? (skill?.level || "") : "";
                    const isMatched = skillSearchQuery && skillName.toLowerCase().includes(skillSearchQuery.toLowerCase());
                    return (
                      <span
                        key={sIdx}
                        title={skillDesc || skillLevel || ""}
                        className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer active:scale-95 select-none ${
                          isMatched
                            ? "bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/30 scale-105"
                            : isDark
                            ? "bg-[#090d16] border-slate-800/80 text-slate-300 hover:border-indigo-500/50 hover:text-white hover:-translate-y-0.5 hover:shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-indigo-300 hover:text-slate-900 hover:-translate-y-0.5 hover:shadow-xs font-medium"
                        }`}
                      >
                        {skillName}
                        {skillLevel && (
                          <span className="ml-1.5 text-[10px] opacity-60 font-sans">
                            ({skillLevel})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: FEATURED PROJECTS                                               */}
      {/* ========================================================================= */}
      {activeTab === "projects" && (
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            <span className={`text-xs font-semibold flex items-center space-x-1 pl-1 pr-2 ${isDark ? "text-slate-500" : "text-slate-700 font-semibold"}`}>
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>
            {projectCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setProjectFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  projectFilter === cat
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xs font-bold"
                    : isDark
                    ? "bg-[#0e121d] border-slate-800 text-slate-400 hover:text-slate-200"
                    : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((p, idx) => (
              <ProjectCardItem key={idx} p={p} isDark={isDark} language={language} />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: EDUCATION & PREFERENCES                                         */}
      {/* ========================================================================= */}
      {activeTab === "education" && (
        <section className="space-y-6 animate-fadeIn">
          <div className="select-none print:hidden">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-700"}`}>
              {language === "id" ? "Pendidikan & Preferensi Kerja" : "Academic & Work Terms"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div
              className={`p-5 sm:p-6 rounded-2xl border space-y-4 ${
                isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center space-x-2.5 pb-3 border-b border-inherit">
                <div className={`p-2 rounded-xl border ${isDark ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {language === "id" ? "Pendidikan Akademik" : "Education & Degrees"}
                  </h3>
                  <p className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-600 font-medium"}`}>
                    {language === "id" ? "Landasan Akademis" : "Academic Foundation"}
                  </p>
                </div>
              </div>

              {(profile.education || []).map((edu, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {edu.institution}
                  </h4>
                  <p className={`text-xs font-semibold ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>
                    {language === "id" ? (edu.degreeId || edu.degreeEn) : (edu.degreeEn || edu.degreeId)}
                  </p>
                  <div className={`flex items-center space-x-3 text-xs font-mono ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>
                    <span>{edu.period}</span>
                    <span>•</span>
                    <span>{edu.location}</span>
                  </div>
                  <p className={`text-xs leading-relaxed pt-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                    {language === "id" ? (edu.descId || edu.descEn) : (edu.descEn || edu.descId)}
                  </p>
                </div>
              ))}
            </div>

            <div
              className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
                isDark ? "bg-[#0e121d] border-slate-800/90" : "bg-white border-slate-200 shadow-xs"
              }`}
            >
              <div className="flex items-center space-x-2.5 border-b border-inherit pb-3">
                <div className={`p-2 rounded-xl border ${isDark ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Work Preferences
                  </h3>
                  <p className={`text-xs font-mono ${isDark ? "text-slate-500" : "text-slate-600 font-medium"}`}>Engagement & Modality</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-[#090d16] border-slate-800/70" : "bg-slate-50 border-slate-200 shadow-2xs"}`}>
                  <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>Preferred Work Model:</span>
                  <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>{profile.workPreferences?.workModel || "Remote / Hybrid (Surabaya/Jakarta)"}</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-[#090d16] border-slate-800/70" : "bg-slate-50 border-slate-200 shadow-2xs"}`}>
                  <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>Employment Type:</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{profile.workPreferences?.employmentType || "Full-time, Senior/Lead Contract, Consulting"}</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-[#090d16] border-slate-800/70" : "bg-slate-50 border-slate-200 shadow-2xs"}`}>
                  <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>Notice Period:</span>
                  <span className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{profile.workPreferences?.noticePeriod || "Standard 1 Month / Negotiable"}</span>
                </div>
                <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-[#090d16] border-slate-800/70" : "bg-slate-50 border-slate-200 shadow-2xs"}`}>
                  <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>Timezone:</span>
                  <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{profile.workPreferences?.timezone || "WIB (UTC+7) • Flexible Overlap"}</span>
                </div>
                {profile.workPreferences?.preferredRoles && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-[#090d16] border-slate-800/70" : "bg-slate-50 border-slate-200 shadow-2xs"}`}>
                    <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>Target Roles:</span>
                    <span className={`font-bold text-right ${isDark ? "text-sky-400" : "text-sky-700"}`}>{profile.workPreferences.preferredRoles}</span>
                  </div>
                )}
                {profile.workPreferences?.locationPreference && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${isDark ? "bg-[#090d16] border-slate-800/70" : "bg-slate-50 border-slate-200 shadow-2xs"}`}>
                    <span className={`font-medium ${isDark ? "text-slate-400" : "text-slate-600 font-semibold"}`}>Location Notes:</span>
                    <span className={`font-bold text-right ${isDark ? "text-slate-300" : "text-slate-800"}`}>{profile.workPreferences.locationPreference}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 8. MASTER PROFILE & CV STUDIO (SEAMLESS MACOS/LINEAR SPLIT PANE MODAL)    */}
      {/* ========================================================================= */}
      {isStudioRendered && editFormData && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden select-none transition-opacity duration-200 ease-out ${
          isStudioOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
          <div
            className={`relative w-full max-w-5xl h-[92vh] max-h-[820px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ease-out ${
              isStudioOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
            } ${
              isDark ? "bg-[#0c101c] border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Modal Top Header (Seamless Flat Bar) */}
            <div className={`shrink-0 px-5 py-4 border-b border-inherit flex items-center justify-between ${isDark ? "bg-slate-950/60" : "bg-slate-50"}`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl border ${isDark ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/30" : "bg-indigo-50 text-indigo-700 border-indigo-200 font-bold"}`}>
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Profile & CV Studio</h3>
                  <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>Directly synchronized with database</p>
                </div>
              </div>
              <button
                onClick={handleCloseStudio}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"}`}
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Category Pill Switcher (Only on screens < sm, 100% hidden scrollbars) */}
            <div className={`sm:hidden shrink-0 px-3 py-2 border-b border-inherit flex items-center space-x-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isDark ? "bg-slate-950/20" : "bg-slate-100/80"}`}>
              {studioNavSections.map((sec) => {
                const SIcon = sec.icon;
                const isTabActive = studioActiveTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setStudioActiveTab(sec.id)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all whitespace-nowrap active:scale-95 ${
                      isTabActive
                        ? "bg-indigo-600 text-white shadow-xs"
                        : isDark
                        ? "text-slate-400 hover:bg-slate-800/40"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <SIcon className="w-3 h-3" />
                    <span>{sec.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Studio Body: Split-Pane Sidebar (Desktop) + Form Canvas (Seamless) */}
            <div className="flex-1 min-h-0 flex flex-row overflow-hidden">
              {/* Left Sidebar Pane (Desktop >= 640px) */}
              <aside
                className={`hidden sm:flex flex-col w-56 shrink-0 border-r border-inherit p-3 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  isDark ? "bg-slate-950/30" : "bg-slate-50/80"
                }`}
              >
                <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Sections
                </span>
                {studioNavSections.map((sec) => {
                  const SIcon = sec.icon;
                  const isTabActive = studioActiveTab === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setStudioActiveTab(sec.id)}
                      className={`w-full text-left py-2 px-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer group active:scale-98 ${
                        isTabActive
                          ? isDark
                            ? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30 shadow-xs"
                            : "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-xs"
                          : isDark
                          ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-transparent font-medium"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <SIcon className={`w-3.5 h-3.5 ${isTabActive ? (isDark ? "text-indigo-400" : "text-indigo-600") : (isDark ? "text-slate-400 group-hover:text-slate-300" : "text-slate-500 group-hover:text-slate-800")}`} />
                        <span className="truncate">{sec.label}</span>
                      </div>
                      {sec.count !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            isTabActive
                              ? "bg-indigo-600 text-white font-bold"
                              : isDark
                              ? "bg-slate-800 text-slate-400"
                              : "bg-slate-200 text-slate-700 font-semibold"
                          }`}
                        >
                          {sec.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </aside>

              {/* Right Content Canvas (Seamless Hidden Scrollbar) */}
              <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {/* STUDIO TAB 1: BASIC IDENTITY & CONTACTS */}
                {studioActiveTab === "basic" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="border-b border-inherit pb-3">
                      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Basic Identity & Headline</h4>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>Core personal branding and availability status</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Full Name</label>
                        <input
                          type="text"
                          value={editFormData.name || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                            isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Alias / Username</label>
                        <input
                          type="text"
                          value={editFormData.alias || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, alias: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                            isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                          }`}
                        />
                      </div>
                      <div>
                        <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Professional Title</label>
                        <input
                          type="text"
                          value={editFormData.title || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                            isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Base Location</label>
                        <input
                          type="text"
                          value={editFormData.location || ""}
                          onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                            isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                          }`}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Availability Status</label>
                        <input
                          type="text"
                          value={editFormData.availability?.status || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              availability: { ...editFormData.availability, status: e.target.value },
                            })
                          }
                          className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                            isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className={`block font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Hero Headline (Personal Pitch)</label>
                      <textarea
                        rows={2}
                        value={editFormData.headline?.en || editFormData.headline || ""}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            headline: { ...(editFormData.headline || {}), en: e.target.value },
                          })
                        }
                        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                          isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                        }`}
                      />
                    </div>

                    <div className="space-y-3 pt-3">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>Contact & Social Channels</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Email</label>
                          <input
                            type="email"
                            value={editFormData.contact?.email || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contact: { ...editFormData.contact, email: e.target.value },
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Phone Number</label>
                          <input
                            type="text"
                            value={editFormData.contact?.phone || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contact: { ...editFormData.contact, phone: e.target.value },
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>LinkedIn URL</label>
                          <input
                            type="url"
                            value={editFormData.contact?.linkedin || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contact: { ...editFormData.contact, linkedin: e.target.value },
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>GitHub URL</label>
                          <input
                            type="url"
                            value={editFormData.contact?.github || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contact: { ...editFormData.contact, github: e.target.value },
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Website URL</label>
                          <input
                            type="url"
                            value={editFormData.contact?.website || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contact: { ...editFormData.contact, website: e.target.value },
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block mb-1 font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Telegram URL</label>
                          <input
                            type="url"
                            value={editFormData.contact?.telegram || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                contact: { ...editFormData.contact, telegram: e.target.value },
                              })
                            }
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STUDIO TAB 2: METRICS & SUMMARY */}
                {studioActiveTab === "metrics" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-inherit pb-3">
                      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Highlight Metrics & Executive Summary</h4>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>4 key stat cards and background summary paragraphs</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>Top 4 Highlight Metrics</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(editFormData.keyMetrics || []).map((metric, mIdx) => (
                          <div
                            key={mIdx}
                            className={`p-3.5 rounded-2xl border space-y-2 ${
                              isDark ? "bg-[#090d16] border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-bold ${isDark ? "text-indigo-400" : "text-indigo-700"}`}>Metric #{mIdx + 1}</span>
                            </div>
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Label</label>
                              <input
                                type="text"
                                value={metric.labelEn || metric.label || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.keyMetrics || [])];
                                  list[mIdx] = { ...list[mIdx], labelEn: e.target.value, label: e.target.value };
                                  setEditFormData({ ...editFormData, keyMetrics: list });
                                }}
                                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Value</label>
                                <input
                                  type="text"
                                  value={metric.value || ""}
                                  onChange={(e) => {
                                    const list = [...(editFormData.keyMetrics || [])];
                                    list[mIdx] = { ...list[mIdx], value: e.target.value };
                                    setEditFormData({ ...editFormData, keyMetrics: list });
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden ${
                                    isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                  }`}
                                />
                              </div>
                              <div>
                                <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Highlight Subtitle</label>
                                <input
                                  type="text"
                                  value={metric.highlight || ""}
                                  onChange={(e) => {
                                    const list = [...(editFormData.keyMetrics || [])];
                                    list[mIdx] = { ...list[mIdx], highlight: e.target.value };
                                    setEditFormData({ ...editFormData, keyMetrics: list });
                                  }}
                                  className={`w-full px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden ${
                                    isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}>Executive Summary Paragraphs</h4>
                      <div className="space-y-3">
                        <div>
                          <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Lead Paragraph (Core Specialization & Track Record)</label>
                          <textarea
                            rows={3}
                            value={editFormData.summary?.lead?.en || editFormData.summary?.lead || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                summary: {
                                  ...(editFormData.summary || {}),
                                  lead: { ...(editFormData.summary?.lead || {}), en: e.target.value },
                                },
                              })
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                        <div>
                          <label className={`block font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-700"}`}>Body Paragraph (Tooling, Protocols & Integrations)</label>
                          <textarea
                            rows={3}
                            value={editFormData.summary?.body?.en || editFormData.summary?.body || ""}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                summary: {
                                  ...(editFormData.summary || {}),
                                  body: { ...(editFormData.summary?.body || {}), en: e.target.value },
                                },
                              })
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#090d16] border-slate-800 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STUDIO TAB 3: EXPERIENCES & MODULES */}
                {studioActiveTab === "experiences" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-inherit pb-3">
                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Work Experience Entries</h4>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>{editFormData.experiences?.length || 0} companies in history</p>
                      </div>
                      <button
                        type="button"
                        onClick={addExperience}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Experience</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(editFormData.experiences || []).map((exp, eIdx) => (
                        <div
                          key={eIdx}
                          className={`p-4 sm:p-5 rounded-2xl border space-y-4 relative ${
                            isDark ? "bg-[#090d16] border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-inherit pb-2">
                            <span className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Experience #{eIdx + 1}: {exp.company || "Unnamed"}</span>
                            <button
                              type="button"
                              onClick={() => removeExperience(eIdx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete Experience"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Company Name</label>
                              <input
                                type="text"
                                value={exp.company || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.experiences || [])];
                                  list[eIdx] = { ...list[eIdx], company: e.target.value };
                                  setEditFormData({ ...editFormData, experiences: list });
                                }}
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Role Title</label>
                              <input
                                type="text"
                                value={exp.role || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.experiences || [])];
                                  list[eIdx] = { ...list[eIdx], role: e.target.value };
                                  setEditFormData({ ...editFormData, experiences: list });
                                }}
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Product / Platform Name</label>
                              <input
                                type="text"
                                value={exp.product || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.experiences || [])];
                                  list[eIdx] = { ...list[eIdx], product: e.target.value };
                                  setEditFormData({ ...editFormData, experiences: list });
                                }}
                                placeholder="e.g. Cloudraya V2"
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Period</label>
                              <input
                                type="text"
                                value={exp.period || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.experiences || [])];
                                  list[eIdx] = { ...list[eIdx], period: e.target.value };
                                  setEditFormData({ ...editFormData, experiences: list });
                                }}
                                placeholder="e.g. Dec 2021 – Present"
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Experience Highlight Summary</label>
                            <textarea
                              rows={2}
                              value={exp.highlightEn || exp.highlight || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.experiences || [])];
                                list[eIdx] = { ...list[eIdx], highlightEn: e.target.value };
                                setEditFormData({ ...editFormData, experiences: list });
                              }}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>

                          {/* Modules Builder */}
                          <div className="space-y-2 pt-2 border-t border-inherit">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                                Modules / Deliverables ({exp.modules?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => addModuleToExperience(eIdx)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isDark ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                }`}
                              >
                                + Add Module
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(exp.modules || []).map((mod, mIdx) => (
                                <div
                                  key={mIdx}
                                  className={`p-2.5 rounded-xl border space-y-1.5 ${
                                    isDark ? "bg-[#0e121d] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={mod.title || ""}
                                      onChange={(e) => {
                                        const exps = [...(editFormData.experiences || [])];
                                        const tExp = { ...exps[eIdx] };
                                        const mods = [...(tExp.modules || [])];
                                        mods[mIdx] = { ...mods[mIdx], title: e.target.value };
                                        tExp.modules = mods;
                                        exps[eIdx] = tExp;
                                        setEditFormData({ ...editFormData, experiences: exps });
                                      }}
                                      placeholder="Module title (e.g. S3 Storage Service)"
                                      className={`w-full bg-transparent font-bold text-xs focus:outline-hidden ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeModuleFromExperience(eIdx, mIdx)}
                                      className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={mod.descEn || mod.desc || ""}
                                    onChange={(e) => {
                                      const exps = [...(editFormData.experiences || [])];
                                      const tExp = { ...exps[eIdx] };
                                      const mods = [...(tExp.modules || [])];
                                      mods[mIdx] = { ...mods[mIdx], descEn: e.target.value };
                                      tExp.modules = mods;
                                      exps[eIdx] = tExp;
                                      setEditFormData({ ...editFormData, experiences: exps });
                                    }}
                                    placeholder="Module technical description..."
                                    className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-hidden ${
                                      isDark ? "bg-[#090d16] border-slate-800 text-slate-300 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-700 font-normal focus:border-indigo-600 shadow-2xs"
                                    }`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STUDIO TAB 4: SKILLS MATRIX */}
                {studioActiveTab === "skills" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-inherit pb-3">
                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Skills Matrix Categories</h4>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>{editFormData.skillCategories?.length || 0} core disciplines</p>
                      </div>
                      <button
                        type="button"
                        onClick={addSkillCategory}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Category</span>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(editFormData.skillCategories || []).map((cat, cIdx) => (
                        <div
                          key={cIdx}
                          className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                            isDark ? "bg-[#090d16] border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-inherit pb-2">
                            <input
                              type="text"
                              value={cat.nameEn || cat.name || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.skillCategories || [])];
                                list[cIdx] = { ...list[cIdx], nameEn: e.target.value };
                                setEditFormData({ ...editFormData, skillCategories: list });
                              }}
                              className={`bg-transparent font-bold text-sm focus:outline-hidden ${isDark ? "text-indigo-400" : "text-indigo-700 font-bold"}`}
                              placeholder="Category Name"
                            />
                            <button
                              type="button"
                              onClick={() => removeSkillCategory(cIdx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold uppercase ${isDark ? "text-slate-400" : "text-slate-700"}`}>
                                Skills ({cat.skills?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => addSkillToCategory(cIdx)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                  isDark ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                }`}
                              >
                                + Add Skill
                              </button>
                            </div>

                            <div className="space-y-2">
                              {(cat.skills || []).map((skill, sIdx) => (
                                <div
                                  key={sIdx}
                                  className={`p-3 rounded-xl border space-y-2 ${
                                    isDark ? "bg-[#0e121d] border-slate-800" : "bg-white border-slate-200 shadow-2xs"
                                  }`}
                                >
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <div className="sm:col-span-2">
                                      <input
                                        type="text"
                                        value={skill.name || ""}
                                        onChange={(e) => {
                                          const cats = [...(editFormData.skillCategories || [])];
                                          const tCat = { ...cats[cIdx] };
                                          const skills = [...(tCat.skills || [])];
                                          skills[sIdx] = { ...skills[sIdx], name: e.target.value };
                                          tCat.skills = skills;
                                          cats[cIdx] = tCat;
                                          setEditFormData({ ...editFormData, skillCategories: cats });
                                        }}
                                        placeholder="Skill Name (e.g. Go / Golang)"
                                        className={`w-full bg-transparent font-bold text-xs focus:outline-hidden ${isDark ? "text-white" : "text-slate-900 font-bold"}`}
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <select
                                        value={skill.level || "Expert"}
                                        onChange={(e) => {
                                          const cats = [...(editFormData.skillCategories || [])];
                                          const tCat = { ...cats[cIdx] };
                                          const skills = [...(tCat.skills || [])];
                                          skills[sIdx] = { ...skills[sIdx], level: e.target.value };
                                          tCat.skills = skills;
                                          cats[cIdx] = tCat;
                                          setEditFormData({ ...editFormData, skillCategories: cats });
                                        }}
                                        className={`px-2 py-1 rounded-lg text-xs font-mono border ${
                                          isDark ? "bg-[#090d16] border-slate-700 text-indigo-300" : "bg-slate-50 border-slate-300 text-indigo-800 font-bold"
                                        }`}
                                      >
                                        <option value="Expert">Expert</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Proficient">Proficient</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => removeSkillFromCategory(cIdx, sIdx)}
                                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    value={skill.desc || ""}
                                    onChange={(e) => {
                                      const cats = [...(editFormData.skillCategories || [])];
                                      const tCat = { ...cats[cIdx] };
                                      const skills = [...(tCat.skills || [])];
                                      skills[sIdx] = { ...skills[sIdx], desc: e.target.value };
                                      tCat.skills = skills;
                                      cats[cIdx] = tCat;
                                      setEditFormData({ ...editFormData, skillCategories: cats });
                                    }}
                                    placeholder="Skill description / production highlights..."
                                    className={`w-full px-2 py-1.5 rounded-lg border text-xs focus:outline-hidden ${
                                      isDark ? "bg-[#090d16] border-slate-800 text-slate-300 focus:border-indigo-500" : "bg-slate-50 border-slate-200 text-slate-700 font-medium focus:border-indigo-600 shadow-2xs"
                                    }`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STUDIO TAB 5: FEATURED PROJECTS */}
                {studioActiveTab === "projects" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-inherit pb-3">
                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Featured Enterprise Projects</h4>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>{editFormData.projects?.length || 0} production showcases</p>
                      </div>
                      <button
                        type="button"
                        onClick={addProject}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>
                    </div>

                    <div className="space-y-5">
                      {(editFormData.projects || []).map((project, pIdx) => (
                        <div
                          key={pIdx}
                          className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                            isDark ? "bg-[#090d16] border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-center justify-between border-b border-inherit pb-2">
                            <span className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>Project #{pIdx + 1}: {project.title || "Untitled"}</span>
                            <button
                              type="button"
                              onClick={() => removeProject(pIdx)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Project Title</label>
                              <input
                                type="text"
                                value={project.title || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.projects || [])];
                                  list[pIdx] = { ...list[pIdx], title: e.target.value };
                                  setEditFormData({ ...editFormData, projects: list });
                                }}
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Category Badge</label>
                              <input
                                type="text"
                                value={project.badge || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.projects || [])];
                                  list[pIdx] = { ...list[pIdx], badge: e.target.value };
                                  setEditFormData({ ...editFormData, projects: list });
                                }}
                                placeholder="e.g. Cloud Platform"
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Role</label>
                              <input
                                type="text"
                                value={project.role || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.projects || [])];
                                  list[pIdx] = { ...list[pIdx], role: e.target.value };
                                  setEditFormData({ ...editFormData, projects: list });
                                }}
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                            <div>
                              <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Live URL (Optional)</label>
                              <input
                                type="url"
                                value={project.link || ""}
                                onChange={(e) => {
                                  const list = [...(editFormData.projects || [])];
                                  list[pIdx] = { ...list[pIdx], link: e.target.value };
                                  setEditFormData({ ...editFormData, projects: list });
                                }}
                                placeholder="https://..."
                                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                  isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                                }`}
                              />
                            </div>
                          </div>

                          <div>
                            <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Description (English)</label>
                            <textarea
                              rows={3}
                              value={project.descEn || project.desc || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.projects || [])];
                                list[pIdx] = { ...list[pIdx], descEn: e.target.value };
                                setEditFormData({ ...editFormData, projects: list });
                              }}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STUDIO TAB 6: EDUCATION & TERMS */}
                {studioActiveTab === "education" && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="border-b border-inherit pb-3">
                      <h4 className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Education & Degrees</h4>
                      <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>Academic foundation and curriculum history</p>
                    </div>

                    {(editFormData.education || []).map((edu, eduIdx) => (
                      <div
                        key={eduIdx}
                        className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                          isDark ? "bg-[#090d16] border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Institution</label>
                            <input
                              type="text"
                              value={edu.institution || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.education || [])];
                                list[eduIdx] = { ...list[eduIdx], institution: e.target.value };
                                setEditFormData({ ...editFormData, education: list });
                              }}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Degree</label>
                            <input
                              type="text"
                              value={edu.degreeEn || edu.degree || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.education || [])];
                                list[eduIdx] = { ...list[eduIdx], degreeEn: e.target.value };
                                setEditFormData({ ...editFormData, education: list });
                              }}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Period</label>
                            <input
                              type="text"
                              value={edu.period || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.education || [])];
                                list[eduIdx] = { ...list[eduIdx], period: e.target.value };
                                setEditFormData({ ...editFormData, education: list });
                              }}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Location</label>
                            <input
                              type="text"
                              value={edu.location || ""}
                              onChange={(e) => {
                                const list = [...(editFormData.education || [])];
                                list[eduIdx] = { ...list[eduIdx], location: e.target.value };
                                setEditFormData({ ...editFormData, education: list });
                              }}
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={`block mb-0.5 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Curriculum Description</label>
                          <textarea
                            rows={2}
                            value={edu.descEn || edu.desc || ""}
                            onChange={(e) => {
                              const list = [...(editFormData.education || [])];
                              list[eduIdx] = { ...list[eduIdx], descEn: e.target.value };
                              setEditFormData({ ...editFormData, education: list });
                            }}
                            className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                              isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                            }`}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Work Preferences & Career Modality Editor */}
                    <div className="border-t border-inherit pt-5 space-y-4">
                      <div className="border-b border-inherit pb-3">
                        <h4 className={`text-sm font-bold flex items-center space-x-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                          <Briefcase className="w-4 h-4 text-indigo-600" />
                          <span>Work Preferences & Modality</span>
                        </h4>
                        <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-600 font-medium"}`}>Availability, work models, notice period, and preferred roles</p>
                      </div>

                      <div
                        className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${
                          isDark ? "bg-[#090d16] border-slate-800" : "bg-slate-50 border-slate-200 shadow-2xs"
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className={`block mb-1 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Preferred Work Model</label>
                            <input
                              type="text"
                              value={editFormData.workPreferences?.workModel || ""}
                              placeholder="e.g. Remote / Hybrid (Surabaya/Jakarta)"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workPreferences: {
                                    ...(editFormData.workPreferences || {}),
                                    workModel: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block mb-1 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Employment Type</label>
                            <input
                              type="text"
                              value={editFormData.workPreferences?.employmentType || ""}
                              placeholder="e.g. Full-time, Senior/Lead Contract, Consulting"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workPreferences: {
                                    ...(editFormData.workPreferences || {}),
                                    employmentType: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block mb-1 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Notice Period</label>
                            <input
                              type="text"
                              value={editFormData.workPreferences?.noticePeriod || ""}
                              placeholder="e.g. Standard 1 Month / Negotiable"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workPreferences: {
                                    ...(editFormData.workPreferences || {}),
                                    noticePeriod: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block mb-1 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Timezone & Overlap</label>
                            <input
                              type="text"
                              value={editFormData.workPreferences?.timezone || ""}
                              placeholder="e.g. WIB (UTC+7) • Flexible Overlap"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workPreferences: {
                                    ...(editFormData.workPreferences || {}),
                                    timezone: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block mb-1 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Target / Preferred Roles</label>
                            <input
                              type="text"
                              value={editFormData.workPreferences?.preferredRoles || ""}
                              placeholder="e.g. Senior Backend Engineer, Lead Software Engineer, Cloud Infrastructure"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workPreferences: {
                                    ...(editFormData.workPreferences || {}),
                                    preferredRoles: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>

                          <div>
                            <label className={`block mb-1 text-[11px] font-semibold ${isDark ? "text-slate-400" : "text-slate-700"}`}>Regional & Relocation Notes</label>
                            <input
                              type="text"
                              value={editFormData.workPreferences?.locationPreference || ""}
                              placeholder="e.g. Surabaya (Onsite/Hybrid), Jakarta (Hybrid/Remote), Worldwide (Full Remote)"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workPreferences: {
                                    ...(editFormData.workPreferences || {}),
                                    locationPreference: e.target.value,
                                  },
                                })
                              }
                              className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-hidden ${
                                isDark ? "bg-[#0e121d] border-slate-700 text-white focus:border-indigo-500" : "bg-white border-slate-300 text-slate-900 focus:border-indigo-600 shadow-2xs font-medium"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>

            {/* Modal Bottom Action Bar (Fixed/Sticky) */}
            <div className={`shrink-0 px-5 py-4 border-t border-inherit flex items-center justify-between ${isDark ? "bg-slate-950/60" : "bg-slate-50"}`}>
              <button
                type="button"
                onClick={handleOpenResetConfirm}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  isDark ? "text-rose-400 hover:bg-rose-500/10" : "text-rose-600 hover:bg-rose-50 border border-rose-200"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Seed Defaults</span>
              </button>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={handleCloseStudio}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isDark ? "text-slate-400 hover:text-white hover:bg-slate-800/50" : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 border border-slate-200"
                  }`}
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reset Confirmation Dialog with Smooth Exit Transition */}
      {isResetConfirmRendered && createPortal(
        <div className={`fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          isResetConfirmOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 space-y-4 shadow-2xl transition-all duration-200 ease-out ${
              isResetConfirmOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2"
            } ${
              isDark ? "bg-[#0e121d] border-slate-800 text-white" : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <h4 className="text-sm font-bold text-rose-500 flex items-center space-x-1.5">
              <RotateCcw className="w-4 h-4" />
              <span>Reset Profile to Initial Seed?</span>
            </h4>
            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600 font-normal"}`}>
              This will revert all profile fields, career timelines, skills matrix, and project entries back to the system blueprint defaults.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={handleCloseResetConfirm}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProfile}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95 shadow-sm"
              >
                {isSaving ? "Resetting..." : "Confirm Reset"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>

      {/* ========================================================================= */}
      {/* 2. DEDICATED DYNAMIC ATS-OPTIMIZED PDF RESUME DOCUMENT (Swiss Standard)  */}
      {/* ========================================================================= */}
      <div
        id="ats-resume-container"
        style={{
          position: "fixed",
          left: "-9999px",
          top: "0",
          width: "794px",
          pointerEvents: "none",
          zIndex: -9999,
        }}
        className="font-sans text-slate-900 bg-white print:block"
        aria-hidden="true"
      >
        <div
          ref={resumeRef}
          style={{
            width: "794px",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            padding: "36px 42px",
            boxSizing: "border-box",
          }}
          className="font-sans text-slate-900 bg-white"
        >
          {/* Header & Verified Contacts */}
          <header data-block-id="header" className="border-b-2 border-slate-900 pb-2 mb-3 text-center">
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900 mb-0.5">
              {profile.name}
            </h1>
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {profile.title} • {profile.location}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[8.5pt] text-slate-700 font-medium">
              <span>{profile.contact?.email}</span>
              <span>•</span>
              <span>{profile.contact?.phone}</span>
              <span>•</span>
              <span>linkedin.com/in/fahmi-rizal</span>
              <span>•</span>
              <span>github.com/fahmirizal229</span>
              <span>•</span>
              <span>arusuka.my.id</span>
            </div>
          </header>

          {/* Executive Summary */}
          <section data-block-id="summary" className="mb-3">
            <h2 className="text-[10.5pt] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Professional Summary
            </h2>
            <p className="text-[9pt] leading-relaxed text-slate-800 text-justify mb-1">
              {leadSummaryEn}
            </p>
            {bodySummaryEn && (
              <p className="text-[9pt] leading-relaxed text-slate-800 text-justify">
                {bodySummaryEn}
              </p>
            )}
          </section>

          {/* Technical Skills Matrix */}
          <section data-block-id="skills" className="mb-3">
            <h2 className="text-[10.5pt] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Technical Skills Matrix
            </h2>
            <div className="space-y-1 text-[8.5pt]">
              {(profile.skillCategories || []).map((cat, cIdx) => (
                <div key={cIdx} className="flex flex-wrap items-baseline gap-1">
                  <span className="font-bold text-slate-900 w-44 shrink-0">
                    {language === "id" ? (cat.nameId || cat.nameEn || cat.name) : (cat.nameEn || cat.nameId || cat.name)}:
                  </span>
                  <span className="text-slate-800 flex-1">
                    {(cat.skills || []).map((s) => (typeof s === "string" ? s : (s?.name || ""))).filter(Boolean).join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section data-block-id="education" className="mb-3">
            <h2 className="text-[10.5pt] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5">
              Education
            </h2>
            <div className="space-y-1 text-[8.5pt]">
              {(profile.education || []).map((edu, eduIdx) => (
                <div key={eduIdx} className="flex items-baseline justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{edu.degreeEn || edu.degreeId}</span>
                    <span className="text-slate-700 font-medium"> — {edu.institution}</span>
                  </div>
                  <div className="text-[8pt] text-slate-600 shrink-0 font-medium">
                    {edu.period} | {edu.location}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Work Experience Header */}
          <div data-block-id="exp-title" className="mb-2">
            <h2 className="text-[10.5pt] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Work Experience
            </h2>
          </div>

          {/* Work Experience Items */}
          {(profile.experiences || []).map((exp, eIdx) => (
            <div data-block-id={`exp-${eIdx}`} key={eIdx} className="space-y-1 mb-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10.5pt] font-extrabold text-slate-900">
                    {exp.role}
                  </span>
                  <span className="text-[10pt] font-semibold text-slate-700">
                    {" "}— {exp.company} {exp.product ? `(${exp.product})` : ""}
                  </span>
                </div>
                <div className="text-[8.5pt] font-semibold text-slate-600 text-right shrink-0">
                  {exp.period} | {exp.location}
                </div>
              </div>

              {exp.highlightEn && (
                <p className="text-[8.5pt] italic text-slate-700 leading-snug">
                  {exp.highlightEn}
                </p>
              )}

              <ul className="list-disc list-outside pl-4 space-y-1 text-[8.5pt] text-slate-800">
                {(exp.modules || []).map((m, mIdx) => (
                  <li key={mIdx} className="leading-snug">
                    <strong className="text-slate-900 font-semibold">{m.title}:</strong>{" "}
                    <span>{m.descEn || m.descId}</span>
                  </li>
                ))}
              </ul>

              {exp.techStack && (
                <div className="text-[8pt] text-slate-600 pt-0.5">
                  <span className="font-semibold text-slate-700">Technologies:</span>{" "}
                  {exp.techStack.join(" • ")}
                </div>
              )}
            </div>
          ))}

          {/* Featured Projects Header */}
          <div data-block-id="proj-title" className="mb-2">
            <h2 className="text-[10.5pt] font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5">
              Featured Systems & Production Projects
            </h2>
          </div>

          {/* Featured Projects Items */}
          {(profile.projects || []).map((proj, pIdx) => (
            <div data-block-id={`proj-${pIdx}`} key={pIdx} className="text-[8.5pt] mb-2.5">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-slate-900">
                  {proj.title} {proj.tagline ? `— ${proj.tagline}` : ""}
                </span>
                <span className="text-[8pt] font-semibold text-slate-600 shrink-0">
                  {proj.badge}
                </span>
              </div>
              <p className="text-slate-800 text-[8pt] leading-snug">
                {proj.descEn || proj.descId}
              </p>
              {proj.tech && (
                <p className="text-[7.5pt] text-slate-500">
                  <span className="font-semibold text-slate-600">Tech:</span> {proj.tech.join(" • ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
