const API_BASE = '/api';

export function getAuthToken() {
  return localStorage.getItem('arusuka_token') || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('arusuka_token', token);
  } else {
    localStorage.removeItem('arusuka_token');
  }
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/status') {
    setAuthToken('');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Sesi kamu telah berakhir. Silakan login kembali.');
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

export const api = {
  // Auth
  getAuthStatus: () => request('/auth/status'),
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  changePassword: (old_password, new_password) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ old_password, new_password }),
  }),

  // Core Data Endpoints
  getOverview: () => request('/overview'),
  getTasks: (category = 'all') => request(`/tasks?category=${encodeURIComponent(category)}`),
  createTask: (task) => request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  updateTask: (taskId, updateData) => request(`/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  }),
  deleteTask: (taskId) => request(`/tasks/${taskId}`, { method: 'DELETE' }),

  getJobs: () => request('/jobs'),
  createJob: (job) => request('/jobs', {
    method: 'POST',
    body: JSON.stringify(job),
  }),
  updateJobStatus: (jobId, updateData) => request(`/jobs/${jobId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  }),
  deleteJob: (jobId) => request(`/jobs/${jobId}`, { method: 'DELETE' }),

  getSecondBrain: (query = '') => request(`/second-brain${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  getWeather: () => request('/weather'),
  getZepp: () => request('/zepp'),
  getSchedules: () => request('/schedules'),

  // Storage Vault & Photo Backup
  getStorageFiles: (path = '') => request(`/storage/files${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  createStorageFolder: (path, folder_name) => request('/storage/mkdir', {
    method: 'POST',
    body: JSON.stringify({ path, folder_name }),
  }),
  renameStorageItem: (path, old_name, new_name) => request('/storage/rename', {
    method: 'POST',
    body: JSON.stringify({ path, old_name, new_name }),
  }),
  deleteStorageItem: (path) => request('/storage/delete', {
    method: 'DELETE',
    body: JSON.stringify({ path }),
  }),
  uploadStorageFiles: async (path, files, onProgress = null) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('path', path || '');
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/storage/upload`);
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
            resolve({ status: 'success' });
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

      xhr.onerror = () => reject(new Error('Koneksi jaringan terputus saat upload.'));
      xhr.send(formData);
    });
  },
};
