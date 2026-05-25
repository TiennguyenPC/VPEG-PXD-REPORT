import { lazy } from 'react';

const CHUNK_RELOAD_KEY = 'epc-chunk-reload';

export function isChunkLoadError(error) {
  const msg = String(error?.message || error || '');
  return (
    msg.includes('Failed to fetch dynamically imported module')
    || msg.includes('Importing a module script failed')
    || msg.includes('error loading dynamically imported module')
    || msg.includes('Loading chunk')
    || msg.includes('Loading CSS chunk')
  );
}

/** Lazy import with one automatic full reload when deploy invalidates old chunk hashes. */
export function lazyWithRetry(importFn) {
  return lazy(async () => {
    try {
      const mod = await importFn();
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
      return mod;
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });
}
