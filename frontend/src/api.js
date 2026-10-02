/**
 * @file api.js
 * @description Centralized HTTP Client and API abstraction layer for the Arusuka Command Center.
 * Handles Bearer token authentication, automatic 401 token invalidation, JSON parsing,
 * and unified error dispatching.
 */

const API_BASE = "/api";

/**
 * Retrieve current authentication session token from localStorage.
 * @returns {string} Session token or empty string
 */
export function getAuthToken() {
  return localStorage.getItem("arusuka_token") || "";
}

/**
 * Persist or clear authentication token in localStorage.
 * @param {string|null} token - Bearer token or null to remove
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("arusuka_token", token);
  } else {
    localStorage.removeItem("arusuka_token");
  }
}

/**
 * Core HTTP fetch wrapper with authorization headers and centralized error handling.
 * @param {string} endpoint - API endpoint path (e.g. "/tasks")
 * @param {RequestInit} [options={}] - Standard fetch configuration options
 * @returns {Promise<any>} Parsed JSON response payload
 * @throws {Error} Normalized error with status code and server detail
 */
export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    ...(options.headers || {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== "/auth/login" && endpoint !== "/auth/status") {
    setAuthToken("");
    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    throw new Error("You've been away for a while. Enter your passkey to jump back in.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || `Request gagal (${response.status})`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Unified API Client for all dashboard sub-modules.
 */
export const api = {
  // --- Authentication ---
  /** Check current session authentication status */
  getAuthStatus: () => request("/auth/status"),
  /** Authenticate user with master credentials */
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  /** Invalidate active session cookie and token */
  logout: () => request("/auth/logout", { method: "POST" }),
  /** Update master dashboard password */
  changePassword: (old_password, new_password) =>
    request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password }),
    }),

  // --- Core Overview & Telemetry ---
  /** Fetch aggregated overview stats and telemetry snapshot */
  getOverview: () => request("/overview"),
  /** Send quick instruction or thought note to Arusuka / Inbox */
  sendArusukaInstruction: (instruction) =>
    request("/overview/instruction", {
      method: "POST",
      body: JSON.stringify({ instruction }),
    }),

  // --- Personal Tasks Kanban ---
  /** Get personal tasks grouped by status column */
  getTasks: (category = "all") => request(`/tasks?category=${encodeURIComponent(category)}`),
  /** Create a new personal task card */
  createTask: (task) =>
    request("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),
  /** Patch task properties (status, priority, due date) */
  updateTask: (taskId, updateData) =>
    request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    }),
  /** Delete task from database */
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: "DELETE" }),

  // --- Portfolio & Public Profile ---
  /** Fetch public portfolio profile and projects */
  getPortfolio: () => request("/portfolio"),
  /** Update portfolio profile and projects metadata */
  savePortfolio: (data) =>
    request("/portfolio", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // --- Hermes Sessions & Multi-LLM History ---
  /** Fetch all Hermes & Antigravity conversation sessions with model & account attribution */
  getSessions: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.model) q.set("model", params.model);
    if (params.account) q.set("account", params.account);
    if (params.source) q.set("source", params.source);
    if (params.limit) q.set("limit", params.limit);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return request(`/sessions${queryStr}`);
  },
  /** Fetch detailed message turns for a specific session with pagination & sorting */
  getSessionDetail: (sessionId, params = {}) => {
    const q = new URLSearchParams();
    if (params.limit !== undefined) q.set("limit", params.limit);
    if (params.offset !== undefined) q.set("offset", params.offset);
    if (params.order) q.set("order", params.order);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return request(`/sessions/${sessionId}${queryStr}`);
  },
  /** Assign or switch Antigravity session to Akun 1, 2, or 3 */
  assignSessionAccount: (sessionId, accountId) =>
    request(`/sessions/${sessionId}/account`, {
      method: "PATCH",
      body: JSON.stringify({ account_id: accountId }),
    }),
  /** Fetch multi-LLM comparative analytics and quota metrics */
  getModelAnalytics: () => request("/sessions/analytics"),
  /** Purge chat sessions older than N days (default 7) */
  pruneSessions: (days = 7) => request(`/sessions/prune?days=${days}`, { method: "POST" }),
  /** Hard reset all conversation sessions and LLM logs */
  clearSessions: () => request("/sessions/clear", { method: "POST" }),
  /** Delete a single conversation session by ID */
  deleteSession: (sessionId) => request(`/sessions/${sessionId}`, { method: "DELETE" }),

  // --- Career & Job Hunter Tracker ---
  /** Get career applications pipeline */
  getJobs: () => request("/jobs"),
  /** Search live remote or local job openings */
  searchLiveJobs: (query = "backend", job_type = "remote", location = "Jawa / Indonesia", limit = 12, page = 1) =>
    request(`/jobs/live-search?query=${encodeURIComponent(query)}&job_type=${encodeURIComponent(job_type)}&location=${encodeURIComponent(location)}&limit=${limit}&page=${page}`),
  /** Deep analyze CV match for a job description */
  analyzeJobMatch: (data) =>
    request("/jobs/analyze-match", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** Scrape and analyze live job URL */
  analyzeJobUrl: (url) =>
    request("/jobs/analyze-url", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
  /** Generate high-converting cover letter */
  generateCoverLetter: (data) =>
    request("/jobs/generate-cover-letter", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** Create a new job application entry */
  createJob: (job) =>
    request("/jobs", {
      method: "POST",
      body: JSON.stringify(job),
    }),
  /** Full update of job application details */
  updateJob: (jobId, data) =>
    request(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  /** Update application status */
  updateJobStatus: (jobId, updateData) =>
    request(`/jobs/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    }),
  /** Delete job application entry */
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: "DELETE" }),
  /** Get background-curated jobs by Sentinel */
  getCuratedJobs: (status = "all", search = "") =>
    request(`/jobs/curated?status=${status}&search=${encodeURIComponent(search)}`),
  /** Save curated job into pipeline */
  saveCuratedJob: (jobId) =>
    request(`/jobs/curated/${jobId}/save`, { method: "POST" }),
  /** Dismiss curated job */
  dismissCuratedJob: (jobId) =>
    request(`/jobs/curated/${jobId}/dismiss`, { method: "POST" }),
  /** Trigger manual background scan */
  scanCuratedJobs: () =>
    request("/jobs/curated/scan", { method: "POST" }),

  // --- Knowledge & Obsidian Second Brain Vault ---
  /** Search or retrieve Obsidian Second Brain notes with folder/tag filter */
  getSecondBrain: (params = {}) => {
    if (typeof params === "string") {
      return request(`/second-brain${params ? `?query=${encodeURIComponent(params)}` : ""}`);
    }
    const q = new URLSearchParams();
    if (params.query) q.set("query", params.query);
    if (params.folder) q.set("folder", params.folder);
    if (params.tag) q.set("tag", params.tag);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request(`/second-brain${qs}`);
  },
  /** Get full content, frontmatter, wikilinks, and backlinks of a specific note */
  getNoteDetail: (pathOrFolder, filename = "") => {
    if (filename) {
      return request(`/second-brain/note?folder=${encodeURIComponent(pathOrFolder)}&filename=${encodeURIComponent(filename)}`);
    }
    return request(`/second-brain/note?path=${encodeURIComponent(pathOrFolder)}`);
  },
  /** Create or update a markdown note in Second Brain */
  saveNote: (data) =>
    request("/second-brain/note", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  /** Get real-time Vault Health Doctor & Link Integrity analysis */
  getVaultDoctor: () => request("/second-brain/doctor"),
  /** Get today's daily journal log */
  getTodayJournal: () => request("/second-brain/today"),
  /** Quick append reflection or note to today's daily journal */
  appendTodayJournal: (entry, section = "Quick Notes") =>
    request("/second-brain/today/append", {
      method: "POST",
      body: JSON.stringify({ entry, section }),
    }),
  /** Get latest weekly retrospective rollup */
  getWeeklyRollup: () => request("/second-brain/weekly"),
  /** Trigger SQLite FTS5 re-index and link synchronization */
  syncVault: () => request("/second-brain/sync", { method: "POST" }),
  /** Get interactive knowledge graph node-link dataset */
  getNetworkGraph: () => request("/second-brain/network-graph"),
  /** Get orphan notes with 0 incoming wikilinks */
  getOrphanNotes: () => request("/second-brain/doctor"),
  /** Get Surabaya weather, AQI, and BMKG earthquake early warning alerts */
  getWeather: () => request("/weather"),
  getSurabayaWeather: () => request("/weather"),
  /** Get Amazfit / Zepp smartwatch activity and biometric metrics */
  getZepp: () => request("/zepp"),
  /** Get cron automation schedules and next execution times */
  getSchedules: () => request("/schedules"),

  // --- Storage Vault & File Manager ---
  /** List files, directories, breadcrumbs, and disk usage for a vault subpath */
  getStorageFiles: (path = "", refresh = false, vault = "local") => {
    const params = [];
    if (path) params.push(`path=${encodeURIComponent(path)}`);
    if (refresh) params.push(`refresh=true`);
    if (vault) params.push(`vault=${encodeURIComponent(vault)}`);
    const qs = params.length > 0 ? `?${params.join("&")}` : "";
    return request(`/storage/files${qs}`);
  },
  /** Create a new folder inside the storage vault */
  createStorageFolder: (path, folder_name, vault = "local") =>
    request("/storage/mkdir", {
      method: "POST",
      body: JSON.stringify({ path, folder_name, vault }),
    }),
  /** Rename an existing file or directory inside the vault */
  renameStorageItem: (path, old_name, new_name, vault = "local") =>
    request("/storage/rename", {
      method: "POST",
      body: JSON.stringify({ path, old_name, new_name, vault }),
    }),
  /** Delete a file or directory recursively from the storage vault */
  deleteStorageItem: (path, vault = "local") =>
    request("/storage/delete", {
      method: "DELETE",
      body: JSON.stringify({ path, vault }),
    }),
  /**
   * Upload multiple files or photos with real-time percentage progress callback.
   * @param {string} path - Target directory relative to vault root
   * @param {FileList|File[]} files - Files to upload
   * @param {(percent: number) => void} [onProgress] - Upload progress percentage callback
   * @param {string} [vault="local"] - "local" or "cloud"
   * @returns {Promise<{ status: string, message: string, uploaded_files: string[] }>}
   */
  uploadStorageFiles: async (path, files, onProgress = null, vault = "local") => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("path", path || "");
    formData.append("vault", vault || "local");
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/storage/upload`);
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v);
      }

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ status: "success" });
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.detail || `Upload gagal (${xhr.status})`));
          } catch {
            reject(new Error(`Upload gagal (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Koneksi jaringan terputus saat upload."));
      xhr.send(formData);
    });
  },

  // Portfolio & Profile CMS
  getProfile: () => request("/profile"),
  updateProfile: (data) => request("/profile", { method: "PUT", body: JSON.stringify(data) }),
  resetProfile: () => request("/profile/reset", { method: "POST" }),

  // WhatsApp Secretary
  getWhatsAppStatus: () => request("/whatsapp/status"),
  getWhatsAppOverview: () => request("/whatsapp/overview"),
  getWhatsAppInbox: (limit = 50) => request(`/whatsapp/inbox?limit=${limit}`),
  getWhatsAppQrUrl: () => `${API_BASE}/whatsapp/qr?t=${Date.now()}`,
  getWhatsAppQrBlob: async () => {
    const token = getAuthToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/whatsapp/qr?t=${Date.now()}`, {
      headers,
      cache: "no-store",
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || "QR code unavailable or device is already connected.");
    }
    return await res.blob();
  },

  // Diet & Nutrition (OMAD)
  getDietSummary: (date) => request(`/diet/summary${date ? `?target_date=${date}` : ""}`),
  getMeals: (date) => request(`/diet/meals${date ? `?target_date=${date}` : ""}`),
  addMeal: (data) => request("/diet/meals", { method: "POST", body: JSON.stringify(data) }),
  deleteMeal: (id) => request(`/diet/meals/${id}`, { method: "DELETE" }),
  getWeightHistory: (days = 30) => request(`/diet/weight/history?days=${days}`),
  getFastingStatus: () => request("/diet/fasting"),
  startFasting: (data) => request("/diet/fasting/start", { method: "POST", body: JSON.stringify(data) }),
  endFasting: (notes = "") => request(`/diet/fasting/end?notes=${encodeURIComponent(notes)}`, { method: "POST" }),

  // Zepp & Amazfit Biometrics
  getZeppFitness: () => request("/zepp"),

  // Weather, AQI & BMKG Geophysics
  getWeatherDetail: () => request("/weather"),

  // Web Terminal
  getTerminalUsers: () => request("/terminal/users"),

  // Kuro Team — Autonomous Multi-Agent Swarm
  getKuroTeam: () => request("/kuro-team"),
  getKuroTasks: (member_id = null, limit = 50) => request(`/kuro-team/tasks?limit=${limit}${member_id ? `&member_id=${member_id}` : ""}`),
  autoDetectKuroPrompt: (prompt) => request("/kuro-team/auto-detect", { method: "POST", body: JSON.stringify({ prompt }) }),
  switchKuroLead: (lead_id) => request("/kuro-team/switch-lead", { method: "POST", body: JSON.stringify({ lead_id }) }),

  // Shiro Team — Lightweight & Repetitive Task Swarm
  getShiroTeam: () => request("/shiro-team"),
  getShiroTasks: (member_id = null, limit = 50) => request(`/shiro-team/tasks?limit=${limit}${member_id ? `&member_id=${member_id}` : ""}`),
  autoDetectShiroPrompt: (prompt) => request("/shiro-team/auto-detect", { method: "POST", body: JSON.stringify({ prompt }) }),
  switchShiroLead: (lead_id) => request("/shiro-team/switch-lead", { method: "POST", body: JSON.stringify({ lead_id }) }),
  getShiroRoutines: () => request("/shiro-team/routines"),


  // SQLite Database Web GUI Explorer
  getDatabaseList: () => request("/database/list"),
  getDatabaseTables: (db_id) => request(`/database/tables?db_id=${encodeURIComponent(db_id)}`),
  getTableSchema: (db_id, table) => request(`/database/schema?db_id=${encodeURIComponent(db_id)}&table=${encodeURIComponent(table)}`),
  getTableData: (db_id, table, { page = 1, limit = 50, search = "", sort_col = "", sort_dir = "asc" } = {}) => {
    const params = new URLSearchParams({
      db_id,
      table,
      page: String(page),
      limit: String(limit),
      sort_dir,
    });
    if (search) params.append("search", search);
    if (sort_col) params.append("sort_col", sort_col);
    return request(`/database/data?${params.toString()}`);
  },
  executeDatabaseQuery: (db_id, sql) => request("/database/query", {
    method: "POST",
    body: JSON.stringify({ db_id, sql }),
  }),
  getDatabaseExportUrl: (db_id, table, format = "csv") => {
    const token = getAuthToken();
    return `${API_BASE}/database/export?db_id=${encodeURIComponent(db_id)}&table=${encodeURIComponent(table)}&format=${encodeURIComponent(format)}${token ? `&token=${encodeURIComponent(token)}` : ""}`;
  },
  // POS Terminal & Outlets
  getPosOutlets: () => request("/pos/outlets"),
  posAuthPin: (data) => request("/pos/auth/pin", { method: "POST", body: JSON.stringify(data) }),
  posAuthManager: (data) => request("/pos/auth/manager", { method: "POST", body: JSON.stringify(data) }),

  // Finance & Debt Freedom Engine
  getFinanceSummary: (extra_monthly = 0) => request(`/finance/summary?extra_monthly=${extra_monthly}`),
  recordFinancePayment: (data) => request("/finance/payment", { method: "POST", body: JSON.stringify(data) }),
  recordFinanceTransaction: (data) => request("/finance/transaction", { method: "POST", body: JSON.stringify(data) }),

  // Security & SysGuard Radar
  getSecurityStatus: () => request("/security/status"),
  unbanSecurityIp: (ip, jail = "all") => request("/security/unban", { method: "POST", body: JSON.stringify({ ip, jail }) }),

  // Agent War Room & Swarm Visualizer
  getWarRoomStatus: () => request("/warroom/status"),
  broadcastWarRoomTask: (data) => request("/warroom/broadcast", { method: "POST", body: JSON.stringify(data) }),

  // Arusuka Sentinel Pulse & Advisory Center
  getSentinelPulse: () => request("/sentinel/pulse"),
  getSentinelProposals: (status = "all", domain = "all") => request(`/sentinel/proposals?status=${status}&domain=${domain}`),
  performSentinelAction: (proposal_id, action, notes = "") =>
    request(`/sentinel/proposals/${proposal_id}/action`, {
      method: "POST",
      body: JSON.stringify({ action, notes }),
    }),
  submitSentinelRequest: (data) =>
    request("/sentinel/request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getSentinelTelemetry: () => request("/sentinel/telemetry"),

  // Engineering Tech Radar
  getTechRadarArticles: ({ category = '', search = '', curated_only = false, page = 1, limit = 18 } = {}) => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    if (curated_only) params.set('curated_only', 'true');
    params.set('page', page);
    params.set('limit', limit);
    return request(`/tech-radar?${params.toString()}`);
  },
  syncTechRadarFeed: () => request('/tech-radar/sync', { method: 'POST' }),
  bookmarkTechRadarArticle: (articleId) => request(`/tech-radar/${articleId}/bookmark`, { method: 'POST' }),
};

