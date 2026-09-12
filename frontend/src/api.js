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
    throw new Error("Sesi kamu telah berakhir. Silakan login kembali.");
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
  /** Fetch all Hermes conversation sessions with model attribution */
  getSessions: (params = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.model) q.set("model", params.model);
    if (params.source) q.set("source", params.source);
    if (params.limit) q.set("limit", params.limit);
    const queryStr = q.toString() ? `?${q.toString()}` : "";
    return request(`/sessions${queryStr}`);
  },
  /** Fetch detailed message turns for a specific session */
  getSessionDetail: (sessionId) => request(`/sessions/${sessionId}`),
  /** Fetch multi-LLM comparative analytics and quota metrics */
  getModelAnalytics: () => request("/sessions/analytics/models"),
  /** Purge chat sessions older than N days (default 7) */
  pruneSessions: (days = 7) => request(`/sessions/prune?days=${days}`, { method: "POST" }),
  /** Hard reset all conversation sessions and LLM logs */
  resetSessions: () => request("/sessions/reset", { method: "POST" }),

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
  /** Create a new job application entry */
  createJob: (job) =>
    request("/jobs", {
      method: "POST",
      body: JSON.stringify(job),
    }),
  /** Update application status */
  updateJobStatus: (jobId, updateData) =>
    request(`/jobs/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    }),
  /** Delete job application entry */
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: "DELETE" }),

  // --- Knowledge & Integrations ---
  /** Search or retrieve Obsidian Second Brain notes */
  getSecondBrain: (query = "") => request(`/second-brain${query ? `?query=${encodeURIComponent(query)}` : ""}`),
  /** Get full content, wikilinks, and backlinks of a specific note */
  getNoteDetail: (folder, filename) =>
    request(`/second-brain/note?folder=${encodeURIComponent(folder)}&filename=${encodeURIComponent(filename)}`),
  /** Get orphan notes with 0 incoming wikilinks */
  getOrphanNotes: () => request("/second-brain/orphans"),
  /** Get interactive knowledge graph node-link dataset */
  getNetworkGraph: () => request("/second-brain/network-graph"),
  /** Get Surabaya weather, AQI, and BMKG earthquake early warning alerts */
  getWeather: () => request("/weather"),
  /** Get Amazfit / Zepp smartwatch activity and biometric metrics */
  getZepp: () => request("/zepp"),
  /** Get cron automation schedules and next execution times */
  getSchedules: () => request("/schedules"),

  // --- Storage Vault & File Manager ---
  /** List files, directories, breadcrumbs, and disk usage for a vault subpath */
  getStorageFiles: (path = "") => request(`/storage/files${path ? `?path=${encodeURIComponent(path)}` : ""}`),
  /** Create a new folder inside the storage vault */
  createStorageFolder: (path, folder_name) =>
    request("/storage/mkdir", {
      method: "POST",
      body: JSON.stringify({ path, folder_name }),
    }),
  /** Rename an existing file or directory inside the vault */
  renameStorageItem: (path, old_name, new_name) =>
    request("/storage/rename", {
      method: "POST",
      body: JSON.stringify({ path, old_name, new_name }),
    }),
  /** Delete a file or directory recursively from the storage vault */
  deleteStorageItem: (path) =>
    request("/storage/delete", {
      method: "DELETE",
      body: JSON.stringify({ path }),
    }),
  /**
   * Upload multiple files or photos with real-time percentage progress callback.
   * @param {string} path - Target directory relative to vault root
   * @param {FileList|File[]} files - Files to upload
   * @param {(percent: number) => void} [onProgress] - Upload progress percentage callback
   * @returns {Promise<{ status: string, message: string, uploaded_files: string[] }>}
   */
  uploadStorageFiles: async (path, files, onProgress = null) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append("path", path || "");
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
};
