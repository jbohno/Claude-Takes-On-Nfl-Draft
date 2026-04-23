import { useCallback, useEffect, useRef, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[useLocalStorage] failed to persist "${key}":`, err);
    }
  }, [key, value]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(key); } catch { /* noop */ }
    setValue(initial);
  }, [key, initial]);

  return [value, setValue, clear] as const;
}
