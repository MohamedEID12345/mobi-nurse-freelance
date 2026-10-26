'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errorMessage } from './api';

export function useApi<T>(path: string | null, opts: { poll?: number } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(path));
  const alive = useRef(true);

  const load = useCallback(async (quiet = false) => {
    if (!path) return;
    if (!quiet) setLoading(true);
    try {
      const d = await api<T>(path);
      if (alive.current) { setData(d); setError(null); }
    } catch (e) {
      if (alive.current && !quiet) setError(errorMessage(e));
    } finally {
      if (alive.current && !quiet) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    load();
    let t: ReturnType<typeof setInterval> | undefined;
    if (opts.poll) {
      t = setInterval(() => { if (document.visibilityState === 'visible') load(true); }, opts.poll);
    }
    return () => { alive.current = false; if (t) clearInterval(t); };
  }, [load, opts.poll]);

  return { data, error, loading, reload: () => load(true), setData };
}
