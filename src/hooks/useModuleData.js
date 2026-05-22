/**
 * useModuleData - Custom hook for module persistence with localStorage fallback
 *
 * Strategy:
 * 1. On mount: load from GAS (via initialData or fetch). If GAS returns data, use it and cache to localStorage.
 *    If GAS returns empty, fall back to localStorage.
 * 2. On update: optimistic local state update + save to localStorage immediately +
 *    attempt async GAS sync (best-effort, silently fails).
 */

import { useState, useEffect, useCallback } from 'react';

export function useModuleData({ storageKey, initialData, fetchFn, projectId }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data: GAS first, then localStorage fallback
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (initialData && initialData.length > 0) {
          // GAS returned data via bundle — use it and cache
          setData(initialData);
          localStorage.setItem(storageKey, JSON.stringify(initialData));
        } else {
          // GAS returned nothing — check localStorage
          const cached = localStorage.getItem(storageKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && parsed.length > 0) {
                setData(parsed);
                setIsLoading(false);
                return;
              }
            } catch (_) {}
          }
          // Neither GAS nor cache has data — try fetching directly
          if (fetchFn && (projectId)) {
            try {
              const fetched = await fetchFn(projectId);
              if (fetched && fetched.length > 0) {
                setData(fetched);
                localStorage.setItem(storageKey, JSON.stringify(fetched));
              } else {
                setData([]);
              }
            } catch (_) {
              setData([]);
            }
          } else {
            setData([]);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, projectId]);

  // Update a single item: update state + localStorage immediately
  const updateItem = useCallback((updatedItems) => {
    setData(updatedItems);
    localStorage.setItem(storageKey, JSON.stringify(updatedItems));
  }, [storageKey]);

  return { data, setData: updateItem, isLoading };
}
