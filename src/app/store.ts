import { useEffect, useState } from 'react';
import type { PersonContext } from '../contracts';

const KEY = 'voice.context.v1';

export const demoContext: PersonContext = {
  name: 'Walter',
  people: [
    { name: 'Ellie', relation: 'daughter', phone: '+15555550142', notes: 'Lives in Portland' },
    { name: 'Rosa', relation: 'wife' },
    { name: 'Dr. Patel', relation: 'speech therapist' },
  ],
  routines: [
    { time: '08:00', what: 'Morning pills' },
    { time: '15:00', what: 'Speech therapy' },
  ],
  history: [],
  facts: ["Ellie's birthday is November 15", 'Loves the Giants', 'Takes coffee black'],
};

export function usePersonContext() {
  const [ctx, setCtx] = useState<PersonContext>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw) as PersonContext;
    } catch { /* ignore */ }
    return demoContext;
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ctx)); } catch { /* ignore */ }
  }, [ctx]);
  return [ctx, setCtx] as const;
}
