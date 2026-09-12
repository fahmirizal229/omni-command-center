import sqlite3
import json
from pathlib import Path
from backend.config import TASK_DB, JOB_DB, PORTFOLIO_DB

DEFAULT_PROFILE_DATA = {
    "name": "Muhammad Fahmi Rizal",
    "alias": "arusuka",
    "title": "Backend Engineer & Cloud Infrastructure",
    "headline": {
        "en": "Backend Engineer focused on distributed systems, Go, PHP (Laravel), Node.js, and cloud infrastructure.",
        "id": "Backend Engineer yang berfokus pada sistem backend Go, PHP (Laravel), Node.js, dan arsitektur cloud terdistribusi."
    },
    "location": "Surabaya, Jawa Timur, Indonesia",
    "contact": {
        "phone": "+62 821-3471-5478",
        "email": "fahmirizal96@gmail.com",
        "whatsapp": "https://wa.me/6282134715478",
        "linkedin": "https://www.linkedin.com/in/fahmi-rizal",
        "github": "https://github.com/fahmirizal229",
        "telegram": "https://t.me/fahmi_rizal",
        "website": "https://arusuka.my.id",
        "dashboardUrl": "https://dashboard.arusuka.my.id"
    },
    "availability": {
        "status": "Open to Work & Engineering Discussions",
        "statusId": "Terbuka untuk Diskusi & Peluang Kerja",
        "badgeColor": "emerald"
    },
    "summary": {
        "lead": {
            "en": "Backend & Cloud Infrastructure Engineer with 6+ years of experience building and maintaining production distributed systems, cloud platforms (IaaS/PaaS), and high-throughput APIs. Directly involved in engineering Cloudraya V2 core engines at Wowrack—spanning VM compute & bare-metal management, S3-compatible storage, managed Kubernetes provisioning, and automated usage billing.",
            "id": "Backend & Cloud Infrastructure Engineer dengan pengalaman 6+ tahun dalam membangun dan memelihara sistem terdistribusi, platform cloud (IaaS/PaaS), dan API skala produksi. Terlibat langsung dalam pengembangan core engine Cloudraya V2 di Wowrack—mulai dari manajemen VM compute & bare-metal, storage kompatibel S3, provisioning cluster Kubernetes, hingga automated metering & billing."
        },
        "body": {
            "en": "Hands-on with Go, PHP (Laravel), Node.js, PostgreSQL, Redis, and event-driven architectures. Experienced in high-throughput IoT sensor data pipelines (Suramadu Bridge), government service portals (Surabaya City Govt & Dishub), and enterprise integrations.",
            "id": "Terbiasa bekerja dengan Go, PHP (Laravel), Node.js, PostgreSQL, Redis, dan event-driven architecture. Berpengalaman menangani pipeline data telemetri IoT (Jembatan Suramadu), portal instansi pemerintah (Pemkot Surabaya & Dishub), serta sistem enterprise."
        }
    },
    "keyMetrics": [
        {
            "labelEn": "Experience",
            "labelId": "Pengalaman",
            "value": "6+ Thn",
            "highlight": "Backend & Cloud"
        },
        {
            "labelEn": "Focus Stack",
            "labelId": "Stack Utama",
            "value": "Go / PHP",
            "highlight": "Laravel & Node.js"
        },
        {
            "labelEn": "Core Platform",
            "labelId": "Platform Inti",
            "value": "Cloudraya",
            "highlight": "IaaS & PaaS Engine"
        },
        {
            "labelEn": "Location",
            "labelId": "Domisili",
            "value": "Surabaya",
            "highlight": "Jawa Timur, ID"
        }
    ],
    "skillCategories": [
        {
            "nameEn": "Backend & Services",
            "nameId": "Backend & Layanan",
            "icon": "Server",
            "skills": [
                {
                    "name": "Go (Golang)",
                    "level": "Advanced",
                    "desc": "Microservices berkinerja tinggi, concurrency, dan CLI tools"
                },
                {
                    "name": "PHP & Laravel",
                    "level": "Expert",
                    "desc": "Clean Architecture, Event-Driven, Laravel Reverb WebSockets"
                },
                {
                    "name": "Node.js & TypeScript",
                    "level": "Advanced",
                    "desc": "REST APIs, Express, NestJS, async I/O"
                },
                {
                    "name": "Python",
                    "level": "Proficient",
                    "desc": "FastAPI, otomasi sistem, integrasi API & tooling"
                }
            ]
        },
        {
            "nameEn": "Databases & Caching",
            "nameId": "Database & Caching",
            "icon": "Database",
            "skills": [
                {
                    "name": "PostgreSQL",
                    "level": "Expert",
                    "desc": "Desain skema, indexing, optimasi query, dan partisi"
                },
                {
                    "name": "MySQL / MariaDB",
                    "level": "Expert",
                    "desc": "Relational database modeling, query tuning, replikasi"
                },
                {
                    "name": "Redis",
                    "level": "Advanced",
                    "desc": "Distributed caching, pub/sub queues, session store"
                },
                {
                    "name": "MongoDB",
                    "level": "Advanced",
                    "desc": "Document storage, aggregation pipeline, indexing"
                },
                {
                    "name": "S3 Object Storage",
                    "level": "Expert",
                    "desc": "Protokol S3 API, bucket management, block storage"
                }
            ]
        },
        {
            "nameEn": "Cloud & Infrastructure",
            "nameId": "Cloud & Infrastruktur",
            "icon": "Cloud",
            "skills": [
                {
                    "name": "Kubernetes (K8s)",
                    "level": "Advanced",
                    "desc": "Cluster provisioning, Ingress, service networking"
                },
                {
                    "name": "Docker",
                    "level": "Expert",
                    "desc": "Containerization, multi-stage build, docker-compose"
                },
                {
                    "name": "Apache CloudStack",
                    "level": "Advanced",
                    "desc": "Orkestrasi hypervisor, VM compute lifecycle"
                },
                {
                    "name": "Linux Administration",
                    "level": "Expert",
                    "desc": "Debian/Ubuntu, systemd, security hardening, networking"
                },
                {
                    "name": "CI/CD Automation",
                    "level": "Advanced",
                    "desc": "Bitbucket Pipelines, GitHub Actions, automated deployment"
                }
            ]
        },
        {
            "nameEn": "Testing & Security",
            "nameId": "Testing & Keamanan",
            "icon": "ShieldCheck",
            "skills": [
                {
                    "name": "PHPUnit Automated Testing",
                    "level": "Expert",
                    "desc": "Unit test, feature test, service mocking"
                },
                {
                    "name": "API Security",
                    "level": "Expert",
                    "desc": "Rate limiting, JWT auth, input validation, strict CORS"
                },
                {
                    "name": "Production L3 Support",
                    "level": "Expert",
                    "desc": "Root Cause Analysis (RCA), hotfix, debugging sistem live"
                }
            ]
        }
    ],
    "experiences": [
        {
            "company": "Wowrack Indonesia",
            "product": "Cloudraya V2",
            "platformUrl": "https://panel.cloudraya.com/",
            "role": "Backend Developer",
            "period": "Des 2021 – Sekarang",
            "duration": "4+ tahun",
            "location": "Surabaya, Jawa Timur",
            "type": "Full-time",
            "highlightEn": "Engineered core microservices for Cloudraya V2 platform, managing compute provisioning, storage, networking, and usage billing.",
            "highlightId": "Mengembangkan engine microservices untuk platform Cloudraya V2, menangani provisioning komputasi, storage, networking, dan billing.",
            "modules": [
                {
                    "title": "Compute & Virtualization Engine",
                    "descEn": "Built microservices for VM provisioning, CloudStack hypervisor orchestration, and Bare-Metal server lifecycle.",
                    "descId": "Membangun microservices untuk provisioning Virtual Machine, orkestrasi CloudStack hypervisor, dan siklus server Bare-Metal."
                },
                {
                    "title": "S3 Object Storage Service",
                    "descEn": "Engineered high-throughput S3-compatible Object Storage services, dynamic DNS bucket routing, and block storage.",
                    "descId": "Mengembangkan layanan Object Storage kompatibel S3, routing DNS bucket dinamis, dan pengelolaan block storage."
                },
                {
                    "title": "Managed Kubernetes & Networking",
                    "descEn": "Built automated services for Kubernetes cluster provisioning and software-defined networking (VPC, public IP, firewall).",
                    "descId": "Membangun automasi provisioning cluster Kubernetes terkelola dan konfigurasi jaringan cloud (VPC, IP publik, firewall)."
                },
                {
                    "title": "Usage Metering & Billing Engine",
                    "descEn": "Designed real-time usage-based billing pipelines, multi-region resource quota management, and automated invoices.",
                    "descId": "Merancang pipeline kalkulasi billing berbasis pemakaian riil, kuota resource multi-region, dan otomasi invoice bulanan."
                },
                {
                    "title": "Real-time Telemetry & Notification",
                    "descEn": "Implemented real-time event streaming via Laravel Reverb (WebSockets) and centralized OS image template repository.",
                    "descId": "Mengembangkan sistem notifikasi realtime via Laravel Reverb (WebSockets) dan repositori template OS image."
                },
                {
                    "title": "Testing, CI/CD & L3 Support",
                    "descEn": "Enforced reliability with automated PHPUnit suites, CI/CD pipelines to Kubernetes, and handled L3 technical escalations.",
                    "descId": "Menjaga kualitas sistem dengan automated testing PHPUnit menyeluruh, CI/CD ke Kubernetes, serta menangani eskalasi L3 produksi."
                }
            ],
            "techStack": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "MySQL",
                "MongoDB",
                "Redis",
                "WebSockets (Reverb)",
                "Kubernetes",
                "Docker",
                "Bitbucket CI/CD",
                "CloudStack",
                "S3 API",
                "PHPUnit"
            ]
        },
        {
            "company": "Energeek",
            "role": "Backend Developer",
            "period": "Mar 2019 – Des 2021",
            "duration": "2 tahun 10 bulan",
            "location": "Surabaya, Jawa Timur",
            "type": "Full-time",
            "highlightEn": "Developed backend APIs and web applications for government institutions, state-owned enterprises, and IoT systems.",
            "highlightId": "Mengembangkan dan mengelola aplikasi web serta backend API untuk instansi pemerintah, BUMN, dan proyek IoT.",
            "modules": [
                {
                    "title": "Portal Instansi Pemerintah",
                    "descEn": "Built asset management & proposal approval portal for Surabaya City Government, and vehicle registration system for Dishub.",
                    "descId": "Membangun sistem manajemen aset dan proposal untuk Pemkot Surabaya, serta sistem penomoran registrasi kendaraan Dishub."
                },
                {
                    "title": "Aplikasi Enterprise & BUMN",
                    "descEn": "Engineered internal ERP modules for Petrokimia Gresik (Nisa), project management system for PT WIKA (SIP), and portal for Universitas Pertamina.",
                    "descId": "Mengembangkan modul ERP Petrokimia Gresik (Nisa), sistem informasi proyek PT Wijaya Karya (WIKA SIP), dan portal Universitas Pertamina."
                },
                {
                    "title": "Pipeline Telemetri IoT Sensor",
                    "descEn": "Built data ingestion backend for Suramadu Bridge telemetry system to capture and monitor structural vibration & environmental data.",
                    "descId": "Membangun backend data ingestion untuk proyek sensor telemetri Jembatan Suramadu guna memantau getaran struktural dan cuaca."
                },
                {
                    "title": "Deployment & Optimasi Database",
                    "descEn": "Managed VM server deployments, query optimization on PostgreSQL, and delivered ongoing bugfixes & maintenance.",
                    "descId": "Mengelola deployment server Virtual Machine, optimasi query database PostgreSQL, serta pemeliharaan rutin aplikasi."
                }
            ],
            "techStack": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "JavaScript",
                "HTML5",
                "Bootstrap",
                "REST APIs",
                "Virtual Machines",
                "Git"
            ]
        }
    ],
    "education": [
        {
            "institution": "Universitas Pembangunan Nasional 'Veteran' Jawa Timur",
            "degreeEn": "Bachelor of Computer Science (S.Kom) - Informatics Engineering",
            "degreeId": "Sarjana Komputer (S.Kom) - Teknik Informatika",
            "period": "2014 – 2018",
            "location": "Surabaya, Indonesia",
            "descEn": "Studied Software Engineering, Database Systems, Computer Networks, and Distributed Computing.",
            "descId": "Fokus pada Rekayasa Perangkat Lunak, Sistem Basis Data, Jaringan Komputer, dan Komputasi Terdistribusi."
        }
    ],
    "projects": [
        {
            "title": "Cloudraya V2 Cloud Platform",
            "tagline": "High-Throughput IaaS & PaaS Engine",
            "role": "Core Backend Engineer",
            "descEn": "Enterprise multi-region cloud infrastructure platform orchestrating VM & Bare-Metal lifecycles, S3-compatible object storage, managed Kubernetes clusters, and automated real-time usage billing pipelines.",
            "descId": "Platform manajemen infrastruktur cloud multi-region skala enterprise yang mengorkestrasi siklus hidup Virtual Machine & Bare-Metal, S3 Object Storage berkinerja tinggi, kluster Kubernetes terkelola, serta pipeline otomasi metering & billing real-time.",
            "tech": [
                "PHP",
                "Laravel",
                "Go",
                "PostgreSQL",
                "Redis",
                "Kubernetes",
                "CloudStack",
                "WebSockets"
            ],
            "badge": "Cloud Platform",
            "link": "https://panel.cloudraya.com/"
        },
        {
            "title": "Suramadu Bridge IoT Telemetry",
            "tagline": "Real-time Structural & Environmental Ingestion",
            "role": "Backend Engineer",
            "descEn": "High-throughput data ingestion backend capturing real-time structural vibration and environmental sensor metrics for the Suramadu Bridge to support structural health monitoring.",
            "descId": "Pipeline data ingestion dan monitoring getaran struktural serta sensor cuaca Jembatan Suramadu secara real-time untuk menjamin keamanan & ketahanan infrastruktur vital nasional.",
            "tech": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "REST APIs",
                "Time-Series"
            ],
            "badge": "IoT Telemetry"
        },
        {
            "title": "Surabaya Pump Station & Heavy Equipment Asset Management",
            "tagline": "Asset Monitoring & Flood Control System",
            "role": "Backend Programmer",
            "descEn": "High-performance RESTful API backend engineered for Surabaya City Government to monitor flood-control water pump stations and municipal heavy equipment fleets across Web & Mobile platforms.",
            "descId": "RESTful API berkinerja tinggi untuk monitoring aset rumah pompa air pengendali banjir dan armada alat berat Pemerintah Kota Surabaya secara real-time antar platform Web & Mobile.",
            "tech": [
                "PHP",
                "Lumen",
                "PostgreSQL",
                "REST APIs",
                "Mobile Integration"
            ],
            "badge": "Government Portal"
        },
        {
            "title": "Surabaya Municipal Infrastructure Proposal & Survey System",
            "tagline": "Field Survey & Project Approval Workflow",
            "role": "Backend API Engineer",
            "descEn": "Mobile-focused backend API automating field feasibility surveys, hierarchical approval workflows, and task dispatching to municipal task forces for Surabaya City infrastructure proposals.",
            "descId": "Sistem backend survei lapangan dan approval berjenjang untuk usulan proyek infrastruktur perkotaan dan permukiman Pemkot Surabaya, mengotomasi distribusi penugasan langsung ke satgas teknis.",
            "tech": [
                "PHP",
                "Laravel",
                "MySQL",
                "REST APIs",
                "Mobile Integration"
            ],
            "badge": "Smart Governance"
        },
        {
            "title": "Dishub Surabaya E-Surat & Official Letter Allocation Engine",
            "tagline": "Centralized Document Registry & Audit System",
            "role": "Backend API Engineer",
            "descEn": "Centralized digital registry and official letter allocation engine integrated with Surabaya Transportation Agency's E-Surat portal, featuring comprehensive usage auditing across departments.",
            "descId": "Engine penomoran surat resmi digital terpusat yang terintegrasi dengan portal E-Surat Dinas Perhubungan Surabaya, dilengkapi audit trail pemakaian nomor surat per bidang/satuan kerja.",
            "tech": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "E-Surat Integration",
                "REST APIs"
            ],
            "badge": "Public Sector"
        },
        {
            "title": "Petrokimia Gresik NISA - Market & Competitor Intelligence",
            "tagline": "Agricultural Market & Competitor Monitoring",
            "role": "Semi Full-Stack Developer",
            "descEn": "Market intelligence and competitor monitoring platform for PT Petrokimia Gresik, analyzing regional fertilizer distribution dynamics, pricing movements, and field sales reporting.",
            "descId": "Sistem monitoring pasar dan intelijen kompetitor industri pupuk untuk PT Petrokimia Gresik guna memetakan tren harga, pergerakan produk rival, dan persebaran distribusi pasar regional.",
            "tech": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "JavaScript",
                "Analytics"
            ],
            "badge": "Enterprise Intelligence"
        },
        {
            "title": "WIKA SIP - Construction Project Resource & Finance Engine",
            "tagline": "Project Planning, Logistics & Cashflow Engine",
            "role": "Backend Developer",
            "descEn": "Core backend services for PT Wijaya Karya (WIKA) Tbk Project Information System, handling construction material planning, equipment logistics, and multi-tier vendor disbursement workflows.",
            "descId": "Backend core Sistem Informasi Proyek (SIP) PT Wijaya Karya (WIKA) Tbk untuk orkestrasi kebutuhan alat/material, pemantauan progres lapangan, dan otomasi manajemen pembayaran vendor.",
            "tech": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "REST APIs",
                "Mobile & Web"
            ],
            "badge": "Construction ERP"
        },
        {
            "title": "CuddleMe Dodolo E-Commerce Back-Office Portal",
            "tagline": "Product Catalog & Logistics Automation",
            "role": "Semi Full-Stack Developer",
            "descEn": "Back-office administration and inventory management system for CuddleMe baby products (Dodolo), featuring automated logistics rate calculations via RajaOngkir API and payment reconciliation.",
            "descId": "Portal administrasi e-commerce brand perlengkapan bayi CuddleMe (Dodolo), mencakup otomasi kalkulasi tarif ekspedisi (RajaOngkir API), verifikasi pembayaran, dan manajemen inventaris produk.",
            "tech": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "RajaOngkir API",
                "Order Management"
            ],
            "badge": "E-Commerce ERP"
        },
        {
            "title": "Universitas Pertamina Research Grant Funding Portal",
            "tagline": "Research Grants & Budget Disbursement Portal",
            "role": "Backend API Engineer",
            "descEn": "RESTful API backend powering Universitas Pertamina's research grant management portal, facilitating grant proposal submissions, peer-review cycles, and budget disbursement tracking.",
            "descId": "Backend REST API sistem manajemen pendanaan riset ilmiah Universitas Pertamina, mencakup siklus pengajuan proposal, telaah peer-review, hingga realisasi pencairan dana penelitian.",
            "tech": [
                "PHP",
                "Laravel",
                "PostgreSQL",
                "REST APIs"
            ],
            "badge": "Academic System"
        },
        {
            "title": "Omni Command Center & Storage Vault",
            "tagline": "Personal Server Dashboard & Hub",
            "role": "Full-Stack Creator",
            "descEn": "Hardened server dashboard and private vault with real-time system metrics via WebSockets, Obsidian Second Brain sync, and BMKG earthquake warnings.",
            "descId": "Dashboard server dan vault pribadi dengan pemantauan metrik server via WebSocket, sinkronisasi Obsidian Second Brain, dan peringatan dini BMKG.",
            "tech": [
                "FastAPI",
                "React 19",
                "SQLite WAL",
                "Tailwind CSS",
                "WebSockets"
            ],
            "badge": "Private Vault",
            "link": "https://dashboard.arusuka.my.id"
        }
    ]
}

def get_db_connection(db_path: Path) -> sqlite3.Connection:
    """Open SQLite connection with row factory and standard busy timeout."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=10.0)
    conn.row_factory = sqlite3.Row
    return conn

def init_task_db():
    """Initialize tasks database table schema if it does not exist."""
    TASK_DB.parent.mkdir(parents=True, exist_ok=True)
    with get_db_connection(TASK_DB) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS personal_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT DEFAULT "",
                status TEXT NOT NULL DEFAULT "todo",
                priority TEXT NOT NULL DEFAULT "medium",
                category TEXT DEFAULT "Personal",
                due_date TEXT DEFAULT "",
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def init_job_db():
    """Initialize job hunter database table schema if it does not exist."""
    JOB_DB.parent.mkdir(parents=True, exist_ok=True)
    with get_db_connection(JOB_DB) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS job_applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                location TEXT DEFAULT "Surabaya / Remote",
                salary TEXT DEFAULT "",
                job_url TEXT DEFAULT "",
                status TEXT NOT NULL DEFAULT "wishlist",
                applied_date TEXT DEFAULT "",
                next_schedule TEXT DEFAULT "",
                notes TEXT DEFAULT "",
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

def init_portfolio_db():
    """Initialize portfolio database table schema and default seed data."""
    PORTFOLIO_DB.parent.mkdir(parents=True, exist_ok=True)
    with get_db_connection(PORTFOLIO_DB) as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                data TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL,
                saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Check if main_profile exists, if not, seed with DEFAULT_PROFILE_DATA
        cur = conn.cursor()
        cur.execute("SELECT id FROM portfolio_profile WHERE key = 'main_profile'")
        row = cur.fetchone()
        if not row:
            cur.execute(
                "INSERT INTO portfolio_profile (key, data, updated_at) VALUES ('main_profile', ?, CURRENT_TIMESTAMP)",
                (json.dumps(DEFAULT_PROFILE_DATA, ensure_ascii=False),)
            )
            cur.execute(
                "INSERT INTO portfolio_history (data, saved_at) VALUES (?, CURRENT_TIMESTAMP)",
                (json.dumps(DEFAULT_PROFILE_DATA, ensure_ascii=False),)
            )
        conn.commit()

def get_portfolio_profile() -> dict:
    """Fetch current portfolio profile data as dict."""
    if not PORTFOLIO_DB.exists():
        init_portfolio_db()
    with get_db_connection(PORTFOLIO_DB) as conn:
        cur = conn.cursor()
        cur.execute("SELECT data, updated_at FROM portfolio_profile WHERE key = 'main_profile'")
        row = cur.fetchone()
        if row and row["data"]:
            try:
                data = json.loads(row["data"])
                data["_updatedAt"] = row["updated_at"]
                return data
            except Exception:
                pass
    return DEFAULT_PROFILE_DATA

def save_portfolio_profile(profile_data: dict) -> dict:
    """Persist updated portfolio profile data into SQLite with audit history."""
    if not PORTFOLIO_DB.exists():
        init_portfolio_db()
    
    # Strip any temporary meta fields before saving
    save_data = {k: v for k, v in profile_data.items() if not k.startswith("_")}
    json_str = json.dumps(save_data, ensure_ascii=False)
    
    with get_db_connection(PORTFOLIO_DB) as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO portfolio_profile (key, data, updated_at) 
            VALUES ('main_profile', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET 
                data = excluded.data, 
                updated_at = CURRENT_TIMESTAMP
        """, (json_str,))
        
        # Save snapshot to history (keep last 30 snapshots)
        cur.execute("INSERT INTO portfolio_history (data, saved_at) VALUES (?, CURRENT_TIMESTAMP)", (json_str,))
        cur.execute("""
            DELETE FROM portfolio_history WHERE id NOT IN (
                SELECT id FROM portfolio_history ORDER BY id DESC LIMIT 30
            )
        """)
        conn.commit()
    
    return get_portfolio_profile()

def reset_portfolio_profile() -> dict:
    """Reset portfolio profile back to default initial seed."""
    return save_portfolio_profile(DEFAULT_PROFILE_DATA)

# Initialize all DBs on import
init_task_db()
init_job_db()
init_portfolio_db()

