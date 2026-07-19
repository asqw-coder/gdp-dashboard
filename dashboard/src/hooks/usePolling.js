// =============================================================================
// AlgoTradeAI Dashboard — usePolling Hook
// =============================================================================
// Generic polling hook. Calls the provided async function every `interval` ms.
// Returns { data, loading, error, lastUpdate, refresh }.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";

export function usePolling(fetchFn, intervalMs = 5000, immediate = true) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerRef = useRef(null);

  const fetch = useCallback(async () => {
    try {
      const result = await fetchFn();
      if (result !== null) {
        setData(result);
        setError(null);
        setLastUpdate(new Date());
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    if (immediate) fetch();
    timerRef.current = setInterval(fetch, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [fetch, intervalMs, immediate]);

  return { data, loading, error, lastUpdate, refresh: fetch };
}

// Convenience variant — polls multiple endpoints in parallel
export function useMultiPolling(fetchMap, intervalMs = 5000) {
  const [state, setState] = useState(
    Object.fromEntries(Object.keys(fetchMap).map(k => [k, null]))
  );
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      Object.entries(fetchMap).map(async ([key, fn]) => {
        const val = await fn();
        return [key, val];
      })
    );
    const next = { ...state };
    for (const r of results) {
      if (r.status === "fulfilled" && r.value[1] !== null) {
        next[r.value[0]] = r.value[1];
      }
    }
    setState(next);
    setLoading(false);
  }, []);  // eslint-disable-line

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, intervalMs);
    return () => clearInterval(id);
  }, [fetchAll, intervalMs]);

  return { state, loading };
}
