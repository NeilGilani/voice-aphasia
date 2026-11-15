import { useSyncExternalStore } from 'react';
import type { PersonContext } from '../contracts';
import { FRANK_CONTEXT } from './os/persona';

const KEY = 'voiceos.context.v2';
export const demoContext = FRANK_CONTEXT;

let current: PersonContext = (() => {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw) as PersonContext; } catch { /* ignore */ }
  return FRANK_CONTEXT;
})();
const subs = new Set<() => void>();

function set(next: PersonContext | ((p: PersonContext) => PersonContext)) {
  current = typeof next === 'function' ? next(current) : next;
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

/** One shared PersonContext for every screen (OS, story pages, vision). */
export function usePersonContext() {
  const ctx = useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current);
  return [ctx, set] as const;
}
