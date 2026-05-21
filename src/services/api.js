// Replace this URL with your deployed Google Apps Script Web App URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxojmRJFocx0sMvf3VmjaLhdIl6T9ATJdizWa_V43gIT0jWxIQn0pdRrIvYTTgcjETo/exec';

function normalizeProject(project) {
  if (!project) return null;
  return {
    id: String(project.PROJECT_ID || project.id || ""),
    name: project.TÊN_DỰ_ÁN || project.PROJECT_NAME || project.name || "-",
    client: project.KHÁCH_HÀNG || project.CLIENT || project.client || "-",
    pm: project.PM || project.pm || "-",
    sm: project.SM || project.sm || "-",
    capacity: Number(project.CÔNG_SUẤT_KWP || project.CAPACITY_KWP || project.capacity || 0),
    cod: project.KẾ_HOẠCH_COD || project.COD_PLAN || project.cod || "-",
    forecastCod: project.DỰ_BÁO_COD || project.forecastCod || "",
    planProgress: Number(project.TIẾN_ĐỘ_KẾ_HOẠCH || project.PLAN_PROGRESS || project.planProgress || 0),
    actualProgress: Number(project.TIẾN_ĐỘ_THỰC_TẾ || project.ACTUAL_PROGRESS || project.actualProgress || 0),
    delay: Number(project.DELAY || project.delay || 0),
    status: project.TRẠNG_THÁI || project.STATUS || project.status || "-",
    risk: project.RISK_LEVEL || project.risk || "-",
    updatedAt: project.CẬP_NHẬT_CUỐI || project.UPDATED_AT || project.updatedAt || "-",
    priority: project.priority || "-",
    priorityColor: project.priorityColor || "green",
    issue: project.issue || "Không có",
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
    KẾ_HOẠCH_COD: project.cod,
    DỰ_BÁO_COD: project.forecastCod || "",
    TIẾN_ĐỘ_KẾ_HOẠCH: project.planProgress,
    TIẾN_ĐỘ_THỰC_TẾ: project.actualProgress,
    DELAY: project.delay,
    TRẠNG_THÁI: project.status,
    RISK_LEVEL: project.risk,
    CẬP_NHẬT_CUỐI: project.updatedAt || new Date().toLocaleString(),
    _rowIndex: project._rowIndex
  };
}

/**
 * Generic fetch function for GET requests
 */
async function fetchFromGAS(action, params = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.append('action', action);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      method: 'GET',
    });
    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.message);
    }
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

  try {
    const response = await fetch(url.toString(), {
      redirect: 'follow',
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (result.status === 'error') {
      throw new Error(result.message);
    }
    return result;
  } catch (error) {
    console.error(`Error posting to ${action}:`, error);
    throw error;
  }
}

export const api = {
  // GET
  getProjects: async () => {
    const data = await fetchFromGAS('projects');
    return (data || []).map(normalizeProject);
  },
  getProject: async (id) => {
    const data = await fetchFromGAS('project', { id });
    return normalizeProject(data);
  },
  getDashboardBundle: async (id) => {
    const data = await fetchFromGAS('dashboard-bundle', { id });
    if (data && data.project) {
      data.project = normalizeProject(data.project);
    }
    return data;
  },
  getRisks: (id) => fetchFromGAS('risk', { id }),
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

  // POST (Updates)
  updateRisk: (data) => postToGAS('update-risk', data),
  updatePermit: (data) => postToGAS('update-permit', data),
  updateDesign: (data) => postToGAS('update-design', data),
  updateProcurement: (data) => postToGAS('update-procurement', data),
  updateConstruction: (data) => postToGAS('update-construction', data),
  updateHandover: (data) => postToGAS('update-handover', data),
  updateSiteLog: (data) => postToGAS('update-site-log', data),
  updateProject: (data) => postToGAS('update-project', mapProjectToSheet(data)),
  createProject: (data) => postToGAS('add-project', mapProjectToSheet(data)),
  addRisk: (data) => postToGAS('add-risk', data),
  addPermit: (data) => postToGAS('add-permit', data),
  addDesign: (data) => postToGAS('add-design', data),
  addProcurement: (data) => postToGAS('add-procurement', data)
};
