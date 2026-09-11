import sqlite3
import json
from pathlib import Path
from backend.config import TASK_DB, JOB_DB, PORTFOLIO_DB

DEFAULT_PROFILE_DATA = {
    "name": "Muhammad Fahmi Rizal",
    "alias": "arusuka",
    "title": "Back-End Engineer & Cloud Architect",
    "headline": {
        "en": "Back-End Engineer specializing in Go, PHP (Laravel), Node.js, Distributed Microservices, and Kubernetes Cloud Architecture.",
        "id": "Back-End Engineer spesialis Go, PHP (Laravel), Node.js, Arsitektur Microservices Terdistribusi, dan Kubernetes Cloud Infrastructure."
    },
    "location": "Surabaya, Jawa Timur, Indonesia",
    "contact": {
        "phone": "+62 821-3471-5478",
        "email": "fahmirizal96@gmail.com",
        "whatsapp": "https://wa.me/6282134715478",
        "linkedin": "https://www.linkedin.com/in/fahmi-rizal",
        "github": "https://github.com/fahmirizal229",
        "telegram": "https://t.me/fahmirizal96",
        "website": "https://arusuka.my.id",
        "dashboardUrl": "https://dashboard.arusuka.my.id"
    },
    "availability": {
        "status": "Available for Opportunities",
        "statusId": "Terbuka untuk Peluang Kerja & Kolaborasi",
        "badgeColor": "emerald"
    },
    "summary": {
        "lead": {
            "en": "Results-driven Senior Backend & Cloud Infrastructure Engineer with 6+ years of experience architecting resilient distributed systems, enterprise cloud platforms (IaaS & PaaS), and high-throughput microservices.",
            "id": "Senior Backend & Cloud Infrastructure Engineer berpengalaman 6+ tahun dalam merancang arsitektur sistem terdistribusi, platform cloud enterprise (IaaS & PaaS), dan microservices berkinerja tinggi."
        },
        "highlights": [
            {
                "icon": "Cloud",
                "titleEn": "Cloud Architecture & Microservices",
                "titleId": "Arsitektur Cloud & Microservices",
                "descEn": "Designed and engineered core Cloudraya V2 microservices from scratch, including Compute VM lifecycle, S3-compatible Object Storage, Managed Kubernetes provisioning, and real-time usage-based billing engines.",
                "descId": "Merancang dan membangun ekosistem microservices Cloudraya V2 dari nol: siklus hidup Compute VM, S3-compatible Object Storage, provisioning Kubernetes terkelola, dan engine billing berbasis pemakaian real-time."
            },
            {
                "icon": "Server",
                "titleEn": "Backend & Distributed Systems",
                "titleId": "Backend & Sistem Terdistribusi",
                "descEn": "Extensive hands-on expertise in Go, PHP (Laravel), Node.js, PostgreSQL, MongoDB, Redis caching, event-driven messaging, and real-time WebSockets (Laravel Reverb).",
                "descId": "Keahlian mendalam dalam Go, PHP (Laravel), Node.js, PostgreSQL, MongoDB, caching Redis, arsitektur event-driven, dan real-time WebSockets (Laravel Reverb)."
            },
            {
                "icon": "ShieldCheck",
                "titleEn": "Reliability & Automated Quality",
                "titleId": "Keandalan & Otomasi Kualitas",
                "descEn": "Ensured 99.9% uptime SLA through rigorous automated test suites (PHPUnit Unit & Feature tests with microservice mocking), Bitbucket CI/CD pipelines, and proactive L3 production support.",
                "descId": "Menjamin SLA uptime 99.9% melalui automated testing ketat (PHPUnit Unit & Feature tests dengan microservice mocking), Bitbucket CI/CD pipeline, dan dukungan eskalasi L3 produksi."
            },
            {
                "icon": "Layers",
                "titleEn": "Enterprise & Real-Time IoT",
                "titleId": "Solusi Enterprise & IoT Real-Time",
                "descEn": "Demonstrated track record delivering high-throughput IoT sensor ingestion (Suramadu Bridge), government portals (Surabaya City & Dishub), and enterprise ERP modules (Petrokimia Gresik, WIKA).",
                "descId": "Rekam jejak terbukti dalam data ingestion telemetri sensor IoT berkecepatan tinggi (Jembatan Suramadu), portal pemerintah (Pemkot Surabaya & Dishub), serta ERP BUMN (Petrokimia Gresik, WIKA)."
            }
        ]
    },
    "keyMetrics": [
        {"labelEn": "Years Experience", "labelId": "Tahun Pengalaman", "value": "6+", "highlight": "Backend & Cloud"},
        {"labelEn": "Microservices Engineered", "labelId": "Layanan Microservices", "value": "10+", "highlight": "Cloudraya V2 IaaS/PaaS"},
        {"labelEn": "Enterprise & Gov Projects", "labelId": "Proyek BUMN & Pemerintah", "value": "15+", "highlight": "Pemkot, BUMN, IoT"},
        {"labelEn": "Platform Reliability", "labelId": "Standar Keandalan Sistem", "value": "99.9%", "highlight": "Automated Testing & HA"}
    ],
    "skillCategories": [
        {
            "nameEn": "Backend & Distributed Systems",
            "nameId": "Backend & Sistem Terdistribusi",
            "icon": "Server",
            "skills": [
                {"name": "Go (Golang)", "level": "Advanced", "desc": "High-performance microservices & CLI tools"},
                {"name": "PHP & Laravel", "level": "Expert", "desc": "Clean Architecture, Event-Driven, Reverb WebSockets"},
                {"name": "Node.js & TypeScript", "level": "Advanced", "desc": "REST APIs, NestJS, Express, Async I/O"},
                {"name": "Python", "level": "Proficient", "desc": "FastAPI, Automation, MCP Servers, Agent Tooling"},
                {"name": "Microservices Architecture", "level": "Expert", "desc": "API Gateway, Service Discovery, Domain-Driven Design"}
            ]
        },
        {
            "nameEn": "Databases & Storage Engines",
            "nameId": "Database & Mesin Penyimpanan",
            "icon": "Database",
            "skills": [
                {"name": "PostgreSQL", "level": "Expert", "desc": "Complex indexing, partitioning, query optimization"},
                {"name": "MySQL / MariaDB", "level": "Expert", "desc": "Relational modeling, replication, tuning"},
                {"name": "MongoDB", "level": "Advanced", "desc": "Document storage, schema design, aggregation"},
                {"name": "Redis", "level": "Advanced", "desc": "Distributed caching, pub/sub queues, rate limiters"},
                {"name": "S3 Object Storage", "level": "Expert", "desc": "S3 API protocol, bucket routing, block storage"}
            ]
        },
        {
            "nameEn": "Cloud, Containers & DevOps",
            "nameId": "Cloud, Container & DevOps",
            "icon": "Cloud",
            "skills": [
                {"name": "Kubernetes (K8s)", "level": "Advanced", "desc": "Cluster orchestration, Ingress, VPC, Helm"},
                {"name": "Docker", "level": "Expert", "desc": "Multi-stage builds, container optimization, compose"},
                {"name": "Apache CloudStack", "level": "Advanced", "desc": "VM provisioning, compute lifecycle, bare-metal"},
                {"name": "Linux Administration", "level": "Expert", "desc": "Debian/Ubuntu hardening, Systemd, UFW, Fail2ban"},
                {"name": "CI/CD Pipelines", "level": "Advanced", "desc": "Bitbucket Pipelines, GitHub Actions, Automated Testing"}
            ]
        },
        {
            "nameEn": "Quality, Testing & Reliability",
            "nameId": "Kualitas, Testing & Keandalan",
            "icon": "ShieldCheck",
            "skills": [
                {"name": "PHPUnit Automated Testing", "level": "Expert", "desc": "Unit & Feature tests, microservice mocking"},
                {"name": "API Security & Hardening", "level": "Expert", "desc": "Anti-Brute Force, HMAC tokens, JWT, Strict CORS"},
                {"name": "L3 Production Support", "level": "Expert", "desc": "Deep debugging, RCA, live hotfix, telemetry"},
                {"name": "WebSocket & Realtime", "level": "Advanced", "desc": "Laravel Reverb, socket push notifications"}
            ]
        }
    ],
    "experiences": [
        {
            "company": "Wowrack Indonesia",
            "product": "Cloudraya V2",
            "platformUrl": "https://panel.cloudraya.com/",
            "role": "Back End Developer",
            "period": "Des 2021 – Present",
            "duration": "4+ years",
            "location": "Surabaya, Jawa Timur",
            "type": "Full-time",
            "highlightEn": "Architected and developed the Cloudraya V2 microservices ecosystem from the ground up, powering full-lifecycle Cloud IaaS & PaaS platform operations.",
            "highlightId": "Merancang dan membangun ekosistem microservices Cloudraya V2 dari nol, menggerakkan operasional platform Cloud IaaS & PaaS secara menyeluruh.",
            "modules": [
                {
                    "title": "Compute & Virtualization Engine",
                    "descEn": "Engineered microservices for VM provisioning, CloudStack hypervisor orchestration, and Bare-Metal server lifecycle management.",
                    "descId": "Mengembangkan microservices untuk provisioning Virtual Machine, orkestrasi CloudStack, dan pengelolaan siklus server Bare-Metal."
                },
                {
                    "title": "Storage & S3-Compatible Object Storage",
                    "descEn": "Built high-throughput S3-compatible Object Storage services, block storage management, and dynamic DNS bucket routing.",
                    "descId": "Membangun layanan Object Storage kompatibel S3 berkecepatan tinggi, manajemen block storage, dan routing DNS bucket dinamis."
                },
                {
                    "title": "Managed Kubernetes & Cloud Networking",
                    "descEn": "Built automated microservices for managed Kubernetes cluster provisioning and software-defined cloud networking (VPC, public IPs, firewalls).",
                    "descId": "Membangun microservices otomatis untuk provisioning cluster Kubernetes terkelola dan jaringan cloud (VPC, IP publik, firewall)."
                },
                {
                    "title": "Metering & Real-Time Billing Engine",
                    "descEn": "Engineered usage-based billing pipelines, multi-region resource quota management, telemetry tracking, and automated invoice generators.",
                    "descId": "Merancang pipeline billing berbasis pemakaian riil, manajemen kuota multi-region, pelacakan telemetri, dan pembuatan invoice otomatis."
                },
                {
                    "title": "Real-Time Streaming & Core Services",
                    "descEn": "Developed real-time user notification pipelines via Laravel Reverb (WebSockets), centralized product catalogs, and OS template image repositories.",
                    "descId": "Mengembangkan sistem notifikasi realtime via Laravel Reverb WebSockets, katalog produk terpusat, dan repositori template OS image."
                },
                {
                    "title": "Reliability, CI/CD & L3 Technical Support",
                    "descEn": "Enforced system reliability via comprehensive automated testing (PHPUnit Unit & Feature) with service mocking, Bitbucket CI/CD to Kubernetes, and handled L3 technical escalation support.",
                    "descId": "Menjaga keandalan sistem melalui automated testing PHPUnit menyeluruh dengan service mocking, deployment CI/CD ke Kubernetes, dan menangani eskalasi teknis L3 produksi."
                }
            ],
            "techStack": ["PHP", "Laravel", "PostgreSQL", "MySQL", "MongoDB", "Redis", "WebSockets (Reverb)", "Kubernetes", "Docker", "Bitbucket CI/CD", "CloudStack", "S3 API", "PHPUnit"]
        },
        {
            "company": "Energeek",
            "role": "Back End Developer",
            "period": "Mar 2019 – Des 2021",
            "duration": "2 years 10 months",
            "location": "Surabaya, Jawa Timur",
            "type": "Full-time",
            "highlightEn": "Developed, maintained, and delivered full-lifecycle web applications for government agencies, state-owned enterprises (BUMN), and corporate clients.",
            "highlightId": "Mengembangkan, memelihara, dan merilis aplikasi web enterprise untuk instansi pemerintah, BUMN, dan klien korporat.",
            "modules": [
                {
                    "title": "Government & Public Sector Portals",
                    "descEn": "Built equipment asset management and project proposal approval portals for Surabaya City Government, and vehicle registration numbering system for Department of Transportation (Dishub).",
                    "descId": "Membangun sistem manajemen aset peralatan dan proposal proyek untuk Pemerintah Kota Surabaya, serta sistem penomoran kendaraan Dishub."
                },
                {
                    "title": "Corporate & Enterprise Applications",
                    "descEn": "Engineered internal ERP modules for Petrokimia Gresik (Nisa), project information system for PT Wijaya Karya (WIKA SIP), and academic service portal for Universitas Pertamina (Call UP).",
                    "descId": "Mengembangkan modul ERP internal Petrokimia Gresik (Nisa), sistem informasi proyek PT Wijaya Karya (WIKA SIP), dan portal akademik Universitas Pertamina (Call UP)."
                },
                {
                    "title": "IoT & Real-Time Sensor Telemetry",
                    "descEn": "Built data ingestion and monitoring backend for the Suramadu Bridge telemetry project, processing and visualizing real-time structural sensor metrics.",
                    "descId": "Membangun backend ingestion data dan monitoring untuk proyek sensor telemetri Jembatan Suramadu, memproses dan memvisualisasikan metrik struktural real-time."
                },
                {
                    "title": "Database Performance & Server Deployments",
                    "descEn": "Managed Virtual Machine (VM) deployments, database query performance optimization on PostgreSQL, and delivered rapid hotfixes and customer maintenance.",
                    "descId": "Mengelola deployment server Virtual Machine (VM), optimasi performa query PostgreSQL, serta penanganan bugfix dan pemeliharaan klien."
                }
            ],
            "techStack": ["PHP", "Laravel", "PostgreSQL", "JavaScript", "HTML5", "Bootstrap", "REST APIs", "Virtual Machines", "Git", "IoT Telemetry"]
        }
    ],
    "education": [
        {
            "institution": "Universitas Pembangunan Nasional 'Veteran' Jawa Timur",
            "degreeEn": "Bachelor of Computer Science (S.Kom) - Informatics Engineering",
            "degreeId": "Sarjana Komputer (S.Kom) - Teknik Informatika",
            "period": "2014 – 2018",
            "location": "Surabaya, Indonesia",
            "descEn": "Focused on Software Engineering, Database Systems, Computer Networks, and Distributed Computing.",
            "descId": "Fokus pada Rekayasa Perangkat Lunak, Sistem Basis Data, Jaringan Komputer, dan Komputasi Terdistribusi."
        }
    ],
    "projects": [
        {
            "title": "Cloudraya V2 Cloud Infrastructure Platform",
            "tagline": "Enterprise IaaS & PaaS Cloud Engine",
            "role": "Core Backend Architect",
            "descEn": "High-scale multi-region cloud infrastructure management system orchestrating virtual machines, S3 storage, managed Kubernetes, and real-time billing meters.",
            "descId": "Platform manajemen infrastruktur cloud multi-region skala enterprise yang mengorkestrasi VM, S3 storage, Kubernetes terkelola, dan metering billing real-time.",
            "tech": ["Laravel", "Go", "PostgreSQL", "Redis", "Kubernetes", "CloudStack", "WebSockets"],
            "badge": "Production Cloud Platform",
            "link": "https://panel.cloudraya.com/"
        },
        {
            "title": "Suramadu Bridge IoT Telemetry System",
            "tagline": "High-Frequency Sensor Data Ingestion",
            "role": "Backend & Telemetry Engineer",
            "descEn": "Real-time IoT telemetry pipeline capturing, aggregating, and visualizing structural vibration, strain, and environmental sensor metrics from Suramadu Bridge.",
            "descId": "Pipeline telemetri IoT real-time untuk menangkap, mengagregasi, dan memvisualisasikan data sensor getaran, tegangan struktural, dan cuaca Jembatan Suramadu.",
            "tech": ["PHP", "Laravel", "PostgreSQL", "Time-Series Ingestion", "REST APIs"],
            "badge": "Enterprise IoT Solution"
        },
        {
            "title": "Omni Command Center & Storage Vault",
            "tagline": "Personal Cloud Server & Knowledge Hub",
            "role": "Full-Stack Creator",
            "descEn": "Hardened server dashboard and secure storage vault featuring real-time system telemetry via WebSockets, Obsidian Second Brain memory graph, and BMKG early warning integration.",
            "descId": "Dashboard server dan vault storage pribadi dengan telemetri WebSocket real-time, graf pengetahuan Second Brain Obsidian, dan integrasi peringatan dini BMKG.",
            "tech": ["FastAPI", "React 19", "SQLite WAL", "Tailwind CSS", "WebSockets"],
            "badge": "Private Server Hub",
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

