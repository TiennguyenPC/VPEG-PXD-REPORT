import { matchLineToTaskKey } from './siteLogTomorrowWork';

export const TABLE_DETAIL_SUFFIX = '(chi tiết theo bảng)';

export const MODULE_ANCHOR_IDS = {
  permit: 'module-permit',
  design: 'module-design',
  procurement: 'module-procurement',
  construction: 'module-construction',
  handover: 'module-handover',
  risk: 'module-risk',
};

const MODULES_WITH_TABLE_LINK = new Set(['permit', 'design', 'procurement', 'handover']);

export function stripTableDetailSuffix(label) {
  const text = String(label || '').trim();
  const suffix = TABLE_DETAIL_SUFFIX;
  if (text.endsWith(suffix)) {
    return text.slice(0, -suffix.length).trim();
  }
  return text.replace(/\s*\(chi tiết theo bảng\)\s*$/i, '').trim();
}

export function getTomorrowItemModuleKey(item) {
  if (!item) return null;

  if (item.key?.startsWith('module:')) {
    return item.key.replace(/^module:/, '');
  }

  if (item.key?.startsWith('procurement:')) {
    return 'procurement';
  }

  if (item.module && item.module !== 'construction' && MODULES_WITH_TABLE_LINK.has(item.module)) {
    return item.module;
  }

  const inferred = matchLineToTaskKey(item.label || '', []);
  if (inferred.startsWith('module:')) {
    return inferred.replace(/^module:/, '');
  }

  if (item.module === 'procurement') return 'procurement';

  const label = stripTableDetailSuffix(item.label || '');
  if (label && String(item.label || '').includes(TABLE_DETAIL_SUFFIX)) {
    return 'procurement';
  }

  return null;
}

export function shouldShowTableLink(item) {
  const moduleKey = getTomorrowItemModuleKey(item);
  return Boolean(moduleKey && MODULES_WITH_TABLE_LINK.has(moduleKey));
}

export function scrollToProjectModule(moduleKey) {
  const anchorId = MODULE_ANCHOR_IDS[moduleKey];
  if (!anchorId) return;

  window.dispatchEvent(new CustomEvent('open-project-module', { detail: { moduleKey } }));

  window.setTimeout(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('module-scroll-highlight');
    window.setTimeout(() => el.classList.remove('module-scroll-highlight'), 2200);
  }, 150);
}
