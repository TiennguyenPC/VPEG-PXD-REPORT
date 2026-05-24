/** Đồng bộ % tiến độ từ chi tiết dự án (localStorage) lên danh sách / tổng quan */
export function enrichProjectProgress(project) {
  if (!project) return project;

  const pId = project.id || project.PROJECT_ID;
  if (!pId) return project;

  const localActual = localStorage.getItem(`actualProgress_${pId}`);
  const localPlan = localStorage.getItem(`planProgress_${pId}`);

  let actualProgress = Number(project.actualProgress ?? project.TIẾN_ĐỘ_THỰC_TẾ ?? 0);
  let planProgress = Number(project.planProgress ?? project.TIẾN_ĐỘ_KẾ_HOẠCH ?? 0);
  let delay = Number(project.delay ?? project.DELAY ?? actualProgress - planProgress);

  if (localActual !== null && localActual !== '') {
    actualProgress = Number(localActual);
  }
  if (localPlan !== null && localPlan !== '') {
    planProgress = Number(localPlan);
  }
  if (localActual !== null && localPlan !== null) {
    delay = Number(localActual) - Number(localPlan);
  }

  return {
    ...project,
    actualProgress,
    planProgress,
    delay,
  };
}

export function enrichProjectsProgress(projects) {
  return (projects || []).map(enrichProjectProgress);
}

export function notifyProgressUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('epc-progress-updated'));
  }
}

/** Ghi tiến độ vào localStorage + cập nhật epc_projects_cache để Tổng quan hiện ngay */
export function syncProgressToProjectsCache(projectId, actual, plan) {
  if (!projectId) return;
  const actualNum = Number(actual) || 0;
  const planNum = Number(plan) || 0;
  localStorage.setItem(`actualProgress_${projectId}`, String(actualNum));
  localStorage.setItem(`planProgress_${projectId}`, String(planNum));
  try {
    const raw = localStorage.getItem('epc_projects_cache');
    if (raw) {
      const list = JSON.parse(raw).map((p) => {
        const pid = p.id || p.PROJECT_ID;
        if (String(pid) !== String(projectId)) return p;
        return {
          ...p,
          actualProgress: actualNum,
          planProgress: planNum,
          delay: actualNum - planNum,
          TIẾN_ĐỘ_THỰC_TẾ: actualNum,
          TIẾN_ĐỘ_KẾ_HOẠCH: planNum,
        };
      });
      localStorage.setItem('epc_projects_cache', JSON.stringify(list));
    }
  } catch {
    /* ignore quota / parse errors */
  }
  notifyProgressUpdated();
}
