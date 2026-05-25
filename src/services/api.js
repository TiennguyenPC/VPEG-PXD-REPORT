// Replace this URL with your deployed Google Apps Script Web App URL
export const GAS_URL = 'https://script.google.com/macros/s/AKfycbz2YizKLfy0pjrjEtJM6N4CKDUnxzXmwsF0WsNHfmpeCT0U56QwCUpgIb30XvtRb3lw/exec';

const AUTH_TOKEN_KEY = 'epc_auth_token';

export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Mở link này 1 lần (đăng nhập ngductien14@gmail.com) để Web App được quyền Drive */
export function getDriveAuthUrl() {
  return `${GAS_URL}?action=test-drive`;
}

import { buildTaskPayload } from '../utils/taskFields';
import { normalizeToDMY } from '../utils/timelineDates';
import { refreshNotificationsBell } from '../utils/notifications';

function normalizeProject(project) {
  if (!project) return null;
  const codRaw = project.KẾ_HOẠCH_COD || project.COD_PLAN || project.cod || "-";
  const kickoffRaw = project.KICKOFF_DATE || project.NGÀY_KICKOFF || project.KICKOFF || "-";
  const forecastRaw = project.DỰ_BÁO_COD || project.forecastCod || "";
  return {
    id: String(project.PROJECT_ID || project.id || ""),
    name: project.TÊN_DỰ_ÁN || project.PROJECT_NAME || project.name || "-",
    client: project.KHÁCH_HÀNG || project.CLIENT || project.client || "-",
    pm: project.PM || project.pm || "-",
    sm: project.SM || project.sm || "-",
    capacity: Number(project.CÔNG_SUẤT_KWP || project.CAPACITY_KWP || project.capacity || 0),
    cod: codRaw === "-" ? "-" : (normalizeToDMY(codRaw) || codRaw),
    codDate: codRaw === "-" ? "" : (normalizeToDMY(codRaw) || codRaw),
    kickoffDate: kickoffRaw === "-" ? "-" : (normalizeToDMY(kickoffRaw) || kickoffRaw),
    forecastCod: forecastRaw ? (normalizeToDMY(forecastRaw) || forecastRaw) : "",
    planProgress: Number(project.TIẾN_ĐỘ_KẾ_HOẠCH || project.PLAN_PROGRESS || project.planProgress || 0),
    actualProgress: Number(project.TIẾN_ĐỘ_THỰC_TẾ || project.ACTUAL_PROGRESS || project.actualProgress || 0),
    delay: Number(project.DELAY || project.delay || 0),
    status: project.TRẠNG_THÁI || project.STATUS || project.status || "-",
    risk: project.RISK_LEVEL || project.risk || "-",
    updatedAt: project.CẬP_NHẬT_CUỐI || project.UPDATED_AT || project.updatedAt || "-",
    priority: project.priority || "-",
    priorityColor: project.priorityColor || "green",
    issue: project.VƯỚNG_MẮC_CHÍNH || project.issue || "Không có",
    issueType: project.issueType || "success",
    _rowIndex: project._rowIndex
  };
}

function mapProjectToSheet(project) {
  if (!project) return null;
  return {
    PROJECT_ID: project.id,
    TÊN_DỰ_ÁN: project.name,
    KHÁCH_HÀNG: project.client,
    PM: project.pm,
    SM: project.sm,
    CÔNG_SUẤT_KWP: project.capacity,
    KẾ_HOẠCH_COD: project.cod ? normalizeToDMY(project.cod) || project.cod : project.cod,
    DỰ_BÁO_COD: project.forecastCod ? normalizeToDMY(project.forecastCod) || project.forecastCod : "",
    TIẾN_ĐỘ_KẾ_HOẠCH: project.planProgress,
    TIẾN_ĐỘ_THỰC_TẾ: project.actualProgress,
    DELAY: project.delay,
    KICKOFF_DATE: project.kickoffDate ? normalizeToDMY(project.kickoffDate) || project.kickoffDate : project.kickoffDate,
    TRẠNG_THÁI: project.status,
    RISK_LEVEL: project.risk,
    VƯỚNG_MẮC_CHÍNH: project.issue || "Không có",
    CẬP_NHẬT_CUỐI: project.updatedAt || new Date().toLocaleString(),
    _rowIndex: project._rowIndex
  };
}

/**
 * Simple in-memory cache (5 minutes TTL) for read-only GET requests
 */
const _cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.data;
}

function setCached(key, data) {
  _cache.set(key, { ts: Date.now(), data });
}

export function invalidateCache() {
  _cache.clear();
}

function invalidateTasksCache() {
  tasksCache = null;
  localStorage.removeItem('epc_tasks_cache');
}

async function syncTasksFromResponse(result) {
  if (Array.isArray(result?.data)) {
    tasksCache = result.data;
    localStorage.setItem('epc_tasks_cache', JSON.stringify(tasksCache));
    return tasksCache;
  }
  const data = await fetchFromGAS('tasks');
  tasksCache = data || [];
  localStorage.setItem('epc_tasks_cache', JSON.stringify(tasksCache));
  return tasksCache;
}

/**
 * Generic fetch function for GET requests
 */
async function fetchFromGAS(action, params = {}, useCache = false) {
  const cacheKey = action + JSON.stringify(params);
  if (useCache) {
    const hit = getCached(cacheKey);
    if (hit) return hit;
  }

  const url = new URL(GAS_URL);
  url.searchParams.append('action', action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  const token = getAuthToken();
  if (token) url.searchParams.append('token', token);
  // Cache busting only when NOT using in-memory cache
  if (!useCache) url.searchParams.append('t', Date.now().toString());

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      method: 'GET',
    });
    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.message);
    }
    if (useCache) setCached(cacheKey, result.data);
    return result.data;
  } catch (error) {
    console.error(`Error fetching ${action}:`, error);
    throw error;
  }
}

/**
 * Generic fetch function for POST requests (Updates)
 * Using text/plain to avoid CORS preflight OPTIONS request
 */
async function postToGAS(action, payload) {
  const url = new URL(GAS_URL);
  url.searchParams.append('action', action);

  const token = getAuthToken();
  const body = token ? { ...payload, _token: token } : payload;

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error(
        response.ok
          ? 'API trả về dữ liệu không hợp lệ. Chạy npm run gas:sync để deploy lại backend.'
          : `API lỗi (${response.status}). Kiểm tra URL GAS và quyền truy cập Web App.`
      );
    }
    if (result.status === 'error') {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.error(`Error posting to ${action}:`, error);
    throw error;
  }
}

// In-memory cache for snappy navigation backed by localStorage
let projectsCache = null;
try {
  const localProjects = localStorage.getItem('epc_projects_cache');
  if (localProjects) projectsCache = JSON.parse(localProjects);
} catch (e) {
  console.error("Failed to load projects cache from localStorage", e);
}

let tasksCache = null;
try {
  const localTasks = localStorage.getItem('epc_tasks_cache');
  if (localTasks) tasksCache = JSON.parse(localTasks);
} catch (e) {
  console.error("Failed to load tasks cache from localStorage", e);
}

const OVERVIEW_REFRESH_EVENT = 'epc-overview-refreshed';

function readLocalJson(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function applyOverviewBundle(raw) {
  const normalized = (raw?.projects || []).map(normalizeProject);
  projectsCache = normalized;
  tasksCache = raw?.tasks || [];
  const risks = raw?.risks || [];
  localStorage.setItem('epc_projects_cache', JSON.stringify(normalized));
  localStorage.setItem('epc_tasks_cache', JSON.stringify(tasksCache));
  localStorage.setItem('epc_risks_cache', JSON.stringify(risks));
  return { projects: normalized, tasks: tasksCache, risks };
}

function dispatchOverviewRefresh(bundle) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OVERVIEW_REFRESH_EVENT, { detail: bundle }));
  }
}

function isOverviewCacheUsable(cached) {
  return (
    (cached?.projects?.length > 0) ||
    (cached?.tasks?.length > 0) ||
    (cached?.risks?.length > 0)
  );
}

function isOverviewCacheComplete(cached) {
  return (cached?.projects?.length > 0) && (cached?.tasks?.length > 0);
}

async function fetchOverviewFromNetwork() {
  return fetchFromGAS('overview', {}, true);
}

async function refreshOverviewInBackground() {
  try {
    const raw = await fetchOverviewFromNetwork();
    const bundle = applyOverviewBundle(raw);
    dispatchOverviewRefresh(bundle);
  } catch (e) {
    console.warn('Overview background refresh failed', e);
  }
}

export { OVERVIEW_REFRESH_EVENT };

export const clearCache = () => {
  projectsCache = null;
  tasksCache = null;
  localStorage.removeItem('epc_projects_cache');
  localStorage.removeItem('epc_tasks_cache');
  localStorage.removeItem('epc_risks_cache');
};

export const api = {
  // Auth
  login: async (username, password) => {
    const result = await postToGAS('login', { username, password });
    return result.data;
  },
  logout: async () => {
    return postToGAS('logout', {});
  },
  authMe: async () => {
    return fetchFromGAS('auth-me');
  },

  getUsers: async () => {
    return fetchFromGAS('users');
  },
  createUser: async (data) => {
    const result = await postToGAS('add-user', data);
    refreshNotificationsBell();
    return result.data;
  },
  updateUser: async (data) => {
    const result = await postToGAS('update-user', data);
    refreshNotificationsBell();
    return result.data;
  },
  deactivateUser: async (userId) => {
    const result = await postToGAS('deactivate-user', { userId, active: false });
    return result.data;
  },
  unlockUser: async (userId) => {
    const result = await postToGAS('update-user', { userId, unlock: true });
    return result.data;
  },
  lockUser: async (userId) => {
    const result = await postToGAS('update-user', { userId, lock: true });
    return result.data;
  },
  deleteUser: async (userId) => {
    const result = await postToGAS('delete-user', { userId });
    return result.data;
  },
  changePassword: async ({ currentPassword, newPassword }) => {
    const result = await postToGAS('change-password', { currentPassword, newPassword });
    return result;
  },
  getNotifications: async (limit = 50) => {
    return fetchFromGAS('notifications', { limit: String(limit) });
  },
  markNotificationRead: async (notifId) => {
    const result = await postToGAS('mark-notification-read', { notifId });
    return result.data;
  },
  markAllNotificationsRead: async () => {
    const result = await postToGAS('mark-all-notifications-read', {});
    return result.data;
  },
  setupNotificationTrigger: async () => {
    return fetchFromGAS('setup-notifications-trigger');
  },
  runDailyNotificationChecks: async () => {
    return fetchFromGAS('run-daily-notifications');
  },
  getNotificationEmailConfig: async () => {
    return fetchFromGAS('notification-email-config');
  },
  updateNotificationEmailConfig: async ({ appUrl, enabled }) => {
    const result = await postToGAS('update-notification-email-config', { appUrl, enabled });
    return result.data;
  },
  sendTestNotificationEmail: async () => {
    const result = await postToGAS('send-test-notification-email', {});
    return result;
  },
  authorizeMailApp: async () => {
    return fetchFromGAS('authorize-mail-app');
  },
  getPublicShare: async (token) => {
    return fetchFromGAS('share-public', { token }, true);
  },
  getProjectShareStatus: async (projectId) => {
    return fetchFromGAS('project-share-status', { projectId });
  },
  enableProjectShare: async (projectId) => {
    const result = await postToGAS('enable-project-share', { projectId });
    return result.data;
  },
  disableProjectShare: async (projectId) => {
    const result = await postToGAS('disable-project-share', { projectId });
    return result.data;
  },
  getAuditLogs: async ({ limit = 150, offset = 0, userId, actionFilter } = {}) => {
    const params = { limit: String(limit), offset: String(offset) };
    if (userId) params.userId = userId;
    if (actionFilter) params.actionFilter = actionFilter;
    return fetchFromGAS('audit-logs', params);
  },

  // GET
  getProjects: async (forceRefresh = false) => {
    // Return cache immediately if available and not forcing refresh
    if (!forceRefresh && projectsCache && projectsCache.length > 0) {
      // Trigger background fetch to keep data fresh (Stale-While-Revalidate)
      setTimeout(async () => {
        try {
          const data = await fetchFromGAS('projects');
          const normalized = (data || []).map(normalizeProject);
          projectsCache = normalized;
          localStorage.setItem('epc_projects_cache', JSON.stringify(normalized));
        } catch (e) { /* ignore background fetch error */ }
      }, 0);
      return projectsCache;
    }

    // If no cache or force refresh, wait for network
    const data = await fetchFromGAS('projects');
    projectsCache = (data || []).map(normalizeProject);
    localStorage.setItem('epc_projects_cache', JSON.stringify(projectsCache));
    return projectsCache;
  },
  getEmployees: async (forceRefresh = false) => {
    const cacheKey = 'epc_employees_cache_v2';
    if (!forceRefresh) {
      const localEmps = localStorage.getItem(cacheKey) || localStorage.getItem('epc_employees_cache');
      if (localEmps) {
        setTimeout(async () => {
          try {
            const data = await fetchFromGAS('employees');
            localStorage.setItem(cacheKey, JSON.stringify(data || []));
          } catch (e) { /* ignore */ }
        }, 0);
        return JSON.parse(localEmps);
      }
    }
    const data = await fetchFromGAS('employees');
    localStorage.setItem(cacheKey, JSON.stringify(data || []));
    return data || [];
  },
  getProject: async (id) => {
    const data = await fetchFromGAS('project', { id });
    return normalizeProject(data);
  },
  getAIContext: async () => {
    const data = await fetchFromGAS('ai-context', {}, true);
    return data || {};
  },
  getDashboardBundle: async (id) => {
    const data = await fetchFromGAS('dashboard-bundle', { id });
    if (data && data.project) {
      data.project = normalizeProject(data.project);
    }
    return data;
  },
  getRisks: (id) => fetchFromGAS('risk', { id }),
  getAllRisks: async () => {
    const localRisks = localStorage.getItem('epc_risks_cache');
    if (localRisks) {
      setTimeout(async () => {
        try {
          const data = await fetchFromGAS('risks', {}, true);
          localStorage.setItem('epc_risks_cache', JSON.stringify(data || []));
        } catch (e) { }
      }, 0);
      return JSON.parse(localRisks);
    }
    const data = await fetchFromGAS('risks', {}, true);
    localStorage.setItem('epc_risks_cache', JSON.stringify(data || []));
    return data || [];
  },
  /** Một request GAS thay vì 3 — cache hiện ngay, refresh nền khi đủ dữ liệu */
  getOverviewData: async (forceRefresh = false) => {
    const cached = {
      projects: projectsCache ?? readLocalJson('epc_projects_cache'),
      tasks: tasksCache ?? readLocalJson('epc_tasks_cache'),
      risks: readLocalJson('epc_risks_cache'),
    };

    if (projectsCache == null && cached.projects.length) projectsCache = cached.projects;
    if (tasksCache == null && cached.tasks.length) tasksCache = cached.tasks;

    if (forceRefresh || !isOverviewCacheUsable(cached)) {
      const raw = await fetchOverviewFromNetwork();
      return applyOverviewBundle(raw);
    }

    // Cache thiếu tasks/projects — fetch ngay thay vì chờ refresh nền
    if (!isOverviewCacheComplete(cached)) {
      try {
        const raw = await fetchOverviewFromNetwork();
        return applyOverviewBundle(raw);
      } catch (e) {
        console.warn('Overview fetch failed, using partial cache', e);
        setTimeout(refreshOverviewInBackground, 0);
        return cached;
      }
    }

    setTimeout(refreshOverviewInBackground, 0);
    return cached;
  },
  getPermits: (id) => fetchFromGAS('permit', { id }),
  getDesigns: (id) => fetchFromGAS('design', { id }),
  getProcurements: (id) => fetchFromGAS('procurement', { id }),
  getConstructions: (id) => fetchFromGAS('construction', { id }),
  getHandovers: (id) => fetchFromGAS('handover', { id }),
  getSiteLogs: (id) => fetchFromGAS('site-log', { id }),
  getWeeklyLogs: (id) => fetchFromGAS('weeklyLog', { id }),
  getMonthlyLogs: (id) => fetchFromGAS('monthlyLog', { id }),
  getMilestones: (id) => fetchFromGAS('milestone', { id }),
  getSCurves: (id) => fetchFromGAS('scurve', { id }),
  getTasks: async (forceRefresh = false) => {
    if (!forceRefresh && tasksCache && tasksCache.length > 0) {
      setTimeout(async () => {
        try {
          const data = await fetchFromGAS('tasks');
          tasksCache = data || [];
          localStorage.setItem('epc_tasks_cache', JSON.stringify(tasksCache));
        } catch (e) { }
      }, 0);
      return tasksCache;
    }
    const data = await fetchFromGAS('tasks');
    tasksCache = data || [];
    localStorage.setItem('epc_tasks_cache', JSON.stringify(tasksCache));
    return tasksCache;
  },

  // POST (Updates)
  updateRisk: (data) => postToGAS('update-risk', data),
  updatePermit: (data) => postToGAS('update-permit', data),
  updateDesign: (data) => postToGAS('update-design', data),
  updateProcurement: (data) => postToGAS('update-procurement', data),
  updateConstruction: (data) => postToGAS('update-construction', data),
  updateHandover: (data) => postToGAS('update-handover', data),
  updateSiteLog: (data) => postToGAS('update-site-log', data),
  saveSitePhotos: (data) => postToGAS('save-site-photos', data),
  uploadSiteImage: async (data) => {
    let base64 = String(data.base64 || '');
    if (base64.includes('base64,')) {
      base64 = base64.split('base64,')[1];
    }
    if (!base64) {
      throw new Error('Ảnh rỗng');
    }

    // Ảnh nhỏ — 1 request POST thay vì chunk (nhanh hơn nhiều)
    const SMALL_BASE64_LIMIT = 280_000;
    if (base64.length <= SMALL_BASE64_LIMIT) {
      const result = await postToGAS('upload-site-image', {
        base64: `data:image/jpeg;base64,${base64}`,
        projectId: data.projectId,
      });
      const url = result?.data?.url;
      if (!url) {
        throw new Error('Không nhận được link ảnh từ Google Drive');
      }
      return url;
    }

    const sessionId = `${String(data.projectId || 'p').replace(/\W/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    // GAS CacheService giới hạn 100KB/value — chunk phải nhỏ hơn
    const CHUNK_SIZE = 90_000;
    const chunks = [];
    for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
      chunks.push(base64.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
      await postToGAS('upload-image-chunk', {
        sessionId,
        index: i,
        total: chunks.length,
        chunk: chunks[i],
        projectId: data.projectId,
      });
    }

    const commitUrl = new URL(GAS_URL);
    commitUrl.searchParams.append('action', 'upload-image-commit');
    commitUrl.searchParams.append('sessionId', sessionId);
    commitUrl.searchParams.append('t', Date.now().toString());

    const response = await fetch(commitUrl.toString(), { redirect: 'follow' });
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      throw new Error('API trả về dữ liệu không hợp lệ. Chạy npm run gas:sync để deploy lại backend.');
    }
    if (result.status === 'error') {
      const msg = String(result.message || '').replace(/^Exception:\s*/i, '');
      throw new Error(msg || 'Upload Drive thất bại');
    }
    const url = result?.data?.url;
    if (!url) {
      throw new Error('Không nhận được link ảnh từ Google Drive');
    }
    return url;
  },
  updateModuleDates: (data) => postToGAS('update-module-dates', data),
  updateProject: async (data) => {
    projectsCache = null;
    return postToGAS('update-project', mapProjectToSheet(data));
  },
  createProject: async (data) => {
    projectsCache = null;
    return postToGAS('add-project', mapProjectToSheet(data));
  },
  deleteProject: async (id) => {
    projectsCache = null;
    return postToGAS('delete-project', { PROJECT_ID: id });
  },
  addRisk: (data) => postToGAS('add-risk', data),
  addPermit: (data) => postToGAS('add-permit', data),
  addDesign: (data) => postToGAS('add-design', data),
  addProcurement: (data) => postToGAS('add-procurement', data),
  updateTask: async (task, originalTask = null) => {
    invalidateTasksCache();
    const result = await postToGAS('update-task', buildTaskPayload(task, originalTask || task));
    refreshNotificationsBell();
    return syncTasksFromResponse(result);
  },
  createTask: async (task) => {
    const result = await postToGAS('add-task', buildTaskPayload(task));
    refreshNotificationsBell();
    return syncTasksFromResponse(result);
  },
  deleteTask: async (task) => {
    invalidateTasksCache();
    const result = await postToGAS('delete-task', buildTaskPayload(task));
    return syncTasksFromResponse(result);
  }
};
